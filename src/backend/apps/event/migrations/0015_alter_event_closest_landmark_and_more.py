# Generated by Django 4.2.3 on 2024-02-29 21:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0014_event_closest_landmark_event_highway_segment_names_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='closest_landmark',
            field=models.CharField(blank=True, default='', max_length=256),
        ),
        migrations.AlterField(
            model_name='event',
            name='highway_segment_names',
            field=models.CharField(blank=True, default='', max_length=256),
        ),
        migrations.AlterField(
            model_name='event',
            name='location_description',
            field=models.CharField(blank=True, default='', max_length=256),
        ),
    ]
