import React from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import { getRoleDashboardPath } from './roleRoutes'

export default function PublicRoute({ children }) {
    const {user}=useAuth();
    if(user && user.token) return <Navigate to={getRoleDashboardPath(user.result.role)} replace />
  return children;
}
