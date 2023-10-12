from apps.event.enums import EVENT_STATUS, EVENT_TOLERANCE_DISTANCE
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from django.contrib.gis.measure import D
from rest_framework import viewsets


class EventAPI(CachedListModelMixin):
    serializer_class = EventSerializer
    cache_key = CacheKey.DELAY_LIST
    cache_timeout = CacheTimeout.DELAY_LIST

    def get_queryset(self):
        queryset = Event.objects.all().exclude(status=EVENT_STATUS.INACTIVE)
        route = self.request.query_params.get('route')
        if route is not None:
            queryset = queryset.filter(
                location__distance_lte=(route, D(m=EVENT_TOLERANCE_DISTANCE))
            )
        return queryset


class EventViewSet(EventAPI, viewsets.ReadOnlyModelViewSet):
    pass


class EventTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EventAPI.queryset
    serializer_class = EventAPI.serializer_class
