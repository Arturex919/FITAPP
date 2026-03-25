from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Create the main app
app = FastAPI(title="TrainForge API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security
security = HTTPBearer()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    nombre: str
    objetivo: str = "general"  # perder_peso, ganar_musculo, resistencia, general
    nivel: str = "principiante"  # principiante, intermedio, avanzado

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    nombre: str
    objetivo: str
    nivel: str
    fecha_registro: datetime
    racha_dias: int = 0
    total_entrenamientos: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Exercise(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    categoria: str  # calentamiento, pesas, calistenia, cardio, pliometria, estiramiento
    musculo_principal: str
    descripcion: str
    instrucciones: List[str]
    gif_url: str
    youtube_url: str
    dificultad: str  # facil, medio, dificil
    duracion_segundos: int = 30
    repeticiones: Optional[int] = None
    series: Optional[int] = None

class Routine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str
    tipo: str  # fuerza, cardio, flexibilidad, mixto
    nivel: str
    duracion_minutos: int
    ejercicios: List[str]  # IDs de ejercicios
    calorias_estimadas: int

class WorkoutSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    fecha: datetime = Field(default_factory=datetime.utcnow)
    rutina_id: Optional[str] = None
    ejercicios_completados: List[str]
    duracion_minutos: int
    calorias_quemadas: int
    notas: str = ""

class WorkoutSessionCreate(BaseModel):
    rutina_id: Optional[str] = None
    ejercicios_completados: List[str]
    duracion_minutos: int
    calorias_quemadas: int
    notas: str = ""

class Achievement(BaseModel):
    id: str
    nombre: str
    descripcion: str
    icono: str
    tipo: str  # diario, semanal, mensual, especial
    condicion: str
    valor_requerido: int

class UserAchievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    achievement_id: str
    fecha_desbloqueo: datetime = Field(default_factory=datetime.utcnow)

class NutritionAdviceRequest(BaseModel):
    objetivo: str
    nivel_actividad: str
    ultimo_entrenamiento: Optional[str] = None
    calorias_quemadas: Optional[int] = None
    preferencias: Optional[str] = None

class NutritionAdviceResponse(BaseModel):
    consejo: str
    recomendaciones: List[str]

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "nombre": user_data.nombre,
        "objetivo": user_data.objetivo,
        "nivel": user_data.nivel,
        "fecha_registro": datetime.utcnow(),
        "racha_dias": 0,
        "total_entrenamientos": 0,
        "ultimo_entrenamiento": None,
        "failed_login_attempts": 0,
        "locked_until": None
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email.lower())
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email.lower(),
            nombre=user_data.nombre,
            objetivo=user_data.objetivo,
            nivel=user_data.nivel,
            fecha_registro=user_doc["fecha_registro"],
            racha_dias=0,
            total_entrenamientos=0
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Check if account is locked
    if user.get("locked_until") and user["locked_until"] > datetime.utcnow():
        raise HTTPException(status_code=429, detail="Cuenta bloqueada temporalmente. Intenta más tarde.")
    
    if not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        attempts = user.get("failed_login_attempts", 0) + 1
        update_data = {"failed_login_attempts": attempts}
        
        # Lock account after 5 failed attempts
        if attempts >= 5:
            update_data["locked_until"] = datetime.utcnow() + timedelta(minutes=15)
        
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # Reset failed attempts on successful login
    await db.users.update_one(
        {"id": user["id"]}, 
        {"$set": {"failed_login_attempts": 0, "locked_until": None}}
    )
    
    token = create_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            nombre=user["nombre"],
            objetivo=user["objetivo"],
            nivel=user["nivel"],
            fecha_registro=user["fecha_registro"],
            racha_dias=user.get("racha_dias", 0),
            total_entrenamientos=user.get("total_entrenamientos", 0)
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        nombre=current_user["nombre"],
        objetivo=current_user["objetivo"],
        nivel=current_user["nivel"],
        fecha_registro=current_user["fecha_registro"],
        racha_dias=current_user.get("racha_dias", 0),
        total_entrenamientos=current_user.get("total_entrenamientos", 0)
    )

