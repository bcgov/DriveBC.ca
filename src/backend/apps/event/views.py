from apps.event.enums import EVENT_STATUS
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from rest_framework import viewsets


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.all().exclude(status=EVENT_STATUS.INACTIVE)
    serializer_class = EventSerializer
