# Generated by Django 4.2.3 on 2024-03-04 18:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0016_event_start_point_linear_reference'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='event',
            name='priority',
        ),
    ]
