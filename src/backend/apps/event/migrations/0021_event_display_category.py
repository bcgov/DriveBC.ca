# Generated by Django 4.2.16 on 2025-01-21 20:18

from apps.event.helpers import get_display_category
from django.db import migrations, models


def populate_display_category(apps, schema_editor):
    Event = apps.get_model('event', 'Event')
    for event in Event.objects.all():
        event.display_category = get_display_category(event)
        event.save()


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0020_event_timezone'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='display_category',
            field=models.CharField(blank=True, default='', max_length=32),
        ),
        migrations.RunPython(populate_display_category),
    ]
