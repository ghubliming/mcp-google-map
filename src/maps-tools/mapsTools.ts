export const SEARCH_NEARBY_TOOL = {
  name: "search_nearby",
  description: "Search for nearby places",
  inputSchema: {
    type: "object",
    properties: {
      center: {
        type: "object",
        properties: {
          value: { type: "string", description: "Address, landmark name, or coordinates (format: lat,lng)" },
          isCoordinates: { type: "boolean", description: "Whether the value is coordinates", default: false },
        },
        required: ["value"],
        description: "Search center point",
      },
      keyword: {
        type: "string",
        description: "Search keyword (e.g., restaurant, cafe)",
      },
      radius: {
        type: "number",
        description: "Search radius (in meters)",
        default: 1000,
      },
    },
    required: ["center"],
  },
};

export const GEOCODE_TOOL = {
  name: "maps_geocode",
  description: "Convert address to coordinates",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Address or landmark name to convert",
      },
    },
    required: ["address"],
  },
};

export const REVERSE_GEOCODE_TOOL = {
  name: "maps_reverse_geocode",
  description: "Convert coordinates to address",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude",
      },
      longitude: {
        type: "number",
        description: "Longitude",
      },
    },
    required: ["latitude", "longitude"],
  },
};

export const DISTANCE_MATRIX_TOOL = {
  name: "maps_distance_matrix",
  description: "Calculate distances and times between multiple origins and destinations",
  inputSchema: {
    type: "object",
    properties: {
      origins: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of origin addresses or coordinates",
      },
      destinations: {
        type: "array",
        items: {
          type: "string",
        },
        description: "List of destination addresses or coordinates",
      },
      mode: {
        type: "string",
        enum: ["driving", "walking", "bicycling", "transit"],
        description: "Travel mode",
        default: "driving",
      },
    },
    required: ["origins", "destinations"],
  },
};

export const DIRECTIONS_TOOL = {
  name: "maps_directions",
  description: "Get detailed navigation route between two points",
  inputSchema: {
    type: "object",
    properties: {
      origin: {
        type: "string",
        description: "Origin address or coordinates",
      },
      destination: {
        type: "string",
        description: "Destination address or coordinates",
      },
      mode: {
        type: "string",
        enum: ["driving", "walking", "bicycling", "transit"],
        description: "Travel mode",
        default: "driving",
      },
      departure_time: {
        type: "string",
        description: "Departure time",
        default: new Date().toISOString(),
      },
      arrival_time: {
        type: "string",
        description: "Arrival time",
      },
    },
    required: ["origin", "destination"],
  },
};

export const ELEVATION_TOOL = {
  name: "maps_elevation",
  description: "Get elevation data for locations",
  inputSchema: {
    type: "object",
    properties: {
      locations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude",
            },
            longitude: {
              type: "number",
              description: "Longitude",
            },
          },
          required: ["latitude", "longitude"],
        },
        description: "List of locations to get elevation data for",
      },
    },
    required: ["locations"],
  },
};

export const GET_PLACE_DETAILS_TOOL = {
  name: "get_place_details",
  description: "Get detailed information for a specific place",
  inputSchema: {
    type: "object",
    properties: {
      placeId: {
        type: "string",
        description: "Google Maps place ID",
      },
    },
    required: ["placeId"],
  },
};

export const GET_REVIEWS_TOOL = {
  name: "get_reviews",
  description: "Get reviews and review summary for a specific place (combines old reviews and new V1 review summary)",
  inputSchema: {
    type: "object",
    properties: {
      placeId: {
        type: "string",
        description: "Google Maps place ID",
      },
      maxReviews: {
        type: "number",
        description: "Maximum number of individual reviews to return (default: 5, max: 5)",
        default: 5,
      },
      includeReviewSummary: {
        type: "boolean",
        description: "Whether to include AI-generated review summary from V1 API (default: true)",
        default: true,
      },
    },
    required: ["placeId"],
  },
};

