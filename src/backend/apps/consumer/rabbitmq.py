import httpx
import os
import aio_pika
import logging
from datetime import datetime, timedelta, timezone
from aio_pika.connection import make_url

RABBITMQ_HEARTBEAT = int(os.getenv("RABBITMQ_HEARTBEAT", "60"))
RABBITMQ_TIMEOUT = int(os.getenv("RABBITMQ_TIMEOUT", "30")) 
RABBITMQ_RECONNECT_INTERVAL = int(os.getenv("RABBITMQ_RECONNECT_INTERVAL", "5"))
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST")
OAUTH2_TOKEN_URL = os.getenv("OAUTH2_TOKEN_URL")
OAUTH2_CLIENT_ID = os.getenv("OAUTH2_CLIENT_ID")
OAUTH2_SCOPE = os.getenv("OAUTH2_SCOPE", "")
OAUTH2_DRIVEBC_RABBITMQ_USERNAME = os.getenv("OAUTH2_DRIVEBC_RABBITMQ_USERNAME")
OAUTH2_DRIVEBC_RABBITMQ_PASSWORD = os.getenv("OAUTH2_DRIVEBC_RABBITMQ_PASSWORD")


logger = logging.getLogger(__name__)

class RabbitMQTokenConnection:
    def __init__(self):
        self._connection = None
        self._token = None
        self._token_expiry = None

    async def _fetch_token(self) -> str:
        now = datetime.now(timezone.utc) 
        if self._token and self._token_expiry and now < self._token_expiry:
            return self._token

        payload = {
            "grant_type": "password",
            "client_id": OAUTH2_CLIENT_ID,
            "username": OAUTH2_DRIVEBC_RABBITMQ_USERNAME,
            "password": OAUTH2_DRIVEBC_RABBITMQ_PASSWORD,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(OAUTH2_TOKEN_URL, data=payload)
            response.raise_for_status()
            data = response.json()

        self._token = data["access_token"]
        expires_in = data.get("expires_in", 300)
        self._token_expiry = now + timedelta(seconds=expires_in - 60)
        return self._token

    async def connect(self, host: str, port: int) -> aio_pika.RobustConnection:
        token = await self._fetch_token()

        self._connection = await aio_pika.connect_robust(
            host=host,
            port=port,
            virtualhost=RABBITMQ_VHOST,
            login="",
            password=token,
            heartbeat=RABBITMQ_HEARTBEAT,
            timeout=RABBITMQ_TIMEOUT,
            reconnect_interval=RABBITMQ_RECONNECT_INTERVAL,
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
