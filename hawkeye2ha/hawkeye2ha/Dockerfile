ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.21
FROM ${BUILD_FROM}

RUN apk add --no-cache \
    python3 \
    py3-pip

COPY requirements.txt /tmp/
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

COPY rootfs /
COPY hawkeye2ha /opt/hawkeye2ha/hawkeye2ha
COPY static /opt/hawkeye2ha/static

ENV PYTHONPATH=/opt/hawkeye2ha

LABEL \
    io.hass.type="addon" \
    org.opencontainers.image.title="hawkeye2ha" \
    org.opencontainers.image.description="Home Assistant dashboard and entity bridge for HawkEye2 cameras" \
    org.opencontainers.image.source="https://github.com/alexsoh/hawkeye2ha" \
    org.opencontainers.image.licenses="Apache-2.0"
