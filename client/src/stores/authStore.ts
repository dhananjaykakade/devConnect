import { create } from "zustand";
import { refreshSession } from "@/api/auth"; // Adjust the import path as needed

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  remember: boolean;
  sessionChecked: boolean;

  // Actions
  checkAuth: () => Promise<void>;
  login: (user: User, remember: boolean) => Promise<void>;
  logout: () => void;
  setLoading: (value: boolean) => void;
  setSessionChecked: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  remember: false,
  sessionChecked: false,

  setSessionChecked: (value) => set({ sessionChecked: value }),

  login: async (user, remember) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem("auth_user", JSON.stringify(user));
    storage.setItem("auth_remember", String(remember));

    set({
      user,
      isLoggedIn: true,
      remember,
      isLoading: false,
      sessionChecked: true
    });
  },

  logout: () => {
    // Clear storage
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_remember");
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_remember");

    // Clear cookies (frontend can only clear non-http-only cookies)
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    set({
      user: null,
      isLoggedIn: false,
      remember: false,
      sessionChecked: true
    });
  },

  setLoading: (value) => set({ isLoading: value }),

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // First try to refresh session using cookies
      const user = await refreshSession();
      
      if (user) {
        const remember = localStorage.getItem("auth_remember") === "true";
        const storageUser = remember 
          ? localStorage.getItem("auth_user")
          : sessionStorage.getItem("auth_user");
        
        // If we have a user in storage, verify it matches the refreshed user
        if (storageUser && JSON.parse(storageUser).id !== user.id) {
          throw new Error("User mismatch between cookie and storage");
        }

        set({ 
          user,
          isLoggedIn: true,
          isLoading: false,
          sessionChecked: true,
          remember
        });
        return;
      }
      
      // Fallback to storage if no session but storage exists
      const rememberedUser = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
      if (rememberedUser) {
        try {
          const parsedUser = JSON.parse(rememberedUser);
          const remember = localStorage.getItem("auth_remember") === "true";
          
          set({
            user: parsedUser,
            isLoggedIn: true,
            isLoading: false,
            sessionChecked: true,
            remember
          });
          return;
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }

      // No valid session
      set({ 
        user: null,
        isLoggedIn: false,
        isLoading: false,
        sessionChecked: true 
      });
    } catch (error) {
      console.error("Authentication check failed:", error);
      set({ 
        user: null,
        isLoggedIn: false,
        isLoading: false,
        sessionChecked: true
      });
    }
  }
}));