from apps.webcam.models import Webcam
from apps.webcam.serializers import WebcamSerializer
from djangochannelsrestframework import permissions
from djangochannelsrestframework.decorators import action
from djangochannelsrestframework.generics import GenericAsyncAPIConsumer
from djangochannelsrestframework.mixins import ListModelMixin, RetrieveModelMixin
from djangochannelsrestframework.observer import model_observer


class WebcamConsumer(
    ListModelMixin,
    RetrieveModelMixin,
    GenericAsyncAPIConsumer,
):
    queryset = Webcam.objects.all()
    serializer_class = WebcamSerializer
    permission_classes = (permissions.AllowAny,)

    @model_observer(Webcam)
    async def webcam_activity(self, message, **kwargs):
        await self.send_json(message)

    @action()
    async def subscribe_to_webcam_activity(self, request_id, **kwargs):
        await self.webcam_activity.subscribe()

    # If you want the data serialized instead of pk
    @webcam_activity.serializer
    def webcam_serialize(self, instance, action, **kwargs):
        """
        This block is evaluated before the data is sent over the channel layer
        this means you are unable to access information
        such as the user that it will be sent to.

        If you need the user info when serializing then you can do the serialization
        in the above method.
        """
        return WebcamSerializer(instance).data
