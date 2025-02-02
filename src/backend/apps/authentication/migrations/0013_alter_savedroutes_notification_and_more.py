# Generated by Django 4.2.16 on 2025-01-24 00:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0012_savedroutes_notification_days_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='savedroutes',
            name='notification',
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AlterField(
            model_name='savedroutes',
            name='notification_days',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name='savedroutes',
            name='notification_types',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
