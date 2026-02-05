import { createContext, useState, useEffect } from "react";

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

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        // We include 'credentials: include' so the browser 
        // sends the HTTP-only Refresh Cookie to the server
        const response = await fetch('http://localhost:3000/auth/refresh', {
          method: 'POST',
          credentials: 'include', 
        });

        if (response.ok) {
          const data = await response.json();
          setToken(data.accessToken); // Put the new access token in state
        }
      } catch (error) {
        console.error("Silent refresh failed", error);
      } finally {
        setLoading(false);
      }
    };

    silentRefresh();
  }, []);

  // Logout function to clear token
  const logout = async () => {
    //Tell the backend to delete the HTTP-only cookie
    await fetch('http://localhost:3000/api/logout', { 
      method: 'POST', 
      credentials: 'include' 
    });

    // 2. Clear the local state
    setToken(null);
  };

  // Don't render children until auth check is complete
  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    
    //any component inside can access token and setToken
    <AuthContext.Provider value={{token, setToken, logout}}>
      {children}
    </AuthContext.Provider>
  );

};