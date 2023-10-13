# DriveBC Image Caching

## Background
The caching mechanism is a very simple nginx instance that has proxy caching setup. It is set to cache both the webcam and ReplayTheDay folders from the DriveBC API server that is set from the django configmap DRIVEBC_IMAGE_API_BASE_URL field. 


## Testing 

To use test the cache you simply need to:
- Ensure you have the correct DRIVEBC_IMAGE_API_BASE_URL set
    - If you are having issues, you can view the logs as this is set using the entrypoint file during pod startup
- In OpenShift you would go to Networking -> Routes to find the URL for the Service
    - NOTE: All the OpenShift configuration is stored in a separate Helm Chart and not part of this image
- You can now validate the proxy & caching works by appending something like`/webcam/api/v1/webcams/2/imageDisplay` to the URL
- You should now see an image that got proxied from the source
- To see if it was a HIT, MISS or STALE image from the cache you can go into DevTools, Network and Refresh. the X-Proxy-Cache should show you the status.

## Deployment Workflow

We have one workflow that can be pointed at any environment to keep it simple for now. Each environment in GitHub will require a CACHING_IMAGE_NAME variable set so that we can handle multiple instances running in one OpenShift namespace.
