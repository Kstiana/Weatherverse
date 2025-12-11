const CONFIG = {
    BASE_URL: '/api',
    GEO_URL: 'http://api.openweathermap.org/geo/1.0',
    DEFAULT_LOCATION: { city: 'Benin City', country: 'NG', lat: 6.335, lon: 5.627 },
    DEFAULT_UNITS: { temp: 'celsius', speed: 'kmh' },
    CACHE_DURATION: {
        current: 10,
        forecast: 30,
        airQuality: 60
    }
};

let state = {
    currentLocation: null,
    currentWeather: null,
    hourlyForecast: null,
    dailyForecast: null,
    airQuality: null,
    uvIndex: null,
    alerts: [],
    favorites: [],
    recentSearches: [],
    settings: {
        tempUnit: 'celsius',
        speedUnit: 'kmh',
        animations: true,
        autoRefresh: true,
        notifications: false,
        apiKey: CONFIG.API_KEY
    },
    isLoading: false,
    lastUpdate: null,
    autoRefreshInterval: null
};

const elements = {
    loadingScreen: document.getElementById('loadingScreen'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    tempUnitBtn: document.getElementById('tempUnitBtn'),
    speedUnitBtn: document.getElementById('speedUnitBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    shareBtn: document.getElementById('shareBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    recentSearches: document.getElementById('recentSearches'),
    mobileMenu: document.getElementById('mobileMenu'),
    closeMenuBtn: document.getElementById('closeMenuBtn'),
    mobileFavoritesBtn: document.getElementById('mobileFavoritesBtn'),
    mobileAlertsBtn: document.getElementById('mobileAlertsBtn'),
    mobileSettingsBtn: document.getElementById('mobileSettingsBtn'),
    mobileAboutBtn: document.getElementById('mobileAboutBtn'),
    alertsBadge: document.getElementById('alertsBadge'),
    locationBtn: document.getElementById('locationBtn'),
    locationName: document.getElementById('locationName'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    favoriteIcon: document.getElementById('favoriteIcon'),
    lastUpdated: document.getElementById('lastUpdated'),
    weatherIconLarge: document.getElementById('weatherIconLarge'),
    temperatureDisplay: document.getElementById('temperatureDisplay'),
    weatherCondition: document.getElementById('weatherCondition'),
    feelsLike: document.getElementById('feelsLike'),
    windSpeed: document.getElementById('windSpeed'),
    humidity: document.getElementById('humidity'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    weatherAlerts: document.getElementById('weatherAlerts'),
    hourlyForecast: document.getElementById('hourlyForecast'),
    dailyForecast: document.getElementById('dailyForecast'),
    sunriseTime: document.getElementById('sunriseTime'),
    sunsetTime: document.getElementById('sunsetTime'),
    dayProgress: document.getElementById('dayProgress'),
    dayProgressBar: document.getElementById('dayProgressBar'),
    aqiValue: document.getElementById('aqiValue'),
    aqiIndicator: document.getElementById('aqiIndicator'),
    aqiRecommendation: document.getElementById('aqiRecommendation'),
    uvValue: document.getElementById('uvValue'),
    uvIndicator: document.getElementById('uvIndicator'),
    uvRecommendation: document.getElementById('uvRecommendation'),
    weatherDetails: document.getElementById('weatherDetails'),
    editFavoritesBtn: document.getElementById('editFavoritesBtn'),
    favoritesContainer: document.getElementById('favoritesContainer'),
    insightsContent: document.getElementById('insightsContent'),
    weatherElements: document.getElementById('weatherElements'),
    settingsModal: document.getElementById('settingsModal'),
    settingsClose: document.getElementById('settingsClose'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    aboutModal: document.getElementById('aboutModal'),
    aboutClose: document.getElementById('aboutClose'),
    notification: document.getElementById('notification')
};

const WEATHER_ICONS = {
    '01d': 'fas fa-sun',
    '01n': 'fas fa-moon',
    '02d': 'fas fa-cloud-sun',
    '02n': 'fas fa-cloud-moon',
    '03d': 'fas fa-cloud',
    '03n': 'fas fa-cloud',
    '04d': 'fas fa-cloud',
    '04n': 'fas fa-cloud',
    '09d': 'fas fa-cloud-rain',
    '09n': 'fas fa-cloud-rain',
    '10d': 'fas fa-cloud-sun-rain',
    '10n': 'fas fa-cloud-moon-rain',
    '11d': 'fas fa-bolt',
    '11n': 'fas fa-bolt',
    '13d': 'fas fa-snowflake',
    '13n': 'fas fa-snowflake',
    '50d': 'fas fa-smog',
    '50n': 'fas fa-smog'
};

const WEATHER_CONDITIONS = {
    'Clear': 'sunny',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Drizzle': 'rainy',
    'Thunderstorm': 'storm',
    'Snow': 'snow',
    'Mist': 'fog',
    'Smoke': 'fog',
    'Haze': 'fog',
    'Dust': 'fog',
    'Fog': 'fog',
    'Sand': 'fog',
    'Ash': 'fog',
    'Squall': 'storm',
    'Tornado': 'storm'
};

async function initApp() {
    try {
        await loadSavedData();
        setupEventListeners();
        
        if (state.currentLocation) {
            await fetchWeatherData(state.currentLocation);
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const location = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        await fetchWeatherData(location);
                    },
                    async () => {
                        await fetchWeatherData(CONFIG.DEFAULT_LOCATION);
                    }
                );
            } else {
                await fetchWeatherData(CONFIG.DEFAULT_LOCATION);
            }
        }
        
        if (state.settings.autoRefresh) {
            startAutoRefresh();
        }
        
        setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
        }, 500);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Failed to initialize app. Please check your API key.', 'error');
        elements.loadingScreen.style.display = 'none';
    }
}

