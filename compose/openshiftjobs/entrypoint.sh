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
    *)
        echo "Invalid script"
        exit 1
        ;;
esac
