import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuthStore } from "@/stores/authStore";
import { Navigate } from "react-router-dom";
import { Loader } from "@/components/Loader";

export default function LoginPage() {
   const { isLoggedIn, isLoading } = useAuthStore();



  if (isLoggedIn) return <Navigate to="/" replace />;

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <LoginForm />
    </div>
  );
}
