/// <reference path="../node_modules/@types/leaflet/index.d.ts"/>

interface IZone {
    readonly center: L.LatLngTuple;
    readonly manager: string | undefined;
    readonly neighbours: Array<string>;
    readonly place: string;
    readonly population: string;
    readonly postalCode: string;
    readonly state: string;
}
