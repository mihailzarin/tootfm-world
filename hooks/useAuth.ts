import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const logout = useCallback(() => {
    try {
      signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  }, []);

  const requireAuth = useCallback(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return false;
    }
    return true;
  }, [session, status, router]);

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    logout,
    requireAuth
  };
}