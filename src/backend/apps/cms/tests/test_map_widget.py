from django.test import TestCase
from apps.cms.models import DriveBCMapWidget
class DriveBCMapWidgetTest(TestCase):
    def test_widget_has_media_with_custom_js(self):
        """Test that widget includes custom JS for editing."""
        widget = DriveBCMapWidget()
        media = widget.media
        js_files = str(media._js)
        self.assertIn('js/map-widget.js', js_files)
        
    def test_widget_has_media_with_custom_css(self):
        """Test that widget includes custom CSS for toolbar."""
        widget = DriveBCMapWidget()
        media = widget.media
        css_files = str(media._css)
        self.assertIn('css/map-widget.css', css_files)
        
    def test_widget_default_coordinates(self):
        """Test default center coordinates (Kelowna area)."""
        widget = DriveBCMapWidget()
        self.assertEqual(widget.default_lon, -119.49662112970556)
        self.assertEqual(widget.default_lat, 49.887338062986295)
        self.assertEqual(widget.default_zoom, 14)
        
    def test_widget_template_name(self):
        """Test widget uses custom template."""
        widget = DriveBCMapWidget()
        self.assertEqual(widget.template_name, 'cms/map.html')
        
    def test_widget_extends_osmwidget(self):
        """Test widget inherits from OSMWidget."""
        widget = DriveBCMapWidget()
        from django.contrib.gis.forms import OSMWidget
        self.assertIsInstance(widget, OSMWidget)