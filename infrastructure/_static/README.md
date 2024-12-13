# Static chart

A chart to provision a static frontend instance

## Configuration

### Static Options

| Parameter             | Description                         | Default                                |
| --------------------- | ----------------------------------- | -------------------------------------- |
| `fullnameOverride`    | Instance Name if other than default | `static`                               |
| `nameOverride`        | Instance Name if other than default | `static`                               |
| `replicaCount`        | Amount of replicas to run           | `1`                                    |
| `repository`          | Image Source                        | `ghcr.io/bcgov/drivebc-static`         |
| `tag`                 | Image Tag                           | `latest`                               |
| `CPU Request`         | CPU Request Amount                  | `50`                                   |
| `Memory Request`      | Memory Requests Amount              | `50`                                   |
| `staticConfigMap`     | Config Map for static               | `drivebc-static`                       |
| `route host`          | What hostname do you want           | `drivebc.apps.silver.devops.gov.bc.ca` |
| `iprestricted`        | Should it be IP Restricted?         | `false`                                |
| `ipallowlist`         | What IP's are allowed to connect?   |                                        |
| `podDisruptionBudget` |                                     |                                        |
| `enabled`             | Enable if more than one replica     | `false`                                |
| `minAvailable`        | How many pods must be available     | `1`                                    |


## Components
### OpenShift
- Service
- Route
- Deployment
- Pod Disruption Budget 
### Other
