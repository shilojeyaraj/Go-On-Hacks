# Training Videos Folder

This folder contains training videos for the gesture recognition model.

## 📁 Folder Structure

```
videos/
├── yes/        Videos of YES gestures (nod up-down)
├── no/         Videos of NO gestures (shake side-to-side)
└── neutral/    Videos of neutral/no gesture
```

## 🎥 Video Requirements

### Format
- **File types**: .mp4, .avi, .mov
- **Duration**: 3-10 seconds per video
- **Resolution**: Any (will be processed automatically)
- **Frame rate**: 24-30 fps recommended

### Content Requirements

#### ✅ Good Video Characteristics
- **Clear face visibility**: Face should be clearly visible throughout
- **Good lighting**: Well-lit, even lighting on face
- **Stable camera**: Minimal camera shake
- **Natural gestures**: Perform gestures naturally, not exaggerated
- **Multiple repetitions**: 2-3 gestures per video
- **Clean background**: Simple, non-distracting background

#### ❌ Avoid
- Dim lighting or backlighting
- Partial face occlusion (hands, hair covering face)
- Extremely fast or slow gestures
- Mixing different gestures in one video
- Very low resolution videos
- Heavily compressed videos

## 🎬 Recording Guidelines

### YES Gesture (videos/yes/)
**Movement**: Nod head up and down

**Instructions**:
1. Look at camera
2. Nod your head up and down naturally
3. Perform 2-3 nods per video
4. Moderate speed (not too fast or slow)
5. Keep face centered and visible

**Example timing**:
- 0-1s: Neutral position
- 1-3s: Perform gesture
- 3-4s: Return to neutral

### NO Gesture (videos/no/)
**Movement**: Shake head side to side

**Instructions**:
1. Look at camera
2. Shake your head side to side naturally
3. Perform 2-3 shakes per video
4. Moderate speed (not too fast or slow)
5. Keep face centered and visible

**Example timing**:
- 0-1s: Neutral position
- 1-3s: Perform gesture
- 3-4s: Return to neutral

### NEUTRAL (videos/neutral/)
**Movement**: No gesture, minimal movement

**Instructions**:
1. Look at camera
2. Stay relatively still
3. Normal blinking and small shifts are OK
4. Natural facial expression
5. No deliberate head movements

**Example timing**:
- 0-5s: Just look at camera naturally

## 📊 Dataset Size Recommendations

### Minimum (for testing)
- **10 videos per category** (30 total)
- Quick setup, decent accuracy
- Good for initial testing

### Recommended (for good results)
- **30 videos per category** (90 total)
- Better accuracy and generalization
- Suitable for production use

### Optimal (for best results)
- **50+ videos per category** (150+ total)
- Excellent accuracy
- Robust to variations

## 🎯 Tips for Best Results

### 1. Variety in Data
Collect videos with:
- Different people (if possible)
- Different lighting conditions
- Different backgrounds
- Different angles (slightly left/right, up/down)
- With and without glasses
- Different hairstyles
- Different ages and ethnicities

### 2. Recording Setup
**Camera position**:
- Eye level or slightly above
- 1-3 feet from face
- Steady (use tripod or stable surface)

**Lighting**:
- Face the light source (window or lamp)
- Avoid harsh shadows
- Even lighting on face

**Environment**:
- Quiet space (no distractions)
- Simple background
- Indoor or outdoor with good lighting

### 3. File Organization
**Naming convention** (optional, but helpful):
```
yes/
├── person1_yes_001.mp4
├── person1_yes_002.mp4
├── person2_yes_001.mp4
└── ...

no/
├── person1_no_001.mp4
├── person1_no_002.mp4
├── person2_no_001.mp4
└── ...

neutral/
├── person1_neutral_001.mp4
├── person1_neutral_002.mp4
├── person2_neutral_001.mp4
└── ...
```

### 4. Quick Recording with Phone

**iPhone/Android**:
1. Open camera app
2. Switch to video mode
3. Prop phone up or use selfie mode
4. Start recording
5. Perform gesture
6. Stop recording
7. Transfer to computer
8. Rename and organize

**Webcam**:
1. Use built-in camera app
2. Record 5-second clips
3. Save to this folder
4. Rename appropriately

## 🔄 Data Collection Workflow

### Solo Collection (30 minutes)
1. Set up camera/phone
2. Record 10 YES videos (5 minutes)
3. Record 10 NO videos (5 minutes)
4. Record 10 NEUTRAL videos (5 minutes)
5. Transfer to computer (5 minutes)
6. Organize into folders (5 minutes)
7. Verify with `1_upload_videos.py` (5 minutes)

### Team Collection (1 hour, multiple people)
1. Gather 3-5 people
2. Each person records:
   - 6 YES videos
   - 6 NO videos
   - 6 NEUTRAL videos
3. Collect all videos
4. Organize by category (ignore person ID if desired)
5. Results in 90-150 videos!

### Progressive Collection
Start small, improve over time:
1. **Day 1**: Collect 10 per category (30 total)
2. **Train model**: See initial results
3. **Day 2**: Add 10 more per category (60 total)
4. **Retrain**: Notice improved accuracy
5. **Day 3**: Add 10 more per category (90 total)
6. **Final training**: Achieve best results

## ✅ Checklist Before Processing

Before running `2_extract_features.py`, verify:

- [ ] Videos are in correct folders (yes/, no/, neutral/)
- [ ] File formats are supported (.mp4, .avi, .mov)
- [ ] Videos contain clear faces
- [ ] Gestures are distinct and clear
- [ ] At least 10 videos per category
- [ ] Dataset is reasonably balanced
- [ ] Video quality is acceptable

## 🆘 Common Issues

### "No face detected" during processing
**Solutions**:
- Ensure face is clearly visible in videos
- Improve lighting in recordings
- Remove videos with poor face visibility
- Check camera focus

### Low model accuracy
**Solutions**:
- Collect more videos (aim for 30+ per category)
- Ensure gestures are distinct and clear
- Balance dataset (equal numbers per category)
- Improve video quality

### Videos won't process
**Solutions**:
- Check file format (.mp4, .avi, .mov)
- Verify files aren't corrupted
- Try converting to .mp4 with VLC or HandBrake
- Check file permissions

## 📞 Need Help?

- Review `ml-models/README.md` for technical details
- Check `QUICKSTART.md` for step-by-step guide
- Ask teammates for video examples
- Test with small dataset first

---

**Ready to start?**

1. Record or collect videos
2. Place them in appropriate folders
3. Run `python 1_upload_videos.py` to verify
4. Proceed to feature extraction!

Good luck! 🎬

