#!/bin/sh
/opt/venv/bin/python3 /lease.py &
exec redis-server "$@"