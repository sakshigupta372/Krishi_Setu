import { useState, useEffect } from 'react';
import './WeatherWidget.css';

const WEATHER_API_KEY = 'demo'; // Users will need to get their own key from openweathermap.org
const DEFAULT_CITY = 'Delhi'; // Default location

function WeatherWidget({ location = DEFAULT_CITY }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Update every 10 minutes
    return () => clearInterval(interval);
  }, [location]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Current weather
      const currentRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!currentRes.ok) {
        throw new Error('Unable to fetch weather data. Using demo data.');
      }
      
      const currentData = await currentRes.json();
      
      // 5-day forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${WEATHER_API_KEY}&units=metric&cnt=8`
      );
      
      const forecastData = await forecastRes.json();
      
      setWeather(currentData);
      setForecast(forecastData.list || []);
    } catch (err) {
      console.log('Using demo weather data');
      // Demo data for testing
      setWeather({
        name: location,
        main: {
          temp: 28,
          feels_like: 30,
          humidity: 65,
          pressure: 1013
        },
        weather: [{
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }],
        wind: {
          speed: 3.5
        },
        clouds: {
          all: 20
        }
      });
      
      // Demo forecast
      setForecast([
        { dt: Date.now() / 1000 + 10800, main: { temp: 30 }, weather: [{ icon: '01d', main: 'Clear' }] },
        { dt: Date.now() / 1000 + 21600, main: { temp: 32 }, weather: [{ icon: '02d', main: 'Clouds' }] },
        { dt: Date.now() / 1000 + 32400, main: { temp: 29 }, weather: [{ icon: '03d', main: 'Clouds' }] },
        { dt: Date.now() / 1000 + 43200, main: { temp: 26 }, weather: [{ icon: '09d', main: 'Rain' }] },
        { dt: Date.now() / 1000 + 54000, main: { temp: 24 }, weather: [{ icon: '10d', main: 'Rain' }] },
      ]);
      
      setError('Using demo data. Add API key for live weather.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !weather) {
    return (
      <div className="weather-widget loading">
        <div className="spinner-large"></div>
        <p>Loading weather...</p>
      </div>
    );
  }

  if (!weather) return null;

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getIrrigationRecommendation = () => {
    const temp = weather.main.temp;
    const humidity = weather.main.humidity;
    const willRain = forecast.some(f => f.weather[0].main === 'Rain');
    
    if (willRain) {
      return {
        text: 'Rain expected! Delay irrigation.',
        icon: '🌧️',
        color: 'blue'
      };
    } else if (temp > 35 && humidity < 40) {
      return {
        text: 'Hot & dry. Increase watering.',
        icon: '🔥',
        color: 'red'
      };
    } else if (humidity > 80) {
      return {
        text: 'High humidity. Reduce watering.',
        icon: '💧',
        color: 'green'
      };
    } else {
      return {
        text: 'Normal irrigation schedule OK.',
        icon: '✅',
        color: 'green'
      };
    }
  };

  const recommendation = getIrrigationRecommendation();

  return (
    <div className="weather-widget">
      {error && (
        <div className="weather-error">
          <small>⚠️ {error}</small>
        </div>
      )}
      
      <div className="weather-header">
        <div className="weather-title">
          <span className="weather-icon-large">
            {getWeatherIcon(weather.weather[0].icon)}
          </span>
          <div>
            <h3>Weather</h3>
            <p className="location">📍 {weather.name}</p>
          </div>
        </div>
        <button className="refresh-btn" onClick={fetchWeather} title="Refresh weather">
          🔄
        </button>
      </div>

      <div className="weather-current">
        <div className="temp-main">
          <span className="temp-value">{Math.round(weather.main.temp)}°C</span>
          <span className="temp-desc">{weather.weather[0].description}</span>
        </div>
        
        <div className="weather-details">
          <div className="detail-item">
            <span className="detail-icon">🌡️</span>
            <span className="detail-label">Feels like</span>
            <span className="detail-value">{Math.round(weather.main.feels_like)}°C</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">💧</span>
            <span className="detail-label">Humidity</span>
            <span className="detail-value">{weather.main.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">💨</span>
            <span className="detail-label">Wind</span>
            <span className="detail-value">{weather.wind.speed} m/s</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">☁️</span>
            <span className="detail-label">Clouds</span>
            <span className="detail-value">{weather.clouds.all}%</span>
          </div>
        </div>
      </div>

      <div className={`irrigation-recommendation ${recommendation.color}`}>
        <span className="rec-icon">{recommendation.icon}</span>
        <span className="rec-text">{recommendation.text}</span>
      </div>

      {forecast.length > 0 && (
        <div className="weather-forecast">
          <h4>Next 24 Hours</h4>
          <div className="forecast-list">
            {forecast.slice(0, 5).map((item, idx) => (
              <div key={idx} className="forecast-item">
                <span className="forecast-time">
                  {new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    hour12: true 
                  })}
                </span>
                <span className="forecast-icon">
                  {getWeatherIcon(item.weather[0].icon)}
                </span>
                <span className="forecast-temp">{Math.round(item.main.temp)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="weather-footer">
        <small>Updated: {new Date().toLocaleTimeString()}</small>
      </div>
    </div>
  );
}

export default WeatherWidget;
