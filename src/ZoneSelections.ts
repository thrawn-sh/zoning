import { Zone } from "./Zone";

export class ZoneSelections {

    private readonly formatter: Intl.NumberFormat;
    
    private readonly selections: Set<Zone> = new Set();
    
    private readonly sumCell: HTMLTableDataCellElement = <HTMLTableDataCellElement>document.getElementById('sum');
    
    private readonly table: HTMLTableElement = <HTMLTableElement>document.getElementById('selection');

    private totalPopulation: number = 0;

    constructor(formatter: Intl.NumberFormat) {
        this.formatter = formatter;
    }

    has(zone: Zone): boolean {
        return this.selections.has(zone);
    }

    addZone(zone: Zone): void {
        if (this.selections.has(zone)) {
            return;
        }

        this.selections.add(zone);
        this.totalPopulation += parseInt(zone.population);
        this.addRow(zone);
        this.renderFields(this.totalPopulation);
    }

    removeZone(zone: Zone): void {
        if (this.selections.has(zone)) {
            this.selections.delete(zone);
            this.totalPopulation -= parseInt(zone.population);
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
        let button: HTMLInputElement = document.createElement('input');
        button.type = 'button';
        button.value = 'delete';

        let that = this;
        button.addEventListener('click', function() {
                let sum: number = parseInt(that.sumCell.innerText);
                sum -= parseInt(zone.population);
                that.sumCell.innerText = that.formatter.format(sum);
            row.parentNode.removeChild(row);
        }, false);
        buttonCell.appendChild(button);
    }

    private renderFields(total: number): void {
        this.sumCell.innerText = this.formatter.format(total);
    }

    reset(): void {
        this.selections.clear();
        this.renderFields(0);

        for (const child of this.table.children) {
            child.parentNode.removeChild(child);
        }
    }
}
