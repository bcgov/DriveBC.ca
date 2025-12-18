from apps.event.enums import EVENT_STATUS
from apps.event.models import Event
from django.db.models import Prefetch
from apps.shared.models import Area
from apps.event.serializers import EventPollingSerializer, EventSerializer
from apps.shared.enums import CacheKey, CacheTimeout
from apps.shared.views import CachedListModelMixin
from rest_framework import viewsets
from rest_framework.response import Response
from django.core.cache import cache


class EventAPI(CachedListModelMixin):
    queryset = Event.objects.all().exclude(status=EVENT_STATUS.INACTIVE)
    serializer_class = EventSerializer
    cache_key = CacheKey.EVENT_LIST
    cache_timeout = CacheTimeout.EVENT_LIST

class EventPollingAPI(EventAPI):
    serializer_class = EventPollingSerializer
    cache_key = CacheKey.EVENT_LIST_POLLING
    cache_timeout = CacheTimeout.EVENT_LIST_POLLING


class EventViewSet(EventAPI, viewsets.ReadOnlyModelViewSet):
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single event with caching.
        Cache key: event_detail_{pk}
        """
        pk = kwargs.get('pk')
        cache_key = f"event_detail_{pk}"
        
        # Try to get from cache
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        # If not in cache, get from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Cache the result
        cache.set(cache_key, data, CacheTimeout.EVENT_INDIVUDAL)
        
        return Response(data)


class EventPollingViewSet(EventPollingAPI, viewsets.ReadOnlyModelViewSet):
    
    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single event (polling) with caching.
        Cache key: event_polling_detail_{pk}
        """
        pk = kwargs.get('pk')
        cache_key = f"event_polling_detail_{pk}"
        
        # Try to get from cache
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        # If not in cache, get from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Cache the result
        cache.set(cache_key, data, CacheTimeout.EVENT_INDIVUDAL)
        
        return Response(data)


class EventTestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EventAPI.queryset
    serializer_class = EventAPI.serializer_class