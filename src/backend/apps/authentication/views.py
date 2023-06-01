from rest_framework import viewsets, serializers

from apps.authentication.models import DriveBCUser


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = DriveBCUser
        fields = ['url', 'username', 'email']


class UserViewSet(viewsets.ModelViewSet):
    queryset = DriveBCUser.objects.all()
    serializer_class = UserSerializer
