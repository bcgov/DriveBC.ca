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

## Deployment Steps
### New Environment
Follow these steps to setup a brand new environment.
1. Clone the Drivebc.ca repository to your PC
1. Navigate to the infrastructure folder in your CLI
1. Login to OpenShift using oc CLI
1. Select the namespace you would like to deploy to using `oc project NAMESPACE`
1. Set the values in the `ENV-drivebc-django` & `ENV-drivebc-static` ConfigMap and Secrets (they both have )
1. Run `helm install ENV-drivebc-crunchy-postgres -f .\crunchy-postgres\values-ENV.yaml .\crunchy-postgres --set pgBackRest.s3.key=<KEY> --set pgBackRest.s3.bucket=<BUCKET> --set pgBackRest.s3.endpoint=<ENDPOINT> --set pgBackRest.s3.keySecret=<SECRET-KEY>` to install CrunchyDB. 
1. Once the database is running go to the terminal of the primary replica and enter `psql`, then enter `ALTER DATABASE "ENV-drivebc" OWNER TO "ENV-drivebc";`
1. Run `helm install ENV-drivebc -f .\main\values-ENV.yaml .\main` to install the entire environment. 
1. If you want to quickly get the cameras and events on a fresh db, login to the tasks pod and go to terminal where you will run these commands  `python manage.py populate_webcams` and `python manage.py populate_events` and `python manage.py populate_ferries`

### Upgrades

If you made changes to any of the values for the DriveBC helm charts you should update the dependencies and then (see below) and then instead of doing a `helm install` do a `helm upgrade`

If you need to upgrade the database (ie updating resources, etc) you will need to run the following command from within the infrastructure folder `helm upgrade ENV-drivebc-crunchy-postgres -f .\crunchy-postgres\values-ENV.yaml .\crunchy-postgres --set pgBackRest.s3.bucket=<BUCKET> --set pgBackRest.s3.endpoint=<ENDPOINT>`

## Other


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