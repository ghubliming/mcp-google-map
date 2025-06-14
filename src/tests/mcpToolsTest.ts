import { GoogleMapsTools } from '../maps-tools/toolclass.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a write stream for logging
const logStream = fs.createWriteStream(
  path.join(process.cwd(), 'logs', `mcp-tools-test-${new Date().toISOString().replace(/[:.]/g, '-')}.log`),
  { flags: 'a' }
);

// Helper function to log to both console and file
function log(message: string) {
  console.log(message);
  logStream.write(message + '\n');
}

async function testAllMCPTools() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    log('GOOGLE_MAPS_API_KEY not set in environment.');
    process.exit(1);
  }

  const tools = new GoogleMapsTools();
  const testResults: { [key: string]: { success: boolean; error?: string } } = {};

  // Test 1: Geocoding
  try {
    log('\nTesting Geocoding...');
    const result = await tools.geocode('1600 Amphitheatre Parkway, Mountain View, CA');
    testResults.geocoding = {
      success: true
    };
    log('✅ Geocoding works!');
    log('Location: ' + JSON.stringify(result.location));
    log('Formatted address: ' + result.formatted_address);
  } catch (err) {
    testResults.geocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 2: Reverse Geocoding
  try {
    log('\nTesting Reverse Geocoding...');
    const result = await tools.reverseGeocode(37.4224764, -122.0842499);
    testResults.reverseGeocoding = {
      success: true
    };
    log('✅ Reverse Geocoding works!');
    log('Address: ' + result.formatted_address);
  } catch (err) {
    testResults.reverseGeocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 3: Search Nearby Places
  try {
    log('\nTesting Search Nearby Places...');
    const result = await tools.searchNearbyPlaces({
      location: { lat: 37.4224764, lng: -122.0842499 },
      radius: 1000,
      keyword: 'restaurant'
    });
    testResults.searchNearby = {
      success: true
    };
    log('✅ Search Nearby Places works!');
    log('Found ' + result.length + ' places');
  } catch (err) {
    testResults.searchNearby = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 4: Distance Matrix
  try {
    log('\nTesting Distance Matrix...');
    const result = await tools.calculateDistanceMatrix(
      ['New York, NY', 'Boston, MA'],
      ['Washington, DC', 'Philadelphia, PA']
    );
    testResults.distanceMatrix = {
      success: true
    };
    log('✅ Distance Matrix works!');
    log('Distances: ' + JSON.stringify(result.distances));
    log('Durations: ' + JSON.stringify(result.durations));
  } catch (err) {
    testResults.distanceMatrix = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 5: Directions
  try {
    log('\nTesting Directions...');
    const result = await tools.getDirections(
      'New York, NY',
      'Boston, MA',
      'driving'
    );
    testResults.directions = {
      success: true
    };
    log('✅ Directions works!');
    log('Route summary: ' + result.summary);
    log('Total distance: ' + result.total_distance.text);
    log('Total duration: ' + result.total_duration.text);
  } catch (err) {
    testResults.directions = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 6: Place Details
  try {
    log('\nTesting Place Details...');
    // First get a place ID using geocoding
    const geocodeResult = await tools.geocode('Eiffel Tower, Paris');
    const result = await tools.getPlaceDetails(geocodeResult.place_id);
    testResults.placeDetails = {
      success: true
    };
    log('✅ Place Details works!');
    log('Place name: ' + result.name);
    log('Rating: ' + result.rating);
    if (result.opening_hours) {
      log('Opening Hours:');
      if (result.opening_hours.weekday_text) {
        log('Weekly Schedule:');
        result.opening_hours.weekday_text.forEach(day => log('  ' + day));
      }
      if (result.opening_hours.periods) {
        log('Detailed Schedule:');
        result.opening_hours.periods.forEach(period => {
          log(`  Open: ${period.open.day} at ${period.open.time}`);
          log(`  Close: ${period.close.day} at ${period.close.time}`);
        });
      }
    }
  } catch (err) {
    testResults.placeDetails = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 7: Elevation
  try {
    log('\nTesting Elevation...');
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 },  // New York City
      { latitude: 27.9881, longitude: 86.9250 },   // Mount Everest
      { latitude: 36.7783, longitude: -119.4179 }  // California
    ];
    const result = await tools.getElevation(locations);
    testResults.elevation = {
      success: true
    };
    log('✅ Elevation works!');
    log('Elevation results:');
    result.forEach((item, index) => {
      log(`  Location ${index + 1}: ${item.elevation.toFixed(2)} meters`);
    });
  } catch (err) {
    testResults.elevation = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Print Summary
  log('\n=== MCP Tools Test Summary ===');
  Object.entries(testResults).forEach(([tool, result]) => {
    log(`${result.success ? '✅' : '❌'} ${tool}: ${result.success ? 'Works' : 'Failed'}`);
    if (!result.success && result.error) {
      log(`   Error: ${result.error}`);
    }
  });

  // Close the log stream
  logStream.end();

  // Exit with appropriate code
  const allSuccessful = Object.values(testResults).every(result => result.success);
  process.exit(allSuccessful ? 0 : 1);
}

testAllMCPTools().catch(err => {
  log('Test failed with error: ' + err);
  logStream.end();
  process.exit(1);
}); 