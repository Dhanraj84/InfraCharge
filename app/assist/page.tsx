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

/* ============================
   DISTANCE CALCULATION
============================ */
function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ============================
   REPORT CARD
============================ */
function ReportCard({ report, user, userLocation }: any) {
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(report.message);

  useEffect(() => {
    const q = query(
      collection(db, "assistReports", report.id, "replies"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setReplies(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsub();
  }, [report.id]);

  const distance =
    userLocation && report.location
      ? getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          report.location.lat,
          report.location.lng
        ).toFixed(1)
      : null;

  const deleteReport = async () => {
    await deleteDoc(doc(db, "assistReports", report.id));
  };

  const updateReport = async () => {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "assistReports", report.id), {
      message: editText,
    });
    setEditing(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !user) return;

    await addDoc(
      collection(db, "assistReports", report.id, "replies"),
      {
        uid: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || null,
        message: replyText,
        createdAt: serverTimestamp(),
      }
    );

    setReplyText("");
  };

  const deleteReply = async (replyId: string) => {
    await deleteDoc(
      doc(db, "assistReports", report.id, "replies", replyId)
    );
  };

  const editReply = async (reply: any) => {
    const newMessage = prompt("Edit reply:", reply.message);
    if (!newMessage?.trim()) return;

    await updateDoc(
      doc(db, "assistReports", report.id, "replies", reply.id),
      { message: newMessage }
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex justify-between text-sm opacity-70">
        <span>{report.type}</span>
        <span>
          {report.createdAt?.toDate
            ? report.createdAt.toDate().toLocaleTimeString()
            : ""}
        </span>
      </div>

      {distance && (
        <div className="text-xs text-red-500">
          📍 {distance} km away
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-medium text-sm">{report.userName}</p>

          {editing ? (
            <>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 rounded bg-background border border-border text-sm"
              />
              <div className="flex gap-2">
                <button onClick={updateReport} className="btn btn-primary text-xs">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs opacity-70">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm opacity-80 mt-1">{report.message}</p>
          )}

          {user?.uid === report.uid && !editing && (
            <div className="flex gap-3 text-xs mt-2 opacity-70">
              <button onClick={() => setEditing(true)}>Edit</button>
              <button onClick={deleteReport}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          {replies.map((reply) => (
            <div key={reply.id} className="text-sm bg-background p-2 rounded-lg">
              <span className="font-medium">{reply.userName}</span>
              <p className="opacity-80">{reply.message}</p>

              {user?.uid === reply.uid && (
                <div className="flex gap-3 text-xs mt-1 opacity-70">
                  <button onClick={() => editReply(reply)}>Edit</button>
                  <button onClick={() => deleteReply(reply.id)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {user && (
        <div className="flex gap-2 border-t border-border pt-3">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply..."
            className="flex-1 p-2 rounded-lg bg-background border border-border"
          />
          <button onClick={sendReply} className="btn btn-primary px-4">
            Send
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================
   MAIN PAGE
============================ */
export default function Assist() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [type, setType] = useState("charger_issue");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [radius, setRadius] = useState(20);

  /* LIVE LOCATION */
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* LIVE REPORT LISTENER */
  useEffect(() => {
    const q = query(
      collection(db, "assistReports"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();

      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // expiry filter
      data = data.filter((r: any) =>
        r.expiresAt?.seconds
          ? r.expiresAt.seconds * 1000 > now
          : true
      );

      // radius filter
      if (userLocation) {
        data = data.filter((r: any) => {
          if (!r.location) return false;
          const d = getDistanceKm(
            userLocation.lat,
            userLocation.lng,
            r.location.lat,
            r.location.lng
          );
          return d <= radius;
        });
      }

      setReports(data);
    });

    return () => unsub();
  }, [userLocation, radius]);

  const submitReport = async () => {
    if (!user || !message.trim() || !userLocation) return;

    setLoading(true);

    await addDoc(collection(db, "assistReports"), {
      uid: user.uid,
      userName: user.displayName || user.email,
      userPhoto: user.photoURL || null,
      type,
      message,
      location: userLocation,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    setMessage("");
    setLoading(false);
  };

  const addFakeReport = async () => {
    if (!userLocation) return;

    const randomOffset = () => (Math.random() - 0.5) * 0.02;

    await addDoc(collection(db, "assistReports"), {
      uid: "fake_user_" + Math.floor(Math.random() * 1000),
      userName: "Nearby Driver",
      type: "emergency",
      message: "Need urgent charge nearby.",
      location: {
        lat: userLocation.lat + randomOffset(),
        lng: userLocation.lng + randomOffset(),
      },
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-20">

      {/* FORM */}
      <div className="space-y-6 bg-card border border-border rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-red-500">
          ⚡ InfraCharge Assist Network
        </h1>

        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full p-2 rounded bg-background border border-border"
        >
          <option value={5}>5 km</option>
          <option value={10}>10 km</option>
          <option value={20}>20 km</option>
          <option value={50}>50 km</option>
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-3 rounded-xl bg-background border border-border"
        >
          <option value="charger_issue">⚠ Report Charger Failure</option>
          <option value="congestion">🚗 Report Congestion</option>
          <option value="emergency">🔋 Emergency Charge Request</option>
          <option value="road_block">🚧 Road Block / Accident</option>
        </select>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the situation..."
          className="w-full p-3 rounded-xl bg-background border border-border min-h-[100px]"
        />

        <button
          onClick={submitReport}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>

        <button
          onClick={addFakeReport}
          className="btn btn-outline w-full"
        >
          Add Fake Report (Prototype)
        </button>
      </div>

      {/* MAP */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4">
          Nearby Activity Map
        </h2>
        <AssistMap reports={reports} userLocation={userLocation} />
      </div>

      {/* FEED */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          Live Nearby Reports
        </h2>

        {reports.length === 0 && (
          <p className="opacity-60">No nearby reports.</p>
        )}

        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            user={user}
            userLocation={userLocation}
          />
        ))}
      </div>
    </div>
  );
}