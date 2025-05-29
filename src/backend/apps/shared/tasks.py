import datetime
from zoneinfo import ZoneInfo

from email_log.models import Email
from huey import crontab
from huey.contrib.djhuey import db_periodic_task, lock_task


@db_periodic_task(crontab(hour="*/24", minute="0"))
@lock_task("clean-email-logs-lock")
def clean_email_logs():
    current_time = datetime.datetime.now(ZoneInfo("America/Vancouver"))

    # Delete emails older than 7 days
    Email.objects.filter(date_sent__lt=current_time - datetime.timedelta(days=7)).delete()
