import React from 'react';

const Weather = ({ city, unit }) => {
  const temperature = unit === 'C' ? '24°C' : '75°F';
  return (
    <div className="weather-card">
      <h2>Weather in {city}</h2>
      <p>Temperature: {temperature}</p>
    </div>
  );
};

export default Weather;
