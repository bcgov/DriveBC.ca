# Generated by Django 4.2.11 on 2024-06-05 20:49

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('weather', '0013_currentweather_forecast_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='currentweather',
            old_name='forecast',
            new_name='hourly_forecast_group',
        ),
        migrations.RemoveField(
            model_name='currentweather',
            name='forecast_group',
        ),
    ]