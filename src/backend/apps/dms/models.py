from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point
from django.core.cache import cache
from django_prometheus.models import ExportModelOperationsMixin
from apps.shared.enums import CacheKey
import re
from typing import Tuple
from django.utils.dateparse import parse_datetime
# from django.utils import timezone
from datetime import timezone as dt_timezone

NTCIP_TOKEN_PATTERN = re.compile(r"\[[^\]]+\]")

def parse_dms_pages(raw: str) -> Tuple[str, str, str]:
    if not raw:
        return "", "", ""
    text = raw
    # Remove control characters
    text = remove_control_characters(text)
    # Normalize newlines
    text = re.sub(r"\[nl\]", "\n", text, flags=re.IGNORECASE)
    # Split pages BEFORE removing other tokens
    pages = re.split(r"\[np\]", text, flags=re.IGNORECASE)
    cleaned_pages = []
    for page in pages[:3]:  # max 3 pages
        # Process justification tokens BEFORE removing other NTCIP tokens
        page = process_justification_tokens(page)
        
        # Remove remaining NTCIP formatting tokens
        page = NTCIP_TOKEN_PATTERN.sub("", page)
        # Normalize whitespace (tabs to single space, multiple spaces to single space)
        page = re.sub(r"[ \t]+", " ", page)
        
        # Replace placeholder with spacing AFTER whitespace normalization
        page = page.replace('__JUSTIFY_RIGHT__', '    ')  # 4 spaces for right justification
        
        # Normalize excessive newlines
        page = re.sub(r"\n{3,}", "\n\n", page)
        cleaned_pages.append(page.strip())
    # Pad missing pages
    while len(cleaned_pages) < 3:
        cleaned_pages.append("")
    return tuple(cleaned_pages)

def process_justification_tokens(page: str) -> str:
    """
    Process justification tokens with whitespace preservation.
    """
    processed = page
    
    # Replace [jl4] with a unique placeholder that won't be collapsed
    processed = processed.replace('[jl4]', '__JUSTIFY_RIGHT__')
    
    # Remove [jl2] tokens
    processed = processed.replace('[jl2]', '')
    
    return processed

def remove_control_characters(text: str) -> str:
    """
    Remove control characters that appear after NTCIP formatting tokens.
    """
    # Remove single lowercase letters that appear immediately after closing brackets
    # Pattern: ] followed by lowercase letter(s) at start of text content
    return re.sub(r'\][a-z](?=[A-Z])', ']', text)
def parse_api_utc(dt_str):
    if not dt_str:
        return None

    dt = parse_datetime(dt_str)

    if dt is None:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=dt_timezone.utc)

    return dt.astimezone(dt_timezone.utc)

class Dms(ExportModelOperationsMixin('dms'), BaseModel):
    id = models.CharField(primary_key=True, max_length=128, blank=True, default='')
    name = models.CharField(max_length=128, blank=True, default='')
    name_override = models.CharField(blank=True, max_length=128)
    category = models.CharField(max_length=128, blank=True, default='')
    description = models.CharField(max_length=750, blank=True, default='')
    roadway_name = models.CharField(max_length=128, blank=True, default='')
    roadway_direction = models.CharField(max_length=64, blank=True, default='')
    static_text = models.CharField(max_length=256, blank=True, default='')
    message_text = models.CharField(max_length=512, blank=True, default='')
    status = models.CharField(max_length=64, blank=True, default='')
    location = models.GeometryField(blank=True, null=True)
    updated_datetime_utc = models.DateTimeField(blank=True, null=True)
    message_expiry_datetime_utc = models.DateTimeField(blank=True, null=True)
    cache_datetime_utc = models.DateTimeField(blank=True, null=True)

    message_display_1 = models.TextField(blank=True, default="")
    message_display_2 = models.TextField(blank=True, default="")
    message_display_3 = models.TextField(blank=True, default="")

    is_on = models.BooleanField(default=False)

    def __str__(self):
        return f"dms for {self.pk}"

    def save(self, *args, **kwargs):
        self.message_display_1, self.message_display_2, self.message_display_3 = (
            parse_dms_pages(self.message_text)
        )
        super().save(*args, **kwargs)
        cache.delete(CacheKey.DMS_LIST)