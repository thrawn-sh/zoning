"use strict";

var germanyCenter = new L.LatLng(51.0948001, 10.2651007);
var minZoom = 6;

function setCoordinates(type, lat, lng) {
    document.getElementById(type + "_lat").value  = lat;
    document.getElementById(type + "_lng").value = lng;
}

var map = L.map("map", {
    center:  germanyCenter,
    maxZoom: 14,
    minZoom: minZoom,
    zoom:    minZoom,
});

function updateCoordinates() {
    var bounds = map.getBounds();
    var center = bounds.getCenter();
    setCoordinates("center", center.lat,        center.lng      );
    setCoordinates("north",  bounds.getNorth(), center.lng      );
    setCoordinates("east",   center.lat,        bounds.getEast());
    setCoordinates("south",  bounds.getSouth(), center.lng      );
    setCoordinates("west",   center.lat,        bounds.getWest());
}

map.on("zoomend",  updateCoordinates);
map.on("moveend",  updateCoordinates);

var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    "attribution":  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    "useCache": true
});
map.addLayer(osm);

updateCoordinates();

plz = undefined;

function gotoPostalCode() {
    var postalCode = document.getElementById("search").value.trim();

    var request = new XMLHttpRequest(); // a new request
    request.open("GET", "/api/" + postalCode + ".json", false);
    request.send(null);
    var response = JSON.parse(request.responseText);

    map.flyTo(new L.LatLng(response.center[1], response.center[0]), 13);

    if (plz) {
        map.removeLayer(plz);
    }

    var requestGeo = new XMLHttpRequest(); // a new request
    requestGeo.open("GET", "/api/neighbour/2/" + postalCode + ".geojson", false);
    requestGeo.send(null);
    var responseGeo = JSON.parse(requestGeo.responseText);

    plz = L.geoJSON(responseGeo);
    map.addLayer(plz);
}
