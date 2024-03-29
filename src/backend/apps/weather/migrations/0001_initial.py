# Generated by Django 4.2.3 on 2024-02-05 20:16

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='RegionalWeather',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('modified_at', models.DateTimeField(auto_now=True)),
                ('location_code', models.CharField(max_length=10, null=True)),
                ('location_latitude', models.CharField(max_length=10, null=True)),
                ('location_longitude', models.CharField(max_length=10, null=True)),
                ('location_name', models.CharField(max_length=100, null=True)),
                ('region', models.CharField(max_length=255, null=True)),
                ('observation_name', models.CharField(max_length=50, null=True)),
                ('observation_zone', models.CharField(max_length=10, null=True)),
                ('observation_utc_offset', models.IntegerField(null=True)),
                ('observation_text_summary', models.CharField(max_length=255, null=True)),
                ('conditions', models.JSONField(null=True)),
                ('forecast_group', models.JSONField(null=True)),
                ('hourly_forecast_group', models.JSONField(null=True)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
