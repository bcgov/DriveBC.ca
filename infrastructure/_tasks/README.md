# Django Chart

A chart to provision a tasks which is an instance of django that runs Huey to run a number of scheduled tasks

## Configuration

### Django Options

| Parameter           | Description                         | Default                        |
| ------------------- | ----------------------------------- | ------------------------------ |
| `fullnameOverride ` | Instance Name if other than default | `django`                       |
| `nameOverride `     | Instance Name if other than default | `django`                       |
| `replicaCount`      | Amount of replicas to run           | `1`                            |
| `repository`        | Image Source                        | `ghcr.io/bcgov/drivebc-django` |
| `tag`               | Image Tag                           | `latest`                       |
| `CPU Request`       | CPU Request Amount                  | `75`                           |
| `Memory Request`    | Memory Requests Amount              | `150`                          |
| `postgresSecret`    | The pguser secret name              | `drivebc-pguser-drivebc`       |
| `djangoConfigMap`   | The name of the Django Config Map   | `drivebc-django`               |
| `djangoSecret`      | The name of the Django Secret       | `drivebc-django`               |


## Components
### OpenShift
- Deployment

### Notes
- It is recommend to only run one replica of tasks since they can't communicate with each other currently, and redis is also ephemeral at this time. 