function loadSavedData() {
    try {
        const savedSettings = localStorage.getItem('weatherVerse_settings');
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
           
            state.settings = { ...state.settings, ...parsedSettings };
        }
        
        const savedFavorites = localStorage.getItem('weatherVerse_favorites');
        if (savedFavorites) {
            state.favorites = JSON.parse(savedFavorites);
        }
        
        const savedRecent = localStorage.getItem('weatherVerse_recent');
        if (savedRecent) {
            state.recentSearches = JSON.parse(savedRecent);
        }
        
        const savedLocation = localStorage.getItem('weatherVerse_location');
        if (savedLocation) {
            state.currentLocation = JSON.parse(savedLocation);
        }
        
        applySettings();
        updateRecentSearches();
        
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function saveData() {
    try {
        localStorage.setItem('weatherVerse_settings', JSON.stringify(state.settings));
        localStorage.setItem('weatherVerse_favorites', JSON.stringify(state.favorites));
        localStorage.setItem('weatherVerse_recent', JSON.stringify(state.recentSearches));
        if (state.currentLocation) {
            localStorage.setItem('weatherVerse_location', JSON.stringify(state.currentLocation));
        }
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function applySettings() {
    const tempBtns = document.querySelectorAll('input[name="tempUnit"]');
    tempBtns.forEach(btn => {
        btn.checked = btn.value === state.settings.tempUnit;
    });
    elements.tempUnitBtn.textContent = state.settings.tempUnit === 'celsius' ? '°C' : '°F';
    
    const speedBtns = document.querySelectorAll('input[name="speedUnit"]');
    speedBtns.forEach(btn => {
        btn.checked = btn.value === state.settings.speedUnit;
    });
    elements.speedUnitBtn.textContent = state.settings.speedUnit === 'kmh' ? 'km/h' : 'mph';
    
    document.getElementById('animationsToggle').checked = state.settings.animations;
    document.getElementById('autoRefreshToggle').checked = state.settings.autoRefresh;
    document.getElementById('notificationsToggle').checked = state.settings.notifications;
    document.getElementById('apiKeyInput').value = state.settings.apiKey || '';
}

function setupEventListeners() {
    elements.mobileMenuBtn.addEventListener('click', () => {
        elements.mobileMenu.classList.add('show');
    });
    
    elements.closeMenuBtn.addEventListener('click', () => {
        elements.mobileMenu.classList.remove('show');
    });
    
    elements.tempUnitBtn.addEventListener('click', toggleTempUnit);
    elements.speedUnitBtn.addEventListener('click', toggleSpeedUnit);
    elements.refreshBtn.addEventListener('click', refreshWeather);
    elements.shareBtn.addEventListener('click', shareWeather);
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.add('show');
    });
    
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    });
    
    elements.locationBtn.addEventListener('click', getCurrentLocation);
    elements.favoriteBtn.addEventListener('click', toggleFavorite);
    
    elements.mobileFavoritesBtn.addEventListener('click', showFavorites);
    elements.mobileAlertsBtn.addEventListener('click', showAlerts);
    elements.mobileSettingsBtn.addEventListener('click', () => {
        elements.mobileMenu.classList.remove('show');
        elements.settingsModal.classList.add('show');
    });
    elements.mobileAboutBtn.addEventListener('click', () => {
        elements.mobileMenu.classList.remove('show');
        elements.aboutModal.classList.add('show');
    });
    
    elements.settingsClose.addEventListener('click', () => {
        elements.settingsModal.classList.remove('show');
    });
    elements.aboutClose.addEventListener('click', () => {
        elements.aboutModal.classList.remove('show');
    });
    
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    elements.editFavoritesBtn.addEventListener('click', editFavorites);
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            elements.mobileMenu.classList.remove('show');
            elements.settingsModal.classList.remove('show');
            elements.aboutModal.classList.remove('show');
            elements.searchResults.style.display = 'none';
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.searchInput.focus();
        }
        
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            e.preventDefault();
            refreshWeather();
        }
    });
}

