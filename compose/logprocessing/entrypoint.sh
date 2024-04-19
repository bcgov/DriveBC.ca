#!/bin/bash

cd logs

# Initialize an empty array
zipped_files=()

# Get yesterday's start and end time in the America/Vancouver timezone
yesterday_start=$(TZ=America/Vancouver date -d "yesterday 00:00")
yesterday_end=$(TZ=America/Vancouver date -d "yesterday 23:59")

# Convert yesterday's start and end time to UTC
yesterday_start_utc=$(date -u -d "$yesterday_start" +%Y%m%d%H)
yesterday_end_utc=$(date -u -d "$yesterday_end" +%Y%m%d%H)

# Loop through all files in the current directory ending with ".log"
for file in *.log; do
    # Check if the file exists and is a regular file
    if [[ -f $file ]]; then
        # Extract the date and time part from the filename (assuming UTC timezone)
        file_datetime_utc=$(echo "$file" | grep -oE '[0-9]{10}')
        # Check if the file date and time in UTC falls within yesterday's start and end time in UTC
        if [[ $file_datetime_utc -ge $yesterday_start_utc && $file_datetime_utc -le $yesterday_end_utc ]]; then
            # Echo the filename
            echo "Zipping $file..."
            # Gzip the file
            gzip "$file"
            # Add the zipped filename to the array
            zipped_files+=("$file.gz")
        fi
    fi
done

# Print the elements of the array
echo "Log files that will be processed:"
printf '%s\n' "${zipped_files[@]}"

# Get yesterday's start formatted date in the America/Vancouver timezone
yesterday_start_formatted=$(TZ=America/Vancouver date -d "yesterday 00:00" +%Y%m%d)

# Run the following command only if zipped_files array is not empty
if [ ${#zipped_files[@]} -gt 0 ]; then
    #Run goaccess on all the log files from yesterday
    goaccess_report_name=$yesterday_start_formatted-goaccess_report.html
    zcat "${zipped_files[@]}" | goaccess - -o "$goaccess_report_name" --log-format='%h %e %^[%x] "%r" %s %b "%R" "%u" %C "%M" %T' --datetime-format='%d/%b/%Y:%H:%M:%S %z' --ignore-panel=REMOTE_USER --tz=America/Vancouver --jobs=2
    echo "GoAccess report generated successfully at $goaccess_report_name"

    # Get current date in YYYYMMDD format
    year=$(TZ=America/Vancouver date -d "yesterday" +"%Y")
    month=$(TZ=America/Vancouver date -d "yesterday" +"%m")
    day=$(TZ=America/Vancouver date -d "yesterday" +"%d")

    # Create folder structure in S3 bucket
    s3_path="s3://$AWS_BUCKET/$year/$month/$day/"

    # Upload zipped files to S3
    for file in "${zipped_files[@]}"; do
        aws --endpoint-url "$AWS_ENDPOINT" s3 cp "$file" "$s3_path"
        if [ $? -eq 0 ]; then
            echo "File $file copied to S3 bucket under $s3_path"
        else
            echo "Failed to upload $file to S3. Exiting..."
            exit 1
        fi
    done

    echo "All files copied to S3 bucket under $s3_path"


    # Upload HTML report to S3
    aws --endpoint-url $AWS_ENDPOINT s3 cp "$goaccess_report_name" "$s3_path"
    if [ $? -eq 0 ]; then
        echo "HTML report copied to S3 bucket under $s3_path"
    else
        echo "Failed to upload HTML report to S3. Exiting..."
        exit 1
    fi

    # Delete the zipped files and HTML report
    rm "${zipped_files[@]}" "$goaccess_report_name"

    echo "Zipped Files and HTML report deleted from PVC successfully"

else
    echo "No files to process for $yesterday_start_formatted"
fi