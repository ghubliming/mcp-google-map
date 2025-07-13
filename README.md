# MCP Google Maps Server

A comprehensive Model Context Protocol (MCP) server that provides seamless integration with Google Maps APIs. This server enables AI agents to perform location-based queries, geocoding, route planning, and detailed place analysis through a standardized MCP interface.

> **📋 For Advanced LLM Usage**: If you encounter complex Google Maps API errors or need detailed tool usage patterns, refer to the comprehensive LLM guide at `mcp-google-map/Map_MCP_Guide_for_LLM.md` and consider including it in your system prompts for better tool utilization.


## 🚀 Features

### 🗺️ Core Location Services
- **Geocoding & Reverse Geocoding**: Convert between addresses and coordinates
- **Nearby Place Search**: Find places within specified radius with keyword filtering
- **Place Details**: Get comprehensive information including ratings, hours, contact details
- **Distance Matrix**: Calculate distances and travel times between multiple points
- **Directions**: Get detailed step-by-step navigation routes
- **Elevation Data**: Retrieve elevation information for specific coordinates

### 📊 Advanced Review Analysis
- **Review Retrieval**: Access individual reviews and AI-generated summaries
- **Trust Scoring**: Analyze review authenticity and reliability
- **Multiple Search Methods**: Get reviews by Place ID, address, coordinates, or nearby search
- **V1 API Integration**: Enhanced review summaries using Google's latest APIs
- **AI-Generated Summaries**: Comprehensive review analysis with structured data
- **Flexible Field Selection**: Optimize API calls with custom field masks

### �️ Flexible Search Options
- **Address-based Search**: Find places using natural language addresses
- **Coordinate-based Search**: Search using precise latitude/longitude
- **Nearby Search**: Discover places around a center point with radius control
- **Keyword Filtering**: Refine searches with specific terms (restaurant, hotel, etc.)

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- Google Maps API Key with required services enabled
- TypeScript (for development)

### Quick Start
```bash
# Clone and install dependencies
npm install

# Build the project
npm run build

# Set up environment variables
export GOOGLE_MAPS_API_KEY="your_api_key_here"

# Run in development mode
npm run dev
```

## ⚙️ Configuration

### Environment Setup
Create a `.env` file or set environment variables:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "node",
      "args": ["./dist/index.cjs"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key"
      },
      "enabled": true
    }
  }
}
```

For global installation:
```json
{
  "mcpServers": {
    "google-maps": {
      "command": "mcp-google-map",
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key"
      },
      "enabled": true
    }
  }
}
```

## 🔧 Available Tools

| Tool Name | Description | Key Parameters |
|-----------|-------------|----------------|
| `search_nearby` | Find places near a location | `center`, `keyword`, `radius` |
| `get_place_details` | Get detailed place information | `placeId` |
| `get_reviews` | Get reviews and summaries | `placeId`, `maxReviews`, `includeReviewSummary` |
| `maps_geocode` | Convert address to coordinates | `address` |
| `maps_reverse_geocode` | Convert coordinates to address | `latitude`, `longitude` |
| `maps_distance_matrix` | Calculate travel distances/times | `origins`, `destinations`, `mode` |
| `maps_directions` | Get navigation routes | `origin`, `destination`, `mode` |
| `maps_elevation` | Get elevation data | `locations` |
| `review_trust_scorer` | Analyze review reliability | `placeId`, `maxReviews` |
| `get_place_details_v1_with_search` | Enhanced place details with auto-search and V1 API | `searchQuery`, `fields` |

### Extended Review Tools
- `get_reviews_by_address` - Get reviews by searching with address (includes V1 API summaries)
- `get_reviews_by_coordinates` - Get reviews using lat/lng coordinates (includes V1 API summaries)
- `get_reviews_by_nearby_search` - Get reviews via nearby search with keywords (includes V1 API summaries)

## 🏗️ Architecture

### Core Components

#### `GoogleMapsTools` Class
- Central interface to Google Maps APIs
- Handles all API communication and error management
- Supports both traditional and V1 Places API endpoints
- Provides automatic Place ID resolution for flexible search

#### `PlacesSearcher` Class  
- Manages location search and geocoding operations
- Provides unified interface for different search methods
- Handles coordinate conversion and validation

#### `ReviewTrustScorer` Class
- Analyzes review authenticity and reliability
- Calculates trust scores based on multiple factors
- Provides quality assessment for review data
- Works with both legacy reviews and V1 API summaries

### Project Structure
```
src/
├── index.ts                 # Main MCP server entry point
├── maps-tools/
│   ├── mapsTools.ts        # Tool definitions and schemas
│   ├── toolclass.ts        # Core GoogleMapsTools implementation
│   ├── searchPlaces.ts     # Place search functionality
│   ├── placeReviews.ts     # Review management
│   └── reviewTrustScorer.ts # Review analysis
└── tests/                  # Comprehensive test suite
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Individual Test Suites
```bash
# API connectivity test
npx tsx src/tests/googleApiSmokeTest.ts

# MCP tool functionality
npx tsx src/tests/mcpToolsTest.ts

# Server integration test  
npx tsx src/tests/mcpServerTest.ts

# Review system tests
npx tsx src/tests/reviewTrustScorerTest.ts

# Run all tests sequentially
npx tsx src/tests/runAllTests.ts
```

