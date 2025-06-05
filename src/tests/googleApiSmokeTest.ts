import { Client } from '@googlemaps/google-maps-services-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a write stream for logging
const logStream = fs.createWriteStream(
  path.join(process.cwd(), 'logs', `google-api-smoke-test-${new Date().toISOString().replace(/[:.]/g, '-')}.log`),
  { flags: 'a' }
);

// Helper function to log to both console and file
function log(message: string) {
  console.log(message);
  logStream.write(message + '\n');
}

async function testAllApis() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    log('GOOGLE_MAPS_API_KEY not set in environment.');
    process.exit(1);
  }

  const client = new Client({});
  const testResults: { [key: string]: { success: boolean; error?: string } } = {};

  // Test 1: Geocoding API
  try {
    log('\nTesting Geocoding API...');
    const response = await client.geocode({
      params: {
        address: '1600 Amphitheatre Parkway, Mountain View, CA',
        key: apiKey,
      },
    });
    testResults.geocoding = {
      success: response.data.status === 'OK',
      error: response.data.status !== 'OK' ? response.data.error_message : undefined
    };
    if (testResults.geocoding.success) {
      log('✅ Geocoding API works!');
      log('Formatted address: ' + response.data.results[0].formatted_address);
    }
  } catch (err) {
    testResults.geocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 2: Places API - Nearby Search
  try {
    log('\nTesting Places API (Nearby Search)...');
    const response = await client.placesNearby({
      params: {
        location: { lat: 37.4224764, lng: -122.0842499 },
        radius: 1000,
        key: apiKey,
      },
    });
    testResults.placesNearby = {
      success: response.data.status === 'OK',
      error: response.data.status !== 'OK' ? response.data.error_message : undefined
    };
    if (testResults.placesNearby.success) {
      log('✅ Places API (Nearby Search) works!');
      log('Found ' + response.data.results.length + ' places');
    }
  } catch (err) {
    testResults.placesNearby = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 3: Distance Matrix API
  try {
    log('\nTesting Distance Matrix API...');
    const response = await client.distancematrix({
      params: {
        origins: ['New York, NY'],
        destinations: ['Boston, MA'],
        key: apiKey,
      },
    });
    testResults.distanceMatrix = {
      success: response.data.status === 'OK',
      error: response.data.status !== 'OK' ? response.data.error_message : undefined
    };
    if (testResults.distanceMatrix.success) {
      log('✅ Distance Matrix API works!');
      log('Distance: ' + response.data.rows[0].elements[0].distance.text);
    }
  } catch (err) {
    testResults.distanceMatrix = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 4: Directions API
  try {
    log('\nTesting Directions API...');
    const response = await client.directions({
      params: {
        origin: 'New York, NY',
        destination: 'Boston, MA',
        key: apiKey,
      },
    });
    testResults.directions = {
      success: response.data.status === 'OK',
      error: response.data.status !== 'OK' ? response.data.error_message : undefined
    };
    if (testResults.directions.success) {
      log('✅ Directions API works!');
      log('Route found with ' + response.data.routes[0].legs.length + ' legs');
    }
  } catch (err) {
    testResults.directions = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 5: Elevation API - Testing multiple locations including a mountain
  try {
    log('\nTesting Elevation API...');
    const locations = [
      { lat: 40.7128, lng: -74.0060 },  // New York City
      { lat: 27.9881, lng: 86.9250 },   // Mount Everest
      { lat: 36.7783, lng: -119.4179 }  // California
    ];
    
    const response = await client.elevation({
      params: {
        locations: locations,
        key: apiKey,
      },
    });
    
    testResults.elevation = {
      success: response.data.status === 'OK',
      error: response.data.status !== 'OK' ? response.data.error_message : undefined
    };
    
    if (testResults.elevation.success) {
      log('✅ Elevation API works!');
      log('Elevation results:');
      response.data.results.forEach((result, index) => {
        const location = locations[index];
        log(`  Location ${index + 1} (${location.lat}, ${location.lng}):`);
        log(`    Elevation: ${result.elevation.toFixed(2)} meters`);
        log(`    Resolution: ${result.resolution.toFixed(2)} meters`);
      });
    }
  } catch (err) {
    testResults.elevation = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Print Summary
  log('\n=== API Test Summary ===');
  Object.entries(testResults).forEach(([api, result]) => {
    log(`${result.success ? '✅' : '❌'} ${api}: ${result.success ? 'Works' : 'Failed'}`);
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

testAllApis().catch(err => {
  log('Test failed with error: ' + err);
  logStream.end();
  process.exit(1);
}); 