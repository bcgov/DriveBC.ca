# Django chart

A chart to provision a Django instance 

## Configuration

### Django Options

| Parameter          | Description                        | Default                 |
| ------------------ | ---------------------------------- | ------------------      |
| `fullnameOverride `| Instance Name if other than default| ``                |
| `djangoImage`      | Image Source (if not imageStream)  |                         |
| `CPU Request`      | CPU Request Amount                 | `50`                    |
| `CPU Limit`        | CPU Limit Amount                   | `250`                   |
| `Memory Request`   | Memory Requests Amount             | `128`                   |
| `Memory Limit`     | Memory Limit Amount                | `256`                   |
| `Replicas`         | Replicas                           | `1`                     |
| `Postgres Secret`  | The pguser secret name             |                         |
| `Django Config Map`| The name of the Django Config Map  |                         |
| `Namespace`        | To support the image registry      |                         |
| `PVC Size`         | What size should the PVC be        | `1Gi`                   |
| `Host`             | What hostname do you want          |                         |

## Components
### OpenShift
- ImageStream 
- PVC 
- Service 
- Route 
- Deployment

### Other
