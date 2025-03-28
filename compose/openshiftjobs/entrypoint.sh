#!/bin/bash

# Check the number of arguments
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <script_name> [args...]"
    exit 1
fi

# Determine which script to run based on the first argument
case "$1" in
    backupmediapvc)
        # Run backupmediapvc.sh which will backup the data from the django-media pvc to s3 storage
        /scripts/backupmediapvc.sh
        ;;
    ziplogs)
        # Run ziplogs.sh which will zip all files that were created in the previous hour or older in the nginx log storage pvc
        /scripts/ziplogs.sh
        ;;
    analyzeexportlogs)
        # Run analyzeexportlogs with additional arguments which will send the specified days logs through goaccess and then upload to s3.
        /scripts/analyzeexportlogs.sh
        ;;
    *)
        echo "Invalid script"
        exit 1
        ;;
esac
