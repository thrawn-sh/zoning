/// <reference path='../node_modules/@types/geojson/index.d.ts'/>

interface IZones {
    readonly zones: Array<IZoneOption>;
}

interface IZoneOption {
    readonly label: string;
    readonly value: string;
}

class ZoneApplication {

    public static readonly DUMMY: IZone = {
        bounds: [ [ 47.30248, 5.98815], [54.98311, 14.98853] ],
        center: [ 51.0948, 10.2651 ],
        manager: undefined,
        neighbours: [],
        place: '',
        population: '0',
        postalCode: '',
        state: '',
    };

    private readonly info: ZoneInfo;

    private readonly list: HTMLDataListElement = document.getElementById('zones') as HTMLDataListElement;

    private readonly map: ZoneMap;

    private readonly search: HTMLInputElement = document.getElementById('search') as HTMLInputElement;

    private searching: boolean = false;

    private readonly selections: ZoneSelections;

    public constructor() {
        const formatter: Intl.NumberFormat = new Intl.NumberFormat();
        this.selections = new ZoneSelections(formatter, (postalCode: string): void => { this.selectPostalCode(postalCode); }, (): void => { this.info.rerender(); this.map.rerender();});
        this.info = new ZoneInfo(formatter, this.selections);
        this.map = new ZoneMap(this.info, this.selections, (postalCode: string): void => {
            this.selectPostalCode(postalCode);
        });
        this.reset();
    }

    public addToSelection(): void {
        this.info.addToSelection();
    }

    public init(): void {
        const request: XMLHttpRequest = new XMLHttpRequest();
        request.open('GET', '/api/zones.json');
        request.onload = (): void => {
            if (request.status !== 200) {
                return;
            }
            const zoneList: IZones = JSON.parse(request.responseText) as IZones;
            for (const option of zoneList.zones) {
                const optionElement: HTMLOptionElement = document.createElement('option');
                optionElement.label = option.label;
                optionElement.value = option.value;
                this.list.appendChild(optionElement);
            }
        };
        request.send();
    }

    public reset(): void {
        this.info.reset();
        this.map.reset();
        this.search.value = '';
        this.selections.reset();
    }

    public searchPostalCode(fly: boolean = true): void {
        if (this.searching) {
            return;
        }
        this.searching = true;
        const postalCode: string = this.search.value;
        if (postalCode !== '') {
            const request: XMLHttpRequest = new XMLHttpRequest();
            request.open('GET', `/api/geo/${postalCode}.geojson`);
            request.onload = (): void => {
                if (request.status === 200) {
                    const feature: GeoJSON.Feature<GeoJSON.Geometry, IZone> = JSON.parse(request.responseText) as GeoJSON.Feature<GeoJSON.Geometry, IZone>;
                    this.info.selectZone(feature.properties);
                    this.map.select(feature, fly);
                }
                this.searching = false;
            };
            request.send();
        }
    }

    private selectPostalCode(postalCode: string): void {
        this.search.value = postalCode;
        this.searchPostalCode(false);
    }
}

let application: ZoneApplication = new ZoneApplication();
application.init();
