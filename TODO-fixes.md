# Fixing JavaScript Errors

## Current Task: Fix render.js export syntax error and selectedOptionId ReferenceError

**Status: In Progress**

### Steps:
- [x] 1. Create this TODO.md file
- [x] 2. Edit src/ui/render.js to attach functions to window and make selectedOptionId global
- [x] 3. Test by opening docs/index.html and checking console/interactions
- [ ] 4. Verify walkthrough works: option selection, workflow steps, history logging
- [ ] 5. Update TODO.md and attempt completion

**Original Errors:**
- render.js:19 Unexpected token 'export'
- app.js:366 selectedOptionId not defined

**Root Cause:** render.js loaded as classic script but uses ES module exports; selectedOptionId module-scoped.

**Fix:** Attach to window for global access in mixed loading setup.

