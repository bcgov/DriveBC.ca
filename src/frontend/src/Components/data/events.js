export function getEvents() {
  return fetch(`//${process.env.REACT_APP_API_HOST}/api/events/`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
      .then((response) => response.json())
      .then((data) => data)
      .catch((error) => {
        console.log(error);
      });
}

const eventsDefault = [
  {
    'jurisdiction_url': 'https://tst-api.open511.gov.bc.ca/jurisdiction',
    'url': 'https://tst-api.open511.gov.bc.ca/events/drivebc.ca/DBC-3105',
    'id': 'drivebc.ca/DBC-3105',
    'headline': 'INCIDENT',
    'status': 'ACTIVE',
    'created': '2018-11-09T15:36:28-08:00',
    'updated': '2023-05-05T09:45:59-07:00',
    'description':
      'Highway 1 (on Vancouver Island). Road is CLOSED due to a collision between West Shore Pky and Finlayson Arm Rd (Langford). Expect Major delays due to congestion. Speed limit 60 km/h. TEST EVENT. Last updated Fri May 5 at 9:45 AM PDT. (DBC-3105)',
    '+ivr_message':
      'Highway 1 (on Vancouver Island). Road is CLOSED due to a collision between West Shore Pky and Finlayson Arm Rd (Langford). Expect Major delays due to congestion. Speed limit 60 kilometers per hour. Last updated Friday, May 5 at 9:45 AM.',
    '+linear_reference_km': 18.32,
    'schedule': {intervals: ['2023-05-05T16:45/']},
    'event_type': 'INCIDENT',
    'event_subtypes': ['HAZARD'],
    'severity': 'MINOR',
    'geography': {type: 'Point', coordinates: [-123.53782, 48.45787]},
    'roads': [{name: 'Highway 1', from: 'West Shore Pky', direction: 'NONE'}],
    'areas': [
      {
        url: 'http://www.geonames.org/8630140',
        name: 'Vancouver Island District',
        id: 'drivebc.ca/2',
      },
    ],
  },
  {
    'jurisdiction_url': 'https://tst-api.open511.gov.bc.ca/jurisdiction',
    'url': 'https://tst-api.open511.gov.bc.ca/events/drivebc.ca/DBC-3009',
    'id': 'drivebc.ca/DBC-3009',
    'headline': 'CONSTRUCTION',
    'status': 'ACTIVE',
    'created': '2018-11-07T19:39:50-08:00',
    'updated': '2022-12-02T09:20:52-08:00',
    'description':
      'Highway 97. Line painting between Stoner Pit Rd and Chamulak Rd (21 km south of Pineview). Green test 2. Last updated Fri Dec 2 at 9:20 AM PST. (DBC-3009)',
    '+ivr_message':
      'Highway 97. Line painting between Stoner Pit Rd and Chamulak Rd (21 km south of Pineview). Last updated Friday, December 2 at 9:20 AM.',
    '+linear_reference_km': 675.86,
    'schedule': {intervals: ['2022-12-02T17:20/']},
    'event_type': 'CONSTRUCTION',
    'event_subtypes': ['ROAD_MAINTENANCE'],
    'severity': 'MINOR',
    'geography': {type: 'Point', coordinates: [-122.663606, 53.623426]},
    'roads': [{name: 'Highway 97', from: 'Stoner Pit Rd', direction: 'NONE'}],
    'areas': [
      {
        url: 'http://www.geonames.org/8630131',
        name: 'Fort George District',
        id: 'drivebc.ca/9',
      },
    ],
  },
];

export default eventsDefault;
