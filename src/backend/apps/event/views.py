from django.contrib.gis.geos import LineString, Point
from rest_framework.response import Response

from apps.event.enums import EVENT_STATUS, EVENT_TOLERANCE_DISTANCE
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from django.contrib.gis.measure import D
from rest_framework import viewsets


class EventAPI(CachedListModelMixin):
    queryset = Event.objects.all().exclude(status=EVENT_STATUS.INACTIVE)
    serializer_class = EventSerializer
    cache_key = CacheKey.DELAY_LIST
    cache_timeout = CacheTimeout.DELAY_LIST

    def get_filtered_queryset(self, geo_filter):
        # TODO: error handling and unit tests
        coords_list = geo_filter.split(',')
        points_list = []
        for i in range(0, len(coords_list), 2):
            points_list.append(Point(float(coords_list[i]), float(coords_list[i + 1])))

        return self.queryset.filter(
            location__distance_lte=(LineString(points_list), D(m=EVENT_TOLERANCE_DISTANCE))
        )

    def list(self, request, *args, **kwargs):
        route = self.request.query_params.get('route')
        if not route:
            return super().list(request, *args, **kwargs)

        return Response(
            self.fetch_list_data(
                self.get_filtered_queryset(route)
            )
        )


class EventViewSet(EventAPI, viewsets.ReadOnlyModelViewSet):
    pass


class EventTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EventAPI.queryset
    serializer_class = EventAPI.serializer_class
