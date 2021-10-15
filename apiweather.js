const CONFIG = {
    API: {
        URL: "https://api.openweathermap.org/data/2.5/weather?",
        KEY: "0d656e1048bce2869ea884fd96954f99",
        PARAMS: "units=metric", //https://openweathermap.org/current for other parametres. Example: units=metric&lat={lat}&lon={lon}&cnt={cnt}
        IMAGE_URL: "https://openweathermap.org/img/w/",
    },
    CARDINALS: ["Northerly", "Nort-Easterly", "Easterly", "South-Easterly", "Southerly", "South-Westerly", "Westerly", "North-Westerly"],
    MEDIA: {
        FOLDER: "media", //The media folder that will contain all images etc.

    },
    LOCALE: "en-UK", //Will be used for the date formating
    CONST: {
        MPS_TO_KMPH: 3.6,   //Meter per second to kilometer per hour
        MPS_TO_MPH: 2.23694 //Meter per second to miles per hour
    },
    WARNINGS: {
        //Specify the particular severe weather warnings based on the require-ments. 
        //For testing purposes, it can be adjusted with unrealistic numbers so that it shows up the severe warning image
        TEMP_ABOVE: 35,    // in Celsius
        TEMP_BELOW: -5,    // in Celsius
        WIND_ABOVE: 50     // in Miles per hour
    },
}

//Wind direction
//http://old.oceanrowing.com/weather/understanding_wind_direction.htm
//https://stackoverflow.com/questions/7490660/converting-wind-direction-in-angles-to-text-words
//https://www.surfertoday.com/windsurfing/how-to-read-wind-direction
//https://icon-icons.com/pack/The-Weather-is-Nice-Today/1370

/**
 * Converts Celsius to Fahrenheit and return it
 * @param {Number} Celsius 
 * @returns {Number} 
 */
const celsius_to_fahrenheit = celsius => Math.ceil(celsius * 1.8 + 32)

/**
 * Converts degrees in cardinal text
 * @param {Object} degree 
 * @returns {String}  
 */
const degree_to_cardinal = degree => CONFIG.CARDINALS[Math.round(degree / (360 / CONFIG.CARDINALS.length)) % CONFIG.CARDINALS.length]

/**
 * Converts the wind direction to display wind sign
 * @param {Number} wind 
 * @returns {Number}
 */
const wind_direction = wind => wind > 180 ? wind - 180 : wind + 180

/**
 * Converts speed from metres per second to kilometres per hour
 * @param {Number} speed 
 * @returns {Number}
 */
const wind_to_kph = speed => (speed * CONFIG.CONST.MPS_TO_KMPH).toFixed(1)

/**
 * Converts speed from metres per second to miles per hour
 * @param {Number} speed 
 * @returns {Number}
 */
const wind_to_mph = speed => (speed * CONFIG.CONST.MPS_TO_MPH).toFixed(1)

/**
 * Format timestamp to user friendly date 
 * @param {Number} timestamp 
 * @param {Number} type -Two options 0 or 1 are available. Default is 0 and only the date will be returned, where 1 will return only the time
 * @returns {String} 
 */
 const format_date = (timestamp, type = 0) => new Date(timestamp * 1000).toLocaleString(CONFIG.LOCALE).split(",")[type].replaceAll("/", "-")

/**
 * Checks the timezone value and it's sign and composite with the time diference (in hours) for the chosen location
 * @param {Object} city 
 * @returns {String}
 */
const calc_zones = city => `GMT${Math.sign(city.timezone) === 1 ? " +": " -"}` + Math.abs(city.timezone / 3600) + ":00"

/**
 * Combine different images for low temperature, high temperature and strong wind anomalies based on the warning parameters from the config
 * @param {Object} city 
 * @returns {String}
 */
