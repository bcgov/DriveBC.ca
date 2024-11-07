from django.db.models import fields

from .fields import SafeStringField


class SafeStringMixin:
    '''
    Swaps SafeStringField in for char/text fields for ModelSerializers

    This mixin alters the default model field -> DRF field mapping so that
    model char and text fields become SafeStringFields instead of the DRF
    CharField.

    NOTE: applying this mixin will cause SafeStringField to be used for ALL
    char/text fields, which may be broadly desireable for any serializer
    handling user input.  This behaviour may be overridden on a field basis in
    a serializer by declaring explicit fields.
    '''

    def build_standard_field(self, field_name, model_field):
        self.serializer_field_mapping[fields.CharField] = SafeStringField
        self.serializer_field_mapping[fields.TextField] = SafeStringField
        return super().build_standard_field(field_name, model_field)
