from rest_framework import serializers

from apps.authentication.models import FavouritedCameras


class FavouritedCamerasSerializer(serializers.ModelSerializer):

    class Meta:
        model = FavouritedCameras
        fields = ('webcam',)
