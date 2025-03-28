# Redis chart

A chart to provision a Redis instance

## Configuration

### Redis Options

| Parameter           | Description                         | Default |
| ------------------- | ----------------------------------- | ------- |
| `fullnameOverride ` | Instance Name if other than default | `redis` |
| `nameOverride `     | Instance Name if other than default | `redis` |
| `replicaCount`      | Replicas                            | `1`     |
| `repository`        | Image Source                        | `redis` |
| `tag`               | Image Tag                           | `7`     |
| `CPU Request`       | CPU Request Amount                  | `50`    |
| `Memory Request`    | Memory Requests Amount              | `50`    |




## Components
### OpenShift
- Service
- Deployment

### Notes
- Keep replicas set to 1, as more replicas can cause issues with the huey job queue
