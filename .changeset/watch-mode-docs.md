---
"@ensemble-edge/conductor": patch
---

Add comprehensive development documentation for page watch mode

- Created DEVELOPMENT.md guide explaining watch mode limitations and solutions
- Clarified that watch mode issues only affect local dev, not CI/CD or production builds
- Documented that npm run dev includes automatic page detection via watch-pages.js
- Updated README.md with note to use npm run dev instead of wrangler dev directly
- Explained Wrangler's known limitation with detecting new files in watched directories
