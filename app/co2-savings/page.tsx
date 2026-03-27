"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TreePine, Car, Zap, Droplet, Calendar, 
  MapPin, Loader2, Leaf, IndianRupee, ArrowRight,
  Gauge
} from "lucide-react";

export default function CO2Dashboard() {
  const [fuel, setFuel] = useState<"petrol"|"diesel"|"ev">("petrol");
  const [km, setKm] = useState<number|string>("");
  const [freq, setFreq] = useState<"Daily"|"Weekly"|"Monthly">("Daily");
  const [kmpl, setKmpl] = useState(15);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{money:number; co2:number}|null>(null);

  const [hasCalculated, setHasCalculated] = useState(false);

  const onCalc = async () => {
    // If the user tries to calculate EV against EV, savings are null/zero visually.
    if (fuel === "ev") {
      setResult({ money: 0, co2: 0 });
      setHasCalculated(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setHasCalculated(false);

    try {
      const r = await fetch("/api/co2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fuel, km: Number(km), freq, kmpl }),
      }).then(res => res.json());

      setResult(r);
      setHasCalculated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ------------ EXTRAPOLATION LOGIC ------------
  // API result is per MONTH.
  const co2MonthlyGrams = result?.co2 || 0;
  const moneyMonthly = result?.money || 0;

  // Convert to Yearly
  const co2YearlyKg = (co2MonthlyGrams * 12) / 1000;
  const moneyYearly = moneyMonthly * 12;

  // Daily
  const moneyDaily = moneyMonthly / 30;
  const co2DailyKg = co2MonthlyGrams / 30 / 1000;

  // Fuel Saved Calculation
  const tripsPerMonth = freq === "Daily" ? 30 : freq === "Weekly" ? 4 : 1;
  const distanceMonthly = Number(km) * tripsPerMonth;
  const fuelLiterMonthly = distanceMonthly / (kmpl || 1);
  const fuelSavedYearly = fuelLiterMonthly * 12;

  // Real World Impact
  const treesSaved = Math.ceil(co2YearlyKg / 21); // 1 tree absorbs ~21kg Co2/year
  const carsRemoved = (co2YearlyKg / 4600).toFixed(2); // Avg car = 4600kg/yr
  const energyEquivalent = Math.floor(co2YearlyKg * 1.5); // Estimated kWh from displaced fuel

  return (
    <div className="min-h-screen bg-bg text-text pb-20">
      
      {/* 1. HEADER IMPROVEMENT */}
      <div className="max-w-4xl mx-auto pt-8 px-6 text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          Your <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">CO₂ Savings</span>
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mt-1">
          See exactly how much carbon emission and money you save by switching to an EV.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-8">
        
        {/* 2. VEHICLE SELECTION (INTERACTIVE TABS) */}
        <div className="bg-card p-2 rounded-2xl border border-border shadow-md flex items-center justify-between gap-2 max-w-xl mx-auto relative z-10">
          {[
            { id: "petrol", label: "Petrol", icon: "🚗", color: "text-red-500 bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" },
            { id: "diesel", label: "Diesel", icon: "🚙", color: "text-slate-300 bg-slate-500/10 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.3)]" },
          ].map((tab) => {
            const isActive = fuel === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFuel(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 border 
                  ${isActive ? `${tab.color} scale-105` : `text-muted border-transparent hover:bg-white/5`}`}
              >
                <span className="text-xl">{tab.icon}</span> {tab.label}
              </button>
            )
          })}
        </div>

        {/* 3. INPUT SECTION */}
        <div className="card w-full p-4 sm:p-6 md:p-8 rounded-3xl border border-border shadow-[0_0_20px_rgba(255,255,255,0.02)] space-y-6 md:space-y-8 max-w-3xl mx-auto transition-all duration-300 hover:scale-[1.02]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-1">
            {/* Travel Distance */}
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-primary ml-1">Travel Distance</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                <input 
                  type="number"
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  className="w-full p-4 pl-12 rounded-2xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  placeholder="Enter travel distance (km)"
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">km</span>
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-primary ml-1">Frequency</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5 pointer-events-none" />
                <select 
                  value={freq}
                  onChange={e => setFreq(e.target.value as any)}
                  className="w-full p-4 pl-12 rounded-2xl bg-bg border border-border text-text focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer font-medium"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fuel Efficiency Slider */}
          <div className="bg-bg p-6 rounded-2xl border border-border space-y-6">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-primary flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-500" /> Current Fuel Efficiency
              </label>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                {kmpl} km/l
              </span>
            </div>
            
            <input 
              type="range" 
              min={5} 
              max={30} 
              value={kmpl} 
              onChange={e => setKmpl(+e.target.value)} 
              className="w-full accent-emerald-500 h-2 bg-border rounded-lg appearance-none cursor-pointer hover:accent-emerald-400 transition-all"
            />
            
            <div className="flex items-center justify-between text-xs text-muted font-bold tracking-wider">
              <span>LOW EFFICIENCY</span>
              <span className="opacity-50 tracking-[5px]">← • →</span>
              <span>HIGH EFFICIENCY</span>
            </div>
          </div>

          {/* 4. CALCULATE BUTTON */}
          <button 
            onClick={onCalc} 
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold text-lg tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Calculating Impact...</>
            ) : (
              <><Leaf className="w-6 h-6" /> Calculate CO₂ Savings</>
            )}
          </button>
        </div>

        {/* 5. RESULT SECTION */}
        {hasCalculated && result && fuel !== "ev" && (
          <div className="space-y-8 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* A. MAIN RESULTS (BIG NUMBERS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* CO2 Saved Card */}
              <div className="bg-card p-6 rounded-3xl border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500"><Leaf className="w-6 h-6" /></div>
                  <h3 className="text-primary font-bold text-lg">CO₂ Avoided</h3>
                </div>
                <p className="text-5xl font-black text-text tracking-tight mb-1">
                  {co2YearlyKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xl text-muted font-bold">kg</span>
                </p>
                <p className="text-sm text-emerald-500 font-semibold bg-emerald-500/10 inline-block px-2 py-1 rounded">per year</p>
              </div>

              {/* Money Saved Card */}
              <div className="bg-card p-6 rounded-3xl border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.08)] relative overflow-hidden group hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500"><IndianRupee className="w-6 h-6" /></div>
                  <h3 className="text-primary font-bold text-lg">Money Saved</h3>
                </div>
                <p className="text-5xl font-black text-text tracking-tight mb-1">
                  ₹{moneyYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-amber-500 font-semibold bg-amber-500/10 inline-block px-2 py-1 rounded">per year</p>
              </div>

              {/* Fuel Saved Card */}
              <div className="bg-card p-6 rounded-3xl border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.08)] relative overflow-hidden group hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500"><Droplet className="w-6 h-6" /></div>
                  <h3 className="text-primary font-bold text-lg">Fuel Unburnt</h3>
                </div>
                <p className="text-5xl font-black text-text tracking-tight mb-1">
                  {fuelSavedYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xl text-muted font-bold">L</span>
                </p>
                <p className="text-sm text-blue-500 font-semibold bg-blue-500/10 inline-block px-2 py-1 rounded">per year</p>
              </div>

            </div>

            {/* LOWER DASHBOARD - 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* LEFT COL: REAL WORLD IMPACT & COMPARISON */}
              <div className="space-y-6">
                {/* B. REAL WORLD IMPACT */}
                <div className="bg-card p-6 rounded-3xl border border-border shadow-lg">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><TreePine className="w-5 h-5 text-emerald-500" /> Real World Impact</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🌳</div>
                        <div>
                          <p className="font-bold text-text">Trees Saved</p>
                          <p className="text-xs text-muted">Equivalent carbon absorbed</p>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-emerald-500">{treesSaved} trees</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">🚗</div>
                        <div>
                          <p className="font-bold text-text">Pollution Equivalent</p>
                          <p className="text-xs text-muted">Equivalent ICE emissions</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-500 text-right max-w-[160px] leading-tight">You reduced pollution equal to 47% of a petrol car</span>
                    </div>
                  </div>
                </div>

                {/* C. COMPARISON BAR */}
                <div className="bg-card p-6 rounded-3xl border border-border shadow-lg">
                  <h3 className="text-xl font-bold mb-6">Emissions Comparison <span className="text-sm font-normal text-muted">(per year)</span></h3>
                  
                  <div className="space-y-6">
                    {/* ICE Vehicle */}
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className={`capitalize ${fuel === 'petrol' ? 'text-red-500' : 'text-slate-400'}`}>{fuel} Vehicle</span>
                        <span>{co2YearlyKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg</span>
                      </div>
                      <div className="w-full bg-bg h-4 rounded-full overflow-hidden border border-border">
                        <div className={`h-full ${fuel === 'petrol' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-400'}`} style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    {/* EV */}
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-emerald-500 flex items-center gap-1"><Zap className="w-4 h-4"/> EV</span>
                        <span>0 kg 🎉</span>
                      </div>
                      <div className="w-full bg-bg h-4 rounded-full overflow-hidden border border-border">
                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '2%' }}></div> {/* Small sliver just for visibility */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COL: TIME TABLE & CALCULATION */}
              <div className="space-y-6">
                
                {/* D. TIME BASED IMPACT */}
                <div className="bg-card p-6 rounded-3xl border border-border shadow-lg">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-500" /> Impact Over Time</h3>
                  
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-bg border-b border-border text-muted">
                        <tr>
                          <th className="p-4 font-bold">Timeline</th>
                          <th className="p-4 font-bold">Financial</th>
                          <th className="p-4 font-bold">Environmental</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-semibold">
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4">Daily</td>
                          <td className="p-4 text-amber-400">₹{moneyDaily.toFixed(0)}</td>
                          <td className="p-4 text-emerald-400">{co2DailyKg.toFixed(1)} kg</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4">Monthly</td>
                          <td className="p-4 text-amber-500">₹{moneyMonthly.toFixed(0)}</td>
                          <td className="p-4 text-emerald-500">{co2MonthlyGrams > 1000 ? (co2MonthlyGrams/1000).toFixed(1) + ' kg' : co2MonthlyGrams.toFixed(0) + ' g'}</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4">Yearly</td>
                          <td className="p-4 text-amber-500 font-bold">₹{moneyYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="p-4 text-emerald-500 font-bold">{co2YearlyKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* E. CALCULATION BREAKDOWN */}
                <div className="bg-bg p-6 rounded-3xl border border-border border-dashed opacity-80 relative overflow-hidden">
                  <h3 className="text-sm font-bold text-muted mb-4 tracking-widest uppercase">Calculation Baseline</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-muted">Distance Traveled</span>
                    <span className="font-bold text-right">{distanceMonthly} km / mo</span>
                    
                    <span className="text-muted">Fuel Consumed</span>
                    <span className="font-bold text-right">{fuelLiterMonthly.toFixed(1)} L / mo</span>
                    
                    <span className="text-muted">Avg Fuel Price</span>
                    <span className="font-bold text-right">₹{fuel === 'petrol' ? 110 : 95} / L</span>
                  </div>
                </div>

                {/* 7. CTA INTEGRATION */}
                <Link href="/find-charging" className="block mt-4 hover:-translate-y-1 transition-transform">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-between group">
                    <div>
                      <h4 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">🚀 Ready to switch?</h4>
                      <p className="text-sm text-muted">Find nearby charging stations instantly.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>

              </div>
            </div>

          </div>
        )}

        {/* ZERO SAVINGS UI IF EV TAB IS SELECTED */}
        {hasCalculated && fuel === "ev" && (
           <div className="mt-16 p-8 bg-card border border-emerald-500/30 rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex flex-col items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                <Leaf className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">You're Already Driving Green!</h3>
              <p className="text-muted max-w-lg mx-auto">
                Comparing an EV to an EV yields zero additional savings. You are already making a massive positive impact on the environment every day.
              </p>
           </div>
        )}

      </div>
    </div>
  );
}
