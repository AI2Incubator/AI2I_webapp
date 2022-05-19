//// Certificate
import * as aws from "@pulumi/aws"

export const getCertificateValidation = (
  appDomain: string,
  domain: string
): aws.acm.CertificateValidation => {
  const certificate = new aws.acm.Certificate(`$certificate`, {
    domainName: appDomain,
    validationMethod: "DNS",
  })

  /**
   *  Create DNS records to prove that we _own_ the domains we're requesting a certificate for.
   *  See https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html for more info.
   */
  const hostedZoneId = aws.route53
    .getZone({ name: domain })
    .then((zone) => zone.zoneId)
  const route53ValidationRecords = certificate.domainValidationOptions.apply(
    (options) =>
      options.map(
        (option) =>
          new aws.route53.Record(`${option.resourceRecordName}-validation`, {
            name: option.resourceRecordName,
            zoneId: hostedZoneId,
            type: option.resourceRecordType,
            records: [option.resourceRecordValue],
            ttl: 60 * 10, // tenMinutes,
          })
      )
  )

  return new aws.acm.CertificateValidation("certificateValidation", {
    certificateArn: certificate.arn,
    validationRecordFqdns: route53ValidationRecords.apply((records) =>
      records.map((record) => record.fqdn)
    ),
  })
}
