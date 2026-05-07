# Syncthing

This HELM chart creates an instance of Syncthing in Gold and GoldDR, however it does require some manual setup once the components are in place.

## Initial Install
The Helm chart will install required components listed below and then guide you through the setup
- Deployment 
- Network Policy
- PVC
- Service
- TransportClaim (Only installed on Gold)
- Service Account (for the oAuth Proxy)

### Helm Install
1. Navigate to the infrastructure folder in your CLI
1. Login to oc for Gold
1. `helm install ENV-drivebc-syncthing -f ./syncthing/values-ENV.yaml ./syncthing`
1. Login to oc for GoldDR
1. `helm install ENV-drivebc-syncthing -f ./syncthing/values-ENV.yaml -f ./syncthing/values-ENV-dr.yaml ./syncthing`
1. Everything is now installed and you should be able to go to the routes.

### Connecting the Syncthing Instances
Once you have installed the HELM chart, follow these steps:
1. Open the Route on both Gold and GoldDR
1. You should be prompted to login using the oAuth Proxy (if you have access to the namespace, you will have access to this)
1. Click `No` for `Allow Anonymous Usage Reporting?`
1. Click `OK` for `GUI Authentication: Set User and Password`
1. In both
    1. Click `Actions`
    1. Click `Settings`
    1. Device Name:
        1. In Gold set to: `ENV-drivebc-gold` (ie dev-drivebc-gold)
        1. In GoldDR set to: `ENV-drivebc-golddr`
    1. Go to `Connections` Tab 
        1. Uncheck `Enable NAT traversal`, `Global Discovery`, `Local Discovery` and `Relaying Enabled`
    1. Save
1. In both
    1. Click `Actions`
    1. Click `Advanced`
    1. Under GUI, Check `Insecure Admin Access` (We put the GUI behind the oAuth Proxy instead of using local credentials)
    1. Under Options, uncheck `Announce LAN Addresses`, `Auto Upgrade Interval (hours)` (Set to 0) `Crash Reporting Enabled`.
    1. Save

1. In Gold
    1. Click `Add Remote Device` under Remote Devices
    1. Paste the ID from `GoldDR`
    1. Name: `ENV-drivebc-golddr`
    1. Advanced Tab
        1. In your CLI for Gold
            1. Run `oc get endpoints`
            1. It should return a name of `ENV-drivebc-syncthing-golddr` for which you will need to note the IP and Port
        1. In the `Addresses` field, enter the IP and port from above in: `tcp://<IP>:<PORT>` format (ie tcp://142.34.64.62:1516)
        1. Save
1. In GoldDR
    1. You should see a `New Request` come through so click `Add Device` on that message
    1. Name: `ENV-drivebc-gold` (may be prefilled)
    1. Advanced Tab
        1. In your CLI for Gold
            1. Run `oc get endpoints`
            1. It should return a name of `ENV-drivebc-syncthing-gold` for which you will need to note the IP and Port
        1. In the `Addresses` field, enter the IP and port from above in: `tcp://<IP>:<PORT>` format (ie tcp://142.34.64.62:1516)
        1. Save
1. Both should now show `Connected` under Remote Devices

### Syncing the Folders
Now we can setup the syncing of folders:
1. In Gold
    1. Click `Add Folder`
        1. Folder Label: `CMS Media`
        1. Folder Path: `/app/media`
        1. Sharing Tab:
            1. Select `ENV-drivebc-golddr`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
            1. Check `Ignore Permissions`
        1. Save
    1. Add Folder
        1. Folder Label: `Webcam Images`
        1. Folder Path: `/app/images/webcams`
        1. Sharing Tab:
            1. Select `ENV-drivebc-golddr`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
            1. Check `Ignore Permissions`
        1. Save
1. In GoldDR
    1. Click Add on the `New Folder` request for CMS Media:
        1. Set Folder path `/app/media`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
            1. Check `Ignore Permissions`
        1. Save
    1. Click Add on the second request for Webcam Images
        1. Set folder path: `/app/images/webcams`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
            1. Check `Ignore Permissions`
        1. Save
1. In Both we need to adjust a few settings to improve performance:
    1. Click `Actions` (top right)
    1. Click `Advanced`
    1. Click `Folders`
    1. Select `Folder "Webcam Images"`
        1. Check `Case Sensitive FS`
        1. Set `Copy Range Method` to `all`


## Upgrades
From time to time you may need to change things like the Syncthing Version, oAuthProxy version, resources, PVC size, etc. 

To do this you can do it via Github actions ideally, or locally as well.
If you run it via Github Actions
1. Run the `syncthing.yaml` file in Github (Called `Syncthing - Deploy Updated Syncthing Helm Chart to OpenShift`). 
1. Select the Branch branch where the updated helm charts are (if not in main yet) 
1. Select which environment you want to deploy too
1. Select `Gold`, `GoldDR` or `Both` for the cluster you want to deploy to.
1. Run the workflow and monitor in OpenShift


Alternativiely you can do it locally, but you need to be more careful that you run the command on the correct openshift cluster:
- Gold: `helm upgrade ENV-drivebc-syncthing -f ./syncthing/values-ENV.yaml ./syncthing`
- GoldDR: `helm upgrade ENV-drivebc-syncthing -f ./syncthing/values-ENV.yaml -f ./syncthing/values-ENV-dr.yaml ./syncthing`


## Sysdig
Syncthing exports various metrics using prometheus which can be viewed in Sysdig. This allows you to setup dashboards and alerts.

