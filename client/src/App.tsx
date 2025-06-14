import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { refreshSession } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { Loader } from "@/components/Loader";

function App() {
  const {
    isLoggedIn,
    isLoading,
    setLoading,
    setSessionChecked,
    login,
    logout,
    sessionChecked,
  } = useAuthStore();

  const checkAuth = async () => {
    setLoading(true);
    
    // First check local storage
    const rememberedUser = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    const remember = localStorage.getItem("auth_remember") === "true";

    if (rememberedUser) {
      try {
        const parsedUser = JSON.parse(rememberedUser);
        login(parsedUser, remember);
        setSessionChecked(true);
        return;
      } catch (e) {
        console.error("Failed to parse user from storage", e);
        localStorage.removeItem("auth_user");
        sessionStorage.removeItem("auth_user");
      }
    }

    // Then check session via cookies
    try {
      const user = await refreshSession();
      if (user) {
        login(user, false);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Session check failed", err);
      logout();
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  };

  useEffect(() => {
    if (!sessionChecked) {
      checkAuth();
    }
  }, [sessionChecked]);

  if (isLoading) return <Loader />;

  return <RouterProvider router={router} />;
}

export default App;