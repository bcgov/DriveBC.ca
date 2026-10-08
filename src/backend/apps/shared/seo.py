import re
from html import unescape
from urllib.parse import parse_qs, urlsplit
from xml.etree import ElementTree

from apps.ferry.models import CoastalFerryStop, CoastalFerryStopTime, Ferry
from apps.rest.models import RestStop
from apps.webcam.models import Webcam
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.html import strip_tags
from django.views.decorators.http import require_GET


CANONICAL_ORIGIN = "https://www.drivebc.ca"
DEFAULT_TITLE = "DriveBC"
DEFAULT_DESCRIPTION = (
    "Check real-time BC road conditions, closures, highway webcams, and delays with DriveBC."
)
DETAIL_PATHS = (
    (re.compile(r"^/cameras/(\d+)/?$"), "camera"),
    (re.compile(r"^/rest-stops/(\d+)/?$"), "rest_stop"),
    (re.compile(r"^/ferries/coastal/(\d+)/?$"), "coastal_ferry"),
    (re.compile(r"^/ferries/(\d+)/?$"), "ferry"),
)
SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


def _detail_request(request):
    original_uri = request.META.get("HTTP_X_ORIGINAL_URI", "")
    if original_uri and not original_uri.startswith("/seo-metadata"):
        parsed_uri = urlsplit(original_uri)
        path = parsed_uri.path
        query = parse_qs(parsed_uri.query)
    else:
        path = request.path.removeprefix("/seo-metadata")
        query = request.GET

    if not query:
        query = request.GET

    if not path:
        path = "/"
    for pattern, detail_type in DETAIL_PATHS:
        match = pattern.fullmatch(path)
        if match:
            return detail_type, match.group(1)

    query_type = _query_value(query, "type")
    identifier = _query_value(query, "id")
    if not identifier or not identifier.isdecimal():
        return None, None

    if query_type == "camera":
        return "camera", identifier
    if query_type in ("restStop", "largeRestStop"):
        return "rest_stop", identifier
    if query_type == "ferry":
        if _query_value(query, "display_category") == "coastalFerry":
            if CoastalFerryStop.objects.filter(pk=identifier, parent_stop__isnull=True).exists():
                return "coastal_ferry", identifier
        if Ferry.objects.filter(route_id=identifier).exists():
            return "ferry", identifier
        if CoastalFerryStop.objects.filter(pk=identifier, parent_stop__isnull=True).exists():
            return "coastal_ferry", identifier
    return None, None


def _query_value(query, key):
    value = query.get(key, "")
    return value[0] if isinstance(value, list) and value else value


def _plain_text(value, fallback):
    text = " ".join(unescape(strip_tags(value or "")).split())
    return text or fallback


def _metadata(detail_type, identifier):
    if detail_type == "camera":
        camera = Webcam.objects.filter(pk=identifier, should_appear=True).first()
        if camera:
            camera_name = camera.name_override or camera.name
            title = f"{camera_name} - Highway {camera.highway} Camera | DriveBC"
            description = (
                f"View the live highway camera for {camera_name} on Highway {camera.highway} in BC."
            )
            return title, description, f"/cameras/{camera.pk}"

    elif detail_type == "rest_stop":
        rest_stop = RestStop.objects.filter(pk=identifier).first()
        if rest_stop:
            properties = rest_stop.properties or {}
            name = properties.get("REST_AREA_NAME") or "BC Rest Stop"
            location = properties.get("DISTANCE_FROM_MUNICIPALITY")
            title = f"{name} Rest Stop | DriveBC"
            description = f"Rest area in British Columbia. {location or ''}".strip()
            return title, description, f"/rest-stops/{rest_stop.pk}"

    elif detail_type == "ferry":
        ferry = Ferry.objects.filter(route_id=identifier).order_by("priority").first()
        if ferry:
            name = ferry.route_name or "BC Ferry"
            description = _plain_text(
                ferry.route_description,
                f"Ferry service for {name} in British Columbia.",
            )
            return f"{name} Ferry | DriveBC", description, f"/ferries/{ferry.route_id}"

    elif detail_type == "coastal_ferry":
        stop = CoastalFerryStop.objects.filter(
            pk=identifier,
            parent_stop__isnull=True,
        ).first()
        if stop:
            return (
                f"{stop.name} Ferry Terminal | DriveBC",
                f"Coastal ferry terminal at {stop.name} in British Columbia.",
                f"/ferries/coastal/{stop.pk}",
            )

    return None


@require_GET
def seo_metadata(request, detail_path=""):
    title = DEFAULT_TITLE
    description = DEFAULT_DESCRIPTION
    canonical_url = None
    detail_type, identifier = _detail_request(request)
    metadata = _metadata(detail_type, identifier)

    if metadata:
        title, description, canonical_path = metadata
        description = description[:300]
        canonical_url = f"{CANONICAL_ORIGIN}{canonical_path}"
    else:
        path = request.META.get("HTTP_X_ORIGINAL_URI", request.path)
        if path.startswith("/seo-metadata"):
            path = "/" + detail_path if detail_path else "/"
        if urlsplit(path).path in ("", "/"):
            canonical_url = f"{CANONICAL_ORIGIN}/"

    response = render(
        request,
        "apps/shared/seo_metadata.html",
        {
            "title": title,
            "description": description,
            "canonical_url": canonical_url,
        },
    )
    response["Cache-Control"] = "public, max-age=300"
    return response


def _coastal_ferry_stop_ids():
    served_stop_ids = set()
    stop_times = CoastalFerryStopTime.objects.values_list(
        "stop_id",
        "stop__parent_stop_id",
    )
    for stop_id, parent_stop_id in stop_times:
        served_stop_ids.add(parent_stop_id or stop_id)
    return CoastalFerryStop.objects.filter(
        parent_stop__isnull=True,
        pk__in=served_stop_ids,
    ).values_list("pk", flat=True)


@require_GET
def sitemap_xml(request):
    ElementTree.register_namespace("", SITEMAP_NAMESPACE)
    root = ElementTree.Element(f"{{{SITEMAP_NAMESPACE}}}urlset")
    paths = (
        "/",
        "/cameras",
        "/delays",
        "/chain-ups",
        "/advisories",
        "/bulletins",
    )
    for path in paths:
        _add_sitemap_url(root, path)

    camera_ids = Webcam.objects.filter(should_appear=True).values_list("pk", flat=True)
    for camera_id in camera_ids:
        _add_sitemap_url(root, f"/cameras/{camera_id}")

    rest_stop_ids = RestStop.objects.values_list("pk", flat=True)
    for rest_stop_id in rest_stop_ids:
        _add_sitemap_url(root, f"/rest-stops/{rest_stop_id}")

    ferry_route_ids = Ferry.objects.order_by().values_list("route_id", flat=True).distinct()
    for route_id in ferry_route_ids:
        _add_sitemap_url(root, f"/ferries/{route_id}")

    for stop_id in _coastal_ferry_stop_ids():
        _add_sitemap_url(root, f"/ferries/coastal/{stop_id}")

    xml = ElementTree.tostring(root, encoding="utf-8", xml_declaration=True)
    return HttpResponse(xml, content_type="application/xml; charset=utf-8")


def _add_sitemap_url(root, path):
    url_element = ElementTree.SubElement(root, f"{{{SITEMAP_NAMESPACE}}}url")
    location = ElementTree.SubElement(url_element, f"{{{SITEMAP_NAMESPACE}}}loc")
    location.text = f"{CANONICAL_ORIGIN}{path}"
