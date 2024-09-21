
var map = L.map('map').setView([45.75, 25.23], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(map);

// create cities featuregroup
var cityLayer = L.featureGroup().addTo(map);
// create marker featuregroup
var markerLayer = L.featureGroup().addTo(map);

var cityDropdown = document.getElementById('citySelect');
var countyDropdown = document.getElementById('countySelect');
var cities = {};
// geojson of the selected city
var currentUat = null;
// latlng of the selected location
var latlng = null;

function setStatus(text, color) {
    var statusDiv = document.getElementById('status');
    if (text === null) {
        if (currentUat) {
            text = currentUat.properties.name;
            text += ' | Population: ' + currentUat.properties.pop2020;
            color = 'transparent';
        } 
    }
    statusDiv.innerHTML = text;
    if (color) {
        statusDiv.style.backgroundColor = color;
    }
    else {
        statusDiv.style.backgroundColor = 'transparent';
    }
}

function picklocation(latlng) {
    text = currentUat.properties.name;
    text += ' | Population: ' + currentUat.properties.pop2020;
    text += ' | ' + latlng.lat.toFixed(4) + ', ' + latlng.lng.toFixed(4);
    setStatus(text, 'lightgreen');
    // update marker layer with the new location
    markerLayer.clearLayers();
    L.marker(latlng).addTo(markerLayer);
}

// function to populate a dropdown with a name-value list
function populateDropdown(dropdown, list) {
    dropdown.innerHTML = '<option value="">Select</option>';
    list.forEach(function(item) {
        var option = document.createElement('option');
        option.value = item.value;
        option.text = item.name;
        dropdown.appendChild(option);
    });
}
fetch('cities.json')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        cities = data;
        // Add options to countySelect based on the sorted keys of the data
        var counties = Object.keys(data).sort();
        populateDropdown(countyDropdown, counties.map(function(county) {
            return {
                name: county,
                value: county
            };
        }));
    })
    .then(function() {
        // get city and county from URL and select them in the dropdowns
        var url = new URL(window.location);
        var city = url.searchParams.get('city');
        var county = url.searchParams.get('county');
        if (city && county) {
            countyDropdown.value = county;
            countyDropdown.dispatchEvent(new Event('change'));
            cityDropdown.value = city;
            cityDropdown.dispatchEvent(new Event('change'));
        }
    });

countyDropdown.addEventListener('change', function() {
    var selectedCounty = countyDropdown.value;
    var citylist = [];
    if (selectedCounty) {
        cities[selectedCounty].sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });
        citylist = cities[selectedCounty].map(function(city) {
            return {
                name: city.name,
                value: city.natcode
            };
        });    
    }
    populateDropdown(cityDropdown, citylist);
});

cityDropdown.addEventListener('change', function() {
    var selectedCounty = countyDropdown.value;
    if (!selectedCounty) {
        return;
    }
    var selectedCity = cityDropdown.value;
    cityLayer.clearLayers();

    // Load geojson for selected county and city
    var geojsonUrl = 'uat/' + selectedCity + '.geojson';
    fetch(geojsonUrl)
        .then(function(response) {
            return response.json();
        })
        .then(function(geojson) {
            console.log(geojson);
            L.geoJSON(geojson, {
                style: {
                    color: 'blue',
                    weight: 0.5,
                    fillOpacity: 0.1,
                    fillColor: 'blue',
                },
                onEachFeature: function(feature, layer) {
                    layer.on('click', function(e) {
                        console.log("clicked on feature", feature);
                        latlng = e.latlng;
                        picklocation(latlng);
                    });
                }
            })
            .addTo(cityLayer);
            map.fitBounds(cityLayer.getBounds());
            return geojson;
        })
        .then(function(geojson) {
            currentUat = geojson;
            setStatus(null);
            markerLayer.clearLayers();
        });
        // save the selected city in the URL
        var url = new URL(window.location);
        url.searchParams.set('city', selectedCity);
        url.searchParams.set('county', selectedCounty);
        window.history.pushState({}, '', url);
});

document.getElementById('clearBtn').addEventListener('click', function() {
    markerLayer.clearLayers();
    latlng = null;
    setStatus(null);
});