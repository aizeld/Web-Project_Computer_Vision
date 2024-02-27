let map;

      function initMap(coordinates) {
        console.log(coordinates)
        if (map) {
          map.remove();
        }

        map = L.map("map").setView([coordinates.lat, coordinates.lon], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        L.marker([coordinates.lat, coordinates.lon]).addTo(map);
      }



async function getWeather() {
  const cityInput = document.getElementById('cityInput').value;
  const weatherDataElement = document.getElementById('weatherData');

  try {
    const response = await fetch(`/weather?city=${cityInput}`);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const Data = await response.json();
    console.log(Data);

    weatherDataElement.innerHTML = `
      <strong>${cityInput} Weather</strong>
      <p>Temperature: ${Data.weather.temperature}°C</p>
      <p>Description: ${Data.weather.description}</p>
      <p>Feels Like : ${Data.weather.feelsLike}°C</p>
        <p>Humidity: ${Data.weather.humidity}%</p>
        <p>Pressure ${Data.weather.pressure}hPa</p>
        <p>Wind Speed ${Data.weather.windSpeed} m/s</p>
      <strong>${Data.news.country} most popular news</strong>
      <p> 1 article : ${Data.news.article1.title}            url: <a href = "${Data.news.article1.url}" target="_blank">Tap here</a>  <p>
      <p> 2 article : ${Data.news.article2.title}            url: <a href = "${Data.news.article2.url}" target="_blank">Tap here</a>  <p>
      <p> 3 article : ${Data.news.article3.title}            url: <a href = "${Data.news.article3.url}" target="_blank">Tap here</a>  <p>
      <strong>Data about ${Data.news.country}</strong>
      <p> ${Data.country[0].name} is Country name </p>
      <p> ${Data.country[0].capital} is Country capital </p>
      <p> ${Data.country[0].currency.name} is their valute</p>
      
      `;

    initMap(Data.weather.coordinates);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    weatherDataElement.innerHTML = `<p>Error fetching weather data: ${error.message}</p>`;
  }
}

async function getWeatherDetailed() {
  const cityInput = document.getElementById('cityInput').value;
  const weatherDataElement = document.getElementById('weatherData');

  try {
    const response = await fetch(`/weather?city=${cityInput}`);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const Data = await response.json();
    console.log(Data);

    weatherDataElement.innerHTML = `
      <strong>${cityInput} Weather</strong>
      <p>Temperature: ${Data.weather.temperature}°C</p>
      <p>Max temp: ${Data.weather.max}°C Min temp: ${Data.weather.min}°C</p>
      <p>Description: ${Data.weather.description}</p>
      <p>Feels Like : ${Data.weather.feelsLike}°C</p>
        <p>Humidity: ${Data.weather.humidity}%</p>
        <p>Pressure ${Data.weather.pressure}hPa</p>
        <p>Wind Speed ${Data.weather.windSpeed} m/s</p>
        <p>RainVolume ${Data.weather.rainVolume} </p>
      
      <strong>${Data.news.country} most popular news</strong>
      <p> 1 article : ${Data.news.article1.title}            url: <a href = "${Data.news.article1.url}" target="_blank">Tap here</a>  <p>
      <p> 2 article : ${Data.news.article2.title}            url: <a href = "${Data.news.article2.url}" target="_blank">Tap here</a>  <p>
      <p> 3 article : ${Data.news.article3.title}            url: <a href = "${Data.news.article3.url}" target="_blank">Tap here</a>  <p>
      <p> 4 article : ${Data.news.article4.title}            url: <a href = "${Data.news.article4.url}" target="_blank">Tap here</a>  <p>
      <p> 5 article : ${Data.news.article5.title}            url: <a href = "${Data.news.article5.url}" target="_blank">Tap here</a>  <p>
      
      <strong>Data about ${Data.news.country}</strong>
      <p> ${Data.country[0].name} is Country name </p>
      <p> ${Data.country[0].capital} is Country capital </p>
      <p> ${Data.country[0].currency.name} is their valute</p>
      <p> Unemployment :${Data.country[0].unemployment}%</p>      
      <p> internet users: ${Data.country[0].internet_users}%</p>      
      <p> Surface area: ${Data.country[0].surface_area}m^2</p>   
      <p> Population: ${Data.country[0].population * 1000} people </p>   
      `;

    initMap(Data.weather.coordinates);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    weatherDataElement.innerHTML = `<p>Error fetching weather data: ${error.message}</p>`;
  }
}