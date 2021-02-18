
let lat = 59.9299;
let lon = 10.7149;

// NSR Stopplace ID:
let NSR_id = 58355;

// Api endpoints

let sunriseDate = dayjs().format('YYYY-MM-DD')
console.log(sunriseDate)
let forecastEndpoint = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`
let cityBikeStatusEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json';
let cityBikeInfoEndpoint = 'https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json';
// might have t oupdate this in the weather function
let sunriseEndpoint = `https://api.met.no/weatherapi/sunrise/2.0/?lat=${lat}&lon=${lon}&date=${sunriseDate}&offset=+01:00`;
let enturEndpoint = 'https://api.entur.io/journey-planner/v2/graphql';

dayjs.extend(window.dayjs_plugin_localizedFormat)
dayjs.extend(window.dayjs_plugin_updateLocale)
dayjs.extend(window.dayjs_plugin_relativeTime)


let now = dayjs()
console.log(now)
console.log(dayjs())
console.log(now)


console.log(now)
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
  document.getElementById("timeModule").innerHTML = `
  <div id="clock">${dayjs().format("HH:mm:ss")}</div>
  <div id="weekday">${dayjs().format("dddd")}</div>
  <div id="date">${dayjs().format("LL")}</div>
`;
}

setInterval(renderTimeModule, 1000);

let headers = {
  method: "GET",
  headers: {
    'Accept': '*/*',
    "Client-Identifier": "MagicMirror github.com/hhernes",
  }
};


// Oslo Citybike Stations:
let stations_map = new Map([
  ["395", "Frogner Tennisklubb"], 
  ["436", "Vestkanttorvet"]
]);
let cityBikeElement;

const getCityBikeData = (url) => {
  fetch(url, headers)
  .then(res => res.json())
  .then(cityBikeData => {
    initilizeCityBikeElement();
    addStationData(cityBikeData);
  })
}

const initilizeCityBikeElement = () => {
  cityBikeElement = `
    <div class="row">
      <a class="station"></a>
      <a class="bike">Bikes</a>
      <a class="bike">Locks</a>
    </div>
    `;
};

const addStationData = (cityBikeData) => {
  let stationsDataArray = cityBikeData.data.stations;
  stationsDataArray.forEach(station => {
    if (stations_map.has(station.station_id)) {
      addStationToModule(station);
    }
  })
  document.getElementById("citybike").innerHTML = cityBikeElement;
};

const addStationToModule = (station) => {
  cityBikeElement += `
        <div class="row">
          <a class="station">${stations_map.get(station.station_id)}</a>
          <a class="bikes">${station.num_bikes_available}</a>
          <a class="bikes">${station.num_docks_available}</a>
        </div>
        `;
}

getCityBikeData(cityBikeStatusEndpoint);
setInterval(getCityBikeData, 20000, cityBikeStatusEndpoint);


function renderCityBikeModule(url) {
  fetch(url)
  .then(res => res.json())
  .then(data => {
    let arr = data.data.stations;
    cityBikeElement = `
    <div class="row">
      <a class="station"></a>
      <a class="bike">Bikes</a>
      <a class="bike">Locks</a>
    </div>
    `;
    arr.forEach(station => {
      if (stations_map.has(station.station_id)) {
        cityBikeElement += `
        <div class="row">
          <a class="station">${stations_map.get(station.station_id)}</a>
          <a class="bikes">${station.num_bikes_available}</a>
          <a class="bikes">${station.num_docks_available}</a>
        </div>
        `;
      }
    })
    document.getElementById("citybike").innerHTML = cityBikeElement;
  })
};

