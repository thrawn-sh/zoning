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

var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    "attribution":  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    "useCache": true
});
map.addLayer(osm);


var plz = undefined;
var current = undefined;

function onEachFeature(feature, layer) {
    layer.on('click', function() {
        var plz = feature.properties.name;
        if (plz === current) {
            return;
        }
        document.getElementById("search").value = plz;
        gotoPostalCode();
    });
}

var center = undefined;
function gotoPostalCode() {
    var postalCode = document.getElementById("search").value.trim();
    if (((!postalCode || 0 === postalCode.length)) || (current === postalCode)) {
        map.flyTo(center);
        return
    }
    current = postalCode;

    var request = new XMLHttpRequest(); // a new request
    request.open("GET", "/api/" + postalCode + ".json", false);
    request.send(null);
    var response = JSON.parse(request.responseText);

    center = new L.LatLng(response.center[1], response.center[0]);
    if (true) {
        map.flyTo(center, (maxZoom - 1));
    } else {
        map.flyTo(center);
    }

    if (plz) {
        map.removeLayer(plz);
        plz = undefined;
    }

    var requestGeo = new XMLHttpRequest(); // a new request
    requestGeo.open("GET", "/api/neighbour/2/" + postalCode + ".geojson", false);
    requestGeo.send(null);
    var responseGeo = JSON.parse(requestGeo.responseText);

    plz = L.geoJSON(responseGeo, {
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
    plz.bindTooltip(function(layer) {
        return layer.feature.properties.name;
    }, { sticky: true });
    map.addLayer(plz);
}