async function fetchWeatherData(location) {
    try {
        showLoading(true);
        
        let coords = location;
        if (typeof location === 'string') {
            coords = await geocodeLocation(location);
            if (!coords) {
                showNotification('Location not found', 'error');
                showLoading(false);
                return;
            }
        }
        
        state.currentLocation = coords;
        
        const [currentData, forecastData, airQualityData] = await Promise.all([
            fetchCurrentWeather(coords),
            fetchForecast(coords),
            fetchAirQuality(coords)
        ]);
        
        state.currentWeather = currentData;
        state.hourlyForecast = processHourlyForecast(forecastData);
        state.dailyForecast = processDailyForecast(forecastData);
        state.airQuality = airQualityData.airQuality;
        state.uvIndex = airQualityData.uvIndex;
        state.alerts = currentData.alerts || [];
        state.lastUpdate = new Date();
        
        updateCurrentWeather();
        updateHourlyForecast();
        updateDailyForecast();
        updateAirQuality();
        updateAlerts();
        updateWeatherDetails();
        updateSunMoon();
        updateBackground();
        updateWeatherElements();
        updateFavorites();
        updateInsights();
        
        addToRecentSearches(currentData.name);
        saveData();
        
        showLoading(false);
        showNotification('Weather data updated', 'success');
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showNotification('Failed to fetch weather data. Please try again.', 'error');
        showLoading(false);
    }
}

