import { GoogleMapsTools } from '../maps-tools/toolclass.js';
import { PlacesSearcher } from '../maps-tools/searchPlaces.js';
import { createLogger } from './testUtils.js';

const log = createLogger('review-trust-scorer-test');

interface TestResult {
  success: boolean;
  error?: string;
  trustScore?: number;
  trustLevel?: string;
}

async function testReviewTrustScorer() {
  const mapsTools = new GoogleMapsTools();
  const placesSearcher = new PlacesSearcher(mapsTools);
  const testResults: Record<string, TestResult> = {};

  try {
    log('\nTesting Review Trust Scorer...');
    log('This test will analyze review trustworthiness for various places');
    
    // Test 1: High-traffic place (should have high trust score)
    log('\nTest 1: High-traffic place (Central Park)');
    try {
      const geocodeResult = await placesSearcher.geocode('Central Park, New York');
      if (!geocodeResult.success || !geocodeResult.data) {
        throw new Error('Failed to get place ID for Central Park');
      }
      const placeId = geocodeResult.data.place_id;
      log('Got place ID: ' + placeId);

      const trustResult = await placesSearcher.getReviewTrustScore(placeId, 5);
      
      if (!trustResult.success || !trustResult.data) {
        log('⚠️ Trust score calculation failed: ' + (trustResult.error || 'Unknown error'));
        testResults.highTrafficPlace = { success: false, error: trustResult.error };
      } else {
        testResults.highTrafficPlace = { 
          success: true, 
          trustScore: trustResult.data.trust_score,
          trustLevel: trustResult.data.trust_level
        };
        log('✅ High-traffic place trust score calculated successfully');
        log('Trust Score: ' + trustResult.data.trust_score);
        log('Trust Level: ' + trustResult.data.trust_level);
        log('Star Reliable: ' + trustResult.data.star_reliable);
        log('Summary Reliable: ' + trustResult.data.summary_reliable);
        log('Message for LLM: ' + trustResult.data.message_for_llm);
        
        log('\nDetailed Breakdown:');
        log('  Volume Score: ' + trustResult.data.breakdown.volume_score);
        log('  Consistency Score: ' + trustResult.data.breakdown.consistency_score);
        log('  Quality Score: ' + trustResult.data.breakdown.quality_score);
        
        if (trustResult.data.breakdown.red_flags.length > 0) {
          log('  Red Flags: ' + trustResult.data.breakdown.red_flags.join(', '));
        } else {
          log('  Red Flags: None detected');
        }
      }
    } catch (err) {
      testResults.highTrafficPlace = {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
      log('❌ High-traffic place test failed: ' + (err instanceof Error ? err.message : String(err)));
    }

    // Test 2: Restaurant with reviews
    log('\nTest 2: Restaurant with reviews (Times Square area)');
    try {      const searchResult = await placesSearcher.searchNearby({
        center: { value: 'Times Square, New York', isCoordinates: false },
        keyword: 'restaurant',
        radius: 500
      });
      
      if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
        throw new Error('Failed to find restaurants near Times Square');
      }
      
      const restaurant = searchResult.data[0];
      log('Testing restaurant: ' + restaurant.name);
      log('Restaurant Place ID: ' + restaurant.place_id);

      const trustResult = await placesSearcher.getReviewTrustScore(restaurant.place_id, 5);
      
      if (!trustResult.success || !trustResult.data) {
        log('⚠️ Restaurant trust score calculation failed: ' + (trustResult.error || 'Unknown error'));
        testResults.restaurant = { success: false, error: trustResult.error };
      } else {
        testResults.restaurant = { 
          success: true, 
          trustScore: trustResult.data.trust_score,
          trustLevel: trustResult.data.trust_level
        };
        log('✅ Restaurant trust score calculated successfully');
        log('Trust Score: ' + trustResult.data.trust_score);
        log('Trust Level: ' + trustResult.data.trust_level);
        log('Star Reliable: ' + trustResult.data.star_reliable);
        log('Summary Reliable: ' + trustResult.data.summary_reliable);
        log('Message for LLM: ' + trustResult.data.message_for_llm);
        
        log('\nDetailed Breakdown:');
        log('  Volume Score: ' + trustResult.data.breakdown.volume_score);
        log('  Consistency Score: ' + trustResult.data.breakdown.consistency_score);
        log('  Quality Score: ' + trustResult.data.breakdown.quality_score);
        
        if (trustResult.data.breakdown.red_flags.length > 0) {
          log('  Red Flags: ' + trustResult.data.breakdown.red_flags.join(', '));
        } else {
          log('  Red Flags: None detected');
        }
      }
    } catch (err) {
      testResults.restaurant = {
        success: false,
        error: err instanceof Error ? err.message : String(err)
      };
      log('❌ Restaurant test failed: ' + (err instanceof Error ? err.message : String(err)));
    }

    // Test 3: Error handling - Invalid Place ID
    log('\nTest 3: Error Handling - Invalid Place ID');
    try {
      const trustResult = await placesSearcher.getReviewTrustScore('invalid_place_id_12345', 5);
      
      testResults.errorHandling = { 
        success: !trustResult.success,
        error: trustResult.error
      };
      
      if (!trustResult.success) {
        log('✅ Error Handling Test: Expected error received');
        log('Error: ' + (trustResult.error || 'Unknown error'));
      } else {
        log('❌ Error Handling Test: Unexpected success with invalid place ID');
      }
    } catch (err) {
      testResults.errorHandling = {
        success: true,
        error: err instanceof Error ? err.message : String(err)
      };
      log('✅ Error Handling Test: Exception caught as expected');
      log('Error: ' + (err instanceof Error ? err.message : String(err)));
    }

    // Print final test results
    log('\n=== Review Trust Scorer Test Summary ===');
    Object.entries(testResults).forEach(([testName, result]) => {
      log(`${testName}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
      if (result.trustScore !== undefined) {
        log(`  Trust Score: ${result.trustScore}`);
      }
      if (result.trustLevel) {
        log(`  Trust Level: ${result.trustLevel}`);
      }
      if (result.error) {
        log(`  Error: ${result.error}`);
      }
    });

    // Calculate overall success rate
    const totalTests = Object.keys(testResults).length;
    const successfulTests = Object.values(testResults).filter(result => result.success).length;
    log(`\nOverall: ${successfulTests}/${totalTests} tests passed`);

  } catch (err) {
    log('❌ Test suite failed: ' + (err instanceof Error ? err.message : String(err)));    console.error('Full error:', err);
  }

  log('Test completed');
}

// Run the test
testReviewTrustScorer();
