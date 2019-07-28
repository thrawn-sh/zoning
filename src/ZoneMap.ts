import * as geojson from 'geojson';
import * as leaflet from 'leaflet';

import { ZoneSelections } from './ZoneSelections';
import { ZoneInfo } from './ZoneInfo';
import { Zone } from './Zone';

export class ZoneMap {

    private readonly germanyCenter: leaflet.LatLng = leaflet.latLng(51.0948001, 10.2651007);

    private readonly info: ZoneInfo;

    private readonly map: leaflet.Map;

    private readonly maxZoom: number = 14;

    private readonly minZoom: number = 6;

    private readonly selections: ZoneSelections;

    private zoneLayer: leaflet.GeoJSON<Zone>;

    constructor(info: ZoneInfo, selections: ZoneSelections) {
        this.info = info;
        this.map = leaflet.map('map', {
            center:  this.germanyCenter,
            maxZoom: this.maxZoom,
            minZoom: this.minZoom,
            zoom:    this.minZoom,
        });
        let tileLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        this.map.addLayer(tileLayer);
        this.zoneLayer = leaflet.geoJSON();
        this.zoneLayer.bindTooltip(function(layer: leaflet.GeoJSON<Zone>) {
            return (<any>layer.feature).id;
        }, { sticky: true });
        this.map.addLayer(this.zoneLayer);
        this.selections = selections;
    }
 
    reset(): void {
        this.zoneLayer.clearLayers();
        this.map.flyTo(this.germanyCenter, this.minZoom);
    }

    select(zone: Zone, neighbours: Array<String>): void {
        let center: leaflet.LatLng = leaflet.latLng(zone.center);
        if (this.map.getCenter() === this.germanyCenter) {
            this.map.flyTo(center, (this.maxZoom - 1));
        } else {
            this.map.panTo(center);
        }

        for (const neighbour of neighbours) {
            let request = new XMLHttpRequest();
            request.open('GET', `/api/${neighbour}.geojson`);
            request.onload = () => {
                if (request.status !== 200) {
                    return;
                }
                let feature: geojson.Feature<geojson.MultiPolygon, Zone> = JSON.parse(request.responseText);
                this.zoneLayer.addData(feature);
            }
            request.send();
        }
    }

    redraw(): void {
        // FIXME
    }
}
