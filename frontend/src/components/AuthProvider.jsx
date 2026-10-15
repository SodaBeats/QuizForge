import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";
import { backendHost } from "../lib/env.js";
import { createApiClient } from "../lib/api.js";

//create the shared box that will hold auth-related data
const AuthContext = createContext();
export { AuthContext };

//make component called AuthProvider
//children is a prop = whatever components you wrap inside <AuthProvider>
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Logout function to clear token
  const logout = useCallback(async () => {
    try {
      await fetch(`${backendHost}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("logout fetch failed", err);
    } finally {
      setToken(null);
      navigate("/login");
    }
  }, [navigate]);

  const silentRefresh = useCallback(async () => {
    try {
      // We include 'credentials: include' so the browser
      // sends the HTTP-only Refresh Cookie to the server
      const response = await fetch(
        `${backendHost}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      //if the refresh token is also invalid, navigate to login
      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();

      setToken(data.accessToken); // Put the new access token in state
      setUserInfo(data.user);

      return data.accessToken; //return the new token for the interceptor
    } catch (error) {
      console.error("Silent refresh failed", error);
      setToken(null);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    // the !backendHost check moved to the app entry (main.jsx, Phase 1.1)
    silentRefresh();
  }, [silentRefresh]);

  // One API client for the whole app (Phase 1.2 / F2): it owns the auth
  // header, the single-flight 401 → refresh → retry flow (previously
  // refreshPromiseRef + the authFetch body below), and always sends cookies.
  const tokenRef = useRef(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const apiClientRef = useRef(null);
  if (!apiClientRef.current) {
    apiClientRef.current = createApiClient({
      getAccessToken: () => tokenRef.current,
      refresh: () => silentRefresh(),
      // a failed silentRefresh already logs out on its own (see above),
      // so nothing extra to do here
      onUnauthorized: () => {},
    });
  }

  const authFetch = useCallback(
    (url, options = {}) => apiClientRef.current(url, options),
    [],
  );

  // Don't render children until auth check is complete
  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  return (
    //any component inside can access token, setToken, logout, silentRefresh, and authFetch
    <AuthContext.Provider
      value={{
        token,
        setToken,
        userInfo,
        setUserInfo,
        logout,
        silentRefresh,
        authFetch,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
