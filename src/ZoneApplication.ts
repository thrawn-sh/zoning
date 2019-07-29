/// <reference path="../node_modules/@types/geojson/index.d.ts"/>

interface Zones {
    readonly zones: Array<ZoneOption>;
}

interface ZoneOption {
    readonly label: string;
    readonly value: string;
}

class ZoneApplication {

    private readonly info: ZoneInfo;
    
    private readonly map: ZoneMap;

    private readonly search: HTMLInputElement = <HTMLInputElement>document.getElementById('search');

    private readonly list: HTMLDataListElement = <HTMLDataListElement>document.getElementById('zones');
    
    private readonly selections: ZoneSelections;

    private searching: boolean = false;

    constructor() {
        let formatter: Intl.NumberFormat = new Intl.NumberFormat();
        this.selections = new ZoneSelections(formatter);
        this.info = new ZoneInfo(formatter, this.selections);
        this.map = new ZoneMap(this.info, this.selections, (postalCode: string) : void => {
            this.selectPostalCode(postalCode);
        });
        this.reset();
    }

    init(): void {
        let request = new XMLHttpRequest();
        request.open('GET', '/api/zones.json');
        request.onload = () => {
            if (request.status !== 200) {
                return;
            }
            let zoneList: Zones = JSON.parse(request.responseText);
            for (const option of zoneList.zones) {
                let optionElement: HTMLOptionElement = document.createElement('option');                
                optionElement.label = option.label;
                optionElement.value = option.value;
                this.list.appendChild(optionElement);
            }
        }
        request.send();
    }

    reset(): void {
        this.info.reset();
        this.map.reset();
        this.search.value = '';
        this.selections.reset();
    }

    addToSelection(): void {
        this.info.addToSelection();
    }

    searchPostalCode(): void {
        if (this.searching) {
            return;
        }
        this.searching = true;
        let postalCode = this.search.value;
        if (postalCode) {
            let request = new XMLHttpRequest();
            request.open('GET', `/api/geo/${postalCode}.geojson`);
            request.onload = () => {
                if (request.status !== 200) {
                   this.searching = false;
                   return;
                }
                let feature: GeoJSON.Feature<any, Zone> = JSON.parse(request.responseText);
                this.info.selectZone(feature.properties);
                this.map.select(feature);
                this.searching = false;
            }
            request.send();
        }
    }

    private selectPostalCode(postalCode: string) : void {
        this.search.value = postalCode;
        this.searchPostalCode();
    }
}

let application = new ZoneApplication();
application.init();