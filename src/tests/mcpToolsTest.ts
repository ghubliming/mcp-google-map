import { GoogleMapsTools } from '../maps-tools/toolclass.js';
import { PlacesSearcher } from '../maps-tools/searchPlaces.js';
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

  const mapsTools = new GoogleMapsTools();
  const placesSearcher = new PlacesSearcher(mapsTools);
  const testResults: { [key: string]: { success: boolean; error?: string } } = {};

  // Test 1: Geocoding
  try {
    log('\nTesting Geocoding...');
    const result = await placesSearcher.geocode('1600 Amphitheatre Parkway, Mountain View, CA');
    if (!result.success || !result.data) {
      throw new Error('Failed to geocode: ' + (result.error || 'Unknown error'));
    }
    testResults.geocoding = {
      success: true
    };
    log('✅ Geocoding works!');
    log('Location: ' + JSON.stringify(result.data.location));
    log('Formatted address: ' + result.data.formatted_address);
  } catch (err) {
    testResults.geocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 2: Reverse Geocoding
  try {
    log('\nTesting Reverse Geocoding...');
    const result = await placesSearcher.reverseGeocode(37.4224764, -122.0842499);
    if (!result.success || !result.data) {
      throw new Error('Failed to reverse geocode: ' + (result.error || 'Unknown error'));
    }
    testResults.reverseGeocoding = {
      success: true
    };
    log('✅ Reverse Geocoding works!');
    log('Formatted address: ' + result.data.formatted_address);
  } catch (err) {
    testResults.reverseGeocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 3: Search Nearby
  try {
    log('\nTesting Search Nearby...');
    const result = await placesSearcher.searchNearby({
      center: { value: '40.7128,-74.0060', isCoordinates: true },
      keyword: 'restaurant',
      radius: 1000
    });
    if (!result.success || !result.data) {
      throw new Error('Failed to search nearby: ' + (result.error || 'Unknown error'));
    }
    testResults.searchNearby = {
      success: true
    };
    log('✅ Search Nearby works!');
    log('Found ' + result.data.length + ' restaurants');
    if (result.data.length > 0) {
      log('First result: ' + result.data[0].name);
    }
  } catch (err) {
    testResults.searchNearby = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 4: Distance Matrix
  try {
    log('\nTesting Distance Matrix...');
    const result = await placesSearcher.calculateDistanceMatrix(
      ['New York, NY'],
      ['Boston, MA', 'Philadelphia, PA'],
      'driving'
    );
    if (!result.success || !result.data) {
      throw new Error('Failed to calculate distance matrix: ' + (result.error || 'Unknown error'));
    }
    testResults.distanceMatrix = {
      success: true
    };
    log('✅ Distance Matrix works!');
    log('Distances calculated successfully');
  } catch (err) {
    testResults.distanceMatrix = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 5: Directions
  try {
    log('\nTesting Directions...');
    const result = await placesSearcher.getDirections(
      'New York, NY',
      'Boston, MA',
      'driving'
    );
    if (!result.success || !result.data) {
      throw new Error('Failed to get directions: ' + (result.error || 'Unknown error'));
    }
    testResults.directions = {
      success: true
    };
    log('✅ Directions works!');
    log('Route summary: ' + result.data.summary);
    log('Total distance: ' + result.data.total_distance.text);
    log('Total duration: ' + result.data.total_duration.text);
  } catch (err) {
    testResults.directions = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }

  // Test 6: Place Details (Basic - no reviews)
  try {
    log('\nTesting Place Details (Basic)...');
    // First get a place ID using geocoding
    const geocodeResult = await placesSearcher.geocode('Eiffel Tower, Paris');
    if (!geocodeResult.success || !geocodeResult.data) {
      throw new Error('Failed to get place ID for geocoding');
    }
    const placeId = geocodeResult.data.place_id;
    log('Got place ID: ' + placeId);

    const result = await placesSearcher.getPlaceDetails(placeId);
    if (!result.success || !result.data) {
      throw new Error('Failed to get place details: ' + (result.error || 'Unknown error'));
    }

    testResults.placeDetails = {
      success: true
    };
    log('✅ Place Details works!');
    log('Place name: ' + result.data.name);
    log('Rating: ' + result.data.rating);
    log('Address: ' + result.data.formattedAddress);
    if (result.data.openingHours) {
      log('Opening Hours Available: Yes');
      if (result.data.openingHours.weekdayText) {
        log('Weekly Schedule:');
        result.data.openingHours.weekdayText.forEach((day: string) => log('  ' + day));
      }
    }
  } catch (err) {
    testResults.placeDetails = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place Details failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 7: Reviews (New Approach)
  try {
    log('\nTesting Reviews (New Approach)...');
    const geocodeResult = await placesSearcher.geocode('Dumpling House, New York');
    if (!geocodeResult.success || !geocodeResult.data) {
      throw new Error('Failed to get place ID for reviews test');
    }
    const placeId = geocodeResult.data.place_id;
    log('Got place ID for reviews: ' + placeId);

    const result = await placesSearcher.getReviews(placeId, 3, true);
    if (!result.success || !result.data) {
      log('⚠️ Reviews may not be available: ' + (result.error || 'Unknown error'));
      testResults.reviews = { success: false, error: result.error };
    } else {
      testResults.reviews = { success: true };
      log('✅ Reviews work!');
      log(`Overall Rating: ${result.data.overall_rating}`);
      log(`Total Ratings: ${result.data.total_ratings}`);
      log(`Reviews Count: ${result.data.reviews.length}`);
      log(`Review Summary Available: ${result.data.review_summary ? 'Yes' : 'No'}`);
      
      if (result.data.reviews.length > 0) {
        log('\nFirst Review:');
        const review = result.data.reviews[0];
        log(`  Rating: ${review.rating}`);
        log(`  Author: ${review.author_name}`);
        log(`  Text Preview: ${review.text.substring(0, 100)}...`);
      }
    }
  } catch (err) {
    testResults.reviews = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Reviews failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 8: Elevation
  try {
    log('\nTesting Elevation...');
    const locations = [
      { latitude: 40.7128, longitude: -74.0060 },  // New York City
      { latitude: 27.9881, longitude: 86.9250 },   // Mount Everest
      { latitude: 36.7783, longitude: -119.4179 }  // California
    ];
    const result = await placesSearcher.getElevation(locations);
    if (!result.success || !result.data) {
      throw new Error('Failed to get elevation: ' + (result.error || 'Unknown error'));
    }
    testResults.elevation = {
      success: true
    };
    log('✅ Elevation works!');
    log('Elevation results:');
    result.data.forEach((item: any, index: number) => {
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
