let enturEndpoint = 'https://api.entur.io/journey-planner/v2/graphql';

const renderPublicTransportModule = (url, request) => {
  fetch(url, request)
  .then((res) => res.json())
  .then((data) => {
    handleData(data);
  });
};

const handleData = (data) => {
  let departures = data.data.stopPlace.estimatedCalls;
  document.getElementById('entur').innerHTML = `<div id="departures"></div>`;
  let insertedDepartures = [];
  departures.forEach(dep => {
    let departureName = dep.serviceJourney.journeyPattern.line.publicCode + ' ' + dep.destinationDisplay.frontText;
    if (!insertedDepartures.includes(departureName)) {
      insertedDepartures.push(departureName);
      createAndInsertNewElement(departureName);
    }
    insertDeparture(dep.expectedArrivalTime, departureName);
  });
  if (departures.length === 0) {
    document.getElementById('entur').innerHTML = 'No departures';
  }
}

const createAndInsertNewElement = (departureName) => {
  let newElement = createNewElement(departureName);
  insertElement(newElement, departureName);
  insertNewDeparture(newElement, departureName);
}

const createNewElement = (departureName) => {
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

const insertNewDeparture = (element, departureName) => {
  element.innerHTML = `<a class="fronttext" >${departureName}</a>`;
  element.appendChild(document.createElement('ul'));
}

const insertDeparture = (expectedArrivalTime, departureName) => {
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
  let formattedTime;
  if (dayjs(timestamp).diff(dayjs(), 'minutes') < 15) {
    formattedTime = dayjs(timestamp).fromNow();
  } else {
    formattedTime = dayjs(timestamp).format('HH:mm');
  }
  return formattedTime;
}