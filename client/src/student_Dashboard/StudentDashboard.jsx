import React from 'react'
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div>
      <button className='bg-blue-500 text-white ml-[1110px] mt-4 px-4 py-2 rounded-lg hover:bg-blue-600 transition' onClick={logout}>
        Logout
      </button>
      <h1 className='text-3xl font-bold text-center mt-10'>Welcome to the Student Dashboard</h1>
      <p className='text-center mt-4 text-gray-600'>This is where students can view their profile, manage applications, and access resources.</p>
      
    </div>
  )
}
