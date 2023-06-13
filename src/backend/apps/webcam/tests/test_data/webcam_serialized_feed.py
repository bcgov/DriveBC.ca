import datetime
import zoneinfo
from collections import OrderedDict

serialized_feed = OrderedDict([
    ('id', 2),
    ('camName', 'Coquihalla Great Bear Snowshed - N'),
    ('caption', 'Hwy 5, Great Bear Snowshed looking north.'),
    ('region', OrderedDict([
        ('group', 1),
        ('name', 'Vancouver Island')
    ])),
    ('highway', OrderedDict([
        ('number', '5'),
        ('locationDescription', 'Vancouver Island')
    ])),
    ('location', OrderedDict([
        ('latitude', 49.596374),
        ('longitude', -121.159832),
        ('elevation', 980)
    ])),
    ('regionGroup', OrderedDict([
        ('highwayGroup', 0),
        ('highwayCamOrder', 29)
    ])),
    ('orientation', 'N'),
    ('isOn', True),
    ('shouldAppear', True),
    ('isNew', False),
    ('isOnDemand', False),
    ('imageStats', OrderedDict([
        ('markedStale', False),
        ('markedDelayed', False),
        ('updatePeriodMean', 899),
        ('updatePeriodStdDev', 12),
        ('lastAttempt', OrderedDict([
            ('time', datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        ])),
        ('lastModified', OrderedDict([
            ('time', datetime.datetime(2023, 6, 9, 16, 58, 4, tzinfo=zoneinfo.ZoneInfo(key='America/Vancouver')))
        ]))
    ]))
])
