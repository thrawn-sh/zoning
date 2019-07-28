import * as L from 'leaflet';
import { throws } from 'assert';

interface Zone {
    readonly postalCode: string;
    readonly center: L.LatLngTuple;
    readonly place: string;
    readonly state: string;
    readonly population: string;
    readonly manager: string | undefined;
}



class ZoneManager {
    private readonly germany_center: L.LatLng = new L.LatLng(51.0948001, 10.2651007);
    private readonly maxZoom: number = 14;
    private readonly minZoom: number = 6;

    private readonly map: L.Map;

    private readonly place: HTMLInputElement = <HTMLInputElement>document.getElementById('place');
    private readonly state: HTMLInputElement = <HTMLInputElement>document.getElementById('state');
    private readonly population: HTMLInputElement = <HTMLInputElement>document.getElementById('population');
    private readonly manager: HTMLInputElement = <HTMLInputElement>document.getElementById('manager');
    private readonly button: HTMLInputElement = <HTMLInputElement>document.getElementById('add');
    
    constructor() {
        this.map = L.map("map", {
            center:  this.mainZone.center,
            maxZoom: this.maxZoom,
            minZoom: this.minZoom,
            zoom:    this.minZoom,
        });
        let tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        this.map.addLayer(tileLayer);
    }

    zoomToPostalCode(postalCode: string | undefined, fly: boolean = true) {
        if (this.mainZone.postalCode === postalCode) {
            return;
        }

        let request = new XMLHttpRequest();
        request.open('GET', "/api/${postalCode}.json");
        request.onload = () => {
            if (request.status !== 200) {
                return;
            }
            let zone: Zone = JSON.parse(request.responseText);
            this.selectZone(zone, fly);
        }
        request.send();
    }

    private mainZone: Zone = new DummyZone();

    private selectedZones: Set<Zone> = new Set();

    private selectZone(zone: Zone, fly: boolean) {
        this.mainZone = zone;
        
        // update form information
        this.place.nodeValue = zone.place;
        this.state.nodeValue = zone.state;
        this.population.nodeValue = zone.population;
        this.manager.nodeValue = zone.manager;
        if (zone.manager) {
            this.button.disabled = true;
        } else {
            this.button.disabled = false; 
        }

        var center = L.latLng(zone.center);
        if (fly) {
            this.map.flyTo(center, maxZoom - 1);
        } else {
            this.map.panTo(center);
        }
    }

}