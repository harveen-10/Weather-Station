import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat } from 'ol/proj.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Style from 'ol/style/Style.js';
import Icon from 'ol/style/Icon.js';
import Overlay from 'ol/Overlay.js';
import axios from "axios";
import config from './config.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});

const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
  source: vectorSource,
});
map.addLayer(vectorLayer);

let overlay;


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cityForm');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const cityInput = document.getElementById('city').value;

        try{
            if(cityInput.length===0){
                throw new Error ('Please enter a city name');
            }
            
            const key = config.API_KEY;
            const url=`https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${key}&units=metric`;

            const response=await axios.get(url);
            const data=response.data;

            console.log('City entered:', cityInput);
            console.log("weather: ", data.weather[0].main);
            console.log("description: ", data.weather[0].description);
            console.log("temperature: ", data.main.temp);
            
            vectorSource.clear();

            const marker = new Feature({
                geometry: new Point(fromLonLat([data.coord.lon, data.coord.lat])),
            });

            const markerStyle = new Style({
                image: new Icon({
                    anchor: [0.5, 1], 
                    src: 'https://openlayers.org/en/latest/examples/data/icon.png',
                    scale: 0.8,
                }),
            });

            marker.setStyle(markerStyle);
            vectorSource.addFeature(marker);

            if (overlay) {
                map.removeOverlay(overlay);
            }

            const overlayElement = document.createElement('div');
            overlayElement.className = 'textbox';
            overlayElement.innerHTML = `
                <div class="textbox">
                    <p style="margin: 0;">Place: ${data.name}</p>
                    <p style="margin: 0;">Weather: ${data.weather[0].main}</p>
                    <p style="margin: 0;">Temperature: ${data.main.temp}°C</p>
                    <img src= "https://openweathermap.org/img/w/${data.weather[0].icon}.png"/>
                    <p style="margin: 0;">Description: ${data.weather[0].description}°C</p>
                    <p style="margin: 0;">Temp-min: ${data.main.temp_min}°C</p>
                    <p style="margin: 0;">Temp-max: ${data.main.temp_max}°C</p>
                </div>
            `;
            overlay = new Overlay({
                element: overlayElement,
                positioning: 'bottom-center',
                offset: [0, -50],
                stopEvent: true, 
            });
            map.addOverlay(overlay);
            overlay.setPosition(fromLonLat([data.coord.lon, data.coord.lat]));

            clearErrorMessage();

            return{
                name: data.name,
                weather: data.weather[0].main,
                description: data.weather[0].description,
                temperature: data.main.temp,
                temp_min: data.main.temp_min,
                temp_max: data.main.temp_max,
                icon: `https://openweathermap.org/img/w/${data.weather[0].icon}.png`,
                error: null
            };

        }catch(error){
            console.log("Error:", error.message);
            if (overlay) {
                map.removeOverlay(overlay);
            }

            vectorSource.clear();
            displayErrorMessage('Please enter a valid city name');

            return { error: error.message };
        }
    });
});


function displayErrorMessage(message) {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = message;
}

function clearErrorMessage() {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = '';
}
