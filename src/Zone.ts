import * as leaflet from 'leaflet';

export interface Zone {
    readonly center: leaflet.LatLngTuple;
    readonly manager: string | undefined;
    readonly place: string;
    readonly population: string;
    readonly postalCode: string;
    readonly state: string;
}
