/* eslint-disable no-prototype-builtins */

function merge(obj1, obj2) {
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        obj1[key] = merge(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}

export default {
  "TOPOGRAPHIC/BC Terrestrial/Base": {
    paint: {
      "fill-color": "#f5f3f3"
    },
  },
  "TRANSPORTATION/DRA/Small/Highway/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Small/Highway/ExSmall/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Small/Major Highway/ExSmall/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway Ramp/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway Ramp/Medium/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway/Medium/Line": {
    paint: {
      "line-color": "#798aaa"
    }
  },
  "TRANSPORTATION/DRA/Overpasses/Highway/Line": {
    paint: {
      "line-color": "#798aaa"
    },
  },
// fill
  "TRANSPORTATION/DRA/Small/Highway/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Small/Major Highway/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Small/Major Highway/ExSmall/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Small/Highway/ExSmall/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway Ramp/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway Ramp/Medium/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway/Medium/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    }
  },
  "TRANSPORTATION/DRA/Large/Highway/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Highway Ramp/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Highway/Fill": {
    paint: {
      "line-color": "#9aa8c1"
    },
  },

  // bc sans
  "TRANSPORTATION/DRA/Road Names/label/Ferry": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/DRA/Road Names/label/Resource": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/DRA/Road Names/label/Local": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/DRA/Road Names/label/Collector": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "PARKS/Additional/label/Marine Parks": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "PARKS/Additional/label/Terrestrial Parks": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/Outside BC/Hwy Symbols/label/Other Canada": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/Outside BC/Hwy Symbols/label/US Interstate": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/Outside BC/Hwy Symbols/label/US Hwy": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
  },
  "TRANSPORTATION/DRA/Road Names/label/Collector 18K +": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333"
    }
  },
  "TRANSPORTATION/DRA/Road Names/label/Arterial 18K +": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333"
    }
  },
  "POLITICAL/Populated Places/Large/label/All Populated": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#f5f3f3",
      "text-halo-width": 1.5
    }
  },
  "POLITICAL/Populated Places/Medium/label/Town Village": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#f5f3f3",
      "text-halo-width": 1.5
    }
  },
  "POLITICAL/Populated Places/Medium/label/Cities": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#f5f3f3",
      "text-halo-width": 1.5
    }
  },
  "POLITICAL/Populated Places/Small/label/Town Village": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#f5f3f3",
      "text-halo-width": 1.5
    }
  },
  "POLITICAL/Populated Places/Small/label/Cities": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#f5f3f3",
      "text-halo-width": 1.5
    }
  },
  "POLITICAL/Prov & States/label/Prov & States Labels": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#f5f3f3",
      "text-halo-width": 1.5
    }
  },
  "TRANSPORTATION/DRA/Road Names/label/Arterial": {
    layout: {
      "text-font": ['BC Sans Bold']
    },
  },
  "POLITICAL/FN Villages/Former First Nation Village": {
    layout: {
      "text-font": ['BC Sans Regular']
    },
    paint: {
      "text-color": "#333333"
    }
  },

  // minor roads d1d7dc outline

  "TRANSPORTATION/DRA/Large/Arterial/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Large/Collector/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Large/Pedestrian and Driveways/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Large/Lanes and Alleyways/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Large/Local Roads/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Large/Ramp/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Large/Resource Roads/Line": {
    layout: {
      "visibility": "none"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Ramp/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Arterial/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Collector/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Local Roads/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Lanes and Alleyways/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Pedestrian and Driveways/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Resource/Line": {
    paint: {
      "line-color": "#d1d7dc"
    },
  },

  // minor roads d9dfe4 fill

  "TRANSPORTATION/Outside BC/Roads/ExLarge/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/Outside BC/Roads/Large/Major Highway/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/Outside BC/Roads/Large/Highway/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/Outside BC/Roads/Medium/Highway/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Small/Collector": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Large/Arterial/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Large/Collector/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Large/Lanes and Alleyways/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Large/Local Roads/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Large/Ramp/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Large/Resource Roads/Fill": {
    // "minzoom": "14",
    layout: {
      "visibility": "none"
    },
  },

  "TRANSPORTATION/DRA/Overpasses/Resource/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Lanes and Alleyways/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Local Roads/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Collector/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Arterial/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },
  "TRANSPORTATION/DRA/Overpasses/Ramp/Fill": {
    paint: {
      "line-color": "#d9dfe4"
    },
  },

  "TRANSPORTATION/DRA/Hwy Symbols/label/(R1) Hwy 5": {
    "paint": {
        "text-color": "rgba(0,0,0,0.02)"
    },
} ,

// trail demographic
"TRANSPORTATION/DRA/Large/Trail Demographic/Line": {
  layout: {
    "visibility": "none"
  },
},

"TRANSPORTATION/DRA/Large/Trail Demographic/Dash": {
  layout: {
    "visibility": "none"
  },
},

"TRANSPORTATION/DRA/Road Names/label/Trail": {
  layout: {
    "visibility": "none"
  },
},
"TRANSPORTATION/DRA/Large/Trail": {
  layout: {
    "visibility": "none"
  },  
},
"TRANSPORTATION/DRA/Large/Trail Recreation": {
  layout: {
    "visibility": "none"
  },  
},
"TRANSPORTATION/DRA Roads (L)/Resource Roads/0": {
  layout: {
    "visibility": "none"
  },
},
"TRANSPORTATION/DRA Roads (L)/Resource Roads/1": {
  layout : {
    "visibility": "none"
  },
},
"TRANSPORTATION/DRA/Seasonal/Large/Fill": {
  layout: {
    "visibility": "none"
  },
},
"TRANSPORTATION/DRA/Seasonal/Large/Dash": {
  layout: {
    "visibility": "none"
  },
},
"TRANSPORTATION/DRA/Seasonal/Medium/Line": {
  layout: {
    "visibility": "none"
  },
},


  merge,
};