@api_router.put("/auth/profile")
async def update_profile(
    objetivo: Optional[str] = None,
    nivel: Optional[str] = None,
    nombre: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if objetivo:
        update_data["objetivo"] = objetivo
    if nivel:
        update_data["nivel"] = nivel
    if nombre:
        update_data["nombre"] = nombre
    
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    return {"message": "Perfil actualizado correctamente"}

# ==================== EXERCISES ENDPOINTS ====================

@api_router.get("/exercises", response_model=List[Exercise])
async def get_exercises(
    categoria: Optional[str] = None,
    dificultad: Optional[str] = None,
    musculo: Optional[str] = None
):
    query = {}
    if categoria:
        query["categoria"] = categoria
    if dificultad:
        query["dificultad"] = dificultad
    if musculo:
        query["musculo_principal"] = {"$regex": musculo, "$options": "i"}
    
    exercises = await db.exercises.find(query, {"_id": 0}).to_list(100)
    return [Exercise(**ex) for ex in exercises]

@api_router.get("/exercises/{exercise_id}", response_model=Exercise)
async def get_exercise(exercise_id: str):
    exercise = await db.exercises.find_one({"id": exercise_id})
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    return Exercise(**exercise)

@api_router.get("/exercises/category/{categoria}", response_model=List[Exercise])
async def get_exercises_by_category(categoria: str):
    exercises = await db.exercises.find({"categoria": categoria}, {"_id": 0}).to_list(50)
    return [Exercise(**ex) for ex in exercises]

# ==================== ROUTINES ENDPOINTS ====================

@api_router.get("/routines", response_model=List[Routine])
async def get_routines(
    tipo: Optional[str] = None,
    nivel: Optional[str] = None
):
    query = {}
    if tipo:
        query["tipo"] = tipo
    if nivel:
        query["nivel"] = nivel
    
    routines = await db.routines.find(query, {"_id": 0}).to_list(50)
    return [Routine(**r) for r in routines]

@api_router.get("/routines/{routine_id}", response_model=Routine)
async def get_routine(routine_id: str):
    routine = await db.routines.find_one({"id": routine_id})
    if not routine:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    return Routine(**routine)

@api_router.get("/routines/{routine_id}/exercises", response_model=List[Exercise])
async def get_routine_exercises(routine_id: str):
    routine = await db.routines.find_one({"id": routine_id})
    if not routine:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
    
    exercises = await db.exercises.find({"id": {"$in": routine["ejercicios"]}}).to_list(50)
    
    # Sort exercises by the order in routine
    exercise_map = {ex["id"]: ex for ex in exercises}
    ordered = [Exercise(**exercise_map[eid]) for eid in routine["ejercicios"] if eid in exercise_map]
    
    return ordered

# ==================== WORKOUT SESSION ENDPOINTS ====================

@api_router.post("/workouts", response_model=WorkoutSession)
async def create_workout(
    session_data: WorkoutSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    session = WorkoutSession(
        user_id=current_user["id"],
        **session_data.dict()
    )
    
    await db.workout_sessions.insert_one(session.dict())
    
    # Update user stats
    today = datetime.utcnow().date()
    last_workout = current_user.get("ultimo_entrenamiento")
    
    racha = current_user.get("racha_dias", 0)
    if last_workout:
        last_date = last_workout.date()
        diff = (today - last_date).days
        if diff == 1:
            racha += 1
        elif diff > 1:
            racha = 1
    else:
        racha = 1
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "ultimo_entrenamiento": datetime.utcnow(),
                "racha_dias": racha
            },
            "$inc": {"total_entrenamientos": 1}
        }
    )
    
    # Check achievements
    await check_and_unlock_achievements(current_user["id"])
    
    return session

@api_router.get("/workouts", response_model=List[WorkoutSession])
async def get_workouts(
    current_user: dict = Depends(get_current_user),
    limit: int = 20
):
    workouts = await db.workout_sessions.find(
        {"user_id": current_user["id"]}
    ).sort("fecha", -1).to_list(limit)
    
    return [WorkoutSession(**w) for w in workouts]

@api_router.get("/workouts/stats")
async def get_workout_stats(current_user: dict = Depends(get_current_user)):
    # Get stats for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    workouts = await db.workout_sessions.find(
        {"user_id": current_user["id"], "fecha": {"$gte": thirty_days_ago}},
        {"calorias_quemadas": 1, "duracion_minutos": 1, "_id": 0}
    ).to_list(100)
    
    total_calorias = sum(w.get("calorias_quemadas", 0) for w in workouts)
    total_minutos = sum(w.get("duracion_minutos", 0) for w in workouts)
    
    return {
        "entrenamientos_mes": len(workouts),
        "calorias_quemadas_mes": total_calorias,
        "minutos_entrenados_mes": total_minutos,
        "racha_actual": current_user.get("racha_dias", 0),
        "total_entrenamientos": current_user.get("total_entrenamientos", 0)
    }

# ==================== ACHIEVEMENTS ENDPOINTS ====================

@api_router.get("/achievements", response_model=List[Achievement])
async def get_all_achievements():
    achievements = await db.achievements.find({}, {"_id": 0}).to_list(50)
    return [Achievement(**a) for a in achievements]

@api_router.get("/achievements/user", response_model=List[dict])
async def get_user_achievements(current_user: dict = Depends(get_current_user)):
    user_achievements = await db.user_achievements.find(
        {"user_id": current_user["id"]}
    ).to_list(100)
    
    achievement_ids = [ua["achievement_id"] for ua in user_achievements]
    achievements = await db.achievements.find({"id": {"$in": achievement_ids}}).to_list(50)
    
    achievement_map = {a["id"]: a for a in achievements}
    
    result = []
    for ua in user_achievements:
        if ua["achievement_id"] in achievement_map:
            result.append({
                "achievement": Achievement(**achievement_map[ua["achievement_id"]]),
                "fecha_desbloqueo": ua["fecha_desbloqueo"]
            })
    
    return result

async def check_and_unlock_achievements(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        return
    
    # Get already unlocked achievements
    unlocked = await db.user_achievements.find({"user_id": user_id}, {"achievement_id": 1, "_id": 0}).to_list(100)
    unlocked_ids = {ua["achievement_id"] for ua in unlocked}
    
    # Get all achievements with projection
    achievements = await db.achievements.find({}, {"id": 1, "condicion": 1, "valor_requerido": 1, "_id": 0}).to_list(50)
    
    for achievement in achievements:
        if achievement["id"] in unlocked_ids:
            continue
        
        unlocked_new = False
        condicion = achievement["condicion"]
        valor = achievement["valor_requerido"]
        
        if condicion == "entrenamientos_totales":
            if user.get("total_entrenamientos", 0) >= valor:
                unlocked_new = True
        elif condicion == "racha_dias":
            if user.get("racha_dias", 0) >= valor:
                unlocked_new = True
        elif condicion == "primer_entrenamiento":
            if user.get("total_entrenamientos", 0) >= 1:
                unlocked_new = True
        
        if unlocked_new:
            await db.user_achievements.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "achievement_id": achievement["id"],
                "fecha_desbloqueo": datetime.utcnow()
            })

