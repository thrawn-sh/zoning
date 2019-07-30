#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import collections
import csv
from lxml import html
import json
import os
import sys
import zipfile

def calculate_bounds(points):
    north = -(sys.maxsize - 1)
    east  = -(sys.maxsize - 1)
    south =   sys.maxsize
    west  =   sys.maxsize

    for (lng, lat) in points:
        if lat > east:
            east = lat
        if lat < west:
            west = lat
        if lng > north:
            north = lng
        if lng < south:
            south = lng

    return ( (south, west), (north, east) )

def calculate_center(points):
    north = -(sys.maxsize - 1)
    east  = -(sys.maxsize - 1)
    south =   sys.maxsize
    west  =   sys.maxsize

    for (lng, lat) in points:
        if lat > east:
            east = lat
        if lat < west:
            west = lat
        if lng > north:
            north = lng
        if lng < south:
            south = lng

    return ((east + west) / 2, (north + south) / 2)

def sortFeature(feature):
    return feature['id']

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
        feature['id']                      = postal_code
        feature['properties']              = { 
                'bounds':     calculate_bounds(all_points),
                'center':     calculate_center(all_points),
                'manager':    management.get(postal_code),
                'neighbours': sorted(list(neighbours.get(postal_code))),
                'place':      city.get(postal_code),
                'population': population.get(postal_code),
                'postalCode': postal_code,
                'state':      state.get(postal_code),
        }
        feature['type']                    = 'Feature'
        feature['geometry']                = collections.OrderedDict()
        feature['geometry']['coordinates'] = coordinates
        feature['geometry']['type']        = 'Polygon'

        features[postal_code] = feature

    return features


def kml_to_geojson(features, output_folder):
    folder = output_folder + '/geo'
    os.makedirs(folder, exist_ok=True)

    for feature in features:
        with open(folder + '/' + feature + '.geojson', 'w') as outfile:
            json.dump(features[feature], outfile, indent=4, ensure_ascii=False)

def generate_population_json(population, output_folder):
    os.makedirs(output_folder, exist_ok=True)

    listing = collections.OrderedDict()
    for postal_code in sorted(population):
        listing[postal_code] = population[postal_code]

    with open(output_folder + '/population.json', 'w') as outfile:
        json.dump(listing, outfile, indent=4, ensure_ascii=False)

def generate_management_json(mangement, output_folder):
    os.makedirs(output_folder, exist_ok=True)

    listing = collections.OrderedDict()
    for postal_code in sorted(mangement):
        listing[postal_code] = mangement[postal_code]

    with open(output_folder + '/mangement.json', 'w') as outfile:
        json.dump(listing, outfile, indent=4, ensure_ascii=False)

def generate_zones_json(cities, output_folder):
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

def main():
    parser = argparse.ArgumentParser(description="generate api data", add_help=True)
    parser.add_argument("-a", "--area",        help="area CSV",       default='./assets/area.csv'      )
    parser.add_argument("-m", "--management",  help="management CSV", default='./assets/management.csv')
    parser.add_argument("-n", "--neighbours",  help="neighbours CSV", default='./assets/neighbours.csv')
    parser.add_argument("-o", "--output",      help="output folder",  default='./api'                  )
    parser.add_argument("-p", "--population",  help="population CSV", default='./assets/population.csv')
    parser.add_argument("-z", "--zone",        help="zone KMZ",       default='./assets/zone.kmz'      )

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
    generate_zones_json(city, args.output)

    population = { }
    with open(args.population) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            population[postal_code] = row['einwohner']
    generate_population_json(population, args.output)

    management = { }
    with open(args.management) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            management[postal_code] = row['management']
    generate_management_json(management, args.output)

    neighbours = { }
    with open(args.neighbours) as f:
        dictionary = csv.DictReader(f, delimiter=',')
        for row in dictionary:
            postal_code = row['plz']
            neighbours[postal_code] = set(row['neighbours'].split(' '))

    kml_document = html.fromstring(kml)
    features = calculate_features(kml_document, city, state, population, management, neighbours)
    kml_to_geojson(features, args.output)

    #if args.json:
    #    kml_to_json(kml_document, city, state, population, management, args.output)

if __name__ == '__main__':
    main()
