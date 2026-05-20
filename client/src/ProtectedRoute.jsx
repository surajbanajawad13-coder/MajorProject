import React from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'

const ProtectedRoute = ({ children, allowedRole }) => {

    const { user}=useAuth();
    if(!user || !user.token){
        return <Navigate to={"/login"} />
    }
    if(user.result.role !== allowedRole){
        return <Navigate to={"/login"} />
    }
  return children;
}

export default ProtectedRoute