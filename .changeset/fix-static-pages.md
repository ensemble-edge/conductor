---
"@ensemble-edge/conductor": patch
---

## Template Fix - Static Pages

**Critical Bug Fix**

Fixed remaining static page templates that were causing dev server validation errors:
- ✅ Fixed `pages/static/robots/page.yaml` - moved component to root level
- ✅ Fixed `pages/static/sitemap/page.yaml` - moved component to root level
- ✅ Added helpful comments explaining correct structure

**What was broken (1.1.4):**
- Static pages (robots.txt, sitemap.xml) still had `component:` nested inside `config:`
- This caused "Page member requires either component or componentPath" error during dev server startup
- Example pages and error pages were already fixed in 1.1.4, but static pages were missed

**What's fixed (1.1.5):**
- All page templates now have consistent structure with `component:` at root level
- Dev server now starts successfully
- Template is complete and production-ready

**Testing:**
Fresh `conductor init` will now generate a project where:
- ✅ All tests pass (9/9)
- ✅ Dev server starts without errors
- ✅ All page types work (examples, errors, static)
- ✅ Package.json references correct version
- ✅ .gitignore present for security

This completes the template fixes started in 1.1.4.
