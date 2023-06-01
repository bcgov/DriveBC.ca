import random
from datetime import datetime

import factory
from apps.route_planner.models import Route, TravelAdvisoryMessage
from django.contrib.auth.models import User
from django.contrib.gis.geos import LineString, Point
from factory.fuzzy import BaseFuzzyAttribute


class UserFactory(factory.django.DjangoModelFactory):
    FACTORY_FOR = User
    email = "admin@gmail.com"
    username = "admin"
    password = None


class FuzzyPoint(BaseFuzzyAttribute):
    def fuzz(self):
        return Point(random.uniform(-180.0, 180.0), random.uniform(-90.0, 90.0))


class FuzzyLineString(BaseFuzzyAttribute):
    def fuzz(self):
        x = [random.uniform(-180.0, 180.0), random.uniform(-90.0, 90.0)]
        y = [random.uniform(-180.0, 180.0), random.uniform(-90.0, 90.0)]
        return LineString([x, y])


class TravelAdvisoryMessageFactory(factory.django.DjangoModelFactory):
    title = factory.Faker("title")
    text = factory.Faker("text")
    author = factory.SubFactory(UserFactory)
    pub_date = factory.LazyFunction(datetime.now)

    class Meta:
        model = TravelAdvisoryMessage


class RouteFactory(factory.django.DjangoModelFactory):
    name = factory.Faker("title")
    email = factory.Faker("email")
    start_point = FuzzyPoint()
    destination_point = FuzzyPoint()
    route_points = FuzzyLineString()
    criteria = factory.fuzzy.FuzzyChoice(
        [choice[0] for choice in Route.CRITERIA_CHOICES]
    )
    srs_code = "34567"
    distance_unit = factory.fuzzy.FuzzyChoice(
        [choice[0] for choice in Route.DISTANCE_UNIT_CHOICES]
    )
    distance = factory.fuzzy.FuzzyFloat(low=0)
    route_time = factory.fuzzy.FuzzyFloat(low=0)

    class Meta:
        model = Route
