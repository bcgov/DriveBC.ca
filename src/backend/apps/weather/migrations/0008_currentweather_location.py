# Generated by Django 4.2.3 on 2024-03-04 23:40

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('weather', '0007_alter_currentweather_location_latitude_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='currentweather',
            name='location',
            field=django.contrib.gis.db.models.fields.PointField(null=True, srid=4326),
        ),
    ]
