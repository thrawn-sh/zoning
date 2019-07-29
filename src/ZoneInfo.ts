/// <reference path="../node_modules/@types/leaflet/index.d.ts"/>

class ZoneInfo {

    private static readonly DUMMY: Zone = {
        center: [ 51.0948001, 10.2651007 ],
        manager: undefined,
        neighbours: [],
        place: '',
        population: '0',
        postalCode: '',
        state: '',
    }
    
    private readonly button: HTMLInputElement = <HTMLInputElement>document.getElementById('add');

    private readonly formatter: Intl.NumberFormat;

    private readonly manager: HTMLInputElement = <HTMLInputElement>document.getElementById('manager');

    private readonly place: HTMLInputElement = <HTMLInputElement>document.getElementById('place');

    private readonly population: HTMLInputElement = <HTMLInputElement>document.getElementById('population');

    private readonly postalcode: HTMLInputElement = <HTMLInputElement>document.getElementById('postalcode');

    private readonly state: HTMLInputElement = <HTMLInputElement>document.getElementById('state');

    private zone: Zone = ZoneInfo.DUMMY;

    private readonly selections: ZoneSelections;

    constructor(formatter: Intl.NumberFormat, selections: ZoneSelections) {
        this.formatter = formatter;
        this.selections = selections;
    }

    selectZone(zone: Zone): void {
        if (this.zone.postalCode === zone.postalCode) {
            return;
        }
        this.zone = zone;
        this.renderFields(zone);
    }

    addToSelection(): void {
        if (this.zone) {
            this.button.disabled = true;
            this.selections.addZone(this.zone);
        }
    }

    isSelectedZone(zone: Zone) : boolean {
        return this.zone.postalCode === zone.postalCode;
    }

    private renderFields(zone: Zone): void {
        let manager: string | undefined = this.zone.manager;
        this.button.disabled = <boolean>(manager || this.selections.has(zone));
        this.manager.value = (manager) ? manager : '';
        this.place.value = zone.place;
        this.postalcode.value = zone.postalCode;
        this.population.value = this.formatter.format(parseInt(zone.population));
        this.state.value = zone.state;
    }

    rerender(): void {
        this.renderFields(this.zone);
    }

    reset(): void {
        this.zone = ZoneInfo.DUMMY;
        this.renderFields(this.zone);
    }
}
