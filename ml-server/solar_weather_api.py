from fastapi import FastAPI
import joblib
import pandas as pd

app = FastAPI()

# load model
model = joblib.load("solar_energy_model.pkl")

@app.get("/predict-solar-weather")
def predict_solar(
    irradiation: float,
    ambient_temp: float,
    module_temp: float,
    hour: int,
    month: int
):
    # MUST match training column names EXACTLY
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