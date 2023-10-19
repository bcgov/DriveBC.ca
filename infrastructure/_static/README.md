# Static chart

A chart to provision a static nginix instance

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
- Service (aka frontend)
- Route (to frontend)
- Deployment

### Other
