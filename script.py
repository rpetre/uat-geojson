#!/usr/bin/python3

import json
import sys
import os

# Split GeoJSON file into individual files
# and create a cities.json file for frontend
class Splitter:
    def __init__(self):
        self.cities = {}
        self.web_dir = 'web'
        self.uat_dir = f"{self.web_dir}/uat"
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
            os.makedirs(self.uat_dir, exist_ok=True)
            self.export_cities()
    
    def export_feature(self, feature, crs):
        # read natcode from properties
        natcode = feature['properties']['natcode']
        county = feature['properties']['countyMn']
        if not county in self.cities:
            self.cities[county] = []
        # add coordinate reference system to feature
        feature['crs'] = crs
        filename = f"{self.uat_dir}/{natcode}.geojson"
        with open(filename, 'w', encoding='utf-8') as out:
            json.dump(feature, out, ensure_ascii=False)
        # build city data for frontend
        city_data = {
            'natcode': natcode,
            'name': feature['properties']['name']
        }
        self.cities[county].append(city_data)
        
    def export_cities(self):
        with open(f"{self.web_dir}/cities.json", 'w', encoding='utf-8') as out:
            json.dump(self.cities, out, ensure_ascii=False, indent=4)
        
if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <geojson_file>")
        sys.exit(1)
    splitter = Splitter()
    splitter.check(sys.argv[1])
                