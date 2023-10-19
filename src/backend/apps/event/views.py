from apps.event.enums import EVENT_STATUS
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets


class EventAPI(CachedListModelMixin):
    queryset = Event.objects.all().exclude(status=EVENT_STATUS.INACTIVE)
    serializer_class = EventSerializer
    cache_key = CacheKey.DELAY_LIST
    cache_timeout = CacheTimeout.DELAY_LIST


class EventViewSet(EventAPI, viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class EventTestViewSet(viewsets.ModelViewSet):
    queryset = EventAPI.queryset
    serializer_class = EventAPI.serializer_class
