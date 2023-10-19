# Static chart

A chart to provision an nginx image caching instance

## Configuration

### Static Options

| Parameter          | Description                        | Default                 |
| ------------------ | ---------------------------------- | ------------------      |
| `fullnameOverride `| Instance Name if other than default|                         |
| `CPU Request`      | CPU Request Amount                 | `50`                    |
| `CPU Limit`        | CPU Limit Amount                   | `150`                   |
| `Memory Request`   | Memory Requests Amount             | `64`                    |
| `Memory Limit`     | Memory Limit Amount                | `128`                   |
| `Replicas`         | Replicas                           | `2`                     |
| `Namespace`        | To support the image registry      |                         |


## Components
### OpenShift
- ImageStream
- Service
- Route 
- Deployment

### Other
- When deploying via helm the name should match what is in the GitHub Repo under CACHING_IMAGE_NAME for that enironment
