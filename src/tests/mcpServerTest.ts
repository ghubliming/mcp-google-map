import { GoogleMapsTools } from '../maps-tools/toolclass.js';
import { PlacesSearcher, PlaceDetailsResponse, GeocodeResponse } from '../maps-tools/searchPlaces.js';
import { Review } from '../maps-tools/placeReviews.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a write stream for logging
const logStream = fs.createWriteStream(
  path.join(process.cwd(), 'logs', `mcp-server-test-${new Date().toISOString().replace(/[:.]/g, '-')}.log`),
  { flags: 'a' }
);

// Helper function to log to both console and file
function log(message: string) {
  console.log(message);
  logStream.write(message + '\n');
}

async function testMCPServer() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    log('GOOGLE_MAPS_API_KEY not set in environment.');
    process.exit(1);
  }

  const testResults: { [key: string]: { success: boolean; error?: string } } = {};
  const tools = new GoogleMapsTools();

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

  // Test 6: Place Details (without reviews)
  try {
    log('\nTesting Place Details...');
    // First get a place ID using geocoding
    const geocodeResult = await tools.geocode('Eiffel Tower, Paris');
    const placeId = geocodeResult.place_id;
    if (!placeId) {
      throw new Error('Failed to get place ID');
    }

    const result = await tools.getPlaceDetails(placeId) as PlaceDetailsResponse;
    if (!result.success || !result.data) {
      throw new Error('Failed to get place details');
    }

    testResults.placeDetails = {
      success: true
    };
    log('✅ Place Details works!');
    log('Place name: ' + result.data.name);
    log('Rating: ' + result.data.rating);
    if (result.data.openingHours) {
      log('Opening Hours:');
      if (result.data.openingHours.weekdayText) {
        log('Weekly Schedule:');
        result.data.openingHours.weekdayText.forEach((day: string) => log('  ' + day));
      }
      if (result.data.openingHours.periods) {
        log('Detailed Schedule:');
        result.data.openingHours.periods.forEach((period: { open?: { day: number; time: string }; close?: { day: number; time: string } }) => {
          if (period.open && period.close) {
            log(`  Open: ${period.open.day} at ${period.open.time}`);
            log(`  Close: ${period.close.day} at ${period.close.time}`);
          }
        });
      }
    }
    log('Note: Reviews are now handled separately via get_reviews tool');
  } catch (err) {
    testResults.placeDetails = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place Details failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 7: Get Reviews (New MCP Tool)
  try {
    log('\nTesting Get Reviews MCP Tool...');
    // Get a place ID for testing
    const geocodeResult = await tools.geocode('Central Park, New York');
    const placeId = geocodeResult.place_id;
    if (!placeId) {
      throw new Error('Failed to get place ID for reviews test');
    }

    // Test the new getReviews method via PlacesSearcher
    const placesSearcher = new PlacesSearcher(tools);
    const reviewsResult = await placesSearcher.getReviews(placeId, 5, true);
    
    if (!reviewsResult.success) {
      throw new Error(reviewsResult.error || 'Failed to get reviews');
    }
    
    testResults.getReviews = {
      success: true
    };
    log('✅ Get Reviews MCP Tool works!');
    log('Place ID: ' + placeId);
    
    if (reviewsResult.data) {
      log('Overall Rating: ' + reviewsResult.data.overall_rating);
      log('Total Ratings: ' + reviewsResult.data.total_ratings);
      log('Reviews found: ' + (reviewsResult.data.reviews ? reviewsResult.data.reviews.length : 0));
      
      if (reviewsResult.data.reviews && reviewsResult.data.reviews.length > 0) {
        log('\nTraditional Reviews:');
        reviewsResult.data.reviews.slice(0, 2).forEach((review: Review, index: number) => {
          log(`  Review ${index + 1}:`);
          log(`    Rating: ${review.rating}`);
          log(`    Author: ${review.author_name}`);
          log(`    Text: ${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}`);
        });
      }
      
      if (reviewsResult.data.review_summary) {
        log('\nV1 Review Summary:');
        log(`  Summary Text: ${reviewsResult.data.review_summary.text.substring(0, 200)}${reviewsResult.data.review_summary.text.length > 200 ? '...' : ''}`);
      } else {
        log('No V1 review summary available (may not be supported for this place)');
      }
    }
    
  } catch (err) {
    testResults.getReviews = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Get Reviews MCP Tool failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 8: Elevation
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
  log('\n=== MCP Server Test Summary ===');
  Object.entries(testResults).forEach(([test, result]) => {
    log(`${result.success ? '✅' : '❌'} ${test}: ${result.success ? 'Works' : 'Failed'}`);
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

testMCPServer().catch(err => {
  log('Test failed with error: ' + err);
  logStream.end();
  process.exit(1);
}); 