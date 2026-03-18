import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import LoadingScreen from "./LoadingScreen";

export default function RootRedirector() {

  const { isLoading, userInfo } = useContext(AuthContext);


  if(isLoading){
    return(
      <LoadingScreen />
    );
  }

  if(!userInfo){
    <Navigate to="/login" replace />
  }

  // Send them where they belong based on their role
  return userInfo.role === 'teacher' 
    ? <Navigate to="/teacher" replace /> 
    : <Navigate to="/student" replace />;

};