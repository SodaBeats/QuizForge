import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

//create the shared box that will hold auth-related data
const AuthContext = createContext();
export { AuthContext };

//make component called AuthProvider
//children is a prop = whatever components you wrap inside <AuthProvider>
export function AuthProvider({ children }) {

  //current login token, and function to change token
  //empty default
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    silentRefresh();
  }, []);

  useEffect(()=>{
    console.log('Auth Provider re-rendered');
  });
  
  // Logout function to clear token
  const logout = useCallback(async () => {
    //Tell the backend to delete the HTTP-only cookie
    try{
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST', 
        credentials: 'include' 
      });
    }catch(err){
      console.error('logout fetch failed', err);
    }finally{
      setToken(null); //clear local react state
      navigate('/login'); // Send them home or to login
    }
  }, [navigate]);

  const silentRefresh = useCallback(async () => {
    try {
      // We include 'credentials: include' so the browser 
      // sends the HTTP-only Refresh Cookie to the server
      const response = await fetch('http://localhost:3000/auth/refresh', {
        method: 'POST',
        credentials: 'include', 
      });

      //if the refresh token is also invalid, navigate to login
      if(!response.ok){
        logout();
      }

      const data = await response.json();

      setToken(data.accessToken); // Put the new access token in state
      setUserInfo(data.user);

      return data.accessToken; //return the new token for the interceptor

    } 
    catch (error) {
      console.error("Silent refresh failed", error);
      setToken(null);
      navigate('/login');
    } 
    finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  const authFetch = useCallback(async (url, options = {}) => {
    //get custom headers inside options and add authz
    const headers = {
      ...options.headers,
      'authorization': `Bearer ${token}`,
    };

    //only add JSON content-type if not sending FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    let response = await fetch(url, { ...options, headers });

    // 2. If the token expired (401 error), try to refresh it
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      const newToken = await silentRefresh(); // Call your refresh logic
      
      if (newToken) {
        // Retry with the fresh token
        headers['authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  }, [token, silentRefresh]);

  // Don't render children until auth check is complete
  if (loading) {
    return <LoadingScreen />; // Or your loading component
  }

  return (
    
    //any component inside can access token, setToken, logout, silentRefresh, and authFetch
    <AuthContext.Provider value={{token, setToken, userInfo, setUserInfo, logout, silentRefresh, authFetch}}>
      {children}
    </AuthContext.Provider>
  );

};