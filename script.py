#!/usr/bin/python3

import json
import sys
import os



class Splitter:
    def __init__(self):
        self.cities = {}
    def check(self, filename):
        try:
            # use encoding='utf-8' to avoid UnicodeDecodeError
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except:
            return False
        data_type = data.get('type')
        if data_type == 'FeatureCollection':
            crs = data.get('crs')
            for feature in data['features']:
                if feature.get('type') != 'Feature':
                    return False
                self.export_feature(feature, crs)
            self.export_cities()
    
    def export_feature(self, feature, crs):
        # read natcode from properties
        natcode = feature['properties']['natcode']
        county = feature['properties']['countyMn']
        # create county directory if not exists
        try:
            os.makedirs(f"web/{county}")
        except:
            pass
        filename = f"web/{county}/{natcode}.geojson"
        feature['crs'] = crs
        # print to stdout county and name
        print(f"{county} {feature['properties']['name']} -> {filename}")
        with open(filename, 'w', encoding='utf-8') as out:
            json.dump(feature, out, ensure_ascii=False)
        city_data = {
            'natcode': natcode,
            'name': feature['properties']['name']
        }
        # append to cities dict in the same county
        if county in self.cities:
            self.cities[county].append(city_data)
        else:
            self.cities[county] = [city_data]
    
    def export_cities(self):
        with open('web/cities.json', 'w', encoding='utf-8') as out:
            json.dump(self.cities, out, ensure_ascii=False, indent=4)
        



if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <geojson_file>")
        sys.exit(1)
    splitter = Splitter()
    splitter.check(sys.argv[1])
                