async function fetchCurrentWeather(coords) {
    const url = `${CONFIG.BASE_URL}/weather?lat=${coords.lat}&lon=${coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

async function fetchForecast(coords) {
    const url = `${CONFIG.BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
}

async function fetchAirQuality(coords) {
    const url = `${CONFIG.BASE_URL}/air-quality?lat=${coords.lat}&lon=${coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) {
        return {
            airQuality: null,
            uvIndex: calculateUVIndex(coords.lat, coords.lon)
        };
    }
    return await response.json();
}

function calculateUVIndex(lat, lon) {
    const now = new Date();
    const hour = now.getUTCHours();
    let base = 5;
    const latFactor = Math.abs(lat) / 90;
    const timeFactor = Math.cos((hour - 12) * Math.PI / 12);
    const uv = base * (1 - latFactor * 0.5) * (1 + timeFactor * 0.5);
    return Math.min(Math.max(uv, 0), 12);
}

function processHourlyForecast(forecastData) {
    const hourly = forecastData.list.slice(0, 8);
    
    return hourly.map(item => ({
        time: new Date(item.dt * 1000),
        temp: item.main.temp,
        feelsLike: item.main.feels_like,
        weather: item.weather[0],
        pop: item.pop * 100,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        windDeg: item.wind.deg
    }));
}

function processDailyForecast(forecastData) {
    const daily = [];
    const days = {};
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!days[dayKey]) {
            days[dayKey] = {
                date: date,
                temps: [],
                feels: [],
                weather: [],
                pop: [],
                humidity: []
            };
        }
        
        days[dayKey].temps.push(item.main.temp);
        days[dayKey].feels.push(item.main.feels_like);
        days[dayKey].weather.push(item.weather[0]);
        days[dayKey].pop.push(item.pop);
        days[dayKey].humidity.push(item.main.humidity);
    });
    
    Object.values(days).slice(0, 5).forEach(day => {
        daily.push({
            date: day.date,
            minTemp: Math.min(...day.temps),
            maxTemp: Math.max(...day.temps),
            avgFeels: day.feels.reduce((a, b) => a + b) / day.feels.length,
            mainWeather: getMostFrequentWeather(day.weather),
            avgPop: (day.pop.reduce((a, b) => a + b) / day.pop.length) * 100,
            avgHumidity: day.humidity.reduce((a, b) => a + b) / day.humidity.length
        });
    });
    
    return daily;
}

function getMostFrequentWeather(weatherArray) {
    const counts = {};
    weatherArray.forEach(w => {
        const key = w.main;
        counts[key] = (counts[key] || 0) + 1;
    });
    
    let maxCount = 0;
    let mainWeather = weatherArray[0];
    
    for (const [key, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            mainWeather = weatherArray.find(w => w.main === key);
        }
    }
    
    return mainWeather;
}

async function geocodeLocation(query) {
    const url = `${CONFIG.BASE_URL}/geocode?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Geocoding error: ${response.status}`);
    }
    const data = await response.json();
    if (data.length === 0) {
        return null;
    }
    return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name,
        country: data[0].country
    };
}

async function reverseGeocode(coords) {
    const url = `${CONFIG.BASE_URL}/geocode/reverse?lat=${coords.lat}&lon=${coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Reverse geocoding error: ${response.status}`);
    }
    const data = await response.json();
    if (data.length === 0) {
        return 'Unknown Location';
    }
    return `${data[0].name}, ${data[0].country}`;
}

function updateCurrentWeather() {
    if (!state.currentWeather) return;
    
    const weather = state.currentWeather;
    elements.locationName.textContent = `${weather.name}, ${weather.country}`;
    
    const isFavorite = state.favorites.some(f => 
        f.name === weather.name && f.country === weather.country
    );
    elements.favoriteBtn.classList.toggle('active', isFavorite);
    
    if (state.lastUpdate) {
        elements.lastUpdated.textContent = `Updated ${formatTimeAgo(state.lastUpdate)}`;
    }
    
    const temp = convertTemp(weather.temp);
    const feelsLikeTemp = convertTemp(weather.feelsLike);
    elements.temperatureDisplay.textContent = `${temp}°`;
    elements.feelsLike.textContent = `Feels like ${feelsLikeTemp}°`;
    
    const iconCode = weather.weather.icon || '01d';
    const iconClass = WEATHER_ICONS[iconCode] || WEATHER_ICONS['01d'];
    elements.weatherIconLarge.innerHTML = `<i class="${iconClass}"></i>`;
    
    elements.weatherCondition.textContent = weather.weather.description;
    elements.humidity.textContent = `${weather.humidity}%`;
    elements.pressure.textContent = `${weather.pressure} hPa`;
    elements.visibility.textContent = `${weather.visibility} km`;
    
    const windSpeed = convertSpeed(weather.windSpeed);
    const windDir = getWindDirection(weather.windDeg);
    elements.windSpeed.textContent = `${windSpeed} ${windDir}`;
}

function updateHourlyForecast() {
    if (!state.hourlyForecast) return;
    
    let html = '';
    
    state.hourlyForecast.forEach(hour => {
        const time = formatTime(hour.time);
        const temp = convertTemp(hour.temp);
        const iconCode = hour.weather.icon || '01d';
        const iconClass = WEATHER_ICONS[iconCode] || WEATHER_ICONS['01d'];
        const pop = Math.round(hour.pop);
        
        html += `
            <div class="hour-item">
                <div class="hour-time">${time}</div>
                <div class="hour-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="hour-temp">${temp}°</div>
                ${pop > 0 ? `
                    <div class="hour-precip">
                        <i class="fas fa-tint precip-icon"></i>
                        <span>${pop}%</span>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    elements.hourlyForecast.innerHTML = html;
}

function updateDailyForecast() {
    if (!state.dailyForecast) return;
    
    let html = '';
    
    state.dailyForecast.forEach((day, index) => {
        const dayName = index === 0 ? 'Today' : formatDay(day.date);
        const minTemp = convertTemp(day.minTemp);
        const maxTemp = convertTemp(day.maxTemp);
        const iconCode = day.mainWeather.icon || '01d';
        const iconClass = WEATHER_ICONS[iconCode] || WEATHER_ICONS['01d'];
        const pop = Math.round(day.avgPop);
        const tempRange = day.maxTemp - day.minTemp;
        const barWidth = tempRange > 0 ? ((maxTemp - minTemp) / tempRange) * 100 : 50;
        
        html += `
            <div class="day-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="day-left">
                    <span class="day-name">${dayName}</span>
                    <div class="day-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <span class="day-condition">${day.mainWeather.description}</span>
                </div>
                <div class="day-right">
                    ${pop > 0 ? `
                        <div class="day-precip">
                            <i class="fas fa-tint precip-chance-icon"></i>
                            <span>${pop}%</span>
                        </div>
                    ` : ''}
                    <div class="temp-range">
                        <span class="low-temp">${minTemp}°</span>
                        <div class="temp-bar">
                            <div class="temp-bar-fill" style="width: ${barWidth}%"></div>
                        </div>
                        <span class="high-temp">${maxTemp}°</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    elements.dailyForecast.innerHTML = html;
    
    document.querySelectorAll('.day-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.day-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function updateAirQuality() {
    if (!state.airQuality) return;
    
    const aqi = state.airQuality.main?.aqi || 1;
    elements.aqiValue.textContent = getAQILevel(aqi).label;
    elements.aqiIndicator.style.left = `${(aqi / 5) * 100}%`;
    elements.aqiRecommendation.textContent = getAQIRecommendation(aqi);
    
    const uv = state.uvIndex || 0;
    elements.uvValue.textContent = getUVILevel(uv).label;
    elements.uvIndicator.style.left = `${Math.min((uv / 12) * 100, 100)}%`;
    elements.uvRecommendation.textContent = getUVIRecommendation(uv);
}

function updateAlerts() {
    if (!state.alerts || state.alerts.length === 0) {
        elements.weatherAlerts.innerHTML = '';
        elements.alertsBadge.textContent = '0';
        return;
    }
    
    let html = '';
    
    state.alerts.forEach(alert => {
        html += `
            <div class="weather-alert">
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.event || 'Weather Alert'}</div>
                    <div class="alert-description">${alert.description || 'No details available'}</div>
                </div>
            </div>
        `;
    });
    
    elements.weatherAlerts.innerHTML = html;
    elements.alertsBadge.textContent = state.alerts.length.toString();
}

function updateWeatherDetails() {
    if (!state.currentWeather) return;
    
    const weather = state.currentWeather;
    const details = [
        { icon: 'fa-wind', label: 'Wind Gust', value: convertSpeed(weather.windSpeed), unit: '' },
        { icon: 'fa-cloud', label: 'Cloud Cover', value: weather.clouds, unit: '%' },
        { icon: 'fa-thermometer-half', label: 'Dew Point', value: calculateDewPoint(weather.temp, weather.humidity), unit: '°' },
        { icon: 'fa-sun', label: 'UV Index', value: state.uvIndex ? Math.round(state.uvIndex) : '--', unit: '' },
        { icon: 'fa-tachometer-alt', label: 'Pressure Trend', value: 'Steady', unit: '' },
        { icon: 'fa-eye-slash', label: 'Visibility', value: weather.visibility, unit: ' km' }
    ];
    
    let html = '';
    
    details.forEach(detail => {
        html += `
            <div class="detail-item">
                <div class="detail-label">
                    <i class="fas ${detail.icon} detail-icon"></i>
                    <span>${detail.label}</span>
                </div>
                <div class="detail-value">${detail.value}<span class="detail-unit">${detail.unit}</span></div>
            </div>
        `;
    });
    
    elements.weatherDetails.innerHTML = html;
}

function updateSunMoon() {
    if (!state.currentWeather) return;
    
    const weather = state.currentWeather;
    const sunrise = new Date(weather.sunrise * 1000);
    const sunset = new Date(weather.sunset * 1000);
    
    elements.sunriseTime.textContent = formatTime(sunrise);
    elements.sunsetTime.textContent = formatTime(sunset);
    
    const now = new Date();
    const dayStart = sunrise.getTime();
    const dayEnd = sunset.getTime();
    const progress = ((now.getTime() - dayStart) / (dayEnd - dayStart)) * 100;
    const progressPercent = Math.min(Math.max(progress, 0), 100);
    elements.dayProgress.textContent = `${Math.round(progressPercent)}%`;
    elements.dayProgressBar.style.width = `${progressPercent}%`;
}

function updateBackground() {
    if (!state.currentWeather) return;
    
    const condition = state.currentWeather.weather.main;
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    let gradient = '';
    
    switch (WEATHER_CONDITIONS[condition] || 'partly-cloudy') {
        case 'sunny':
            gradient = isNight ? 'linear-gradient(135deg, #1e293b, #0f172a, #020617)' : 'linear-gradient(135deg, #60a5fa, #22d3ee, #fbbf24)';
            break;
        case 'cloudy':
            gradient = 'linear-gradient(135deg, #9ca3af, #6b7280, #4b5563)';
            break;
        case 'rainy':
            gradient = 'linear-gradient(135deg, #4b5563, #3b82f6, #1d4ed8)';
            break;
        case 'storm':
            gradient = 'linear-gradient(135deg, #374151, #7c3aed, #000000)';
            break;
        case 'snow':
            gradient = 'linear-gradient(135deg, #dbeafe, #e5e7eb, #ffffff)';
            break;
        case 'fog':
            gradient = 'linear-gradient(135deg, #9ca3af, #d1d5db, #f3f4f6)';
            break;
        default:
            gradient = isNight ? 'linear-gradient(135deg, #1e293b, #0f172a, #020617)' : 'linear-gradient(135deg, #60a5fa, #93c5fd, #d1d5db)';
    }
    
    document.body.style.background = gradient;
}

function updateWeatherElements() {
    if (!state.currentWeather || !state.settings.animations) return;
    
    elements.weatherElements.innerHTML = '';
    const condition = state.currentWeather.weather.main;
    
    switch (WEATHER_CONDITIONS[condition]) {
        case 'rainy':
            createRain();
            break;
        case 'storm':
            createRain();
            setTimeout(() => createLightning(), 1000);
            break;
        case 'snow':
            createSnow();
            break;
        case 'sunny':
            if (new Date().getHours() < 18) {
                createSunGlow();
            }
            break;
        case 'fog':
            createFog();
            break;
    }
}

function createRain() {
    for (let i = 0; i < 30; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
        elements.weatherElements.appendChild(drop);
    }
}

function createSnow() {
    for (let i = 0; i < 50; i++) {
        const flake = document.createElement('div');
        flake.className = 'snow-flake';
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDelay = `${Math.random() * 5}s`;
        flake.style.animationDuration = `${3 + Math.random() * 5}s`;
        elements.weatherElements.appendChild(flake);
    }
}

function createLightning() {
    const lightning = document.createElement('div');
    lightning.className = 'lightning';
    lightning.style.left = `${20 + Math.random() * 60}%`;
    lightning.style.top = `${10 + Math.random() * 30}%`;
    elements.weatherElements.appendChild(lightning);
    
    setTimeout(() => {
        lightning.remove();
    }, 500);
}

function createSunGlow() {
    const glow = document.createElement('div');
    glow.className = 'sun-glow';
    elements.weatherElements.appendChild(glow);
}

function createFog() {
    const fog = document.createElement('div');
    fog.className = 'fog-layer';
    elements.weatherElements.appendChild(fog);
}

function updateFavorites() {
    if (state.favorites.length === 0) {
        elements.favoritesContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No favorites yet</p>';
        return;
    }
    
    let html = '';
    
    state.favorites.forEach((fav, index) => {
        const isCurrent = state.currentLocation && 
                         state.currentLocation.name === fav.name &&
                         state.currentLocation.country === fav.country;
        
        html += `
            <div class="favorite-location ${isCurrent ? 'active' : ''}" data-index="${index}">
                <div class="favorite-location-header">
                    <div class="favorite-location-name">${fav.name}, ${fav.country}</div>
                    <button class="remove-favorite-btn" data-index="${index}" aria-label="Remove from favorites">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="favorite-location-temp">${convertTemp(fav.temp || 0)}°</div>
                <div class="favorite-location-condition">${fav.condition || '--'}</div>
            </div>
        `;
    });
    
    elements.favoritesContainer.innerHTML = html;
    
    document.querySelectorAll('.favorite-location').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite-btn')) {
                const index = parseInt(item.dataset.index);
                const fav = state.favorites[index];
                fetchWeatherData({ lat: fav.lat, lon: fav.lon });
            }
        });
    });
    
    document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            removeFavorite(index);
        });
    });
}

