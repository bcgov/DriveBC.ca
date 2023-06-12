# Generated by Django 4.2.1 on 2023-06-12 23:38

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Webcam',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('modified_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=128)),
                ('caption', models.CharField(max_length=256)),
                ('region', models.PositiveSmallIntegerField(choices=[(0, 'Northern Interior'), (1, 'Southern Interior'), (2, 'Lower Mainland'), (3, 'Vancouver Island'), (4, 'Border Cams')])),
                ('region_name', models.CharField(max_length=128)),
                ('highway', models.CharField(max_length=32)),
                ('highway_description', models.CharField(max_length=128)),
                ('highway_group', models.PositiveSmallIntegerField()),
                ('highway_cam_order', models.PositiveSmallIntegerField()),
                ('location', django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ('orientation', models.CharField(choices=[('N', 'North'), ('NE', 'North East'), ('E', 'East'), ('SE', 'South East'), ('S', 'South'), ('SW', 'South West'), ('W', 'West')], max_length=32, null=True)),
                ('elevation', models.PositiveSmallIntegerField()),
                ('is_on', models.BooleanField(default=True)),
                ('should_appear', models.BooleanField(default=True)),
                ('is_new', models.BooleanField(default=False)),
                ('is_on_demand', models.BooleanField(default=False)),
                ('marked_stale', models.BooleanField(default=False)),
                ('marked_delayed', models.BooleanField(default=False)),
                ('last_update_attempt', models.DateTimeField(null=True)),
                ('last_update_modified', models.DateTimeField(null=True)),
                ('update_period_mean', models.PositiveSmallIntegerField()),
                ('update_period_stddev', models.PositiveSmallIntegerField()),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
