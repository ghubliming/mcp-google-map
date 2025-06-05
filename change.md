'''
{
  "mcpServers": {
    "google-map": {
      "command": "node",
      "args": ["path/to/your/modified/package/dist/index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key"
      },
      "enabled": true
    }
  }
}
'''


**on Fedora**
'''

{
  "mcpServers": {
    "google-map": {
      "command": "node",
      "args": ["/home/liu/Documents/mcp-google-map/dist/index.cjs"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key"
      },
      "enabled": true
    }
  }
}
'''

---
npx tsx src/tests/googleApiSmokeTest.ts
npx tsx src/tests/mcpToolsTest.ts