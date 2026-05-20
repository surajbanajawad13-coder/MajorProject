import React from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from './context/AuthContext'

export default function PublicRoute({ children }) {
    const {user}=useAuth();
    if(user && user.token){
        if(user.result.role ==='Student') return <Navigate to={"/student_dashboard"} />
        else if(user.result.role === 'Placement Officer') return <Navigate to={"/tpo-admin"} />
        else if(user.result.role === 'Society Admin') return <Navigate to={"/society-admin"} />
    }
  return children;
}
