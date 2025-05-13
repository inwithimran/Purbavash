/**
 * @license MIT
 * @copyright Imran 2024 All rights reserved
 * @author Imran <mailwithimran@gmail.com>
 */

"use strict";

import { fetchData, url } from "./api.js";
import * as module from "./module.js";

const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

window.addEventListener("mousemove", function (e) {
  cursorDot.style.left = e.clientX + "px";
  cursorDot.style.top = e.clientY + "px";
  cursorOutline.animate(
    {
      left: e.clientX + "px",
      top: e.clientY + "px",
    },
    {
      duration: 200,
      fill: "forwards",
    }
  );
});

/**
 * ------------------------------ Add event listener on multiple elements ------------------------------
 * @param {NodeList} elements Elements node array
 * @param {string} eventType Event Type e.g.; "click", "mouseover"
 * @param {Function} callback Callback function
 */
const addEventOnElements = function (elements, eventType, callback) {
  for (const element of elements) element.addEventListener(eventType, callback);
};

/**
 * ---------------------------------- Toggle Search in Mobile Devices -----------------------------------
 */
const searchView = document.querySelector("[data-search-view]");
const searchTogglers = document.querySelectorAll("[data-search-toggler]");

const toggleSearch = () => searchView.classList.toggle("active");
addEventOnElements(searchTogglers, "click", toggleSearch);

/**
 * ----------------------------------------- Search Integration ------------------------------------------
 */
const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

searchField.addEventListener("input", function () {
  searchTimeout ?? clearTimeout(searchTimeout);
  if (!searchField.value) {
    searchResult.classList.remove("active");
    searchResult.innerHTML = "";
    searchField.classList.remove("searching");
  } else {
    searchField.classList.add("searching");
  }

  if (searchField.value) {
    searchTimeout = setTimeout(() => {
      fetchData(url.geo(searchField.value), function (locations) {
        searchField.classList.remove("searching");
        searchResult.classList.add("active");
        searchResult.innerHTML = `
          <ul class="view-list" data-search-list></ul>
        `;

        const /** {NodeList} | [] */ items = [];
        for (const { name, lat, lon, country, state } of locations) {
          const searchItem = document.createElement("li");
          searchItem.classList.add("view-item");
          searchItem.innerHTML = `
            <span class="m-icon">location_on</span>
            <div>
              <p class="item-title">${name}</p>
              <p class="label-2 item-subtitle">${state || ""} ${country}</p>
            </div>
            <a href="#/weather?lat=${lat}&lon=${lon}" class="item-link has-state" aria-label="${name} weather" data-search-toggler></a>
          `;

          searchResult
            .querySelector("[data-search-list]")
            .appendChild(searchItem);
          items.push(searchItem.querySelector("[data-search-toggler]"));
        }

        addEventOnElements(items, "click", function () {
          toggleSearch();
          searchResult.classList.remove("active");
        });
      });
    }, searchTimeoutDuration);
  }
});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");

/**
 * ---------------------------------- Current Location Button Handler -----------------------------------
 */
currentLocationBtn.addEventListener("click", function () {
  window.location.hash = "#/current-location";
});

/**
 * ---------------------------------- Bottom Tab Navigation -----------------------------------
 */
const tabButtons = document.querySelectorAll("[data-tab-btn]");
const tabContents = document.querySelectorAll("[data-tab-content]");

const switchTab = function () {
  const targetId = this.getAttribute("data-tab-target");

  // Remove active class from all tabs
  tabButtons.forEach((btn) => btn.classList.remove("active"));
  // Add active class to clicked tab
  this.classList.add("active");

  // Remove fade-in class from container to reset animation
  container.classList.remove("slide-in");

  // Hide all content sections
  tabContents.forEach((content) => (content.style.display = "none"));

  // Show target content section with a slight delay to trigger animation
  const targetContent = document.getElementById(targetId);
  setTimeout(() => {
    targetContent.style.display = "block";
    container.classList.add("slide-in");
  }, 10); // Small delay to ensure the animation is triggered
};

addEventOnElements(tabButtons, "click", switchTab);

