/// <reference path='../node_modules/@types/geojson/index.d.ts'/>
/// <reference path='../node_modules/@types/leaflet/index.d.ts'/>

class ZoneMap {

    private readonly features: Set<string> = new Set();

    private readonly info: ZoneInfo;

    private readonly map: L.Map;

    private readonly maxZoom: number = 14;

    private readonly minZoom: number = 6;

    private readonly selectCallback: (postalcode: string) => void;

    private readonly selections: ZoneSelections;

    private readonly zoneLayer: L.GeoJSON<IZone>;

    public constructor(info: ZoneInfo, selections: ZoneSelections, selectCallback: (postalcode: string) => void) {
        this.info = info;
        const zone: IZone = ZoneApplication.DUMMY;
        this.map = L.map('map', {
            center:  L.latLng(zone.center),
            maxZoom: this.maxZoom,
            minZoom: this.minZoom,
            zoom:    this.minZoom,
        });
        const tileLayer: L.TileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });
        this.map.addLayer(tileLayer);
        this.zoneLayer = L.geoJSON();
        this.zoneLayer.bindTooltip((layer: L.Layer): string => {
            const feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> = ((layer as L.GeoJSON<IZone>).feature as GeoJSON.Feature<GeoJSON.Geometry, IZone>); // FIXME
            return feature.properties.postalCode;
        },                         { sticky: true });
        this.map.addLayer(this.zoneLayer);
        this.selections = selections;
        this.selectCallback = selectCallback;
    }

    public redraw(): void {
        return;
        // this.zoneLayer.eachLayer((layer: L.Layer): void => {
        //     if (layer instanceof L.GeoJSON) {
        //         const feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> = ((layer as L.GeoJSON<IZone>).feature as GeoJSON.Feature<GeoJSON.Geometry, IZone>); // FIXME
        //         const zone: IZone = feature.properties;
        //         const style: L.PathOptions = this.calculateStyle(zone);
        //         layer.setStyle(style);
        //     }
        // });
    }

    public reset(): void {
        this.features.clear();
        this.zoneLayer.clearLayers();
        const zone: IZone = this.info.getZone();
        const bounds: L.LatLngBounds = new L.LatLngBounds(zone.bounds);
        this.map.flyToBounds(bounds);
    }

    public select(zone: GeoJSON.Feature<GeoJSON.Geometry, IZone>, fly: boolean = true): void {
        if (fly) {
            const bounds: L.LatLngBounds = new L.LatLngBounds(zone.properties.bounds);
            this.map.flyToBounds(bounds);
        } else {
            const center: L.LatLng = L.latLng(zone.properties.center);
            this.map.panTo(center);
        }

            const callback: (postalcode: string) => void = this.selectCallback;
            for (const neighbour of zone.properties.neighbours) {
            if (this.features.has(neighbour)) {
                continue;
            }

            const request: XMLHttpRequest = new XMLHttpRequest();
            request.open('GET', `/api/geo/${neighbour}.geojson`);
            request.onload = (): void => {
                if (request.status !== 200) {
                    return;
                }
                this.features.add(neighbour);
                const feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> = JSON.parse(request.responseText) as GeoJSON.Feature<GeoJSON.Geometry, IZone>;
                const featureZone: IZone = feature.properties;
                const style: L.PathOptions = this.calculateStyle(featureZone);
                const layer: L.GeoJSON = this.zoneLayer.addData(feature) as L.GeoJSON;
                layer.setStyle(style);
                layer.on('click', (): void => {
                    callback(featureZone.postalCode);
                });
            };
            request.send();
        }
    }

    private calculateStyle(zone: IZone): L.PathOptions {
        const style: L.PathOptions = { };
        if (!!zone.manager) {
            style.fillColor = '#de4f06';
        }
        if (this.selections.has(zone)) {
            style.fillColor = '#ffff00';
        }
        if (this.info.isSelectedZone(zone)) {
            style.fillColor = '#8a2be2';
        }
        return style;
    }
}
