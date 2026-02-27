"use client";

import { useEffect, useState } from "react";

export default function IntroVideo() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Check if intro already played in this session
    const hasPlayed = sessionStorage.getItem("introPlayed");

    if (!hasPlayed) {
      setShowVideo(true);
    }
  }, []);

  const hideVideo = () => {
    sessionStorage.setItem("introPlayed", "true");
    setShowVideo(false);
  };

  if (!showVideo) return null;

  return (
    <div
      onClick={hideVideo}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <video
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={hideVideo}
        className="w-full h-full object-cover"
      />
    </div>
  );
}