
const hideElements = () => {
  let objects = document.getElementsByClassName('modules');
  for (let i = 0; i < objects.length; i++) {
    objects[i].style.display = 'none';
  }
}

const showElements = () => {
  let objects = document.getElementsByClassName('modules');
  console.log(objects.length);
  for (let i = 0; i < objects.length; i++) {
    objects[i].style.display = 'block';
  }  
}

const parseCoordinates = (coordinateString) => {
  let coordinates = coordinateString.split(',');
  latitude = Number.parseFloat(coordinates[0]).toFixed(4);
  longitude = Number.parseFloat(coordinates[1]).toFixed(4);
  return [latitude, longitude];
}


const isCoordinatesValid = (coordinateString) => {
  let coordinates = coordinateString.split(',');
  latitude = Number.parseFloat(coordinates[0]);
  longitude = Number.parseFloat(coordinates[1]);
  if (isNaN(latitude) || isNaN(longitude)) {
    document.getElementById('coordinatesText').innerHTML = 'Input not valid';
    return false;
  } else {
    document.getElementById('coordinatesText').innerHTML = '';
    return true;
  }
}

const isNsrIdValid = (nsrIdInput) => {
  let NSR_id  = parseInt(nsrIdInput);
  if (isNaN(NSR_id)) {
    document.getElementById('nsrText').innerHTML = 'Input not valid';
    return false;
  } else {
    document.getElementById('nsrText').innerHTML = '';
    return true;
  }
}

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
  stations = {data: []};
  for (let i = 0; i < stations_list.length; i++) {
    const stationName = stations_list[i].trim();
    if (stationName == "") {
      document.getElementById('stationsText').innerHTML = 'Input is not valid';
      return null;
    }

    let stationId = getStationId(stationName);
    if (stationId == null) {
      document.getElementById('stationsText').innerHTML = stationName + ' is not valid';
      return null;
    }
    stations.data.push({"name": stationName, "id": stationId});
  }

  return stations;
}

const setStoredItems = () => {
  let coordinatesInput = document.getElementById('coordinates').value;
  let coordinates = isCoordinatesValid(coordinatesInput);

  let nsrIdInput = document.getElementById('nsrIds').value;
  let nsrId = isNsrIdValid(nsrIdInput);

  let stationsInput = document.getElementById('stationIds').value;
  let stations = isStationsValid(stationsInput);
  
  if (coordinates && nsrId && stations) {
    console.log("Saved to local storage");
    localStorage.setItem('coordinates', coordinatesInput);
    localStorage.setItem('nsrId', nsrIdInput);
    localStorage.setItem('stationIds', JSON.stringify(stations));
    document.getElementById("inputs").style.display = 'none';
    showElements();
    location.reload();
  }

}

dayjs.extend(window.dayjs_plugin_localizedFormat);
dayjs.extend(window.dayjs_plugin_updateLocale);
dayjs.extend(window.dayjs_plugin_relativeTime);
dayjs.extend(window.dayjs_plugin_utc);

dayjs.updateLocale('en', {
  relativeTime: {
    future: "%s",
    past: "now",
    s: "now",
    m: "1 min",
    mm: "%d min",
    h: "an hour",
    hh: "%d hours",
    d: "a day",
    dd: "%d days",
    M: "a month",
    MM: "%d months",
    y: "a year",
    yy: "%d years"
  }
});


const renderTimeModule = () => {
  document.getElementById('timeModule').innerHTML = `
      <div id="clock">${dayjs().format('HH:mm:ss')}</div>
      <div id="weekday">${dayjs().format('dddd')}</div>
      <div id="date">${dayjs().format('LL')}</div>
    `;
}

setInterval(renderTimeModule, 1000);

