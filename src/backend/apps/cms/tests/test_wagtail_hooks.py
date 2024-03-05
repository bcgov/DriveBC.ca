from django.test import TestCase
from django.templatetags.static import static
from django.utils.html import format_html
from wagtail import hooks

class WagtailHookTest(TestCase):

    def test_insert_global_admin_css(self):
        # Call the hook function to get the HTML content
        hook_name = 'insert_global_admin_css'
        callbacks = hooks.get_hooks(hook_name)

        # Verify that there is at least one callback registered
        self.assertGreater(len(callbacks), 0)

        # Call each callback and verify the HTML content
        for callback in callbacks:
            result = callback()

            expected_css_link = format_html(
                    '<link rel="stylesheet" type="text/css" href="{}">',
                    static("wagtail_admin.css"),
                )
            self.assertIn(result, expected_css_link)

