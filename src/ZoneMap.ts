/// <reference path="../node_modules/@types/geojson/index.d.ts"/>
/// <reference path="../node_modules/@types/leaflet/index.d.ts"/>

class ZoneMap {

    private readonly features: Set<string> = new Set();

    private readonly germanyCenter: L.LatLng = L.latLng(51.0948001, 10.2651007);

    private readonly info: ZoneInfo;

    private readonly map: L.Map;

    private readonly maxZoom: number = 14;

    private readonly minZoom: number = 6;

    private readonly selectCallback: (postalcode: string) => void;

    private readonly selections: ZoneSelections;

    private readonly zoneLayer: L.GeoJSON<Zone>;

    public constructor(info: ZoneInfo, selections: ZoneSelections, selectCallback: (postalcode: string) => void) {
        this.info = info;
        this.map = L.map("map", {
            center:  this.germanyCenter,
            maxZoom: this.maxZoom,
            minZoom: this.minZoom,
            zoom:    this.minZoom,
        });
        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });
        this.map.addLayer(tileLayer);
        this.zoneLayer = L.geoJSON();
        this.zoneLayer.bindTooltip(function(layer: L.Layer) {
            const feature: GeoJSON.Feature<any, Zone> = (layer as any).feature; // FIXME
            return feature.properties.postalCode;
        },                         { sticky: true });
        this.map.addLayer(this.zoneLayer);
        this.selections = selections;
        this.selectCallback = selectCallback;
    }

    public redraw(): void {
        const that = this;
        this.zoneLayer.eachLayer(function(layer: L.Layer) {
            if (layer instanceof L.GeoJSON) {
                const geo: L.GeoJSON<Zone> = layer;
                const feature: GeoJSON.Feature<GeoJSON.MultiPoint, Zone> | undefined = geo.feature as any; // FIXME
                if (feature) {
                    const zone: Zone = feature.properties;
                    const style: L.PathOptions = that.calculateStyle(zone);
                    layer.setStyle(style);
                }
            }
        });
    }

    public reset(): void {
        this.features.clear();
        this.zoneLayer.clearLayers();
        this.map.flyTo(this.germanyCenter, this.minZoom);
    }

    public select(zone: GeoJSON.Feature<any, Zone>): void {
        const center: L.LatLng = L.latLng(zone.properties.center);
        if (this.map.getCenter().equals(this.germanyCenter)) {
            this.map.flyTo(center, this.maxZoom - 1);
        } else {
            this.map.panTo(center);
        }

        for (const neighbour of zone.properties.neighbours) {
            if (this.features.has(neighbour)) {
                continue;
            }

            const request = new XMLHttpRequest();
            request.open("GET", `/api/geo/${neighbour}.geojson`);
            request.onload = (): void => {
                if (request.status !== 200) {
                    return;
                }
                this.features.add(neighbour);
                const feature: GeoJSON.Feature<any, Zone> = JSON.parse(request.responseText);
                const zone: Zone = feature.properties;
                const style: L.PathOptions = this.calculateStyle(zone);
                const layer: L.GeoJSON = this.zoneLayer.addData(feature) as L.GeoJSON;
                layer.setStyle(style);
                const that = this;
                layer.on("click", function() {
                    that.selectCallback(zone.postalCode);
                });
            };
            request.send();
        }
        this.redraw();
    }

    private calculateStyle(zone: Zone): L.PathOptions {
        const style: L.PathOptions = { };
        if (zone.manager) {
            style.fillColor = "#de4f06";
        }
        if (this.selections.has(zone)) {
            style.fillColor = "#ffff00";
        }
        if (this.info.isSelectedZone(zone)) {
            style.fillColor = "#8a2be2";
        }
        return style;
    }
}
