# DriveBC Infrastructure

The new DriveBC site has a number of components that work together to serve the website. This infrastructure folder contains all the components required to build the infrastructure to support the site. Following the steps in the Deployments Steps section should quickly setup your namespace from scratch.

Here are the components that are in this folder:
- Init
  - Creates the blank Secrets and ConfigMaps prior to building the other components
- CrunchyDB Postgres
  - Based off: https://github.com/bcgov/crunchy-postgres/ with a few changes to support our environment.
- Django
- Tasks
- Redis
- Static
- Image Caching

## Deployment Steps
### New Environment
Follow these steps to setup a brand new environment.
1. Clone the Drivebc.ca repository to your PC
1. Navigate to the infrastructure folder in the command line
1. Login to OpenShift using the command line oc utility
1. Select the project you would like to deploy to using `oc project NAMESPACE`
1. `helm install ENV-drivebc-init -f .\init\values-ENV.yaml .\init`
    1. NOTE: Do not install this again as it will overwrite all values.
1. Set the values in the `ENV-drivebc-django` & `ENV-drivebc-static` ConfigMap and Secrets (they both have ) as well as the `ENV-drivebc-image-caching` ConfigMap too.
1. `helm install ENV-drivebc-crunchy-postgres -f .\crunchy-postgres\values-ENV.yaml .\crunchy-postgres` to install CrunchyDB. NOTE: Check the values files to confirm the namespace is correct for monitoring.
1. Once the datbase is running go to the terminal of the primary replica and go to `psql`, then enter `ALTER DATABASE "ENV-drivebc" OWNER TO "ENV-drivebc";`
1. `helm install ENV-drivebc -f .\main\values-ENV.yaml .\main` to install the entire environment. 
1. If you want to quickly get the cameras and events on a fresh db, login to the tasks pod and go to terminal where you will run these commands  `python manage.py populate_webcams` and `python manage.py populate_events` and `python manage.py populate_ferries`

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