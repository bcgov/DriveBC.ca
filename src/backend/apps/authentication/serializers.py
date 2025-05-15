from apps.authentication.models import DriveBCUser, FavouritedCameras, SavedRoutes
from apps.shared.serializers import SafeStringMixin
from rest_framework import serializers


class DriveBCUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriveBCUser


class FavouritedCamerasSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavouritedCameras
        fields = ('webcam',)


class SavedRoutesSerializer(SafeStringMixin, serializers.ModelSerializer):
    class Meta:
        model = SavedRoutes
        fields = (
            'id', 'label', 'distance', 'distance_unit',
            'start', 'start_point', 'end', 'end_point',
            'validated', 'thumbnail', 'route', 'criteria',
            'searchTimestamp', 'notification', 'notification_types',
            'notification_days', 'notification_start_date',
            'notification_end_date', 'notification_start_time',
            'notification_end_time',
        )

    def save(self):
        ''' Save the route with the requesting user. '''

        label = self.validated_data.get('label')
        user_id = self.context['request'].user.id
        existing_routes = SavedRoutes.objects.filter(label=label, user_id=user_id)
        if existing_routes.exists():
            raise serializers.ValidationError({
            'error': 'Label already exists for this user.'
        })

        request = self.context.get('request')
        super().save(user=request.user)
