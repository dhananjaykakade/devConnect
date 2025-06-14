// src/api/auth.ts
import  {api}  from "@/lib//axios";
export async function refreshSession() {
  const res = await api.get("/auth/refresh");
  if (res.status !== 200) {
    throw new Error("Failed to refresh session");
  } 
  return res.data.user;
}