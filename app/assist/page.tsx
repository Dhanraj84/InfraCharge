"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import AssistMap from "@/app/(components)/AssistMap";
import { 
  AlertTriangle, Navigation, MapPin, Activity, 
  MessageSquareWarning, Camera, Clock, Zap, Target,
  CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";

/* ============================
   DISTANCE CALCULATION
============================ */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in km
}

/* ============================
   MAIN PAGE DASHBOARD
============================ */
export default function Assist() {
  const { user } = useAuth();
  
  // Tab State (Find Help removed based on instructions)
  const [activeTab, setActiveTab] = useState<"report" | "live_status">("report");

  // Reporting States
  const [message, setMessage] = useState("");
  const [issueType, setIssueType] = useState("charger_issue");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [radius, setRadius] = useState(20);

  /* LIVE LOCATION */
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* LIVE REPORT LISTENER */
  useEffect(() => {
    const q = query(collection(db, "assistReports"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Expiry filter (reports expire after 2 hours)
      data = data.filter((r: any) => r.expiresAt?.seconds ? r.expiresAt.seconds * 1000 > now : true);

      // Radius filter
      if (userLocation) {
        data = data.filter((r: any) => {
          if (!r.location) return false;
          return getDistanceKm(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng) <= radius;
        });
      }
      setReports(data);
    });
    return () => unsub();
  }, [userLocation, radius]);

  const submitReport = async () => {
    if (!user || !userLocation) return;
    setLoading(true);

    let finalMessage = message.trim();
    if (!finalMessage) {
        finalMessage = issueOptions.find(opt => opt.id === issueType)?.label || "Reported an issue";
    }

    await addDoc(collection(db, "assistReports"), {
      uid: user.uid,
      userName: user.displayName || user.email || "Anon EV Driver",
      userPhoto: user.photoURL || null,
      type: issueType,
      message: finalMessage,
      location: userLocation,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // expires in 2 hours
    });

    setMessage("");
    setLoading(false);
    setActiveTab("live_status"); // Automatically switch to live status after reporting
  };

  // Issue Options mapping
  const issueOptions = [
    { id: "charger_issue", label: "Charger Not Working", icon: "🔌", color: "text-red-500 border-red-500/30 bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]" },
    { id: "congestion", label: "Long Waiting Time", icon: "⏳", color: "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]" },
    { id: "payment_issue", label: "Payment Issue", icon: "💳", color: "text-purple-500 border-purple-500/30 bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]" },
    { id: "cable_damaged", label: "Cable Damaged", icon: "⚡", color: "text-orange-500 border-orange-500/30 bg-orange-500/10 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]" },
  ];

  /* DYNAMIC LIVE STATS CALCULATION */
  const busyCount = reports.filter(r => r.type === "congestion").length;
  const faultCount = reports.filter(r => r.type === "charger_issue" || r.type === "cable_damaged").length;
  // Available chargers is a mocked dynamic number assuming ~15 base stations nearby
  const availableCount = Math.max(0, 15 - busyCount - faultCount); 
  const reliabilityScore = Math.max(0, 100 - (faultCount * 5) - (busyCount * 2));

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 text-text">
      
      <div className="flex items-center gap-2 mb-2">
         <h1 className="text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
           Assist Network
         </h1>
      </div>

      {/* 1. SMART ALERT BANNER */}
      {(busyCount > 1 || faultCount > 0) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500 flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
          <p className="font-bold text-sm text-primary">
            ⚠ High traffic or faulty chargers detected nearby. Recommended to check Live Status before routing.
          </p>
        </div>
      )}

      {/* 2. SPLIT SCREEN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* LEFT: SMART MAP */}
        <div className="w-full lg:w-[60%] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[450px] rounded-xl overflow-hidden relative shadow-lg border border-border flex-shrink-0">
           
           {/* LIVE MAP ACTIVE BADGE - SUPER STRICT INLINE STYLES */}
           <div 
             style={{ 
               position: 'absolute', top: '16px', left: '16px', zIndex: 50, 
               display: 'flex', alignItems: 'center', gap: '8px', 
               backgroundColor: '#ffffff', padding: '8px 12px', 
               borderRadius: '12px', border: '1px solid #d1d5db', 
               boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
             }}
           >
             <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></div>
             <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#000000', letterSpacing: '0.05em' }}>LIVE MAP</span>
           </div>
           
           {/* Tooltip legend - SUPER STRICT INLINE STYLES */}
           <div 
             style={{ 
               position: 'absolute', bottom: '16px', right: '16px', zIndex: 50, 
               display: 'flex', flexDirection: 'column', gap: '8px',
               backgroundColor: '#ffffff', padding: '12px', 
               borderRadius: '12px', border: '1px solid #d1d5db',
               boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
               minWidth: '120px'
             }}
           >
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
               <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Available
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
               <span style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span> Faulty
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
               <span style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '50%', display: 'inline-block' }}></span> Busy
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#000000', borderTop: '1px solid #d1d5db', paddingTop: '8px', marginTop: '4px' }}>
               <span style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'inline-block', border: '1px solid #9ca3af' }}></span> You
             </div>
           </div>
           
           <AssistMap reports={reports} userLocation={userLocation} />
        </div>

        {/* RIGHT: TAB PANEL */}
        <div className="w-full lg:w-[40%] bg-card/60 backdrop-blur-md rounded-xl border border-border shadow-xl flex flex-col h-auto lg:h-[450px]">
          
          {/* TAB HEADER */}
          <div className="flex items-center justify-between bg-bg/50 p-1.5 m-3 rounded-xl border border-border">
            {[
              { id: "report", label: "Report Issue", icon: <MessageSquareWarning className="w-4 h-4"/> },
              { id: "live_status", label: "Live Status", icon: <Activity className="w-4 h-4"/> }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300
                  ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted hover:bg-white/5 hover:text-text'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT CONTAINER */}
          <div className="p-5 flex-1 overflow-y-auto no-scrollbar">

            {/* A. REPORT ISSUE TAB */}
            {activeTab === "report" && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquareWarning className="w-5 h-5 text-red-500"/> What's the problem?
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {issueOptions.map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => setIssueType(opt.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${issueType === opt.id ? `${opt.color} scale-105 shadow-md` : 'bg-bg border-border text-muted hover:bg-white/5'}`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-xs font-bold leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-primary ml-1 uppercase tracking-wider">Additional Details (Optional)</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide any specific details or station number..."
                    className="w-full p-4 rounded-xl bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 shadow-inner min-h-[90px] transition-all resize-none"
                  />
                </div>

                {/* Auto Detection UI */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span className="opacity-80">Location Auto-Detected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="opacity-80">Just Now</span>
                  </div>
                </div>

                {/* Removed Evidence upload placeholder per instructions */}

                <button 
                  onClick={submitReport}
                  disabled={loading || !userLocation}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold tracking-wide shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? "Submitting securely..." : "Broadcast Issue Alert"}
                </button>
                {!userLocation && <p className="text-center text-xs text-red-500 font-bold mt-2">Location access required to report.</p>}
              </div>
            )}

            {/* B. LIVE STATUS TAB */}
            {activeTab === "live_status" && (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  
                  {/* Live Stats Panel */}
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-blue-500"/> Network Diagnostics
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-bg p-3 rounded-xl border border-border text-center">
                        <p className="text-xl font-black text-emerald-500">{availableCount}</p>
                        <p className="text-[10px] font-bold text-muted uppercase">Available</p>
                      </div>
                      <div className="bg-bg p-3 rounded-xl border border-border text-center">
                        <p className="text-xl font-black text-amber-500">{busyCount}</p>
                        <p className="text-[10px] font-bold text-muted uppercase">Busy</p>
                      </div>
                      <div className="bg-bg p-3 rounded-xl border border-border text-center">
                        <p className="text-xl font-black text-red-500">{faultCount}</p>
                        <p className="text-[10px] font-bold text-muted uppercase">Faulty</p>
                      </div>
                    </div>
                  </div>

                  {/* Reliability Indicator */}
                  <div className="bg-bg p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-end mb-2">
                       <div>
                         <p className="text-xs font-bold text-muted uppercase tracking-wider">Station Reliability</p>
                         <h3 className="text-md font-bold text-primary">{reliabilityScore}% Uptime</h3>
                       </div>
                       <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded font-bold">Good</span>
                    </div>
                    <div className="w-full bg-card h-2 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ width: `${reliabilityScore}%` }}></div>
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="pb-4">
                    <div className="flex justify-between items-center mb-3">
                       <h2 className="text-lg font-bold flex items-center gap-2">
                         <RefreshCw className="w-4 h-4 text-muted animate-spin-slow"/> Live Reports Feed
                       </h2>
                       <span className="text-xs font-bold bg-primary px-2 py-0.5 rounded text-primary-foreground shadow-sm">{reports.length} Active</span>
                    </div>

                    <div className="space-y-2">
                      {reports.length === 0 ? (
                        <div className="text-center p-6 border border-dashed border-border rounded-xl">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-bold opacity-50 text-muted">No issues reported nearby.</p>
                        </div>
                      ) : (
                        reports.map((report) => {
                          const isWarning = report.type !== "charger_issue" && report.type !== "cable_damaged";
                          const dotColor = isWarning ? "bg-amber-500" : "bg-red-500";
                          const glow = isWarning ? "hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-500/30" : "hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/30";
                          
                          // Format time ago
                          const rTime = report.createdAt?.toDate ? report.createdAt.toDate().getTime() : Date.now();
                          const minsAgo = Math.max(1, Math.floor((Date.now() - rTime) / 60000));
                          const timeString = minsAgo > 60 ? `${Math.floor(minsAgo/60)}hr ago` : `${minsAgo} min ago`;

                          return (
                            <div key={report.id} className={`bg-bg p-3 rounded-xl border border-border ${glow} transition-colors group flex items-start gap-3 cursor-pointer`}>
                              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 relative`}>
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${dotColor}`}></div>
                                <div className={`relative w-full h-full rounded-full ${dotColor}`}></div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-bold text-sm text-text capitalize">{report.type.replace('_', ' ')}</h4>
                                  <span className="text-[10px] text-muted font-bold tracking-wider">{timeString}</span>
                                </div>
                                <p className="text-xs text-muted mt-0.5 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity line-clamp-2">{report.message}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}