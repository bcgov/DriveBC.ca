# Variables. DO NOT SAVE TO GITHUB
$BUCKET = ""
$ENDPOINT = ""
$ACCESS_KEY = ""
$SECRET_KEY = ""
$PASSWORD = ""
$ENV = "dev"

# Function to check the OpenShift cluster
function Test-OnGoldCluster {
    $ocProjectOutput = oc project 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error executing oc project: $ocProjectOutput"
        exit 1
    }

    if ($ocProjectOutput -notmatch 'https://api.gold.devops.gov.bc.ca') {
        Write-Error "Error: Not on Gold cluster"
        exit 1
    }
}

function Test-OnGoldDRCluster {
    $ocProjectOutput = oc project 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error executing oc project: $ocProjectOutput"
        exit 1
    }

    if ($ocProjectOutput -notmatch 'https://api.golddr.devops.gov.bc.ca') {
        Write-Error "Error: Not on GoldDR cluster"
        exit 1
    }
}

# Step 0: Get variables for this file from current postgrescluster object
function Get-Variables {
    $clusterName = $ENV + "-drivebc-db-crunchy"
    $postgresCluster = oc get postgrescluster $clusterName -o json | ConvertFrom-Json
    # Access the S3 endpoint and S3 bucket
    $s3Bucket = $postgresCluster.spec.backups.pgbackrest.repos[1].s3.bucket
    $s3Endpoint = $postgresCluster.spec.backups.pgbackrest.repos[1].s3.endpoint

    # Get the user secret in JSON format
    $secret = oc get secret $clusterName-pguser-$ENV-drivebc-db -o json | ConvertFrom-Json
    # Access the 'password' field
    $base64Password = $secret.data.password
    # Decode the password from base64
    $password = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($base64Password))

    # Get the s3 secret in JSON format
    $secret = oc get secret $ENV-drivebc-db-s3-secret -o json | ConvertFrom-Json
    # Access the 'password' field
    $base64s3conf = $secret.data."s3.conf"
    # Decode the password from base64
    $s3conf = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($base64s3conf))

    # Display the decoded password
    Write-Host "Use this information to update the variables at the top of this file before running the next steps." -ForegroundColor Cyan
    Write-Host "User Password: $password"
    Write-Host "S3 Secret info: $s3conf"

    # Display the values
    Write-Host "S3 Bucket: $s3Bucket"
    Write-Host "S3 Endpoint: $s3Endpoint"
}

# Step 1: Shutdown the DB in Gold (if cluster is available).
function Disable-GoldDB {
    Test-OnGoldCluster

    helm upgrade "$ENV-drivebc-db" -f "./values-$ENV.yaml" "./" `
        --set crunchy.pgBackRest.s3.bucket="$BUCKET" `
        --set crunchy.pgBackRest.s3.endpoint="$ENDPOINT" `
        --set crunchy.shutdown=true
}

# Step 2: Set Gold DR as the Primary DB
function Set-GoldDRPrimary {
    Test-OnGoldDRCluster
    helm upgrade "$ENV-drivebc-db" -f "./values-$ENV.yaml" -f "./values-$ENV-dr.yaml" "./" `
        --set crunchy.pgBackRest.s3.bucket="$BUCKET" `
        --set crunchy.pgBackRest.s3.endpoint="$ENDPOINT" `
        --set crunchy.standby.enabled=false
}

# Step 3: Delete Gold DB so that we can rebuild it. 
function Remove-GoldDB {
    Test-OnGoldCluster
    # Ask user for confirmation before proceeding
    $confirmation = Read-Host "Are you sure you want to uninstall $ENV-drivebc-db in Gold? (Y/N)"
    
    if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
        helm uninstall "$ENV-drivebc-db"
        Write-Host "$ENV-drivebc-db has been uninstalled."
    } else {
        Write-Host "Uninstallation of $ENV-drivebc-db canceled."
    }
}

# Step 4: Rebuild Gold DB as a Standby
function Restore-GoldStandby {
    Test-OnGoldCluster
    helm install "$ENV-drivebc-db" -f "./values-$ENV.yaml" "./" `
        --set crunchy.pgBackRest.s3.bucket="$BUCKET" `
        --set crunchy.pgBackRest.s3.endpoint="$ENDPOINT" `
        --set crunchy.pgBackRest.s3.accessKey="$ACCESS_KEY" `
        --set crunchy.pgBackRest.s3.secretKey="$SECRET_KEY" `
        --set crunchy.user.password="$PASSWORD" `
        --set crunchy.standby.enabled=true
}

