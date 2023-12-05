# DriveBC Infrastructure

The new DriveBC site has a number of components that work together to serve the website. This infrastructure folder contains all the components required to build the infrastructure to support the site. Following the steps in the Deployments Steps section should quickly setup your environment from scratch.

Here are the components that are in this folder:
- Init
  - Sets up the Secrets and ConfigMaps prior to building the other components
- CrunchDB Postgres
  - Based off: https://github.com/bcgov/crunchy-postgres/ with a few changes to support our environment.
- Django
- Tasks
- Redis
- Static
- Image Caching

## Deployment Steps
### New Environment
Follow these steps to setup a brand new environment.
1. Download the Drivebc.ca repository to your PC
1. Navigate to the infrastructure folder in command line
1. Login to OpenShift using the command line oc utility
1. Select the project you would like to deploy to using `oc project NAMESPACE`
1. `helm install ENV-drivebc-init -f .\init\values-ENV.yaml .\init`
    1. NOTE: Do not install this again as it will overwrite all values. May need to find a better way to handle this in the future.
1. Set the values in the `ENV-drivebc-django` ConfigMap and Secret (In the future `ENV-drivebc-static` ConfigMap and Secret too)
1. `helm install ENV-drivebc-crunchy-postgres -f .\crunchy-postgres\values-ENV.yaml .\crunchy-postgres`
1. `helm install ENV-drivebc -f .\main\values-ENV.yaml .\main`
1. Now that all components are installed you need to go to GitHub actions and run `Build & Deploy Image Caching Image` & `Deploy main to ENV` and then all the pods should start-up. If any issues confirm the configmaps are updated.
1. If you want to quickly get the cameras and events on a fresh db, run  `python manage.py populate_webcams` and `python manage.py populate_events` in the terminal of the tasks pod

### Upgrades

If you made changes to any of the values in the helm charts you should update the dependencies and then (see below) and then instead of doing a `helm install` do a `helm upgrade`

## Other

### Dependency Updates
If one of the underlying HELM charts gets updated you may need to run a dependency update which will update the Chart.lock file
1. Navigate to the main folder in command line
2. Run `helm dependency update`

### Dry Run
If you want to confirm the install or upgrade will work, you can do a dry run without making the actual changes in your environment. Just swap install with upgrade as needed
1. `helm install --dry-run ENV-drivebc-crunchy-postgres -f .\crunchy-postgres\values-ENV.yaml .\crunchy-postgres`
1. `helm install --dry-run ENV-drivebc -f .\main\values-ENV.yaml .\main`

### Template (YAML) Extract
If you want to see what the YAML files that HELM will generate look like prior to the install/upgrade you can run the following commands:

1. `helm template --output-dir yaml ENV-drivebc-crunchy-postgres -f .\crunchy-postgres\values-ENV.yaml .\crunchy-postgres`
1. `helm template --output-dir yaml ENV-drivebc -f .\main\values-ENV.yaml .\main`

### Uninstall
If you need to uninstall the Helm Charts follow these steps:
1. `helm uninstall ENV-drivebc`
1. `helm uninstall ENV-drivebc-crunchy-postgres`
1. `helm uninstall ENV-drivebc-init`



# to-do
- Build a Make file to speed up this process even more
- Once we know what versioning looks like, integrate that change. Will probably need to use another repo such as GitHub, Artifactory, or imagestream on Tools namespace
- Build a HELM chart for Postgres Monitoring
- Add liveness checks to the pods
