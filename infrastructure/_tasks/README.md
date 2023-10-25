# tasks chart

A chart to provision a Django instance

## Configuration

### tasks Options

| Parameter          | Description                        | Default                 |
| ------------------ | ---------------------------------- | ------------------      |
| `fullnameOverride `| Instance Name if other than default| `django`                |
| `djangoImage`      | Image Source (if not imageStream)  |                         |
| `CPU Request`      | CPU Request Amount                 | `50`                    |
| `CPU Limit`        | CPU Limit Amount                   | `250`                   |
| `Memory Request`   | Memory Requests Amount             | `128`                   |
| `Memory Limit`     | Memory Limit Amount                | `256`                   |
| `Replicas`         | Replicas                           | `1`                     |
| `Postgres Secret`  | The pguser secret name             | `drivebc-pguser-drivebc`|
| `Django Config Map`| The name of the Django Config Map  |                         |
| `Namespace`        | To support the image registry      |                         |



## Components
### OpenShift
- ImageStream (Uses the Django Image)
- Deployment

### Other
- Need to make sure we add the correct labels
- See if we can automatically make the config map. Prob want to make it blank in initial deploy (can set settings in OpenShift itself). 