# Merge Conflict Resolution Guide

## ⚠️ Important: Resolve Merge Conflicts First

Your `frontend/src/pages/Swipe/Swipe.tsx` file has multiple merge conflicts that need to be resolved before the gesture detection will work properly.

## How to Resolve

1. **Open the file** `frontend/src/pages/Swipe/Swipe.tsx` in your editor
2. **Look for conflict markers:**
   ```
   <<<<<<< HEAD
   (your current code)
   =======
   (incoming code)
   >>>>>>> commit-hash
   ```

3. **For each conflict, choose the version that:**
   - Has better logging (look for `console.log` statements)
   - Includes face detection improvements
   - Has the `processFaceLandmarks` function calls
   - Includes error handling with try/catch

4. **Recommended resolution:**
   - Keep the version with detailed logging (the one with `faceDetectionCount` and `noFaceCount`)
   - Keep the version that logs `[Swipe] 👤 FACE DETECTED!` messages
   - Keep MediaPipe configuration with `minDetectionConfidence: 0.1` and `minTrackingConfidence: 0.1`

## Key Sections to Check

1. **MediaPipe Face Mesh initialization** (around line 173-190)
   - Should have `minDetectionConfidence: 0.1`
   - Should have `minTrackingConfidence: 0.1`
   - Should have `refineLandmarks: true`

2. **Face detection callback** (around line 192-254)
   - Should have detailed logging
   - Should call `processFaceLandmarks(results.multiFaceLandmarks[0].landmark)`
   - Should have error handling

3. **Gesture prediction function** (around line 236-336)
   - Should use `GestureTFJSService` (imported at top)
   - Should have comprehensive logging

## After Resolving Conflicts

1. Save the file
2. Check for linter errors: `npm run lint` in frontend directory
3. Test the application: `npm start` in frontend directory
4. Check browser console for face detection messages

## Quick Fix Command

If you want to accept all incoming changes (the version with better logging):
```bash
git checkout --theirs frontend/src/pages/Swipe/Swipe.tsx
```

If you want to keep your current version:
```bash
git checkout --ours frontend/src/pages/Swipe/Swipe.tsx
```

**Recommended:** Manually resolve to keep the best parts of both versions.

