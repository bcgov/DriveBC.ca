# Generated by Django 4.2.1 on 2023-09-22 21:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0004_rename_advisory_active_advisory_active_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='TestCMSData',
        ),
    ]