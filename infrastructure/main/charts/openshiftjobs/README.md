# OpenShift Jobs Chart

This chart to provision a OpenShift CronJob to process logs from NGINX and backup files from the django media PVC 

## Configuration

### Log Processing Options

| Parameter          | Description                                 | Default                               |
| ------------------ | ------------------------------------------- | ------------------------------------- |
| `fullnameOverride` | Instance Name if other than default         | `openshiftjobs`                       |
| `nameOverride`     | Instance Name if other than default         | `openshiftjobs`                       |
| `repository`       | Image Source                                | `ghcr.io/bcgov/drivebc-openshiftjobs` |
| `tag`              | Image Tag                                   | `latest`                              |
| `cronjobs`         |                                             |                                       |
| `name`             | Specific name for the cronjob               |                                       |
| `CPU Request`      | CPU Request Amount                          |                                       |
| `Memory Request`   | Memory Requests Amount                      |                                       |
| `s3Secret`         | Secret used to store S3 details for the job |                                       |
| `volumes`          | Used to store the name of the shared volume |                                       |


## Components
### OpenShift
- Analyze and Upload Logs Cronjob
- Backup Media PVC Cronjob
- Zip Logs Cronjobs

### Other
- Ensure you have the secret with the S3 Values
