const PROXY_API = "https://cors-anywhere.herokuapp.com/";
const COUNTRIES_API_ROOT_URL = "https://restcountries.herokuapp.com/api/v1/";
const CORONA_API_ROOT_URL = "https://corona-api.com/";

const appInfo = { Asia: {}, Africa: {}, Americas: {}, Europe: {} };
const covidParams = ["confirmed", "deaths", "recovered", "critical"];
const currentSelectedParams = {
  covidParam: "confirmed",
  continent: "World",
  country: null,
};

const chartData = {
  labels: [1, 2, 3, 4],
  data: ["a", "b", "c", "d"],
  location: "World",
  covidParam: "confirmed",
  chart: null,
};

const countryData = {
  deaths: null,
  newDeaths: null,
  recovered: null,
};

//html elements
const spinnerElement = document.querySelector(".spinner");
const continentsElement = document.querySelector("#continents");
const countriesElement = document.querySelector("#countries");
const covidParamsElement = document.querySelector("#covid-params");
const chartElement = document.querySelector("#covid-chart");
const chartContainer = document.querySelector("#chart-container");
const countryDataElement = document.querySelector("#country-data");
const countryDataContainer = document.querySelector("country-data-container");
//creating HTML elements

function createButton(innerText, onClickFunction, dataAttrObj) {
  const button = document.createElement("button");
  button.classList.add(`button`);
  button.onclick = onClickFunction;
  button.innerText = innerText;
  if (dataAttrObj) {
    for (const [key, value] of Object.entries(dataAttrObj)) {
      button.dataset[key] = value;
    }
  }
  return button;
}

function createCountryDataElement(continent, country) {
  const covidParams = [
    "recovered",
    "confirmed",
    "new_confirmed",
    "deaths",
    "new_deaths",
    "critical",
  ];
  removeAllChildNodes(countryDataElement);
  countryDataElement.classList.add("selected-country-data");
  covidParams.forEach((param) => {
    const countryDataBox = document.createElement("div");
    const dataHeading = document.createElement("h3");
    dataHeading.innerText = param;
    const dataValue = document.createElement("p");
    dataValue.innerText = appInfo[continent][country][param]
      ? appInfo[continent][country][param]
      : 0;
    countryDataBox.appendChild(dataHeading);
    countryDataBox.appendChild(dataValue);
    countryDataElement.appendChild(countryDataBox);
  });
}

//chart creation
function createChartElem() {
  const chartProps = {
    type: "line",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.location,
          data: chartData.data,
          backgroundColor: "rgba(153, 102, 255, 0.2)",

          borderColor: "rgba(255, 159, 64, 1)",

          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  };
  const chart = new Chart(chartElement.getContext("2d"), chartProps);
  chartData.chart = chart;
}

function updateChart() {
  debugger;
  const chart = chartData.chart;
  chart.chart.data.labels = chartData.labels;
  chart.data.datasets[0].data = chartData.data;
  chart.data.datasets[0].label = `${chartData.covidParam} in ${chartData.location}`;
  chart.update();
}

//DOM manipulation
function hideElement(element) {
  if (element && element.classList) {
    element.classList.add("hide");
  }
}
function showElement(element) {
  if (element.classList && [...element.classList].includes("hide")) {
    element.classList.remove("hide");
  }
}
function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

//filter app data
const filterCountry = (continentInfo, country) => {
  return continentInfo.filter((item) => item.name === country)[0];
};

//fetch requests

// fetch(PROXY_API + COUNTRIES_API_ROOT_URL).then((res) => {
//   console.log("response from proxy", res.json());
// });

const fetchCountriesInContinent = (continent = null) => {
  const fields = continent ? `?continent=${continent}` : "";
  const countries = fetch(`${PROXY_API}${COUNTRIES_API_ROOT_URL}${fields}`)
    .then((response) => {
      const countries = response.json();
      return countries;
    })
    .catch((err) => console.error(err));
  return countries;
};

const fetchGlobalInfo = () => {
  const globalInfo = fetch(`${CORONA_API_ROOT_URL}/countries`)
    .then((response) => response.json())
    .then((response) => response.data)
    .catch((err) => console.error(err));
  return globalInfo;
};

function arrangeInfo([globalInfo, countries]) {
  const worldInfoMap = {};
  for (const country of globalInfo) {
    worldInfoMap[country.name] = country;
  }
  for (const country of countries) {
    const key = country.name.common;
    const covid_country_data = worldInfoMap[country.name.common];
    if (appInfo[country.region] && covid_country_data) {
      appInfo[country.region][key] = {
        ...covid_country_data.latest_data,
        new_confirmed: covid_country_data.today.confirmed,
        new_deaths: covid_country_data.today.deaths,
      };
    }
  }
}

