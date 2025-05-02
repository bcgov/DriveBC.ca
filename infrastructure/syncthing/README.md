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
    1. Click `Advanced`
    1. Under GUI, Check `Insecure Admin Access` (We put the GUI behind the oAuth Proxy instead of using local credentials)
    1. Under Options, uncheck `Announce LAN Addresses` and `Crash Reporting Enabled`
    1. Save
1. In both
    1. Click `Actions`
    1. Click `Settings`
    1. Device Name:
        1. In Gold set to: `ENV-drivebc-gold` (ie dev-drivebc-gold)
        1. In GoldDR set to: `ENV-drivebc-golddr`
    1. Go to `Connections` Tab 
        1. Uncheck `Enable NAT traversal`, `Global Discovery`, `Local Discovery` and `Enable Relaying`
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
        1. Save
    1. Add Folder
        1. Folder Label: `Webcam Images`
        1. Folder Path: `/app/images/webcams`
        1. Sharing Tab:
            1. Select `ENV-drivebc-golddr`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
        1. Save
1. In GoldDR
    1. Click Add on the `New Folder` request for CMS Media:
        1. Set Folder path `/app/media`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
        1. Save
    1. Click Add on the second request for Webcam Images
        1. Set folder path: `/app/images/webcams`
        1. Advanced Tab:
            1. Uncheck `Watch for Changes`
        1. Save
1. All set! The folders should be syncing


## Upgrades
From time to time you may need to change things like the Syncthing Version, oAuthProxy version, resources, PVC size, etc. 
In that case, update the values file for your environment and run
- Gold: `helm upgrade ENV-drivebc-syncthing -f ./syncthing/values-ENV.yaml ./syncthing`
- GoldDR: `helm upgrade ENV-drivebc-syncthing -f ./syncthing/values-ENV.yaml -f ./syncthing/values-ENV-dr.yaml ./syncthing`


## Sysdig
Syncthing exports various metrics using prometheus which can be viewed in Sysdig. This allows you to setup dashboards and alerts.

