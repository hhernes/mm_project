const getStationId = (stationName) => {
  let stations = stations_json.data.stations;
  let filtered_stations = stations.filter(stat => stat.name === stationName);
  if (filtered_stations.length != 1) {
    return null;
  }
  return filtered_stations[0].station_id;
}

const isStationsValid = (stationsInput) => {
  const stations_list = stationsInput.split(",");
  let stations = {data: []};
  for (const station of stations_list) {
    const stationName = station.trim();
    if (stationName == "") {
      document.getElementById('stationsText').innerHTML = 'Input is not valid';
      return null;
    }

    let stationId = getStationId(stationName);
    if (stationId == null) {
    document.getElementById('stationsText').innerHTML = `'${stationName}' is not a station`;
      return null;
    }
    stations.data.push({"name": stationName, "id": stationId});
  }
  document.getElementById('stationsText').innerHTML = '';
  return stations;
}

const getCityBikeData = (url, request, stations) => {
  fetch(url, request)
  .then(res => res.json())
  .then(cityBikeData => {
    let cityBikeElement = initilizeCityBikeElement();
    addStationData(cityBikeData, cityBikeElement, stations);
  });
}

const initilizeCityBikeElement = () => {
  return `
    <div class="row">
      <a class="station"></a>
      <a class="bike">Bikes</a>
      <a class="bike">Locks</a>
    </div>
    `;
};

const addStationData = (cityBikeData, cityBikeElement, stations) => {
  let stationsDataArray = cityBikeData.data.stations;
  stationsDataArray.forEach(station => {
    stations.data.forEach(saved_station => {
      if (station.station_id === saved_station.id) {
        cityBikeElement += addStationToModule(saved_station.name, station);
      }
    })
  })
  document.getElementById('citybike').innerHTML = cityBikeElement;
};

const addStationToModule = (stationName, station) => {
  return `
    <div class="row">
      <a class="station">${stationName}</a>
      <a class="bikes">${station.num_bikes_available}</a>
      <a class="bikes">${station.num_docks_available}</a>
    </div>
  `;
}

let cityBikeStatusEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json';
let cityBikeInfoEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json';


const osloCityBikeRequest = {
  method: 'GET',
  headers: {
    'Client-Identifier': 'github.com/hhernes-MagicMirror',
  }
};

let stations_json;

const getCityBikeStationData = (url, headers) => {
  fetch(url, headers)
  .then(res => res.json())
  .then(station_data => {
    stations_json = station_data;
    document.getElementById("inputs").style.display = 'block';
  })
  .catch(e => {
    document.getElementById("inputs").style.display = 'block';
    console.log(e);
  })
}