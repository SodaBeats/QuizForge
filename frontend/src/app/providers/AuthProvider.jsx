import {
  createContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingScreen from "../../components/layout/LoadingScreen";
import { configureApiClient } from "../../lib/api.js";
import { authApi } from "../../features/auth/api/auth.api.js";

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
  const location = useLocation();
  // Read via a ref inside silentRefresh so the callback's identity stays tied
  // to [navigate] only — adding `location` to its deps would re-fire the
  // session check on every navigation.
  const locationRef = useRef(location);
  useLayoutEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Logout function to clear token
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("logout failed", err);
    } finally {
      setToken(null);
      navigate("/login");
    }
  }, [navigate]);

  const silentRefresh = useCallback(async () => {
    try {
      // the refresh cookie travels with the request (credentials: include)
      const data = await authApi.refresh();

      setToken(data.accessToken); // Put the new access token in state
      setUserInfo(data.user);

      return data.accessToken; //return the new token for the interceptor
    } catch (error) {
      console.error("Silent refresh failed", error);
      setToken(null);
      // Session check failed: park the user on /login. Carry where they were
      // (deep-link or mid-session expiry) in state.from so LoginPage can send
      // them back after signing in — without this, RequireRole's state.from
      // never fires on a fresh load because the route tree isn't mounted yet.
      // If already on /login, don't navigate at all: navigate's identity
      // changes with the pathname, so this callback re-fires after the
      // redirect above and a second navigate here would replace the entry and
      // wipe the state.from that the first call just set.
      const from = locationRef.current;
      if (from.pathname !== "/login") {
        navigate("/login", { replace: true, state: { from } });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    silentRefresh();
  }, [silentRefresh]);

  // One API client for the whole app (Phase 1.2 / F2, wired app-wide in Phase
  // 2.3): it owns the auth header, the single-flight 401 → refresh → retry
  // flow, and always sends cookies. Feature `api/` modules use it directly.
  const tokenRef = useRef(null);
  // Layout effect so the API client sees the fresh token before child pages'
  // passive effects fire their first query after login.
  useLayoutEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => tokenRef.current,
      refresh: () => silentRefresh(),
      // a failed silentRefresh already logs out on its own (see above),
      // so nothing extra to do here
      onUnauthorized: () => {},
    });
  }, [silentRefresh]);

  // Don't render children until auth check is complete
  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  return (
    //any component inside can access token, setToken, logout, silentRefresh, and userInfo
    <AuthContext.Provider
      value={{
        token,
        setToken,
        userInfo,
        setUserInfo,
        logout,
        silentRefresh,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
