# apps/authentication/tests/test_auth_logging.py

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from unittest.mock import patch

TEST_USERNAME = "testuser"
TEST_CREDENTIAL  = "test123"
TEST_PASSWORD_WRONG = "wrongpassword"
User = get_user_model()


class AuthLoggingTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username=TEST_USERNAME,
            password=TEST_CREDENTIAL
        )
        self.client = Client()

    def test_login(self):
        response = self.client.login(
            username=TEST_USERNAME,
            password=TEST_CREDENTIAL
        )

        self.assertTrue(response)


    def test_logout(self):
        self.client.login(username=TEST_USERNAME, password=TEST_CREDENTIAL)

        response = self.client.logout()

        self.assertIsNone(response)  # logout returns None


    def test_failed_login(self):
        with patch('apps.authentication.signals.get_ip') as mock_get_ip:
            mock_get_ip.return_value = '127.0.0.1'
            with patch('builtins.print') as mock_print:
                self.client.login(
                    username=TEST_USERNAME,
                    password='wrongpassword',
                )

                mock_print.assert_called_once_with(
                    f'[FAILED LOGIN] username={TEST_USERNAME} ip=127.0.0.1'
                )