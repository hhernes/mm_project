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

renderTimeModule()
setInterval(renderTimeModule, 1000);