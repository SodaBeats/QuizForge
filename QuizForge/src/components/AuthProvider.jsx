import { createContext, useState } from "react";

//create the shared box that will hold auth-related data
const AuthContext = createContext();

//make component called AuthProvider
//children is a prop = whatever components you wrap inside <AuthProvider>
export function AuthProvider({ children }) {

  //current login token, and function to change token
  //empty default
  const [token, setToken] = useState();

  return (
    
    //any component inside can access token and setToken
    <AuthContext.Provider value={{token, setToken}}>
      {children}
    </AuthContext.Provider>
  );

};