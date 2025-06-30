from django.contrib.gis.geos import Polygon

parsed_feed = [
    {
        'geometry': Polygon(
            [
                [-126.05000031, 51.9999999],
                [-126.09999975, 51.99999984],
                [-126.15000013, 51.99999993],
                [-126.19999963, 52.00000017],
                [-126.25000018, 52],
                [-126.05000031, 51.9999999],
            ]
        ),
        'id': 1,
        'name': 'Lower Mainland'
    }
]
