import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema } from "../schema";
import type { LoginFormData } from "../schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from '@/lib/axios';
import { useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation<LoginFormData>(loginSchema);

  const [rememberMe, setRememberMe] = useState(false);

  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isLoading = useAuthStore((s) => s.isLoading);

  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      logout(); // safely clear previous session

      const res = await api.post("/auth/login", data, {
        withCredentials: true,
      });

      const { user } = res.data.data;

      login(user, rememberMe);
      toast.success("Logged in successfully");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="text-center">Loading...</div>;

  return (
    <Card className="w-full max-w-md mx-auto mt-6 shadow-md rounded-2xl">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-center">Login to Your Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm">
              <Checkbox
                id="remember"
                disabled={isSubmitting}
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
