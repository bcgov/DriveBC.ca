FROM alpine:3.21

RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot

EXPOSE 8080

RUN apk add --no-cache \
    bash \
    curl \
    gzip \
    tar \
    jq

# This line below is temporary till v 2.9.1 is vailable in the regular alpine repo (as of 28 Apr 2025 it's only in edge) Check https://pkgs.alpinelinux.org/packages?name=caddy to see latest version
RUN apk add --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/community caddy

ARG DEBUG_BUILD=false

# Add debugging tools into builds if enabled
RUN if [ ${DEBUG_BUILD} = true ]; then \
  apk add --no-cache jq less procps vim; \
fi

COPY --chmod=755 ./app /app
COPY --chmod=755 ./start.sh /start.sh

USER nonroot

CMD ["bash", "/start.sh"]