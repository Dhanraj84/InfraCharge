"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailLogin = async () => {
    try {
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-5 bg-white/5 p-8 rounded-2xl backdrop-blur-md border border-white/10">
        <h1 className="text-3xl font-bold text-center text-red-500">
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
          className="w-full bg-red-500 hover:bg-red-600 transition p-3 rounded-xl font-semibold"
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