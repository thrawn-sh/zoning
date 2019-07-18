#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from lxml    import html
from zipfile import ZipFile
import collections
import json
import os

def calculate_center(points):
    max_lat = -1000
    min_lat =  1000
    max_lng = -1000
    min_lng =  1000

    for point in points:
        lat = point[0]
        lng = point[1]

        if lat > max_lat:
            max_lat = lat
        if lat < min_lat:
            min_lat = lat
        if lng > max_lng:
            max_lng = lng
        if lng < min_lng:
            min_lng = lng

    return ((max_lat + min_lat) / 2, (max_lng + min_lng) / 2)

def calculate_neighbours(current, neighbours):
    result = set()
    points = neighbours[current]
    for neighbour in neighbours:
        neighbour_points = neighbours[neighbour]
        if (current != neighbour) and not points.isdisjoint(neighbour_points):
            result.add(neighbour)
    return list(result)

def kmz_to_geojson(kml, output_folder='api'):
    os.makedirs(output_folder, exist_ok=True)
    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()

        coordinates = []
        for c in pm.cssselect('coordinates')[0].text_content().split(' '):
            (x, y) = c.split(',')
            coordinates.append([ float(x), float(y) ])

        feature = collections.OrderedDict()
        feature['type']                    = 'Feature'
        feature['properties']              = { 'name': postal_code }
        feature['geometry']                = collections.OrderedDict()
        feature['geometry']['type']        = 'Polygon'
        feature['geometry']['coordinates'] = [ coordinates ]

        with open(output_folder + '/' + postal_code + '.geojson', 'w') as outfile:
            json.dump(feature, outfile, indent=4)

def kmz_to_json(kml, output_folder='api'):
    coordinates = { }

    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()

        points = set()
        for c in pm.cssselect('coordinates')[0].text_content().split(' '):
            (x, y) = c.split(',')
            points.add((float(x), float(y)))

        coordinates[postal_code] = points

    os.makedirs(output_folder, exist_ok=True)
    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()
        points = coordinates[postal_code]

        center = calculate_center(points)
        # external data
        license_partner = None
        neighbours = calculate_neighbours(postal_code, coordinates)
        # replace with cvs
        place = pm.cssselect('description')[0].text_content()
        # replace with cvs
        population = 0
        # replace with cvs
        state = ''

        element = collections.OrderedDict()
        element['center']           = center
        element['license_partner']  = license_partner
        element['neighbours']       = neighbours
        element['place']            = place
        element['population']       = population
        element['state']            = state

        with open(output_folder + '/' + postal_code + '.json', 'w') as outfile:
            json.dump(element, outfile, indent=4)

def main():
    kmz_name = 'plz-gebiete.kmz'
    kml_name = kmz_name.replace('kmz', 'kml')

    kmz = ZipFile(kmz_name, 'r')
    kml = kmz.open(kml_name, 'r').read()

    kml_document = html.fromstring(kml)
    kmz_to_geojson(kml_document)
    kmz_to_json(kml_document)

if __name__ == '__main__':
    main() 