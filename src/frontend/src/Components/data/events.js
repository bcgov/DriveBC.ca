import { point } from '@turf/helpers';

export async function getEvents() {
  return fetch('http://localhost:8000/api/events/', {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json())
    .then((data) => (
      data.events.map((event) => {
        let lat, lng;
        if (event.geography.type === 'Point') {
          lng = event.geography.coordinates[0];
          lat = event.geography.coordinates[1];
        } else {
          [lng, lat] = event.geography.coordinates[0];
        }

        try {
          return point([lng, lat], event, { id: event.id });
        } catch (e) { console.log(e); console.log(event); }
      })
    ))
    .catch((error) => {
      console.log(error);
    });
}


export default [
  {
    "url": "/events/drivebc.ca/153307",
    "id": "drivebc.ca/153307",
    "jurisdiction_url": "/jurisdiction",
    "headline": "Limited Visibility with Heavy Snowfall",
    "status": "ACTIVE",
    "description": "Closed at Border of British Columbia and Yukon because of Bridge Wash Out. Updated on Fri Jan 3 at 9:34 am PST. (ID# 153307) (Data by www.DriveBC.ca).",
    "+ivr_message": "Atlin Highway, Southbound. at Border of British Columbia and Yukon. The road is closed, because of a bridge wash out. Last updated on Friday January 3 at 9:34 am.",
    "schedule": {
      "intervals": [
        "2014-01-03T07:42/",
      ]
    },
    "event_type": "INCIDENT",
    "event_subtypes": [
      "HAZARD"
    ],
    "updated": "2014-01-03T07:54:35-07:00",
    "created": "2014-01-03T07:42:22-07:00",
    "severity": "MAJOR",
    "geography": {
      "type": "Point",
      "coordinates": [
        [
          -133.794711,
          60.000275
        ],
      ]
    },
    "roads": [
      {
        "direction": "BOTH",
        "from": "Border of British Columbia and Yukon",
        "name": "Atlin Highway",
        "to": "",
        "state": "CLOSED",
        "+delay": ""
      },
    ],
    "areas": [
      {
        "url": "http://www.geonames.org/8630133",
        "name": "Bulkley Stikine District",
        "id": "drivebc.ca/10"
      },
    ]
  },
  {
    "url": "/events/drivebc.ca/153307",
    "id": "drivebc.ca/153307",
    "jurisdiction_url": "/jurisdiction",
    "headline": "Limited Visibility with Heavy Snowfall",
    "status": "ACTIVE",
    "description": "Closed at Border of British Columbia and Yukon because of Bridge Wash Out. Updated on Fri Jan 3 at 9:34 am PST. (ID# 153307) (Data by www.DriveBC.ca).",
    "+ivr_message": "Atlin Highway, Southbound. at Border of British Columbia and Yukon. The road is closed, because of a bridge wash out. Last updated on Friday January 3 at 9:34 am.",
    "schedule": {
      "intervals": [
        "2014-01-03T07:42/",
      ]
    },
    "event_type": "INCIDENT",
    "event_subtypes": [
      "HAZARD"
    ],
    "updated": "2014-01-03T07:54:35-07:00",
    "created": "2014-01-03T07:42:22-07:00",
    "severity": "MAJOR",
    "geography": {
      "type": "Point",
      "coordinates": [
        [
          -123.144711,
          49.200275
        ],
      ]
    },
    "roads": [
      {
        "direction": "BOTH",
        "from": "Border of British Columbia and Yukon",
        "name": "Atlin Highway",
        "to": "",
        "state": "CLOSED",
        "+delay": ""
      },
    ],
    "areas": [
      {
        "url": "http://www.geonames.org/8630133",
        "name": "Bulkley Stikine District",
        "id": "drivebc.ca/10"
      },
    ]
  },
  {
    "url": "/events/drivebc.ca/153307",
    "id": "drivebc.ca/153307",
    "jurisdiction_url": "/jurisdiction",
    "headline": "Limited Visibility with Heavy Snowfall",
    "status": "ACTIVE",
    "description": "Closed at Border of British Columbia and Yukon because of Bridge Wash Out. Updated on Fri Jan 3 at 9:34 am PST. (ID# 153307) (Data by www.DriveBC.ca).",
    "+ivr_message": "Atlin Highway, Southbound. at Border of British Columbia and Yukon. The road is closed, because of a bridge wash out. Last updated on Friday January 3 at 9:34 am.",
    "schedule": {
      "intervals": [
        "2014-01-03T07:42/",
      ]
    },
    "event_type": "INCIDENT",
    "event_subtypes": [
      "HAZARD"
    ],
    "updated": "2014-01-03T07:54:35-07:00",
    "created": "2014-01-03T07:42:22-07:00",
    "severity": "MAJOR",
    "geography": {
      "type": "Point",
      "coordinates": [
        [
          -124.794711,
          49.000275
        ],
      ]
    },
    "roads": [
      {
        "direction": "BOTH",
        "from": "Border of British Columbia and Yukon",
        "name": "Atlin Highway",
        "to": "",
        "state": "CLOSED",
        "+delay": ""
      },
    ],
    "areas": [
      {
        "url": "http://www.geonames.org/8630133",
        "name": "Bulkley Stikine District",
        "id": "drivebc.ca/10"
      },
    ]
  },
];
