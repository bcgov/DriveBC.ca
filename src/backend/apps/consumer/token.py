import httpx
import os
import asyncio
import aio_pika
import logging
from datetime import datetime, timedelta
from aio_pika.connection import make_url
# from apps.consumer.processor import RABBITMQ_HEARTBEAT, RABBITMQ_RECONNECT_INTERVAL, RABBITMQ_TIMEOUT, RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_VHOST, OAUTH2_TOKEN_URL, OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET, OAUTH2_SCOPE


RABBITMQ_HEARTBEAT = int(os.getenv("RABBITMQ_HEARTBEAT", "60"))
RABBITMQ_TIMEOUT = int(os.getenv("RABBITMQ_TIMEOUT", "30")) 
RABBITMQ_RECONNECT_INTERVAL = int(os.getenv("RABBITMQ_RECONNECT_INTERVAL", "5"))

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST")
OAUTH2_TOKEN_URL = os.getenv("OAUTH2_TOKEN_URL")
OAUTH2_CLIENT_ID = os.getenv("OAUTH2_CLIENT_ID")
OAUTH2_CLIENT_SECRET = os.getenv("OAUTH2_CLIENT_SECRET")
OAUTH2_SCOPE = os.getenv("OAUTH2_SCOPE", "")


logger = logging.getLogger(__name__)

class RabbitMQTokenConnection:
    def __init__(self):
        self._connection = None
        self._token = None
        self._token_expiry = None

    async def _fetch_token(self) -> str:
        """Fetch a fresh token, caching until near expiry."""
        now = datetime.utcnow()
        if self._token and self._token_expiry and now < self._token_expiry:
            return self._token  # reuse valid token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAUTH2_TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": OAUTH2_CLIENT_ID,
                    "client_secret": OAUTH2_CLIENT_SECRET,
                },
            )
            response.raise_for_status()
            data = response.json()

        self._token = data["access_token"]
        # Refresh 60s before actual expiry to avoid edge cases
        expires_in = data.get("expires_in", 300)
        self._token_expiry = now + timedelta(seconds=expires_in - 60)
        return self._token

    async def connect(self) -> aio_pika.RobustConnection:
        token = await self._fetch_token()

        print(f"Connecting to RabbitMQ with token expiring at {self._token_expiry.isoformat()}")
        print(f"RabbitMQ URL: {make_url(host=RABBITMQ_HOST, port=RABBITMQ_PORT, virtualhost=RABBITMQ_VHOST, login='', password='***')}")
        print(f"OAuth2 Token: {token[:10]}... (expires in {(self._token_expiry - datetime.utcnow()).total_seconds()}s)")

        self._connection = await aio_pika.connect_robust(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            virtualhost=RABBITMQ_VHOST,
            login="",
            password=token,
            heartbeat=RABBITMQ_HEARTBEAT,
            timeout=RABBITMQ_TIMEOUT,
            reconnect_interval=RABBITMQ_RECONNECT_INTERVAL,
            # fail_fast=False,
        )


        # Re-fetch token on every reconnect attempt
        self._connection.reconnect_callbacks.add(self._on_reconnect)
        return self._connection

    async def _on_reconnect(self, connection):
        """Called by aio_pika before each reconnect — refresh token."""
        logger.info("RabbitMQ reconnecting — refreshing OAuth2 token...")
        try:
            token = await self._fetch_token()
            connection.password = token  # inject fresh token
        except Exception as e:
            logger.error(f"Failed to refresh RabbitMQ token: {e}")

    async def on_close(self, conn, exc=None):
        logger.warning(f"RabbitMQ connection closed: {exc}")

    async def on_channel_close(ch, exc=None):
        logger.warning(f"RabbitMQ channel closed: {exc}")