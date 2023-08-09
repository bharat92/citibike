let newYorkCoords = [40.73, -74.0059];
let mapZoomLevel = 12;

// Create the createMap function.
function createMap() {
  // Create the tile layer that will be the background of our map.
  let streetMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  });

  // Create a baseMaps object to hold the lightmap layer.
  let baseMaps = {
    "Street View": streetMap
  };

  // Create an overlayMaps object to hold the bikeStations layer.
  let overlayMaps = {
    "Coming Soon": new L.LayerGroup(),
    "Empty Stations": new L.LayerGroup(),
    "Low Stations": new L.LayerGroup(),
    "Healthy Stations": new L.LayerGroup(),
    "Out of Order": new L.LayerGroup()
  };

  let layerArray = [streetMap];
  let statusArray = Object.keys(overlayMaps);

  for (let i = 0; i < statusArray.length; i++) {
    layerArray.push(overlayMaps[statusArray[i]]);
  }
  // Create the map object with options.
  let map = L.map("map-id", {
    center: newYorkCoords,
    zoom: mapZoomLevel,
    layers: layerArray
  });

  streetMap.addTo(map);

  function createMarker(shape, markerColor, iconColor) {
    return L.ExtraMarkers.icon({
      "icon": "ion-android-bicycle",
      "markerColor": markerColor,
      "iconColor": iconColor,
      "shape": shape,
    });
  };

  // Market Object map
  let marketMapper = {
    "Coming Soon": createMarker('star', 'yellow', 'white'),
    "Empty Stations": createMarker('circle', 'orange', 'white'),
    "Low Stations": createMarker('circle', 'red', 'white'),
    "Healthy Stations": createMarker('star', 'green', 'white'),
    "Out of Order": createMarker('square', 'black', 'white')
  }


  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json").then((stationRes) => {
    let stationInfoData = stationRes.data.stations;
    let moment = stationRes.data.last_updated;
    d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json").then((stationStatusRes) => {
      let stationStatusData = stationStatusRes.data.stations
      let stationCounter = {
        "Coming Soon": 0,
        "Empty Stations": 0,
        "Low Stations": 0,
        "Healthy Stations": 0,
        "Out of Order": 0
      };


      for (let i = 0; i < 100; i++) {
        let stationData = Object.assign({}, stationStatusData[i], stationInfoData[i]);
        let statusCode = "";

        if (!stationData.is_installed) {
          statusCode = "Coming Soon";
        }
        else if (!stationData.num_bikes_available) {
          statusCode = "Empty Stations";
        }
        else if (stationData.num_bikes_available <= 5) {
          statusCode = "Low Stations";
        }
        else if (stationData.is_installed && !stationData.is_renting) {
          statusCode = "Out of Order";
        }
        else {
          statusCode = "Healthy Stations"
        }

        stationCounter[statusCode]++;
        let stationMarker = L.marker([stationData.lat, stationData.lon], { icon: marketMapper[statusCode] }).bindPopup(`<p> ${stationData.name} </p><p> Capacity: ${stationData.capacity} </p><p> Available: ${stationData.num_bikes_available} </p>`).addTo(map);
        stationMarker.addTo(overlayMaps[statusCode]);

      }
      L.control.layers(baseMaps, overlayMaps, { collapsed: false, hideSingleBase: true }).addTo(map);

      // Create a legend to display information about our map.
      let info = L.control({
        position: "bottomright"
      });

      // When the layer control is added, insert a div with the class of "legend".
      info.onAdd = function () {
        let div = L.DomUtil.create("div", "legend");
        return div;
      };

      function legendCreator(statusCode){
       return  "<p class='" + statusCode +"'>" + statusCode + "Stations: " + stationCounter[statusCode]+ "</p>"
      };

      let legendInnerHTML = ["<p>Status Report </p>"]

      for (let i = 0; i < statusArray.length; i++) {
        legendInnerHTML.push(legendCreator(statusArray[i]));
      }

      document.querySelector(".legend").innerHTML = legendInnerHTML.join("");

      // Add the info legend to the map.
      info.addTo(map);

    })
  })
}


createMap();
