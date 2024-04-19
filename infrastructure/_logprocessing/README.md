# Log Processing Chart

This chart to provision a OpenShift CronJob to process log files from nginx. 

## Configuration

### Log Processing Options

| Parameter          | Description                         | Default                                |
| ------------------ | ----------------------------------- | -------------------------------------- |
| `fullnameOverride` | Instance Name if other than default | `logprocessing`                        |
| `nameOverride`     | Instance Name if other than default | `logprocessing`                        |
| `repository`       | Image Source                        | `ghcr.io/bcgov/drivebc-logprocessing`  |
| `tag`              | Image Tag                           | `latest`                               |
| `CPU Request`      | CPU Request Amount                  | `50`                                   |
| `CPU Limit`        | CPU Limit Amount                    | `2000`                                 |
| `Memory Request`   | Memory Requests Amount              | `1Gi`                                  |
| `Memory Limit`     | Memory Limit Amount                 | `2Gi`                                  |
| `s3Secret`         | Secret for static                   | `drivebc-logprocessing`                |


## Components
### OpenShift
- Cronjob 

### Other
- Ensure you have a Secret with the S3 Values
