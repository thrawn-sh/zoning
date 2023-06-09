/// <reference path='../node_modules/@types/leaflet/index.d.ts'/>

class ZoneInfo {

    private readonly button: HTMLInputElement = document.getElementById('add') as HTMLInputElement;

    private readonly formatter: Intl.NumberFormat;

    private readonly manager: HTMLInputElement = document.getElementById('manager') as HTMLInputElement;

    private readonly place: HTMLInputElement = document.getElementById('place') as HTMLInputElement;

    private readonly population: HTMLInputElement = document.getElementById('population') as HTMLInputElement;

    private readonly postalcode: HTMLInputElement = document.getElementById('postalcode') as HTMLInputElement;

    private readonly selections: ZoneSelections;

    private readonly state: HTMLInputElement = document.getElementById('state') as HTMLInputElement;

    private zone: IZone = ZoneApplication.DUMMY;

    public constructor(formatter: Intl.NumberFormat, selections: ZoneSelections) {
        this.formatter = formatter;
        this.selections = selections;
    }

    public addToSelection(): void {
        if (this.zone.postalCode !== ZoneApplication.DUMMY.postalCode) {
            this.button.disabled = true;
            this.selections.addZone(this.zone);
        }
    }

    public getZone(): IZone {
        return this.zone;
    }

    public isSelectedZone(zone: IZone): boolean {
        return this.zone.postalCode === zone.postalCode;
    }

    public rerender(): void {
        this.renderFields(this.zone);
    }

    public reset(): void {
        this.zone = ZoneApplication.DUMMY;
        this.renderFields(this.zone);
    }

    public selectZone(zone: IZone): void {
        if (this.zone.postalCode === zone.postalCode) {
            return;
        }
        this.zone = zone;
        this.renderFields(zone);
    }

    private renderFields(zone: IZone): void {
        const manager: string | undefined = this.zone.manager;
        this.button.disabled = (!!manager) || this.selections.has(zone);
        this.manager.value = (!!manager) ? manager : '';
        this.place.value = zone.place;
        this.postalcode.value = zone.postalCode;
        this.population.value = this.formatter.format(parseInt(zone.population, 10));
        this.state.value = zone.state;
    }
}
