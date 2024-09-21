#!/usr/bin/python3

## helper script to validate GeoJSON files
## requires a venv with geojson-validator installed

import geojson_validator
import os

geodir='web/uat'
max_errors=10
found_errors=0

# loop through files in web/all/ and validate them
for filename in os.listdir(geodir):
    if filename.endswith('.geojson'):
        # get result and data from validate_structure
        errors = geojson_validator.validate_structure(f'{geodir}/{filename}')
        if errors:
            print('Invalid GeoJSON:', filename)
            print(errors)
        invalid_criteria = [
            "unclosed",
            "less_three_unique_nodes",
        #    "exterior_not_ccw",
            "interior_not_cw",
            "inner_and_exterior_ring_intersect"
        ]
        problematic_criteria = [
            "holes",
            "self_intersection",
        #    "duplicate_nodes", 
            "excessive_coordinate_precision",
        #    "excessive_vertices", 
            "3d_coordinates",
            "outside_lat_lon_boundaries",
            "crosses_antimeridian"
        ]
        errors = geojson_validator.validate_geometries(f'{geodir}/{filename}',
                         criteria_invalid=invalid_criteria,
                         criteria_problematic=problematic_criteria
        )
        if errors['invalid'] or errors['problematic']:
            print('Invalid GeoJSON geometry:', filename)
            print(errors)
            # fix geometries
            #fixed = geojson_validator.fix_geometries(f'{geodir}/{filename}')
            #print('Fixed:', fixed)
            found_errors += 1
            if found_errors >= max_errors:
                break
        
