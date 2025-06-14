import { GoogleMapsTools } from "../maps-tools/toolclass.js";
import { PlacesSearcher } from "../maps-tools/searchPlaces.js";
import { PlaceReviews } from "../maps-tools/placeReviews.js";
import { createLogger } from "./testUtils.js";

const log = createLogger("review-summary-v1-test");

async function testReviewSummaryV1() {
  const mapsTools = new GoogleMapsTools();
  const placesSearcher = new PlacesSearcher(mapsTools);
  const placeReviews = new PlaceReviews(mapsTools);
  const testResults: Record<string, { success: boolean; error?: string }> = {};

  try {
    log('\nTesting Review Summary with new approach...');
    log('Note: Testing with Dumpling House in New York');
    
    // Use the exact place ID from the example
    const placeId = 'ChIJD2l2k7ZL0YkRC80d-3MV1lM';
    log('Using place ID: ' + placeId);

    // Test 1: Get Review Summary using our new approach
    log('\nTest 1: Get Review Summary (via PlaceReviews class)');
    const summaryResult = await placeReviews.getReviewSummary(placeId);

    if (!summaryResult.success || !summaryResult.data) {
      log('⚠️ Review summary may not be available: ' + (summaryResult.error || 'Unknown error'));
      testResults.reviewSummary = { success: false, error: summaryResult.error };
    } else {
      testResults.reviewSummary = { success: true };
      log('✅ Review Summary Test (via PlaceReviews):');
      
      log('\nReview Summary Data:');
      log(`  Text: ${summaryResult.data.text}`);
      log(`  Disclosure: ${summaryResult.data.disclosure_text}`);
      log(`  Flag Content URI: ${summaryResult.data.flag_content_uri}`);
      if (summaryResult.data.reviews_uri) {
        log(`  Reviews URI: ${summaryResult.data.reviews_uri}`);
      }
    }

    // Test 2: Get Combined Reviews (old reviews + V1 summary)
    log('\nTest 2: Get Combined Reviews (old + V1 summary)');
    const combinedResult = await placesSearcher.getReviews(placeId, 5, true);

    if (!combinedResult.success || !combinedResult.data) {
      log('⚠️ Combined reviews may not be available: ' + (combinedResult.error || 'Unknown error'));
      testResults.combinedReviews = { success: false, error: combinedResult.error };
    } else {
      testResults.combinedReviews = { success: true };
      log('✅ Combined Reviews Test:');
      log(`  Overall Rating: ${combinedResult.data.overall_rating}`);
      log(`  Total Ratings: ${combinedResult.data.total_ratings}`);
      log(`  Number of Reviews: ${combinedResult.data.reviews.length}`);
      log(`  Review Summary Included: ${combinedResult.data.review_summary ? 'Yes' : 'No'}`);
      
      if (combinedResult.data.review_summary) {
        log(`  Summary Text Preview: ${combinedResult.data.review_summary.text.substring(0, 100)}...`);
      }
    }

    // Test 3: Direct V1 API call (fallback test)
    log('\nTest 3: Direct V1 API call (fallback test)');
    const v1Result = await mapsTools.getPlaceDetailsV1(placeId);

    if (!v1Result.success || !v1Result.data) {
      log('⚠️ V1 API may not be available: ' + (v1Result.error || 'Unknown error'));
      testResults.v1Direct = { success: false, error: v1Result.error };
    } else {
      testResults.v1Direct = { success: true };
      log('✅ Direct V1 API Test:');
      
      if (v1Result.data.displayName) {
        log(`  Place Name: ${v1Result.data.displayName.text}`);
      }
      
      if (v1Result.data.reviewSummary) {
        log(`  Review Summary Available: Yes`);
        log(`  Summary Preview: ${v1Result.data.reviewSummary.text.text.substring(0, 100)}...`);
      } else {
        log(`  Review Summary Available: No`);
      }
    }

    // Test 4: Error Handling - Invalid Place ID
    log('\nTest 4: Error Handling - Invalid Place ID');
    const invalidResult = await placeReviews.getReviewSummary('invalid_place_id');

    testResults.errorHandling = { 
      success: !invalidResult.success,
      error: invalidResult.error
    };
    log('✅ Error Handling Test:');
    if (!invalidResult.success) {
      log('Expected error received: ' + (invalidResult.error || 'Unknown error'));
    } else {
      log('Unexpected success with invalid place ID');
    }

    // Print final test results
    log('\nTest Results Summary:');
    Object.entries(testResults).forEach(([testName, result]) => {
      log(`${testName}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      if (result.error) {
        log(`  Error: ${result.error}`);
      }
    });

  } catch (err) {
    log('❌ Test failed: ' + (err instanceof Error ? err.message : String(err)));
    console.error('Full error:', err);
  }
}

// Run the tests
testReviewSummaryV1().catch(console.error); 