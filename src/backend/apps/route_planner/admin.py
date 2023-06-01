from django.contrib import admin

from .models import TravelAdvisoryMessage


class TravelAdvisoryMessageAdmin(admin.ModelAdmin):
    list_display = ("title", "pub_date", "is_published")
    list_filter = ("pub_date",)


admin.site.register(TravelAdvisoryMessage, TravelAdvisoryMessageAdmin)
