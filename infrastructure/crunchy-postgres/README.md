# CrunchyDB Postgres

This chart was based on https://github.com/bcgov/quickstart-openshift/tree/main/charts/crunchy with a number of changes to help support Active-Standby failover scenarios in the BC Gov Gold/GoldDR OpenShift environment.

Features include
- Automatic Backup to PVC and S3
- Ability to setup a Standby Cluster for DR
- Already includes the yaml to easily do a manual backup
- Ability to set a custom password for the default user which is important if you have two clusters with an application reading the standby cluster in read-only mode
- Exporter and Prometheus setup so you can view database stats and setup alerts in Sysdig
- Separate PVC for WAL logs to reduce risk of disk space exhaustion on the main PVC which can lead to data corruption
- Tail the Postgres logs so that errors are sent to stderr in the fluent-bit container so they can be easily viewed in OpenShift or SIEM

## Initial Install
The initial setup needs to be done from your local machine. Subsequent updates can be done either via Github actions (recommended as you really don't want to accidentally push your GoldDR config to Gold and vice versa)

Assumptions:
- Using Powershell
- Admin access to the OpenShift cluster
- Your folder structure is `C:\Data\DriveBC.ca` and you have the latest version of repo copied to that location (You can use a different location if you like)

1. Login to `oc` 
1. Confirm you are in the correct namespace and cluster by entering `oc project`
1. Run `cd C:\Data\DriveBC.ca\`
1. Confirm the values file has all values set as you like. Then fill in any of these values below as required:
1.        helm install ENV-drivebc-db \
          -f ./infrastructure/crunchy-postgres/values-ENV.yaml \
          ./infrastructure/crunchy-postgres \
          --set crunchy.pgBackRest.s3.bucket="${{ secrets.CRUNCHY_S3_BUCKET }}" \
          --set crunchy.pgBackRest.s3.endpoint="${{ secrets.CRUNCHY_S3_ENDPOINT }}" \
          --set crunchy.pgBackRest.s3.accessKey="${{ secrets.CRUNCHY_S3_ACCESS_KEY }}" \
          --set crunchy.pgBackRest.s3.secretKey="${{ secrets.CRUNCHY_S3_SECRET_KEY }}" \
          --set crunchy.user.password="${{ secrets.CRUNCHY_USER_PASSWORD }}" \
          --set backup-storage.env.S3_BUCKET.value="${{ secrets.CRUNCHY_S3_BACKUP_STORAGE_BUCKET }}" \
          --set backup-storage.env.S3_ENDPOINT.value="${{ secrets.CRUNCHY_S3_ENDPOINT }}" \
          --set backup-storage.env.S3_USER.value="${{ secrets.CRUNCHY_S3_ACCESS_KEY }}" \
          --set backup-storage.env.S3_PASSWORD.value="${{ secrets.CRUNCHY_S3_SECRET_KEY }}"
1. Confirm everything has installed as expected
1. Run these commands to set DB owner in the primary pod like this
    1. `oc exec -it $(oc get pods -l "postgres-operator.crunchydata.com/role=master" -o jsonpath='{.items[0].metadata.name}') -- /bin/bash`
    1. `psql`
    1.  `ALTER DATABASE "ENV-drivebc-db" OWNER TO "ENV-drivebc-db";`
    1. Type in `exit` and then `exit` again to get back to Powershell

If you are setting up Crunchy in Active-Standby configuration you will also need to do these steps:
1. Trigger a manual backup on the cluster in Gold using this command `oc annotate -n NAMESPACE postgrescluster ENV-drivebc-db-crunchy --overwrite postgres-operator.crunchydata.com/pgbackrest-backup="$(date)"` and wait for the backup to complete
1. Login to the GoldDR cluster using `oc`
1. Run `helm install ENV-drivebc-db -f .\crunchy-postgres\values-ENV-gold.yaml -f .\crunchy-postgres\values-ENV-golddr.yaml .\crunchy-postgres`
1. Take the exact same helm upgrade command you used earlier, but add the DR values file `-f ./infrastructure/crunchy-postgres/values-ENV-dr.yaml` and `--set crunchy.standby.enabled=true`

        helm upgrade ENV-drivebc-db \
          -f ./infrastructure/crunchy-postgres/values-ENV.yaml \
          -f ./infrastructure/crunchy-postgres/values-ENV-dr.yaml \
          ./infrastructure/crunchy-postgres \
          --set crunchy.pgBackRest.s3.bucket="${{ secrets.CRUNCHY_S3_BUCKET }}" \
          --set crunchy.pgBackRest.s3.endpoint="${{ secrets.CRUNCHY_S3_ENDPOINT }}" \
          --set crunchy.pgBackRest.s3.accessKey="${{ secrets.CRUNCHY_S3_ACCESS_KEY }}" \
          --set crunchy.pgBackRest.s3.secretKey="${{ secrets.CRUNCHY_S3_SECRET_KEY }}" \
          --set crunchy.standby.enabled=true \
          --set crunchy.user.password="${{ secrets.CRUNCHY_USER_PASSWORD }}" \
          --set backup-storage.env.S3_BUCKET.value="${{ secrets.CRUNCHY_S3_BACKUP_STORAGE_BUCKET }}" \
          --set backup-storage.env.S3_ENDPOINT.value="${{ secrets.CRUNCHY_S3_ENDPOINT }}" \
          --set backup-storage.env.S3_USER.value="${{ secrets.CRUNCHY_S3_ACCESS_KEY }}" \
          --set backup-storage.env.S3_PASSWORD.value="${{ secrets.CRUNCHY_S3_SECRET_KEY }}"

Due to how the clusters are setup, you will need to update the password for `ccp_monitoring` for the Standby cluster based on this documentation: https://access.crunchydata.com/documentation/postgres-operator/latest/tutorials/backups-disaster-recovery/disaster-recovery#monitoring-a-standby-cluster
Here are the steps: https://access.crunchydata.com/documentation/postgres-operator/latest/guides/exporter-configuration#setting-a-custom-ccp_monitoring-password
Essentially:
1. Go to the Primary Cluster
1. Go to `secrets` and get the password from `ENV-drivebc-db-crunchy-monitoring`
1. On the Standby Cluster, run `oc edit secret ENV-drivebc-db-crunchy-monitoring` on the Standby Cluster (or just go there via the UI)
1. Remove the current data section and add:
```
stringData:
  password: <PASSWORD FROM PRIMARY CLUSTER>
```
1. Close the file which should automatically save

## Changes after initial install
Changes can be made easily once the Crunchy Cluster is already installed. To ensure consistency and ensure you are always on the correct cluster (Gold vs GoldDR) it is recommended you use the `crunchy.yaml` Github actions to do any changes to the cluster.

To be able to run that workflow, ensure you have these secrets set for each environment in Github Actions:
- CRUNCHY_S3_BACKUP_STORAGE_BUCKET (Should look like BUCKETNAME/db_backups)
- CRUNCHY_S3_BUCKET
- CRUNCHY_S3_ENDPOINT
- CRUNCHY_S3_ACCESS_KEY
- CRUNCHY_S3_SECRET_KEY
- CRUNCHY_USER_PASSWORD
- OPENSHIFT_GOLD_TOKEN
- OPENSHIFT_GOLDDR_TOKEN

Environment Variables:
- OPENSHIFT_GOLD_SERVER
- OPENSHIFT_GOLDDR_SERVER
- OPENSHIFT_NAMESPACE


# Failovers
At a high level this is how the failover works:
1. Have an active-standby configuration setup
1. Shutdown Cluster A
    - If you can't access Cluster A, that is ok, but note these scenarios
        1. If Cluster A tries to startup again after an Openshift issue, the DB pods will not start anymore
        1. If Cluster A lost network connectivity so the pods stayed running, it will look like you can still read/write to the DB, however these changes are **not** being saved and will be list.
1. In Cluster B set `standby: false` to make it the primary.
To switch back:
1. Delete Cluster A
1. Rebuild Cluster A as a Standby
1. Shutdown Cluster B gracefully
1. Set Cluster A `standby: false`
1. Rebuild Cluster B as a Standby

This is all done via Github Actions to ensure that this process is as reliable and consistent as possible, especially during critical times such as when you need to do a failover.

To use the Github action make sure that you have these environment variables setup in Github for each environment as noted in an earlier step

There is further documentation in Confluence for the complete failover process.


# BC Gov Backup Container
This helm chart implements the BC Gov Backup Container: [backup-container](https://github.com/bcgov/backup-container)
For usage, please see the documentation, but at a high level it does a PG_DUMP of the DB and saves it to s3 & PVC for however long you have the retention set.


# Monitoring
Since Prometheus and the Exporter are setup you can monitor and get alerting through Sysdig. Sysdig has a number of built in dashboards and alerts you can use.


