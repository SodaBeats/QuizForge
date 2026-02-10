import { createContext, useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const silentRefresh = async () => {
    try {
      // We include 'credentials: include' so the browser 
      // sends the HTTP-only Refresh Cookie to the server
      const response = await fetch('http://localhost:3000/auth/refresh', {
        method: 'POST',
        credentials: 'include', 
      });

      //if the refresh token is also invalid, navigate to login ----------------------WIP
      //STILL NEED TO DO LOGOUT LOGIC
      if(!response.ok){
        setToken(null);
        navigate('/login');
        alert(data.message);
        return null;
      }

      const data = await response.json();

      setToken(data.accessToken); // Put the new access token in state

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
  };

  useEffect(() => {
    silentRefresh();
  }, []);

  // Logout function to clear token
  const logout = async () => {
    //Tell the backend to delete the HTTP-only cookie
    try{
      await fetch('http://localhost:3000/api/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
    }catch(err){
      console.error('logout fetch failed', err);
    }finally{
      setToken(null); //clear local react state
      navigate('/login'); // Send them home or to login
    }
  };

  // Don't render children until auth check is complete
  if (loading) {
    return <LoadingScreen />; // Or your loading component
  }

  //--------------------------------------------------WIP---------------
  const authFetch = async (url, options = {}) => {
    //get custom headers inside options and add authz
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
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
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  };

  return (
    
    //any component inside can access token and setToken
    <AuthContext.Provider value={{token, setToken, logout, silentRefresh, authFetch}}>
      {children}
    </AuthContext.Provider>
  );

};