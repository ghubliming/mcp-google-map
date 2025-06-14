import { Client, Language, TravelMode } from "@googlemaps/google-maps-services-js";
import dotenv from "dotenv";
import axios from "axios";

// Ensure environment variables are loaded
dotenv.config();

interface SearchParams {
  location: { lat: number; lng: number };
  radius?: number;
  keyword?: string;
}

interface PlaceResult {
  name: string;
  place_id: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  place_id?: string;
}

interface Review {
  rating: number;
  text: string;
  time: string;
  author_name: string;
  aspects?: Array<{
    rating: number;
    type: string;
  }>;
  language?: string;
  profile_photo_url?: string;
  relative_time_description?: string;
}

interface ReviewOptions {
  maxReviews?: number;  // Number of reviews to return (default: 5, max: 5)
  includeReviews?: boolean;  // Whether to include reviews in the response (default: false)
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PlaceDetailsResponse {
  displayName?: {
    text: string;
    languageCode: string;
  };
  reviewSummary?: {
    text: {
      text: string;
      languageCode: string;
    };
    flagContentUri: string;
    disclosureText: {
      text: string;
      languageCode: string;
    };
    reviewsUri: string;
  };
  googleMapsLinks?: {
    reviewsUri: string;
  };
}

export class GoogleMapsTools {
  private client: Client;
  private defaultLanguage: Language;

  constructor() {
    this.client = new Client({});
    this.defaultLanguage = Language.en;
  }

  async searchNearbyPlaces(params: SearchParams): Promise<PlaceResult[]> {
    const searchParams = {
      location: params.location,
      radius: params.radius || 1000,
      keyword: params.keyword,
      language: this.defaultLanguage,
      key: process.env.GOOGLE_MAPS_API_KEY || "",
    };

    try {
      const response = await this.client.placesNearby({
        params: searchParams,
      });

      return response.data.results as PlaceResult[];
    } catch (error) {
      console.error("Error in searchNearbyPlaces:", error);
      throw new Error("Error occurred while searching nearby places");
    }
  }
  async getPlaceDetails(placeId: string, reviewOptions?: ReviewOptions) {
    try {
      console.log('Making API request for place details:', placeId);
      
      // Base fields without reviews
      const baseFields = [
        "name",
        "rating",
        "formatted_address",
        "opening_hours",
        "geometry",
        "formatted_phone_number",
        "website",
        "price_level",
        "user_ratings_total"
      ];
      
      // Add reviews field only if explicitly requested
      const fields = reviewOptions?.includeReviews ? [...baseFields, "reviews"] : baseFields;
      
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: fields,
          language: this.defaultLanguage,
          key: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      });

      console.log('API Response status:', response.data.status);
      if (response.data.status !== 'OK') {
        console.error('API Error:', response.data.error_message);
        return {
          success: false,
          error: response.data.error_message || response.data.status
        };
      }

      if (!response.data || !response.data.result) {
        console.error('No result in API response:', response.data);
        return {
          success: false,
          error: "No place details found in response"
        };
      }

      // Process reviews - limit number if specified and reviews are included
      if (response.data.result.reviews && reviewOptions?.includeReviews) {
        let reviews = [...response.data.result.reviews];
        
        // Limit the number of reviews if specified (max 5)
        if (reviewOptions?.maxReviews) {
          reviews = reviews.slice(0, Math.min(reviewOptions.maxReviews, 5));
        }

        response.data.result.reviews = reviews;
      }

