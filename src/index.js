
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import './App.css'; // Importing the CSS file for stylin
// g
import axios from 'axios';

const root = createRoot(document.getElementById('root'));

const App = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const API_KEY =process.env.REACT_APP_WEATHER_API_KEY;

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      fetchWeatherByCoords(latitude, longitude);
    });

    const stored = JSON.parse(localStorage.getItem('recentCities') || '[]');
    setRecent(stored);
  }, []);

  const updateRecentCities = (cityName) => {
    const updated = [cityName, ...recent.filter(c => c.toLowerCase() !== cityName.toLowerCase())].slice(0, 5);
    setRecent(updated);
    localStorage.setItem('recentCities', JSON.stringify(updated));
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData);
      updateRecentCities(weatherData.name);

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const forecastData = await forecastRes.json();
      setForecast(forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5));
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    if (!cityName.trim()) return;
    setLoading(true);
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${API_KEY}`
      );
      const weatherData = await weatherRes.json();
      if (weatherData.cod !== 200) throw new Error(weatherData.message);
      
      setWeather(weatherData);
      updateRecentCities(cityName);

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${API_KEY}`
      );
      const forecastData = await forecastRes.json();
      setForecast(forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5));
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeatherByCity(city);
    setCity('');
  };

  return (
    <div className={`app-container ${dark ? 'dark' : ''}`}>
      <div className="content-container">
        <header className="header">
          <h1 className="title">Weather App </h1>
          <button 
            onClick={() => setDark(!dark)} 
            className="toggle-button"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </header>

        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            className="search-input"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {recent.length > 0 && (
          <div className="recent-cities">
            {recent.map((cityName, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchWeatherByCity(cityName)}
                className="recent-button"
              >
                {cityName}
              </motion.button>
            ))}
          </div>
        )}

        {weather && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="weather-card"
          >
            <h2 className="weather-city">{weather.name}</h2>
            <p className="weather-description">
              {weather.weather?.[0]?.description || "Weather data unavailable"}
            </p>
            <p className="weather-temp">{Math.round(weather.main?.temp)}°C</p>
            <div className="weather-details">
              <span>Humidity: {weather.main?.humidity ?? 'N/A'}%</span>
              <span>Wind: {weather.wind?.speed ?? 'N/A'} m/s</span>
            </div>
          </motion.div>
        )}

        {forecast.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="forecast-container"
          >
            {forecast.map((day, i) => (
              <motion.div
                key={i}
                className="forecast-card"
              >
                <h3 className="forecast-day">
                  {new Date(day.dt_txt).toLocaleDateString(undefined, { weekday: 'short' })}
                </h3>
                <img
                  src={`https://openweathermap.org/img/wn/${day.weather?.[0]?.icon || '01d'}@2x.png`}
                  alt="Weather icon"
                  className="forecast-icon"
                />
                <p className="forecast-temp">{Math.round(day.main?.temp ?? 'N/A')}°C</p>
                <p className="forecast-description">{day.weather?.[0]?.description || "N/A"}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {forecast.length > 0 && (
          <div className="temperature-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <XAxis 
                  dataKey="dt_txt" 
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}°C`, 'Temperature']}
                  labelFormatter={(str) => new Date(str).toLocaleString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="main.temp" 
                  stroke={dark ? "#93c5fd" : "#1e40af"} 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

root.render(<App />);
