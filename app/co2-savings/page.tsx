"use client";
import { useState } from "react";

export default function CO2() {
  const [fuel, setFuel] = useState<"petrol"|"diesel">("petrol");
  const [km, setKm] = useState(0);
  const [freq, setFreq] = useState<"Daily"|"Weekly"|"Monthly">("Daily");
  const [kmpl, setKmpl] = useState(15);
  const [result, setResult] = useState<{money:number; co2:number}|null>(null);

  const onCalc = async () => {
    const r = await fetch("/api/co2", {
      method: "POST",
      body: JSON.stringify({ fuel, km, freq, kmpl }),
    }).then(r=>r.json());
    setResult(r);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Your CO₂ Savings</h1>
        <p className="opacity-90">See how much carbon emission and money you save by driving an EV instead of a petrol or diesel vehicle.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <button onClick={()=>setFuel("petrol")} className={`card ${fuel==="petrol"?"ring-2 ring-current":""}`}>Petrol Vehicle</button>
        <button onClick={()=>setFuel("diesel")} className={`card ${fuel==="diesel"?"ring-2 ring-current":""}`}>Diesel Vehicle</button>
      </div>

      <div className="card grid md:grid-cols-3 gap-3">
        <input type="number" className="p-3 rounded-xl bg-transparent border border-white/20" placeholder="Travel approx (km)" onChange={e=>setKm(+e.target.value)} />
        <select className="p-3 rounded-xl bg-transparent border border-white/20" onChange={e=>setFreq(e.target.value as any)}>
          <option>Daily</option><option>Weekly</option><option>Monthly</option>
        </select>
        <div className="space-y-1">
          <label className="text-sm opacity-80">Set Fuel Efficiency: {kmpl} kmpl</label>
          <input type="range" min={0} max={90} value={kmpl} onChange={e=>setKmpl(+e.target.value)} />
        </div>
      </div>

      <button onClick={onCalc} className="btn btn-primary">Calculate CO₂ Savings</button>

      {result && (
        <div className="card">
          <p>You saved <b>₹{result.money.toFixed(0)}</b> by driving an EV.</p>
          <p>Avoided <b>{result.co2.toFixed(0)} g</b> of CO₂ emissions.</p>
          <p className="mt-2">✅ CO₂ reduction successfully calculated.</p>
        </div>
      )}
    </div>
  );
}
