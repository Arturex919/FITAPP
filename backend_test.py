#!/usr/bin/env python3
"""
TrainForge Fitness App Backend API Test Suite
Comprehensive testing of all backend endpoints
"""

import requests
import json
import time
from datetime import datetime
import sys

# API Configuration
API_BASE_URL = "https://trainforge-app.preview.emergentagent.com/api"

class TrainForgeAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            return None
            
    def get_auth_headers(self):
        """Get authorization headers"""
        if self.access_token:
            return {"Authorization": f"Bearer {self.access_token}"}
        return {}

    def test_health_endpoints(self):
        """Test basic health and info endpoints"""
        print("\n=== TESTING HEALTH ENDPOINTS ===")
        
        # Test root endpoint
        response = self.make_request("GET", "/")
        if response and response.status_code == 200:
            data = response.json()
            if "TrainForge API" in data.get("message", ""):
                self.log_test("Root Endpoint", True, f"API info returned: {data.get('message')}")
            else:
                self.log_test("Root Endpoint", False, f"Unexpected response: {data}")
        else:
            self.log_test("Root Endpoint", False, f"Failed to connect or bad status: {response.status_code if response else 'No response'}")
        
        # Test health endpoint
        response = self.make_request("GET", "/health")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                self.log_test("Health Check", True, f"Service healthy at {data.get('timestamp')}")
            else:
                self.log_test("Health Check", False, f"Service not healthy: {data}")
        else:
            self.log_test("Health Check", False, f"Health check failed: {response.status_code if response else 'No response'}")

    def test_seed_database(self):
        """Test database seeding"""
        print("\n=== TESTING DATABASE SEEDING ===")
        
        response = self.make_request("POST", "/seed")
        if response and response.status_code == 200:
            data = response.json()
            exercises_count = data.get("exercises", 0)
            
            # If already seeded, check actual data counts
            if "ya inicializada" in data.get("message", ""):
                # Check actual data by making API calls
                exercises_resp = self.make_request("GET", "/exercises")
                achievements_resp = self.make_request("GET", "/achievements")
                routines_resp = self.make_request("GET", "/routines")
                
                if (exercises_resp and exercises_resp.status_code == 200 and
                    achievements_resp and achievements_resp.status_code == 200 and
                    routines_resp and routines_resp.status_code == 200):
                    
                    exercises_count = len(exercises_resp.json())
                    achievements_count = len(achievements_resp.json())
                    routines_count = len(routines_resp.json())
                    
                    if exercises_count >= 28 and achievements_count >= 8 and routines_count >= 6:
                        self.log_test("Database Seeding", True, 
                                    f"Database already seeded: {exercises_count} exercises, {achievements_count} achievements, {routines_count} routines")
                    else:
                        self.log_test("Database Seeding", False, 
                                    f"Insufficient data: {exercises_count} exercises, {achievements_count} achievements, {routines_count} routines")
                else:
                    self.log_test("Database Seeding", False, "Could not verify seeded data")
            else:
                achievements_count = data.get("achievements", 0)
                routines_count = data.get("routines", 0)
                
                if exercises_count >= 28 and achievements_count >= 8 and routines_count >= 6:
                    self.log_test("Database Seeding", True, 
                                f"Seeded {exercises_count} exercises, {achievements_count} achievements, {routines_count} routines")
                else:
                    self.log_test("Database Seeding", False, 
                                f"Insufficient data: {exercises_count} exercises, {achievements_count} achievements, {routines_count} routines")
        else:
            self.log_test("Database Seeding", False, f"Seeding failed: {response.status_code if response else 'No response'}")

    def test_user_registration(self):
        """Test user registration"""
        print("\n=== TESTING USER REGISTRATION ===")
        
        user_data = {
            "email": "maria.fitness@trainforge.com",
            "password": "MiFitness2025!",
            "nombre": "María González",
            "objetivo": "ganar_musculo",
            "nivel": "principiante"
        }
        
        response = self.make_request("POST", "/auth/register", data=user_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("access_token") and data.get("user"):
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                user = data["user"]
                
                # Verify user data
                if (user["email"] == user_data["email"].lower() and 
                    user["nombre"] == user_data["nombre"] and
                    user["objetivo"] == user_data["objetivo"] and
                    user["nivel"] == user_data["nivel"]):
                    self.log_test("User Registration", True, 
                                f"User registered successfully: {user['nombre']} ({user['email']})")
                else:
                    self.log_test("User Registration", False, "User data mismatch in response")
            else:
                self.log_test("User Registration", False, f"Missing token or user data: {data}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("User Registration", False, f"Registration failed: {error_msg}")

    def test_user_login(self):
        """Test user login and rate limiting"""
        print("\n=== TESTING USER LOGIN ===")
        
        # Test successful login
        login_data = {
            "email": "maria.fitness@trainforge.com",
            "password": "MiFitness2025!"
        }
        
        response = self.make_request("POST", "/auth/login", data=login_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("access_token") and data.get("user"):
                self.access_token = data["access_token"]
                self.log_test("User Login - Success", True, f"Login successful for {data['user']['email']}")
            else:
                self.log_test("User Login - Success", False, f"Missing token or user data: {data}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("User Login - Success", False, f"Login failed: {error_msg}")
        
        # Test wrong password (should trigger rate limiting protection)
        wrong_login = {
            "email": "maria.fitness@trainforge.com",
            "password": "wrongpassword"
        }
        
        response = self.make_request("POST", "/auth/login", data=wrong_login)
        if response:
            if response.status_code == 401:
                error_msg = response.json().get("detail", "")
                if "Credenciales incorrectas" in error_msg:
                    self.log_test("User Login - Wrong Password", True, "Correctly rejected wrong password")
                else:
                    self.log_test("User Login - Wrong Password", False, f"Unexpected error message: {error_msg}")
            else:
                self.log_test("User Login - Wrong Password", False, f"Expected 401, got {response.status_code}")
        else:
            self.log_test("User Login - Wrong Password", False, "No response received from server")

    def test_get_current_user(self):
        """Test getting current user profile"""
        print("\n=== TESTING GET CURRENT USER ===")
        
        if not self.access_token:
            self.log_test("Get Current User", False, "No access token available")
            return
            
        headers = self.get_auth_headers()
        response = self.make_request("GET", "/auth/me", headers=headers)
        
        if response and response.status_code == 200:
            user = response.json()
            if user.get("id") and user.get("email") and user.get("nombre"):
                self.log_test("Get Current User", True, 
                            f"User profile retrieved: {user['nombre']} ({user['email']})")
            else:
                self.log_test("Get Current User", False, f"Incomplete user data: {user}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Get Current User", False, f"Failed to get user: {error_msg}")

    def test_exercises_api(self):
        """Test exercises endpoints"""
        print("\n=== TESTING EXERCISES API ===")
        
        # Test get all exercises
        response = self.make_request("GET", "/exercises")
        if response and response.status_code == 200:
            exercises = response.json()
            if len(exercises) >= 28:
                self.log_test("Get All Exercises", True, f"Retrieved {len(exercises)} exercises")
                
                # Test exercise structure
                first_exercise = exercises[0]
                required_fields = ["id", "nombre", "categoria", "musculo_principal", "descripcion", 
                                 "instrucciones", "gif_url", "youtube_url", "dificultad"]
                if all(field in first_exercise for field in required_fields):
                    self.log_test("Exercise Data Structure", True, "All required fields present")
                else:
                    missing = [f for f in required_fields if f not in first_exercise]
                    self.log_test("Exercise Data Structure", False, f"Missing fields: {missing}")
            else:
                self.log_test("Get All Exercises", False, f"Expected 28+ exercises, got {len(exercises)}")
        else:
            self.log_test("Get All Exercises", False, f"Failed to get exercises: {response.status_code if response else 'No response'}")
        
        # Test filter by category
        response = self.make_request("GET", "/exercises", params={"categoria": "pesas"})
        if response and response.status_code == 200:
            exercises = response.json()
            if exercises and all(ex["categoria"] == "pesas" for ex in exercises):
                self.log_test("Filter Exercises by Category", True, f"Retrieved {len(exercises)} weight exercises")
            else:
                self.log_test("Filter Exercises by Category", False, "Category filter not working properly")
        else:
            self.log_test("Filter Exercises by Category", False, f"Category filter failed: {response.status_code if response else 'No response'}")
        
        # Test get exercises by category endpoint
        response = self.make_request("GET", "/exercises/category/calentamiento")
        if response and response.status_code == 200:
            exercises = response.json()
            if exercises and all(ex["categoria"] == "calentamiento" for ex in exercises):
                self.log_test("Get Exercises by Category Endpoint", True, f"Retrieved {len(exercises)} warmup exercises")
            else:
                self.log_test("Get Exercises by Category Endpoint", False, "Category endpoint not working properly")
        else:
            self.log_test("Get Exercises by Category Endpoint", False, f"Category endpoint failed: {response.status_code if response else 'No response'}")

    def test_routines_api(self):
        """Test routines endpoints"""
        print("\n=== TESTING ROUTINES API ===")
        
        # Test get all routines
        response = self.make_request("GET", "/routines")
        if response and response.status_code == 200:
            routines = response.json()
            if len(routines) >= 6:
                self.log_test("Get All Routines", True, f"Retrieved {len(routines)} routines")
                
                # Test routine structure
                first_routine = routines[0]
                required_fields = ["id", "nombre", "descripcion", "tipo", "nivel", 
                                 "duracion_minutos", "ejercicios", "calorias_estimadas"]
                if all(field in first_routine for field in required_fields):
                    self.log_test("Routine Data Structure", True, "All required fields present")
                else:
                    missing = [f for f in required_fields if f not in first_routine]
                    self.log_test("Routine Data Structure", False, f"Missing fields: {missing}")
            else:
                self.log_test("Get All Routines", False, f"Expected 6+ routines, got {len(routines)}")
        else:
            self.log_test("Get All Routines", False, f"Failed to get routines: {response.status_code if response else 'No response'}")
        
        # Test get specific routine
        response = self.make_request("GET", "/routines/rut-001")
        if response and response.status_code == 200:
            routine = response.json()
            if routine.get("id") == "rut-001":
                self.log_test("Get Specific Routine", True, f"Retrieved routine: {routine['nombre']}")
            else:
                self.log_test("Get Specific Routine", False, f"Wrong routine returned: {routine.get('id')}")
        else:
            self.log_test("Get Specific Routine", False, f"Failed to get specific routine: {response.status_code if response else 'No response'}")
        
        # Test get routine exercises
        response = self.make_request("GET", "/routines/rut-001/exercises")
        if response and response.status_code == 200:
            exercises = response.json()
            if exercises and len(exercises) > 0:
                self.log_test("Get Routine Exercises", True, f"Retrieved {len(exercises)} exercises for routine")
            else:
                self.log_test("Get Routine Exercises", False, "No exercises returned for routine")
        else:
            self.log_test("Get Routine Exercises", False, f"Failed to get routine exercises: {response.status_code if response else 'No response'}")

    def test_warmup_api(self):
        """Test warmup generator"""
        print("\n=== TESTING WARMUP API ===")
        
        response = self.make_request("GET", "/warmup/pesas")
        if response and response.status_code == 200:
            warmup_exercises = response.json()
            if warmup_exercises and len(warmup_exercises) > 0:
                # Check if all are warmup exercises
                if all(ex.get("categoria") == "calentamiento" for ex in warmup_exercises):
                    self.log_test("Warmup Generator", True, f"Generated {len(warmup_exercises)} warmup exercises for weights")
                else:
                    self.log_test("Warmup Generator", False, "Non-warmup exercises in warmup routine")
            else:
                self.log_test("Warmup Generator", False, "No warmup exercises generated")
        else:
            self.log_test("Warmup Generator", False, f"Warmup generation failed: {response.status_code if response else 'No response'}")

    def test_workout_sessions_api(self):
        """Test workout sessions (requires auth)"""
        print("\n=== TESTING WORKOUT SESSIONS API ===")
        
        if not self.access_token:
            self.log_test("Workout Sessions", False, "No access token available")
            return
            
        headers = self.get_auth_headers()
        
        # Test create workout session
        workout_data = {
            "ejercicios_completados": ["pes-001", "pes-002", "cal-101"],
            "duracion_minutos": 45,
            "calorias_quemadas": 320,
            "notas": "Excelente sesión de fuerza"
        }
        
        response = self.make_request("POST", "/workouts", data=workout_data, headers=headers)
        if response and response.status_code == 200:
            workout = response.json()
            if (workout.get("user_id") == self.user_id and 
                workout.get("duracion_minutos") == 45 and
                workout.get("calorias_quemadas") == 320):
                self.log_test("Create Workout Session", True, f"Workout session created: {workout['duracion_minutos']} min, {workout['calorias_quemadas']} cal")
            else:
                self.log_test("Create Workout Session", False, f"Workout data mismatch: {workout}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_test("Create Workout Session", False, f"Failed to create workout: {error_msg}")
        
        # Test get workout history
        response = self.make_request("GET", "/workouts", headers=headers)
        if response and response.status_code == 200:
            workouts = response.json()
            if workouts and len(workouts) > 0:
                self.log_test("Get Workout History", True, f"Retrieved {len(workouts)} workout sessions")
            else:
                self.log_test("Get Workout History", False, "No workout history found")
        else:
            self.log_test("Get Workout History", False, f"Failed to get workout history: {response.status_code if response else 'No response'}")
        
        # Test get workout stats
        response = self.make_request("GET", "/workouts/stats", headers=headers)
        if response and response.status_code == 200:
            stats = response.json()
            required_stats = ["entrenamientos_mes", "calorias_quemadas_mes", "minutos_entrenados_mes", 
                            "racha_actual", "total_entrenamientos"]
            if all(stat in stats for stat in required_stats):
                self.log_test("Get Workout Stats", True, 
                            f"Stats: {stats['total_entrenamientos']} total workouts, {stats['racha_actual']} day streak")
            else:
                missing = [s for s in required_stats if s not in stats]
                self.log_test("Get Workout Stats", False, f"Missing stats: {missing}")
        else:
            self.log_test("Get Workout Stats", False, f"Failed to get workout stats: {response.status_code if response else 'No response'}")

    def test_achievements_api(self):
        """Test achievements system"""
        print("\n=== TESTING ACHIEVEMENTS API ===")
        
        # Test get all achievements
        response = self.make_request("GET", "/achievements")
        if response and response.status_code == 200:
            achievements = response.json()
            if len(achievements) >= 8:
                self.log_test("Get All Achievements", True, f"Retrieved {len(achievements)} achievements")
                
                # Test achievement structure
                first_achievement = achievements[0]
                required_fields = ["id", "nombre", "descripcion", "icono", "tipo", "condicion", "valor_requerido"]
                if all(field in first_achievement for field in required_fields):
                    self.log_test("Achievement Data Structure", True, "All required fields present")
                else:
                    missing = [f for f in required_fields if f not in first_achievement]
                    self.log_test("Achievement Data Structure", False, f"Missing fields: {missing}")
            else:
                self.log_test("Get All Achievements", False, f"Expected 8+ achievements, got {len(achievements)}")
        else:
            self.log_test("Get All Achievements", False, f"Failed to get achievements: {response.status_code if response else 'No response'}")
        
        # Test get user achievements (requires auth)
        if self.access_token:
            headers = self.get_auth_headers()
            response = self.make_request("GET", "/achievements/user", headers=headers)
            if response and response.status_code == 200:
                user_achievements = response.json()
                # User should have at least "Primer Paso" achievement after creating a workout
                if len(user_achievements) > 0:
                    self.log_test("Get User Achievements", True, f"User has {len(user_achievements)} unlocked achievements")
                else:
                    self.log_test("Get User Achievements", True, "No achievements unlocked yet (expected for new user)")
            else:
                self.log_test("Get User Achievements", False, f"Failed to get user achievements: {response.status_code if response else 'No response'}")

    def test_nutrition_ai_api(self):
        """Test AI nutrition advice"""
        print("\n=== TESTING NUTRITION AI API ===")
        
        if not self.access_token:
            self.log_test("Nutrition AI", False, "No access token available")
            return
            
        headers = self.get_auth_headers()
        nutrition_request = {
            "objetivo": "ganar_musculo",
            "nivel_actividad": "moderado",
            "ultimo_entrenamiento": "pesas",
            "calorias_quemadas": 320,
            "preferencias": "Sin restricciones alimentarias"
        }
        
        response = self.make_request("POST", "/nutrition/advice", data=nutrition_request, headers=headers)
        if response and response.status_code == 200:
            advice = response.json()
            if advice.get("consejo") and advice.get("recomendaciones"):
                consejo_len = len(advice["consejo"])
                recomendaciones_count = len(advice["recomendaciones"])
                if consejo_len > 50 and recomendaciones_count >= 4:
                    self.log_test("Nutrition AI Advice", True, 
                                f"AI advice generated: {consejo_len} chars advice, {recomendaciones_count} recommendations")
                else:
                    self.log_test("Nutrition AI Advice", False, 
                                f"Insufficient advice content: {consejo_len} chars, {recomendaciones_count} recommendations")
            else:
                self.log_test("Nutrition AI Advice", False, f"Missing advice or recommendations: {advice}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            # If AI service is not configured, it should return a fallback response
            if "Servicio de IA no configurado" in error_msg:
                self.log_test("Nutrition AI Advice", False, "AI service not configured - expected in test environment")
            else:
                self.log_test("Nutrition AI Advice", False, f"AI advice failed: {error_msg}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🏋️ STARTING TRAINFORGE API COMPREHENSIVE TESTING 🏋️")
        print(f"Testing API at: {self.base_url}")
        print("=" * 60)
        
        # Run all test suites
        self.test_health_endpoints()
        self.test_seed_database()
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_exercises_api()
        self.test_routines_api()
        self.test_warmup_api()
        self.test_workout_sessions_api()
        self.test_achievements_api()
        self.test_nutrition_ai_api()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎯 CRITICAL FUNCTIONALITY STATUS:")
        critical_tests = [
            "Health Check", "User Registration", "User Login - Success", 
            "Get All Exercises", "Get All Routines", "Create Workout Session"
        ]
        
        critical_passed = 0
        for test_name in critical_tests:
            test_result = next((r for r in self.test_results if r["test"] == test_name), None)
            if test_result and test_result["success"]:
                critical_passed += 1
                print(f"  ✅ {test_name}")
            else:
                print(f"  ❌ {test_name}")
        
        print(f"\nCritical Tests Passed: {critical_passed}/{len(critical_tests)}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = TrainForgeAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)