function filterByContinentAndCovidParam(continent, param) {
  let labels = [],
    data = [];
  debugger;
  if (continent !== "World") {
    Object.entries(appInfo[continent]).forEach(([country, countryData]) => {
      labels.push(country);
      data.push(countryData[param]);
    });
    debugger;
  } else {
    Object.values(appInfo).forEach((continentData) => {
      Object.entries(continentData).forEach(([country, countryData]) => {
        labels.push(country);
        data.push(countryData[param]);
      });
    });
  }

  chartData.data = data;
  chartData.labels = labels;
  chartData.location = continent;
  chartData.covidParam = param;
}
const filterByCountry = (continent, country) => {
  return appInfo[continent][country];
};
function createCountriesButtons(continent) {
  removeAllChildNodes(countriesElement);
  if (continent !== "World") {
    Object.keys(appInfo[continent]).forEach((country) => {
      const button = createButton(country, handleCountryClick, {
        country: country,
        continent: continent,
      });
      countriesElement.appendChild(button);
    });
  } else {
    Object.keys(appInfo).forEach((continent) => {
      Object.keys(appInfo[continent]).forEach((country) => {
        const button = createButton(country, handleCountryClick, {
          country: country,
          continent: continent,
        });
        countriesElement.appendChild(button);
      });
    });
  }
}

function handleParamOrContinentClick(event) {
  debugger;
  const continent = event.target.dataset.continent || chartData.location;
  const covidParam = event.target.dataset["covidParam"] || chartData.covidParam;
  const filteredData = filterByContinentAndCovidParam(continent, covidParam);
  //update the chart
  updateChart();
  //recreate the countries buttons
  removeAllChildNodes(countriesElement);
  createCountriesButtons(continent);
  hideElement(countryDataElement);
  showElement(chartContainer);
}
const handleCountryClick = (event) => {
  const continent = event.target.dataset.continent;
  const country = event.target.dataset.country;
  filterByCountry(continent, country);
  //update the country element
  hideElement(chartContainer);
  createCountryDataElement(continent, country);
  showElement(countryDataElement);
};

function getData() {
  const globalInfoPromise = fetchGlobalInfo();
  const countriesPromise = fetchCountriesInContinent();
  const results = Promise.all([globalInfoPromise, countriesPromise]);
  results
    .then((res) => {
      arrangeInfo(res);
      createChartElem();
      //filtering data
      filterByContinentAndCovidParam("World", "confirmed");
      //update chart
      updateChart();
      //showchart
      //create continents buttons
      Object.keys(appInfo).forEach((param) => {
        const button = createButton(param, handleParamOrContinentClick, {
          continent: param,
        });
        continentsElement.appendChild(button);
      });
      //create a World button"
      const button = createButton("World", handleParamOrContinentClick, {
        continent: "World",
      });
      continentsElement.appendChild(button);
      //create countries
      Object.keys(appInfo).forEach((continent) =>
        createCountriesButtons(continent)
      );

      //create covidParams
      covidParams.forEach((param) => {
        const button = createButton(param, handleParamOrContinentClick, {
          covidParam: param,
        });
        covidParamsElement.appendChild(button);
      });
    })
    .catch((err) => console.error(err));
}
function getDatafromServer() {
  fetch("http://localhost:5000/api/collect")
    .then((res) => res.json())
    .then((result) => {
      hideElement(spinnerElement);
      appInfo.Africa = result.data.Africa;
      appInfo.Asia = result.data.Asia;
      appInfo.Americas = result.data.Americas;
      appInfo.Europe = result.data.Europe;
      //create Dom elements
      createChartElem();
      //filtering data
      filterByContinentAndCovidParam("World", "confirmed");
      //update chart
      updateChart();
      //create continents buttons
      Object.keys(appInfo).forEach((param) => {
        const button = createButton(param, handleParamOrContinentClick, {
          continent: param,
        });
        continentsElement.appendChild(button);
      });
      //create a World button"
      const button = createButton("World", handleParamOrContinentClick, {
        continent: "World",
      });
      continentsElement.appendChild(button);
      //create countries
      Object.keys(appInfo).forEach((continent) => {
        createCountriesButtons(continent);
      });

      //create covidParams
      covidParams.forEach((param) => {
        const button = createButton(param, handleParamOrContinentClick, {
          covidParam: param,
        });
        covidParamsElement.appendChild(button);
      });
    })
    .catch((err) => console.error(err));
}
// getData();
getDatafromServer();