renderCityBikeModule(cityBikeStatusEndpoint);
setInterval(renderCityBikeModule, 20000, cityBikeStatusEndpoint);

  
const query = `
  {
    stopPlace(id: "NSR:StopPlace:${NSR_id}") {
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

headers = {
  method: "POST",
  headers: { "Content-Type": "application/json",
  "ET-Client-Name" : "MagicMirror github.com/hhernes"},
  body: JSON.stringify({ query })
};

// headers = {"ET-Client-Name" : "Haakon_Hernes - Infoskjerm"}
let insertedDepartures = [];
let departureName;

const renderPublicTransportModule = (url, headers) => {
  fetch(url, headers)
  .then((res) => res.json())
  .then((data) => {
    handleData(data);
  })
  // .catch(e => {
  //   handleError()
  // })
};

const handleData = (data) => {
  let departures = data.data.stopPlace.estimatedCalls
  document.getElementById("entur").innerHTML = `
    <div id='departures'></div>`;
  insertedDepartures = [];
  departures.forEach(dep => {
    departureName = dep.serviceJourney.journeyPattern.line.publicCode + ' ' + dep.destinationDisplay.frontText
    if (!insertedDepartures.includes(departureName)) {
      insertedDepartures.push(departureName);
      createAndInsertNewElement();
    }
    insertDeparture(dep.expectedArrivalTime)
  });
  if (departures.length == 0) {
    document.getElementById("entur").innerHTML = "No departures";
  }
}

const createAndInsertNewElement = () => {
  let newElement = createNewElement();
  insertElement(newElement);
  insertNewDeparture(newElement)
}

const createNewElement = () => {
  let newElement = document.createElement("ul");
  newElement.setAttribute("id", departureName);
  return newElement;
}

const insertElement = (element) => {
  let oldElement = document.getElementById(departureName);
  if (oldElement == null) {
    document.getElementById("departures").appendChild(element);
  } else {
    document.getElementById("departures").replaceChild(element, oldElement);
  }
}

const insertNewDeparture = (element) => {
  element.innerHTML = `<a class="fronttext" >${departureName}</a>`;
  element.appendChild(document.createElement("ul"))
}

const insertDeparture = (expectedArrivalTime) => {
  if (document.getElementById(departureName).childNodes.length < 6) {        
    let newNode = document.createElement("a");
    newNode.setAttribute("class", "timestamp")
    document.getElementById(departureName).appendChild(newNode)
    newNode.innerHTML = formatDepartureTime(expectedArrivalTime)
  }
}

const handleError = () => {
  document.getElementById("entur").innerHTML = 'No connection'
}

renderPublicTransportModule(enturEndpoint, headers);
setInterval(renderPublicTransportModule, 5000, enturEndpoint, headers);

const formatDepartureTime = (timestamp) => { 
  let formattedTime = timestamp;
  if (dayjs(timestamp).diff(dayjs(), 'minutes') < 15) {
    formattedTime = dayjs(timestamp).fromNow()
  } else {
    formattedTime = dayjs(timestamp).format("HH:mm")
  }
  return formattedTime;
}

headers = {
    method: "GET",   
    headers: {"User-agent": "MagicMirror github.com/hhernes"},
};

class Weather {
  constructor(time, temperature,
              nextHourSymbolCode = "", nextHourPrecipitation = -1,
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
  arr.push(dayjs(sunriseTime, "YYYY-MM-DDTHH:mm:ssZ").format("HH:mm"), dayjs(sunsetTime, "YYYY-MM-DDTHH:mm:ssZ").format("HH:mm"))
  return arr
}

const getWeatherData = () => {
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
    let timeStamp =  dayjs(forecastList[i].time, "YYYY-MM-DDTHH-mm-ssZ")
    
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

const weather = (forecastData, sunriseXML) => {
  let sunsetAndSunriseTimes = getSunriseAndSunsetTimes(sunriseXML)
  let forecastTimeseries = forecastData.properties.timeseries
  let weatherList = makeWeatherList(forecastTimeseries)
  let weatherElement = `
        <div class='tempNowContainer'>
          <div class='tempnow' id="temperatureNow">${weatherList[0].temperature + '&deg;'}</div>
          <div class='tempnow' id='tempInfo'>
              <div>
                <img src='/weatherIcons/${weatherList[0].nextHourSymbolCode}.svg' id="weatherSymbol"></img>
              </div>
              <div>
                <div id="precipitation">${weatherList[0].nextHourPrecipitation + ' mm'}</div>
              </div>
          </div>
        </div>
        <div id="sunrise">
            <b id='smallSun'>&#9728; &#8593; ${sunsetAndSunriseTimes[0]} &#8595; ${sunsetAndSunriseTimes[1]}</b>
        </div>
      `;
  
  weatherElement += getForecasts(weatherList)
  
  document.getElementById('weather').innerHTML = weatherElement;
}


const getForecasts = (weatherList) => {
  let forecastElement = formatForecast(weatherList[1], false)

  forecastElement += getForecast(weatherList, dayjs(dayjs(weatherList[1].time).add(6, 'h').set({ 'minute': 0, 'second': 0, 'millisecond': 0 })), false);
  forecastElement += getForecast(weatherList, dayjs(dayjs(dayjs()).add(1, 'd').set({'hour': 14, 'minute': 0, 'second': 0, 'millisecond': 0 })), true);
  forecastElement += getForecast(weatherList, dayjs(dayjs(dayjs()).add(2, 'd').set({ 'hour': 14, 'minute': 0, 'second': 0, 'millisecond': 0 })), true);
  // forecastElement += getForecast(weatherList, moment(moment(moment.now()).add(3, 'd').set({ 'hour': 14, 'minute': 0, 'second': 0, 'millisecond': 0 })), true);
  return forecastElement
}

const getForecast = (weatherList, timeObject, daily) => {
  let weatherNextSixHours = weatherList.filter(element => element.time.isSame(timeObject))[0]
  return formatForecast(weatherNextSixHours, daily);
  
}

const formatForecast = (weather, day) => {
  //let symbolCode = weather.nextSixHoursSymbolCode == undefined ? weather.nextHourSymbolCode : weather.nextSixHoursSymbolCode
  let symbolCode = weather == undefined ? weather.nextHourSymbolCode : weather.nextSixHoursSymbolCode
  let precipitation;
  if (weather.nextSixHoursPrecipitationMin == weather.nextSixHoursPrecipitationMax) {
    precipitation = weather.nextSixHoursPrecipitationMax;
  } else {
    precipitation = weather.nextSixHoursPrecipitationMin + " / " + weather.nextSixHoursPrecipitationMax
  }
  let temperature;
  if (weather.nextSixHoursTemperatureMin == weather.nextSixHoursTemperatureMax) {
    temperature = weather.nextSixHoursTemperatureMax + '&deg;'
  } else {
    temperature = weather.nextSixHoursTemperatureMin + '&deg; / ' + weather.nextSixHoursTemperatureMax + '&deg;'
  }
  let timePeriod;
  if (day) {
    timePeriod =  weather.time.format('dddd');
  } else {
    timePeriod = `${weather.time.format("HH")} - ${dayjs(weather.time).add(6, 'h').format("HH")}`;
  }
  return `
    <div class='line'>
      <a class="timeFrame">${timePeriod}</a>  
      <a class="symbol">
        <img src='/weatherIcons/${symbolCode}.svg' id="smallSymbol"></img>
      </a>        
      <a class="temperature">${temperature}</a>
      <a class="precipitation">${precipitation} mm</a>
    </div>
  `;
}


getWeatherData();
setInterval(getWeatherData, 300000);