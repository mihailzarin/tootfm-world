"use client";

import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import { useState } from "react";

interface WorldIDButtonProps {
  onVerified?: (proof: any) => void;
}

export default function WorldIDButton({ onVerified }: WorldIDButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (proof: any) => {
    console.log("World ID proof received:", proof);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/world-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proof),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Verification successful:", data);
        
        if (data.worldId) {
          localStorage.setItem("world_id", data.worldId);
          document.cookie = `world_id=${data.worldId}; path=/`;
        }
        
        if (onVerified) {
          onVerified(data);
        }
      } else {
        console.error("Verification failed");
      }
    } catch (error) {
      console.error("Error verifying World ID:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Type assertion для app_id
  const appId = process.env.NEXT_PUBLIC_WORLD_APP_ID || "app_staging_placeholder";
  const actionId = process.env.NEXT_PUBLIC_WORLD_ACTION_ID || "verify";

  return (
    <IDKitWidget
      app_id={appId as `app_${string}`}
      action={actionId}
      onSuccess={handleVerify}
      onError={(error) => console.error("World ID Error:", error)}
      verification_level={VerificationLevel.Device}
    >
      {({ open }) => (
        <button
          onClick={open}
          disabled={isVerifying}
          className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <span className="animate-spin">⚪</span>
              Verifying...
            </>
          ) : (
            <>
              <span>🌐</span>
              Verify with World ID
            </>
          )}
        </button>
      )}
    </IDKitWidget>
  );
}
