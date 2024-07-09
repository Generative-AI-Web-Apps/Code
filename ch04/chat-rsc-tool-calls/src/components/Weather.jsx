export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>
  );
};

export const fetchWeatherData = async (city) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockWeatherData = {
    temperature: Math.floor(Math.random() * 30) + 5,
    condition: ['Sunny', 'Cloudy', 'Rainy', 'Windy'][Math.floor(Math.random() * 4)],
  };

  return mockWeatherData;
};

export const WeatherCard = ({ city, temperature, condition }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">{city}</h2>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-3xl font-bold">{temperature}°C</p>
          <p className="text-gray-500">{condition}</p>
        </div>
        <div className="text-4xl">
          {condition === 'Sunny' && '☀️'}
          {condition === 'Cloudy' && '☁️'}
          {condition === 'Rainy' && '🌧️'}
          {condition === 'Windy' && '💨'}
        </div>
      </div>
    </div>
  );
};
