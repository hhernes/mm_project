
const hideElements = () => {
  let objects = document.getElementsByClassName('modules')
  console.log(objects.length)
  for (let i = 0; i < objects.length; i++) {
    objects[i].style.display = 'none'
  }  
}

const parseCoordinates = (coordinateString) => {
  let coordinates = coordinateString.split(',')
  latitude = Number.parseFloat(coordinates[0])
  longitude = Number.parseFloat(coordinates[1])
  return latitude, longitude
}

const getStoredItems = () => {
  nsrIdString = localStorage.getItem('nsrId')
  coordinatesString = localStorage.getItem('coordinates')
  stationsString = localStorage.getItem('stationIds')
}

const isCoordinatesValid = (coordinateString) => {
  let coordinates = coordinateString.split(',')
  latitude = Number.parseFloat(coordinates[0])
  longitude = Number.parseFloat(coordinates[1])
  if (isNaN(latitude) || isNaN(longitude)) {
    document.getElementById('coordinatesText').innerHTML = 'Input not valid'
    return false
  } else {
    document.getElementById('coordinatesText').innerHTML = ''
    return true
  }
}

const isNsrIdValid = (nsrIdInput) => {
  let NSR_id  = parseInt(nsrIdInput)
  if (isNaN(NSR_id)) {
    document.getElementById('nsrText').innerHTML = 'Input not valid'
    return false
  } else {
    document.getElementById('nsrText').innerHTML = ''
    return true
  }
}

const isStationIdsValid = (stationsInput) => {
  console.log("Station input: " + stationsInput)
  const stations = stationsInput.split(",")
  // console.log("Stations: " + stations)
  console.log(stations)
  for (let i = 0; i < stations.length; i++) {
    const stationId = stations[i];
    console.log(parseInt(stationId))
    if (isNaN(parseInt(stationId))) {
      document.getElementById('stationsText').innerHTML = 'Input not valid'
      return false
    }
  }
  return true
}


const setStoredItems = () => {
  let coordinatesInput = document.getElementById('coordinates').value
  let coordinates = isCoordinatesValid(coordinatesInput)

  let nsrIdInput = document.getElementById('nsrIds').value
  let nsrId = isNsrIdValid(nsrIdInput)

  let stationsInput = document.getElementById('stationIds').value
  let stations = isStationIdsValid(stationsInput)

  if (coordinates && nsrId && stations) {
    localStorage.setItem('coordinates', coordinatesInput)
    localStorage.setItem('nsrId', nsrIdInput)
    localStorage.setItem('stationIds', stationsInput)
  }

}

document.getElementById('submitButton').onclick = () => {
  setStoredItems()
}

const getData = () => {
  document.getElementById('inputs').innerHTML = inputElements;
}

dayjs.extend(window.dayjs_plugin_localizedFormat)
dayjs.extend(window.dayjs_plugin_updateLocale)
dayjs.extend(window.dayjs_plugin_relativeTime)
dayjs.extend(window.dayjs_plugin_utc)

