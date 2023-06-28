from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from rest_framework import viewsets
from rest_framework.response import Response


class WebcamViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Webcam.objects.all().order_by("highway", "highway_cam_order")
    serializer_class = WebcamSerializer
    filterset_fields = ["highway", "region"]

    def list(self, request, *args, **kwargs):
        # Use pagination only when offset or limit is in querystring
        if "limit" in request.query_params and "offset" in request.query_params:
            return super().list(request, *args, **kwargs)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"results": serializer.data})