# ==================== NUTRITION AI ENDPOINT ====================

@api_router.post("/nutrition/advice", response_model=NutritionAdviceResponse)
async def get_nutrition_advice(
    request: NutritionAdviceRequest,
    current_user: dict = Depends(get_current_user)
):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Servicio de IA no configurado")
    
    # Build prompt in Spanish
    prompt = f"""Eres un nutricionista deportivo experto. Proporciona consejos de alimentación personalizados basados en:

**Perfil del Usuario:**
- Objetivo: {request.objetivo}
- Nivel de actividad: {request.nivel_actividad}
- Último entrenamiento: {request.ultimo_entrenamiento or 'No especificado'}
- Calorías quemadas recientemente: {request.calorias_quemadas or 'No especificado'}
- Preferencias alimentarias: {request.preferencias or 'Sin preferencias específicas'}

Por favor proporciona:
1. Un consejo principal personalizado (2-3 oraciones)
2. 4-5 recomendaciones específicas de alimentos o comidas

Responde ÚNICAMENTE en español y en formato JSON:
{{"consejo": "tu consejo aquí", "recomendaciones": ["rec1", "rec2", "rec3", "rec4"]}}"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"nutrition-{current_user['id']}-{datetime.utcnow().timestamp()}",
            system_message="Eres un nutricionista deportivo experto que da consejos en español."
        ).with_model("openai", "gpt-4.1")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Try to extract JSON from response
        response_text = response.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        
        data = json.loads(response_text)
        
        return NutritionAdviceResponse(
            consejo=data.get("consejo", "Mantén una alimentación balanceada acorde a tu nivel de actividad."),
            recomendaciones=data.get("recomendaciones", [
                "Proteínas magras después del entrenamiento",
                "Hidratación constante",
                "Carbohidratos complejos para energía",
                "Frutas y verduras variadas"
            ])
        )
    except Exception as e:
        logging.error(f"Error getting nutrition advice: {e}")
        # Fallback response
        return NutritionAdviceResponse(
            consejo="Mantén una alimentación equilibrada con proteínas, carbohidratos y grasas saludables según tu objetivo de fitness.",
            recomendaciones=[
                "Consume proteína magra después del entrenamiento (pollo, pescado, huevos)",
                "Hidrátate bien antes, durante y después del ejercicio",
                "Incluye carbohidratos complejos como avena, arroz integral y batata",
                "No olvides las frutas y verduras para vitaminas y minerales",
                "Planifica tus comidas para mantener la consistencia"
            ]
        )

# ==================== WARMUP GENERATOR ====================

@api_router.get("/warmup/{workout_type}", response_model=List[Exercise])
async def get_warmup_routine(workout_type: str):
    """Generate smart warmup based on workout type"""
    # Get warmup exercises with projection
    warmup_exercises = await db.exercises.find({"categoria": "calentamiento"}, {"_id": 0}).to_list(20)
    
    if not warmup_exercises:
        return []
    
    # Filter based on workout type
    if workout_type == "pesas" or workout_type == "fuerza":
        # Focus on upper body and core warmup
        keywords = ["articular", "hombro", "core", "cadera"]
    elif workout_type == "cardio" or workout_type == "running":
        # Focus on leg warmup
        keywords = ["pierna", "cadera", "rodilla", "tobillo"]
    elif workout_type == "calistenia":
        # Full body warmup
        keywords = ["articular", "core", "hombro", "cadera"]
    else:
        keywords = []
    
    # Select exercises
    selected = []
    for ex in warmup_exercises:
        if any(k in ex.get("musculo_principal", "").lower() or k in ex.get("nombre", "").lower() for k in keywords):
            selected.append(ex)
    
    # If not enough, add general warmup
    if len(selected) < 4:
        for ex in warmup_exercises:
            if ex not in selected:
                selected.append(ex)
            if len(selected) >= 5:
                break
    
    return [Exercise(**ex) for ex in selected[:5]]

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with initial exercises and achievements"""
    
    # Clear existing data for fresh seed
    await db.exercises.delete_many({})
    await db.achievements.delete_many({})
    await db.routines.delete_many({})
    
    # EXERCISES DATA - Using public exercise demonstration images
    exercises_data = [
        # === CALENTAMIENTO ===
        {
            "id": "cal-001",
            "nombre": "Rotación de Hombros",
            "categoria": "calentamiento",
            "musculo_principal": "Hombros",
            "descripcion": "Movimiento circular de hombros para calentar la articulación",
            "instrucciones": [
                "Párate con los pies al ancho de hombros",
                "Eleva los hombros hacia arriba",
                "Rota hacia atrás en círculos amplios",
                "Repite 10 veces y cambia dirección"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0880.gif",
            "youtube_url": "https://www.youtube.com/watch?v=SIwBENdVhPs",
            "dificultad": "facil",
            "duracion_segundos": 30,
            "repeticiones": 10
        },
        {
            "id": "cal-002",
            "nombre": "Rotación de Cadera",
            "categoria": "calentamiento",
            "musculo_principal": "Cadera",
            "descripcion": "Círculos con la cadera para movilidad articular",
            "instrucciones": [
                "Párate con los pies separados",
                "Coloca las manos en la cintura",
                "Realiza círculos amplios con la cadera",
                "10 repeticiones en cada dirección"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/3543.gif",
            "youtube_url": "https://www.youtube.com/watch?v=55MYgBsQEWQ",
            "dificultad": "facil",
            "duracion_segundos": 30,
            "repeticiones": 10
        },
        {
            "id": "cal-003",
            "nombre": "Rodillas al Pecho",
            "categoria": "calentamiento",
            "musculo_principal": "Core y Cadera",
            "descripcion": "Elevación alternada de rodillas activando el core",
            "instrucciones": [
                "Párate erguido con los pies juntos",
                "Lleva una rodilla al pecho",
                "Alterna con la otra pierna",
                "Mantén el core activado"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0640.gif",
            "youtube_url": "https://www.youtube.com/watch?v=ZZZoCNMU48U",
            "dificultad": "facil",
            "duracion_segundos": 45,
            "repeticiones": 20
        },
        {
            "id": "cal-004",
            "nombre": "Jumping Jacks",
            "categoria": "calentamiento",
            "musculo_principal": "Cuerpo Completo",
            "descripcion": "Saltos de tijera para elevar el ritmo cardíaco",
            "instrucciones": [
                "Párate con pies juntos y brazos a los lados",
                "Salta abriendo piernas y subiendo brazos",
                "Regresa a la posición inicial",
                "Mantén un ritmo constante"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0630.gif",
            "youtube_url": "https://www.youtube.com/watch?v=CWpmIW6l-YA",
            "dificultad": "facil",
            "duracion_segundos": 45,
            "repeticiones": 30
        },
        {
            "id": "cal-005",
            "nombre": "Giro de Tronco",
            "categoria": "calentamiento",
            "musculo_principal": "Core y Espalda",
            "descripcion": "Rotación del torso para movilidad de columna",
            "instrucciones": [
                "Párate con pies al ancho de hombros",
                "Extiende los brazos frente a ti",
                "Gira el torso hacia un lado",
                "Alterna de lado manteniendo la cadera fija"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0878.gif",
            "youtube_url": "https://www.youtube.com/watch?v=5pVB9OMD9lI",
            "dificultad": "facil",
            "duracion_segundos": 30,
            "repeticiones": 16
        },
        
        # === PESAS ===
        {
            "id": "pes-001",
            "nombre": "Press de Banca",
            "categoria": "pesas",
            "musculo_principal": "Pecho",
            "descripcion": "Ejercicio fundamental para desarrollar el pectoral",
            "instrucciones": [
                "Acuéstate en el banco con los pies firmes",
                "Agarra la barra con agarre medio",
                "Baja controladamente hasta el pecho",
                "Empuja hacia arriba sin bloquear codos"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0025.gif",
            "youtube_url": "https://www.youtube.com/watch?v=gRVjAtPip0Y",
            "dificultad": "medio",
            "series": 4,
            "repeticiones": 10
        },
        {
            "id": "pes-002",
            "nombre": "Sentadilla con Barra",
            "categoria": "pesas",
            "musculo_principal": "Piernas",
            "descripcion": "El rey de los ejercicios para piernas",
            "instrucciones": [
                "Coloca la barra en la parte alta de la espalda",
                "Pies al ancho de hombros, puntas ligeramente afuera",
                "Baja manteniendo la espalda recta",
                "Empuja desde los talones para subir"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0043.gif",
            "youtube_url": "https://www.youtube.com/watch?v=ultWZbUMPL8",
            "dificultad": "medio",
            "series": 4,
            "repeticiones": 12
        },
        {
            "id": "pes-003",
            "nombre": "Peso Muerto",
            "categoria": "pesas",
            "musculo_principal": "Espalda Baja y Piernas",
            "descripcion": "Ejercicio compuesto para fuerza general",
            "instrucciones": [
                "Párate con la barra sobre los pies",
                "Agarra la barra con agarre pronado",
                "Mantén la espalda recta durante todo el movimiento",
                "Levanta usando las piernas y glúteos"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0032.gif",
            "youtube_url": "https://www.youtube.com/watch?v=op9kVnSso6Q",
            "dificultad": "dificil",
            "series": 4,
            "repeticiones": 8
        },
        {
            "id": "pes-004",
            "nombre": "Curl de Bíceps",
            "categoria": "pesas",
            "musculo_principal": "Bíceps",
            "descripcion": "Aislamiento para desarrollar los bíceps",
            "instrucciones": [
                "Párate con mancuernas a los lados",
                "Codos pegados al cuerpo",
                "Sube las mancuernas contrayendo el bíceps",
                "Baja de forma controlada"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0294.gif",
            "youtube_url": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
            "dificultad": "facil",
            "series": 3,
            "repeticiones": 12
        },
        {
            "id": "pes-005",
            "nombre": "Press Militar",
            "categoria": "pesas",
            "musculo_principal": "Hombros",
            "descripcion": "Desarrollo de hombros con barra o mancuernas",
            "instrucciones": [
                "Siéntate o párate con core activado",
                "Barra a la altura de los hombros",
                "Empuja hacia arriba sin arquear la espalda",
                "Baja controladamente"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0405.gif",
            "youtube_url": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
            "dificultad": "medio",
            "series": 4,
            "repeticiones": 10
        },
        {
            "id": "pes-006",
            "nombre": "Remo con Barra",
            "categoria": "pesas",
            "musculo_principal": "Espalda",
            "descripcion": "Excelente para desarrollar la espalda media",
            "instrucciones": [
                "Inclínate hacia adelante con la espalda recta",
                "Agarra la barra con agarre pronado",
                "Tira hacia el abdomen contrayendo dorsales",
                "Baja controladamente"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0027.gif",
            "youtube_url": "https://www.youtube.com/watch?v=kBWAon7ItDw",
            "dificultad": "medio",
            "series": 4,
            "repeticiones": 10
        },
        {
            "id": "pes-007",
            "nombre": "Extensión de Tríceps",
            "categoria": "pesas",
            "musculo_principal": "Tríceps",
            "descripcion": "Aislamiento para desarrollar los tríceps",
            "instrucciones": [
                "Párate o siéntate con mancuerna sobre la cabeza",
                "Baja la mancuerna detrás de la cabeza",
                "Extiende los brazos hacia arriba",
                "Mantén los codos cerca de las orejas"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0293.gif",
            "youtube_url": "https://www.youtube.com/watch?v=YbX7Wd8jQ-Q",
            "dificultad": "facil",
            "series": 3,
            "repeticiones": 12
        },
        {
            "id": "pes-008",
            "nombre": "Elevaciones Laterales",
            "categoria": "pesas",
            "musculo_principal": "Hombros",
            "descripcion": "Aislamiento para deltoides laterales",
            "instrucciones": [
                "Párate con mancuernas a los lados",
                "Eleva los brazos lateralmente hasta la altura del hombro",
                "Mantén una ligera flexión en los codos",
                "Baja controladamente"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0313.gif",
            "youtube_url": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
            "dificultad": "facil",
            "series": 3,
            "repeticiones": 15
        },
        
        # === CALISTENIA ===
        {
            "id": "cal-101",
            "nombre": "Flexiones",
            "categoria": "calistenia",
            "musculo_principal": "Pecho y Tríceps",
            "descripcion": "Ejercicio básico de empuje con peso corporal",
            "instrucciones": [
                "Posición de plancha con manos al ancho de hombros",
                "Core y glúteos activados",
                "Baja el pecho hacia el suelo",
                "Empuja hacia arriba extendiendo los brazos"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0662.gif",
            "youtube_url": "https://www.youtube.com/watch?v=IODxDxX7oi4",
            "dificultad": "facil",
            "series": 3,
            "repeticiones": 15
        },
        {
            "id": "cal-102",
            "nombre": "Dominadas",
            "categoria": "calistenia",
            "musculo_principal": "Espalda y Bíceps",
            "descripcion": "El mejor ejercicio de tirón con peso corporal",
            "instrucciones": [
                "Agarra la barra con agarre pronado",
                "Cuelga con brazos extendidos",
                "Tira llevando el pecho hacia la barra",
                "Baja controladamente"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0651.gif",
            "youtube_url": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
            "dificultad": "dificil",
            "series": 4,
            "repeticiones": 8
        },
        {
            "id": "cal-103",
            "nombre": "Sentadilla Búlgara",
            "categoria": "calistenia",
            "musculo_principal": "Piernas y Glúteos",
            "descripcion": "Sentadilla unilateral con pie elevado",
            "instrucciones": [
                "Coloca un pie en un banco detrás de ti",
                "El pie delantero firme en el suelo",
                "Baja flexionando la rodilla delantera",
                "Empuja para volver arriba"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/1434.gif",
            "youtube_url": "https://www.youtube.com/watch?v=2C-uNgKwPLE",
            "dificultad": "medio",
            "series": 3,
            "repeticiones": 10
        },
        {
            "id": "cal-104",
            "nombre": "Plancha",
            "categoria": "calistenia",
            "musculo_principal": "Core",
            "descripcion": "Isométrico fundamental para el core",
            "instrucciones": [
                "Apóyate en antebrazos y puntas de pies",
                "Cuerpo en línea recta",
                "Core activado, no dejes caer la cadera",
                "Mantén la posición el tiempo indicado"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0145.gif",
            "youtube_url": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
            "dificultad": "facil",
            "duracion_segundos": 45,
            "series": 3
        },
        {
            "id": "cal-105",
            "nombre": "Fondos en Paralelas",
            "categoria": "calistenia",
            "musculo_principal": "Pecho y Tríceps",
            "descripcion": "Ejercicio avanzado de empuje",
            "instrucciones": [
                "Agarra las barras paralelas",
                "Sube hasta extender los brazos",
                "Baja flexionando los codos a 90 grados",
                "Inclina ligeramente el torso hacia adelante"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0621.gif",
            "youtube_url": "https://www.youtube.com/watch?v=2z8JmcrW-As",
            "dificultad": "medio",
            "series": 3,
            "repeticiones": 12
        },
        {
            "id": "cal-106",
            "nombre": "Abdominales Crunch",
            "categoria": "calistenia",
            "musculo_principal": "Abdominales",
            "descripcion": "Ejercicio clásico para abdominales",
            "instrucciones": [
                "Acuéstate boca arriba con rodillas flexionadas",
                "Manos detrás de la cabeza",
                "Eleva los hombros del suelo contrayendo abdomen",
                "Baja controladamente sin apoyar completamente"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0274.gif",
            "youtube_url": "https://www.youtube.com/watch?v=Xyd_fa5zoEU",
            "dificultad": "facil",
            "series": 3,
            "repeticiones": 20
        },
        
        # === CARDIO / RUNNING ===
        {
            "id": "car-001",
            "nombre": "Trote Suave",
            "categoria": "cardio",
            "musculo_principal": "Piernas y Sistema Cardiovascular",
            "descripcion": "Carrera a ritmo moderado para resistencia",
            "instrucciones": [
                "Mantén una postura erguida",
                "Aterriza con el mediopié",
                "Brazos relajados oscilando naturalmente",
                "Respira de manera rítmica"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0685.gif",
            "youtube_url": "https://www.youtube.com/watch?v=brFHyOtTwH4",
            "dificultad": "facil",
            "duracion_segundos": 600
        },
        {
            "id": "car-002",
            "nombre": "Intervalos de Velocidad",
            "categoria": "cardio",
            "musculo_principal": "Piernas y Sistema Cardiovascular",
            "descripcion": "Alternar sprints con recuperación activa",
            "instrucciones": [
                "Sprint al 80-90% por 30 segundos",
                "Trote suave por 60 segundos",
                "Repite el ciclo 8-10 veces",
                "Enfría con 5 minutos de caminata"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0685.gif",
            "youtube_url": "https://www.youtube.com/watch?v=Mvo2snJGhtM",
            "dificultad": "dificil",
            "duracion_segundos": 900
        },
        {
            "id": "car-003",
            "nombre": "Burpees",
            "categoria": "cardio",
            "musculo_principal": "Cuerpo Completo",
            "descripcion": "Ejercicio explosivo de alta intensidad",
            "instrucciones": [
                "Desde parado, baja a posición de sentadilla",
                "Lleva las manos al suelo y salta a plancha",
                "Haz una flexión",
                "Salta de vuelta y salta arriba con brazos"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/3302.gif",
            "youtube_url": "https://www.youtube.com/watch?v=dZgVxmf6jkA",
            "dificultad": "dificil",
            "series": 3,
            "repeticiones": 10
        },
        {
            "id": "car-004",
            "nombre": "Mountain Climbers",
            "categoria": "cardio",
            "musculo_principal": "Core y Piernas",
            "descripcion": "Escaladores para cardio y core",
            "instrucciones": [
                "Posición de plancha alta",
                "Lleva una rodilla al pecho",
                "Alterna rápidamente las piernas",
                "Mantén las caderas bajas"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0658.gif",
            "youtube_url": "https://www.youtube.com/watch?v=nmwgirgXLYM",
            "dificultad": "medio",
            "duracion_segundos": 45,
            "series": 3
        },
        {
            "id": "car-005",
            "nombre": "Saltos de Cuerda",
            "categoria": "cardio",
            "musculo_principal": "Piernas y Cardio",
            "descripcion": "Cardio clásico y efectivo",
            "instrucciones": [
                "Sujeta la cuerda con ambas manos",
                "Salta con los pies juntos",
                "Mantén los codos cerca del cuerpo",
                "Aterriza suavemente en la punta de los pies"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0627.gif",
            "youtube_url": "https://www.youtube.com/watch?v=u3zgHI8QnqE",
            "dificultad": "medio",
            "duracion_segundos": 120,
            "series": 3
        },
        
        # === PLIOMETRÍA ===
        {
            "id": "pli-001",
            "nombre": "Box Jumps",
            "categoria": "pliometria",
            "musculo_principal": "Piernas",
            "descripcion": "Saltos explosivos al cajón",
            "instrucciones": [
                "Párate frente a un cajón estable",
                "Flexiona las rodillas y balancea los brazos",
                "Salta explosivamente aterrizando suave",
                "Baja con control y repite"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0633.gif",
            "youtube_url": "https://www.youtube.com/watch?v=52r_Ul5k03g",
            "dificultad": "medio",
            "series": 4,
            "repeticiones": 8
        },
        {
            "id": "pli-002",
            "nombre": "Saltos de Tijera",
            "categoria": "pliometria",
            "musculo_principal": "Piernas",
            "descripcion": "Zancadas con salto alternando piernas",
            "instrucciones": [
                "Posición de zancada",
                "Salta cambiando la posición de las piernas",
                "Aterriza suave en la nueva posición",
                "Mantén el torso erguido"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/1464.gif",
            "youtube_url": "https://www.youtube.com/watch?v=CTJlvCj5ETE",
            "dificultad": "medio",
            "series": 3,
            "repeticiones": 12
        },
        {
            "id": "pli-003",
            "nombre": "Salto en Cuclillas",
            "categoria": "pliometria",
            "musculo_principal": "Piernas y Glúteos",
            "descripcion": "Sentadilla explosiva con salto",
            "instrucciones": [
                "Realiza una sentadilla profunda",
                "Salta explosivamente hacia arriba",
                "Aterriza suave volviendo a la sentadilla",
                "Repite inmediatamente"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/0634.gif",
            "youtube_url": "https://www.youtube.com/watch?v=YGGq0AE5Uyc",
            "dificultad": "medio",
            "series": 4,
            "repeticiones": 10
        },
        {
            "id": "pli-004",
            "nombre": "Salto de Longitud",
            "categoria": "pliometria",
            "musculo_principal": "Piernas",
            "descripcion": "Salto horizontal para potencia",
            "instrucciones": [
                "Párate con pies al ancho de hombros",
                "Balancea los brazos hacia atrás",
                "Salta hacia adelante explosivamente",
                "Aterriza con ambos pies y absorbe el impacto"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/1318.gif",
            "youtube_url": "https://www.youtube.com/watch?v=SDDB7QJwP0I",
            "dificultad": "medio",
            "series": 3,
            "repeticiones": 8
        },
        
        # === ESTIRAMIENTOS ===
        {
            "id": "est-001",
            "nombre": "Estiramiento de Cuádriceps",
            "categoria": "estiramiento",
            "musculo_principal": "Cuádriceps",
            "descripcion": "Estiramiento estático para la parte frontal del muslo",
            "instrucciones": [
                "Párate en una pierna (apóyate si es necesario)",
                "Lleva el talón al glúteo con la mano",
                "Mantén las rodillas juntas",
                "Sostén 30 segundos por pierna"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/1424.gif",
            "youtube_url": "https://www.youtube.com/watch?v=F5gJCjaOhJo",
            "dificultad": "facil",
            "duracion_segundos": 60
        },
        {
            "id": "est-002",
            "nombre": "Estiramiento de Isquiotibiales",
            "categoria": "estiramiento",
            "musculo_principal": "Isquiotibiales",
            "descripcion": "Estiramiento de la parte posterior del muslo",
            "instrucciones": [
                "Siéntate con una pierna extendida",
                "Flexiona la otra pierna con el pie contra el muslo",
                "Inclínate hacia la pierna extendida",
                "Sostén 30 segundos por pierna"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/1511.gif",
            "youtube_url": "https://www.youtube.com/watch?v=1OlK6jPKFXw",
            "dificultad": "facil",
            "duracion_segundos": 60
        },
        {
            "id": "est-003",
            "nombre": "Estiramiento de Pecho",
            "categoria": "estiramiento",
            "musculo_principal": "Pectorales",
            "descripcion": "Apertura de pecho en marco de puerta",
            "instrucciones": [
                "Coloca el antebrazo en un marco de puerta",
                "Codo a la altura del hombro",
                "Gira el cuerpo hacia el lado opuesto",
                "Sostén 30 segundos por lado"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/3582.gif",
            "youtube_url": "https://www.youtube.com/watch?v=aNST9H7qHHU",
            "dificultad": "facil",
            "duracion_segundos": 60
        },
        {
            "id": "est-004",
            "nombre": "Estiramiento de Espalda (Gato-Vaca)",
            "categoria": "estiramiento",
            "musculo_principal": "Espalda",
            "descripcion": "Movilización de columna vertebral",
            "instrucciones": [
                "Posición de cuatro puntos",
                "Arquea la espalda hacia arriba (gato)",
                "Baja la espalda creando una curva (vaca)",
                "Alterna fluidamente 10 veces"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/3579.gif",
            "youtube_url": "https://www.youtube.com/watch?v=kqnua4rHVVA",
            "dificultad": "facil",
            "duracion_segundos": 60,
            "repeticiones": 10
        },
        {
            "id": "est-005",
            "nombre": "Estiramiento de Hombros",
            "categoria": "estiramiento",
            "musculo_principal": "Deltoides",
            "descripcion": "Estiramiento cruzado de hombro",
            "instrucciones": [
                "Lleva un brazo cruzado frente al pecho",
                "Con la otra mano presiona suavemente el codo",
                "Mantén el hombro relajado",
                "Sostén 30 segundos por lado"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/3576.gif",
            "youtube_url": "https://www.youtube.com/watch?v=0aeIaTDtBg4",
            "dificultad": "facil",
            "duracion_segundos": 60
        },
        {
            "id": "est-006",
            "nombre": "Estiramiento de Glúteos",
            "categoria": "estiramiento",
            "musculo_principal": "Glúteos",
            "descripcion": "Estiramiento profundo de glúteo",
            "instrucciones": [
                "Acuéstate boca arriba",
                "Cruza un tobillo sobre la rodilla opuesta",
                "Lleva ambas piernas hacia el pecho",
                "Sostén 30 segundos por lado"
            ],
            "gif_url": "https://d205bpvrqc9yn1.cloudfront.net/1498.gif",
            "youtube_url": "https://www.youtube.com/watch?v=Bf6tWAzUPIw",
            "dificultad": "facil",
            "duracion_segundos": 60
        }
    ]
    
    # ACHIEVEMENTS DATA - 20 logros variados
    achievements_data = [
        # === LOGROS DE INICIO ===
        {
            "id": "ach-001",
            "nombre": "Primer Paso",
            "descripcion": "Completa tu primer entrenamiento",
            "icono": "trophy",
            "tipo": "especial",
            "condicion": "primer_entrenamiento",
            "valor_requerido": 1
        },
        {
            "id": "ach-002",
            "nombre": "Calentando Motores",
            "descripcion": "Completa 3 entrenamientos",
            "icono": "flame",
            "tipo": "diario",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 3
        },
        {
            "id": "ach-003",
            "nombre": "Rutina Establecida",
            "descripcion": "Completa 5 entrenamientos",
            "icono": "calendar",
            "tipo": "semanal",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 5
        },
        # === LOGROS DE RACHA ===
        {
            "id": "ach-004",
            "nombre": "Tres Días Seguidos",
            "descripcion": "Mantén una racha de 3 días",
            "icono": "fire",
            "tipo": "diario",
            "condicion": "racha_dias",
            "valor_requerido": 3
        },
        {
            "id": "ach-005",
            "nombre": "Semana Perfecta",
            "descripcion": "Mantén una racha de 7 días",
            "icono": "star",
            "tipo": "semanal",
            "condicion": "racha_dias",
            "valor_requerido": 7
        },
        {
            "id": "ach-006",
            "nombre": "Dos Semanas Invicto",
            "descripcion": "Mantén una racha de 14 días",
            "icono": "flame",
            "tipo": "mensual",
            "condicion": "racha_dias",
            "valor_requerido": 14
        },
        {
            "id": "ach-007",
            "nombre": "Mes de Hierro",
            "descripcion": "Mantén una racha de 30 días",
            "icono": "shield",
            "tipo": "especial",
            "condicion": "racha_dias",
            "valor_requerido": 30
        },
        {
            "id": "ach-008",
            "nombre": "Disciplina Espartana",
            "descripcion": "Mantén una racha de 60 días",
            "icono": "barbell",
            "tipo": "especial",
            "condicion": "racha_dias",
            "valor_requerido": 60
        },
        {
            "id": "ach-009",
            "nombre": "Leyenda Viviente",
            "descripcion": "Mantén una racha de 100 días",
            "icono": "crown",
            "tipo": "especial",
            "condicion": "racha_dias",
            "valor_requerido": 100
        },
        # === LOGROS DE ENTRENAMIENTOS ===
        {
            "id": "ach-010",
            "nombre": "Dedicación Total",
            "descripcion": "Completa 10 entrenamientos",
            "icono": "medal",
            "tipo": "mensual",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 10
        },
        {
            "id": "ach-011",
            "nombre": "Guerrero Fitness",
            "descripcion": "Completa 25 entrenamientos",
            "icono": "flash",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 25
        },
        {
            "id": "ach-012",
            "nombre": "Medio Centenar",
            "descripcion": "Completa 50 entrenamientos",
            "icono": "rocket",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 50
        },
        {
            "id": "ach-013",
            "nombre": "Centurión",
            "descripcion": "Completa 100 entrenamientos",
            "icono": "gem",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 100
        },
        {
            "id": "ach-014",
            "nombre": "Atleta de Élite",
            "descripcion": "Completa 200 entrenamientos",
            "icono": "ribbon",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 200
        },
        {
            "id": "ach-015",
            "nombre": "Máquina Imparable",
            "descripcion": "Completa 365 entrenamientos",
            "icono": "infinite",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 365
        },
        # === LOGROS ESPECIALES ===
        {
            "id": "ach-016",
            "nombre": "Madrugador",
            "descripcion": "Completa un entrenamiento antes de las 7am",
            "icono": "sunny",
            "tipo": "especial",
            "condicion": "primer_entrenamiento",
            "valor_requerido": 1
        },
        {
            "id": "ach-017",
            "nombre": "Búho Nocturno",
            "descripcion": "Completa un entrenamiento después de las 10pm",
            "icono": "moon",
            "tipo": "especial",
            "condicion": "primer_entrenamiento",
            "valor_requerido": 1
        },
        {
            "id": "ach-018",
            "nombre": "Fin de Semana Activo",
            "descripcion": "Entrena en sábado y domingo",
            "icono": "happy",
            "tipo": "semanal",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 2
        },
        {
            "id": "ach-019",
            "nombre": "Superhéroe del Gym",
            "descripcion": "Completa 500 entrenamientos",
            "icono": "flash",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 500
        },
        {
            "id": "ach-020",
            "nombre": "Inmortal",
            "descripcion": "Completa 1000 entrenamientos",
            "icono": "diamond",
            "tipo": "especial",
            "condicion": "entrenamientos_totales",
            "valor_requerido": 1000
        }
    ]
    
    # ROUTINES DATA
    routines_data = [
        {
            "id": "rut-001",
            "nombre": "Fuerza Total - Principiante",
            "descripcion": "Rutina de pesas para empezar a ganar fuerza",
            "tipo": "fuerza",
            "nivel": "principiante",
            "duracion_minutos": 45,
            "ejercicios": ["cal-001", "cal-002", "cal-003", "pes-001", "pes-002", "pes-004", "est-001", "est-003"],
            "calorias_estimadas": 300
        },
        {
            "id": "rut-002",
            "nombre": "Calistenia Básica",
            "descripcion": "Entrenamiento con peso corporal para todos los niveles",
            "tipo": "fuerza",
            "nivel": "principiante",
            "duracion_minutos": 40,
            "ejercicios": ["cal-001", "cal-003", "cal-004", "cal-101", "cal-104", "cal-103", "est-002", "est-004"],
            "calorias_estimadas": 250
        },
        {
            "id": "rut-003",
            "nombre": "Cardio Explosivo",
            "descripcion": "Sesión de alta intensidad para quemar calorías",
            "tipo": "cardio",
            "nivel": "intermedio",
            "duracion_minutos": 35,
            "ejercicios": ["cal-003", "cal-004", "car-003", "car-004", "pli-003", "est-001", "est-002"],
            "calorias_estimadas": 400
        },
        {
            "id": "rut-004",
            "nombre": "Fuerza Avanzada",
            "descripcion": "Rutina intensa para atletas experimentados",
            "tipo": "fuerza",
            "nivel": "avanzado",
            "duracion_minutos": 60,
            "ejercicios": ["cal-001", "cal-002", "pes-001", "pes-002", "pes-003", "pes-005", "pes-006", "est-001", "est-003", "est-004"],
            "calorias_estimadas": 450
        },
        {
            "id": "rut-005",
            "nombre": "Potencia Pliométrica",
            "descripcion": "Mejora tu explosividad con saltos",
            "tipo": "mixto",
            "nivel": "intermedio",
            "duracion_minutos": 40,
            "ejercicios": ["cal-003", "cal-004", "pli-001", "pli-002", "pli-003", "car-004", "est-001", "est-002"],
            "calorias_estimadas": 350
        },
        {
            "id": "rut-006",
            "nombre": "Flexibilidad y Movilidad",
            "descripcion": "Sesión completa de estiramientos",
            "tipo": "flexibilidad",
            "nivel": "principiante",
            "duracion_minutos": 30,
            "ejercicios": ["cal-001", "cal-002", "cal-005", "est-001", "est-002", "est-003", "est-004", "est-005"],
            "calorias_estimadas": 100
        }
    ]
    
    # Insert all data
    await db.exercises.insert_many(exercises_data)
    await db.achievements.insert_many(achievements_data)
    await db.routines.insert_many(routines_data)
    
    return {
        "message": "Base de datos inicializada correctamente",
        "exercises": len(exercises_data),
        "achievements": len(achievements_data),
        "routines": len(routines_data)
    }

# ==================== BASIC ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "TrainForge API - Tu app de fitness integral", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
