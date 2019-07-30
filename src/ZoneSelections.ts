class ZoneSelections {

    private readonly centerCallback: (postalcode: string) => void;

    private readonly deleteCallback: () => void;

    private readonly formatter: Intl.NumberFormat;

    private readonly selections: Map<string, Zone> = new Map();

    private readonly sumCell: HTMLTableDataCellElement = document.getElementById("sum") as HTMLTableDataCellElement;

    private readonly table: HTMLTableElement = document.getElementById("selection") as HTMLTableElement;

    private totalPopulation: number = 0;

    public constructor(formatter: Intl.NumberFormat, centerCallback: (postalcode: string) => void, deleteCallback: () => void) {
        this.centerCallback = centerCallback;
        this.deleteCallback = deleteCallback;
        this.formatter = formatter;
    }

    public addZone(zone: Zone): void {
        if (this.selections.has(zone.postalCode)) {
            return;
        }

        this.selections.set(zone.postalCode, zone);
        this.totalPopulation += parseInt(zone.population, 10);
        this.addRow(zone);
        this.renderFields(this.totalPopulation);
    }

    public has(zone: Zone): boolean {
        return this.selections.has(zone.postalCode);
    }

    public removeZone(zone: Zone): void {
        if (this.selections.has(zone.postalCode)) {
            this.selections.delete(zone.postalCode);
            this.totalPopulation -= parseInt(zone.population, 10);
            this.renderFields(this.totalPopulation);
        }
    }

    public reset(): void {
        this.selections.clear();
        this.totalPopulation = 0;
        this.renderFields(this.totalPopulation);

        for (const child of Array.from(this.table.children)) {
            this.table.removeChild(child);
        }
    }

    private addRow(zone: Zone): void {
        const row: HTMLTableRowElement = this.table.insertRow();

        const placeCell: HTMLTableDataCellElement = row.insertCell();
        placeCell.innerText = zone.place;

        const postalCodeCell: HTMLTableDataCellElement = row.insertCell();
        postalCodeCell.innerText = zone.postalCode;
        postalCodeCell.classList.add("center");

        const populationCell: HTMLTableDataCellElement = row.insertCell();
        populationCell.innerText = this.formatter.format(parseInt(zone.population, 10));
        populationCell.classList.add("right");

        const buttonCell: HTMLTableDataCellElement = row.insertCell();
        const that = this;
        const buttonDelete: HTMLInputElement = document.createElement("input");
        buttonDelete.type = "button";
        buttonDelete.value = "delete";

        buttonDelete.addEventListener("click", (): void => {
            that.table.removeChild(row);
            that.removeZone(zone);
            that.deleteCallback();
        },                            false);
        buttonCell.appendChild(buttonDelete);

        const buttonCenter: HTMLInputElement = document.createElement("input");
        buttonCenter.type = "button";
        buttonCenter.value = "center";

        buttonCenter.addEventListener("click", (): void => {
            that.centerCallback(zone.postalCode);
        },                            false);
        buttonCell.appendChild(buttonCenter);
    }

    private renderFields(total: number): void {
        this.sumCell.innerText = this.formatter.format(total);
    }
}
