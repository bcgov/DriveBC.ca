# Generated by Django 4.2.3 on 2023-09-13 23:59

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0003_advisory'),
    ]

    operations = [
        migrations.RenameField(
            model_name='advisory',
            old_name='advisory_active',
            new_name='active',
        ),
        migrations.RenameField(
            model_name='advisory',
            old_name='advisory_description',
            new_name='description',
        ),
        migrations.RenameField(
            model_name='advisory',
            old_name='advisory_geometry',
            new_name='geometry',
        ),
        migrations.RemoveField(
            model_name='advisory',
            name='advisory_title',
        ),
    ]
