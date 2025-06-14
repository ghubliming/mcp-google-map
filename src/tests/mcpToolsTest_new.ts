import { GoogleMapsTools } from '../maps-tools/toolclass.js';
import { PlacesSearcher } from '../maps-tools/searchPlaces.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create a write stream for logging
const logStream = fs.createWriteStream(
  path.join(process.cwd(), 'logs', `mcp-tools-test-new-${new Date().toISOString().replace(/[:.]/g, '-')}.log`),
  { flags: 'a' }
);

// Store all logs for final report
const allLogs: string[] = [];

// Override console.log to capture everything
const originalConsoleLog = console.log;
console.log = function(...args) {
  // Convert all arguments to strings and join them
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  }).join(' ');
  
  // Log to original console
  originalConsoleLog.apply(console, args);
  
  // Write to file
  logStream.write(message + '\n');
  
  // Store in logs array
  allLogs.push(message);
};

// Helper function to log to both console and file
function log(message: string) {
  console.log(message);
}

interface Review {
  rating: number;
  author_name: string;
  time: string;
  text: string;
  relative_time_description?: string;
}

interface Place {
  name: string;
  placeId: string;
  rating?: number;
}

interface TestResult {
  success: boolean;
  error?: string;
  reviewSummary?: any;
}

async function testAllMCPTools() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    log('GOOGLE_MAPS_API_KEY not set in environment.');
    process.exit(1);
  }

  log('🚀 Starting MCP Google Maps Tools Test Suite');
  log('===============================================');
  log(`Test started at: ${new Date().toISOString()}`);
  log(`API Key configured: ${apiKey ? 'Yes' : 'No'}`);
  log('');

  const mapsTools = new GoogleMapsTools();
  const placesSearcher = new PlacesSearcher(mapsTools);
  const testResults: { [key: string]: TestResult } = {};

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
    log('Formatted address: ' + result.data.formatted_address);  } catch (err) {
    testResults.geocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Geocoding failed: ' + (err instanceof Error ? err.message : String(err)));
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
    log('Formatted address: ' + result.data.formatted_address);  } catch (err) {
    testResults.reverseGeocoding = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Reverse Geocoding failed: ' + (err instanceof Error ? err.message : String(err)));
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
    }  } catch (err) {
    testResults.searchNearby = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Search Nearby failed: ' + (err instanceof Error ? err.message : String(err)));
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
    log('Distances calculated successfully');  } catch (err) {
    testResults.distanceMatrix = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Distance Matrix failed: ' + (err instanceof Error ? err.message : String(err)));
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
    log('Total duration: ' + result.data.total_duration.text);  } catch (err) {
    testResults.directions = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Directions failed: ' + (err instanceof Error ? err.message : String(err)));
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
      testResults.reviews = { 
        success: true,
        reviewSummary: result.data.review_summary
      };
      log('✅ Reviews work!');
      log(`Overall Rating: ${result.data.overall_rating}`);
      log(`Total Ratings: ${result.data.total_ratings}`);
      log(`Reviews Count: ${result.data.reviews.length}`);
      log(`Review Summary Available: ${result.data.review_summary ? 'Yes' : 'No'}`);
      
      if (result.data.review_summary) {
        log('\nReview Summary:');
        log(JSON.stringify(result.data.review_summary, null, 2));
      }
      
      if (result.data.reviews.length > 0) {
        log('\nDetailed Reviews:');
        result.data.reviews.forEach((review: Review, index: number) => {
          log(`\nReview ${index + 1}:`);
          log(`  Rating: ${review.rating}`);
          log(`  Author: ${review.author_name}`);
          log(`  Time: ${review.time}`);
          log(`  Text: ${review.text}`);
          if (review.relative_time_description) {
            log(`  Posted: ${review.relative_time_description}`);
          }
        });
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
    });  } catch (err) {
    testResults.elevation = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Elevation failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 9: Place ID Resolution - Get Place ID from Address
  try {
    log('\nTesting Place ID Resolution from Address...');
    const result = await mapsTools.getPlaceIdFromAddress('Eiffel Tower, Paris');
    if (!result.success || !result.placeId) {
      throw new Error('Failed to get Place ID from address: ' + (result.error || 'Unknown error'));
    }
    testResults.placeIdFromAddress = {
      success: true
    };
    log('✅ Place ID from Address works!');
    log('Place ID: ' + result.placeId);
  } catch (err) {
    testResults.placeIdFromAddress = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place ID from Address failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 10: Place ID Resolution - Get Place ID from Coordinates
  try {
    log('\nTesting Place ID Resolution from Coordinates...');
    const result = await mapsTools.getPlaceIdFromCoordinates(48.8584, 2.2945); // Eiffel Tower coordinates
    if (!result.success || !result.placeId) {
      throw new Error('Failed to get Place ID from coordinates: ' + (result.error || 'Unknown error'));
    }
    testResults.placeIdFromCoordinates = {
      success: true
    };
    log('✅ Place ID from Coordinates works!');
    log('Place ID: ' + result.placeId);
  } catch (err) {
    testResults.placeIdFromCoordinates = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place ID from Coordinates failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 11: Place ID Resolution - Get Place IDs from Nearby Search
  try {
    log('\nTesting Place ID Resolution from Nearby Search...');
    const result = await mapsTools.getPlaceIdsNearby(
      { value: 'Times Square, New York', isCoordinates: false },
      'restaurant',
      500
    );
    if (!result.success || !result.placeIds || result.placeIds.length === 0) {
      throw new Error('Failed to get Place IDs from nearby search: ' + (result.error || 'Unknown error'));
    }
    testResults.placeIdsFromNearby = {
      success: true
    };
    log('✅ Place IDs from Nearby Search works!');
    log(`Found ${result.placeIds.length} places`);
    result.placeIds.slice(0, 3).forEach((place, index) => {
      log(`  ${index + 1}. ${place.name} (${place.placeId})`);
    });
  } catch (err) {
    testResults.placeIdsFromNearby = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place IDs from Nearby Search failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 12: Place Details V1 with Search (Address)
  try {
    log('\nTesting Place Details V1 with Address Search...');
    const result = await mapsTools.getPlaceDetailsV1WithSearch({
      address: 'Statue of Liberty, New York'
    });
    if (!result.success || !result.data) {
      throw new Error('Failed to get V1 place details from address: ' + (result.error || 'Unknown error'));
    }
    testResults.placeDetailsV1WithAddress = {
      success: true
    };
    log('✅ Place Details V1 with Address Search works!');
    log('Display Name: ' + (result.data.displayName?.text || 'N/A'));
    log('Resolved Place ID: ' + result.data.resolvedPlaceId);
    log('Search Method: ' + result.data.searchMethod);
    if (result.data.reviewSummary) {
      log('Review Summary Available: Yes');
    }
  } catch (err) {
    testResults.placeDetailsV1WithAddress = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place Details V1 with Address Search failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 13: Place Details V1 with Search (Coordinates)
  try {
    log('\nTesting Place Details V1 with Coordinates Search...');
    const result = await mapsTools.getPlaceDetailsV1WithSearch({
      coordinates: { lat: 40.6892, lng: -74.0445 } // Statue of Liberty coordinates
    });
    if (!result.success || !result.data) {
      throw new Error('Failed to get V1 place details from coordinates: ' + (result.error || 'Unknown error'));
    }
    testResults.placeDetailsV1WithCoordinates = {
      success: true
    };
    log('✅ Place Details V1 with Coordinates Search works!');
    log('Display Name: ' + (result.data.displayName?.text || 'N/A'));
    log('Resolved Place ID: ' + result.data.resolvedPlaceId);
    log('Search Method: ' + result.data.searchMethod);
  } catch (err) {
    testResults.placeDetailsV1WithCoordinates = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Place Details V1 with Coordinates Search failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 14: Reviews by Address (using new Place ID resolution)
  try {
    log('\nTesting Reviews by Address (with Place ID resolution)...');
    const result = await placesSearcher.getReviewsByAddress('Central Park, New York', 3, true);
    if (!result.success || !result.data) {
      log('⚠️ Reviews by Address may not be available: ' + (result.error || 'Unknown error'));
      testResults.reviewsByAddress = { success: false, error: result.error };
    } else {
      testResults.reviewsByAddress = { 
        success: true,
        reviewSummary: result.data.review_summary
      };
      log('✅ Reviews by Address works!');
      log(`Overall Rating: ${result.data.overall_rating}`);
      log(`Total Ratings: ${result.data.total_ratings}`);
      log(`Reviews Count: ${result.data.reviews.length}`);
      log(`Review Summary Available: ${result.data.review_summary ? 'Yes' : 'No'}`);
      
      if (result.data.review_summary) {
        log('\nReview Summary:');
        log(JSON.stringify(result.data.review_summary, null, 2));
      }
      
      if (result.data.reviews.length > 0) {
        log('\nDetailed Reviews:');
        result.data.reviews.forEach((review: Review, index: number) => {
          log(`\nReview ${index + 1}:`);
          log(`  Rating: ${review.rating}`);
          log(`  Author: ${review.author_name}`);
          log(`  Time: ${review.time}`);
          log(`  Text: ${review.text}`);
          if (review.relative_time_description) {
            log(`  Posted: ${review.relative_time_description}`);
          }
        });
      }
    }
  } catch (err) {
    testResults.reviewsByAddress = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Reviews by Address failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 15: Reviews by Coordinates (using new Place ID resolution)
  try {
    log('\nTesting Reviews by Coordinates (with Place ID resolution)...');
    const result = await placesSearcher.getReviewsByCoordinates(40.7829, -73.9654, 2, true); // Central Park coordinates
    if (!result.success || !result.data) {
      log('⚠️ Reviews by Coordinates may not be available: ' + (result.error || 'Unknown error'));
      testResults.reviewsByCoordinates = { success: false, error: result.error };
    } else {
      testResults.reviewsByCoordinates = { 
        success: true,
        reviewSummary: result.data.review_summary
      };
      log('✅ Reviews by Coordinates works!');
      log(`Overall Rating: ${result.data.overall_rating}`);
      log(`Total Ratings: ${result.data.total_ratings}`);
      log(`Reviews Count: ${result.data.reviews.length}`);
      
      if (result.data.review_summary) {
        log('\nReview Summary:');
        log(JSON.stringify(result.data.review_summary, null, 2));
      }
      
      if (result.data.reviews.length > 0) {
        log('\nDetailed Reviews:');
        result.data.reviews.forEach((review: Review, index: number) => {
          log(`\nReview ${index + 1}:`);
          log(`  Rating: ${review.rating}`);
          log(`  Author: ${review.author_name}`);
          log(`  Time: ${review.time}`);
          log(`  Text: ${review.text}`);
          if (review.relative_time_description) {
            log(`  Posted: ${review.relative_time_description}`);
          }
        });
      }
    }
  } catch (err) {
    testResults.reviewsByCoordinates = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Reviews by Coordinates failed: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Test 16: Reviews by Nearby Search (using new Place ID resolution)
  try {
    log('\nTesting Reviews by Nearby Search (with Place ID resolution)...');
    const result = await placesSearcher.getReviewsByNearbySearch(
      { value: 'Bryant Park, New York', isCoordinates: false },
      'restaurant',
      500,
      2,
      true
    );
    if (!result.success || !result.data) {
      log('⚠️ Reviews by Nearby Search may not be available: ' + (result.error || 'Unknown error'));
      testResults.reviewsByNearbySearch = { success: false, error: result.error };
    } else {
      testResults.reviewsByNearbySearch = { 
        success: true,
        reviewSummary: result.data.review_summary
      };
      log('✅ Reviews by Nearby Search works!');
      log(`Overall Rating: ${result.data.overall_rating}`);
      log(`Total Ratings: ${result.data.total_ratings}`);
      log(`Reviews Count: ${result.data.reviews.length}`);
      
      if (result.data.review_summary) {
        log('\nReview Summary:');
        log(JSON.stringify(result.data.review_summary, null, 2));
      }
      
      if (result.data.reviews.length > 0) {
        log('\nDetailed Reviews:');
        result.data.reviews.forEach((review: Review, index: number) => {
          log(`\nReview ${index + 1}:`);
          log(`  Rating: ${review.rating}`);
          log(`  Author: ${review.author_name}`);
          log(`  Time: ${review.time}`);
          log(`  Text: ${review.text}`);
          if (review.relative_time_description) {
            log(`  Posted: ${review.relative_time_description}`);
          }
        });
      }
      
      if (result.availablePlaces) {
        log('\nAvailable Places:');
        result.availablePlaces.forEach((place: Place, index: number) => {
          log(`\nPlace ${index + 1}:`);
          log(`  Name: ${place.name}`);
          log(`  Place ID: ${place.placeId}`);
          if (place.rating) {
            log(`  Rating: ${place.rating}`);
          }
        });
      }
    }
  } catch (err) {
    testResults.reviewsByNearbySearch = {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
    log('❌ Reviews by Nearby Search failed: ' + (err instanceof Error ? err.message : String(err)));
  }
  // Print Summary
  log('\n=== MCP Tools Test Summary ===');
  const totalTests = Object.keys(testResults).length;
  const successfulTests = Object.values(testResults).filter(result => result.success).length;
  const failedTests = totalTests - successfulTests;
  
  log(`Total Tests: ${totalTests}`);
  log(`Successful: ${successfulTests}`);
  log(`Failed: ${failedTests}`);
  log('');
  
  Object.entries(testResults).forEach(([tool, result]) => {
    log(`${result.success ? '✅' : '❌'} ${tool}: ${result.success ? 'Works' : 'Failed'}`);
    if (!result.success && result.error) {
      log(`   Error: ${result.error}`);
    }
  });

  // Add Review Summary Section
  log('\n=== Review Summary ===');
  const reviewTests = ['reviews', 'reviewsByAddress', 'reviewsByCoordinates', 'reviewsByNearbySearch'];
  reviewTests.forEach(testName => {
    const testResult = testResults[testName];
    if (testResult && testResult.success) {
      log(`\n${testName}:`);
      log('  Status: ✅ Success');
      if (testResult.reviewSummary) {
        log('  Review Summary:');
        log(JSON.stringify(testResult.reviewSummary, null, 2));
      }
    } else if (testResult) {
      log(`\n${testName}:`);
      log('  Status: ❌ Failed');
      if (testResult.error) {
        log(`  Error: ${testResult.error}`);
      }
    }
  });

  log('');
  log(`=== Overall Result: ${successfulTests === totalTests ? '✅ ALL TESTS PASSED' : `❌ ${failedTests} TEST(S) FAILED`} ===`);

  // Save all logs to a final report file
  const finalReportPath = path.join(process.cwd(), 'logs', `mcp-tools-test-new-final-report-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
  fs.writeFileSync(finalReportPath, allLogs.join('\n'));

  // Restore original console.log
  console.log = originalConsoleLog;

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
