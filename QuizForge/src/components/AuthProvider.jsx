import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

//create the shared box that will hold auth-related data
const AuthContext = createContext();
export { AuthContext };
const backendHost = import.meta.env.VITE_BACKEND_HOST;

//make component called AuthProvider
//children is a prop = whatever components you wrap inside <AuthProvider>
export function AuthProvider({ children }) {
  //current login token, and function to change token
  //empty default
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const refreshPromiseRef = useRef(null);

  // Logout function to clear token
  const logout = useCallback(async () => {
    //Tell the backend to delete the HTTP-only cookie
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_HOST}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("logout fetch failed", err);
    } finally {
      setToken(null); //clear local react state
      navigate("/login"); // Send them home or to login
    }
  }, [navigate]);

  const silentRefresh = useCallback(async () => {
    try {
      // We include 'credentials: include' so the browser
      // sends the HTTP-only Refresh Cookie to the server
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_HOST}/auth/refresh`,
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
    if (!backendHost) {
      console.error("Missing VITE_BACKEND_HOST env variable");
      setLoading(false);
      navigate("/error");
      return;
    }
    silentRefresh();
  }, [silentRefresh, navigate]);

  const authFetch = useCallback(
    async (url, options = {}) => {
      try {
        //get custom headers inside options and add authz
        const headers = {
          ...options.headers,
          authorization: `Bearer ${token}`,
        };

        //only add JSON content-type if not sending FormData
        if (!(options.body instanceof FormData)) {
          headers["Content-Type"] = "application/json";
        }

        let response = await fetch(url, { ...options, headers });

        // 2. If the token expired (401 error), try to refresh it
        if (response.status === 401) {
          console.log("Token expired, attempting to refresh...");

          // prevent multiple simultaneous refresh calls
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = silentRefresh().finally(() => {
              refreshPromiseRef.current = null;
            });
          }
          const newToken = await refreshPromiseRef.current; // Call your refresh logic

          if (newToken) {
            // Retry with the fresh token
            headers["authorization"] = `Bearer ${newToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            throw new Error("Session expired");
          }
        }

        return response;
      } catch (error) {
        console.error("authFetch error: ", error);
        throw error;
      }
    },
    [token, silentRefresh],
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
