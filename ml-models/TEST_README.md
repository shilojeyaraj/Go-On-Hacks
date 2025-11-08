# 🧪 Testing System - Quick Reference

Complete testing system for gesture recognition model accuracy evaluation.

## 🚀 Quick Start

**⚠️ IMPORTANT: You need Python 3.11 or 3.12 (not 3.13)**

See `SETUP_WINDOWS.md` if you haven't set up Python 3.11 yet.

### 1. Activate Virtual Environment

```powershell
cd ml-models
.\venv\Scripts\Activate.ps1
```

### 2. Choose Your Test Mode

```bash
# Quick demo (just see it work)
python quick_test.py

# Basic real-time testing
python 4_test_model.py

# Systematic accuracy testing  
python 5_accuracy_test.py

# Team testing (multiple people)
python 6_team_accuracy_test.py

# Analyze saved results
python analyze_results.py
```

## 📁 Testing Scripts

| Script | Purpose | Best For |
|--------|---------|----------|
| `quick_test.py` | Minimal test | Quick checks, demos |
| `4_test_model.py` | Real-time testing | Casual use, showing off |
| `5_accuracy_test.py` | Accuracy evaluation | Finding problems, metrics |
| `6_team_accuracy_test.py` | Multi-person testing | Team evaluation, bias detection |
| `analyze_results.py` | Results analysis | Data analysis, reports |

## 🎯 Testing Workflow

### For Solo Testing (30 minutes)

```bash
# 1. Quick check if model works
python quick_test.py
# Try a few gestures, press Q when done

# 2. Systematic accuracy test
python 5_accuracy_test.py
# Test each gesture 10 times
# Press Y/N to confirm correct/incorrect
# Get accuracy report

# 3. Analyze results
python analyze_results.py
# View statistics and charts
```

### For Team Testing (1 hour)

```bash
# 1. Gather team (3-5 people)

# 2. Run team test
python 6_team_accuracy_test.py
# Each person enters name
# System guides through 5 tests per gesture
# Automatic accuracy calculation

# 3. Review team report
# See per-person accuracy
# Identify patterns
# Discuss improvements

# 4. Analyze all results
python analyze_results.py
# Compare team members
# View aggregated statistics
```

## 📊 Results Location

All results saved to: **`test_results/`**

Files:
- `accuracy_test_YYYYMMDD_HHMMSS.csv` - Individual tests
- `team_test_YYYYMMDD_HHMMSS.csv` - Team tests
- `analysis_YYYYMMDD_HHMMSS.png` - Analysis charts

## 🎮 Controls Quick Reference

### quick_test.py
- `Q` - Quit

### 4_test_model.py
- `Q` - Quit
- `R` - Reset buffer
- `S` - Toggle statistics

### 5_accuracy_test.py
- `1-3` - Select gesture to test
- `Y` - Prediction was correct
- `N` - Prediction was wrong
- `R` - Retry current test
- `Q` - Quit and show report

### 6_team_accuracy_test.py
- Follow on-screen prompts
- Automatic testing
- `Q` - Emergency quit (saves results)

## 📈 Understanding Your Results

### Accuracy Ratings

| Accuracy | Rating | Action |
|----------|--------|--------|
| 90%+ | ✅ Excellent | Deploy to production |
| 80-90% | 👍 Good | Minor improvements |
| 70-80% | ⚠️ Okay | Need more training data |
| <70% | ❌ Poor | Significant improvements needed |

### Common Issues & Solutions

**Problem: Low accuracy (<70%)**
- ✅ Collect more training videos (30+ per gesture)
- ✅ Ensure good lighting in training videos
- ✅ Get diverse people in training data
- ✅ Make gestures more distinct

**Problem: Works for some people, not others**
- ✅ Add training videos from different demographics
- ✅ Include various face angles and lighting
- ✅ Test with glasses/without glasses

**Problem: Specific gesture always wrong**
- ✅ Collect more videos of that gesture
- ✅ Make gesture more distinct from others
- ✅ Check if training videos are good quality

## 🎥 Testing Best Practices

### Environment Setup
✅ **Good lighting** - Face the light source  
✅ **Clean background** - Minimize distractions  
✅ **Stable camera** - Don't move webcam  
✅ **2-3 feet distance** - Not too close/far  

### Performing Gestures
✅ **Natural movements** - Like real conversation  
✅ **Moderate speed** - Not too fast/slow  
✅ **Clear gestures** - Distinct movements  
✅ **Face visible** - No hands covering face  

### Testing Protocol
✅ **Wait for buffer** - Green bar at 100%  
✅ **One gesture at a time** - Don't mix  
✅ **Test systematically** - All gesture types  
✅ **Document results** - Save everything  

## 🔧 Troubleshooting

### "Model not found"
```bash
# Train the model first
python 3_train_model.py
```

### "No webcam detected"
- Close other webcam apps (Zoom, Teams, etc.)
- Check webcam connection
- Try different camera: Edit script, change `cv2.VideoCapture(0)` to `(1)`

### "Import errors"
```bash
# Make sure venv is activated
.\venv\Scripts\Activate.ps1

# Reinstall packages
pip install -r requirements.txt
```

### "Python 3.13 crashes"
**You need Python 3.11 or 3.12!**
- See `SETUP_WINDOWS.md` for detailed instructions
- MediaPipe and TensorFlow don't support 3.13 yet

## 📚 Additional Resources

- **TESTING_GUIDE.md** - Comprehensive testing documentation
- **ml-models/README.md** - Technical ML details
- **QUICKSTART.md** - Complete setup guide
- **SETUP_WINDOWS.md** - Windows-specific setup

## 🎯 Testing Checklist

Before reporting results:

- [ ] Tested in good lighting conditions
- [ ] Camera positioned correctly
- [ ] Each gesture tested at least 10 times
- [ ] Results saved to CSV
- [ ] Accuracy calculated
- [ ] Problem areas identified
- [ ] Results shared with team

## 💡 Tips for Best Results

1. **Test systematically** - Don't just test what works
2. **Record everything** - All results are valuable
3. **Test edge cases** - Dim lighting, angles, etc.
4. **Get team involved** - More testers = better insights
5. **Iterate** - Test → Improve → Retrain → Test again

## 🚀 Ready to Test?

```bash
# Start with the quick test
python quick_test.py

# Then do systematic testing
python 5_accuracy_test.py

# Analyze your results
python analyze_results.py
```

**Questions?** Check `TESTING_GUIDE.md` for detailed information!

---

**Current Model Status:**
- Classes: YES, NO (no NEUTRAL)
- Training accuracy: ~70%
- Validation accuracy: ~77%
- Training data: 5 YES + 7 NO videos

**Recommendation:** Test to establish baseline, then collect more data for improvement.


