from django.db import migrations


def backfill_last_notified_at(apps, schema_editor):
    """
    Set last_notified_at from first_published_at for existing pages where it is
    null. Uses QuerySet.update() so Advisory/Bulletin.save() is not called.
    """
    Advisory = apps.get_model('cms', 'Advisory')
    Bulletin = apps.get_model('cms', 'Bulletin')

    for Model in (Advisory, Bulletin):
        for page in Model.objects.filter(
            last_notified_at__isnull=True,
            first_published_at__isnull=False,
        ).iterator():
            Model.objects.filter(pk=page.pk).update(
                last_notified_at=page.first_published_at
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0026_advisory_last_notified_at_bulletin_last_notified_at'),
    ]

    operations = [
        migrations.RunPython(backfill_last_notified_at, noop_reverse),
    ]
