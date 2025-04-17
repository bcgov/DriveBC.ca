# DriveBC Infrastructure

## Components
DriveBC.ca has a number of components that make up the site
- Django backend (django)
    - Deployment
    - HPA
    - Network Policies
    - Pod disruption budget
    - PVCs
    - Routes
    - Services
- Django Huey Tasks (tasks)
    - Deployment
- Nginx frontend (static)
    - Deployment
    - HPA
    - Network Policies
    - Pod disruption budget
    - PVCs
    - Routes
    - Services
- Redis (redis)
    - Deployment
    - Service
- Cronjobs to backup logs, etc (openshiftjobs)
    - Cronjobs

## Initial Install
#### Prerequisites:
- CrunchyDB already configured
- Vault values set:
    - Look at the env.example file to see what you may need for each of these:
    - ENV-django
    - ENV-static
    - ENV-openshiftjobs

#### Gold
1. Login to oc for the environment
1. Confirm your project and cluster by running `oc project`
1. Navigate to the infrastructure folder in your CLI
1. `helm install ENV-drivebc -f ./main/values-ENV.yaml ./main`
1. Confirm the site is working as expected

#### Gold DR
To setup site in Gold ensure the DB is running there in Standby and:
1. `oc project` to confirm you are in GOLD DR on the correct project
1. `helm install ENV-drivebc -f ./main/values-ENV.yaml -f ./main/values-ENV-dr.yaml ./main`
1. Validate the site is working as expected

#### Other tasks:
- Install any certificates for the vanityURL's as per [Interal Confluence Page](https://moti-imb.atlassian.net/wiki/spaces/DBC22/pages/102511068/Requesting+and+adding+an+SSL+Certificate+to+a+Route)
- Setup Syncthing to sync CMS and Webcam Images [Syncthing Readme](/infrastructure/syncthing/README.md)
- Configure GSLB (if required)
- Configure StandbyCheck (if required)

## Upgrades
Once the site is setup the Github actions should be able to handle most helm upgrades, but if you want to do do one manually (ie for testing) it's very similar to initial setup
1. `oc project` to confirm the project and cluster
1. `helm list` if you want to confirm the project is there already
1. GOLD `helm upgrade ENV-drivebc -f ./main/values-ENV.yaml ./main`
1. GOLDDR: `helm upgrade ENV-drivebc -f ./main/values-ENV.yaml -f ./main/values-ENV-dr.yaml ./main`
    - NOTE: If you want to set a specific tag instead of the default, you can add `--set django.image.tag=TAG` (doing same for static, tasks, redis, openshiftjobs)