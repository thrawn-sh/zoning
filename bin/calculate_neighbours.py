#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import csv
from lxml import html
import os
import zipfile
from shapely.geometry import Polygon
from shapely.geometry import box

def calculate_neighbours(kml):
    neighbours = { }

    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()

        points = []
        for c in pm.cssselect('coordinates'):
            for p in c.text_content().split(' '):
                (x, y) = p.split(',')
                points.append((float(x), float(y)))

        bounds = Polygon(points).bounds
        neighbours[postal_code] = box(bounds[0], bounds[1], bounds[2], bounds[3])

    result = { }
    size = len(neighbours)
    count = 0
    for pm in kml.cssselect('Placemark'):
        count += 1
        current = pm.cssselect('name')[0].text_content()
        print("%s: [%d/%d]" % (current, count, size))
        current_polygon = neighbours[current]
        for neighbour in neighbours:
            other_polygon = neighbours[neighbour]
            if current_polygon.intersects(other_polygon):
                neighbour_set = set()
                if current in result:
                    neighbour_set = result[current]

                neighbour_set.add(neighbour)
                result[current] = neighbour_set

    return result

def main():
    parser = argparse.ArgumentParser(description="calculate neighbouring information", add_help=True)
    parser.add_argument("-o", "--output",     help="output file",      required=True, default='api'     )
    parser.add_argument("-z", "--zone",       help="zone KMZ",         required=True, default='zone.kmz')

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
        for current in neighbours:
            neighbour = list(neighbours[current])
            neighbour.sort()
            writer.writerow({ 'plz': current, 'neighbours': ' '.join(neighbour) })

if __name__ == '__main__':
    main()
