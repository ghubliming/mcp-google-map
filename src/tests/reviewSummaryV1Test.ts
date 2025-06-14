import { GoogleMapsTools } from "../maps-tools/toolclass.js";
import { createLogger } from "./testUtils.js";

const log = createLogger("review-summary-v1-test");

async function testReviewSummaryV1() {
  const tools = new GoogleMapsTools();
  const testResults: Record<string, { success: boolean; error?: string }> = {};

  try {
    log('\nTesting Place Details with Review Summary (API v1)...');
    log('Note: Testing with Dumpling House in New York');
    
    // Use the exact place ID from the example
    const placeId = 'ChIJD2l2k7ZL0YkRC80d-3MV1lM';
    log('Using place ID: ' + placeId);

    // Test 1: Get Review Summary using API v1
    log('\nTest 1: Get Review Summary (API v1)');
    const summaryResult = await tools.getPlaceDetailsV1(placeId);

    if (!summaryResult.success || !summaryResult.data) {
      throw new Error('Failed to get review summary: ' + (summaryResult.error || 'Unknown error'));
    }

    testResults.reviewSummary = { success: true };
    log('✅ Review Summary Test (API v1):');
    
    // Log the raw response for debugging
    log('\nRaw Response:');
    log(JSON.stringify(summaryResult.data, null, 2));

    if (summaryResult.data.displayName) {
      log('\nPlace Name:');
      log(`  Text: ${summaryResult.data.displayName.text}`);
      log(`  Language: ${summaryResult.data.displayName.languageCode}`);
    }

    if (summaryResult.data.reviewSummary) {
      log('\nReview Summary:');
      log(`  Text: ${summaryResult.data.reviewSummary.text.text}`);
      log(`  Language: ${summaryResult.data.reviewSummary.text.languageCode}`);
      log(`  Disclosure: ${summaryResult.data.reviewSummary.disclosureText.text}`);
      log(`  Flag Content URI: ${summaryResult.data.reviewSummary.flagContentUri}`);
    }

    if (summaryResult.data.googleMapsLinks) {
      log('\nGoogle Maps Links:');
      log(`  Reviews URI: ${summaryResult.data.googleMapsLinks.reviewsUri}`);
    }

    // Test 2: Error Handling - Invalid Place ID
    log('\nTest 2: Error Handling - Invalid Place ID');
    const invalidResult = await tools.getPlaceDetailsV1('invalid_place_id');

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