#!/bin/sh
/usr/bin/python3 /lease.py &
exec redis-server "$@"