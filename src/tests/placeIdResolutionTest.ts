import { GoogleMapsTools } from '../maps-tools/toolclass.js';
import { PlaceReviews } from '../maps-tools/placeReviews.js';
import { PlacesSearcher } from '../maps-tools/searchPlaces.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPlaceIdResolution() {
  console.log('🧪 Testing Place ID Resolution Functionality...\n');
  
  const mapsTools = new GoogleMapsTools();
  const placeReviews = new PlaceReviews(mapsTools);
  const placesSearcher = new PlacesSearcher(mapsTools);

  try {
    // Test 1: Get Place ID from address
    console.log('📍 Test 1: Get Place ID from address');
    const addressResult = await mapsTools.getPlaceIdFromAddress('Eiffel Tower, Paris');
    console.log('Address result:', addressResult);
    
    if (addressResult.success && addressResult.placeId) {
      console.log('✅ Successfully got Place ID from address:', addressResult.placeId);
    } else {
      console.log('❌ Failed to get Place ID from address:', addressResult.error);
    }
    console.log('');

    // Test 2: Get Place ID from coordinates
    console.log('📍 Test 2: Get Place ID from coordinates');
    const coordsResult = await mapsTools.getPlaceIdFromCoordinates(48.8584, 2.2945); // Eiffel Tower coordinates
    console.log('Coordinates result:', coordsResult);
    
    if (coordsResult.success && coordsResult.placeId) {
      console.log('✅ Successfully got Place ID from coordinates:', coordsResult.placeId);
    } else {
      console.log('❌ Failed to get Place ID from coordinates:', coordsResult.error);
    }
    console.log('');

    // Test 3: Get Place IDs from nearby search
    console.log('📍 Test 3: Get Place IDs from nearby search');
    const nearbyResult = await mapsTools.getPlaceIdsNearby(
      { value: 'Times Square, New York', isCoordinates: false },
      'restaurant',
      500
    );
    console.log('Nearby search result:', nearbyResult);
    
    if (nearbyResult.success && nearbyResult.placeIds && nearbyResult.placeIds.length > 0) {
      console.log(`✅ Successfully found ${nearbyResult.placeIds.length} places nearby`);
      nearbyResult.placeIds.slice(0, 3).forEach((place, index) => {
        console.log(`   ${index + 1}. ${place.name} (${place.placeId})`);
      });
    } else {
      console.log('❌ Failed to get Place IDs from nearby search:', nearbyResult.error);
    }
    console.log('');

    // Test 4: Get Place Details V1 with search (using address)
    console.log('📍 Test 4: Get Place Details V1 with address search');
    const v1AddressResult = await mapsTools.getPlaceDetailsV1WithSearch({
      address: 'Statue of Liberty, New York'
    });
    console.log('V1 address search result:', v1AddressResult);
    
    if (v1AddressResult.success && v1AddressResult.data) {
      console.log('✅ Successfully got V1 place details from address');
      console.log('   Display Name:', v1AddressResult.data.displayName?.text);
      console.log('   Resolved Place ID:', v1AddressResult.data.resolvedPlaceId);
      console.log('   Search Method:', v1AddressResult.data.searchMethod);
    } else {
      console.log('❌ Failed to get V1 place details from address:', v1AddressResult.error);
    }
    console.log('');

    // Test 5: Get Place Details V1 with search (using coordinates)
    console.log('📍 Test 5: Get Place Details V1 with coordinates search');
    const v1CoordsResult = await mapsTools.getPlaceDetailsV1WithSearch({
      coordinates: { lat: 40.6892, lng: -74.0445 } // Statue of Liberty coordinates
    });
    console.log('V1 coordinates search result:', v1CoordsResult);
    
    if (v1CoordsResult.success && v1CoordsResult.data) {
      console.log('✅ Successfully got V1 place details from coordinates');
      console.log('   Display Name:', v1CoordsResult.data.displayName?.text);
      console.log('   Resolved Place ID:', v1CoordsResult.data.resolvedPlaceId);
      console.log('   Search Method:', v1CoordsResult.data.searchMethod);
    } else {
      console.log('❌ Failed to get V1 place details from coordinates:', v1CoordsResult.error);
    }
    console.log('');

    // Test 6: Get reviews by address
    console.log('📍 Test 6: Get reviews by address');
    const reviewsByAddress = await placeReviews.getReviewsByAddress('Central Park, New York', 3, true);
    console.log('Reviews by address result:', reviewsByAddress);
    
    if (reviewsByAddress.success && reviewsByAddress.data) {
      console.log('✅ Successfully got reviews by address');
      console.log(`   Rating: ${reviewsByAddress.data.overall_rating}`);
      console.log(`   Total ratings: ${reviewsByAddress.data.total_ratings}`);
      console.log(`   Reviews count: ${reviewsByAddress.data.reviews.length}`);
      if (reviewsByAddress.data.review_summary) {
        console.log('   Has review summary: Yes');
      }
    } else {
      console.log('❌ Failed to get reviews by address:', reviewsByAddress.error);
    }
    console.log('');

    // Test 7: Get reviews by coordinates
    console.log('📍 Test 7: Get reviews by coordinates');
    const reviewsByCoords = await placeReviews.getReviewsByCoordinates(40.7829, -73.9654, 2, true); // Central Park coordinates
    console.log('Reviews by coordinates result:', reviewsByCoords);
    
    if (reviewsByCoords.success && reviewsByCoords.data) {
      console.log('✅ Successfully got reviews by coordinates');
      console.log(`   Rating: ${reviewsByCoords.data.overall_rating}`);
      console.log(`   Total ratings: ${reviewsByCoords.data.total_ratings}`);
      console.log(`   Reviews count: ${reviewsByCoords.data.reviews.length}`);
    } else {
      console.log('❌ Failed to get reviews by coordinates:', reviewsByCoords.error);
    }
    console.log('');

    console.log('🎉 Place ID Resolution tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPlaceIdResolution();