# Crunchy Postgres chart

A chart to provision a [Crunchy Postgres](https://www.crunchydata.com/) cluster.

## Configuration

### Crunchy Options

| Parameter          | Description            | Default            |
| ------------------ | ---------------------- | ------------------ |
| `fullnameOverride` | Override release name  | `crunchy-postgres` |
| `crunchyImage`     | Crunchy Postgres image |                    |
| `postgresVersion`  | Postgres version       | `14`               |

---

###w Instances

| Parameter                                   | Description                    | Default                  |
| ------------------------------------------- | ------------------------------ | ------------------------ |
| `instances.name`                            | Instance name                  | `ha` (high availability) |
| `instances.replicas`                        | Number of replicas             | `2`                      |
| `instances.dataVolumeClaimSpec.storage`     | Amount of storage for each PVC | `480Mi`                  |
| `instances.requests.cpu`                    | CPU requests                   | `1m`                     |
| `instances.requests.memory`                 | Memory requests                | `256Mi`                  |
| `instances.replicaCertCopy.requests.cpu`    | replicaCertCopy CPU requests   | `1m`                     |
| `instances.replicaCertCopy.requests.memory` | replicaCertCopyMemory requests | `32Mi`                   |


---

### pgBackRest - Reliable PostgreSQL Backup & Restore

[pgBackRest site](https://pgbackrest.org/)
[Crunchy pgBackRest docs](https://access.crunchydata.com/documentation/pgbackrest/latest/)

| Parameter                                            | Description                                                   | Default                |
| ---------------------------------------------------- | ------------------------------------------------------------- | ---------------------- |
| `pgBackRest.image`                                   | Crunchy pgBackRest                                            |                        |
| `pgBackRest.retention`                               | Number of backups/days to keep depending on retentionFullType | `2`                    |
| `pgBackRest.retentionFullType`                       | Either 'count' or 'time'                                      | `count`                |
| `pgBackRest.repos.schedules.full`                    | Full backup schedule                                          | `0 8 * * *`            |
| `pgBackRest.repos.schedules.incremental`             | Incremental backup schedule                                   | `0 0,4,12,16,20 * * *` |
| `pgBackRest.repos.schedules.volume.addessModes`      | Access modes                                                  | `ReadWriteOnce`        |
| `pgBackRest.repos.schedules.volume.storage`          | Access modes                                                  | `64Mi`                 |
| `pgBackRest.repos.schedules.volume.storageClassName` | Storage class name modes                                      | `netapp-file-backup`   |
| `instances.requests.cpu`                             | CPU requests                                                  | `1m`                   |
| `pgBackRest.repoHost.requests.memory`                | Memory requests                                               | `256Mi`                |
| `pgBackRest.sidecars.requests.cpu`                   | sidecars CPU requests                                         | `1m`                   |
| `pgBackRest.sidecars.requests.memory`                | sidecars Memory requests                                      | `32Mi`                 |

---

### Patroni

[Patroni docs](https://patroni.readthedocs.io/en/latest/)
[Crunchy Patroni docs](https://access.crunchydata.com/documentation/patroni/latest/)

| Parameter                                   | Description                                                         | Default                           |
| ------------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| `patroni.postgresql.pg_hba`                 | pg_hba permissions                                                  | `"host all all 0.0.0.0/0 md5"`    |
| `crunchyImage`                              | Crunchy Postgres image                                              | `...crunchy-postgres:ubi8-14.7-0` |
| `patroni.parameters.shared_buffers`         | The number of shared memory buffers used by the server              | `16MB`                            |
| `patroni.parameters.wal_buffers`            | The number of disk-page buffers in shared memory for WAL            | `64KB`                            |
| `patroni.parameters.min_wal_size`           | The minimum size to shrink the WAL to                               | `32MB`                            |
| `patroni.parameters.max_wal_size`           | Sets the WAL size that triggers a checkpoint                        | `64MB`                            |
| `patroni.parameters.max_slot_wal_keep_size` | Sets the maximum WAL size that can be reserved by replication slots | `128MB`                           |

---

### pgBouncer

A lightweight connection pooler for PostgreSQL

[pgBouncer site](https://www.pgbouncer.org/)
[Crunchy Postgres pgBouncer docs](https://access.crunchydata.com/documentation/pgbouncer/latest/)

| Parameter                         | Description             | Default |
| --------------------------------- | ----------------------- | ------- |
| `proxy.pgBouncer.image`           | Crunchy pgBouncer image |         |
| `proxy.pgBouncer.replicas`        | Number of replicas      | `2`     |
| `proxy.pgBouncer.requests.cpu`    | CPU requests            | `1m`    |
| `proxy.pgBouncer.requests.memory` | Memory requests         | `64Mi`  |

---

## PG Monitor

[Crunchy Postgres PG Monitor docs](https://access.crunchydata.com/documentation/pgmonitor/latest/)

| Parameter              | Description                                    | Default |
| ---------------------- | ---------------------------------------------- | ------- |
| `pgmonitor.enabled`    | Enable PG Monitor (currently only PG exporter) | `false` |
| `pgmonitor.namespace`  | Namespace app is being deployed in             | ``      |

#### Postgres Exporter

A [Prometheus](https://prometheus.io/) exporter for PostgreSQL

[Postgres Exporter](https://github.com/prometheus-community/postgres_exporter)

| Parameter                            | Description               | Default |
| ------------------------------------ | ------------------------- | ------- |
| `pgmonitor.exporter.image`           | Crunchy PG Exporter image |         |
| `pgmonitor.exporter.requests.cpu`    | CPU requests              | `1m`    |
| `pgmonitor.exporter.requests.memory` | Memory requests           | `64Mi`  |

---
