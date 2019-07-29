class ZoneSelections {

    private readonly formatter: Intl.NumberFormat;
    
    private readonly selections: Map<string, Zone> = new Map();
    
    private readonly sumCell: HTMLTableDataCellElement = <HTMLTableDataCellElement>document.getElementById('sum');
    
    private readonly table: HTMLTableElement = <HTMLTableElement>document.getElementById('selection');

    private totalPopulation: number = 0;

    private readonly centerCallback: (postalcode: string) => void;

    private readonly deleteCallback: () => void;

    constructor(formatter: Intl.NumberFormat, centerCallback: (postalcode: string) => void, deleteCallback: () => void) {
        this.centerCallback = centerCallback;
        this.deleteCallback = deleteCallback;
        this.formatter = formatter;
    }

    has(zone: Zone): boolean {
        return this.selections.has(zone.postalCode);
    }

    addZone(zone: Zone): void {
        if (this.selections.has(zone.postalCode)) {
            return;
        }

        this.selections.set(zone.postalCode, zone);
        this.totalPopulation += parseInt(zone.population);
        this.addRow(zone);
        this.renderFields(this.totalPopulation);
    }

    removeZone(zone: Zone): void {
        if (this.selections.has(zone.postalCode)) {
            this.selections.delete(zone.postalCode);
            this.totalPopulation -= parseInt(zone.population);
            this.renderFields(this.totalPopulation);
        }
    }

    private addRow(zone: Zone): void {
        let row: HTMLTableRowElement = this.table.insertRow();

        let placeCell: HTMLTableDataCellElement = row.insertCell();
        placeCell.innerText = zone.place;

        let postalCodeCell: HTMLTableDataCellElement = row.insertCell();
        postalCodeCell.innerText = zone.postalCode;
        postalCodeCell.classList.add('center');

        let populationCell: HTMLTableDataCellElement = row.insertCell();
        populationCell.innerText = this.formatter.format(parseInt(zone.population));
        populationCell.classList.add('right');

        let buttonCell: HTMLTableDataCellElement = row.insertCell();
        let that = this;
        let buttonDelete: HTMLInputElement = document.createElement('input');
        buttonDelete.type = 'button';
        buttonDelete.value = 'delete';

        buttonDelete.addEventListener('click', function() {
            that.table.removeChild(row);
            that.removeZone(zone);
            that.deleteCallback();
        }, false);
        buttonCell.appendChild(buttonDelete);

        let buttonCenter: HTMLInputElement = document.createElement('input');
        buttonCenter.type = 'button';
        buttonCenter.value = 'center';

        buttonCenter.addEventListener('click', function() {
            that.centerCallback(zone.postalCode);
        }, false);
        buttonCell.appendChild(buttonCenter);
    }

    private renderFields(total: number): void {
        this.sumCell.innerText = this.formatter.format(total);
    }

    reset(): void {
        this.selections.clear();
        this.totalPopulation = 0;
        this.renderFields(this.totalPopulation);

        for (const child of Array.from(this.table.children)) {
            this.table.removeChild(child);
        }
    }
}
