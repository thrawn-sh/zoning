#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import csv
from lxml import html
import os
import zipfile
from shapely.geometry import MultiPoint
import sys

RESOLUTION = 5

def calculate_envelopes(kml):
    poligons = { }
    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()
        poligons[postal_code] = [ ]

    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()
        poligons[postal_code].append(pm.cssselect('coordinates'))

    envelopes = { }
    for postal_code in poligons:
        points = []
        for feature_poligons in poligons[postal_code]:
            for poligon in feature_poligons:
                for p in poligon.text_content().split(' '):
                    (lng, lat) = p.split(',')
                    points.append((round(float(lng), RESOLUTION), round(float(lat), RESOLUTION)))
        envelopes[postal_code] = MultiPoint(points).envelope

    return envelopes

def calculate_neighbours(kml):
    envelopes = calculate_envelopes(kml)

    result = { }
    for current in sorted(envelopes):
        result[current] = set()

    size = len(envelopes)
    count = 0
    for current in sorted(envelopes):
        count += 1
        print("%s: [%d/%d]" % (current, count, size))
        current_polygon = envelopes[current]
        for envelop in envelopes:
            if current_polygon.intersects(envelopes[envelop]):
                result[current].add(envelop)

        # fill holes: zones, that are not direct heighbours, but are totally encosed in the neighbourhood
        region = calulcate_neighbourhood_envelop(result[current], envelopes)
        for envelop in envelopes:
            if envelop in result[current]:
                continue
            if region.contains(envelopes[envelop]):
                result[current].add(envelop)

    return result

def calulcate_neighbourhood_envelop(neighbours, envelopes):
    points = [ ]
    for neighbour in neighbours:
        points.extend(list(envelopes[neighbour].exterior.coords))
    return MultiPoint(points).envelope

def main():
    parser = argparse.ArgumentParser(description="calculate neighbouring information", add_help=True)
    parser.add_argument("-o", "--output", help="output file", default='./assets/neighbours.csv')
    parser.add_argument("-z", "--zone",   help="zone KMZ",    default='./assets/zone.kmz'      )

    args = parser.parse_args()

    kmz = zipfile.ZipFile(args.zone, 'r')
    kml_name = os.path.basename(args.zone).replace('kmz', 'kml')
    kml = kmz.open(kml_name, 'r').read()

    kml_document = html.fromstring(kml)
    neighbours = calculate_neighbours(kml_document)
    with open(args.output, 'w') as csvfile:
        fieldnames = ['plz', 'neighbours']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for current in sorted(neighbours):
            neighbour = sorted(list(neighbours[current]))
            writer.writerow({ 'plz': current, 'neighbours': ' '.join(neighbour) })

if __name__ == '__main__':
    main()
