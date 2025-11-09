# Gesture Recognition Model Deployment Guide

## Overview
The gesture recognition model can be deployed in two ways:
1. **TensorFlow.js (Recommended for Demo)** - Runs in browser, no backend Python dependency
2. **Python Backend** - Requires Python runtime on server

## Option 1: TensorFlow.js Deployment (Recommended)

### Advantages
- ✅ No Python dependency on server
- ✅ Faster predictions (no subprocess overhead)
- ✅ Works on any deployment platform (Vercel, Netlify, etc.)
- ✅ Better for demo/presentation

### Steps

1. **Convert the model:**
   ```bash
   cd ml-models
   pip install tensorflowjs
   python convert_to_tfjs.py
   ```

2. **Copy model files to frontend:**
   ```bash
   # Copy the tfjs_model folder to frontend/public/models/
   cp -r ml-models/models/tfjs_model frontend/public/models/
   ```

3. **Install TensorFlow.js in frontend:**
   ```bash
   cd frontend
   npm install @tensorflow/tfjs
   ```

4. **The model will automatically load** when users enable gesture recognition.

### File Structure After Conversion
```
frontend/
  public/
    models/
      tfjs_model/
        model.json
        weights.bin (or weights1.bin, weights2.bin, etc.)
```

## Option 2: Python Backend Deployment

### Requirements
- Python 3.8+ installed on server
- TensorFlow 2.x
- NumPy
- Model file: `ml-models/models/gesture_classifier.h5`

### Steps

1. **Ensure Python dependencies are installed:**
   ```bash
   pip install tensorflow numpy
   ```

2. **Ensure model file is accessible:**
   - The backend looks for: `ml-models/models/gesture_classifier.h5`
   - Make sure this path is correct relative to `backend/dist/modules/gestures/`

3. **For production deployment:**
   - Include `ml-models/` folder in your deployment
   - Or set up a Python microservice for predictions
   - Consider using Docker to ensure consistent Python environment

### Docker Example
```dockerfile
FROM node:18

# Install Python and dependencies
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install tensorflow numpy

# Copy backend and model files
COPY backend/ /app/backend/
COPY ml-models/ /app/ml-models/

WORKDIR /app/backend
RUN npm install
RUN npm run build

CMD ["npm", "run", "start:prod"]
```

## Testing the Deployment

### Test TensorFlow.js Model
1. Open browser console
2. Enable gesture recognition
3. Look for: `[TFJS] ✅ Model loaded successfully`
4. Perform gestures and check predictions

### Test Python Backend
1. Check backend logs for: `[BACKEND] ✅ Python script found`
2. Perform gestures
3. Check logs for: `[BACKEND] ✅ Parsed result:`

## Troubleshooting

### TensorFlow.js Model Not Loading
- Check browser console for errors
- Verify model files are in `frontend/public/models/tfjs_model/`
- Check network tab for 404 errors on model.json
- Ensure CORS is configured if hosting model on different domain

### Python Backend Not Working
- Verify Python is installed: `python --version`
- Check Python path in spawn command (may need `python3` instead of `python`)
- Verify model file exists at expected path
- Check backend logs for Python errors
- Ensure all Python dependencies are installed

## Production Recommendations

1. **Use TensorFlow.js** for simplicity and better performance
2. **Host model files** on CDN for faster loading
3. **Add error handling** for model loading failures
4. **Monitor prediction performance** and accuracy
5. **Consider model quantization** to reduce file size if needed

## Model File Size
- H5 model: ~500KB-2MB
- TensorFlow.js model: ~500KB-2MB (similar size)
- Model loads once and stays in memory

