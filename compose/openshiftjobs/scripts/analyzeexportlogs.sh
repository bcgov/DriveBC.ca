#!/bin/bash

# Directory where the logs are stored
log_dir="/logs"
cd $log_dir || { echo "Failed to change directory to $log_dir. Exiting..."; exit 1; }

# Initialize an empty array
zipped_files=()

# Get the number of days ago as a positional parameter
days_ago="$1"

# If no argument is provided, default to 1 day ago
if [ -z "$days_ago" ]; then
    days_ago=1
fi

# Get the start and end time for $days_ago days ago in the America/Vancouver timezone
start_time=$(TZ=America/Vancouver date -d "$days_ago days ago 00:00")
end_time=$(TZ=America/Vancouver date -d "$days_ago days ago 23:59")

# Convert the start and end time to UTC
start_time_utc=$(date -u -d "$start_time" +%Y%m%d%H)
end_time_utc=$(date -u -d "$end_time" +%Y%m%d%H)

echo "Will analyze and archive logs between $start_time_utc and $end_time_utc"

# Loop through all files in the current directory ending with ".gz"
for file in *.gz; do
    # Check if the file exists and is a regular file
    if [[ -f $file ]]; then
        # Extract the date and time part from the filename (assuming UTC timezone)
        file_datetime_utc=$(echo "$file" | sed -n 's/.*\([0-9]\{10\}\)-access\.log\.gz/\1/p')
        # Check if the file date and time in UTC falls within days_ago's start and end time in UTC
        if [[ $file_datetime_utc -ge $start_time_utc && $file_datetime_utc -le $end_time_utc ]]; then
            zipped_files+=("$file")
        fi
    fi
done

# Print the elements of the array
echo "Log files that will be processed:"
printf '%s\n' "${zipped_files[@]}"

# Get the start dates formatted for the goaccess report name
start_time_formatted=$(date -d "$start_time" +%Y%m%d)

# Run the following command only if zipped_files array is not empty
if [ ${#zipped_files[@]} -gt 0 ]; then
    # Define file URL and destination directory to pull down the latest geoip data
    FILE_URL="https://download.db-ip.com/free/dbip-city-lite-$(date -u +'%Y-%m').mmdb.gz"
    OLD_FILE="dbip-city-lite-$(date -d 'last month' +'%Y-%m').mmdb"

    # Check if the file exists
    if [ ! -f "dbip-city-lite-$(date -u +'%Y-%m').mmdb" ]; then
        # If the file doesn't exist, download it
        echo "Downloading file..."
        if wget -q --spider "$FILE_URL"; then
            wget "$FILE_URL" -P "$log_dir"
            echo "Download complete."
            gzip -d "dbip-city-lite-$(date -u +'%Y-%m').mmdb.gz"
            # Delete the old file if it exists
            if [ -f "$OLD_FILE" ]; then
                echo "Deleting old file ($OLD_FILE)..."
                rm "$OLD_FILE"
                echo "Old file deleted."
            fi
        else
            echo "Failed to download file. URL is unreachable."
        fi
    else
        echo "MMDB file already exists."
    fi
    mmdb_file=$(find . -maxdepth 1 -type f -name "*.mmdb")

    #Run goaccess on all the log files from the date entered
    goaccess_report_name="${CLUSTER}_${start_time_formatted}-goaccess_report.html"
    zcat "${zipped_files[@]}" | grep -v '^-\s' | goaccess - -o "$goaccess_report_name" --log-format='~h{, } %e %^[%x] "%v" "%r" %s %b "%R" "%u" %C "%M" %T' --datetime-format='%d/%b/%Y:%H:%M:%S %z' --ignore-panel=REMOTE_USER --ignore-panel=ASN --tz=America/Vancouver --jobs=2 --geoip-database=$mmdb_file
    echo "GoAccess report generated successfully at $goaccess_report_name"

    # Get the start date formated in YYYY/MM/DD format
    start_time_formatted_s3=$(date -d "$start_time" +"%Y/%m/%d")

    # Create folder structure in S3 bucket
    s3_path="s3://$AWS_BUCKET/logs/$start_time_formatted_s3/$CLUSTER/"

    # Upload zipped files to S3
    for file in "${zipped_files[@]}"; do
        aws --endpoint-url "$AWS_ENDPOINT" s3 cp "$file" "$s3_path" || { echo "Failed to upload $file to S3. Exiting..."; exit 1; }
        echo "File $file copied to S3 bucket under $s3_path"
    done

    echo "All files copied to S3 bucket under $s3_path"


    # Upload HTML report to S3
    aws --endpoint-url $AWS_ENDPOINT s3 cp "$goaccess_report_name" "$s3_path" || { echo "Failed to upload HTML report to S3. Exiting..."; exit 1; }
    echo "HTML report copied to S3 bucket under $s3_path"

    # Delete the zipped files and HTML report
    rm "${zipped_files[@]}" "$goaccess_report_name"

    echo "Zipped Files and HTML report deleted from PVC successfully"

else
    echo "No files to process for $start_time_formatted"
fi