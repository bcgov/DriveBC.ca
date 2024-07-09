from rest_framework import serializers

from apps.authentication.models import FavouritedCameras, SavedRoutes


class FavouritedCamerasSerializer(serializers.ModelSerializer):

    class Meta:
        model = FavouritedCameras
        fields = ('webcam',)


class SavedRoutesSerializer(serializers.ModelSerializer):

    class Meta:
        model = SavedRoutes
        fields = ('id', 'route', 'start', 'start_point', 'end', 'end_point',
                  'validated')
