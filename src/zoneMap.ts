/// <reference path='../node_modules/@types/geojson/index.d.ts'/>
/// <reference path='../node_modules/@types/leaflet/index.d.ts'/>

class ZoneMap {

    private readonly features: Map<string, GeoJSON.Feature<GeoJSON.Geometry, IZone>> = new Map();

    private readonly info: ZoneInfo;

    private readonly map: L.Map;

    private readonly maxZoom: number = 14;

    private readonly minZoom: number = 6;

    private readonly selections: ZoneSelections;

    private readonly zoneLayer: L.GeoJSON<IZone>;

    public constructor(info: ZoneInfo, selections: ZoneSelections, selectCallback: (postalcode: string) => void) {
        this.info = info;
        const zone: IZone = ZoneApplication.DUMMY;
        this.map = L.map('map', {
            center: L.latLng(zone.center),
            maxZoom: this.maxZoom,
            minZoom: this.minZoom,
            zoom: this.minZoom,
        });
        const tileLayer: L.TileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        });
        this.map.addLayer(tileLayer);
        this.zoneLayer = L.geoJSON(undefined, {
            onEachFeature: (feature: GeoJSON.Feature<GeoJSON.Geometry, IZone>, layer: L.Layer): void => {
                layer.on('click', (): void => { selectCallback(feature.properties.postalCode); });
            },
            style: (feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> | undefined): L.PathOptions => {
                const style: L.PathOptions = {};
                if (!!feature) {
                    const zone = feature.properties;
                    if (!!zone.manager) {
                        style.fillColor = '#de4f06';
                    }
                    if (selections.has(zone)) {
                        style.fillColor = '#ffff00';
                    }
                    if (info.isSelectedZone(zone)) {
                        style.fillColor = '#8a2be2';
                    }
                }
                return style;
            },
        });
        this.zoneLayer.bindTooltip((layer: L.Layer): string => {
            const feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> = ((layer as L.GeoJSON<IZone>).feature as GeoJSON.Feature<GeoJSON.Geometry, IZone>); // FIXME
            return feature.properties.postalCode;
        },                         { sticky: true });
        this.map.addLayer(this.zoneLayer);
        this.selections = selections;
    }

    public rerender(): void {
        this.zoneLayer.clearLayers();
        // add all available features again
        for (const feature of this.features.values()) {
            this.zoneLayer.addData(feature);
        }
    }

    public reset(): void {
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

        this.zoneLayer.clearLayers();
        // add all available features again
        for (const feature of this.features.values()) {
            this.zoneLayer.addData(feature);
        }

        // request and add missing features
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
                const feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> = JSON.parse(request.responseText) as GeoJSON.Feature<GeoJSON.Geometry, IZone>;
                this.features.set(neighbour, feature);
                this.zoneLayer.addData(feature);
            };
            request.send();
        }
    }
}
