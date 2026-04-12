"use client";

import { useState, Suspense } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { syncUserToFirestore } from "@/lib/userActions";

const getFriendlyErrorMessage = (code: string) => {
  switch (code) {
    case "auth/user-not-found":
      return "You are not registered. Please create an account first.";
    case "auth/wrong-password":
      return "Login failed. Incorrect password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Login cancelled.";
    default:
      return "Login failed. Please check your credentials.";
  }
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailLogin = async () => {
    try {
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync to Firestore
      await syncUserToFirestore(userCredential.user);

      router.push(redirectPath);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      
      // Sync to Firestore
      await syncUserToFirestore(result.user);

      router.push(redirectPath);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-5 bg-white/5 p-8 rounded-2xl backdrop-blur-md border border-white/10">
        <h1 className="text-3xl font-bold text-center text-infra">
          Welcome Back
        </h1>

        <p className="text-sm opacity-70 text-center">
          Login to continue accessing personalized EV insights.
        </p>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl border border-white/20 bg-transparent focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl border border-white/20 bg-transparent focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleEmailLogin}
          className="w-full bg-infra hover:brightness-110 transition p-3 rounded-xl font-semibold text-white"
        >
          Login
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-sm opacity-60">OR</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black p-3 rounded-xl font-semibold hover:bg-gray-200 transition"
        >
          Continue with Google
        </button>

        <div className="flex justify-between text-sm opacity-70">
          <a href="#">Forgot Password?</a>
          <a href="/signup">Create one now</a>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-500">
        <div className="w-10 h-10 border-2 border-infra border-t-transparent rounded-full animate-spin mb-4" />
        <p className="animate-pulse">Loading secure gateway...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}