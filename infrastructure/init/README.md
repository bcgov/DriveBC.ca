# Environment Initialization

A chart to provision a brand new environment and should be used before any other components are setup. The goal of this helm chart it to setup the empty config maps and secrets so the environment is ready for the remaining components.

IMPORTANT: IF YOU DO A HELM UPGRADE WITH THIS CHART IT WILL BLANK OUT THE EXISTING DATA. DO NOT RE-INSTALL THIS HELM CHART. YOU CAN UNINSTALL AND INSTALL A NEW ONE IF YOU NEED, BUT ALL VALUES WILL NEED TO BE FILLED IN MANUALLY IN OPENSHIFT

## Configuration

### tasks Options

| Parameter          | Description                        | Default                 |
| ------------------ | ---------------------------------- | ------------------      |
| `fullnameOverride `| Instance Name if other than default| ``                      |



## Components
### OpenShift
- Secret
    - Django
    - Static
- ConfigMap
    - Django
    - Static

### Other
We can add a `keep` resource-policy to prevent helm from removing these files through upgrades and installs, but then these resources can become orphaned.