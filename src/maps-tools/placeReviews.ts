import { GoogleMapsTools } from './toolclass.js';

export interface Review {
  rating: number;
  text: string;
  time: number;
  author_name: string;
}

export interface ReviewSummaryResponse {
  success: boolean;
  error?: string;
  data?: {
    text: string;
    flag_content_uri: string;
    disclosure_text: string;
    reviews_uri?: string;
  };
}

export interface PlaceReviewsResponse {
  success: boolean;
  error?: string;
  data?: {
    overall_rating: number;
    total_ratings: number;
    reviews: Review[];
  };
}

export interface CombinedReviewsResponse {
  success: boolean;
  error?: string;
  data?: {
    overall_rating: number;
    total_ratings: number;
    reviews: Review[];
    review_summary?: {
      text: string;
      flag_content_uri: string;
      disclosure_text: string;
      reviews_uri?: string;
    };
  };
}

export class PlaceReviews {
  private mapsTools: GoogleMapsTools;

  constructor(mapsTools: GoogleMapsTools) {
    this.mapsTools = mapsTools;
  }

  async getPlaceReviews(placeId: string, maxReviews: number = 5): Promise<PlaceReviewsResponse> {
    try {
      const details = await this.mapsTools.getPlaceDetails(placeId, { 
        includeReviews: true, 
        maxReviews: maxReviews 
      });

      if (!details.success || !details.data) {
        return {
          success: false,
          error: details.error || "Failed to get place details"
        };
      }

      return {
        success: true,
        data: {
          overall_rating: details.data.rating || 0,
          total_ratings: details.data.user_ratings_total || 0,
          reviews: details.data.reviews?.map((review: any) => ({
            rating: review.rating,
            text: review.text,
            time: review.time,
            author_name: review.author_name,
          })) || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting place reviews",
      };
    }
  }

  async getReviewSummary(placeId: string): Promise<ReviewSummaryResponse> {
    try {
      const result = await this.getReviewSummaryV1(placeId);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || "No review summary available"
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting review summary"
      };
    }
  }

  private async getReviewSummaryV1(placeId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Making API request for review summary (v1):', placeId);
      
      // For V1 review summary, we only need specific fields
      const fieldMask = 'reviewSummary,googleMapsLinks.reviewsUri';
      
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
      console.log('Review summary result (v1):', data);
      
      // Create a variable for review summary data
      let reviewSummaryData = null;
      if (data.reviewSummary) {
        reviewSummaryData = {
          text: data.reviewSummary.text.text,
          flag_content_uri: data.reviewSummary.flagContentUri,
          disclosure_text: data.reviewSummary.disclosureText.text,
          reviews_uri: data.googleMapsLinks?.reviewsUri
        };
      }
      
      return {
        success: true,
        data: reviewSummaryData
      };
    } catch (error) {
      console.error("Error in getReviewSummaryV1:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting review summary"
      };
    }
  }

  async getCombinedReviews(placeId: string, maxReviews: number = 5): Promise<CombinedReviewsResponse> {
    try {
      // Get both old reviews and review summary
      const [reviewsResult, summaryResult] = await Promise.all([
        this.getPlaceReviews(placeId, maxReviews),
        this.getReviewSummary(placeId)
      ]);

      if (!reviewsResult.success) {
        return {
          success: false,
          error: reviewsResult.error || "Failed to get reviews"
        };
      }

      return {
        success: true,
        data: {
          overall_rating: reviewsResult.data?.overall_rating || 0,
          total_ratings: reviewsResult.data?.total_ratings || 0,
          reviews: reviewsResult.data?.reviews || [],
          review_summary: summaryResult.success ? summaryResult.data : undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting combined reviews"
      };
    }
  }
} 