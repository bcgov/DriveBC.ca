from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wildfire', '0004_wildfire_wildfire_of_note'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wildfire',
            name='size',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