dayjs.updateLocale('en', {
  relativeTime: {
    future: "%s",
    past: "now",
    s: 'now',
    m: "%d min",
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
})


const renderTimeModule = () => {
  document.getElementById('timeModule').innerHTML = `
      <div id="clock">${dayjs().format('HH:mm:ss')}</div>
      <div id="weekday">${dayjs().format('dddd')}</div>
      <div id="date">${dayjs().format('LL')}</div>
    `;
}

setInterval(renderTimeModule, 1000);



let cityBikeElement;

const getCityBikeData = (url, headers) => {
  fetch(url, headers)
  .then(res => res.json())
  .then(cityBikeData => {
    let cityBikeElement = initilizeCityBikeElement();
    addStationData(cityBikeData, cityBikeElement);
  })
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

const addStationData = (cityBikeData, cityBikeElement) => {
  let stationsDataArray = cityBikeData.data.stations;
  stationsDataArray.forEach(station => {
    if (stations_map.has(station.station_id)) {
      cityBikeElement += addStationToModule(station);
    }
  })
  document.getElementById('citybike').innerHTML = cityBikeElement;
};

const addStationToModule = (station) => {
  return `
    <div class="row">
      <a class="station">${stations_map.get(station.station_id)}</a>
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
  })
};

const handleData = (data) => {
  let departures = data.data.stopPlace.estimatedCalls
  document.getElementById('entur').innerHTML = `<div id="departures"></div>`;
  insertedDepartures = [];
  departures.forEach(dep => {
    departureName = dep.serviceJourney.journeyPattern.line.publicCode + ' ' + dep.destinationDisplay.frontText
    if (!insertedDepartures.includes(departureName)) {
      insertedDepartures.push(departureName);
      createAndInsertNewElement(departureName);
    }
    insertDeparture(dep.expectedArrivalTime)
  });
  if (departures.length == 0) {
    document.getElementById('entur').innerHTML = 'No departures';
  }
}

const createAndInsertNewElement = () => {
  let newElement = createNewElement();
  insertElement(newElement, departureName);
  insertNewDeparture(newElement)
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
  element.appendChild(document.createElement('ul'))
}

const insertDeparture = (expectedArrivalTime) => {
  if (document.getElementById(departureName).childNodes.length < 6) {        
    let newNode = document.createElement('a');
    newNode.setAttribute('class', 'timestamp')
    document.getElementById(departureName).appendChild(newNode)
    newNode.innerHTML = formatDepartureTime(expectedArrivalTime)
  }
}

const handleError = () => {
  document.getElementById('entur').innerHTML = 'No connection'
}

const formatDepartureTime = (timestamp) => { 
  let formattedTime = timestamp;
  if (dayjs(timestamp).diff(dayjs(), 'minutes') < 15) {
    formattedTime = dayjs(timestamp).fromNow()
  } else {
    formattedTime = dayjs(timestamp).format('HH:mm')
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
  const arr = []
  let sunriseTime = sunriseData.getElementsByTagName('sunrise')[0].getAttribute('time');
  let sunsetTime = sunriseData.getElementsByTagName('sunset')[0].getAttribute('time');
  arr.push(dayjs(sunriseTime, 'YYYY-MM-DDTHH:mm:ssZ').format('HH:mm'), dayjs(sunsetTime, 'YYYY-MM-DDTHH:mm:ssZ').format('HH:mm'))
  return arr
}

const getWeatherData = (forecastEndpoint, sunriseEndpoint, headers) => {
  let firstCall = fetch(forecastEndpoint, headers)
  let secondCall = fetch(sunriseEndpoint, headers)
  Promise.all([firstCall, secondCall])
  .then(values => Promise.all(values.map(value => value.text())))
  .then(data => {
    let forecastData = JSON.parse(data[0]);
    let sunriseData = (new DOMParser().parseFromString(data[1], 'text/xml')).getElementsByTagName('location')[0].getElementsByTagName('time')[0];
    weather(forecastData, sunriseData);
    })
}

const formatPrecipitation = (precipitation) => {
  if (precipitation >= 10) {
    return Math.round(precipitation)
  } else {
    return precipitation
  }
}

const makeWeatherList = (forecastList) => {
  let weatherList = []
  for (let i = 0; i < forecastList.length - 1; i++) {
    let timeStamp =  dayjs.utc(forecastList[i].time, 'YYYY-MM-DDTHH-mm-ssZ')
    
    let temperature = Math.round(forecastList[i].data.instant.details.air_temperature)
    let symbolCode, precipitation, precipitationMin, precipitationMax,
        nextSixHoursTemperatureMax, nextSixHoursTemperatureMin, nextSixHoursPrecipitationMax,
        nextSixHoursPrecipitationMin, nextSixHoursSymbolCode

    if (forecastList[i].data.hasOwnProperty('next_1_hours')) {
      symbolCode = forecastList[i].data.next_1_hours.summary.symbol_code
      precipitation = formatPrecipitation(forecastList[i].data.next_1_hours.details.precipitation_amount)
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
    )
  }
  return weatherList
}

const weather = (forecastData, sunriseData) => {
  let sunsetAndSunriseTimes = getSunriseAndSunsetTimes(sunriseData)
  let forecastTimeseries = forecastData.properties.timeseries
  let weatherList = makeWeatherList(forecastTimeseries)
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
  
  weatherElement += getForecasts(weatherList)
  
  document.getElementById('weather').innerHTML = weatherElement;
}


const getForecasts = (weatherList) => {
  let forecastElement = formatForecast(weatherList[1], false)
 
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc(weatherList[1].time).add(6, 'h').set({ 'minute': 0, 'second': 0, 'millisecond': 0 })), false);
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc().add(1, 'd').hour(12).minute(0).second(0).millisecond(0)), true);
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc().add(2, 'd').hour(12).minute(0).second(0).millisecond(0)), true);
  forecastElement += getForecast(weatherList, dayjs.utc(dayjs.utc().add(3, 'd').hour(12).minute(0).second(0).millisecond(0)), true);
  return forecastElement
}

const getForecast = (weatherList, timeObject, daily) => {
  let weatherNextSixHours = weatherList.filter(element => element.time.isSame(timeObject, 'second'))[0]
  if (weatherNextSixHours == undefined) {
    return ''
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
    temperature = weather.nextSixHoursTemperatureMin + '&deg; / ' + weather.nextSixHoursTemperatureMax + '&deg;';
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






let lat 
let lon
// Frogner
lat = 59.9299;
lon = 10.7149;
// NSR Stopplace ID Vigelandsparken:
// 58355;
// let NSR_id = 58355;
// let NSR_id = 58355;

// Oslo Citybike Stations:
let stations_map = new Map([
    ['395', 'Frogner Tennisklubb'], 
    ['436', 'Vestkanttorvet']
]);

// NSR info
// https://developer.entur.org/pages-nsr-nsr
// NSR id Sagene: 59894
// let NSR_id
//  = 59894;




// Api endpoints
let cityBikeStatusEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json';
let enturEndpoint = 'https://api.entur.io/journey-planner/v2/graphql';
let cityBikeInfoEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json';

// Request headers
const metApiHeaders = {
  method: 'GET',
  mode: 'cors',
  headers: {'User-agent': 'MagicMirror github.com/hhernes'},
};

const osloCityBikeHeaders = {
  method: 'GET',
  headers: {
    'Accept': '*/*',
    'Client-Identifier': 'MagicMirror github.com/hhernes',
  }
};



//let stations_json;


const getCityBikeStationData = (url) => {
  fetch(url, osloCityBikeHeaders)
  .then(res => res.json())
  .then(station_data => {
    return station_data
  })
}

let stations_json = getCityBikeStationData(cityBikeInfoEndpoint)
console.log(stations_json)

// Check if everything is setup
if (!localStorage.getItem('nsrId')) {
  console.log("No prev storage")
  hideElements()
} else {
  document.getElementById("inputs").style.display = "none"
  console.log("Found storage")
}
localStorage.clear()




if (localStorage.getItem('coordinates')) {
  let latitude, longitude = parseCoordinates(localStorage.getItem('coordinates'));
  console.log(latitude)
  console.log(longitude)
  let forecastEndpoint = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${latitude}&lon=${longitude}`
  let sunriseEndpoint = `https://api.met.no/weatherapi/sunrise/2.0/?lat=${latitude}&lon=${longitude}&date=${dayjs().format('YYYY-MM-DD')}&offset=+01:00`;
  getWeatherData(forecastEndpoint, sunriseEndpoint, metApiHeaders);
  setInterval(getWeatherData, 300000, forecastEndpoint, sunriseEndpoint, metApiHeaders);
}


if (localStorage.getItem('nsrId')) {
  let nsrId = parseInt(localStorage.getItem('nsrId'))

  const query = `
    {
      stopPlace(id: "NSR:StopPlace:${nsrId}") {
        id
        name
        estimatedCalls(timeRange: 3600 numberOfDepartures: 30) {
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
      'ET-Client-Name': 'MagicMirror github.com/hhernes'
    },
    body: JSON.stringify({query})
};

  renderPublicTransportModule(enturEndpoint, enturHeaders);
  setInterval(renderPublicTransportModule, 5000, enturEndpoint, enturHeaders);
}

if (localStorage.getItem('stationIds')) {
  getCityBikeData(cityBikeStatusEndpoint, osloCityBikeheaders);
  setInterval(getCityBikeData, 20000, cityBikeStatusEndpoint, osloCityBikeheaders);  
}
