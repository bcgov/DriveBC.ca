from django.contrib.gis.db import models
from django.core.exceptions import ValidationError


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SiteSettings(models.Model):
    disable_apis = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.__class__.objects.exists() and not self.pk:
            raise ValidationError(f"Only one instance of {self.__class__.__name__} allowed")

        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.pk)


class RouteGeometry(models.Model):
    id = models.CharField(max_length=128, primary_key=True)

    routes = models.MultiLineStringField()

    def __str__(self):
        return self.id


class Area(BaseModel):
    id = models.PositiveSmallIntegerField(primary_key=True)
    name = models.CharField(max_length=128)

    geometry = models.PolygonField()
