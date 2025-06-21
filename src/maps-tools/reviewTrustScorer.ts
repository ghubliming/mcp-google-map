import { CombinedReviewsResponse, Review } from './placeReviews.js';

export interface TrustScoreResult {
  trust_score: number;
  trust_level: "HIGH_TRUST" | "MEDIUM_TRUST" | "LOW_TRUST" | "VERY_LOW_TRUST";
  star_reliable: boolean;
  summary_reliable: boolean;
  message_for_llm: string;
  breakdown: {
    volume_score: number;
    consistency_score: number;
    quality_score: number;
    red_flags: string[];
  };
}

export interface TrustScoreResponse {
  success: boolean;
  error?: string;
  data?: TrustScoreResult;
}

export class ReviewTrustScorer {
  
  /**
   * Calculate trust score for place reviews based on the Simple Review Trust Scorer algorithm
   */
  calculateTrustScore(reviewData: CombinedReviewsResponse): TrustScoreResponse {
    try {
      if (!reviewData.success || !reviewData.data) {
        return {
          success: false,
          error: reviewData.error || "No review data available"
        };
      }

      const data = reviewData.data;
      const totalReviews = data.total_ratings;
      const overallRating = data.overall_rating;
      const recentReviews = data.reviews || [];
      const hasSummary = !!data.review_summary;

      // Initialize scoring components
      let volumeScore = 0;
      let consistencyScore = 0;
      let qualityScore = 0;
      const redFlags: string[] = [];

      // 1. Volume Trust (50 points)
      volumeScore = this.calculateVolumeScore(totalReviews);

      // 2. Recent Consistency (35 points)
      consistencyScore = this.calculateConsistencyScore(recentReviews, overallRating);

      // 3. Review Quality (15 points)
      qualityScore = this.calculateQualityScore(recentReviews);

      // Calculate base score
      let trustScore = volumeScore + consistencyScore + qualityScore;

      // 4. Apply Red Flag Penalties
      const redFlagPenalty = this.detectRedFlags(recentReviews, overallRating);
      redFlags.push(...redFlagPenalty.flags);
      trustScore = Math.max(0, trustScore - redFlagPenalty.penalty);

      // Ensure score is within 0-100 range
      trustScore = Math.min(100, Math.max(0, trustScore));

      // Determine trust level and reliability
      const trustLevel = this.getTrustLevel(trustScore);
      const starReliable = trustScore >= 60;
      const summaryReliable = trustScore >= 60 && hasSummary;
      const messageForLlm = this.getTrustMessage(trustLevel);

      return {
        success: true,
        data: {
          trust_score: Math.round(trustScore),
          trust_level: trustLevel,
          star_reliable: starReliable,
          summary_reliable: summaryReliable,
          message_for_llm: messageForLlm,
          breakdown: {
            volume_score: volumeScore,
            consistency_score: consistencyScore,
            quality_score: qualityScore,
            red_flags: redFlags
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error calculating trust score"
      };
    }
  }

  /**
   * Calculate volume score based on total number of reviews
   */
  private calculateVolumeScore(totalReviews: number): number {
    if (totalReviews >= 50) return 50;
    if (totalReviews >= 20) return 35;
    if (totalReviews >= 10) return 25;
    if (totalReviews >= 5) return 15;
    if (totalReviews >= 1) return 5;
    return 0;
  }

  /**
   * Calculate consistency score by comparing recent reviews to overall average
   */
  private calculateConsistencyScore(recentReviews: Review[], overallRating: number): number {
    if (recentReviews.length === 0) return 0;

    // Calculate average of recent reviews
    const recentAverage = recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length;
    
    // Calculate difference from overall rating
    const difference = Math.abs(recentAverage - overallRating);

    if (difference <= 0.3) return 35;
    if (difference <= 0.7) return 20;
    return 5; // 0.8+ difference is a red flag
  }

  /**
   * Calculate quality score based on review content analysis
   */
  private calculateQualityScore(recentReviews: Review[]): number {
    let score = 0;

    // Each review >50 characters = 2 points (max 10)
    const lengthScore = Math.min(10, recentReviews.filter(review => review.text.length > 50).length * 2);
    score += lengthScore;

    // Each review mentions specifics = 1 point (max 5)
    const specificityKeywords = ['food', 'service', 'staff', 'price', 'menu', 'atmosphere', 'location', 'parking', 'clean', 'friendly', 'wait', 'quality', 'fresh', 'delicious', 'expensive', 'cheap', 'recommend'];
    const specificityScore = Math.min(5, recentReviews.filter(review => {
      const text = review.text.toLowerCase();
      return specificityKeywords.some(keyword => text.includes(keyword));
    }).length);
    score += specificityScore;

    return score;
  }

  /**
   * Detect red flags and calculate penalty
   */
  private detectRedFlags(recentReviews: Review[], overallRating: number): { flags: string[], penalty: number } {
    const flags: string[] = [];
    let penalty = 0;

    if (recentReviews.length === 0) return { flags, penalty };

    // Red Flag 1: All recent reviews have identical rating
    const ratings = recentReviews.map(r => r.rating);
    const uniqueRatings = [...new Set(ratings)];
    if (uniqueRatings.length === 1 && recentReviews.length > 1) {
      flags.push("All recent reviews have identical rating");
      penalty += 20;
    }

    // Red Flag 2: Recent average differs by 1.5+ stars from total
    const recentAverage = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    if (Math.abs(recentAverage - overallRating) >= 1.5) {
      flags.push("Recent reviews significantly differ from overall rating");
      penalty += 20;
    }

    // Red Flag 3: All recent reviews <20 characters (too generic)
    if (recentReviews.every(review => review.text.length < 20)) {
      flags.push("All recent reviews are too short and generic");
      penalty += 20;
    }

    return { flags, penalty };
  }

  /**
   * Determine trust level based on score
   */
  private getTrustLevel(score: number): "HIGH_TRUST" | "MEDIUM_TRUST" | "LOW_TRUST" | "VERY_LOW_TRUST" {
    if (score >= 80) return "HIGH_TRUST";
    if (score >= 60) return "MEDIUM_TRUST";
    if (score >= 40) return "LOW_TRUST";
    return "VERY_LOW_TRUST";
  }

  /**
   * Get appropriate message for LLM based on trust level
   */
  private getTrustMessage(trustLevel: "HIGH_TRUST" | "MEDIUM_TRUST" | "LOW_TRUST" | "VERY_LOW_TRUST"): string {
    switch (trustLevel) {
      case "HIGH_TRUST":
        return "Star rating and summary are reliable";
      case "MEDIUM_TRUST":
        return "Star rating is generally trustworthy";
      case "LOW_TRUST":
        return "Limited reliability, use with caution";
      case "VERY_LOW_TRUST":
        return "Insufficient data, don't rely on rating";
    }
  }
}
