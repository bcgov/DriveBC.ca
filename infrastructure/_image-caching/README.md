# Image Caching Chart

A chart to provision an nginx image caching instance

## Configuration

### Image Caching Options

| Parameter               | Description                         | Default                                |
| ----------------------- | ----------------------------------- | -------------------------------------- |
| `fullnameOverride`      | Instance Name if other than default | `image-caching`                        |
| `nameOverride`          | Instance Name if other than default | `image-caching`                        |
| `replicaCount`          | Amount of replicas to run           | `1`                                    |
| `repository`            | Image Source                        | `ghcr.io/bcgov/drivebc-image-caching`  |
| `tag`                   | Image Tag                           | `latest`                               |
| `CPU Request`           | CPU Request Amount                  | `50`                                   |
| `CPU Limit`             | CPU Limit Amount                    | `250`                                  |
| `Memory Request`        | Memory Requests Amount              | `50`                                   |
| `Memory Limit`          | Memory Limit Amount                 | `100`                                  |
| `imagecachingConfigMap` | Config Map for Image caching        | `drivebc-image-caching`                |
| `route host`            | What hostname do you want           | `drivebc.apps.silver.devops.gov.bc.ca` |
| `iprestricted`          | Should it be IP Restricted?         | `false`                                |
| `ipallowlist`           | What IP's are allowed to connect?   |                                        |


## Components
### OpenShift
- Service
- Route 
- Deployment
