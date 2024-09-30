#!/usr/bin/python3

import json
import sys
import os

# Split GeoJSON file into individual files
# and create a cities.json file for frontend
class Splitter:
    def __init__(self, type: str):
        self.cities = {}
        self.counties = {}
        self.web_dir = 'web'
        self.uat_dir = f"{self.web_dir}/uat"
        self.county_dir = f"{self.web_dir}/county"
        self.type = type
        if type == 'uat':
            self.export_dir = self.uat_dir
        else:
            self.export_dir = self.county_dir
        os.makedirs(self.export_dir, exist_ok=True)

        
    def check(self, filename):
        try:
            # use encoding='utf-8' to avoid UnicodeDecodeError
            # use parse_float to round float numbers to 6 decimal places
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f, parse_float=lambda x: round(float(x), 6))
        except:
            return False
        data_type = data.get('type')
        if data_type == 'FeatureCollection':
            crs = data.get('crs')
            for feature in data['features']:
                if feature.get('type') != 'Feature':
                    return False
                self.export_feature(feature, crs)
            if self.type == 'uat':
                self.export_cities()
    
    def export_feature(self, feature, crs):
        # read natcode from properties
        if self.type == 'uat':
            natcode = feature['properties']['natcode']
            county = feature['properties']['countyMn']
            if not county in self.cities:
                self.cities[county] = []
            # build city data for frontend
            city_data = {
                'natcode': natcode,
                'name': feature['properties']['name']
            }
            self.cities[county].append(city_data)
        else:
            # county code is used as natcode, cast to int
            natcode = feature['properties']['countyCode']
            natcode = int(natcode)
        
        # add coordinate reference system to feature
        feature['crs'] = crs
        filename = f"{self.export_dir}/{natcode}.geojson"
        with open(filename, 'w', encoding='utf-8') as out:
            json.dump(feature, out, ensure_ascii=False)

        
    def export_cities(self):
        with open(f"{self.web_dir}/cities.json", 'w', encoding='utf-8') as out:
            json.dump(self.cities, out, ensure_ascii=False, indent=4)
        
if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <type> <geojson_file>")
        sys.exit(1)
    splitter = Splitter(sys.argv[1])
    splitter.check(sys.argv[2])
                