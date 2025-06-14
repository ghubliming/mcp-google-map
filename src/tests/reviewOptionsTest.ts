import { GoogleMapsTools } from "../maps-tools/toolclass.js";
import { PlaceDetailsResponse } from "../maps-tools/searchPlaces.js";
import { createLogger } from "./testUtils.js";

interface Review {
  rating: number;
  text: string;
  time: number;
  author_name: string;
}

const log = createLogger("review-options-test");

async function testReviewOptions() {
  const tools = new GoogleMapsTools();
  const testResults: Record<string, { success: boolean; error?: string }> = {};

  try {
    log('\nTesting Place Details with Review Options...');
    log('Note: Google Places API returns up to 5 reviews by default, sorted by relevance');
    
    // First get a place ID using geocoding
    const geocodeResult = await tools.geocode('Eiffel Tower, Paris');
    const placeId = geocodeResult.place_id;
    if (!placeId) {
      throw new Error('Failed to get place ID');
    }
    log('Got place ID: ' + placeId);

    // Test 1: Default Reviews (no options)
    log('\nTest 1: Default Reviews (no options)');
    const defaultResult = await tools.getPlaceDetails(placeId) as PlaceDetailsResponse;

    if (!defaultResult.success || !defaultResult.data) {
      throw new Error('Failed to get default reviews: ' + (defaultResult.error || 'Unknown error'));
    }

    log('✅ Default Reviews Test:');
    if (defaultResult.data.reviews) {
      log(`Showing default reviews (up to 5, sorted by relevance):`);
      defaultResult.data.reviews.forEach((review: Review, index: number) => {
        log(`\nReview ${index + 1}:`);
        log(`  Rating: ${review.rating}`);
        log(`  Author: ${review.author_name}`);
        log(`  Time: ${new Date(review.time * 1000).toLocaleString()}`);
        log(`  Text: ${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}`);
      });
    }

    // Test 2: Limited Reviews (3 reviews)
    log('\nTest 2: Limited Reviews (3 reviews)');
    const limitedResult = await tools.getPlaceDetails(placeId, {
      maxReviews: 3
    }) as PlaceDetailsResponse;

    if (!limitedResult.success || !limitedResult.data) {
      throw new Error('Failed to get limited reviews: ' + (limitedResult.error || 'Unknown error'));
    }

    log('✅ Limited Reviews Test:');
    if (limitedResult.data.reviews) {
      log(`Showing ${limitedResult.data.reviews.length} reviews (sorted by relevance):`);
      limitedResult.data.reviews.forEach((review: Review, index: number) => {
        log(`\nReview ${index + 1}:`);
        log(`  Rating: ${review.rating}`);
        log(`  Author: ${review.author_name}`);
        log(`  Time: ${new Date(review.time * 1000).toLocaleString()}`);
        log(`  Text: ${review.text.substring(0, 100)}${review.text.length > 100 ? '...' : ''}`);
      });
    }

  } catch (err) {
    log('❌ Test failed: ' + (err instanceof Error ? err.message : String(err)));
    console.error('Full error:', err);
  }
}

// Run the tests
testReviewOptions().catch(console.error); 