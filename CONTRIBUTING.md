# Contributing to Feet Swipe App

Thank you for contributing to the Feet Swipe App! This document provides guidelines and instructions for contributing to the project.

## 🎯 Getting Started

### Prerequisites
- Python 3.8+ (for ML pipeline)
- Node.js 14+ (for backend - coming soon)
- Git basics
- GitHub account

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-team/feet-swipe-app.git
   cd feet-swipe-app
   ```

2. **Set up ML environment**
   ```bash
   cd ml-models
   pip install -r requirements.txt
   ```

3. **Read the documentation**
   - `README.md` - Project overview
   - `QUICKSTART.md` - Quick start guide
   - `ml-models/README.md` - ML documentation

## 🔀 Git Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features
  - Example: `feature/user-authentication`
- `fix/` - Bug fixes
  - Example: `fix/gesture-detection-accuracy`
- `docs/` - Documentation updates
  - Example: `docs/update-readme`
- `refactor/` - Code refactoring
  - Example: `refactor/cleanup-ml-pipeline`
- `test/` - Adding or updating tests
  - Example: `test/add-unit-tests`

### Workflow Steps

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow coding standards (see below)
   - Test your changes

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "descriptive commit message"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Add description of changes
   - Request review from teammates

6. **Code Review**
   - Address feedback
   - Make requested changes
   - Push updates to same branch

7. **Merge**
   - Once approved, merge to main
   - Delete feature branch

## 📝 Commit Message Guidelines

### Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

**Good:**
```
feat: add gesture detection confidence threshold

- Implemented minimum confidence of 0.7 for predictions
- Prevents false positives in neutral state
- Updated test script UI to show confidence bars
```

**Good:**
```
fix: resolve webcam initialization error on Windows

Fixed issue where webcam wouldn't open on Windows 10 due to
incorrect camera index. Now tries multiple indices.

