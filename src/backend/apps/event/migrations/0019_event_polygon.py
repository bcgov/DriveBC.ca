# Generated by Django 4.2.3 on 2024-04-15 20:37

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0018_alter_event_schedule'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='polygon',
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
    ]
