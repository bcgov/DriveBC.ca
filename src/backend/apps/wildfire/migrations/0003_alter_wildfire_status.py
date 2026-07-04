from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('wildfire', '0002_alter_wildfire_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='wildfire',
            name='status',
            field=models.CharField(blank=True, default='', max_length=128),
        ),
    ]
