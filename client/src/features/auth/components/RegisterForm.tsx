import { useFormValidation } from "@/hooks/useFormValidation";
import { registerSchema } from "../schema";
import type { RegisterFormData } from "../schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {api} from '@/lib/axios';
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation<RegisterFormData>(registerSchema);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

const onSubmit = async (data: RegisterFormData) => {
  try {
    // Hit the register API (tokens are stored in httpOnly cookies by backend)
    const res = await api.post('/auth/register', data, {
      withCredentials: true, // important for cookies to work
    });

    const { user } = res.data.data;

    // Login the user with only user object, not tokens
    login(user, true); // assume remember me is always true for now

    toast.success('Registered successfully');
    navigate('/profile'); // or wherever post-registration
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Registration failed');
  }
};

  return (
    
    <Card className="w-full max-w-md mx-auto mt-6 shadow-md rounded-2xl">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-center">Create an Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Doe" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="@johndoe" {...register("username")} />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

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

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