Closes #42
```

**Bad:**
```
updated stuff
```

**Bad:**
```
fixed bug
```

## 💻 Coding Standards

### Python (ML Pipeline)

Follow PEP 8 style guide:

```python
# Good: Clear function names, docstrings, type hints
def extract_landmarks_from_frame(frame: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract facial landmarks from a single frame.
    
    Args:
        frame: BGR image from OpenCV
        
    Returns:
        Array of landmark coordinates or None if no face detected
    """
    # Implementation here
    pass

# Bad: No documentation, unclear naming
def ext(f):
    # what does this do?
    return stuff
```

**Key points:**
- Use descriptive variable and function names
- Add docstrings to all functions and classes
- Follow PEP 8 formatting (4 spaces, max line length 100)
- Add type hints where applicable
- Comment complex logic

### JavaScript/Node.js (Backend - Future)

Follow Airbnb JavaScript Style Guide:

```javascript
// Good: Clear, documented, async/await
/**
 * Fetches user profile by ID
 * @param {string} userId - The user's ID
 * @returns {Promise<User>} User object
 */
async function getUserProfile(userId) {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    throw error;
  }
}

// Bad: No error handling, unclear
function getUser(id) {
  return User.findById(id);
}
```

## 📚 Documentation Standards

### Code Comments

**When to comment:**
- Complex algorithms
- Non-obvious decisions
- Performance optimizations
- Workarounds for bugs

**When NOT to comment:**
- Self-explanatory code
- Redundant descriptions

```python
# Good: Explains WHY
# Use sliding window to increase training samples 3x
# while maintaining temporal coherence
current_sequence = current_sequence[10:]

# Bad: Explains WHAT (already obvious)
# Increment i by 1
i = i + 1
```

### File Documentation

Every Python file should start with:

```python
"""
Module Name: Brief description

This module provides...

Usage:
    python script_name.py

Features:
    - Feature 1
    - Feature 2

Dependencies:
    - opencv-python
    - mediapipe
"""
```

### README Updates

When adding features:
1. Update relevant README.md
2. Add to project roadmap if major feature
3. Update QUICKSTART.md if affects setup
4. Add examples and usage instructions

## 🧪 Testing

### Before Committing

**ML Pipeline:**
- [ ] Run the complete pipeline (steps 1-4)
- [ ] Verify no errors or warnings
- [ ] Test with sample videos
- [ ] Check model accuracy is reasonable
- [ ] Test webcam detection

**Backend (Future):**
- [ ] Run unit tests: `npm test`
- [ ] Run integration tests
- [ ] Check API endpoints
- [ ] Verify database operations

**Mobile (Future):**
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Check UI responsiveness
- [ ] Verify gesture integration

### Adding Tests

When adding new features, include tests:

```python
# test_gesture_detector.py
import unittest
from gesture_detector import GestureDetector

class TestGestureDetector(unittest.TestCase):
    def setUp(self):
        self.detector = GestureDetector()
    
    def test_detect_yes_gesture(self):
        # Test implementation
        pass
    
    def test_detect_no_gesture(self):
        # Test implementation
        pass
```

## 🐛 Reporting Issues

### Bug Reports

Use this template:

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step 1
2. Step 2
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Windows 10
- Python: 3.9
- Branch: main

**Screenshots**
If applicable

**Additional Context**
Any other relevant information
```

### Feature Requests

Use this template:

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How could this be implemented?

**Alternatives Considered**
Other approaches considered

**Additional Context**
Mockups, examples, etc.
```

## 🏗️ Project Structure

### Adding New Files

Place files in appropriate directories:

```
Go-On-Hacks/
├── ml-models/          # ML-related code only
├── backend/            # Backend API (future)
├── mobile/             # Mobile app (future)
├── docs/               # Additional documentation
└── scripts/            # Utility scripts
```

### File Naming

- Python: `snake_case.py`
- JavaScript: `camelCase.js`
- Components: `PascalCase.jsx`
- Configs: `kebab-case.json`

## 🔍 Code Review Guidelines

### As a Reviewer

**Check for:**
- [ ] Code follows style guidelines
- [ ] Changes are well-documented
- [ ] No unnecessary complexity
- [ ] Tests are included (if applicable)
- [ ] Performance considerations
- [ ] Security implications
- [ ] Backward compatibility

**Provide:**
- Constructive feedback
- Specific suggestions
- Praise for good work
- Clear action items

**Example feedback:**
```
Good: "Consider using list comprehension here for better 
performance: landmarks = [extract(f) for f in frames]"

Bad: "This is wrong"
```

### As a Contributor

**When receiving feedback:**
- Be open to suggestions
- Ask questions if unclear
- Discuss alternatives respectfully
- Make requested changes promptly
- Thank reviewers for their time

## 🚀 Release Process

### Versioning

We use Semantic Versioning (SemVer):
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped
- [ ] Tag created in Git
- [ ] Release notes written

## 🤝 Team Communication

### Daily Standup (if applicable)
- What did you work on yesterday?
- What will you work on today?
- Any blockers?

### Code Reviews
- Respond within 24 hours
- Be respectful and constructive
- Ask questions to understand

### Questions
- Check documentation first
- Search existing issues
- Ask in team chat
- Create issue if needed

## 📊 Performance Guidelines

### ML Pipeline
- Processing time: < 10 sec per video
- Training time: < 30 min for 100 videos
- Inference: < 100ms per prediction
- Model size: < 10 MB

### Backend (Future)
- API response: < 200ms
- Database queries: < 100ms
- File upload: Handle up to 10MB
- Concurrent users: Support 1000+

### Mobile (Future)
- App launch: < 2 seconds
- Gesture detection: < 100ms
- Smooth 60 FPS animations
- Battery efficient

## 🔒 Security Guidelines

### Sensitive Data
- Never commit API keys or passwords
- Use environment variables
- Keep `.env` in `.gitignore`
- Use secrets management for production

### User Data
- Hash passwords (bcrypt)
- Sanitize inputs
- Validate file uploads
- Implement rate limiting

### Dependencies
- Keep dependencies updated
- Review security advisories
- Use `npm audit` / `pip check`

## 📖 Learning Resources

### For New Contributors

**Git & GitHub:**
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

**Python:**
- [PEP 8 Style Guide](https://pep8.org/)
- [Python Best Practices](https://docs.python-guide.org/)

**Machine Learning:**
- [TensorFlow Tutorials](https://www.tensorflow.org/tutorials)
- [OpenCV Tutorials](https://docs.opencv.org/master/d9/df8/tutorial_root.html)

**React Native (Future):**
- [React Native Docs](https://reactnative.dev/docs/getting-started)

## ❓ FAQ

### Q: How do I run just the ML pipeline?
**A:** See `QUICKSTART.md` - takes about 30 minutes

### Q: Can I work on multiple features at once?
**A:** Use separate branches for each feature

### Q: What if my PR isn't getting reviewed?
**A:** Ping teammates in chat after 24 hours

### Q: How do I handle merge conflicts?
**A:** Pull latest main, resolve conflicts locally, test, then push

### Q: Can I refactor existing code?
**A:** Yes! Create a `refactor/` branch and explain changes

## 🎉 Recognition

Great contributors get:
- Mention in release notes
- Name in contributors list
- Appreciation from the team!

## 📞 Getting Help

- **Documentation**: Check all README files
- **Issues**: Search existing GitHub issues
- **Team Chat**: Ask in team communication channel
- **Code Review**: Tag teammates for help

---

Thank you for contributing to Feet Swipe App! Your work helps make this project awesome! 🚀

**Questions about contributing?** Open an issue or ask in team chat!

---

**Last Updated**: November 2025  
**Team**: Go-On-Hacks

