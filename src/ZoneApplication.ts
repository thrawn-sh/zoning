import { ZoneSelections } from './ZoneSelections';
import { ZoneInfo } from './ZoneInfo';
import { ZoneMap } from './ZoneMap';

class ZoneApplication {

    private readonly info: ZoneInfo;

    private readonly selections: ZoneSelections;

    private readonly map: ZoneMap;

    constructor() {
        let formatter: Intl.NumberFormat = new Intl.NumberFormat();
        this.selections = new ZoneSelections(formatter);
        this.info = new ZoneInfo(formatter, this.selections);
        this.map = new ZoneMap(this.info, this.selections);
        this.reset();
    }

    reset(): void {
        this.info.reset();
        this.selections.reset();
    }
}
