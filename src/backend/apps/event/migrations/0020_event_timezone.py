# Generated by Django 4.2.16 on 2024-12-16 17:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0019_event_polygon'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='timezone',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
