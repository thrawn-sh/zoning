"use strict";

var germany_center = new L.LatLng(51.0948001, 10.2651007);
var maxZoom = 14;
var minZoom = 6;

var map = L.map("map", {
    center:  germany_center,
    maxZoom: maxZoom,
    minZoom: minZoom,
    zoom:    minZoom,
});

var layer_osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    "attribution":  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    "useCache": true
});
map.addLayer(layer_osm);


var layer_zone = undefined;
var current_postalcode = undefined;
var current_zone = undefined;
var selections = new Set();

function onEachFeature(feature, layer) {
    layer.on('click', function() {
        var postalcode = feature.properties.name;
        if (postalcode === current_postalcode) {
            return;
        }
        document.getElementById("search").value = postalcode;
        gotoPostalCode(false);
    });
}

function addCurrentZone() {
    selections.add(current_postalcode);
    var table = document.getElementById("selection");
    if (table) {
        var row = table.insertRow(-1);
        row.insertCell(0).innerText = current_zone.place;

        var selected_postalcode = current_postalcode;
        var postalcode_cell = row.insertCell(1);
        postalcode_cell.innerText = selected_postalcode;
        postalcode_cell.classList.add("center");

        var population_cell = row.insertCell(2);
        population_cell.innerText = current_zone.population;
        population_cell.classList.add("right");

        var button = document.createElement("input");
        button.type = "button";
        button.value = "delete";
        button.addEventListener('click', function() {
            var cell = row.childNodes[2];
            var sum_cell = document.getElementById("sum");
            if (sum_cell) {
                var sum = parseInt(sum_cell.innerText);
                sum -= parseInt(cell.innerText);
                sum_cell.innerText = sum;
            }
            row.parentNode.removeChild(row);
            selections.remove(selected_postalcode);
        }, false);
        row.insertCell(3).appendChild(button);
    }

    var sum_cell = document.getElementById("sum");
    if (sum_cell) {
        var sum = parseInt(sum_cell.innerText);
        sum += parseInt(current_zone.population);
        sum_cell.innerText = sum;
    }
}

function gotoPostalCode(fly) {
    var postalcode = document.getElementById("search").value.trim();
    if (((!postalcode || 0 === postalcode.length)) || (current_postalcode === postalcode)) {
        var currentCenter = new L.LatLng(current_zone.center[1], current_zone.center[0]);
        map.flyTo(currentCenter);
        return;
    }
    current_postalcode = postalcode;

    var request = new XMLHttpRequest();
    request.open("GET", "/api/" + postalcode + ".json", false);
    request.send(null);
    current_zone = JSON.parse(request.responseText);

    document.getElementById("place").value = current_zone.place;
    document.getElementById("state").value = current_zone.state;
    document.getElementById("population").value = current_zone.population;
    var manager = current_zone.manager;
    document.getElementById("manager").value = manager;
    var button = document.getElementById("add");
    if (button) {
        if (manager) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    }

    var center = new L.LatLng(current_zone.center[1], current_zone.center[0]);
    if (fly) {
        map.flyTo(center, (maxZoom - 1));
    }

    if (layer_zone) {
        map.removeLayer(layer_zone);
        layer_zone = undefined;
    }

    var request_geo = new XMLHttpRequest();
    request_geo.open("GET", "/api/neighbour/2/" + postalcode + ".geojson", false);
    request_geo.send(null);
    var responseGeo = JSON.parse(request_geo.responseText);

    layer_zone = L.geoJSON(responseGeo, {
        style: function(feature) {
            var request = new XMLHttpRequest();
            var postalcode = feature.properties.name;
            request.open("GET", "/api/" + postalcode + ".json", false);
            request.send(null);
            var response = JSON.parse(request.responseText);
            var style = { };
            if (response.manager) {
                style.fillColor = "#de4f06";
            }
            if (selections.has(postalcode)) {
                style.fillColor = "#ffff00";
            }
            if (postalcode === current_postalcode) {
                style.fillColor = "#8a2be2";
            }
            return style;
        },
        onEachFeature: onEachFeature
    });
    layer_zone.bindTooltip(function(layer) {
        return layer.feature.properties.name;
    }, { sticky: true });
    map.addLayer(layer_zone);
}
