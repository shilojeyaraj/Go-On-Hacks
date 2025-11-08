# Testing Guide - Gesture Recognition Model

This guide explains how to test your trained gesture recognition model with webcams.

## 🎯 Testing Scripts Overview

We have **3 testing modes** for different purposes:

### 1. Quick Demo Test - `4_test_model.py`
**Best for:** Quick testing, demos, casual use

**Features:**
- Real-time gesture recognition
- Visual feedback with confidence scores
- Statistics tracking
- Fun to show off!

**Usage:**
```bash
python 4_test_model.py
```

**Controls:**
- `Q` - Quit
- `R` - Reset buffer
- `S` - Toggle statistics

### 2. Accuracy Test - `5_accuracy_test.py`
**Best for:** Systematic accuracy evaluation, finding problems

**Features:**
- Structured testing protocol
- You label expected vs predicted
- Calculates accuracy metrics
- Saves results to CSV
- Per-gesture accuracy breakdown

**Usage:**
```bash
python 5_accuracy_test.py
```

**Workflow:**
1. Press number (1-3) to select gesture type to test
2. Perform the gesture
3. Press `Y` if prediction was correct
4. Press `N` if prediction was wrong
5. Press `R` to retry
6. Repeat for different gestures
7. Press `Q` when done to see report

### 3. Team Accuracy Test - `6_team_accuracy_test.py`
**Best for:** Testing with multiple people, finding bias

**Features:**
- Tests multiple team members
- Collects demographics (optional)
- Automated testing (5 tests per gesture)
- Team-wide accuracy report
- Saves results per person

**Usage:**
```bash
python 6_team_accuracy_test.py
```

**Workflow:**
1. Enter tester information
2. Follow on-screen prompts
3. Perform each gesture 5 times
4. Automatic accuracy calculation
5. Test next person or view report

## 📊 Test Results Location

All test results are saved to: `test_results/`

**Files created:**
- `accuracy_test_YYYYMMDD_HHMMSS.csv` - Individual test results
- `team_test_YYYYMMDD_HHMMSS.csv` - Team test results

**CSV Format:**
```
tester_name, expected_gesture, predicted_gesture, confidence, correct, timestamp
John, YES, YES, 0.95, True, 2025-11-08T12:00:00
Jane, NO, YES, 0.82, False, 2025-11-08T12:01:00
```

## 🎥 Testing Protocol

### Before Testing

**1. Environment Setup:**
- Good lighting (face the light source)
- Clean background
- Stable camera position
- Quiet space

**2. Camera Position:**
- Eye level or slightly above
- 2-3 feet from face
- Face clearly visible
- Webcam should be steady

**3. Tester Preparation:**
- Remove obstructions (hair, hands from face)
- Look at camera
- Understand the gestures

### Performing Gestures

**YES Gesture (Nod):**
```
1. Start with neutral position (looking at camera)
2. Nod head UP and DOWN naturally
3. Perform 2-3 nods at moderate speed
4. Return to neutral
5. Wait for prediction
```

**NO Gesture (Shake):**
```
1. Start with neutral position
2. Shake head LEFT to RIGHT naturally
3. Perform 2-3 shakes at moderate speed
4. Return to neutral
5. Wait for prediction
```

**NEUTRAL (if in your model):**
```
1. Look at camera
2. Stay relatively still
3. Normal blinking is OK
4. No deliberate head movements
```

### Tips for Accurate Testing

**✅ DO:**
- Perform gestures naturally (like in real conversation)
- Wait for buffer to fill (green bar at 100%)
- Give clear, distinct gestures
- Test in different lighting conditions
- Test with different people
- Record problematic cases

**❌ DON'T:**
- Exaggerate movements
- Mix gestures together
- Move too fast or too slow
- Cover your face
- Test in very dark conditions
- Rush through tests

## 📈 Understanding Results

### Accuracy Metrics

**Overall Accuracy:**
```
Accuracy = (Correct Predictions / Total Predictions) × 100%
```

**Good accuracy ranges:**
- **90%+** - Excellent! Production ready
- **80-90%** - Good, may need minor improvements
- **70-80%** - Okay, needs more training data
- **<70%** - Needs significant improvement

### Per-Gesture Accuracy

Check if model performs better on specific gestures:

**Example:**
```
YES:     85% (17/20 correct)
NO:      90% (18/20 correct)
NEUTRAL: 70% (14/20 correct)  ← Problem area!
```

**Action:** If NEUTRAL is low, collect more NEUTRAL training videos.

### Confusion Matrix

Shows which gestures get confused:

**Example:**
```
Expected YES → Predicted NO: 3 times
Expected NO → Predicted NEUTRAL: 1 time
```

**Action:** If YES is often predicted as NO, gestures may be too similar.

## 🔧 Troubleshooting

### Low Accuracy Issues

**Problem: Overall accuracy <70%**

**Possible causes:**
1. Not enough training data
   - Solution: Collect more videos (30+ per gesture)
   
2. Poor video quality in training
   - Solution: Re-record with better lighting/quality
   
3. Training data not diverse
   - Solution: Get multiple people to record videos
   
4. Gestures too similar
   - Solution: Make gestures more distinct

**Problem: Works for some people, not others**

