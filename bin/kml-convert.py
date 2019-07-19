#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import collections
import csv
import json
from lxml import html
import os
import zipfile

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

def calculate_neighbours(kml):
    neighbours = { }

    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()

        points = set()
        for c in pm.cssselect('coordinates')[0].text_content().split(' '):
            (x, y) = c.split(',')
            points.add((float(x), float(y)))

        neighbours[postal_code] = points

    result = { }
    for pm in kml.cssselect('Placemark'):
        current = pm.cssselect('name')[0].text_content()
        points = neighbours[current]
        for neighbour in neighbours:
            neighbour_points = neighbours[neighbour]
            if not points.isdisjoint(neighbour_points):
                neighbour_set = set()
                if current in result:
                    neighbour_set = result[current]

                neighbour_set.add(neighbour)
                result[current] = neighbour_set

    return result

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
            json.dump(feature, outfile, indent=4, ensure_ascii=False)

def kmz_to_json(kml, city_dictionary, state_dictionary, population_dictionary, management_dictionary, output_folder='api'):
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
        manager = management_dictionary.get(postal_code)
        place = city_dictionary.get(postal_code)
        population = population_dictionary.get(postal_code)
        state = state_dictionary.get(postal_code)

        element = collections.OrderedDict()
        element['center']     = center
        element['manager']    = manager
        element['place']      = place
        element['population'] = population
        element['state']      = state

        with open(output_folder + '/' + postal_code + '.json', 'w') as outfile:
            json.dump(element, outfile, indent=4, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser(description="generate api data", add_help=True)
    parser.add_argument("-a", "--area",       help="area CSV",       required=True, default='area.csv'      )
    parser.add_argument("-m", "--management", help="management CSV", required=True, default='management.csv')
    parser.add_argument("-o", "--output",     help="output folder",  required=True, default='api'           )
    parser.add_argument("-p", "--population", help="population CSV", required=True, default='population.csv')
    parser.add_argument("-z", "--zone",       help="zone KMZ",       required=True, default='zone.kmz'      )

    args = parser.parse_args()

    kmz = zipfile.ZipFile(args.zone, 'r')
    kml_name = os.path.basename(args.zone).replace('kmz', 'kml')
    kml = kmz.open(kml_name, 'r').read()

    city  = { }
    state = { }
    with open(args.area) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            city[postal_code]  = row['ort']
            state[postal_code] = row['bundesland']
        
    population = { }
    with open(args.population) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            population[postal_code] = row['einwohner']

    management = { }
    with open(args.management) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            management[postal_code] = row['management']

    kml_document = html.fromstring(kml)
    kmz_to_geojson(kml_document, args.output)
    kmz_to_json(kml_document, city, state, population, management, args.output)
    #neighbours = calculate_neighbours(kml_document)
#    kmz_to_neighbors(kml_document, neighbours);

if __name__ == '__main__':
    main() 
