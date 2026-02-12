from apps.shared.models import BaseModel
from django.contrib.gis.db import models
from django.core.cache import cache
from django_prometheus.models import ExportModelOperationsMixin
from apps.shared.enums import CacheKey
import re
from typing import Tuple
from django.utils.dateparse import parse_datetime
from datetime import timezone as dt_timezone

NTCIP_TOKEN_PATTERN = re.compile(r"\[[^\]]+\]")

def parse_api_utc(dt_str):
    if not dt_str:
        return None

    dt = parse_datetime(dt_str)

    if dt is None:
        return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=dt_timezone.utc)

    return dt.astimezone(dt_timezone.utc)

def create_structured_message(content: str, alignment: str) -> dict:
    return {
        "content": content.strip(),
        "alignment": alignment  # "left", "center", "right"
    }

def clean_tags(text):
    """Removes NTCIP tags to find the true visible character count."""
    # Matches anything in brackets like [jl2], [fo3], [pt30o0]
    return re.sub(r'\[[^\]]*\]?', '', text).strip()

def convert_message(input_string: str) -> list:
    """
    Convert message with justification tokens to structured alignment format.
    Returns list of dictionaries with content and alignment information.
    """
    # Split by both page [np] and line [nl] markers
    all_segments = re.split(r'\[nl\]|\[np\]', input_string)
    
    for segment in all_segments:
        # Replace the justification token with a single space to measure baseline length
        clean_segment = segment.replace('[jl4]', ' ').replace('__JUSTIFY_RIGHT__', ' ')
        visible_len = len(clean_tags(clean_segment))
        
    pages = input_string.split('[np]')
    all_processed_lines = []
    
    for page in pages:
        raw_lines = page.split('[nl]')
        
        for line in raw_lines:
            visible_content = clean_tags(line)
            
            # Filter out empty lines or stray tag fragments
            if not visible_content and '[jl4]' not in line and '__JUSTIFY_RIGHT__' not in line:
                continue
            if '[' in visible_content and ']' not in visible_content:
                continue
            # Check for Right-Justification markers
            if '[jl4]' in line or '__JUSTIFY_RIGHT__' in line:
                # Split at whichever token is present
                token = '[jl4]' if '[jl4]' in line else '__JUSTIFY_RIGHT__'
                parts = line.split(token)
                
                left = clean_tags(parts[0])
                right = clean_tags(parts[1])
                combined_content = f"{left} {right}".strip()
                
                # Create structured data for right alignment
                all_processed_lines.append({
                    "content": combined_content,
                    "alignment": "right"
                })
            
            else:
                # Create structured data for center alignment
                all_processed_lines.append({
                    "content": visible_content,
                    "alignment": "center"
                })
    
    return all_processed_lines

def format_structured_for_display(structured_lines: list) -> str:
    """Convert structured message data to display format with alignment markers"""
    if not structured_lines:
        return ""
        
    formatted_lines = []
    for line_data in structured_lines:
        if isinstance(line_data, dict):
            alignment_prefix = {
                "left": "[ALIGN_LEFT]",
                "center": "[ALIGN_CENTER]", 
                "right": "[ALIGN_RIGHT]"
            }
            prefix = alignment_prefix.get(line_data["alignment"], "[ALIGN_CENTER]")
            formatted_lines.append(f"{prefix}{line_data['content']}")
        else:
            # Handle any string fallbacks
            formatted_lines.append(f"[ALIGN_CENTER]{line_data}")
    
    return "\n".join(formatted_lines)

def parse_dms_pages(raw: str) -> Tuple[str, str, str]:
    # Ensure raw is a string and handle None or empty cases
    if not raw or raw is None:
        return "", "", ""
    text = str(raw)  # Ensure string type
    text = raw
    # Remove control characters
    text = remove_control_characters(text)
    
    # Split pages BEFORE removing other tokens
    pages = re.split(r"\[np\]", text, flags=re.IGNORECASE)
    cleaned_pages = []
    for page in pages[:3]:  # max 3 pages
        # Process justification tokens BEFORE removing other NTCIP tokens
        page = process_justification_tokens(page)
        
        # Convert to structured data
        structured_lines = convert_message(page)
        
        # Convert structured data to display format with alignment markers
        display_format = format_structured_for_display(structured_lines)
        
        # Remove remaining NTCIP formatting tokens
        display_format = NTCIP_TOKEN_PATTERN.sub("", display_format)
        
        # Normalize excessive newlines
        display_format = re.sub(r"\n{3,}", "\n\n", display_format)
        cleaned_pages.append(display_format.strip())
    
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
    processed = processed.replace('[jl2]', ' ')
    
    return processed

def remove_control_characters(text: str) -> str:
    """
    Remove control characters that appear after NTCIP formatting tokens
    or at the end of words.
    """
    if not text or text is None:
        return ""
    
    # Remove single lowercase letters after brackets: [nl]cTEXT -> [nl]TEXT
    # Remove trailing lowercase letters: TEXTt -> TEXT
    pattern = r'(?<=\])[a-z]|[a-z](?=\s|$)'
    return re.sub(pattern, '', text).strip(']')


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
    updated_datetime_utc = models.DateTimeField(blank=True, null=True, verbose_name="Updated datetime")
    message_expiry_datetime_utc = models.DateTimeField(blank=True, null=True, verbose_name="Message expiry datetime")
    cache_datetime_utc = models.DateTimeField(blank=True, null=True, verbose_name="Cache datetime")

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