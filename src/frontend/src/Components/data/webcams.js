import { point } from '@turf/helpers';

export async function getWebcams() {
  return fetch('http://localhost:8000/api/webcams/', {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json())
    .then((data) => (
      data.webcams.map((webcam) => (
        point([webcam.location.longitude, webcam.location.latitude], {
          url: webcam.links.currentImage,
          id: webcam.id,
          name: webcam.camName,
          caption: webcam.caption,
          coords: {
            lng: webcam.location.longitude,
            lat: webcam.location.latitude
          },
        }, { id: webcam.id })
      ))
    ))
    .catch((error) => {
        console.log(error);
    });
}

export default [
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/2",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/2/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/2/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/2/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/2.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/2.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=2",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=2&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=2"
        },
        "id": 2,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Southern+Interior"
            },
            "name": "Southern Interior",
            "group": 1
        },
        "regionGroup": {
            "highwayGroup": 6,
            "highwayCamOrder": 16
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/5"
            },
            "number": 5,
            "locationDescription": "Coquihalla"
        },
        "camName": "Coquihalla Great Bear Snowshed - N",
        "caption": "Hwy 5, Great Bear Snowshed looking north.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.596374,-121.159832+(Coquihalla Great Bear Snowshed - N)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.596374,-121.159832&markers=color:blue%7C49.596374,-121.159832&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.596374,
            "longitude": -121.159832,
            "elevation": 980
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YHE-YKA5full.html"
                },
                "id": "YHE-YKA5full"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/2.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.378052,
                        "longitude": -121.341169
                    },
                    "max": {
                        "latitude": 49.596374,
                        "longitude": -121.159832
                    }
                },
                "imageMap": {
                    "2": {
                        "cam": 2,
                        "shape": "poly",
                        "coordinates": "105,6,126,30,143,20,120,0",
                        "latitude": 49.596374,
                        "longitude": -121.159832
                    },
                    "281": {
                        "cam": 281,
                        "shape": "poly",
                        "coordinates": "65,245,76,260,99,250,76,223",
                        "latitude": 49.378052,
                        "longitude": -121.341169
                    },
                    "282": {
                        "cam": 282,
                        "shape": "poly",
                        "coordinates": "40,250,62,277,75,260,64,245",
                        "latitude": 49.378052,
                        "longitude": -121.341169
                    },
                    "666": {
                        "cam": 666,
                        "shape": "poly",
                        "coordinates": "98,115,117,116,131,95,87,95",
                        "latitude": 49.5084162,
                        "longitude": -121.1989411
                    },
                    "667": {
                        "cam": 667,
                        "shape": "poly",
                        "coordinates": "82,137,127,136,116,117,98,116",
                        "latitude": 49.5084162,
                        "longitude": -121.1989411
                    },
                    "674": {
                        "cam": 674,
                        "shape": "poly",
                        "coordinates": "79,60,118,60,124,42,79,42",
                        "latitude": 49.575593,
                        "longitude": -121.179854
                    },
                    "675": {
                        "cam": 675,
                        "shape": "poly",
                        "coordinates": "79,84,125,84,117,60,79,59",
                        "latitude": 49.575593,
                        "longitude": -121.179854
                    },
                    "734": {
                        "cam": 734,
                        "shape": "poly",
                        "coordinates": "87,19,111,41,124,31,104,7",
                        "latitude": 49.596374,
                        "longitude": -121.159832
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "a5ad85bd482477f9a850431e89a41a6d",
            "lastAttempt": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "lastModified": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 1080,
            "updatePeriodStdDev": 181,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/5",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/5/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/5/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/5/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/5.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/5.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=5",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=5&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=5"
        },
        "id": 5,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Southern+Interior"
            },
            "name": "Southern Interior",
            "group": 1
        },
        "regionGroup": {
            "highwayGroup": 1,
            "highwayCamOrder": 23
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/3"
            },
            "number": 3,
            "locationDescription": ""
        },
        "camName": "Kootenay Pass",
        "caption": "Hwy 3, Salmo Creston Highway Summit, looking east.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "E",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.058727,-117.040771+(Kootenay Pass)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.058727,-117.040771&markers=color:blue%7C49.058727,-117.040771&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.058727,
            "longitude": -117.040771,
            "elevation": 1781
        },
        "weather": {
            "observation": {
                "links": {
                    "self": "https://tst.drivebc.ca/api/weather/observations/39121?format=json"
                },
                "station": 39121
            },
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YHE-WRTfull.html"
                },
                "id": "YHE-WRTfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/5.jpg",
            "isDisplayedHorizontal": true,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.010617,
                        "longitude": -118.776123
                    },
                    "max": {
                        "latitude": 49.2888559,
                        "longitude": -117.040771
                    }
                },
                "imageMap": {
                    "5": {
                        "cam": 5,
                        "shape": "rect",
                        "coordinates": "422,77,462,102",
                        "latitude": 49.058727,
                        "longitude": -117.040771
                    },
                    "157": {
                        "cam": 157,
                        "shape": "rect",
                        "coordinates": "167,115,193,145",
                        "latitude": 49.100702,
                        "longitude": -118.2226121
                    },
                    "158": {
                        "cam": 158,
                        "shape": "rect",
                        "coordinates": "363,41,401,64",
                        "latitude": 49.191666,
                        "longitude": -117.285096
                    },
                    "160": {
                        "cam": 160,
                        "shape": "rect",
                        "coordinates": "235,89,272,110",
                        "latitude": 49.0783529,
                        "longitude": -117.8158228
                    },
                    "162": {
                        "cam": 162,
                        "shape": "rect",
                        "coordinates": "272,14,309,38",
                        "latitude": 49.2888559,
                        "longitude": -117.6619209
                    },
                    "174": {
                        "cam": 174,
                        "shape": "rect",
                        "coordinates": "179,45,220,70",
                        "latitude": 49.257354,
                        "longitude": -118.026915
                    },
                    "247": {
                        "cam": 247,
                        "shape": "rect",
                        "coordinates": "90,75,116,109",
                        "latitude": 49.145152,
                        "longitude": -118.534594
                    },
                    "265": {
                        "cam": 265,
                        "shape": "poly",
                        "coordinates": "30,154,30,125,54,143",
                        "latitude": 49.010617,
                        "longitude": -118.776123
                    },
                    "266": {
                        "cam": 266,
                        "shape": "poly",
                        "coordinates": "53,143,78,125,78,153",
                        "latitude": 49.010617,
                        "longitude": -118.776123
                    },
                    "307": {
                        "cam": 307,
                        "shape": "rect",
                        "coordinates": "282,83,317,104",
                        "latitude": 49.089964,
                        "longitude": -117.632644
                    },
                    "334": {
                        "cam": 334,
                        "shape": "poly",
                        "coordinates": "332,53,336,36,298,38,298,66",
                        "latitude": 49.236003,
                        "longitude": -117.520886
                    },
                    "470": {
                        "cam": 470,
                        "shape": "poly",
                        "coordinates": "245,85,266,78,255,48,235,53",
                        "latitude": 49.17635,
                        "longitude": -117.86110278
                    },
                    "626": {
                        "cam": 626,
                        "shape": "rect",
                        "coordinates": "377,5,412,35",
                        "latitude": 49.27825,
                        "longitude": -117.21182
                    },
                    "783": {
                        "cam": 783,
                        "shape": "poly",
                        "coordinates": "39,165,54,144,71,165",
                        "latitude": 49.010617,
                        "longitude": -118.776123
                    },
                    "793": {
                        "cam": 793,
                        "shape": "poly",
                        "coordinates": "341,80,368,80,344,37,331,57",
                        "latitude": 49.187798,
                        "longitude": -117.420674
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "66bdc929bb883cf144d8a3f6bc88896c",
            "lastAttempt": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "lastModified": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 1080,
            "updatePeriodStdDev": 181,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/6",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/6/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/6/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/6/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/6.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/6.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=6",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=6&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=6"
        },
        "id": 6,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Northern"
            },
            "name": "Northern",
            "group": 0
        },
        "regionGroup": {
            "highwayGroup": 5,
            "highwayCamOrder": 10
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/16"
            },
            "number": 16,
            "locationDescription": ""
        },
        "camName": "Smithers - N",
        "caption": "Hwy 16 in Smithers at Main Street, looking north.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=54.782104,-127.1667312+(Smithers - N)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=54.782104,-127.1667312&markers=color:blue%7C54.782104,-127.1667312&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 54.782104,
            "longitude": -127.1667312,
            "elevation": 497
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YPR-WJWfull.html"
                },
                "id": "YPR-WJWfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/6.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 54.782104,
                        "longitude": -127.325592
                    },
                    "max": {
                        "latitude": 54.941205,
                        "longitude": -127.1667312
                    }
                },
                "imageMap": {
                    "6": {
                        "cam": 6,
                        "shape": "poly",
                        "coordinates": "82,247,100,262,115,240",
                        "latitude": 54.782104,
                        "longitude": -127.1667312
                    },
                    "336": {
                        "cam": 336,
                        "shape": "rect",
                        "coordinates": "39,29,110,63",
                        "latitude": 54.941205,
                        "longitude": -127.325592
                    },
                    "701": {
                        "cam": 701,
                        "shape": "poly",
                        "coordinates": "101,264,91,288,125,279",
                        "latitude": 54.782104,
                        "longitude": -127.1667312
                    },
                    "702": {
                        "cam": 702,
                        "shape": "poly",
                        "coordinates": "119,244,101,264,127,275",
                        "latitude": 54.782104,
                        "longitude": -127.1667312
                    },
                    "703": {
                        "cam": 703,
                        "shape": "poly",
                        "coordinates": "72,259,80,286,101,264",
                        "latitude": 54.782104,
                        "longitude": -127.1667312
                    },
                    "799": {
                        "cam": 799,
                        "shape": "poly",
                        "coordinates": "60,214,78,229,93,207",
                        "latitude": 54.789028,
                        "longitude": -127.176373
                    },
                    "800": {
                        "cam": 800,
                        "shape": "poly",
                        "coordinates": "78,230,68,254,102,245",
                        "latitude": 54.789028,
                        "longitude": -127.176373
                    },
                    "823": {
                        "cam": 823,
                        "shape": "poly",
                        "coordinates": "55,223,55,247,79,229",
                        "latitude": 54.789028,
                        "longitude": -127.176373
                    },
                    "859": {
                        "cam": 859,
                        "shape": "poly",
                        "coordinates": "97,210,79,230,105,241",
                        "latitude": 54.789028,
                        "longitude": -127.176373
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "b86051e870c362e06401b730f7c9d98a",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 1077,
            "updatePeriodStdDev": 182,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/7",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/7/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/7/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/7/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/7.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/7.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=7",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=7&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=7"
        },
        "id": 7,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Lower+Mainland"
            },
            "name": "Lower Mainland",
            "group": 2
        },
        "regionGroup": {
            "highwayGroup": 3,
            "highwayCamOrder": 32
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/1"
            },
            "number": 1,
            "locationDescription": "Fraser Valley"
        },
        "camName": "Cole Road - E",
        "caption": "Hwy 1 at Cole Road Rest Area, looking east.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "E",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.0575,-122.177+(Cole Road - E)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.0575,-122.177&markers=color:blue%7C49.0575,-122.177&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.0575,
            "longitude": -122.177,
            "elevation": 12
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-YHEfull.html"
                },
                "id": "YVR-YHEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/7.jpg",
            "isDisplayedHorizontal": true,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.033129,
                        "longitude": -122.381465
                    },
                    "max": {
                        "latitude": 49.057775,
                        "longitude": -122.177
                    }
                },
                "imageMap": {
                    "7": {
                        "cam": 7,
                        "shape": "poly",
                        "coordinates": "400,58,417,79,441,67,412,37",
                        "latitude": 49.0575,
                        "longitude": -122.177
                    },
                    "204": {
                        "cam": 204,
                        "shape": "poly",
                        "coordinates": "259,121,235,130,234,105,259,112",
                        "latitude": 49.034253,
                        "longitude": -122.293112
                    },
                    "223": {
                        "cam": 223,
                        "shape": "poly",
                        "coordinates": "263,122,282,131,282,104,263,114",
                        "latitude": 49.034253,
                        "longitude": -122.293112
                    },
                    "224": {
                        "cam": 224,
                        "shape": "poly",
                        "coordinates": "277,86,244,85,258,112,265,113",
                        "latitude": 49.034253,
                        "longitude": -122.293112
                    },
                    "225": {
                        "cam": 225,
                        "shape": "poly",
                        "coordinates": "257,123,248,147,275,147,264,122",
                        "latitude": 49.034253,
                        "longitude": -122.293112
                    },
                    "268": {
                        "cam": 268,
                        "shape": "poly",
                        "coordinates": "217,88,184,87,198,114,205,115",
                        "latitude": 49.037659,
                        "longitude": -122.337231
                    },
                    "269": {
                        "cam": 269,
                        "shape": "poly",
                        "coordinates": "204,123,230,131,230,106,204,115",
                        "latitude": 49.037659,
                        "longitude": -122.337231
                    },
                    "270": {
                        "cam": 270,
                        "shape": "poly",
                        "coordinates": "197,124,188,148,215,148,204,123",
                        "latitude": 49.037659,
                        "longitude": -122.337231
                    },
                    "271": {
                        "cam": 271,
                        "shape": "poly",
                        "coordinates": "198,123,172,133,171,107,198,114",
                        "latitude": 49.037659,
                        "longitude": -122.337231
                    },
                    "403": {
                        "cam": 403,
                        "shape": "poly",
                        "coordinates": "299,122,283,132,283,105,299,113",
                        "latitude": 49.033129,
                        "longitude": -122.266335
                    },
                    "404": {
                        "cam": 404,
                        "shape": "poly",
                        "coordinates": "303,123,331,131,331,105,303,115",
                        "latitude": 49.033129,
                        "longitude": -122.266335
                    },
                    "405": {
                        "cam": 405,
                        "shape": "poly",
                        "coordinates": "315,87,282,86,296,113,303,114",
                        "latitude": 49.033129,
                        "longitude": -122.266335
                    },
                    "406": {
                        "cam": 406,
                        "shape": "poly",
                        "coordinates": "296,124,287,148,314,148,303,123",
                        "latitude": 49.033129,
                        "longitude": -122.266335
                    },
                    "461": {
                        "cam": 461,
                        "shape": "poly",
                        "coordinates": "154,44,121,43,135,70,142,71",
                        "latitude": 49.057775,
                        "longitude": -122.381465
                    },
                    "462": {
                        "cam": 462,
                        "shape": "poly",
                        "coordinates": "136,80,109,90,109,62,136,71",
                        "latitude": 49.057775,
                        "longitude": -122.381465
                    },
                    "463": {
                        "cam": 463,
                        "shape": "poly",
                        "coordinates": "139,72,139,79,169,93,169,63",
                        "latitude": 49.057775,
                        "longitude": -122.381465
                    },
                    "464": {
                        "cam": 464,
                        "shape": "poly",
                        "coordinates": "135,81,126,105,153,105,142,80",
                        "latitude": 49.057775,
                        "longitude": -122.381465
                    },
                    "656": {
                        "cam": 656,
                        "shape": "rect",
                        "coordinates": "376,69,402,100,416,80,401,60",
                        "latitude": 49.0575,
                        "longitude": -122.177
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "f95d7c7260208a85bf90ca65c2f7c76e",
            "lastAttempt": {
                "time": "2022-11-29 17:00:48",
                "seconds": 790
            },
            "lastModified": {
                "time": "2022-11-29 17:00:48",
                "seconds": 790
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 1080,
            "updatePeriodStdDev": 174,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/8",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/8/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/8/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/8/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/8.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/8.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=8",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=8&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=8"
        },
        "id": 8,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Vancouver+Island"
            },
            "name": "Vancouver Island",
            "group": 3
        },
        "regionGroup": {
            "highwayGroup": 1,
            "highwayCamOrder": 29
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/1"
            },
            "number": 1,
            "locationDescription": "Vancouver Island - Cobble Hill to Goldstream"
        },
        "camName": "Malahat Drive - N",
        "caption": "Hwy 1 at South Shawnigan Lake Road, looking north.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=48.561231,-123.569743+(Malahat Drive - N)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=48.561231,-123.569743&markers=color:blue%7C48.561231,-123.569743&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 48.561231,
            "longitude": -123.569743,
            "elevation": 327
        },
        "weather": {
            "observation": {
                "links": {
                    "self": "https://tst.drivebc.ca/api/weather/observations/62091?format=json"
                },
                "station": 62091
            },
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YYJ-YZTfull.html"
                },
                "id": "YYJ-YZTfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/8.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 48.478235,
                        "longitude": -123.569743
                    },
                    "max": {
                        "latitude": 48.567912,
                        "longitude": -123.542123
                    }
                },
                "imageMap": {
                    "8": {
                        "cam": 8,
                        "shape": "poly",
                        "coordinates": "27,94,31,95,46,75,8,75",
                        "latitude": 48.561231,
                        "longitude": -123.569743
                    },
                    "272": {
                        "cam": 272,
                        "shape": "poly",
                        "coordinates": "3,80,3,111,25,94,21,89",
                        "latitude": 48.561231,
                        "longitude": -123.569743
                    },
                    "273": {
                        "cam": 273,
                        "shape": "poly",
                        "coordinates": "24,95,18,117,45,105,32,95",
                        "latitude": 48.561231,
                        "longitude": -123.569743
                    },
                    "424": {
                        "cam": 424,
                        "shape": "poly",
                        "coordinates": "84,55,77,29,57,40,61,55",
                        "latitude": 48.567912,
                        "longitude": -123.542123
                    },
                    "427": {
                        "cam": 427,
                        "shape": "poly",
                        "coordinates": "60,55,56,41,31,39,39,67",
                        "latitude": 48.567912,
                        "longitude": -123.542123
                    },
                    "909": {
                        "cam": 909,
                        "shape": "poly",
                        "coordinates": "39,132,31,155,65,147,50,129",
                        "latitude": 48.53235,
                        "longitude": -123.560143
                    },
                    "910": {
                        "cam": 910,
                        "shape": "poly",
                        "coordinates": "23,117,38,132,51,129,57,108",
                        "latitude": 48.53235,
                        "longitude": -123.560143
                    },
                    "926": {
                        "cam": 926,
                        "shape": "poly",
                        "coordinates": "28,157,41,179,51,179,65,157",
                        "latitude": 48.507134,
                        "longitude": -123.556923
                    },
                    "927": {
                        "cam": 927,
                        "shape": "poly",
                        "coordinates": "39,180,31,200,63,200,51,180",
                        "latitude": 48.507134,
                        "longitude": -123.556923
                    },
                    "974": {
                        "cam": 974,
                        "shape": "poly",
                        "coordinates": "32,213,51,229,62,225,62,203",
                        "latitude": 48.478235,
                        "longitude": -123.548597
                    },
                    "975": {
                        "cam": 975,
                        "shape": "poly",
                        "coordinates": "52,229,49,254,82,242,63,226",
                        "latitude": 48.478235,
                        "longitude": -123.548597
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "63cab5d9b6393ef27b32ef04a163ed9c",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 720,
            "updatePeriodStdDev": 113,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/9",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/9/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/9/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/9/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/9.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/9.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=9",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=9&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=9"
        },
        "id": 9,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Vancouver+Island"
            },
            "name": "Vancouver Island",
            "group": 3
        },
        "regionGroup": {
            "highwayGroup": 7,
            "highwayCamOrder": 36
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/19"
            },
            "number": 19,
            "locationDescription": ""
        },
        "camName": "Nanaimo Parkway",
        "caption": "Hwy 19 at College Drive, looking north.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.153005,-123.97196+(Nanaimo Parkway)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.153005,-123.97196&markers=color:blue%7C49.153005,-123.97196&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.153005,
            "longitude": -123.97196,
            "elevation": 130
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YYJ-YZTfull.html"
                },
                "id": "YYJ-YZTfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/9.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.153005,
                        "longitude": -124.052334
                    },
                    "max": {
                        "latitude": 49.234481,
                        "longitude": -123.97196
                    }
                },
                "imageMap": {
                    "9": {
                        "cam": 9,
                        "shape": "rect",
                        "coordinates": "23,268,67,299",
                        "latitude": 49.153005,
                        "longitude": -123.97196
                    },
                    "641": {
                        "cam": 641,
                        "shape": "poly",
                        "coordinates": "54,61,86,59,70,78",
                        "latitude": 49.234481,
                        "longitude": -124.052334
                    },
                    "642": {
                        "cam": 642,
                        "shape": "poly",
                        "coordinates": "50,70,70,81,51,96",
                        "latitude": 49.234481,
                        "longitude": -124.052334
                    },
                    "643": {
                        "cam": 643,
                        "shape": "poly",
                        "coordinates": "69,81,91,67,91,92",
                        "latitude": 49.234481,
                        "longitude": -124.052334
                    },
                    "644": {
                        "cam": 644,
                        "shape": "poly",
                        "coordinates": "57,102,70,82,88,97",
                        "latitude": 49.234481,
                        "longitude": -124.052334
                    },
                    "645": {
                        "cam": 645,
                        "shape": "poly",
                        "coordinates": "56,183,86,181,73,204",
                        "latitude": 49.188466,
                        "longitude": -124.002467
                    },
                    "646": {
                        "cam": 646,
                        "shape": "poly",
                        "coordinates": "50,191,71,203,51,219",
                        "latitude": 49.188466,
                        "longitude": -124.002467
                    },
                    "647": {
                        "cam": 647,
                        "shape": "poly",
                        "coordinates": "72,205,93,190,94,216",
                        "latitude": 49.188466,
                        "longitude": -124.002467
                    },
                    "648": {
                        "cam": 648,
                        "shape": "poly",
                        "coordinates": "57,224,71,204,89,224",
                        "latitude": 49.188466,
                        "longitude": -124.002467
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "6e737b41d489fe4d75af8c6a34b9e515",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 360,
            "updatePeriodStdDev": 0,
            "fetchMean": 5
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/10",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/10/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/10/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/10/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/10.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/10.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=10",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=10&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=10"
        },
        "id": 10,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Northern"
            },
            "name": "Northern",
            "group": 0
        },
        "regionGroup": {
            "highwayGroup": 12,
            "highwayCamOrder": 16
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/97"
            },
            "number": 97,
            "locationDescription": "Northern Region"
        },
        "camName": "South Taylor Hill - N",
        "caption": "Hwy 97 at South Taylor Hill, 20 km south of Fort St John, looking north.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=56.09491,-120.642756+(South Taylor Hill - N)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=56.09491,-120.642756&markers=color:blue%7C56.09491,-120.642756&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 56.09491,
            "longitude": -120.642756,
            "elevation": 535
        },
        "weather": {
            "observation": {
                "links": {
                    "self": "https://tst.drivebc.ca/api/weather/observations/44092?format=json"
                },
                "station": 44092
            },
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/ydq-yxyfull_e.html"
                },
                "id": "ydq-yxyfull_e"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/10.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 56.09491,
                        "longitude": -120.681289
                    },
                    "max": {
                        "latitude": 56.152342,
                        "longitude": -120.642756
                    }
                },
                "imageMap": {
                    "10": {
                        "cam": 10,
                        "shape": "poly",
                        "coordinates": "66,159,85,162,98,142,59,139",
                        "latitude": 56.09491,
                        "longitude": -120.642756
                    },
                    "288": {
                        "cam": 288,
                        "shape": "poly",
                        "coordinates": "66,136,97,130,80,108,67,111",
                        "latitude": 56.130577,
                        "longitude": -120.670104
                    },
                    "819": {
                        "cam": 819,
                        "shape": "poly",
                        "coordinates": "0,22,24,33,28,31,31,4",
                        "latitude": 56.152342,
                        "longitude": -120.681289
                    },
                    "820": {
                        "cam": 820,
                        "shape": "poly",
                        "coordinates": "2,55,25,41,25,34,2,29",
                        "latitude": 56.152342,
                        "longitude": -120.681289
                    },
                    "821": {
                        "cam": 821,
                        "shape": "poly",
                        "coordinates": "26,35,26,43,55,38,39,14",
                        "latitude": 56.152342,
                        "longitude": -120.681289
                    },
                    "822": {
                        "cam": 822,
                        "shape": "poly",
                        "coordinates": "20,44,19,70,50,47,25,43",
                        "latitude": 56.152342,
                        "longitude": -120.681289
                    },
                    "979": {
                        "cam": 979,
                        "shape": "poly",
                        "coordinates": "51,184,88,190,84,162,66,160",
                        "latitude": 56.09491,
                        "longitude": -120.642756
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "0b17eaa62a97d02c0fa0eca25dcdaa5f",
            "lastAttempt": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "lastModified": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 720,
            "updatePeriodStdDev": 0,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/11",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/11/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/11/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/11/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/11.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/11.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=11",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=11&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=11"
        },
        "id": 11,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Southern+Interior"
            },
            "name": "Southern Interior",
            "group": 1
        },
        "regionGroup": {
            "highwayGroup": 0,
            "highwayCamOrder": 42
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/1"
            },
            "number": 1,
            "locationDescription": "Trans Canada Highway"
        },
        "camName": "Revelstoke",
        "caption": "Hwy 1 at east end of Columbia River Bridge in Revelstoke, looking east.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "NE",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=51.0072615,-118.2183304+(Revelstoke)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=51.0072615,-118.2183304&markers=color:blue%7C51.0072615,-118.2183304&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 51.0072615,
            "longitude": -118.2183304,
            "elevation": 450
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YKA-WZGfull.html"
                },
                "id": "YKA-WZGfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/11.jpg",
            "isDisplayedHorizontal": true,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 50.967548,
                        "longitude": -118.359165
                    },
                    "max": {
                        "latitude": 51.0072615,
                        "longitude": -118.2183304
                    }
                },
                "imageMap": {
                    "11": {
                        "cam": 11,
                        "shape": "poly",
                        "coordinates": "427,30,429,70,394,56,394,43",
                        "latitude": 51.0072615,
                        "longitude": -118.2183304
                    },
                    "296": {
                        "cam": 296,
                        "shape": "poly",
                        "coordinates": "120,80,134,124,101,125,93,97",
                        "latitude": 50.967548,
                        "longitude": -118.359165
                    },
                    "517": {
                        "cam": 517,
                        "shape": "poly",
                        "coordinates": "92,97,98,124,66,138,57,97",
                        "latitude": 50.967548,
                        "longitude": -118.359165
                    },
                    "584": {
                        "cam": 584,
                        "shape": "poly",
                        "coordinates": "389,40,373,63,352,40",
                        "latitude": 51.003183,
                        "longitude": -118.225953
                    },
                    "585": {
                        "cam": 585,
                        "shape": "poly",
                        "coordinates": "371,63,351,80,344,50",
                        "latitude": 51.003183,
                        "longitude": -118.225953
                    },
                    "586": {
                        "cam": 586,
                        "shape": "poly",
                        "coordinates": "388,48,390,77,375,64",
                        "latitude": 51.003183,
                        "longitude": -118.225953
                    },
                    "587": {
                        "cam": 587,
                        "shape": "poly",
                        "coordinates": "390,83,355,83,373,64",
                        "latitude": 51.003183,
                        "longitude": -118.225953
                    },
                    "668": {
                        "cam": 668,
                        "shape": "poly",
                        "coordinates": "313,72,319,99,287,113,278,72",
                        "latitude": 50.991627,
                        "longitude": -118.262827
                    },
                    "669": {
                        "cam": 669,
                        "shape": "poly",
                        "coordinates": "334,58,347,98,321,99,314,74",
                        "latitude": 50.991627,
                        "longitude": -118.262827
                    },
                    "697": {
                        "cam": 697,
                        "shape": "poly",
                        "coordinates": "208,84,214,111,182,125,173,84",
                        "latitude": 50.980576,
                        "longitude": -118.302258
                    },
                    "698": {
                        "cam": 698,
                        "shape": "poly",
                        "coordinates": "236,68,250,112,216,113,209,85",
                        "latitude": 50.980576,
                        "longitude": -118.302258
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "24d0816742f793c0366f9aa3148ba404",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 360,
            "updatePeriodStdDev": 0,
            "fetchMean": 3
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/12",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/12/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/12/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/12/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/12.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/12.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=12",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=12&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=12"
        },
        "id": 12,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Southern+Interior"
            },
            "name": "Southern Interior",
            "group": 1
        },
        "regionGroup": {
            "highwayGroup": 0,
            "highwayCamOrder": 31
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/1"
            },
            "number": 1,
            "locationDescription": "Trans Canada Highway"
        },
        "camName": "Three Valley Gap - E",
        "caption": "Hwy 1, 20 km west of Revelstoke, looking east.",
        "credit": "",
        "dbcMark": "DriveBC.ca",
        "orientation": "E",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=50.9276578,-118.4746848+(Three Valley Gap - E)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=50.9276578,-118.4746848&markers=color:blue%7C50.9276578,-118.4746848&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 50.9276578,
            "longitude": -118.4746848,
            "elevation": 510
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YKA-WZGfull.html"
                },
                "id": "YKA-WZGfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/12.jpg",
            "isDisplayedHorizontal": true,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 50.8916914,
                        "longitude": -118.8683837
                    },
                    "max": {
                        "latitude": 50.99443,
                        "longitude": -118.4746848
                    }
                },
                "imageMap": {
                    "12": {
                        "cam": 12,
                        "shape": "poly",
                        "coordinates": "460,151,466,131,502,113,507,157",
                        "latitude": 50.9276578,
                        "longitude": -118.4746848
                    },
                    "59": {
                        "cam": 59,
                        "shape": "poly",
                        "coordinates": "96,145,78,114,100,100,119,132",
                        "latitude": 50.8916914,
                        "longitude": -118.8683837
                    },
                    "431": {
                        "cam": 431,
                        "shape": "poly",
                        "coordinates": "120,132,102,100,127,86,144,118",
                        "latitude": 50.8916914,
                        "longitude": -118.8683837
                    },
                    "603": {
                        "cam": 603,
                        "shape": "poly",
                        "coordinates": "321,26,313,9,345,2,341,33",
                        "latitude": 50.99443,
                        "longitude": -118.6964464
                    },
                    "604": {
                        "cam": 604,
                        "shape": "poly",
                        "coordinates": "297,46,286,12,313,11,319,26",
                        "latitude": 50.99443,
                        "longitude": -118.6964464
                    },
                    "670": {
                        "cam": 670,
                        "shape": "poly",
                        "coordinates": "423,90,411,71,449,49,459,71",
                        "latitude": 50.967606,
                        "longitude": -118.506936
                    },
                    "671": {
                        "cam": 671,
                        "shape": "poly",
                        "coordinates": "436,113,424,91,459,72,471,92",
                        "latitude": 50.967606,
                        "longitude": -118.506936
                    },
                    "672": {
                        "cam": 672,
                        "shape": "poly",
                        "coordinates": "391,89,361,69,383,50,412,54",
                        "latitude": 50.971122,
                        "longitude": -118.587728
                    },
                    "673": {
                        "cam": 673,
                        "shape": "poly",
                        "coordinates": "360,69,341,46,373,20,383,49",
                        "latitude": 50.971122,
                        "longitude": -118.587728
                    },
                    "736": {
                        "cam": 736,
                        "shape": "poly",
                        "coordinates": "421,132,451,114,467,133,459,151",
                        "latitude": 50.9276578,
                        "longitude": -118.4746848
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "7a2c06f275f154dc6eff33f7306089e1",
            "lastAttempt": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "lastModified": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 721,
            "updatePeriodStdDev": 180,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/13",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/13/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/13/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/13/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/13.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/13.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=13",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=13&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=13"
        },
        "id": 13,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Border+Cams"
            },
            "name": "Border Cams",
            "group": 4
        },
        "regionGroup": {
            "highwayGroup": 4,
            "highwayCamOrder": 5
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/99"
            },
            "number": 99,
            "locationDescription": "Peace Arch Border Crossing"
        },
        "camName": "Peace Arch",
        "caption": "Hwy 99 at Peace Arch border crossing, looking north.",
        "credit": "For current traffic backup conditions at the border, visit <a href=\"http://www.th.gov.bc.ca/ATIS/\">http://www.th.gov.bc.ca/ATIS/</a>",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.001268,-122.756658+(Peace Arch)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.001268,-122.756658&markers=color:blue%7C49.001268,-122.756658&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.001268,
            "longitude": -122.756658,
            "elevation": 10
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-YHEfull.html"
                },
                "id": "YVR-YHEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/13.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.001268,
                        "longitude": -122.758119
                    },
                    "max": {
                        "latitude": 49.016575,
                        "longitude": -122.7350798
                    }
                },
                "imageMap": {
                    "13": {
                        "cam": 13,
                        "shape": "poly",
                        "coordinates": "24,224,12,204,42,189,53,203",
                        "latitude": 49.001268,
                        "longitude": -122.756658
                    },
                    "14": {
                        "cam": 14,
                        "shape": "rect",
                        "coordinates": "21,149,49,169",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "15": {
                        "cam": 15,
                        "shape": "rect",
                        "coordinates": "94,157,120,182",
                        "latitude": 49.00304,
                        "longitude": -122.735633
                    },
                    "16": {
                        "cam": 16,
                        "shape": "rect",
                        "coordinates": "117,126,138,155",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    },
                    "212": {
                        "cam": 212,
                        "shape": "poly",
                        "coordinates": "17,89,26,87,29,61,4,68",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "444": {
                        "cam": 444,
                        "shape": "poly",
                        "coordinates": "20,112,39,104,27,76,9,84",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "445": {
                        "cam": 445,
                        "shape": "rect",
                        "coordinates": "21,169,47,189",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "447": {
                        "cam": 447,
                        "shape": "poly",
                        "coordinates": "107,112,130,112,120,89,114,89",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "477": {
                        "cam": 477,
                        "shape": "poly",
                        "coordinates": "114,88,120,88,129,64,105,64",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "539": {
                        "cam": 539,
                        "shape": "poly",
                        "coordinates": "1,113,21,98,18,89,1,87",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "562": {
                        "cam": 562,
                        "shape": "poly",
                        "coordinates": "90,100,112,91,112,86,90,76",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "563": {
                        "cam": 563,
                        "shape": "poly",
                        "coordinates": "123,92,139,101,139,77,122,85",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "564": {
                        "cam": 564,
                        "shape": "rect",
                        "coordinates": "120,155,140,183",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "3ba77449bfff9adc7230da687e7dd3a6",
            "lastAttempt": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "lastModified": {
                "time": "2022-11-29 17:07:04",
                "seconds": 414
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 360,
            "updatePeriodStdDev": 0,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/14",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/14/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/14/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/14/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/14.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/14.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=14",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=14&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=14"
        },
        "id": 14,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Border+Cams"
            },
            "name": "Border Cams",
            "group": 4
        },
        "regionGroup": {
            "highwayGroup": 4,
            "highwayCamOrder": 3
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/99"
            },
            "number": 99,
            "locationDescription": "Peace Arch Border Crossing"
        },
        "camName": "Beach Road - N",
        "caption": "Hwy 99 at Canada/USA border, looking north.",
        "credit": "For current traffic backup conditions at the border, visit <a href=\"http://www.th.gov.bc.ca/ATIS/\">http://www.th.gov.bc.ca/ATIS/</a>",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.0074042,-122.7578908+(Beach Road - N)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.0074042,-122.7578908&markers=color:blue%7C49.0074042,-122.7578908&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.0074042,
            "longitude": -122.7578908,
            "elevation": 18
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-YHEfull.html"
                },
                "id": "YVR-YHEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/14.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.001268,
                        "longitude": -122.758119
                    },
                    "max": {
                        "latitude": 49.016575,
                        "longitude": -122.7350798
                    }
                },
                "imageMap": {
                    "13": {
                        "cam": 13,
                        "shape": "poly",
                        "coordinates": "24,224,12,204,42,189,53,203",
                        "latitude": 49.001268,
                        "longitude": -122.756658
                    },
                    "14": {
                        "cam": 14,
                        "shape": "rect",
                        "coordinates": "21,149,49,169",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "15": {
                        "cam": 15,
                        "shape": "rect",
                        "coordinates": "94,157,120,182",
                        "latitude": 49.00304,
                        "longitude": -122.735633
                    },
                    "16": {
                        "cam": 16,
                        "shape": "rect",
                        "coordinates": "117,126,138,155",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    },
                    "212": {
                        "cam": 212,
                        "shape": "poly",
                        "coordinates": "17,89,26,87,29,61,4,68",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "444": {
                        "cam": 444,
                        "shape": "poly",
                        "coordinates": "20,112,39,104,27,76,9,84",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "445": {
                        "cam": 445,
                        "shape": "rect",
                        "coordinates": "21,169,47,189",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "447": {
                        "cam": 447,
                        "shape": "poly",
                        "coordinates": "107,112,130,112,120,89,114,89",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "477": {
                        "cam": 477,
                        "shape": "poly",
                        "coordinates": "114,88,120,88,129,64,105,64",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "539": {
                        "cam": 539,
                        "shape": "poly",
                        "coordinates": "1,113,21,98,18,89,1,87",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "562": {
                        "cam": 562,
                        "shape": "poly",
                        "coordinates": "90,100,112,91,112,86,90,76",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "563": {
                        "cam": 563,
                        "shape": "poly",
                        "coordinates": "123,92,139,101,139,77,122,85",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "564": {
                        "cam": 564,
                        "shape": "rect",
                        "coordinates": "120,155,140,183",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "411687e94acb79a7a2c687154d8bbc40",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 360,
            "updatePeriodStdDev": 0,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/15",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/15/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/15/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/15/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/15.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/15.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=15",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=15&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=15"
        },
        "id": 15,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Border+Cams"
            },
            "name": "Border Cams",
            "group": 4
        },
        "regionGroup": {
            "highwayGroup": 2,
            "highwayCamOrder": 6
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/15"
            },
            "number": 15,
            "locationDescription": "Canada/US Border Crossing"
        },
        "camName": "Pacific Border Crossing",
        "caption": "Pacific Crossing at the border, looking north.",
        "credit": "For current traffic backup conditions at the border, visit <a href=\"http://www.th.gov.bc.ca/ATIS/\">http://www.th.gov.bc.ca/ATIS/</a>",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.00304,-122.735633+(Pacific Border Crossing)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.00304,-122.735633&markers=color:blue%7C49.00304,-122.735633&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.00304,
            "longitude": -122.735633,
            "elevation": 19
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-YHEfull.html"
                },
                "id": "YVR-YHEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/15.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.001268,
                        "longitude": -122.758119
                    },
                    "max": {
                        "latitude": 49.016575,
                        "longitude": -122.7350798
                    }
                },
                "imageMap": {
                    "13": {
                        "cam": 13,
                        "shape": "poly",
                        "coordinates": "24,224,12,204,42,189,53,203",
                        "latitude": 49.001268,
                        "longitude": -122.756658
                    },
                    "14": {
                        "cam": 14,
                        "shape": "rect",
                        "coordinates": "21,149,49,169",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "15": {
                        "cam": 15,
                        "shape": "rect",
                        "coordinates": "94,157,120,182",
                        "latitude": 49.00304,
                        "longitude": -122.735633
                    },
                    "16": {
                        "cam": 16,
                        "shape": "rect",
                        "coordinates": "117,126,138,155",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    },
                    "212": {
                        "cam": 212,
                        "shape": "poly",
                        "coordinates": "17,89,26,87,29,61,4,68",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "444": {
                        "cam": 444,
                        "shape": "poly",
                        "coordinates": "20,112,39,104,27,76,9,84",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "445": {
                        "cam": 445,
                        "shape": "rect",
                        "coordinates": "21,169,47,189",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "447": {
                        "cam": 447,
                        "shape": "poly",
                        "coordinates": "107,112,130,112,120,89,114,89",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "477": {
                        "cam": 477,
                        "shape": "poly",
                        "coordinates": "114,88,120,88,129,64,105,64",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "539": {
                        "cam": 539,
                        "shape": "poly",
                        "coordinates": "1,113,21,98,18,89,1,87",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "562": {
                        "cam": 562,
                        "shape": "poly",
                        "coordinates": "90,100,112,91,112,86,90,76",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "563": {
                        "cam": 563,
                        "shape": "poly",
                        "coordinates": "123,92,139,101,139,77,122,85",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "564": {
                        "cam": 564,
                        "shape": "rect",
                        "coordinates": "120,155,140,183",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "b97bc0314c6cb1fcb6b7f687e5f80410",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 360,
            "updatePeriodStdDev": 0,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/16",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/16/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/16/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/16/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/16.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/16.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=16",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=16&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=16"
        },
        "id": 16,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Border+Cams"
            },
            "name": "Border Cams",
            "group": 4
        },
        "regionGroup": {
            "highwayGroup": 2,
            "highwayCamOrder": 4
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/15"
            },
            "number": 15,
            "locationDescription": "Canada/US Border Crossing"
        },
        "camName": "Second Ave - N",
        "caption": "Pacific Crossing at 2nd Avenue, looking north.",
        "credit": "For current traffic backup conditions at the border, visit <a href=\"http://www.th.gov.bc.ca/ATIS/\">http://www.th.gov.bc.ca/ATIS/</a>",
        "dbcMark": "DriveBC.ca",
        "orientation": "N",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.006636,-122.7350798+(Second Ave - N)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.006636,-122.7350798&markers=color:blue%7C49.006636,-122.7350798&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.006636,
            "longitude": -122.7350798,
            "elevation": 16
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-YHEfull.html"
                },
                "id": "YVR-YHEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/16.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.001268,
                        "longitude": -122.758119
                    },
                    "max": {
                        "latitude": 49.016575,
                        "longitude": -122.7350798
                    }
                },
                "imageMap": {
                    "13": {
                        "cam": 13,
                        "shape": "poly",
                        "coordinates": "24,224,12,204,42,189,53,203",
                        "latitude": 49.001268,
                        "longitude": -122.756658
                    },
                    "14": {
                        "cam": 14,
                        "shape": "rect",
                        "coordinates": "21,149,49,169",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "15": {
                        "cam": 15,
                        "shape": "rect",
                        "coordinates": "94,157,120,182",
                        "latitude": 49.00304,
                        "longitude": -122.735633
                    },
                    "16": {
                        "cam": 16,
                        "shape": "rect",
                        "coordinates": "117,126,138,155",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    },
                    "212": {
                        "cam": 212,
                        "shape": "poly",
                        "coordinates": "17,89,26,87,29,61,4,68",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "444": {
                        "cam": 444,
                        "shape": "poly",
                        "coordinates": "20,112,39,104,27,76,9,84",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "445": {
                        "cam": 445,
                        "shape": "rect",
                        "coordinates": "21,169,47,189",
                        "latitude": 49.0074042,
                        "longitude": -122.7578908
                    },
                    "447": {
                        "cam": 447,
                        "shape": "poly",
                        "coordinates": "107,112,130,112,120,89,114,89",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "477": {
                        "cam": 477,
                        "shape": "poly",
                        "coordinates": "114,88,120,88,129,64,105,64",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "539": {
                        "cam": 539,
                        "shape": "poly",
                        "coordinates": "1,113,21,98,18,89,1,87",
                        "latitude": 49.014668,
                        "longitude": -122.758119
                    },
                    "562": {
                        "cam": 562,
                        "shape": "poly",
                        "coordinates": "90,100,112,91,112,86,90,76",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "563": {
                        "cam": 563,
                        "shape": "poly",
                        "coordinates": "123,92,139,101,139,77,122,85",
                        "latitude": 49.016575,
                        "longitude": -122.735478
                    },
                    "564": {
                        "cam": 564,
                        "shape": "rect",
                        "coordinates": "120,155,140,183",
                        "latitude": 49.006636,
                        "longitude": -122.7350798
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "ebffbfd768e68ed1a07b018a3cbc6b3c",
            "lastAttempt": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "lastModified": {
                "time": "2022-11-29 17:12:48",
                "seconds": 70
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 360,
            "updatePeriodStdDev": 0,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/17",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/17/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/17/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/17/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/17.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/17.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=17",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=17&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=17"
        },
        "id": 17,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Lower+Mainland"
            },
            "name": "Lower Mainland",
            "group": 2
        },
        "regionGroup": {
            "highwayGroup": 19,
            "highwayCamOrder": 4
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/99"
            },
            "number": 99,
            "locationDescription": "Lions Gate Bridge/Marine Drive"
        },
        "camName": "Causeway",
        "caption": "Stanley Park Causeway at Stanley Park Entrance, looking south.",
        "credit": "* views switch between north and south views to monitor traffic flow.<br> Counterflow operations in effect for Lions Gate Bridge -<a href=\"https://www2.gov.bc.ca/gov/content?id=859F1B6A4CD74BBFA27C67A438A3B899\" target=\"_blank\">read more here</a>.<br>",
        "dbcMark": "DriveBC.ca",
        "orientation": "S",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.2957914,-123.1366403+(Causeway)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.2957914,-123.1366403&markers=color:blue%7C49.2957914,-123.1366403&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.2957914,
            "longitude": -123.1366403,
            "elevation": 5
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-WAEfull.html"
                },
                "id": "YVR-WAEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/17.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.294533,
                        "longitude": -123.136907
                    },
                    "max": {
                        "latitude": 49.327636,
                        "longitude": -123.130153
                    }
                },
                "imageMap": {
                    "17": {
                        "cam": 17,
                        "shape": "poly",
                        "coordinates": "48,201,59,192,73,209,62,220",
                        "latitude": 49.2957914,
                        "longitude": -123.1366403
                    },
                    "18": {
                        "cam": 18,
                        "shape": "poly",
                        "coordinates": "75,48,87,55,76,73,63,66",
                        "latitude": 49.317588,
                        "longitude": -123.136585
                    },
                    "19": {
                        "cam": 19,
                        "shape": "poly",
                        "coordinates": "63,221,74,212,88,229,77,240",
                        "latitude": 49.294533,
                        "longitude": -123.136907
                    },
                    "20": {
                        "cam": 20,
                        "shape": "poly",
                        "coordinates": "88,57,100,64,89,82,76,75",
                        "latitude": 49.324198,
                        "longitude": -123.130153
                    },
                    "21": {
                        "cam": 21,
                        "shape": "rect",
                        "coordinates": "44,18,60,42",
                        "latitude": 49.327636,
                        "longitude": -123.134727
                    },
                    "22": {
                        "cam": 22,
                        "shape": "rect",
                        "coordinates": "60,24,82,42",
                        "latitude": 49.3271249,
                        "longitude": -123.1329677
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "e30ca0fff0de8d1d93d5f8a8a08c8260",
            "lastAttempt": {
                "time": "2022-11-29 17:00:48",
                "seconds": 790
            },
            "lastModified": {
                "time": "2022-11-29 17:00:48",
                "seconds": 790
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 1077,
            "updatePeriodStdDev": 182,
            "fetchMean": 0
        }
    },
    {
        "links": {
            "self": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/18",
            "imageSource": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/18/imageSource",
            "imageDisplayAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/18/imageDisplay",
            "imageThumbnailAPI": "https://tst-images.drivebc.ca/webcam/api/v1/webcams/18/imageThumbnail",
            "imageDisplay": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/18.jpg",
            "imageThumbnail": "https://tst-images.drivebc.ca/bchighwaycam/pub/cameras/tn/18.jpg",
            "currentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=18",
            "updateCurrentImage": "https://tst-images.drivebc.ca/webcam/imageUpdate.php?cam=18&update",
            "replayTheDay": "https://tst-images.drivebc.ca/ReplayTheDay/player.html?cam=18"
        },
        "id": 18,
        "isOn": true,
        "shouldAppear": true,
        "region": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/regions/Lower+Mainland"
            },
            "name": "Lower Mainland",
            "group": 2
        },
        "regionGroup": {
            "highwayGroup": 19,
            "highwayCamOrder": 3
        },
        "highway": {
            "links": {
                "self": "https://tst-images.drivebc.ca/webcam/api/v1/highways/99"
            },
            "number": 99,
            "locationDescription": "Lions Gate Bridge/Marine Drive"
        },
        "camName": "North End 1",
        "caption": "North end of Lions Gate Bridge, looking south.",
        "credit": "Counterflow operations in effect for Lions Gate Bridge -<a href=\"https://www2.gov.bc.ca/gov/content?id=859F1B6A4CD74BBFA27C67A438A3B899\" target=\"_blank\">read more here</a>.<br>",
        "dbcMark": "DriveBC.ca",
        "orientation": "S",
        "location": {
            "links": {
                "googleMap": "http://maps.google.com/maps?q=49.317588,-123.136585+(North End 1)",
                "googleStaticMap": "http://maps.google.com/maps/api/staticmap?center=49.317588,-123.136585&markers=color:blue%7C49.317588,-123.136585&zoom=11&size=240x240&sensor=false"
            },
            "latitude": 49.317588,
            "longitude": -123.136585,
            "elevation": 20
        },
        "weather": {
            "observation": null,
            "forecast": {
                "links": {
                    "self": "https://tst-weather.drivebc.ca/EnvCanada/YVR-WAEfull.html"
                },
                "id": "YVR-WAEfull"
            }
        },
        "message": {
            "short": "",
            "long": ""
        },
        "map": {
            "image": "https://tst-images.drivebc.ca/bchighwaycam/pub/maps/18.jpg",
            "isDisplayedHorizontal": false,
            "map": {
                "boundingbox": {
                    "min": {
                        "latitude": 49.294533,
                        "longitude": -123.136907
                    },
                    "max": {
                        "latitude": 49.327636,
                        "longitude": -123.130153
                    }
                },
                "imageMap": {
                    "17": {
                        "cam": 17,
                        "shape": "poly",
                        "coordinates": "48,201,59,192,73,209,62,220",
                        "latitude": 49.2957914,
                        "longitude": -123.1366403
                    },
                    "18": {
                        "cam": 18,
                        "shape": "poly",
                        "coordinates": "75,48,87,55,76,73,63,66",
                        "latitude": 49.317588,
                        "longitude": -123.136585
                    },
                    "19": {
                        "cam": 19,
                        "shape": "poly",
                        "coordinates": "63,221,74,212,88,229,77,240",
                        "latitude": 49.294533,
                        "longitude": -123.136907
                    },
                    "20": {
                        "cam": 20,
                        "shape": "poly",
                        "coordinates": "88,57,100,64,89,82,76,75",
                        "latitude": 49.324198,
                        "longitude": -123.130153
                    },
                    "21": {
                        "cam": 21,
                        "shape": "rect",
                        "coordinates": "44,18,60,42",
                        "latitude": 49.327636,
                        "longitude": -123.134727
                    },
                    "22": {
                        "cam": 22,
                        "shape": "rect",
                        "coordinates": "60,24,82,42",
                        "latitude": 49.3271249,
                        "longitude": -123.1329677
                    }
                }
            }
        },
        "isNew": false,
        "isOnDemand": false,
        "imageStats": {
            "md5": "ba72a527f205a999791cf198618383f7",
            "lastAttempt": {
                "time": "2022-11-29 17:00:48",
                "seconds": 790
            },
            "lastModified": {
                "time": "2022-11-29 17:00:48",
                "seconds": 790
            },
            "markedStale": false,
            "markedDelayed": false,
            "updatePeriodMean": 1079,
            "updatePeriodStdDev": 182,
            "fetchMean": 0
        }
    }
];
