FROM alpine:3.23

RUN addgroup -S nonroot \
    && adduser -S nonroot -G nonroot

EXPOSE 8080

RUN apk add --no-cache \
    bash \
    curl \
    gzip \
    tar \
    jq \
    caddy

ARG DEBUG_BUILD=false

# Add debugging tools into builds if enabled
RUN if [ ${DEBUG_BUILD} = true ]; then \
  apk add --no-cache jq less procps vim; \
fi

COPY --chmod=755 ./app /app
COPY --chmod=755 ./start.sh /start.sh

USER nonroot

CMD ["bash", "/start.sh"]