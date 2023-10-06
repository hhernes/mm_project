// Initialize the expires timestamp which will be compared to the expires header from met API
let expires = dayjs(0);

class Weather {
   constructor(time, temperature,
               nextSixHoursTemperatureMax, nextSixHoursTemperatureMin,
               nextSixHoursPrecipitationMax, nextSixHoursPrecipitationMin,
               nextSixHoursSymbolCode, nextHourSymbolCode = '', nextHourPrecipitation = -1,
               nextHourPrecipitationMin = -1, nextHourPrecipitationMax = -1) {
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
   let sunriseTime = sunriseData.properties.sunrise.time
   let sunsetTime = sunriseData.properties.sunset.time
   arr.push(dayjs(sunriseTime, 'YYYY-MM-DDTHH:mm:ssZ').format('HH:mm'), dayjs(sunsetTime, 'YYYY-MM-DDTHH:mm:ssZ').format('HH:mm'));
   return arr;
 }
 
 const getWeatherData = (latitude, longitude) => {
   let forecastEndpoint = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${latitude}&lon=${longitude}`;
   let sunriseEndpoint = `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${latitude}&lon=${longitude}&date=${dayjs().format('YYYY-MM-DD')}&offset=+01:00`;
   if (expires.isBefore(dayjs())) {
     let firstCall = fetch(forecastEndpoint);
     let secondCall = fetch(sunriseEndpoint);
     firstCall.then(response => expires = dayjs(response.headers.get('expires')));
     Promise.all([firstCall, secondCall])
     .then(values => Promise.all(values.map(value => value.text())))
     .then(data => {
       let forecastData = JSON.parse(data[0]);
       let sunriseData = JSON.parse(data[1]);
       renderWeatherModule(forecastData, sunriseData);
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
       new Weather(timeStamp, temperature,
                   nextSixHoursTemperatureMax, nextSixHoursTemperatureMin,
                   nextSixHoursPrecipitationMax, nextSixHoursPrecipitationMin,
                   nextSixHoursSymbolCode, symbolCode,
                   precipitation, precipitationMin, precipitationMax)
     );
   }
   return weatherList;
 }
 
 const renderWeatherModule = (forecastData, sunriseData) => {
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