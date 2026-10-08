export const roleDashboardPaths = {
  Student: '/student_dashboard',
  'Placement Officer': '/tpo-admin',
  'Department Placement Coordinator': '/department-coordinator',
  Faculty: '/faculty-dashboard',
  'Event Coordinator': '/event-coordinator',
  Admin: '/admin-dashboard',
  'Society Admin': '/society-admin',
};

export const getRoleDashboardPath = (role) => roleDashboardPaths[role] || '/login';
