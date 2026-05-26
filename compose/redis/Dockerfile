FROM redis:8-alpine

RUN apk add --no-cache python3 py3-pip && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install kubernetes==36.0.1

COPY ./compose/redis/entrypoint.sh /entrypoint.sh
COPY ./compose/redis/lease.py /lease.py

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]