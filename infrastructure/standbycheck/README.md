# Standby Check Tool
The purpose of this chart is to deploy a simple application that 
- Gets deployed to both Gold and Gold DR that returns a 200 `server up` for the GSLB to check to confirm the cluster is up
- The instance on Gold will return a 200 by default, but if
    - If GoldDR CrunchyDB is Primary then it will return a 503 so that the GSLB doesn't automatically send traffic back to Gold after the DB was failed over
    - If GoldDR CrunchyDB is Primary and Shutdown it will return a 200 so that the load balancer starts sending traffic back to Gold as we can assume we are failing back to Gold

To accomplish this we set this up:
- Deployment in both clusters
    - Gold will do the validation
    - GoldDR will always return a 200
- Service and Route (IP restricted) for traffic to reach the `/lbhealth/` path
- Secret in Gold for users to enter:
    - `NAMESPACE`
    - `SERVICEACCOUNT_TOKEN`
    - `STANDBY_OCP_API_SERVER`
    - `STANDBY_POSTGRESCLUSTER_NAME`
- In Gold DR we need a mechanism for the Gold cluster to check the status of the Postgres Cluster object so we setup these additional components:
    - Service Account
    - Role
    - Role Binding
    - Service Account Secret

To address limitations of the pipeline service account we use for deployments, once the Service Account related components are installed using `helm install`, they will never be updated during a `helm upgrade`.

## Initial Deployment
You will need to create the appropriate Values file for your environment, setting things like name, etc.

Once you are ready to deploy for the first time to an environment follow these steps using your own account that has admin access to the namespace:
1. Login to OC for Gold
1. Navigate to the `infrastructure` folder
1. Run `helm install ENV-drivebc-standbycheck -f ./standbycheck/values-ENV.yaml ./standbycheck`
1. Login to OC for GoldDR
1. Run `helm install ENV-drivebc-standbycheck -f ./standbycheck/values-ENV.yaml -f ./standbycheck/values-ENV-dr.yaml ./standbycheck`
1. Go to OpenShift Gold and do the following:
    1. Go to Secrets
    1. Find `ENV-drivebc-standbycheck`
    1. Actions -> Edit Secret
    1. Fill in the 
        - `NAMESPACE`: One you set this up in. Include the -dev, -test or -prod
        - `SERVICEACCOUNT_TOKEN`: This token can be found in the GoldDR cluster by going to Secrets, ENV-drivebc-standbycheck, and copying the token field from there.
        - `STANDBY_OCP_API_SERVER`: The GoldDR API Server which you can see when you get your own token
        - `STANDBY_POSTGRESCLUSTER_NAME`: The name of the postgres cluster object in Gold DR
    1. Go to Deployments and find `ENV-drivebc-standbycheck`
    1. Click the vertical ... and select `Restart Rollout` so that the new secrets get consumed
    1. Look at the logs of one of the pods to confirm it can connect to GoldDR
    1. You can check the route on both clusters to confirm it's returning a `server up` message.

## Upgrades
Occasionally you may need to update the image with minor changes or security patches. Typically this will be hanlded through the Github Action, but if you want to do it locally you can run these commands.
I suggest you add the sha of the image you want to use since the default image is latest, but since the imagePullPolicy is set to `IfNotPresent` you may not get an old image.

Gold: 
`helm ugprade ENV-drivebc-standbycheck -f ./standbycheck/values-ENV.yaml ./standbycheck --set image.tag=<ENTER SHA>`

Gold DR:
`helm upgrade ENV-drivebc-standbycheck -f ./standbycheck/values-ENV.yaml -f ./standbycheck/values-ENV-dr.yaml ./standbycheck --set image.tag=sha-<ENTER SHA>`

## Delete
Simply follow these steps:
1. Login to the correct project
1. `helm list` to confirm your helm release is there
1. `helm uninstall ENV-drivebc-standbycheck`
1. On GoldDR also run these
    ```
    oc delete rolebinding ENV-drivebc-standbycheck
    oc delete role ENV-drivebc-standbycheck
    oc delete serviceaccount ENV-drivebc-standbycheck
    oc delete secret ENV-drivebc-standbycheck
    ```
1. On Gold run this command `oc delete secret ENV-drivebc-standbycheck`

We need to delete those components manually because Github actions is using an OpenShift service account that doesn't have permissions on all those objects so we had to set a few to be generated on initial install but not touched on upgrades.