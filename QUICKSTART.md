# 🚀 Quick Start Guide - Feet Swipe App ML Training

Welcome to the Feet Swipe App gesture recognition training system! This guide will get you up and running in 30 minutes.

## 🎯 What You're Building

A machine learning model that detects head gestures to control the app:
- **Nod YES** (up-down) → Swipe LEFT ✅
- **Shake NO** (side-to-side) → Swipe RIGHT ❌

## ⚡ Super Quick Start (TL;DR)

```bash
# 1. Install dependencies
cd ml-models
pip install -r requirements.txt

# 2. Add videos to folders
#    videos/yes/, videos/no/, videos/neutral/

# 3. Run the pipeline
python 1_upload_videos.py
python 2_extract_features.py
python 3_train_model.py
python 4_test_model.py
```

## 📋 Prerequisites

- Python 3.8 or higher
- Webcam
- 20-30 minutes
- Basic command line knowledge

## 🛠️ Step-by-Step Setup

### Step 1: Install Python Dependencies (5 minutes)

Open your terminal and run:

```bash
cd ml-models
pip install -r requirements.txt
```

**What's being installed:**
- OpenCV: Video processing
- MediaPipe: Face detection
- TensorFlow: Deep learning
- Other utilities

**Installation time**: ~5 minutes depending on internet speed

### Step 2: Collect Training Videos (10 minutes)

You need videos of people performing head gestures. Here are your options:

#### Option A: Record Your Own (Recommended)

Use your phone or webcam to record:

**YES Gestures (10 videos):**
- Record yourself nodding "yes" (up and down)
- 5 seconds per video
- 2-3 nods per video
- Good lighting, clear face

**NO Gestures (10 videos):**
- Record yourself shaking "no" (side to side)
- 5 seconds per video
- 2-3 shakes per video
- Good lighting, clear face

**NEUTRAL (10 videos):**
- Record yourself just looking at camera
- 5 seconds per video
- Minimal movement (blinking is OK)

#### Option B: Get Friends to Help

- Ask 2-3 friends to record videos
- Same instructions as above
- More diverse data = better model!

#### Option C: Use Stock Videos

- Download from Pexels or YouTube
- Search for "person nodding", "person shaking head"
- Trim to 5 seconds each

### Step 3: Organize Videos (2 minutes)

Place your videos in these folders:

```
ml-models/videos/
├── yes/        ← Put YES nod videos here
├── no/         ← Put NO shake videos here
└── neutral/    ← Put NEUTRAL videos here
```

**Supported formats**: .mp4, .avi, .mov

**File naming**: Doesn't matter, name them whatever you want

### Step 4: Verify Your Data (1 minute)

```bash
python 1_upload_videos.py
```

This script will:
- Count your videos
- Check if dataset is balanced
- Give you recommendations
- Confirm you're ready for next step

**Expected output:**
```
YES: 10 videos
NO: 10 videos
NEUTRAL: 10 videos
TOTAL: 30 videos
✓ Dataset is reasonably balanced
```

### Step 5: Extract Features (5 minutes)

```bash
python 2_extract_features.py
```

This script will:
- Process each video frame by frame
- Detect faces and extract landmarks
- Create training sequences
- Save processed data

**What to expect:**
- Progress bars for each category
- Takes ~3-10 seconds per video
- Total time: 5-10 minutes for 30 videos

**Success looks like:**
```
Total sequences extracted: 150
✓ Ready for training!
```

### Step 6: Train the Model (10-20 minutes)

```bash
python 3_train_model.py
```

This is where the magic happens! The script will:
- Load your processed data
- Train a neural network
- Validate accuracy
- Save the trained model

**What to expect:**
- Training progress for 50 epochs
- May finish early with early stopping
- You'll see accuracy improving

**Success looks like:**
```
Training accuracy: 95.2%
Validation accuracy: 89.3%
✓ Model saved to: models/gesture_classifier.h5
```

**Go grab a coffee** ☕ - this takes 10-20 minutes

### Step 7: Test Your Model! (Fun Part!)

```bash
python 4_test_model.py
```

This opens your webcam and shows real-time gesture recognition!

**Instructions:**
1. Position your face in camera view
2. Wait for green "Buffer: READY" bar
3. Try nodding YES → Should show "YES" in green
4. Try shaking NO → Should show "NO" in red
5. Stay still → Should show "NEUTRAL" in cyan

**Controls:**
- `Q` - Quit
- `R` - Reset if it gets stuck
- `S` - Show statistics

