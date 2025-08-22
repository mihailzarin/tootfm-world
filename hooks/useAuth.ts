import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = useCallback(() => {
    try {
      signIn("google", { 
        callbackUrl: "/profile",
        redirect: true 
      });
    } catch (error) {
      console.error("❌ Login error:", error);
    }
  }, []);

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
    login,
    logout,
    requireAuth
  };
}