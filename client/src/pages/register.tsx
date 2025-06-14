import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useAuthStore } from "@/stores/authStore";
import { Navigate } from "react-router-dom";
import { Loader } from "@/components/Loader";

export default function RegisterPage() {

     const { isLoggedIn, isLoading } = useAuthStore();


   if (!isLoggedIn && isLoading) return <Loader />;
  if (isLoggedIn) return <Navigate to="/" replace />;
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <RegisterForm />
    </div>
  );
}