function severe_image(city) {
    let image = ""
    let temp = Math.round(city.main.temp)
    if (wind_to_mph(city.wind.speed) > CONFIG.WARNINGS.WIND_ABOVE)
        image += `<img src="${CONFIG.MEDIA.FOLDER}/strong-wind.png">`
    if (temp > CONFIG.WARNINGS.TEMP_ABOVE)
        image += `<img src="${CONFIG.MEDIA.FOLDER}/high-temp.png">`
    else if (temp < CONFIG.WARNINGS.TEMP_BELOW)
        image += `<img src="${CONFIG.MEDIA.FOLDER}/low-temp.png">`
    return image
}


/**
 * Makes AJAX request to the weather API and trying to fetch the JSON Object. 
 * Passes the JSON data to the template to be rendered if the response code is 200/OK or display alert message otherways
 * @param {JSON Object} city 
 */
function fetch_data(city){
    fetch(CONFIG.API.URL + CONFIG.API.PARAMS + `&q=${city},gb&APPID=` + CONFIG.API.KEY)
    .then(responce => responce.json())
    .then(data => {
        if (data.cod == 200) {
            $("#city-weather").html("")
            $("#city-weather").append(TEMPLATE(data))
        } else {
            alert(`Information for city ${city} can not be found!`)
        }
    })
}

/**
 * Builds a template for the table that will be displayed and populate the data from city object 
 * @param {Object} city 
 * @returns {string}
 */
const TEMPLATE = city =>
    ` 
 <table>
    <tbody>
        <tr>
             <td colspan="2"> 
                <div><span class="city-name">${city.name}, ${city.sys.country}</span><span class="city-date"> ${format_date(city.dt)} ${calc_zones(city)}</span></div>
                <div class="city-temp">
                    <img class="weather-image" src="${CONFIG.API.IMAGE_URL + (city.weather[0].icon)}.png"> 
                    <span class="temp">${Math.round(city.main.temp)}&#8451; / ${celsius_to_fahrenheit(city.main.temp)}&#8457;</span>
                    <div class="weather-condition">  ${city.weather[0].description}</div>
                </div>
                <div class="warning">${severe_image(city)}</div>          
            </td>
        </tr>
        <tr>
            <td align="left">Wind Direction</td>
            <td align="right">
                <span class="wind" style="transform: rotate(${wind_direction(city.wind.deg)}deg)" ${wind_direction(city.wind.deg)}">
                <img class="wind-direction" src="media/wind-direction.png"/></span>${city.wind.deg}&#176; 
                 ${degree_to_cardinal(city.wind.deg)}
            </td>
        </tr>
        <tr>
            <td align="left">Wind Speed</td>
            <td align="right"> ${wind_to_kph(city.wind.speed)}kph / ${wind_to_mph(city.wind.speed)}mph</td>
        </tr>
        <tr>
            <td align="left">Humidity</td>
            <td align="right"> ${city.main.humidity}%</td>
        </tr>
        <tr>
            <td align="left">Visibility</td>
            <td align="right">${city.visibility /1000}km</td>
        </tr>
        <tr>
            <td align="left"><img class="img" src="${CONFIG.MEDIA.FOLDER}/sunrise.png"><p> ${format_date(city.sys.sunrise, time=1)}</p></td>
            <td align="right"><img class="img" src="${CONFIG.MEDIA.FOLDER}/sunset.png"><p> ${format_date(city.sys.sunset, time=1)}</p></td>
        </tr>
    </tbody>
 </table>
`

// Main Acivity
$("body").ready(doc => {
    $("#country").on("change", element => {
        let cities = $("#country :selected").text() == "Northern Ireland" ? "nireland-cities.html" : $("#country :selected").text().toLowerCase() + "-cities.html"
        fetch(cities).then(
            response => {
                if (response.statusText != "Not Found") {
                    $("#cities").load(cities)
                    $("#cities").on("change", selected => {
                        city = $("#cities :selected").text()
                        fetch_data(city)
                    })
                } else {
                    alert(`The file ${cities} can not be read!`)
                }
            }
        )
    })
})