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

# Navigate to the folder
cd "$(dirname "$folder_path")" || exit

# Compress the entire folder using tar
tar -czvf "/tmp/${folder_name}.tar.gz" "$folder_name"

# Upload compressed file to S3
s3_path="s3://${AWS_BUCKET}/media/${current_date}/${folder_name}.tar.gz"

# Upload the file to S3
if aws --endpoint-url "$AWS_ENDPOINT" s3 cp "/tmp/${folder_name}.tar.gz" "$s3_path"; then
    echo "Compression and upload completed. Now deleting backup file"
    rm "/tmp/${folder_name}.tar.gz"
    echo "Deleted backup file. Process Complete."
else
    echo "Upload failed. Deleting backup file."
    rm "/tmp/${folder_name}.tar.gz"
    exit 1
fi
