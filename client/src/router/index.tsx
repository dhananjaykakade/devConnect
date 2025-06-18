// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import TestCookies from "@/pages/TestCookies";
import OtherUserProfile from "@/pages/OtherUserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
  path: '/profile/:userId',
  element: <OtherUserProfile />,
},
  {
    path: "/test",
    element: <TestCookies />, // Test endpoint for cookies

  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    element: <ProtectedRoute />, // acts as a wrapper for nested routes
    children: [
      {
        path: "/profile",
        element: <Profile />,
      },
      // Add more protected routes here
    ],
  },
]);
