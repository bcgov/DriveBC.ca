# Crunchy Postgres helm chart

This is based off: https://github.com/bcgov/crunchy-postgres/ with a number of changes including:
- Custom values yaml files for dev and test environments
- To allow migration scripts to run I created a superuser so I modified the original PostgresCluster.yaml file and changed the permission to SUPERUSER from CREATEROLE
- I added the required Role, RoleBinding and NetworkPolicy to allow the monitoring tool on the tools namespace to connect to the crunchydb instance if monitoring is set to enabled.

## Charts

### Crunchy Postgres chart

A chart to deploy a high availability Crunchy Postgres cluster


#### Values are located in the documentation here:

[Crunchy Postgres Documentation](charts/crunchy-postgres/README.md)

### Crunchy Postgres tools chart

A set of standard service accounts and networking templates that were needed to deploy a Crunchy Postgres cluster but are kept separate from the main Crunchy Postgres chart.

#### Values are located in the documentation here:

[Crunchy Postgres Tools Documentation](charts/crunchy-tools/README.md)

## Release Process (WIP)

1. Pull the repo down to your PC
2. Open CMD or Powershell and login to OC
3. Go to the project you want to install using 'oc project NAMESPACE' command
4. If a fresh install enter something like this depending on where the values.yaml file is located: 

      `helm install dbc-crunchy-postgres -f C:\Data\DriveBC.ca\infrastructure\charts\crunchy-postgres\values-ENVIRONMENT.yaml C:\Data\DriveBC.ca\infrastructure\charts\crunchy-postgres`

      `helm install dbc-crunchy-postgres-tools -f C:\Data\DriveBC.ca\infrastructure\charts\crunchy-tools\values.yaml C:\Data\DriveBC.ca\infrastructure\charts\crunchy-tools`

5. If you made modifications and you want to upgrade the helm chart in the environment, simply change 'install' to 'upgrade'
Now you have a functioning crunchydb instance running in your namespace. To get django working:
1. Django should automatically pull in the HOST URL, and PW from the secret that was created. 
4. Restart the django deployment to get it to run the migration scripts. 
5. If you want to quickly get the cameras and events on a fresh db, run  `python manage.py populate_webcams` and `python manage.py populate_events` in the terminal of the tasks pod

If you have a user with adequate permissions on the DB and you want to use something like pgadmin on your PC to view the DB you can run this in cmd or powershell `oc -n c59ecc-dev port-forward service/dev-drivebc-pgbouncer 15436:5432`

## Raw YAML files

An archive of the latest releases raw YAML files can be found in the [releases](https://github.com/bcgov/crunchy-postgres/releases) section. These are bundled together unlike the Helm charts which are released separately.

Alternatively you can save them with the [helm template](https://helm.sh/docs/helm/helm_template/) command:

`helm template --output-dir yaml charts/crunchy-postgres`

`helm template --output-dir yaml charts/crunchy-tools`

## Contact Info

[#crunchydb on Rocket.Chat](https://chat.developer.gov.bc.ca/channel/crunchydb)

## Vendor Info

[PGO, the Postgres Operator from Crunchy Data](https://access.crunchydata.com/documentation/postgres-operator/v5/)

## Future Work

- Create a helm chart to automatically deploy the monitoring stack to the tools namespace. For the time being I used this how to to deploy it: https://github.com/bcgov/how-to-workshops/tree/master/crunchydb/monitoring
  - You can go to the tools namespace and find the crunch-grafana route to see the current dashboards.
- If needed, we can add more users to the DB using something like this: https://github.com/bcgov/crunchy-postgres/pull/19/files