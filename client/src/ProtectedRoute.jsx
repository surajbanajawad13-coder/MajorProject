import React from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import { getRoleDashboardPath } from './roleRoutes'

const ProtectedRoute = ({ children, allowedRole }) => {

    const { user}=useAuth();
    if(!user || !user.token){
        return <Navigate to={"/login"} />
    }
    const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if(!allowedRoles.includes(user.result.role)){
        return <Navigate to={getRoleDashboardPath(user.result.role)} replace />
    }
  return children;
}

export default ProtectedRoute
