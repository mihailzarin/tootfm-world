'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

// Динамический импорт IDKit для избежания SSR проблем
const IDKitWidget = dynamic(
  () => import('@worldcoin/idkit').then((mod) => mod.IDKitWidget),
  { ssr: false }
);

export default function WorldIDButton() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (proof: any) => {
    console.log("Proof received:", proof);
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/world/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proof),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (response.ok && data.success) {
        setIsVerified(true);
        localStorage.setItem("world_verified", "true");
        localStorage.setItem("world_id", proof.nullifier_hash);
        
        setTimeout(() => {
          router.push("/create-session");
        }, 1500);
      } else {
        console.error("Verification failed:", data);
        alert("Ошибка верификации. Попробуйте еще раз.");
      }
    } catch (error) {
      console.error("Request failed:", error);
      alert("Ошибка соединения. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error("World ID Widget error:", error);
  };

  if (isVerified) {
    return (
      <div className="px-8 py-4 bg-green-600 text-white font-semibold rounded-full flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        Verified with World ID
      </div>
    );
  }

  const appId = "app_staging_9fe80b92e76a0c135f19f1210d9a3964";
  const actionId = "verify";

  return (
    <IDKitWidget
      app_id={appId}
      action={actionId}
      onSuccess={handleVerify}
      onError={handleError}
      signal="tootfm_login"
      enableTelemetry
    >
      {({ open }) => (
        <button
          onClick={open}
          disabled={isLoading}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" opacity="0.3"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          {isLoading ? "Connecting..." : "Sign in with World ID"}
        </button>
      )}
    </IDKitWidget>
  );
}