const getCityBikeData = (url, headers, stations) => {
  fetch(url, headers)
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


const renderPublicTransportModule = (url, headers) => {
  fetch(url, headers)
  .then((res) => res.json())
  .then((data) => {
    handleData(data);
  });
};

const handleData = (data) => {
  let departures = data.data.stopPlace.estimatedCalls;
  document.getElementById('entur').innerHTML = `<div id="departures"></div>`;
  insertedDepartures = [];
  departures.forEach(dep => {
    departureName = dep.serviceJourney.journeyPattern.line.publicCode + ' ' + dep.destinationDisplay.frontText;
    if (!insertedDepartures.includes(departureName)) {
      insertedDepartures.push(departureName);
      createAndInsertNewElement(departureName);
    }
    insertDeparture(dep.expectedArrivalTime);
  });
  if (departures.length === 0) {
    document.getElementById('entur').innerHTML = 'No departures';
  }
}

const createAndInsertNewElement = () => {
  let newElement = createNewElement();
  insertElement(newElement, departureName);
  insertNewDeparture(newElement);
}

const createNewElement = () => {
  let newElement = document.createElement('ul');
  newElement.setAttribute('id', departureName);
  return newElement;
}

const insertElement = (element, departureName) => {
  let oldElement = document.getElementById(departureName);
  if (oldElement == null) {
    document.getElementById('departures').appendChild(element);
  } else {
    document.getElementById('departures').replaceChild(element, oldElement);
  }
}

const insertNewDeparture = (element) => {
  element.innerHTML = `<a class="fronttext" >${departureName}</a>`;
  element.appendChild(document.createElement('ul'));
}

const insertDeparture = (expectedArrivalTime) => {
  if (document.getElementById(departureName).childNodes.length < 6) {        
    let newNode = document.createElement('a');
    newNode.setAttribute('class', 'timestamp');
    document.getElementById(departureName).appendChild(newNode);
    newNode.innerHTML = formatDepartureTime(expectedArrivalTime);
  }
}

const handleError = () => {
  document.getElementById('entur').innerHTML = 'No connection';
}

const formatDepartureTime = (timestamp) => { 
  let formattedTime = timestamp;
  if (dayjs(timestamp).diff(dayjs(), 'minutes') < 15) {
    formattedTime = dayjs(timestamp).fromNow();
  } else {
    formattedTime = dayjs(timestamp).format('HH:mm');
  }
  return formattedTime;
}

class Weather {
  constructor(time, temperature,
              nextHourSymbolCode = '', nextHourPrecipitation = -1,
              nextHourPrecipitationMin = -1, nextHourPrecipitationMax = -1,
              nextSixHoursTemperatureMax, nextSixHoursTemperatureMin,
              nextSixHoursPrecipitationMax, nextSixHoursPrecipitationMin,
              nextSixHoursSymbolCode) {
    this.time = time;
    this.temperature = temperature;
    this.nextHourSymbolCode = nextHourSymbolCode;
    this.nextHourPrecipitation = nextHourPrecipitation;
    this.nextHourPrecipitationMin = nextHourPrecipitationMin;
    this.nextHourPrecipitationMax = nextHourPrecipitationMax;
    this.nextSixHoursTemperatureMax = nextSixHoursTemperatureMax;
    this.nextSixHoursTemperatureMin = nextSixHoursTemperatureMin;
    this.nextSixHoursPrecipitationMax = nextSixHoursPrecipitationMax;
    this.nextSixHoursPrecipitationMin = nextSixHoursPrecipitationMin;
    this.nextSixHoursSymbolCode = nextSixHoursSymbolCode;
  }
}

const getSunriseAndSunsetTimes = (sunriseData) => {
  const arr = [];
  let sunriseTime = sunriseData.getElementsByTagName('sunrise')[0].getAttribute('time');
  let sunsetTime = sunriseData.getElementsByTagName('sunset')[0].getAttribute('time');
  arr.push(dayjs(sunriseTime, 'YYYY-MM-DDTHH:mm:ssZ').format('HH:mm'), dayjs(sunsetTime, 'YYYY-MM-DDTHH:mm:ssZ').format('HH:mm'));
  return arr;
}

const getWeatherData = (latitude, longitude) => {
  let forecastEndpoint = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${latitude}&lon=${longitude}`;
  let sunriseEndpoint = `https://api.met.no/weatherapi/sunrise/2.0/?lat=${latitude}&lon=${longitude}&date=${dayjs().format('YYYY-MM-DD')}&offset=+01:00`;
  if (expires.isBefore(dayjs())) {
    let firstCall = fetch(forecastEndpoint);
    let secondCall = fetch(sunriseEndpoint);
    firstCall.then(response => expires = dayjs(response.headers.get('expires')));
    Promise.all([firstCall, secondCall])
    .then(values => Promise.all(values.map(value => value.text())))
    .then(data => {
      let forecastData = JSON.parse(data[0]);
      let sunriseData = (new DOMParser().parseFromString(data[1], 'text/xml')).getElementsByTagName('location')[0].getElementsByTagName('time')[0];
      weather(forecastData, sunriseData);
    });
  }
}

const formatPrecipitation = (precipitation) => {
  if (precipitation >= 10) {
    return Math.round(precipitation);
  } else {
    return precipitation;
  }
}

const makeWeatherList = (forecastList) => {
  let weatherList = [];
  for (let i = 0; i < forecastList.length - 1; i++) {
    let timeStamp =  dayjs.utc(forecastList[i].time, 'YYYY-MM-DDTHH-mm-ssZ');

    let temperature = Math.round(forecastList[i].data.instant.details.air_temperature);
    let symbolCode, precipitation, precipitationMin, precipitationMax,
        nextSixHoursTemperatureMax, nextSixHoursTemperatureMin, nextSixHoursPrecipitationMax,
        nextSixHoursPrecipitationMin, nextSixHoursSymbolCode;

    if (forecastList[i].data.hasOwnProperty('next_1_hours')) {
      symbolCode = forecastList[i].data.next_1_hours.summary.symbol_code;
      precipitation = formatPrecipitation(forecastList[i].data.next_1_hours.details.precipitation_amount);
      precipitationMin = formatPrecipitation(forecastList[i].data.next_1_hours.details.precipitation_amount_min)
      precipitationMax = formatPrecipitation(forecastList[i].data.next_1_hours.details.precipitation_amount_max) 
    }
    
    if (forecastList[i].data.hasOwnProperty('next_6_hours')) {
      nextSixHoursTemperatureMax = Math.round(forecastList[i].data.next_6_hours.details.air_temperature_max);
      nextSixHoursTemperatureMin = Math.round(forecastList[i].data.next_6_hours.details.air_temperature_min);
      nextSixHoursPrecipitationMax = formatPrecipitation(forecastList[i].data.next_6_hours.details.precipitation_amount_max);
      nextSixHoursPrecipitationMin = formatPrecipitation(forecastList[i].data.next_6_hours.details.precipitation_amount_min);
      nextSixHoursSymbolCode = forecastList[i].data.next_6_hours.summary.symbol_code;
    }

    weatherList.push(
      new Weather(timeStamp, temperature, symbolCode,
                  precipitation, precipitationMin, precipitationMax,
                  nextSixHoursTemperatureMax, nextSixHoursTemperatureMin,
                  nextSixHoursPrecipitationMax, nextSixHoursPrecipitationMin,
                  nextSixHoursSymbolCode)
    );
  }
  return weatherList;
}

const weather = (forecastData, sunriseData) => {
  let sunsetAndSunriseTimes = getSunriseAndSunsetTimes(sunriseData);
  let forecastTimeseries = forecastData.properties.timeseries;
  let weatherList = makeWeatherList(forecastTimeseries);
  let weatherElement = `
        <div class="tempNowContainer">
          <div class="tempnow" id="temperatureNow">${weatherList[0].temperature + '&deg;'}</div>
          <div class="tempnow" id='tempInfo'>
              <div>
                <img src="weatherIcons/${weatherList[0].nextHourSymbolCode}.svg" id="weatherSymbol"></img>
              </div>
              <div>
                <div id="precipitation">${weatherList[0].nextHourPrecipitation + ' mm'}</div>
              </div>
          </div>
        </div>
        <div id="sunrise">
            <b id="smallSun">&#9728; &#8593; ${sunsetAndSunriseTimes[0]} &#8595; ${sunsetAndSunriseTimes[1]}</b>
        </div>
      `;
  
  weatherElement += getForecasts(weatherList);
  
  document.getElementById('weather').innerHTML = weatherElement;
}


const getForecasts = (weatherList) => {
  let forecastElement = formatForecast(weatherList[1], false);
 
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc(weatherList[1].time).add(6, 'h').set({ 'minute': 0, 'second': 0, 'millisecond': 0 })), false);
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc().add(1, 'd').hour(12).minute(0).second(0).millisecond(0)), true);
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc().add(2, 'd').hour(12).minute(0).second(0).millisecond(0)), true);
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc().add(3, 'd').hour(12).minute(0).second(0).millisecond(0)), true);
  return forecastElement;
}

