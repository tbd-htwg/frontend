/**
 * WMO weather interpretation codes (WW) from Open-Meteo.
 * @see backend WeatherDescription.java and https://open-meteo.com/en/docs
 */
export function weatherEmojiForCode(code: number): string {
  switch (code) {
    case 0:
      return '☀️' // Clear sky
    case 1:
      return '🌤️' // Mainly clear
    case 2:
      return '⛅' // Partly cloudy
    case 3:
      return '☁️' // Overcast
    case 45:
    case 48:
      return '🌫️' // Fog / depositing rime fog
    case 51:
    case 53:
    case 55:
      return '🌦️' // Drizzle (light → dense)
    case 56:
    case 57:
      return '🌧️' // Freezing drizzle
    case 61:
      return '🌦️' // Slight rain
    case 63:
      return '🌧️' // Moderate rain
    case 65:
      return '🌧️' // Heavy rain
    case 66:
    case 67:
      return '🌧️' // Freezing rain
    case 71:
      return '🌨️' // Slight snow
    case 73:
      return '❄️' // Moderate snow
    case 75:
      return '❄️' // Heavy snow
    case 77:
      return '🌨️' // Snow grains
    case 80:
      return '🌦️' // Slight rain showers
    case 81:
      return '🌧️' // Moderate rain showers
    case 82:
      return '⛈️' // Violent rain showers
    case 85:
      return '🌨️' // Slight snow showers
    case 86:
      return '❄️' // Heavy snow showers
    case 95:
      return '⛈️' // Thunderstorm
    case 96:
    case 99:
      return '⛈️' // Thunderstorm with hail
    default:
      return '🌡️'
  }
}
