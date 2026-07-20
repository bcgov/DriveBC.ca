from django.core.management import call_command
from django.db import migrations


def load_fixture(apps, schema_editor):
    call_command('loaddata', 'border_data.json')


class Migration(migrations.Migration):

    dependencies = [
        ('border', '0002_bordercrossing_schedule_url'),
    ]

    operations = [
        migrations.RunPython(load_fixture, migrations.RunPython.noop),
    ]
