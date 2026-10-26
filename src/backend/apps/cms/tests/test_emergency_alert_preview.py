from unittest.mock import MagicMock, patch

from apps.cms.models import EmergencyAlert, EmergencyAlertDetail
from apps.cms.wagtail_hooks import CopyPreviewURLMenuItem
from django.test import TestCase
from rest_framework.test import APIClient
from wagtail.models import Page


class EmergencyAlertPreviewTest(TestCase):

    def setUp(self):
        root = Page.objects.get(depth=1)
        self.alert = root.add_child(instance=EmergencyAlert(
            title='Alert', slug='test-alert', alert='<p>Draft alert</p>', live=False,
        ))
        self.detail = self.alert.add_child(instance=EmergencyAlertDetail(
            title='Detail', slug='test-detail', live=False,
        ))
        self.client = APIClient()

    def render_menu_item(self, page):
        context = {'page': MagicMock(specific=page)}
        with patch.dict('os.environ', {'FRONTEND_BASE_URL': 'https://drivebc.ca/'}):
            return CopyPreviewURLMenuItem(order=100).render_html(context)

    def test_copy_preview_url_for_emergency_alert(self):
        html = self.render_menu_item(self.alert)
        assert 'https://drivebc.ca/?emergency_alert_preview=test-alert' in html

    def test_copy_preview_url_for_emergency_alert_detail(self):
        html = self.render_menu_item(self.detail)
        assert 'https://drivebc.ca/emergency-alert-detail/test-detail?preview=true' in html

    def test_unpublished_alert_only_returned_in_preview(self):
        url = '/api/cms/emergency-alert/test-alert/'
        assert self.client.get(url).status_code == 404

        response = self.client.get(url, {'preview': 'true'})
        assert response.status_code == 200
        assert response.data['slug'] == 'test-alert'

    def test_unpublished_detail_only_returned_in_preview(self):
        url = '/api/cms/emergency-alert-detail/test-detail/'
        assert self.client.get(url).status_code == 404

        response = self.client.get(url, {'preview': 'true'})
        assert response.status_code == 200
        assert response.data['slug'] == 'test-detail'

    def test_preview_templates_render(self):
        # moderator email preview links render page templates
        for page in (self.alert, self.detail):
            response = page.serve_preview(MagicMock(), page.default_preview_mode)
            assert response.render().status_code == 200