const getForecast = (weatherList, timeObject, daily) => {
  let weatherNextSixHours = weatherList.filter(element => element.time.isSame(timeObject, 'second'))[0];
  if (weatherNextSixHours == undefined) {
    return '';
  }
  return formatForecast(weatherNextSixHours, daily);
  
}

const formatForecast = (weather, day) => {
  let precipitation, temperature, timePeriod;

  if (weather.nextSixHoursPrecipitationMin == weather.nextSixHoursPrecipitationMax) {
    precipitation = weather.nextSixHoursPrecipitationMax;
  } else {
    precipitation = weather.nextSixHoursPrecipitationMin + ' / ' + weather.nextSixHoursPrecipitationMax;
  }
  
  if (weather.nextSixHoursTemperatureMin == weather.nextSixHoursTemperatureMax) {
    temperature = weather.nextSixHoursTemperatureMax + '&deg;';
  } else {
    temperature = weather.nextSixHoursTemperatureMax + '&deg; / ' + weather.nextSixHoursTemperatureMin + '&deg;';
  }
  
  if (day) {
    timePeriod =  weather.time.local().format('dddd');
  } else {
    timePeriod = `${weather.time.local().format('HH')} - ${weather.time.add(6, 'h').local().format('HH')}`;
  }
  return `
    <div class="line">
      <a class="timeFrame">${timePeriod}</a>  
      <a class="symbol">
        <img src="weatherIcons/${weather.nextSixHoursSymbolCode}.svg" id="smallSymbol"></img>
      </a>        
      <a class="temperature">${temperature}</a>
      <a class="precipitation">${precipitation} mm</a>
    </div>
  `;
}

// Api endpoints
let enturEndpoint = 'https://api.entur.io/journey-planner/v2/graphql';
let cityBikeStatusEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json';
let cityBikeInfoEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json';

// Initialize the expires timestamp which will be compared to the expires header from met API
let expires = dayjs(0);

const osloCityBikeHeaders = {
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

document.getElementById('submitButton').onclick = () => {
  setStoredItems();
}

if (!localStorage.getItem('nsrId')) {
  hideElements();
  getCityBikeStationData(cityBikeInfoEndpoint);
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

  const enturHeaders = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ET-Client-Name': 'github.com/hhernes-MagicMirror'
    },
    body: JSON.stringify({query})
  };

  renderPublicTransportModule(enturEndpoint, enturHeaders);
  setInterval(renderPublicTransportModule, 5000, enturEndpoint, enturHeaders);
}

if (localStorage.getItem('stationIds')) {
  let stations = JSON.parse(localStorage.getItem('stationIds'));
  getCityBikeData(cityBikeStatusEndpoint, osloCityBikeHeaders, stations);
  setInterval(getCityBikeData, 15000, cityBikeStatusEndpoint, osloCityBikeHeaders, stations);  
}