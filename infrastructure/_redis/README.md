# Redis chart

A chart to provision a Django instance

## Configuration

### Redis Options

| Parameter          | Description                        | Default                 |
| ------------------ | ---------------------------------- | ------------------      |
| `fullnameOverride `| Instance Name if other than default| `django`                |
| `CPU Request`      | CPU Request Amount                 | `50`                    |
| `CPU Limit`        | CPU Limit Amount                   | `150`                   |
| `Memory Request`   | Memory Requests Amount             | `64`                    |
| `Memory Limit`     | Memory Limit Amount                | `128`                   |
| `Replicas`         | Replicas                           | `1`                     |
| `Namespace`        | To support the image registry      |                         |



## Components
### OpenShift
- ImageStream
- Service
- Deployment

### Other
- Need to make sure we add the correct labels
