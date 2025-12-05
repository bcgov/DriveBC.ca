from apps.wildfire.models import Wildfire
from apps.wildfire.serializers import WildfireSerializer
from rest_framework import viewsets


class WildfireViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Wildfire.objects.filter(status='Out of Control')
    serializer_class = WildfireSerializer