## ✅ Success Checklist

You're done when:
- ✅ Model achieves 80%+ validation accuracy
- ✅ Real-time detection works on webcam
- ✅ YES gesture detected correctly
- ✅ NO gesture detected correctly
- ✅ NEUTRAL state works
- ✅ Response time feels natural (<1 second)

## 🎓 Tips for Better Results

### Recording Quality Tips

**Lighting:**
- ✅ Face the window or light source
- ✅ Even lighting on face
- ❌ Avoid backlighting
- ❌ No harsh shadows

**Camera Position:**
- ✅ Face clearly visible
- ✅ Eyes and nose in frame
- ❌ Don't tilt head too much
- ❌ Don't cover face with hands/hair

**Gestures:**
- ✅ Natural, moderate speed
- ✅ 2-3 repetitions per video
- ❌ Don't exaggerate movements
- ❌ Don't mix gestures in one video

### Data Collection Tips

**More is Better:**
- 30 videos minimum (10 per class)
- 50+ videos recommended for production
- 100+ videos for best results

**Diversity Helps:**
- Different people
- Different lighting
- Different backgrounds
- With/without glasses

**Balance is Key:**
- Equal numbers in each category
- If you have 20 YES, have 20 NO and 20 NEUTRAL

## 🐛 Troubleshooting

### "No videos found"
**Fix:** Make sure videos are in correct folders (videos/yes/, videos/no/, videos/neutral/)

### "No face detected" during extraction
**Fix:** 
- Check video lighting
- Ensure face is clearly visible
- Try different videos

### Low accuracy (below 70%)
**Fix:**
- Collect more videos (aim for 30+ per class)
- Check gesture quality
- Ensure gestures are distinct
- Balance dataset

### Model test shows wrong predictions
**Fix:**
- Collect more training data
- Improve video quality
- Retrain with more epochs
- Check if gestures are too similar

### Webcam won't open
**Fix:**
- Close other apps using webcam
- Check webcam permissions
- Try different camera: `cv2.VideoCapture(1)`

### Slow training
**Fix:**
- Normal for first time
- Should take 10-20 minutes for 30 videos
- Consider using GPU for larger datasets

## 📊 Understanding the Output

### Training Metrics

**Accuracy**: % of correct predictions
- 90%+ is excellent
- 80-90% is good
- Below 80% needs more data

**Loss**: Error measure (lower is better)
- Should decrease over time
- Stable validation loss is good

**Validation vs Training:**
- Should be close (within 5-10%)
- Large gap means overfitting

### Real-time Testing

**Confidence**: How sure the model is
- 70%+ is reliable
- 50-70% is uncertain
- Below 50% is guessing

**Buffer**: Needs 30 frames (~1 second) to predict

## 🎯 Next Steps

After your model is working:

1. **Integrate into App:**
   - Copy `models/gesture_classifier.h5`
   - Use model in your mobile app
   - Follow integration guide (TBD)

2. **Improve Model:**
   - Collect more diverse data
   - Add more people
   - Try different lighting
   - Retrain with more samples

3. **Deploy:**
   - Convert to TFLite for mobile
   - Optimize for performance
   - Test on different devices

## 📞 Getting Help

**Common Resources:**
- `ml-models/README.md` - Detailed documentation
- Script comments - Each .py file has extensive docs
- Error messages - Read them carefully, they're helpful!

**Team Communication:**
- Ask teammates if stuck
- Share your training results
- Compare model accuracy
- Help each other collect data

## 🎉 You Did It!

If you made it here, you have:
- ✅ Working ML pipeline
- ✅ Trained gesture recognition model
- ✅ Real-time testing working
- ✅ Understanding of the system

**High five!** 🙌 You're now ready to integrate this into the Feet Swipe App!

---

## 📝 Quick Reference

**File Structure:**
```
ml-models/
├── 1_upload_videos.py      # Organize videos
├── 2_extract_features.py   # Process videos
├── 3_train_model.py         # Train model
├── 4_test_model.py          # Test model
├── videos/                  # Your videos here
├── data/                    # Processed data (auto)
└── models/                  # Trained models (auto)
```

**Command Sequence:**
```bash
python 1_upload_videos.py
python 2_extract_features.py
python 3_train_model.py
python 4_test_model.py
```

**Time Estimate:**
- Setup: 5 min
- Data collection: 10 min
- Processing: 5 min
- Training: 15 min
- Testing: 5 min
- **Total: ~40 minutes**

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Team**: Go-On-Hacks

