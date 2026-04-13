# ⚡ InfraCharge – Intelligent EV Charging Infrastructure Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3-F7931E?style=for-the-badge&logo=scikit-learn)](https://scikit-learn.org/)
[![Mapbox](https://img.shields.io/badge/Mapbox-3-4264fb?style=for-the-badge&logo=mapbox)](https://www.mapbox.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-black?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)

InfraCharge is a high-performance, data-driven platform designed to revolutionize EV mobility. It empowers EV users to find reliable charging stations instantly and provides infrastructure planners with AI-backed insights for optimal station deployment.

---

## 📸 Project Showcase

### 🔍 Smart Charging Locator
Find the nearest charging stations with real-time occupancy and amenity insights.
![Nearest Station Demo]

### 🧭 Intelligent Route Planner
Navigate worry-free with battery-aware routing and optimized charging stops.
![Route Planner Demo]

### 🧠 AI Infrastructure Engine
Identify high-demand zones using geospatial analysis and AI logic.
![Infrastructure Planner Demo]

---

## 🚀 What Problem Does It Solve?

EV adoption is skyrocketing, but infrastructure remains fragmented. InfraCharge bridges this gap:

- **For Users**: Eliminates "Range Anxiety" through precision routing and real-time station availability.
- **For Planners**: Replaces guesswork with data-backed suggestions for new station deployment.
- **For Cities**: Supports sustainable urban planning by identifying underserved transport corridors.
- **For Planet**: Encourages green travel through transparent CO₂ impact comparisons.

---

## ✨ Core Features

### 1. Smart Station Locator
- **Auto-location**: Detects your position for instant results.
- **Amenity Filters**: Find stations near cafes, restaurants, or malls.
- **Rich Data**: Detailed pricing, power ratings, and charging standards.

### 2. AI Infrastructure Planning Engine
- **Demand Clustering**: Highlights zones with high traffic but low charger density.
- **ROI Analytics**: Helps businesses plan investments based on vehicle movement data.
- **Gap Analysis**: Visualizes critical holes in the existing charging network.

### 3. Smart EV Route Planner
- **Battery-Aware**: Suggests routes based on your vehicle's specific range.
- **Weather Integration**: Adjusts range predictions based on real-time climate data.
- **Multi-Stop Optimization**: Calculates the most efficient charging stops for long-haul trips.

### 4. CO₂ Impact Dashboard
- **Compare & Contrast**: Visualizes emissions saved compared to traditional fuel vehicles.
- **Sustainability Tracking**: Motivates users by showcasing their contribution to a cleaner environment.

---

## 🛠 Tech Stack

### Frontend & UI
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Mapping & Geospatial
- **APIs**: Mapbox GL, MapTiler, OpenChargeMap
- **Georeferencing**: Geofire-common for spatial queries.

### Backend & Data
- **Auth & Database**: [Firebase](https://firebase.google.com/)
- **Relational Data**: PostgreSQL (Neon DB) / SQLite
- **ML Engine**: Python-based Demand Prediction Server

---

## 🏗️ Architecture Overview

- **Frontend (Next.js)**: High-performance UI + Interactive Map Rendering.
- **Backend (Firebase + PostgreSQL)**: Secure Auth + Scalable Data Storage.
- **ML Engine (Python)**: Specialized (Demand) Prediction Engine.
- **APIs**: Mapbox GL, OpenWeather, OpenChargeMap.

---
 
 ## ⚙️ Getting Started
 
 ### Prerequisites
 - **Node.js**: v18 or higher
 - **Python**: v3.10 or higher (for ML Server)
 - **Package Manager**: npm or yarn
 - **Firebase**: An active Project setup
 
 ### Installation
 1. **Frontend Dependencies**
    ```bash
    npm install
    ```
 
 2. **ML Server Setup (Optional)**
    ```bash
    cd ml-server
    pip install -r requirements.txt
    python solar_weather_api.py
    ```
 
 3. **Environment Setup**
    Create a `.env.local` file in the root directory and add the template keys provided in our system documentation.
 
 4. **Run the development server**
    ```bash
    cd ..
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔮 Future Improvements

- **Real-time charger booking system**: Directly reserve spots through the platform.
- **Mobile app version (React Native)**: Bringing InfraCharge to andriod and iOS.
- **Advanced ML model**: More granular demand prediction using local traffic APIs.
- **OEM Integration**: Direct connectivity with EV manufacturers' vehicle APIs.

---

## 👨‍💻 Author

**Dhanraj Kumar**  
*Passionate about building practical AI solutions for sustainability and mobility.*

---

## 📊 Real-World Impact
InfraCharge aims to contribute to **Faster EV Adoption**, **Smarter Infrastructure Investment**, and **Sustainable Smart City Planning**. Join us in shaping the future of electric mobility! 🚀
