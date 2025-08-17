"use client";

import { IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WorldIDButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (result: ISuccessResult) => {
    console.log("Verification successful:", result);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      const data = await response.json();
      
      if (data.success) {
        // Сохраняем в localStorage
        localStorage.setItem("world_id", result.nullifier_hash);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        
        // Переходим на страницу профиля
        router.push("/profile");
      } else {
        alert("Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IDKitWidget
      app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID || ""}
      action={process.env.NEXT_PUBLIC_WORLD_ACTION_ID || "verify"}
      onSuccess={handleVerify}
      onError={(error) => console.error("World ID Error:", error)}
      signal="login_to_tootfm"
      credential_types={["orb", "phone"]}
      enableTelemetry
    >
      {({ open }) => (
        <button
          onClick={open}
          disabled={isLoading}
          className="bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
        >
          <span className="text-2xl">🌐</span>
          {isLoading ? "Verifying..." : "Sign in with World ID"}
        </button>
      )}
    </IDKitWidget>
  );
}