function updateInsights() {
    if (!state.currentWeather || !state.hourlyForecast) return;
    
    const insights = [];
    const weather = state.currentWeather;
    
    if (weather.temp > 30) {
        insights.push({
            icon: 'fa-temperature-high',
            text: 'Hot day ahead! Stay hydrated and avoid prolonged sun exposure.'
        });
    } else if (weather.temp < 10) {
        insights.push({
            icon: 'fa-temperature-low',
            text: 'Chilly conditions. Dress warmly and watch for frost.'
        });
    }
    
    const nextRain = state.hourlyForecast.find(h => h.pop > 50);
    if (nextRain) {
        insights.push({
            icon: 'fa-umbrella',
            text: `Rain expected around ${formatTime(nextRain.time)}. Consider carrying an umbrella.`
        });
    }
    
    if (weather.windSpeed > 20) {
        insights.push({
            icon: 'fa-wind',
            text: 'Windy conditions. Secure loose outdoor items.'
        });
    }
    
    if (state.airQuality) {
        const aqi = state.airQuality.main?.aqi || 1;
        if (aqi >= 4) {
            insights.push({
                icon: 'fa-smog',
                text: 'Poor air quality. Consider limiting outdoor activities.'
            });
        }
    }
    
    if (state.uvIndex >= 8) {
        insights.push({
            icon: 'fa-sun',
            text: 'High UV index. Use sunscreen and wear protective clothing.'
        });
    }
    
    if (insights.length === 0) {
        insights.push({
            icon: 'fa-check-circle',
            text: 'Good weather conditions for outdoor activities.'
        });
    }
    
    let html = '';
    
    insights.forEach(insight => {
        html += `
            <div class="insight-item">
                <div class="insight-icon">
                    <i class="fas ${insight.icon}"></i>
                </div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `;
    });
    
    elements.insightsContent.innerHTML = html;
}

