from apps.authentication.models import FavouritedCameras, SavedRoutes
from rest_framework import serializers


class FavouritedCamerasSerializer(serializers.ModelSerializer):

    class Meta:
        model = FavouritedCameras
        fields = ('webcam',)


class SavedRoutesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRoutes
        fields = ('id', 'label', 'distance', 'distance_unit',
                  'start', 'start_point', 'end', 'end_point',
                  'validated', 'thumbnail', 'route', 'criteria', 'searchTimestamp')

    def save(self):
        ''' Save the route with the requesting user. '''

        request = self.context.get('request')
        super().save(user=request.user)
