import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Loader } from "@/components/Loader";
import { useEffect } from "react";

export const ProtectedRoute = () => {
  const { isLoggedIn, isLoading, sessionChecked, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn && sessionChecked) {
      // Give one chance to re-check auth if we think we're not logged in
      checkAuth();
    }
  }, [isLoggedIn, sessionChecked, checkAuth]);

  if (isLoading || !sessionChecked) return <Loader />;

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};