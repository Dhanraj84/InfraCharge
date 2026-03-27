from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

app = FastAPI(title="Solar ML API")

# ✅ Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load ML model
model = joblib.load("solar_energy_model.pkl")


# ✅ Root route
@app.get("/")
def home():
    return {"message": "Solar ML API is running 🚀"}


# ✅ ML Prediction (weather-based)
@app.get("/predict-solar-weather")
def predict_solar(
    irradiation: float,
    ambient_temp: float,
    module_temp: float,
    hour: int,
    month: int
):
    try:
        features = pd.DataFrame([{
            "IRRADIATION": irradiation,
            "AMBIENT_TEMPERATURE": ambient_temp,
            "MODULE_TEMPERATURE": module_temp,
            "hour": hour,
            "month": month
        }])

        prediction = model.predict(features)[0]

        return {
            "predicted_power_kw": float(round(prediction, 2))
        }

    except Exception as e:
        return {"error": str(e)}


# ✅ NEW FEATURE: LAND AREA → SOLAR OUTPUT
@app.get("/solar-analysis")
def solar_analysis(land_area: float):
    try:
        # 🔹 Step 1: Calculate panels
        panel_area = 2  # m² per panel
        panels = land_area / panel_area

        # 🔹 Step 2: Energy generation
        energy_per_panel = 0.4  # kW per panel
        energy = panels * energy_per_panel

        # 🔹 Step 3: EV charging capacity
        ev_energy_need = 15  # kWh per EV
        evs = energy / ev_energy_need

        return {
            "input_land_area": land_area,
            "total_panels": int(panels),
            "energy_generated_kW": round(energy, 2),
            "evs_supported_per_day": int(evs)
        }

    except Exception as e:
        return {"error": str(e)}