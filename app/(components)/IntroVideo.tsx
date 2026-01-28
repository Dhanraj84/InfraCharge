"use client";
import { useState, useEffect } from "react";

export default function IntroVideo() {
  const [showVideo, setShowVideo] = useState(true);

  // Hide video on user click or after video ends
  const hideVideo = () => {
    setShowVideo(false);
  };

  // Optional: Automatically hide after video ends
  useEffect(() => {
    const video = document.getElementById("intro-video") as HTMLVideoElement;
    if (video) {
      video.onended = () => setShowVideo(false);
    }
  }, []);

  if (!showVideo) return null;

  return (
    <div
      onClick={hideVideo}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-700"
    >
      <video
        id="intro-video"
        src="/intro.mp4"
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-semibold bg-black/40">
        {/* Tap Anywhere to Continue */}
      </div>
    </div>
  );
}
