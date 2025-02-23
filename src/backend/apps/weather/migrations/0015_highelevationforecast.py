# Generated by Django 4.2.11 on 2024-10-23 20:42

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('weather', '0014_rename_forecast_currentweather_hourly_forecast_group_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='HighElevationForecast',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('modified_at', models.DateTimeField(auto_now=True)),
                ('code', models.CharField(max_length=10, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, null=True)),
                ('issued_utc', models.DateTimeField(null=True)),
                ('location', django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
                ('forecasts', models.JSONField(default=list, null=True)),
                ('source', models.JSONField(null=True)),
                ('warnings', models.JSONField(default=list, null=True)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
