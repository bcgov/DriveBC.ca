# Django Chart

A chart to provision a Django instance 

## Configuration

### Django Options

| Parameter             | Description                         | Default                                |
| --------------------- | ----------------------------------- | -------------------------------------- |
| `fullnameOverride`    | Instance Name if other than default | `django`                               |
| `nameOverride`        | Instance Name if other than default | `django`                               |
| `replicaCount`        | Amount of replicas to run           | `1`                                    |
| `repository`          | Image Source                        | `ghcr.io/bcgov/drivebc-django`         |
| `tag`                 | Image Tag                           | `latest`                               |
| `CPU Request`         | CPU Request Amount                  | `50`                                   |
| `Memory Request`      | Memory Requests Amount              | `250`                                  |
| `postgresSecret`      | The pguser secret name              | `drivebc-pguser-drivebc`               |
| `djangoConfigMap`     | The name of the Django Config Map   | `drivebc-django`                       |
| `djangoSecret`        | The name of the Django Secret       | `drivebc-django`                       |
| `route host`          | What hostname do you want           | `drivebc.apps.silver.devops.gov.bc.ca` |
| `iprestricted`        | Should it be IP Restricted?         | `false`                                |
| `ipallowlist`         | What IP's are allowed to connect?   |                                        |
| `port`                | What port for the pvc?              | `3000`                                 |
| `storage`             | Size of storage you need            | `1Gi`                                  |
| `podDisruptionBudget` |                                     |                                        |
| `enabled`             | Enable if more than one replica     | `false`                                |
| `minAvailable`        | How many pods must be available     | `1`                                    |



## Components
### OpenShift
- PVC 
- Service 
- Route 
- Deployment
- Pod Disruption Budget


