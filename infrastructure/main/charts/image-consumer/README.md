# Django Chart

A chart to provision an image-consumer pod which is an instance of django that runs a service to ingestion images from RabbitMQ

## Configuration

### Django Options




## Components
### OpenShift
- Deployment

### Notes
- It is recommend to only run one replica of tasks since they can't communicate with each other currently, and redis is also ephemeral at this time. 