## 🔑 Google Maps API Setup

1. **Google Cloud Console**: Visit [console.cloud.google.com](https://console.cloud.google.com/)
2. **Create/Select Project**: Set up or choose a Google Cloud project
3. **Enable APIs**: Enable these Google Maps Platform APIs:
   - Maps JavaScript API
   - Places API (legacy and new)
   - Geocoding API
   - Distance Matrix API
   - Directions API
   - Elevation API
4. **Create API Key**: Generate an API key with appropriate restrictions
5. **Set Restrictions**: Configure key restrictions for security (HTTP referrers, IP addresses, APIs)

### Required API Permissions
Ensure your API key has access to:
- Places API
- Geocoding API
- Distance Matrix API
- Directions API
- Elevation API

## 📝 Usage Examples

### Basic Place Search
```typescript
// Search for restaurants near a location
{
  "tool": "search_nearby",
  "arguments": {
    "center": {
      "value": "Times Square, New York",
      "isCoordinates": false
    },
    "keyword": "restaurant",
    "radius": 500
  }
}
```

### Get Reviews with Trust Analysis
```typescript
// Get reviews and analyze their trustworthiness
{
  "tool": "review_trust_scorer", 
  "arguments": {
    "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "maxReviews": 5
  }
}
```

### Enhanced V1 API Place Details
```typescript
// Get comprehensive place details with V1 API and review summary
{
  "tool": "get_place_details_v1_with_search",
  "arguments": {
    "searchQuery": {
      "address": "Eiffel Tower, Paris"
    },
    "fields": ["displayName", "reviewSummary", "googleMapsLinks.reviewsUri"]
  }
}
```

### Route Planning
```typescript
// Get directions between two points
{
  "tool": "maps_directions",
  "arguments": {
    "origin": "Central Park, New York",
    "destination": "Brooklyn Bridge, New York", 
    "mode": "walking"
  }
}
```

## 🔧 Development

### Build Commands
```bash
npm run build    # Production build with esbuild
npm run dev      # Development mode with TypeScript watch
npm start        # Run built server
```

### Code Quality
- **TypeScript**: Full type safety with strict mode
- **ESBuild**: Fast compilation and bundling  
- **Jest**: Comprehensive testing framework
- **Modular Design**: Clean separation of concerns

## 🔍 Trust Score System

### How Trust Scoring Works

The system calculates a trust score (0-100) for place reviews using a 4-component algorithm:

#### 1. Volume Trust (50 points max)
- **50+ reviews**: 50 points
- **20+ reviews**: 35 points  
- **10+ reviews**: 25 points
- **5+ reviews**: 15 points
- **1+ reviews**: 5 points

#### 2. Recent Consistency (35 points max)
- **Difference ≤ 0.3** from overall rating: 35 points
- **Difference ≤ 0.7** from overall rating: 20 points
- **Difference > 0.7**: 5 points

#### 3. Review Quality (15 points max)
- **Review length > 50 characters**: 2 points each (max 10)
- **Specificity keywords**: 1 point each (max 5)

#### 4. Red Flag Penalties
- **Identical recent ratings**: -20 points
- **Significant rating difference**: -20 points
- **All reviews too short**: -20 points

### Trust Levels
```typescript
80-100: HIGH_TRUST     // Star rating and summary are reliable
60-79:  MEDIUM_TRUST   // Star rating reliable, summary may be limited
40-59:  LOW_TRUST      // Use with caution, verify independently
0-39:   VERY_LOW_TRUST // Unreliable, seek alternative sources
```

## 🌟 Key Features

- **🔄 Dual API Support**: Uses both legacy and new Google Places API
- **🛡️ Error Resilience**: Comprehensive error handling and fallbacks
- **📊 Smart Review Analysis**: AI-powered review authenticity scoring
- **🗺️ Flexible Search**: Multiple search methods for different use cases
- **⚡ Performance**: Optimized API calls and efficient data processing
- **🧪 Well Tested**: Extensive test coverage for reliability
- **🤖 V1 API Integration**: AI-generated review summaries with structured data
- **🎯 Flexible Field Selection**: Customizable V1 API responses for optimal performance
- **🔍 Automatic Resolution**: Smart Place ID resolution from address, coordinates, or nearby search

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

Follow TypeScript best practices and ensure all tests pass.