export const GET_REVIEWS_BY_ADDRESS_TOOL = {
  name: "get_reviews_by_address",
  description: "Get reviews for a place by searching with an address",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Address or landmark name to search for",
      },
      maxReviews: {
        type: "number",
        description: "Maximum number of individual reviews to return (default: 5, max: 5)",
        default: 5,
      },
      includeReviewSummary: {
        type: "boolean",
        description: "Whether to include AI-generated review summary from V1 API (default: true)",
        default: true,
      },
    },
    required: ["address"],
  },
};

export const GET_REVIEWS_BY_COORDINATES_TOOL = {
  name: "get_reviews_by_coordinates",
  description: "Get reviews for a place by searching with coordinates",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate",
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate",
      },
      maxReviews: {
        type: "number",
        description: "Maximum number of individual reviews to return (default: 5, max: 5)",
        default: 5,
      },
      includeReviewSummary: {
        type: "boolean",
        description: "Whether to include AI-generated review summary from V1 API (default: true)",
        default: true,
      },
    },
    required: ["latitude", "longitude"],
  },
};

export const GET_REVIEWS_BY_NEARBY_SEARCH_TOOL = {
  name: "get_reviews_by_nearby_search",
  description: "Get reviews for a place by searching nearby a location with optional keyword",
  inputSchema: {
    type: "object",
    properties: {
      center: {
        type: "object",
        properties: {
          value: { type: "string", description: "Address, landmark name, or coordinates (format: lat,lng)" },
          isCoordinates: { type: "boolean", description: "Whether the value is coordinates", default: false },
        },
        required: ["value"],
        description: "Search center point",
      },
      keyword: {
        type: "string",
        description: "Search keyword (e.g., restaurant, cafe)",
      },
      radius: {
        type: "number",
        description: "Search radius (in meters)",
        default: 1000,
      },
      maxReviews: {
        type: "number",
        description: "Maximum number of individual reviews to return (default: 5, max: 5)",
        default: 5,
      },
      includeReviewSummary: {
        type: "boolean",
        description: "Whether to include AI-generated review summary from V1 API (default: true)",
        default: true,
      },
    },
    required: ["center"],
  },
};

export const GET_PLACE_DETAILS_V1_WITH_SEARCH_TOOL = {
  name: "get_place_details_v1_with_search",
  description: "Get place details using V1 API with automatic Place ID resolution from address, coordinates, or nearby search",
  inputSchema: {
    type: "object",
    properties: {
      searchQuery: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Address or landmark name to search for",
          },
          coordinates: {
            type: "object",
            properties: {
              lat: { type: "number", description: "Latitude" },
              lng: { type: "number", description: "Longitude" },
            },
            required: ["lat", "lng"],
            description: "Coordinates to search for",
          },
          nearby: {
            type: "object",
            properties: {
              center: {
                type: "object",
                properties: {
                  value: { type: "string", description: "Address, landmark name, or coordinates (format: lat,lng)" },
                  isCoordinates: { type: "boolean", description: "Whether the value is coordinates", default: false },
                },
                required: ["value"],
                description: "Search center point",
              },
              keyword: {
                type: "string",
                description: "Search keyword (e.g., restaurant, cafe)",
              },
              radius: {
                type: "number",
                description: "Search radius (in meters)",
                default: 1000,
              },
            },
            required: ["center"],
            description: "Nearby search parameters",
          },
        },
        description: "Search criteria - provide one of: address, coordinates, or nearby",
      },
      fields: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Fields to include in the response (e.g., displayName, reviewSummary, googleMapsLinks.reviewsUri)",
      },
    },
    required: ["searchQuery"],
  },
};

export const REVIEW_TRUST_SCORER_TOOL = {
  name: "review_trust_scorer",
  description: "Calculate trust score for place reviews to assess reliability of ratings and summaries",
  inputSchema: {
    type: "object",
    properties: {
      placeId: {
        type: "string",
        description: "Place ID to analyze review trustworthiness",
      },
      maxReviews: {
        type: "number",
        description: "Maximum number of recent reviews to analyze for trust calculation (default: 5, max: 5)",
        default: 5,
      },
    },
    required: ["placeId"],
  },
};
