import httpx
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone


class TestRabbitMQTokenConnection(IsolatedAsyncioTestCase):

    def setUp(self):
        from apps.consumer.rabbitmq import RabbitMQTokenConnection
        self.conn = RabbitMQTokenConnection()

    # _fetch_token                                                         
    async def test_fetch_token_returns_new_token(self):
        """Fetches and caches a fresh token when none exists."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"access_token": "test-token-123", "expires_in": 300}
        mock_response.raise_for_status = MagicMock()

        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            token = await self.conn._fetch_token()

        self.assertEqual(token, "test-token-123")
        self.assertEqual(self.conn._token, "test-token-123")

    async def test_fetch_token_uses_cached_token(self):
        """Returns cached token when it has not expired yet."""
        self.conn._token = "cached-token"
        self.conn._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=120)

        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            token = await self.conn._fetch_token()
            mock_client.assert_not_called()

        self.assertEqual(token, "cached-token")

    async def test_fetch_token_refreshes_expired_token(self):
        """Fetches a new token when the cached one has expired."""
        self.conn._token = "old-token"
        self.conn._token_expiry = datetime.now(timezone.utc) - timedelta(seconds=10)

        mock_response = MagicMock()
        mock_response.json.return_value = {"access_token": "new-token-456", "expires_in": 300}
        mock_response.raise_for_status = MagicMock()

        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            token = await self.conn._fetch_token()

        self.assertEqual(token, "new-token-456")

    async def test_fetch_token_expiry_set_correctly(self):
        """Token expiry is set 60 seconds before actual expiry."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"access_token": "token", "expires_in": 300}
        mock_response.raise_for_status = MagicMock()

        before = datetime.now(timezone.utc)
        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            await self.conn._fetch_token()
        after = datetime.now(timezone.utc)

        expected_min = before + timedelta(seconds=240)  # 300 - 60
        expected_max = after + timedelta(seconds=240)
        self.assertGreaterEqual(self.conn._token_expiry, expected_min)
        self.assertLessEqual(self.conn._token_expiry, expected_max)

    async def test_fetch_token_uses_default_expires_in(self):
        """Falls back to 300s expiry when expires_in is missing from response."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"access_token": "token"}  # no expires_in
        mock_response.raise_for_status = MagicMock()

        before = datetime.now(timezone.utc)
        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            await self.conn._fetch_token()

        expected = before + timedelta(seconds=240)  # default 300 - 60
        self.assertGreaterEqual(self.conn._token_expiry, expected)

    async def test_fetch_token_raises_on_http_error(self):
        """Propagates HTTP errors from the token endpoint."""
        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_post = AsyncMock(side_effect=httpx.HTTPStatusError(
                "401", request=MagicMock(), response=MagicMock()
            ))
            mock_client.return_value.__aenter__.return_value.post = mock_post

            with self.assertRaises(httpx.HTTPStatusError):
                await self.conn._fetch_token()

    # connect                                                              
    async def test_connect_returns_connection(self):
        """connect() fetches token and returns a RobustConnection."""
        self.conn._token = "valid-token"
        self.conn._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=120)

        mock_connection = MagicMock()
        mock_connection.reconnect_callbacks = MagicMock()
        mock_connection.reconnect_callbacks.add = MagicMock()

        with patch("apps.consumer.rabbitmq.aio_pika.connect_robust", new=AsyncMock(return_value=mock_connection)):
            result = await self.conn.connect()

        self.assertEqual(result, mock_connection)
        self.assertEqual(self.conn._connection, mock_connection)

    async def test_connect_registers_reconnect_callback(self):
        """connect() registers _on_reconnect as a reconnect callback."""
        self.conn._token = "valid-token"
        self.conn._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=120)

        mock_connection = MagicMock()
        mock_connection.reconnect_callbacks = MagicMock()
        mock_connection.reconnect_callbacks.add = MagicMock()

        with patch("apps.consumer.rabbitmq.aio_pika.connect_robust", new=AsyncMock(return_value=mock_connection)):
            await self.conn.connect()

        mock_connection.reconnect_callbacks.add.assert_called_once_with(self.conn._on_reconnect)

    async def test_connect_passes_correct_credentials(self):
        """connect() uses empty login and token as password."""
        self.conn._token = "my-oauth-token"
        self.conn._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=120)

        mock_connection = MagicMock()
        mock_connection.reconnect_callbacks.add = MagicMock()

        with patch("apps.consumer.rabbitmq.aio_pika.connect_robust", new=AsyncMock(return_value=mock_connection)) as mock_connect:
            await self.conn.connect()
            _, kwargs = mock_connect.call_args
            self.assertEqual(kwargs["login"], "")
            self.assertEqual(kwargs["password"], "my-oauth-token")

    # _on_reconnect
    async def test_on_reconnect_refreshes_token(self):
        """_on_reconnect injects a fresh token into the connection."""
        mock_connection = MagicMock()
        self.conn._token = "old-token"
        self.conn._token_expiry = datetime.now(timezone.utc) - timedelta(seconds=10)

        mock_response = MagicMock()
        mock_response.json.return_value = {"access_token": "refreshed-token", "expires_in": 300}
        mock_response.raise_for_status = MagicMock()

        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            await self.conn._on_reconnect(mock_connection)

        self.assertEqual(mock_connection.password, "refreshed-token")

    async def test_on_reconnect_logs_error_on_failure(self):
        """_on_reconnect logs an error if token refresh fails."""
        mock_connection = MagicMock()

        with patch("apps.consumer.rabbitmq.httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=Exception("network error")
            )
            with patch("apps.consumer.rabbitmq.logger") as mock_logger:
                await self.conn._on_reconnect(mock_connection)
                mock_logger.error.assert_called_once()