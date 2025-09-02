# VibeVirtuoso Database Testing Guide

## Comprehensive Test Script

The `comprehensive_test.py` script tests all database functionality including:

### 🧪 Test Categories

1. **Health Check Tests**
   - Basic API connectivity
   - Response validation

2. **User Management Tests**
   - User registration (valid and invalid cases)
   - Duplicate username/email detection
   - Invalid email format handling
   - Missing field validation

3. **Authentication Tests**
   - Valid login credentials
   - Invalid password rejection
   - Non-existent user handling
   - Empty credentials validation
   - JWT token generation

4. **User Profile Tests**
   - Authenticated profile access
   - Invalid token rejection
   - Missing token handling

5. **Session Management Tests**
   - Start/end sessions
   - Invalid instrument rejection
   - Session listing
   - Authentication requirements

6. **Composition Management Tests**
   - Save compositions (valid and minimal)
   - Retrieve user compositions
   - Invalid data rejection
   - Authentication requirements

7. **Recording Management Tests**
   - Save recording metadata
   - Invalid instrument handling
   - Retrieve user recordings
   - Incomplete data rejection
   - Authentication requirements

8. **Edge Cases and Error Handling**
   - Invalid JSON handling
   - Long string inputs
   - SQL injection protection
   - Empty request bodies
   - Non-existent endpoints

9. **Performance Tests**
   - Response time validation
   - Concurrent request handling

## 🚀 How to Run Tests

### Prerequisites
Make sure your database server is running:
```bash
cd /Users/pradhyumnsinghthakur/VibeVirtuoso/vibevirtuoso-database
python -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

### Run the Tests
```bash
python comprehensive_test.py
```

## 📊 Expected Results

- **Passed Tests**: All functionality working correctly
- **Failed Tests**: Issues that need attention
- **Success Rate**: Overall health percentage

The script will display:
- ✅ PASS for successful tests
- ❌ FAIL for failed tests
- Detailed error messages for debugging

## 🎯 Test Coverage

This script tests **all major database endpoints**:
- `/health` - Health check
- `/register` - User registration
- `/login` - User authentication
- `/profile` - User profile access
- `/session/start` - Start practice session
- `/session/{id}/end` - End session
- `/sessions` - Get user sessions
- `/composition/save` - Save composition
- `/compositions` - Get user compositions
- `/recording/save` - Save recording metadata
- `/recordings` - Get user recordings

## 🔧 Troubleshooting

If tests fail:
1. Ensure database server is running on port 8001
2. Check MongoDB connection
3. Verify all dependencies are installed
4. Check for any network issues

## 📈 Interpreting Results

- **100% Success**: Database is working perfectly
- **90-99% Success**: Minor issues, mostly acceptable
- **<90% Success**: Significant issues requiring attention

The test script creates temporary test data and cleans up automatically.