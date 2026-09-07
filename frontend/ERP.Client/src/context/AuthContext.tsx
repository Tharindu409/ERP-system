import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import api from "../api/axios";

interface User {
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// =========================================================
// Get Role From JWT
// =========================================================

const getTokenRole = (token: string | null): string | undefined => {
  if (!token) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return (
      payload[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] ||
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
      ] ||
      payload.role ||
      payload.Role
    );
  } catch (error) {
    console.error("Unable to read JWT role:", error);
    return undefined;
  }
};

// =========================================================
// Auth Provider
// =========================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      return null;
    }

    let parsedUser: User = {
      username: "",
    };

    if (savedUser) {
      try {
        parsedUser = JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("user");
      }
    }

    const tokenRole = getTokenRole(savedToken);

    return {
      ...parsedUser,
      role: parsedUser.role || tokenRole,
    };
  });

  // =========================================================
  // Login
  // =========================================================

  const login = async (
    username: string,
    password: string
  ) => {
    const response = await api.post("/Auth/login", {
      username,
      password,
    });

    const receivedToken = response.data.token;

    if (!receivedToken) {
      throw new Error("Login response did not contain a token.");
    }

    // Get role from login response first
    // If not available, get it from JWT
    const responseRole =
      response.data.user?.role ||
      response.data.user?.Role;

    const tokenRole = getTokenRole(receivedToken);

    const userRole =
      responseRole || tokenRole;

    const userData: User = {
      username,
      role: userRole,
    };

    localStorage.setItem(
      "token",
      receivedToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    setToken(receivedToken);
    setUser(userData);
  };

  // =========================================================
  // Logout
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  // =========================================================
  // Provider
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================================================
// useAuth Hook
// =========================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};