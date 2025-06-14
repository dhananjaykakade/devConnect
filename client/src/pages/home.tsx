import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/axios";

export default function HomePage() {
  return (
   
<>
    <div className="p-4">
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => {
// Use the logout function from the auth store to clear session and call backend api for logout
          useAuthStore.getState().logout();
          api.post("/auth/logout", {}, { withCredentials: true })
            .then(() => {
              console.log("Logged out successfully");
            })
            .catch((err) => {
              console.error("Logout failed", err);
            } 
          );              
        }}
      >
        Logout
      </button>
    </div>

    <div className="p-4">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => {
          window.location.href = "/login"; // Redirect to login page
        }}
      >
        Login
      </button>
          </div>

        
    <div className="p-4">
      <h1 className="text-3xl font-bold">Welcome to DevConnect 👋</h1>
    </div>
    </>
  );
}
