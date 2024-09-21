
var map = L.map('map').setView([45.75, 25.23], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 18,
}).addTo(map);

// create cities featuregroup
var cityLayer = L.featureGroup().addTo(map);

var cityDropdown = document.getElementById('citySelect');
var countyDropdown = document.getElementById('countySelect');
var cities = {};

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
            L.geoJSON(geojson)
            .setStyle({
                color: 'blue',
                weight: 0.5,
                fillColor: 'blue',
                fillOpacity: 0.1,

            })
            .addTo(cityLayer);
            map.fitBounds(cityLayer.getBounds());
            return geojson;
        })
        .then(function(geojson) {
            // write the properties of the selected city in the properties div
            var cityDiv = document.getElementById('cityInfo');
            text = geojson.properties.name;
            text += ' | Population: ' + geojson.properties.pop2020;
            cityDiv.innerHTML = text;
        });
        // save the selected city in the URL
        var url = new URL(window.location);
        url.searchParams.set('city', selectedCity);
        url.searchParams.set('county', selectedCounty);
        window.history.pushState({}, '', url);


});