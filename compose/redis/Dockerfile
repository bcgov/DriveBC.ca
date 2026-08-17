FROM redis:8-alpine

RUN apk add --no-cache python3

COPY ./compose/redis/entrypoint.sh /entrypoint.sh
COPY ./compose/redis/lease.py /lease.py

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]