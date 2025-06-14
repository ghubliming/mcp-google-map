import { GoogleMapsTools } from './toolclass';

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

export class PlaceReviews {
  private mapsTools: GoogleMapsTools;

  constructor(mapsTools: GoogleMapsTools) {
    this.mapsTools = mapsTools;
  }

  async getPlaceReviews(placeId: string): Promise<PlaceReviewsResponse> {
    try {
      const details = await this.mapsTools.getPlaceDetails(placeId);

      return {
        success: true,
        data: {
          overall_rating: details.rating || 0,
          total_ratings: details.user_ratings_total || 0,
          reviews: details.reviews?.map((review: Review) => ({
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
      const result = await this.mapsTools.getPlaceDetails(placeId, ['reviewSummary', 'googleMapsLinks.reviewsUri']);
      
      if (!result || !result.reviewSummary) {
        return {
          success: false,
          error: "No review summary available"
        };
      }

      return {
        success: true,
        data: {
          text: result.reviewSummary.text.text,
          flag_content_uri: result.reviewSummary.flagContentUri,
          disclosure_text: result.reviewSummary.disclosureText.text,
          reviews_uri: result.googleMapsLinks?.reviewsUri
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error occurred while getting review summary"
      };
    }
  }
} 