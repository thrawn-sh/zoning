(function() {
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

    map.on("viewreset",  updateCoordinates);

    var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        "attribution":  "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
        "useCache": true
    });
    map.addLayer(osm);
    // var postcode = L.geoJSON()

    updateCoordinates();
})();
