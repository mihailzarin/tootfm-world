import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = () => {
    signIn("google", { callbackUrl: "/profile" });
  };

  const logout = () => {
    signOut({ callbackUrl: "/" });
  };

  const requireAuth = () => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return false;
    }
    return true;
  };

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    login,
    logout,
    requireAuth
  };
}