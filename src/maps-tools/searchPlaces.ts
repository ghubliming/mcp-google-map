import { GoogleMapsTools } from "./toolclass.js";
import { PlaceReviews } from './placeReviews.js';
import { ReviewTrustScorer, TrustScoreResponse } from './reviewTrustScorer.js';

interface SearchNearbyResponse {
  success: boolean;
  error?: string;
  data?: any[];
  location?: any;
}

export interface PlaceDetailsResponse {
  success: boolean;
  error?: string;
  data?: {
    name?: string;
    formattedAddress?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    rating?: number;
    userRatingCount?: number;
    openingHours?: {
      openNow?: boolean;
      periods?: Array<{
        open?: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
      weekdayText?: string[];
    };
    formattedPhoneNumber?: string;
    website?: string;
    priceLevel?: number;
  };
}

export interface GeocodeResponse {
  success: boolean;
  error?: string;
  data?: {
    location: {
      lat: number;
      lng: number;
    };
    formatted_address: string;
    place_id: string;
  };
}

interface ReverseGeocodeResponse {
  success: boolean;
  error?: string;
  data?: {
    formatted_address: string;
    place_id: string;
    address_components: any[];
  };
}

interface DistanceMatrixResponse {
  success: boolean;
  error?: string;
  data?: {
    distances: any[][];
    durations: any[][];
    origin_addresses: string[];
    destination_addresses: string[];
  };
}

interface DirectionsResponse {
  success: boolean;
  error?: string;
  data?: {
    routes: any[];
    summary: string;
    total_distance: { value: number; text: string };
    total_duration: { value: number; text: string };
  };
}

interface ElevationResponse {
  success: boolean;
  error?: string;
  data?: Array<{
    elevation: number;
    location: { lat: number; lng: number };
  }>;
}

export class PlacesSearcher {
  private mapsTools: GoogleMapsTools;
  private placeReviews: PlaceReviews;
  private trustScorer: ReviewTrustScorer;

  constructor(mapsTools: GoogleMapsTools) {
    this.mapsTools = mapsTools;
    this.placeReviews = new PlaceReviews(mapsTools);
    this.trustScorer = new ReviewTrustScorer();
  }

  async searchNearby(params: { center: { value: string; isCoordinates: boolean }; keyword?: string; radius?: number }): Promise<SearchNearbyResponse> {
    try {
      // Ensure center parameter has isCoordinates flag
      const center = typeof params.center === 'string' 
        ? { value: params.center, isCoordinates: false }
        : params.center;

      const location = await this.mapsTools.getLocation(center);
      console.error(location);
      const places = await this.mapsTools.searchNearbyPlaces({
        location,
        keyword: params.keyword,
        radius: params.radius,
      });

      return {
        location: location,
        success: true,
        data: places.map((place) => ({
          name: place.name,
          place_id: place.place_id,
          address: place.formatted_address,
          location: place.geometry.location,
          rating: place.rating,
          total_ratings: place.user_ratings_total,
          open_now: place.opening_hours?.open_now,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred during search",
      };
    }
  }
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    try {
      console.log('Getting place details for ID:', placeId);
      const details = await this.mapsTools.getPlaceDetails(placeId);
      console.log('Place details received:', details);
      
      if (!details.success || !details.data) {
        console.error('No place details returned from API');
        return {
          success: false,
          error: details.error || "No place details found"
        };
      }

      return {
        success: true,
        data: {
          name: details.data.name,
          formattedAddress: details.data.formatted_address,
          location: details.data.geometry?.location ? {
            latitude: details.data.geometry.location.lat,
            longitude: details.data.geometry.location.lng
          } : undefined,
          rating: details.data.rating,
          userRatingCount: details.data.user_ratings_total,
          openingHours: details.data.opening_hours ? {
            openNow: details.data.opening_hours.open_now,
            periods: details.data.opening_hours.periods?.map(period => ({
              open: period.open ? {
                day: period.open.day,
                time: period.open.time || ''
              } : undefined,
              close: period.close ? {
                day: period.close.day,
                time: period.close.time || ''
              } : undefined
            })),
            weekdayText: details.data.opening_hours.weekday_text
          } : undefined,
          formattedPhoneNumber: details.data.formatted_phone_number,
          website: details.data.website,
          priceLevel: details.data.price_level,
        },
      };
    } catch (error) {
      console.error('Error in getPlaceDetails:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting place details",
      };
    }
  }

  async geocode(address: string): Promise<GeocodeResponse> {
    try {
      const result = await this.mapsTools.geocode(address);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while converting address to coordinates",
      };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResponse> {
    try {
      const result = await this.mapsTools.reverseGeocode(latitude, longitude);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while converting coordinates to address",
      };
    }
  }

  async calculateDistanceMatrix(origins: string[], destinations: string[], mode: "driving" | "walking" | "bicycling" | "transit" = "driving"): Promise<DistanceMatrixResponse> {
    try {
      const result = await this.mapsTools.calculateDistanceMatrix(origins, destinations, mode);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while calculating distance matrix",
      };
    }
  }

  async getDirections(origin: string, 
    destination: string,
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
    departure_time?: string,
    arrival_time?: string,
  ): Promise<DirectionsResponse> {
    try {
      const departureTime = departure_time ? new Date(departure_time) : new Date();
      const arrivalTime = arrival_time ? new Date(arrival_time) : undefined;
      const result = await this.mapsTools.getDirections(origin, destination, mode, departureTime, arrivalTime);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting route directions",
      };
    }
  }

