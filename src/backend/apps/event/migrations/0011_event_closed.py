# Generated by Django 4.2.3 on 2023-12-28 19:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0010_event_end_event_schedule_event_start'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='closed',
            field=models.BooleanField(default=False),
        ),
    ]