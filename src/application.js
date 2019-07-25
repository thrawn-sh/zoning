"use strict";

var germanyCenter = new L.LatLng(51.0948001, 10.2651007);
var maxZoom = 14;
var minZoom = 6;

var map = L.map("map", {
    center:  germanyCenter,
    maxZoom: maxZoom,
    minZoom: minZoom,
    zoom:    minZoom,
});

var osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    "attribution":  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    "useCache": true
});
map.addLayer(osmLayer);


var plzLayer = undefined;
var currentPostalcode = undefined;
var currentZone = undefined;

function onEachFeature(feature, layer) {
    layer.on('click', function() {
        var plz = feature.properties.name;
        if (plz === currentPostalcode) {
            return;
        }
        document.getElementById("search").value = plz;
        gotoPostalCode();
    });
}

function addCurrentZone() {
    var table = document.getElementById("selection");
    if (table) {
        var row = table.insertRow(-1);
        row.insertCell(0).innerText = currentPostalcode;
        row.insertCell(1).innerText = currentZone.population;
    }

    var sumCell = document.getElementById("sum");
    if (sumCell) {
        var sum = parseInt(sumCell.innerText);
        sum += parseInt(currentZone.population);
        sumCell.innerText = sum;
    }
}

function gotoPostalCode() {
    var postalCode = document.getElementById("search").value.trim();
    if (((!postalCode || 0 === postalCode.length)) || (currentPostalcode === postalCode)) {
        var center = new L.LatLng(currentZone.center[1], currentZone.center[0]);
        map.flyTo(center);
        return;
    }
    currentPostalcode = postalCode;

    var request = new XMLHttpRequest(); // a new request
    request.open("GET", "/api/" + postalCode + ".json", false);
    request.send(null);
    currentZone = JSON.parse(request.responseText);

    document.getElementById("place").value = currentZone.place;
    document.getElementById("state").value = currentZone.state;
    document.getElementById("population").value = currentZone.population;
    var manager = currentZone.manager;
    document.getElementById("manager").value = manager;
    var button = document.getElementById("add");
    if (button) {
        if (manager) {
            button.disabled = true;
        } else {
            button.disabled = false;
        }
    }

    var center = new L.LatLng(currentZone.center[1], currentZone.center[0]);
    if (true) {
        map.flyTo(center, (maxZoom - 1));
    } else {
        map.flyTo(center);
    }

    if (plzLayer) {
        map.removeLayer(plzLayer);
        plzLayer = undefined;
    }

    var requestGeo = new XMLHttpRequest(); // a new request
    requestGeo.open("GET", "/api/neighbour/2/" + postalCode + ".geojson", false);
    requestGeo.send(null);
    var responseGeo = JSON.parse(requestGeo.responseText);

    plzLayer = L.geoJSON(responseGeo, {
        style: function(feature) {
            var request = new XMLHttpRequest(); // a new request
            var plz = feature.properties.name;
            request.open("GET", "/api/" + plz + ".json", false);
            request.send(null);
            var response = JSON.parse(request.responseText);
            if (response.manager) {
                return { fillColor: "#de4f06" };
            }
            return { };
        },
        onEachFeature: onEachFeature
    });
    plzLayer.bindTooltip(function(layer) {
        return layer.feature.properties.name;
    }, { sticky: true });
    map.addLayer(plzLayer);
}
