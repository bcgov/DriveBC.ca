# Generated by Django 4.2.3 on 2024-01-15 22:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0013_alter_advisory_body_alter_bulletin_body_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='bulletin',
            name='image_alt_text',
            field=models.CharField(max_length=125, default=''),
        ),
    ]