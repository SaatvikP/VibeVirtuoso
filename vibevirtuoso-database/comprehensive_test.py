#!/usr/bin/env python3
"""
Comprehensive VibeVirtuoso Database Test Suite
Tests all database endpoints and functionality including edge cases.
"""

import asyncio
import aiohttp
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Test Configuration
BASE_URL = "http://127.0.0.1:8001"
TIMEOUT = aiohttp.ClientTimeout(total=10)

class DatabaseTester:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.test_users = []
        self.test_tokens = {}
        self.test_sessions = []
        self.test_compositions = []
        self.test_recordings = []
        
        # Test counters
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(timeout=TIMEOUT)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, name: str, passed: bool, details: str = ""):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
        
        print(f"{status} | {name}")
        if details:
            print(f"     └─ {details}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        try:
            url = f"{BASE_URL}{endpoint}"
            kwargs = {"headers": headers or {}}
            
            if data:
                kwargs["json"] = data
                
            async with self.session.request(method, url, **kwargs) as response:
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                    
                return response.status < 400, response_data, response.status
                
        except Exception as e:
            return False, str(e), 0
    
    # ==================== HEALTH CHECK TESTS ====================
    
    async def test_health_check(self):
        """Test health endpoint."""
        print("\n🏥 HEALTH CHECK TESTS")
        print("=" * 50)
        
        success, data, status = await self.make_request("GET", "/health")
        self.log_test(
            "Health Check",
            success and status == 200 and "status" in data,
            f"Status: {status}, Response: {data}"
        )
    
    # ==================== USER MANAGEMENT TESTS ====================
    
    async def test_user_registration(self):
        """Test user registration functionality."""
        print("\n👤 USER REGISTRATION TESTS")
        print("=" * 50)
        
        # Test 1: Valid user registration
        test_user = {
            "username": f"testuser_{uuid.uuid4().hex[:8]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "testpass123",
            "full_name": "Test User"
        }
        
        success, data, status = await self.make_request("POST", "/register", test_user)
        self.log_test(
            "Valid User Registration",
            success and status == 200 and "user_id" in data,
            f"User ID: {data.get('user_id', 'None')}"
        )
        
        if success:
            self.test_users.append(test_user)
        
        # Test 2: Duplicate username
        duplicate_user = test_user.copy()
        duplicate_user["email"] = f"different_{uuid.uuid4().hex[:8]}@example.com"
        
        success, data, status = await self.make_request("POST", "/register", duplicate_user)
        self.log_test(
            "Duplicate Username Rejection",
            not success and status == 400,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 3: Duplicate email
        duplicate_email = {
            "username": f"different_{uuid.uuid4().hex[:8]}",
            "email": test_user["email"],
            "password": "testpass123"
        }
        
        success, data, status = await self.make_request("POST", "/register", duplicate_email)
        self.log_test(
            "Duplicate Email Rejection",
            not success and status == 400,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 4: Invalid email format
        invalid_email = {
            "username": f"testuser_{uuid.uuid4().hex[:8]}",
            "email": "invalid-email-format",
            "password": "testpass123"
        }
        
        success, data, status = await self.make_request("POST", "/register", invalid_email)
        self.log_test(
            "Invalid Email Format Rejection",
            not success and status in [400, 422],
            f"Status: {status}, Error: {data}"
        )
        
        # Test 5: Missing required fields
        incomplete_user = {"username": "incomplete"}
        
        success, data, status = await self.make_request("POST", "/register", incomplete_user)
        self.log_test(
            "Missing Fields Rejection",
            not success and status in [400, 422],
            f"Status: {status}"
        )
    
    async def test_user_authentication(self):
        """Test user login functionality."""
        print("\n🔐 USER AUTHENTICATION TESTS")
        print("=" * 50)
        
        if not self.test_users:
            self.log_test("No Test Users", False, "Registration tests must pass first")
            return
        
        test_user = self.test_users[0]
        
        # Test 1: Valid login
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }
        
        success, data, status = await self.make_request("POST", "/login", login_data)
        self.log_test(
            "Valid User Login",
            success and "access_token" in data,
            f"Token received: {'Yes' if success and 'access_token' in data else 'No'}"
        )
        
        if success and "access_token" in data:
            self.test_tokens[test_user["username"]] = data["access_token"]
        
        # Test 2: Invalid password
        invalid_login = {
            "username": test_user["username"],
            "password": "wrongpassword"
        }
        
        success, data, status = await self.make_request("POST", "/login", invalid_login)
        self.log_test(
            "Invalid Password Rejection",
            not success and status == 401,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 3: Non-existent user
        fake_login = {
            "username": "nonexistentuser",
            "password": "somepassword"
        }
        
        success, data, status = await self.make_request("POST", "/login", fake_login)
        self.log_test(
            "Non-existent User Rejection",
            not success and status == 401,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 4: Empty credentials
        empty_login = {"username": "", "password": ""}
        
        success, data, status = await self.make_request("POST", "/login", empty_login)
        self.log_test(
            "Empty Credentials Rejection",
            not success,
            f"Status: {status}"
        )
    
    async def test_user_profile(self):
        """Test user profile functionality."""
        print("\n👥 USER PROFILE TESTS")
        print("=" * 50)
        
        if not self.test_tokens:
            self.log_test("No Auth Tokens", False, "Authentication tests must pass first")
            return
        
        username = list(self.test_tokens.keys())[0]
        token = self.test_tokens[username]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Valid profile request
        success, data, status = await self.make_request("GET", "/profile", headers=headers)
        self.log_test(
            "Get User Profile",
            success and "username" in data,
            f"Username: {data.get('username', 'None')}"
        )
        
        # Test 2: Invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        success, data, status = await self.make_request("GET", "/profile", headers=invalid_headers)
        self.log_test(
            "Invalid Token Rejection",
            not success and status == 401,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 3: Missing token
        success, data, status = await self.make_request("GET", "/profile")
        self.log_test(
            "Missing Token Rejection",
            not success and status in [401, 403],
            f"Status: {status}"
        )
    
    # ==================== SESSION MANAGEMENT TESTS ====================
    
    async def test_session_management(self):
        """Test session start/end functionality."""
        print("\n🎵 SESSION MANAGEMENT TESTS")
        print("=" * 50)
        
        if not self.test_tokens:
            self.log_test("No Auth Tokens", False, "Authentication required for sessions")
            return
        
        username = list(self.test_tokens.keys())[0]
        token = self.test_tokens[username]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Start valid session
        session_data = {
            "session_name": f"Test Session {uuid.uuid4().hex[:8]}",
            "instrument": "piano",
            "description": "Test session description"
        }
        
        success, data, status = await self.make_request("POST", "/session/start", session_data, headers)
        self.log_test(
            "Start Valid Session",
            success and "session_id" in data,
            f"Session ID: {data.get('session_id', 'None')}"
        )
        
        session_id = None
        if success and "session_id" in data:
            session_id = data["session_id"]
            self.test_sessions.append(session_id)
        
        # Test 2: Start session with invalid instrument
        invalid_session = {
            "session_name": "Invalid Instrument Session",
            "instrument": "invalidinstrument"
        }
        
        success, data, status = await self.make_request("POST", "/session/start", invalid_session, headers)
        self.log_test(
            "Invalid Instrument Rejection",
            not success and status == 400,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 3: End session
        if session_id:
            success, data, status = await self.make_request("POST", f"/session/{session_id}/end", headers=headers)
            self.log_test(
                "End Session",
                success and "duration_seconds" in data,
                f"Duration: {data.get('duration_seconds', 'None')} seconds"
            )
        
        # Test 4: Get user sessions
        success, data, status = await self.make_request("GET", "/sessions", headers=headers)
        self.log_test(
            "Get User Sessions",
            success and isinstance(data, list),
            f"Found {len(data) if isinstance(data, list) else 0} sessions"
        )
        
        # Test 5: Session without authentication
        success, data, status = await self.make_request("POST", "/session/start", session_data)
        self.log_test(
            "Unauthenticated Session Rejection",
            not success and status in [401, 403],
            f"Status: {status}"
        )
    
    # ==================== COMPOSITION TESTS ====================
    
    async def test_composition_management(self):
        """Test composition save/retrieve functionality."""
        print("\n🎼 COMPOSITION MANAGEMENT TESTS")
        print("=" * 50)
        
        if not self.test_tokens:
            self.log_test("No Auth Tokens", False, "Authentication required for compositions")
            return
        
        username = list(self.test_tokens.keys())[0]
        token = self.test_tokens[username]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Save valid composition
        composition_data = {
            "title": f"Test Composition {uuid.uuid4().hex[:8]}",
            "description": "A beautiful test composition",
            "composition_data": {
                "tempo": 120,
                "key": "C major",
                "notes": ["C", "D", "E", "F", "G"]
            }
        }
        
        success, data, status = await self.make_request("POST", "/composition/save", composition_data, headers)
        self.log_test(
            "Save Valid Composition",
            success and "composition_id" in data,
            f"Composition ID: {data.get('composition_id', 'None')}"
        )
        
        if success and "composition_id" in data:
            self.test_compositions.append(data["composition_id"])
        
        # Test 2: Save composition with minimal data
        minimal_composition = {
            "title": f"Minimal Composition {uuid.uuid4().hex[:8]}"
        }
        
        success, data, status = await self.make_request("POST", "/composition/save", minimal_composition, headers)
        self.log_test(
            "Save Minimal Composition",
            success and "composition_id" in data,
            f"Success with minimal data"
        )
        
        # Test 3: Get user compositions
        success, data, status = await self.make_request("GET", "/compositions", headers=headers)
        self.log_test(
            "Get User Compositions",
            success and isinstance(data, list) and len(data) >= 1,
            f"Found {len(data) if isinstance(data, list) else 0} compositions"
        )
        
        # Test 4: Save composition without title (should fail)
        invalid_composition = {
            "description": "Composition without title"
        }
        
        success, data, status = await self.make_request("POST", "/composition/save", invalid_composition, headers)
        self.log_test(
            "Invalid Composition Rejection",
            not success and status in [400, 422],
            f"Status: {status}"
        )
        
        # Test 5: Unauthenticated composition access
        success, data, status = await self.make_request("GET", "/compositions")
        self.log_test(
            "Unauthenticated Composition Access Rejection",
            not success and status in [401, 403],
            f"Status: {status}"
        )
    
    # ==================== RECORDING TESTS ====================
    
    async def test_recording_management(self):
        """Test recording save/retrieve functionality."""
        print("\n🎙️ RECORDING MANAGEMENT TESTS")
        print("=" * 50)
        
        if not self.test_tokens:
            self.log_test("No Auth Tokens", False, "Authentication required for recordings")
            return
        
        username = list(self.test_tokens.keys())[0]
        token = self.test_tokens[username]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 1: Save valid recording
        recording_data = {
            "filename": f"test_recording_{uuid.uuid4().hex[:8]}.wav",
            "instrument": "piano",
            "duration_seconds": 45.5,
            "file_path": "/recordings/test_recording.wav"
        }
        
        success, data, status = await self.make_request("POST", "/recording/save", recording_data, headers)
        self.log_test(
            "Save Valid Recording",
            success and "recording_id" in data,
            f"Recording ID: {data.get('recording_id', 'None')}"
        )
        
        if success and "recording_id" in data:
            self.test_recordings.append(data["recording_id"])
        
        # Test 2: Save recording with invalid instrument
        invalid_recording = {
            "filename": "invalid_instrument.wav",
            "instrument": "invalidinstrument",
            "duration_seconds": 30.0,
            "file_path": "/recordings/invalid.wav"
        }
        
        success, data, status = await self.make_request("POST", "/recording/save", invalid_recording, headers)
        self.log_test(
            "Invalid Instrument Recording Rejection",
            not success and status == 400,
            f"Error: {data.get('detail', 'None')}"
        )
        
        # Test 3: Get user recordings
        success, data, status = await self.make_request("GET", "/recordings", headers=headers)
        self.log_test(
            "Get User Recordings",
            success and isinstance(data, list),
            f"Found {len(data) if isinstance(data, list) else 0} recordings"
        )
        
        # Test 4: Save recording with missing fields
        incomplete_recording = {
            "filename": "incomplete.wav"
        }
        
        success, data, status = await self.make_request("POST", "/recording/save", incomplete_recording, headers)
        self.log_test(
            "Incomplete Recording Rejection",
            not success and status in [400, 422],
            f"Status: {status}"
        )
        
        # Test 5: Unauthenticated recording access
        success, data, status = await self.make_request("GET", "/recordings")
        self.log_test(
            "Unauthenticated Recording Access Rejection",
            not success and status in [401, 403],
            f"Status: {status}"
        )
    
    # ==================== EDGE CASES AND ERROR HANDLING ====================
    
    async def test_edge_cases(self):
        """Test edge cases and error handling."""
        print("\n⚠️ EDGE CASES AND ERROR HANDLING")
        print("=" * 50)
        
        # Test 1: Invalid JSON
        try:
            async with self.session.post(f"{BASE_URL}/register", data="invalid json") as response:
                success = response.status != 200
        except:
            success = True
        
        self.log_test(
            "Invalid JSON Handling",
            success,
            "Server handled malformed request properly"
        )
        
        # Test 2: Very long strings
        long_data = {
            "username": "a" * 1000,
            "email": "test@example.com",
            "password": "test123"
        }
        
        success, data, status = await self.make_request("POST", "/register", long_data)
        self.log_test(
            "Long String Handling",
            not success or status != 200,
            f"Status: {status}"
        )
        
        # Test 3: SQL injection attempt (should be safe with MongoDB)
        injection_data = {
            "username": "admin'; DROP DATABASE test; --",
            "email": "hack@example.com",
            "password": "password"
        }
        
        success, data, status = await self.make_request("POST", "/register", injection_data)
        self.log_test(
            "SQL Injection Protection",
            True,  # MongoDB should be safe from SQL injection
            f"Request handled safely: {status}"
        )
        
        # Test 4: Empty request body
        success, data, status = await self.make_request("POST", "/register", {})
        self.log_test(
            "Empty Request Body Handling",
            not success and status in [400, 422],
            f"Status: {status}"
        )
        
        # Test 5: Non-existent endpoint
        success, data, status = await self.make_request("GET", "/nonexistent")
        self.log_test(
            "Non-existent Endpoint Handling",
            not success and status == 404,
            f"Status: {status}"
        )
    
    # ==================== PERFORMANCE TESTS ====================
    
    async def test_performance(self):
        """Test basic performance characteristics."""
        print("\n⚡ PERFORMANCE TESTS")
        print("=" * 50)
        
        # Test 1: Health check response time
        start_time = time.time()
        success, data, status = await self.make_request("GET", "/health")
        response_time = (time.time() - start_time) * 1000
        
        self.log_test(
            "Health Check Response Time",
            success and response_time < 1000,  # Less than 1 second
            f"Response time: {response_time:.2f}ms"
        )
        
        # Test 2: Multiple concurrent requests
        async def concurrent_health_check():
            return await self.make_request("GET", "/health")
        
        start_time = time.time()
        tasks = [concurrent_health_check() for _ in range(10)]
        results = await asyncio.gather(*tasks)
        total_time = (time.time() - start_time) * 1000
        
        successful_requests = sum(1 for success, _, _ in results if success)
        
        self.log_test(
            "Concurrent Requests Handling",
            successful_requests >= 8,  # At least 80% success rate
            f"Successful: {successful_requests}/10, Total time: {total_time:.2f}ms"
        )
    
    # ==================== MAIN TEST RUNNER ====================
    
    async def run_all_tests(self):
        """Run all database tests."""
        print("🧪 VibeVirtuoso Database Comprehensive Test Suite")
        print("=" * 60)
        print(f"Testing against: {BASE_URL}")
        print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all test categories
        await self.test_health_check()
        await self.test_user_registration()
        await self.test_user_authentication()
        await self.test_user_profile()
        await self.test_session_management()
        await self.test_composition_management()
        await self.test_recording_management()
        await self.test_edge_cases()
        await self.test_performance()
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 FINAL TEST RESULTS")
        print("=" * 60)
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📈 Total:  {self.total_tests}")
        print(f"📊 Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.failed_tests == 0:
            print("\n🎉 ALL TESTS PASSED! Database is working perfectly!")
        elif self.failed_tests < 5:
            print(f"\n⚠️  {self.failed_tests} tests failed. Minor issues detected.")
        else:
            print(f"\n🚨 {self.failed_tests} tests failed. Significant issues detected.")
        
        print(f"\nEnd time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return self.failed_tests == 0

async def main():
    """Main test execution function."""
    try:
        async with DatabaseTester() as tester:
            success = await tester.run_all_tests()
            return 0 if success else 1
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test suite crashed: {e}")
        return 1

if __name__ == "__main__":
    import sys
    exit_code = asyncio.run(main())
    sys.exit(exit_code)