  async getElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<ElevationResponse> {
    try {
      const result = await this.mapsTools.getElevation(locations);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting elevation data",
      };
    }
  }

  async getReviews(placeId: string, maxReviews: number = 5, includeReviewSummary: boolean = true): Promise<any> {
    try {
      console.log(`Getting reviews for place ID: ${placeId}, maxReviews: ${maxReviews}, includeReviewSummary: ${includeReviewSummary}`);
      
      if (includeReviewSummary) {
        // Get combined reviews (old reviews + V1 review summary)
        const result = await this.placeReviews.getCombinedReviews(placeId, maxReviews);
        return result;
      } else {
        // Get only the old reviews
        const result = await this.placeReviews.getPlaceReviews(placeId, maxReviews);
        return result;
      }
    } catch (error) {
      console.error('Error in getReviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting reviews",
      };
    }
  }

  // Method to get reviews using address to find Place ID
  async getReviewsByAddress(address: string, maxReviews: number = 5, includeReviewSummary: boolean = true): Promise<any> {
    try {
      console.log(`Getting reviews for address: ${address}`);
      return await this.placeReviews.getReviewsByAddress(address, maxReviews, includeReviewSummary);
    } catch (error) {
      console.error('Error in getReviewsByAddress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting reviews by address",
      };
    }
  }

  // Method to get reviews using coordinates to find Place ID
  async getReviewsByCoordinates(latitude: number, longitude: number, maxReviews: number = 5, includeReviewSummary: boolean = true): Promise<any> {
    try {
      console.log(`Getting reviews for coordinates: ${latitude}, ${longitude}`);
      return await this.placeReviews.getReviewsByCoordinates(latitude, longitude, maxReviews, includeReviewSummary);
    } catch (error) {
      console.error('Error in getReviewsByCoordinates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting reviews by coordinates",
      };
    }
  }

  // Method to get reviews using nearby search to find Place ID
  async getReviewsByNearbySearch(center: { value: string; isCoordinates: boolean }, keyword?: string, radius?: number, maxReviews: number = 5, includeReviewSummary: boolean = true): Promise<any> {
    try {
      console.log(`Getting reviews for nearby search:`, { center, keyword, radius });
      return await this.placeReviews.getReviewsByNearbySearch(center, keyword, radius, maxReviews, includeReviewSummary);
    } catch (error) {
      console.error('Error in getReviewsByNearbySearch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting reviews by nearby search",
      };
    }
  }

  // Method to get Place Details V1 with automatic Place ID resolution
  async getPlaceDetailsV1WithSearch(searchQuery: { address?: string; coordinates?: { lat: number; lng: number }; nearby?: { center: { value: string; isCoordinates: boolean }; keyword?: string; radius?: number } }, fields?: string[]): Promise<any> {
    try {
      console.log(`Getting place details V1 with search:`, searchQuery);
      return await this.mapsTools.getPlaceDetailsV1WithSearch(searchQuery, fields);
    } catch (error) {
      console.error('Error in getPlaceDetailsV1WithSearch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting place details with search",
      };
    }
  }

  // Method to calculate review trust score
  async getReviewTrustScore(placeId: string, maxReviews: number = 5): Promise<TrustScoreResponse> {
    try {
      console.log(`Calculating trust score for place ID: ${placeId}, maxReviews: ${maxReviews}`);
      
      // Get combined reviews data (includes recent reviews, overall stats, and AI summary)
      const reviewData = await this.placeReviews.getCombinedReviews(placeId, maxReviews);
      
      // Calculate trust score using the trust scorer
      const trustScore = this.trustScorer.calculateTrustScore(reviewData);
      
      return trustScore;
    } catch (error) {
      console.error('Error in getReviewTrustScore:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while calculating trust score",
      };
    }
  }
}
