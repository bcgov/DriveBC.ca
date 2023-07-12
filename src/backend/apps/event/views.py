from apps.event.enums import EVENT_STATUS
from apps.event.models import Event
from apps.event.serializers import EventSerializer
from rest_framework import viewsets
from rest_framework.response import Response


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.filter(status=EVENT_STATUS.ACTIVE).order_by("id")
    serializer_class = EventSerializer

    def list(self, request, *args, **kwargs):
        # Use pagination only when offset or limit is in querystring
        if "limit" in request.query_params and "offset" in request.query_params:
            return super().list(request, *args, **kwargs)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"results": serializer.data})
