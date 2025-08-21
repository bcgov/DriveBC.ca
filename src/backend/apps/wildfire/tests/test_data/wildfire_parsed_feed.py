import datetime

from django.contrib.gis.geos import MultiPolygon, Point, Polygon

parsed_feed = [
    {
        'location': Point(-124.49688, 51.98847),
        'geometry': Polygon([
            (-124.4613, 52.04083),
            (-124.4619, 52.04068),
            (-124.4625, 52.04055),
            (-124.46308, 52.04041),
            (-124.46364, 52.04024),
            (-124.4613, 52.04083)
        ]),
        'id': 'C50627',
        'name': 'Martin Lake',
        'reported_date': datetime.date(2025, 6, 15),
        'size': 2244.5,
        'status': 'Under Control',
        'url': 'https://wildfiresituation.nrs.gov.bc.ca/incidents?fireYear=2025&incidentNumber=C50627'
    },
    {
        'location': Point(-122.98538, 52.0952),
        'geometry': Polygon([
             (-122.98506, 52.09575),
             (-122.98511, 52.09575),
             (-122.98515, 52.09574),
             (-122.98519, 52.09574),
             (-122.98524, 52.09573),
             (-122.98506, 52.09575)
        ]),
        'id': 'C50448',
        'name': 'C50448',
        'reported_date': datetime.date(2025, 6, 3),
        'size': 6,
        'status': 'Out',
        'url': 'https://wildfiresituation.nrs.gov.bc.ca/incidents?fireYear=2025&incidentNumber=C50448'
    },
    {
        'location': Point(-120.27537, 55.17803),
        'geometry': MultiPolygon([
            Polygon([
                (-120.25528, 55.17328),
                (-120.25429, 55.17298),
                (-120.25319, 55.17299),
                (-120.25169, 55.17252),
                (-120.25115, 55.17193),
                (-120.25528, 55.17328)
            ]),
            Polygon([
                (-120.0636, 55.31285),
                (-120.0635, 55.31323),
                (-120.06355, 55.31341),
                (-120.06383, 55.31345),
                (-120.06422, 55.31337),
                (-120.0636, 55.31285)
            ]),
            Polygon([
                (-120.04361, 55.32151),
                (-120.04371, 55.32162),
                (-120.04383, 55.32165),
                (-120.04402, 55.3214),
                (-120.04439, 55.32125),
                (-120.04361, 55.32151)
            ])
        ]),
        'id': 'G70422',
        'name': 'Kiskatinaw River',
        'reported_date': datetime.date(2025, 5, 28),
        'size': 26276.8,
        'status': 'Being Held',
        'url': 'https://wildfiresituation.nrs.gov.bc.ca/incidents?fireYear=2025&incidentNumber=G70422'
    }
]