**Possible causes:**
1. Training data lacks diversity
   - Solution: Add videos from different demographics
   
2. Face angle/lighting different
   - Solution: Add varied training conditions
   
3. Gesture style differences
   - Solution: Include different gesture styles in training

**Problem: Slow/laggy predictions**

**Possible causes:**
1. Computer too slow
   - Solution: Close other programs, use GPU
   
2. High resolution camera
   - Solution: Lower camera resolution
   
3. Old computer
   - Solution: Optimize model or upgrade hardware

### Technical Issues

**"No face detected"**
- Improve lighting
- Move closer to camera
- Ensure face is clearly visible
- Check webcam is working

**"Model not found"**
- Run training first: `python 3_train_model.py`
- Check `models/gesture_classifier.h5` exists
- Verify you're in `ml-models/` directory

**"Import errors"**
- Activate virtual environment
- Reinstall packages: `pip install -r requirements.txt`
- Check Python version (need 3.11 or 3.12)

## 📝 Testing Checklist

### Individual Testing

- [ ] Test each gesture type at least 10 times
- [ ] Test in different lighting conditions
- [ ] Test at different distances from camera
- [ ] Test with/without glasses
- [ ] Test with different backgrounds
- [ ] Document accuracy for each condition
- [ ] Identify problem areas
- [ ] Save results for analysis

### Team Testing

- [ ] Get at least 3-5 team members
- [ ] Each person does 5 tests per gesture
- [ ] Collect optional demographics
- [ ] Test people of different ages
- [ ] Test people with/without glasses
- [ ] Generate team report
- [ ] Identify demographic bias
- [ ] Discuss improvement areas

### Stress Testing

- [ ] Test in very bright light
- [ ] Test in dim light
- [ ] Test with busy background
- [ ] Test while talking
- [ ] Test with slight angle
- [ ] Test with hat/cap on
- [ ] Test rapid gesture switching
- [ ] Document edge cases

## 📊 Sample Testing Session

**Goal:** Evaluate model accuracy

**Setup:** (5 minutes)
1. Close other webcam apps
2. Position camera properly
3. Check lighting
4. Open testing script

**Testing:** (20 minutes)
1. Run `python 5_accuracy_test.py`
2. Test YES gesture: 10 times
3. Test NO gesture: 10 times
4. Test NEUTRAL gesture: 10 times (if available)
5. Record any problems

**Analysis:** (5 minutes)
1. Review accuracy report
2. Check confusion matrix
3. Identify problem gestures
4. Note any patterns

**Documentation:** (5 minutes)
1. Save CSV results
2. Note accuracy percentages
3. List improvement ideas
4. Share with team

**Total time: 35 minutes**

## 🎯 Testing Best Practices

### For Developers

1. **Test Early and Often**
   - Test after each training session
   - Track accuracy improvements
   - Compare different model versions

2. **Systematic Testing**
   - Use structured testing protocols
   - Record all results
   - Don't cherry-pick good results

3. **Document Everything**
   - Save all test results
   - Note testing conditions
   - Record problems and solutions

4. **Iterate Based on Results**
   - If gesture X is confused → collect more data
   - If person Y has low accuracy → add similar training data
   - If lighting matters → train with varied lighting

### For Team

1. **Standardize Testing**
   - Everyone uses same testing script
   - Same number of tests per gesture
   - Same testing environment (when possible)

2. **Share Results**
   - Compile team results
   - Discuss patterns
   - Identify common issues

3. **Collaborative Improvement**
   - Team records more training videos together
   - Different people test different conditions
   - Share insights and solutions

## 📈 Advanced Testing

### A/B Testing Different Models

Compare two model versions:

```bash
# Test model v1
python 5_accuracy_test.py
# Save results

# Train model v2 with more data
python 2_extract_features.py
python 3_train_model.py

# Test model v2
python 5_accuracy_test.py
# Compare results
```

### Cross-Validation

Test with people NOT in training data:
1. Train model with Person A, B, C videos
2. Test with Person D, E, F
3. Measure generalization

### Edge Case Collection

Find and document failures:
1. Run extensive testing
2. When prediction fails, note conditions
3. Add similar cases to training data
4. Retrain and test again

## 🎓 Next Steps

After testing:

1. **If accuracy is good (80%+):**
   - Proceed to mobile app integration
   - Deploy model
   - Continue monitoring in production

2. **If accuracy is medium (70-80%):**
   - Collect more diverse training data
   - Focus on confused gesture pairs
   - Retrain with expanded dataset
   - Test again

3. **If accuracy is low (<70%):**
   - Review training data quality
   - Collect significantly more videos
   - Ensure gestures are distinct
   - Consider adjusting model architecture
   - Get team help for data collection

## 📞 Getting Help

**Common issues:**
- Check `ml-models/README.md` for technical details
- Review `QUICKSTART.md` for setup help
- See `STATUS.md` for current project status
- Ask teammates who have it working

**For bugs:**
1. Note exact error message
2. Check Python version
3. Verify packages installed
4. Review testing conditions
5. Report to team with details

---

**Ready to test? Start with:**
```bash
python 4_test_model.py    # Quick demo
python 5_accuracy_test.py # Systematic testing  
python 6_team_accuracy_test.py # Team evaluation
```

**Good luck! 🚀**


