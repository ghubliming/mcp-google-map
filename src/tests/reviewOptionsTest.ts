import { GoogleMapsTools } from "../maps-tools/toolclass.js";
import { PlacesSearcher } from "../maps-tools/searchPlaces.js";
import { createLogger } from "./testUtils.js";

interface Review {
  rating: number;
  text: string;
  time: number;
  author_name: string;
}

const log = createLogger("review-options-test");

async function testReviewOptions() {
  const mapsTools = new GoogleMapsTools();
  const placesSearcher = new PlacesSearcher(mapsTools);
  const testResults: Record<string, { success: boolean; error?: string }> = {};

  try {
    log('\nTesting Place Details with Review Options...');
    log('Note: Our new approach separates reviews from basic place details');
    
    // First get a place ID using geocoding
    const geocodeResult = await placesSearcher.geocode('Eiffel Tower, Paris');
    if (!geocodeResult.success || !geocodeResult.data) {
      throw new Error('Failed to get place ID');
    }
    const placeId = geocodeResult.data.place_id;
    log('Got place ID: ' + placeId);

    // Test 1: Basic Place Details (no reviews)
    log('\nTest 1: Basic Place Details (no reviews by default)');
    const basicResult = await placesSearcher.getPlaceDetails(placeId);

    if (!basicResult.success || !basicResult.data) {
      throw new Error('Failed to get basic place details: ' + (basicResult.error || 'Unknown error'));
    }

    testResults.basicDetails = { success: true };
    log('✅ Basic Place Details Test:');
    log(`Place Name: ${basicResult.data.name}`);
    log(`Rating: ${basicResult.data.rating}`);
    log(`Address: ${basicResult.data.formattedAddress}`);
    log('Reviews are not included by default (as expected)');

    // Test 2: Get Reviews Separately (default 5 reviews)
    log('\nTest 2: Get Reviews Separately (default 5 reviews)');
    const reviewsResult = await placesSearcher.getReviews(placeId);

    if (!reviewsResult.success || !reviewsResult.data) {
      log('⚠️ Reviews may not be available for this place: ' + (reviewsResult.error || 'Unknown error'));
      testResults.defaultReviews = { success: false, error: reviewsResult.error };
    } else {
      testResults.defaultReviews = { success: true };
      log('✅ Default Reviews Test:');
      log(`Overall Rating: ${reviewsResult.data.overall_rating}`);
      log(`Total Ratings: ${reviewsResult.data.total_ratings}`);
      log(`Number of reviews returned: ${reviewsResult.data.reviews.length}`);
      
      if (reviewsResult.data.reviews && reviewsResult.data.reviews.length > 0) {
        reviewsResult.data.reviews.forEach((review: Review, index: number) => {
          log(`\nReview ${index + 1}:`);
          log(`  Rating: ${review.rating}`);
          log(`  Author: ${review.author_name}`);
          log(`  Time: ${new Date(review.time * 1000).toLocaleString()}`);
          log(`  Text: ${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}`);
        });
      }

      // Check if review summary is included
      if (reviewsResult.data.review_summary) {
        log('\n✅ Review Summary (V1 API):');
        log('Summary Text: ' + reviewsResult.data.review_summary.text.substring(0, 200) + '...');
      }
    }

    // Test 3: Limited Reviews (3 reviews, no summary)
    log('\nTest 3: Limited Reviews (3 reviews, no summary)');
    const limitedResult = await placesSearcher.getReviews(placeId, 3, false);

    if (!limitedResult.success || !limitedResult.data) {
      log('⚠️ Limited reviews may not be available: ' + (limitedResult.error || 'Unknown error'));
      testResults.limitedReviews = { success: false, error: limitedResult.error };
    } else {
      testResults.limitedReviews = { success: true };
      log('✅ Limited Reviews Test:');
      log(`Number of reviews returned: ${limitedResult.data.reviews.length} (max 3 requested)`);
      log(`Review summary included: ${limitedResult.data.review_summary ? 'Yes' : 'No (as expected)'}`);
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
testReviewOptions().catch(console.error); 