# Step 5: Shutdown the DB in Gold DR to prepare for making Gold Primary again
function Disable-GoldDRDB {
    Test-OnGoldDRCluster
    helm upgrade "$ENV-drivebc-db" -f "./values-$ENV.yaml" -f "./values-$ENV-dr.yaml" "./" `
        --set crunchy.pgBackRest.s3.bucket="$BUCKET" `
        --set crunchy.pgBackRest.s3.endpoint="$ENDPOINT" `
        --set crunchy.standby.enabled=false `
        --set crunchy.shutdown=true
}

# Step 6: Set Gold as the Primary DB
function Set-GoldPrimary {
    Test-OnGoldCluster
    helm upgrade "$ENV-drivebc-db" -f "./values-$ENV.yaml" "./" `
        --set crunchy.pgBackRest.s3.bucket="$BUCKET" `
        --set crunchy.pgBackRest.s3.endpoint="$ENDPOINT" `
        --set crunchy.standby.enabled=false
}

# Step 7: Delete Gold DR DB to prepare for making it a Standby again
function Remove-GoldDRDB {
    # Test if Gold DR Cluster exists
    Test-OnGoldDRCluster
    
    # Ask user for confirmation before proceeding
    $confirmation = Read-Host "Are you sure you want to uninstall $ENV-drivebc-db in GoldDR? (Y/N)"
    
    if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
        helm uninstall "$ENV-drivebc-db"
        Write-Host "$ENV-drivebc-db has been uninstalled."
    } else {
        Write-Host "Uninstallation of $ENV-drivebc-db canceled."
    }
}

# Step 8: Rebuild Gold DR as a Standby
function Restore-GoldDRStandby {
    Test-OnGoldDRCluster
    helm install "$ENV-drivebc-db" -f "./values-$ENV.yaml" -f "./values-$ENV-dr.yaml" "./" `
        --set crunchy.pgBackRest.s3.bucket="$BUCKET" `
        --set crunchy.pgBackRest.s3.endpoint="$ENDPOINT" `
        --set crunchy.pgBackRest.s3.accessKey="$ACCESS_KEY" `
        --set crunchy.pgBackRest.s3.secretKey="$SECRET_KEY" `
        --set crunchy.user.password="$PASSWORD"
}

# Step 9: Update Monitoring Password
function Update-GoldDRMonitoringPassword {
    Test-OnGoldDRCluster
    Write-Host "Enter the new monitoring password in the notepad file that will open. Save and close the file when done."
    Write-Host "To do this, replace the word data with stringData, remove the verifier line and copy the password from the secret with the same name in Gold"
    oc edit secret $ENV-drivebc-db-crunchy-monitoring
}

# Prompt user for step
Write-Host "This script will perform a failover of the CrunchyDB database if you follow these steps in order." -ForegroundColor Cyan
Write-Host "You must be on the correct cluster to perform each step. Please ensure you are logged into the correct cluster prior to proceding. Enter 0 to exit." -ForegroundColor Red
Write-Host "Current Project: " -NoNewline -ForegroundColor Red
oc project
Write-Host "Choose a step to run:"
Write-Host "0. Get variables for this file from current postgrescluster object (Make sure ENV is set though)"
Write-Host "1. Shutdown Gold DB (Must be on Gold Cluster)"
Write-Host "2. Set Gold DR Primary (Must be on Gold DR Cluster)"
Write-Host "3. Delete Gold DB (Must be on Gold Cluster)"
Write-Host "4. Rebuild Gold Standby (Must be on Gold Cluster)"
Write-Host "5. Shutdown Gold DR DB (Must be on Gold DR Cluster)"
Write-Host "6. Set Gold Primary (Must be on Gold Cluster)"
Write-Host "7. Delete Gold DR DB (Must be on Gold DR Cluster)"
Write-Host "8. Rebuild Gold DR Standby (Must be on Gold DR Cluster)"
Write-Host "9. Set Monitoring Password (Must be on Gold DR Cluster)"
Write-Host "Enter the step number: " -NoNewline
$step = Read-Host

# Run selected step(s)
switch ($step) {
    "00" { Test-OnGoldCluster }
    "01" { Test-OnGoldDRCluster }
    "0" { Get-Variables }
    "1" { Disable-GoldDB }
    "2" { Set-GoldDRPrimary }
    "3" { Remove-GoldDB }
    "4" { Restore-GoldStandby }
    "5" { Disable-GoldDRDB }
    "6" { Set-GoldPrimary }
    "7" { Remove-GoldDRDB }
    "8" { Restore-GoldDRStandby }
    "9" { Update-GoldDRMonitoringPassword }
    default { Write-Host "Invalid step number." }
}