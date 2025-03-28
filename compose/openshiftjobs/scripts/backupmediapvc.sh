#!/bin/bash

# Specify the folder path
folder_path="/app/media"

# Check if the folder exists
if [ ! -d "$folder_path" ]; then
    echo "Folder does not exist."
    exit 1
fi

# Get the current date in YYYY/MM/DD format in America/Vancouver timezone
current_date=$(TZ="America/Vancouver" date +"%Y/%m/%d")

# Get the folder name
folder_name=$(basename "$folder_path")

# Get the cluster name from the environment variable
cluster_name=${CLUSTER:-"default"} # Fallback to "default" if CLUSTER is not set

# Navigate to the folder
cd "$(dirname "$folder_path")" || exit

# Create a tarball with cluster name included
tarball_name="${folder_name}_${cluster_name}.tar.gz"
tar -czvf "/tmp/${tarball_name}" "$folder_name"

# Upload compressed file to S3
s3_path="s3://${AWS_BUCKET}/media/${current_date}/${tarball_name}"

# Upload the file to S3
if aws --endpoint-url "$AWS_ENDPOINT" s3 cp "/tmp/${tarball_name}" "$s3_path"; then
    echo "Compression and upload completed. Now deleting backup file"
    rm "/tmp/${tarball_name}"
    echo "Deleted backup file. Process Complete."
else
    echo "Upload failed. Deleting backup file."
    rm "/tmp/${tarball_name}"
    exit 1
fi