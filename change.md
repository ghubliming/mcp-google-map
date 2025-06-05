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

---

I'll help you build the project correctly. First, let me check the project's build configuration.

Read file: package.json
Let me check the main index file to understand what we need to build.

Read file: src/index.ts
Based on the project structure and files, here's how to correctly build the project:

1. First, make sure you have all dependencies installed:
```bash
npm install
```

2. Then, build the project using the build script defined in package.json:
```bash
npm run build
```

This will:
- Use esbuild to bundle the TypeScript code
- Output the bundled file to `dist/index.cjs`
- Make the output file executable

3. After building, you can run the server using:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

4. To run the tests:
```bash
npm test
```

The build process will:
1. Compile all TypeScript files
2. Bundle them into a single CommonJS module
3. Place the output in the `dist` directory
4. Make the output file executable

The main entry point is `src/index.ts`, which contains the MCP server implementation. The build process will bundle this file along with all its dependencies into `dist/index.cjs`.

Since we've modified the test file (`src/tests/mcpServerTest.ts`), you can run it directly with:
```bash
npx tsx src/tests/mcpServerTest.ts
```

The test file doesn't need to be built because it's using `tsx` to run TypeScript files directly.

Would you like me to help you run any of these commands or explain any part of the build process in more detail?