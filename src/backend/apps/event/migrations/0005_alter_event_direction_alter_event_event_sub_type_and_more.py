# Generated by Django 4.2.1 on 2023-07-12 21:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('event', '0004_alter_event_event_sub_type_alter_event_event_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='direction',
            field=models.CharField(max_length=32),
        ),
        migrations.AlterField(
            model_name='event',
            name='event_sub_type',
            field=models.CharField(max_length=32),
        ),
        migrations.AlterField(
            model_name='event',
            name='event_type',
            field=models.CharField(max_length=32),
        ),
        migrations.AlterField(
            model_name='event',
            name='severity',
            field=models.CharField(max_length=32),
        ),
        migrations.AlterField(
            model_name='event',
            name='status',
            field=models.CharField(max_length=32),
        ),
    ]