/**
 * --------------------------- Render All Weather Data in the HTML Page ------------------------------
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 */
export const updateWeather = function (lat, lon) {
  loading.classList.add("active"); // Show loading
  container.style.overflowY = "hidden";
  container.classList.remove("fade-in");
  errorContent.style.display = "none";

  const currentWeatherSection = document.querySelector("[data-current-weather]");
  const hourlySection = document.querySelector("[data-hourly-forecast]");
  const highlightSection = document.querySelector("[data-highlights]");
  const forecastSection = document.querySelector("[data-5-day-forecast]");

  currentWeatherSection.innerHTML = "";
  hourlySection.innerHTML = "";
  highlightSection.innerHTML = "";
  forecastSection.innerHTML = "";

  if (window.location.hash === "#/current-location") {
    currentLocationBtn.setAttribute("disabled", "");
  } else {
    currentLocationBtn.removeAttribute("disabled");
  }

  /**
   * ----------------------------------- Current Weather Section ----------------------------------------
   */
  fetchData(url.currentWeather(lat, lon), function (currentWeather) {
    const {
      weather,
      dt: dateUnix,
      sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
      main: { temp, feels_like, pressure, humidity },
      visibility,
      timezone,
    } = currentWeather;
    const [{ description, icon }] = weather;
    const card = document.createElement("div");
    card.classList.add("card", "card-lg", "current-weather-card");

    // Determine the icon based on the description
    const weatherIcon = description === "broken clouds" ? "04.0d" : icon;

    card.innerHTML = `
      <h2 class="title-2 card-title">Now</h2>
      <div class="weapper">
        <p class="heading">${parseInt(temp)}°<sup>c</sub></p>
        <img
          src="./public/images/weather_icons/${weatherIcon}.png"
          width="64"
          height="64"
          alt="${description}"
          class="weather-icon"
        />
      </div>
      <p class="body-3">${description}</p>
      <ul class="meta-list">
        <li class="meta-item">
          <span class="m-icon">calendar_today</span>
          <p class="title-3 meta-text">${module.getDate(dateUnix, timezone)}</p>
        </li>
        <li class="meta-item">
          <span class="m-icon">location_on</span>
          <p class="title-3 meta-text" data-location></p>
        </li>
      </ul>
    `;

    fetchData(url.reverseGeo(lat, lon), function ([{ name, country }]) {
      card.querySelector("[data-location]").innerHTML = `${name}, ${country}`;
    });
    currentWeatherSection.appendChild(card);

    /**
     * ------------------------------------ 24-Hour Forecast Section ------------------------------------------
     */
    fetchData(url.forecast(lat, lon), function (forecast) {
      const {
        list: forecastList,
        city: { timezone },
      } = forecast;

      hourlySection.innerHTML = `
        <div class="card card-lg">
          <h2 class="title-2">Today at</h2>
          <div class="slider-container">
            <ul class="slider-list" data-hourly></ul>
          </div>
        </div>
      `;

      for (const [index, data] of forecastList.entries()) {
        if (index > 7) break;
        const {
          dt: dateTimeUnix,
          main: { temp },
          weather,
          wind: { deg: windDirection, speed: windSpeed },
        } = data;
        const [{ icon, description }] = weather;

        const weatherIcon = description === "broken clouds" ? "04.0d" : icon;

        const hourlyLi = document.createElement("li");
        hourlyLi.classList.add("slider-item");
        hourlyLi.innerHTML = `
          <div class="hourly-item">
            <p class="body-3 time">${module.getHours(dateTimeUnix, timezone)}</p>
            <div class="weather-info">
              <img
                src="./public/images/weather_icons/${weatherIcon}.png"
                width="36"
                height="36"
                loading="lazy"
                title="${description}"
                alt="${description}"
                class="weather-icon"
              />
              <p class="body-3 temp">${parseInt(temp)}°</p>
            </div>
            <div class="wind-info">
              <img
                src="./public/images/weather_icons/direction.png"
                width="24"
                height="24"
                loading="lazy"
                alt="direction"
                class="wind-direction"
                style="transform: rotate(${windDirection - 180}deg)"
              />
              <p class="body-3 wind-speed">${parseInt(module.mps_to_kmh(windSpeed))} km/h</p>
            </div>
          </div>
        `;
        hourlySection.querySelector("[data-hourly]").appendChild(hourlyLi);
      }

      /**
       * ------------------------------------ Today's Highlights ---------------------------------------------
       */
      fetchData(url.airPollution(lat, lon), function (airPollution) {
        const [
          {
            main: { aqi },
            components: { no2, o3, so2, pm2_5 },
          },
        ] = airPollution.list;

        const card = document.createElement("div");
        card.classList.add("card", "card-lg");

        card.innerHTML = `
          <h2 class="title-2" id="highlights-label">Today's Highlights</h2>
          <div class="highlight-list">
            <div class="highlight-card">
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-wrapper">
                    <span class="m-icon">humidity_percentage</span>
                    <p class="label-1">Humidity</p>
                  </div>
                  <p class="title-3">${humidity}%</p>
                </div>
                <div class="detail-item">
                  <div class="detail-wrapper">
                    <span class="m-icon">airwave</span>
                    <p class="label-1">Pressure</p>
                  </div>
                  <p class="title-3">${pressure}hPa</p>
                </div>
                <div class="detail-item">
                  <div class="detail-wrapper">
                    <span class="m-icon">thermostat</span>
                    <p class="label-1">Feels Like</p>
                  </div>
                  <p class="title-3">${parseInt(feels_like)}°C</p>
                </div>
                <div class="detail-item">
                  <div class="detail-wrapper">
                    <span class="m-icon">visibility</span>
                    <p class="label-1">Visibility</p>
                  </div>
                  <p class="title-3">${visibility / 1000} km</p>
                </div>
                <div class="detail-item">
                  <div class="detail-wrapper">
                    <span class="m-icon">clear_day</span>
                    <p class="label-1">Sunrise</p>
                  </div>
                  <p class="title-3">${module.getTime(sunriseUnixUTC, timezone)}</p>
                </div>
                <div class="detail-item">
                  <div class="detail-wrapper">
                    <span class="m-icon">clear_night</span>
                    <p class="label-1">Sunset</p>
                  </div>
                  <p class="title-3">${module.getTime(sunsetUnixUTC, timezone)}</p>
                </div>
              </div>
              <div class="aqi-section">
                <div class="aqi-header">
                  <span class="m-icon">air</span>
                  <h3 class="title-3" style="display: inline; margin: 0;">Air Quality Index</h3>
                </div>
                <span class="badge aqi-${aqi}" title="${module.aqiText[aqi].message}">
                  ${module.aqiText[aqi].level}
                </span>
                <p class="body-3 aqi-description">${module.aqiText[aqi].message}</p>
                <div class="aqi-values">
                  <div class="aqi-item">
                    <p class="label-1">PM2.5</p>
                    <p class="title-3">${pm2_5.toPrecision(3)}</p>
                  </div>
                  <div class="aqi-item">
                    <p class="label-1">SO2</p>
                    <p class="title-3">${so2.toPrecision(3)}</p>
                  </div>
                  <div class="aqi-item">
                    <p class="label-1">NO2</p>
                    <p class="title-3">${no2.toPrecision(3)}</p>
                  </div>
                  <div class="aqi-item">
                    <p class="label-1">O3</p>
                    <p class="title-3">${o3.toPrecision(3)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        highlightSection.appendChild(card);
      });

      /**
       * ------------------------------------ 5-Day Forecast Section --------------------------------------------
       */
      forecastSection.innerHTML = `
        <div class="card card-lg forecast-card">
          <h2 class="title-2" id="forecast-label">5 Days Forecast</h2>
          <ul data-forecast-list></ul>
        </div>
      `;

      for (let i = 7, len = forecastList.length; i < len; i += 8) {
        const {
          main: { temp_max },
          weather,
          dt_txt,
        } = forecastList[i];
        const [{ icon, description }] = weather;

        const weatherIcon = description === "broken clouds" ? "04.0d" : icon;

        const date = new Date(dt_txt);
        const li = document.createElement("li");
        li.classList.add("card-item");
        li.innerHTML = `
          <div class="icon-wrapper">
            <img
              src="./public/images/weather_icons/${weatherIcon}.png"
              width="36"
              height="36"
              alt="${description}"
              class="weather-icon"
              title="${description}"
            />
            <span class="span">
              <p class="title-2">${parseInt(temp_max)}°</p>
            </span>
          </div>
          <p class="label-1">${date.getDate()} ${
          module.monthNames[date.getUTCMonth()]
        }</p>
          <p class="label-1">${module.weekDayNames[date.getUTCDay()]}</p>
        `;
        forecastSection.querySelector("[data-forecast-list]").appendChild(li);
      }

      loading.classList.remove("active"); // Hide loading
      container.style.overflowY = "overlay";
      container.classList.add("fade-in");
    });
  });
};

export const error404 = () => {
  errorContent.style.display = "flex";
  loading.classList.remove("active"); // Ensure loading is hidden on error
};