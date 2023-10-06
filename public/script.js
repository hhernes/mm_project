
const hideElements = () => {
  let modules = document.getElementsByClassName('modules');
  for (const object of modules) {
    object.style.display = 'none';
  }
}

const showElements = () => {
  let modules = document.getElementsByClassName('modules');
  for (const object of modules) {
    object.style.display = 'block';
  }
}

const parseCoordinates = (coordinateString) => {
  const coordinates = coordinateString.split(',');
  const latitude = Number.parseFloat(coordinates[0]).toFixed(4);
  const longitude = Number.parseFloat(coordinates[1]).toFixed(4);
  return [latitude, longitude];
}

const isCoordinatesValid = (coordinateString) => {
  const coordinates = coordinateString.split(',');
  const latitude = Number.parseFloat(coordinates[0]);
  const longitude = Number.parseFloat(coordinates[1]);
  if (isNaN(latitude) || isNaN(longitude)) {
    document.getElementById('coordinatesText').innerHTML = 'Input not valid';
    return false;
  } else {
    document.getElementById('coordinatesText').innerHTML = '';
    return true;
  }
}

const isNsrIdValid = (nsrIdInput) => {
  const NSR_id  = parseInt(nsrIdInput);
  if (isNaN(NSR_id)) {
    document.getElementById('nsrText').innerHTML = 'Input not valid';
    return false;
  } else {
    document.getElementById('nsrText').innerHTML = '';
    return true;
  }
}


const setStoredItems = () => {
  let coordinatesInput = document.getElementById('coordinates').value;
  let coordinates = isCoordinatesValid(coordinatesInput);

  let nsrIdInput = document.getElementById('nsrIds').value;
  let nsrId = isNsrIdValid(nsrIdInput);

  // let stationsInput = document.getElementById('stationIds').value;
  // let stations = isStationsValid(stationsInput);
  
  if (coordinates && nsrId) {
    console.log("Saved to local storage");
    localStorage.setItem('coordinates', coordinatesInput);
    localStorage.setItem('nsrId', nsrIdInput);
    // localStorage.setItem('stationIds', JSON.stringify(stations));
    document.getElementById("inputs").style.display = 'none';
    showElements();
    location.reload();
  }

}


document.getElementById('submitButton').onclick = () => {
  setStoredItems();
}

if (!localStorage.getItem('nsrId')) {
  hideElements();
  document.getElementById("inputs").style.display = 'block';
  //getCityBikeStationData(cityBikeInfoEndpoint, osloCityBikeRequest);
} else {
  document.getElementById("inputs").style.display = 'none';
}

if (localStorage.getItem('coordinates')) {
  let coordinates = parseCoordinates(localStorage.getItem('coordinates'));
  let latitude = coordinates[0];
  let longitude = coordinates[1];
  getWeatherData(latitude, longitude);
  setInterval(getWeatherData, 60000, latitude, longitude);
}

if (localStorage.getItem('nsrId')) {
  let nsrId = parseInt(localStorage.getItem('nsrId'));

  const query = `
    {
      stopPlace(id: "NSR:StopPlace:${nsrId}") {
        id
        name
        estimatedCalls(timeRange: 3600 numberOfDepartures: 50) {
            realtime
            expectedArrivalTime
            destinationDisplay {
              frontText
            }
            serviceJourney {
            journeyPattern {
              line {
                id
                name
                publicCode
              }
            }
          }
        }
      }
    }
  `;

  const enturRequest = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ET-Client-Name': 'github.com/hhernes-MagicMirror'
    },
    body: JSON.stringify({query})
  };

  renderPublicTransportModule(enturEndpoint, enturRequest);
  setInterval(renderPublicTransportModule, 5000, enturEndpoint, enturRequest);
}

// if (localStorage.getItem('stationIds')) {
//   let stations = JSON.parse(localStorage.getItem('stationIds'));
//   getCityBikeData(cityBikeStatusEndpoint, osloCityBikeRequest, stations);
//   setInterval(getCityBikeData, 15000, cityBikeStatusEndpoint, osloCityBikeRequest, stations);  
//}