      console.log('Place details result:', response.data.result);
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error("Error in getPlaceDetails:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting place details"
      };
    }
  }  async getPlaceDetailsV1(placeId: string, fields?: string[]): Promise<ApiResponse<PlaceDetailsResponse>> {
    try {
      console.log('Making API request for place details (v1):', placeId);
      
      const fieldMask = fields ? fields.join(',') : 'displayName,reviewSummary,googleMapsLinks.reviewsUri';
      
      // For API v1, we need to use the new endpoint and format
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY || "",
          'X-Goog-FieldMask': fieldMask
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', errorData);
        return {
          success: false,
          error: errorData?.error?.message || `HTTP error! status: ${response.status}`
        };
      }

      const data = await response.json();
      console.log('Place details result (v1):', data);
      return {
        success: true,
        data: data as PlaceDetailsResponse
      };    } catch (error) {
      console.error("Error in getPlaceDetailsV1:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting place details"
      };
    }
  }

  private async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await this.client.geocode({
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY || "",
          language: this.defaultLanguage,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error("Location not found for this address");
      }

      const result = response.data.results[0];
      const location = result.geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
      };
    } catch (error) {
      console.error("Error in geocodeAddress:", error);
      throw new Error("Error occurred while converting address to coordinates");
    }
  }

  private parseCoordinates(coordString: string): GeocodeResult {
    const coords = coordString.split(",").map((c) => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      throw new Error("Invalid coordinate format. Please use 'latitude,longitude' format");
    }
    return { lat: coords[0], lng: coords[1] };
  }

  async getLocation(center: { value: string; isCoordinates: boolean }): Promise<GeocodeResult> {
    if (center.isCoordinates) {
      return this.parseCoordinates(center.value);
    }
    return this.geocodeAddress(center.value);
  }

  // Public method for address to coordinates conversion
  async geocode(address: string): Promise<{
    location: { lat: number; lng: number };
    formatted_address: string;
    place_id: string;
  }> {
    try {
      const result = await this.geocodeAddress(address);
      return {
        location: { lat: result.lat, lng: result.lng },
        formatted_address: result.formatted_address || "",
        place_id: result.place_id || "",
      };
    } catch (error) {
      console.error("Error in geocode:", error);
      throw new Error("Error occurred while converting address to coordinates");
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{
    formatted_address: string;
    place_id: string;
    address_components: any[];
  }> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          language: this.defaultLanguage,
          key: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      });

      if (response.data.results.length === 0) {
        throw new Error("Address not found for these coordinates");
      }

      const result = response.data.results[0];
      return {
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        address_components: result.address_components,
      };
    } catch (error) {
      console.error("Error in reverseGeocode:", error);
      throw new Error("Error occurred while converting coordinates to address");
    }
  }

  async calculateDistanceMatrix(
    origins: string[],
    destinations: string[],
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
  ): Promise<{
    distances: any[][];
    durations: any[][];
    origin_addresses: string[];
    destination_addresses: string[];
  }> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: origins,
          destinations: destinations,
          mode: mode as TravelMode,
          language: this.defaultLanguage,
          key: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(`Distance matrix calculation failed: ${result.status}`);
      }

      const distances: any[][] = [];
      const durations: any[][] = [];

      result.rows.forEach((row: any) => {
        const distanceRow: any[] = [];
        const durationRow: any[] = [];

        row.elements.forEach((element: any) => {
          if (element.status === "OK") {
            distanceRow.push({
              value: element.distance.value,
              text: element.distance.text,
            });
            durationRow.push({
              value: element.duration.value,
              text: element.duration.text,
            });
          } else {
            distanceRow.push(null);
            durationRow.push(null);
          }
        });

        distances.push(distanceRow);
        durations.push(durationRow);
      });

      return {
        distances: distances,
        durations: durations,
        origin_addresses: result.origin_addresses,
        destination_addresses: result.destination_addresses,
      };
    } catch (error) {
      console.error("Error in calculateDistanceMatrix:", error);
      throw new Error("Error occurred while calculating distance matrix");
    }
  }

  async getDirections(
    origin: string,
    destination: string,
    mode: "driving" | "walking" | "bicycling" | "transit" = "driving",
    departure_time?: Date,
    arrival_time?: Date
  ): Promise<{
    routes: any[];
    summary: string;
    total_distance: { value: number; text: string };
    total_duration: { value: number; text: string };
    arrival_time: string;
    departure_time: string;
  }> {
    try {
      const apiDepartureTime = departure_time ? Math.floor(departure_time.getTime() / 1000) : undefined;
      const apiArrivalTime = arrival_time ? Math.floor(arrival_time.getTime() / 1000) : undefined;

      const response = await this.client.directions({
        params: {
          origin: origin,
          destination: destination,
          mode: mode as TravelMode,
          departure_time: apiDepartureTime,
          arrival_time: apiArrivalTime,
          language: this.defaultLanguage,
          key: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(`Route directions failed: ${result.status} (arrival_time: ${apiArrivalTime}, departure_time: ${apiDepartureTime})`);
      }

      if (result.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = result.routes[0];
      const legs = route.legs[0];

      // Helper function to format date, checking if time_zone is available
      const formatTime = (timeInfo: any) => {
        if (!timeInfo || typeof timeInfo.value !== "number") return "";
        // API value is in seconds, convert to ms for Date constructor
        const date = new Date(timeInfo.value * 1000);
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false, // Use 24-hour format
        };
        if (timeInfo.time_zone && typeof timeInfo.time_zone === "string") {
          options.timeZone = timeInfo.time_zone;
        }
        return date.toLocaleString(this.defaultLanguage, options);
      };

      return {
        routes: result.routes,
        summary: route.summary,
        total_distance: {
          value: legs.distance.value,
          text: legs.distance.text,
        },
        total_duration: {
          value: legs.duration.value,
          text: legs.duration.text,
        },
        arrival_time: formatTime(legs.arrival_time),
        departure_time: formatTime(legs.departure_time),
      };
    } catch (error) {
      console.error("Error in getDirections:", error);
      throw new Error("Error occurred while getting route directions: " + error);
    }
  }

  async getElevation(locations: Array<{ latitude: number; longitude: number }>): Promise<Array<{ elevation: number; location: { lat: number; lng: number } }>> {
    try {
      const response = await this.client.elevation({
        params: {
          locations: locations.map((loc) => ({ lat: loc.latitude, lng: loc.longitude })),
          key: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      });

      const result = response.data;

      if (result.status !== "OK") {
        throw new Error(`Elevation data retrieval failed: ${result.status}`);
      }

      return result.results.map((item: any) => ({
        elevation: item.elevation,
        location: item.location,
      }));
    } catch (error) {
      console.error("Error in getElevation:", error);
      throw new Error("Error occurred while getting elevation data");
    }
  }
}