async function handleSearchInput() {
    const query = elements.searchInput.value.trim();
    
    if (query.length < 2) {
        elements.searchResults.style.display = 'none';
        return;
    }
    
    try {
       
        const url = `${CONFIG.BASE_URL}/geocode?q=${encodeURIComponent(query)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Search API error:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            elements.searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
            elements.searchResults.style.display = 'block';
            return;
        }
        
        let html = '';
        
        data.forEach(location => {
            html += `
                <div class="search-result-item" data-lat="${location.lat}" data-lon="${location.lon}">
                    <i class="fas fa-map-marker-alt search-result-icon"></i>
                    <div>
                        <div>${location.name}, ${location.country}</div>
                        <small>${location.state || ''}</small>
                    </div>
                </div>
            `;
        });
        
        elements.searchResults.innerHTML = html;
        elements.searchResults.style.display = 'block';
        
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                fetchWeatherData({ lat, lon });
                elements.searchResults.style.display = 'none';
                elements.searchInput.value = '';
            });
        });
        
    } catch (error) {
        console.error('Search error:', error);
        elements.searchResults.innerHTML = '<div class="search-result-item">Search temporarily unavailable</div>';
        elements.searchResults.style.display = 'block';
    }
}

function handleSearchSubmit() {
    const query = elements.searchInput.value.trim();
    if (query) {
        fetchWeatherData(query);
        elements.searchInput.value = '';
        elements.searchResults.style.display = 'none';
    }
}

function updateRecentSearches() {
    if (state.recentSearches.length === 0) {
        elements.recentSearches.innerHTML = '';
        return;
    }
    
    let html = '';
    
    state.recentSearches.forEach((search, index) => {
        html += `
            <button class="recent-search-tag" data-index="${index}">
                ${search}
            </button>
        `;
    });
    
    elements.recentSearches.innerHTML = html;
    
    document.querySelectorAll('.recent-search-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const index = parseInt(tag.dataset.index);
            const search = state.recentSearches[index];
            fetchWeatherData(search);
        });
    });
}

function addToRecentSearches(location) {
    state.recentSearches = state.recentSearches.filter(s => s !== location);
    state.recentSearches.unshift(location);
    state.recentSearches = state.recentSearches.slice(0, 5);
    updateRecentSearches();
    saveData();
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation not supported', 'error');
        return;
    }
    
    showNotification('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const location = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            
            try {
                const name = await reverseGeocode(location);
                location.name = name.split(',')[0];
                location.country = name.split(',')[1]?.trim();
                await fetchWeatherData(location);
                showNotification('Location updated', 'success');
                
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                await fetchWeatherData(location);
            }
        },
        (error) => {
            showNotification('Failed to get location', 'error');
            console.error('Geolocation error:', error);
        }
    );
}

function toggleFavorite() {
    if (!state.currentWeather || !state.currentLocation) return;
    
    const weather = state.currentWeather;
    const location = state.currentLocation;
    
    const favoriteIndex = state.favorites.findIndex(f => 
        f.name === weather.name && f.country === weather.country
    );
    
    if (favoriteIndex === -1) {
        state.favorites.push({
            name: weather.name,
            country: weather.country,
            lat: location.lat,
            lon: location.lon,
            temp: weather.temp,
            condition: weather.weather.description
        });
        showNotification('Added to favorites', 'success');
    } else {
        state.favorites.splice(favoriteIndex, 1);
        showNotification('Removed from favorites', 'info');
    }
    
    updateFavorites();
    saveData();
}

function removeFavorite(index) {
    state.favorites.splice(index, 1);
    updateFavorites();
    saveData();
    showNotification('Removed from favorites', 'info');
}

function editFavorites() {
    const isEditing = elements.editFavoritesBtn.classList.toggle('editing');
    
    if (isEditing) {
        elements.editFavoritesBtn.innerHTML = '<i class="fas fa-check"></i>';
        showNotification('Click × to remove favorites', 'info');
    } else {
        elements.editFavoritesBtn.innerHTML = '<i class="fas fa-edit"></i>';
    }
}

function showFavorites() {
    elements.mobileMenu.classList.remove('show');
    document.querySelector('.favorites-card').scrollIntoView({ behavior: 'smooth' });
}

function showAlerts() {
    elements.mobileMenu.classList.remove('show');
    elements.weatherAlerts.scrollIntoView({ behavior: 'smooth' });
}

function toggleTempUnit() {
    state.settings.tempUnit = state.settings.tempUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    elements.tempUnitBtn.textContent = state.settings.tempUnit === 'celsius' ? '°C' : '°F';
    updateCurrentWeather();
    updateHourlyForecast();
    updateDailyForecast();
    updateFavorites();
    saveData();
}

function toggleSpeedUnit() {
    state.settings.speedUnit = state.settings.speedUnit === 'kmh' ? 'mph' : 'kmh';
    elements.speedUnitBtn.textContent = state.settings.speedUnit === 'kmh' ? 'km/h' : 'mph';
    updateCurrentWeather();
    updateHourlyForecast();
    saveData();
}

async function refreshWeather() {
    if (state.isLoading) return;
    elements.refreshBtn.classList.add('rotating');
    await fetchWeatherData(state.currentLocation);
    elements.refreshBtn.classList.remove('rotating');
}

function shareWeather() {
    if (!state.currentWeather) return;
    
    const weather = state.currentWeather;
    const temp = convertTemp(weather.temp);
    const condition = weather.weather.description;
    const location = `${weather.name}, ${weather.country}`;
    const text = `Current weather in ${location}: ${temp}°C, ${condition}. Check WeatherVerse for more details!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'WeatherVerse',
            text: text,
            url: window.location.href
        }).catch(() => {
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function saveSettings() {
    const tempUnit = document.querySelector('input[name="tempUnit"]:checked').value;
    const speedUnit = document.querySelector('input[name="speedUnit"]:checked').value;
    const animations = document.getElementById('animationsToggle').checked;
    const autoRefresh = document.getElementById('autoRefreshToggle').checked;
    const notifications = document.getElementById('notificationsToggle').checked;
    
    state.settings = {
        tempUnit,
        speedUnit,
        animations,
        autoRefresh,
        notifications
    };
    
    applySettings();
    
    if (autoRefresh && !state.autoRefreshInterval) {
        startAutoRefresh();
    } else if (!autoRefresh && state.autoRefreshInterval) {
        stopAutoRefresh();
    }
    
    if (state.settings.animations) {
        updateWeatherElements();
    } else {
        elements.weatherElements.innerHTML = '';
    }
    
    saveData();
    elements.settingsModal.classList.remove('show');
    showNotification('Settings saved', 'success');
}

function resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
        state.settings = {
            tempUnit: 'celsius',
            speedUnit: 'kmh',
            animations: true,
            autoRefresh: true,
            notifications: false,
            apiKey: CONFIG.API_KEY
        };
        
        applySettings();
        saveData();
        showNotification('Settings reset', 'info');
    }
}

