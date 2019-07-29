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
        lat = point[1]
        lng = point[0]

        if lat > max_lat:
            max_lat = lat
        if lat < min_lat:
            min_lat = lat
        if lng > max_lng:
            max_lng = lng
        if lng < min_lng:
            min_lng = lng

    return ((max_lat + min_lat) / 2, (max_lng + min_lng) / 2)

def sortFeature(feature):
    return feature['properties']['name']


def calculate_features(kml, city, state, population, management, neighbours):
    features = { }
    for pm in kml.cssselect('Placemark'):
        postal_code = pm.cssselect('name')[0].text_content()

        all_points = []
        coordinates = []
        for c in pm.cssselect('coordinates'):
            points = []
            for p in c.text_content().split(' '):
                (x, y) = p.split(',')
                points.append((float(x), float(y)))
                all_points.append((float(x), float(y)))
            coordinates.append(points)

        feature = collections.OrderedDict()
        feature['type']                    = 'Feature'
        feature['id']                      = postal_code
        feature['properties']              = { 
                'center':     calculate_center(all_points),
                'manager':    management.get(postal_code),
                'neighbours': sorted(list(neighbours.get(postal_code))),
                'place':      city.get(postal_code),
                'population': population.get(postal_code),
                'postalCode': postal_code,
                'state':      state.get(postal_code),
        }
        feature['geometry']                = collections.OrderedDict()
        feature['geometry']['type']        = 'Polygon'
        feature['geometry']['coordinates'] = coordinates

        features[postal_code] = feature

    return features


def kml_to_geojson(features, output_folder='api'):
    folder = output_folder + '/geo'
    os.makedirs(folder, exist_ok=True)

    for feature in features:
        with open(folder + '/' + feature + '.geojson', 'w') as outfile:
            json.dump(features[feature], outfile, indent=4, ensure_ascii=False)

def zones(cities, output_folder='api'):
    os.makedirs(output_folder, exist_ok=True)

    listing = collections.OrderedDict()
    listing['zones'] = list()
    for city in sorted(cities):
        listing['zones'].append({
            'label': city + ' (' + cities[city] + ')',
            'value': city
        })

    with open(output_folder + '/zones.json', 'w') as outfile:
        json.dump(listing, outfile, indent=4, ensure_ascii=False)

def kml_to_json(kml, city_dictionary, state_dictionary, population_dictionary, management_dictionary, output_folder='api'):
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

def kml_to_neighbours(features, neighbour_dictionary, depth, output_folder='api'):
    folder = output_folder + '/neighbour/' + str(depth)
    os.makedirs(folder, exist_ok=True)
    for feature in features:
        neighbours = neighbour_dictionary[feature]
        for i in range(1, depth):
            for neighbour in neighbours:
                neighbours = neighbours | neighbour_dictionary[neighbour]

        listing = []
        for neighbour in neighbours:
            listing.append(features[neighbour])
        listing.sort(key = sortFeature)

        collection = collections.OrderedDict()
        collection['type']       = 'FeatureCollection'
        collection['features']   = listing

        with open(folder + '/' + feature + '.geojson', 'w') as outfile:
            json.dump(collection, outfile, indent=4, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser(description="generate api data", add_help=True)
    parser.add_argument("-a", "--area",        help="area CSV",         required=True, default='area.csv'                         )
    parser.add_argument("-g", "--geojson",     help="generate geojson",                                        action="store_true")
    parser.add_argument("-j", "--json",        help="generate json",                                           action="store_true")
    parser.add_argument("-m", "--management",  help="management CSV",   required=True, default='management.csv'                   )
    parser.add_argument("-n", "--neighbours",  help="neighbours CSV",   required=True, default='neighbour.csv'                    )
    parser.add_argument("-o", "--output",      help="output folder",    required=True, default='api'                              )
    parser.add_argument("-p", "--population",  help="population CSV",   required=True, default='population.csv'                   )
    parser.add_argument("-z", "--zone",        help="zone KMZ",         required=True, default='zone.kmz'                         )

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
    zones(city, args.output)

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

    neighbours = { }
    with open(args.neighbours) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            neighbours[postal_code] = set(row['neighbours'].split(' '))

    kml_document = html.fromstring(kml)
    if args.geojson:
        features = calculate_features(kml_document, city, state, population, management, neighbours)
        kml_to_geojson(features, args.output)
        #for depth in [1, 2]:
        #    kml_to_neighbours(features, neighbours, depth);

    #if args.json:
    #    kml_to_json(kml_document, city, state, population, management, args.output)

if __name__ == '__main__':
    main()
