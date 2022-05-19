## Starter webapp with easy deployment to AWS ECS

- A Python/Flask HTTP backend service. It contains a simple `GET` API that returns
  a random number between 0 and 100.
- A TypeScript/ReactJS web frontend. It's created with
  `npx create-react-app web --template typescript` command.
- Easy deployment to AWS ECS using Pulumi.
  Automatically set up Route53 and certificates needed to use a custom domain/subdomain.
- Continuous deployment via GitHub Actions.

### Prerequisites

- Docker and Docker Compose
- NodeJS. We recommend using `nvm`.

### Getting Started

Start the backend service (API) in docker:

```shell
docker-compose up --build
```

Start the web app:

```shell
cd web
npm install
npm start
```

Now, open the webapp: `http://localhost:3000.`

### Manual Deployment to AWS ECS

Make sure you have Pulumi install and make the changes in the config file [`Pulumi.dev.yaml,`](./deploy/Pulumi.dev.yaml)
in particular change the domain name.

```
cd deploy
pulumi up -s dev
```

### Continuous Deployment with GitHub Actions

Deployment is automatically kicked off when there's a push to `main.`
See [this config file](./.github/workflows/push.yml).