function startAutoRefresh() {
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
    }
    
    state.autoRefreshInterval = setInterval(() => {
        if (!state.isLoading) {
            fetchWeatherData(state.currentLocation);
        }
    }, 15 * 60 * 1000);
}

function stopAutoRefresh() {
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
        state.autoRefreshInterval = null;
    }
}

function showLoading(loading) {
    state.isLoading = loading;
    
    if (loading) {
        elements.loadingScreen.style.display = 'flex';
        elements.refreshBtn.disabled = true;
    } else {
        elements.loadingScreen.style.display = 'none';
        elements.refreshBtn.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard', 'success');
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

function convertTemp(celsius) {
    if (state.settings.tempUnit === 'fahrenheit') {
        return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
}

function convertSpeed(kmh) {
    if (state.settings.speedUnit === 'mph') {
        return Math.round(kmh * 0.621371);
    }
    return Math.round(kmh);
}

function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((degrees % 360) / 45);
    return directions[index % 8];
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(date) {
    return date.toLocaleDateString([], { weekday: 'short' });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
}

function calculateDewPoint(temp, humidity) {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return convertTemp(dewPoint);
}

function getAQILevel(aqi) {
    const levels = [
        { min: 1, max: 1, label: 'Good', color: '#10b981' },
        { min: 2, max: 2, label: 'Fair', color: '#fbbf24' },
        { min: 3, max: 3, label: 'Moderate', color: '#f97316' },
        { min: 4, max: 4, label: 'Poor', color: '#ef4444' },
        { min: 5, max: 5, label: 'Very Poor', color: '#8b5cf6' }
    ];
    
    return levels.find(level => aqi >= level.min && aqi <= level.max) || levels[0];
}

function getAQIRecommendation(aqi) {
    const recommendations = [
        'Air quality is satisfactory. No health impacts.',
        'Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.',
        'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
        'Health alert: Everyone may begin to experience health effects.',
        'Health warning of emergency conditions. Entire population is likely to be affected.'
    ];
    
    return recommendations[aqi - 1] || recommendations[0];
}

function getUVILevel(uv) {
    const levels = [
        { max: 2, label: 'Low', color: '#10b981' },
        { max: 5, label: 'Moderate', color: '#fbbf24' },
        { max: 7, label: 'High', color: '#f97316' },
        { max: 10, label: 'Very High', color: '#ef4444' },
        { max: 12, label: 'Extreme', color: '#7c2d12' }
    ];
    
    return levels.find(level => uv <= level.max) || levels[4];
}

function getUVIRecommendation(uv) {
    if (uv <= 2) return 'No protection needed.';
    if (uv <= 5) return 'Wear sunglasses and sunscreen.';
    if (uv <= 7) return 'Stay in shade during midday hours.';
    if (uv <= 10) return 'Avoid being outside during midday hours.';
    return 'Extra protection needed. Unprotected skin can burn quickly.';
}

document.addEventListener('DOMContentLoaded', initApp);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

window.addEventListener('online', () => {
    showNotification('You are back online', 'success');
    if (state.currentLocation) {
        fetchWeatherData(state.currentLocation);
    }
});

window.addEventListener('offline', () => {
    showNotification('You are offline. Some features may not work.', 'warning');
});
