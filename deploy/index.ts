import * as awsx from "@pulumi/awsx"
import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import { getCertificateValidation } from "./certificate"

const config = new pulumi.Config()
const APP = config.require("name")
const API_PORT = config.requireNumber("apiPort")
const DOMAIN = config.require("domain")
const SUB_DOMAIN = config.require("subDomain")
const APP_DOMAIN = `${SUB_DOMAIN}.${DOMAIN}`

//// Create a VPC and a security group for isolation
const vpc = new awsx.ec2.Vpc(`${APP}-vpc`, {})
export const vpcId = vpc.id

const sg = new awsx.ec2.SecurityGroup(`${APP}-sg`, { vpc: vpc })
sg.createIngressRule("api", {
  protocol: "tcp",
  fromPort: API_PORT,
  toPort: API_PORT,
  cidrBlocks: ["0.0.0.0/0"],
})

// Open egress traffic to your load balancer (for health checks).
sg.createEgressRule("healthcheck", {
  protocol: "-1",
  fromPort: 0,
  toPort: 0,
  cidrBlocks: ["0.0.0.0/0"],
})

export const securityGroupId = sg.id

//// Within the created VPC, create a new ALB and an ECS cluster
const alb = new awsx.lb.ApplicationLoadBalancer(`${APP}-alb`, {
  vpc: vpc,
  securityGroups: [sg],
})

const httpListener = alb.createListener(`${APP}-http-listener`, {
  port: 80,
  protocol: "HTTP",
  defaultAction: {
    type: "redirect",
    redirect: {
      protocol: "HTTPS",
      port: "443",
      statusCode: "HTTP_301",
    },
  },
})

const cluster = new awsx.ecs.Cluster(`${APP}-cluster`, {
  vpc: vpc,
  securityGroups: [sg],
})

//// Define two target groups: one for the web (frontend), one for the Python API.
const targetGroupArgs = (
  port: number,
  healthCheckPath: string
): awsx.lb.ApplicationTargetGroupArgs => {
  return {
    vpc: vpc,
    protocol: "HTTP",
    port: port,
    healthCheck: { path: healthCheckPath },
  }
}

const webTargetGroup = alb.createTargetGroup(
  `${APP}-web-tg`,
  targetGroupArgs(80, "/")
)
const apiTargetGroup = alb.createTargetGroup(
  `${APP}-api-tg`,
  targetGroupArgs(API_PORT, "/api/ping")
)

const httpsListener = alb.createListener(`${APP}-https-listener`, {
  vpc: vpc,
  protocol: "HTTPS",
  certificateArn: getCertificateValidation(APP_DOMAIN, DOMAIN).certificateArn,
  port: 443,
  targetGroup: webTargetGroup,
})

httpsListener.addListenerRule(`${APP}-api-rule`, {
  conditions: [{ pathPattern: { values: ["/api*"] } }],
  actions: [
    {
      targetGroupArn: apiTargetGroup.targetGroup.arn,
      type: "forward",
    },
  ],
})

//// Route53 record aliasing to ALB
const _ = new aws.route53.Record(APP_DOMAIN, {
  name: SUB_DOMAIN,
  zoneId: aws.route53.getZone({ name: DOMAIN }).then((zone) => zone.zoneId),
  type: "A",
  aliases: [
    {
      name: alb.loadBalancer.dnsName,
      zoneId: alb.loadBalancer.zoneId,
      evaluateTargetHealth: true,
    },
  ],
})

//// Web task definition & service
const webRepo = new awsx.ecr.Repository(`${APP}-web-repo`)
const webImage = webRepo.buildAndPushImage({
  context: "../web",
  args: {
    REACT_APP_API_HOSTNAME: APP_DOMAIN,
  },
  extraOptions: ["--platform", "linux/amd64"],
})

const webTaskDefinition = new awsx.ecs.FargateTaskDefinition(`${APP}-web-td`, {
  container: {
    image: webImage,
    memoryReservation: 300,
    portMappings: [webTargetGroup],
  },
  logGroup: new aws.cloudwatch.LogGroup(`${APP}-web-log`),
})

const webService = new awsx.ecs.FargateService(`${APP}-web-service`, {
  cluster,
  taskDefinition: webTaskDefinition,
  desiredCount: 1,
})

//// API task definition & service
const apiRepo = new awsx.ecr.Repository(`${APP}-api-repo`)
const apiImage = apiRepo.buildAndPushImage({
  context: "../api",
  extraOptions: ["--platform", "linux/amd64"],
})

const apiTaskDefinition = new awsx.ecs.FargateTaskDefinition(`${APP}-api-td`, {
  container: {
    image: apiImage,
    memoryReservation: 300,
    portMappings: [apiTargetGroup],
  },
  logGroup: new aws.cloudwatch.LogGroup(`${APP}-api-log`),
})

const apiService = new awsx.ecs.FargateService(`${APP}-api-service`, {
  cluster,
  taskDefinition: apiTaskDefinition,
  desiredCount: 1,
})
