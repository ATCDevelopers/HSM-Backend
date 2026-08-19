/**
 * Hospital Management System - Frontend Modules Configuration
 *
 * This file defines all available modules for the sidebar navigation.
 * Modules are organized based on the backend database schema and permission matrix.
 *
 * Reference: docs/RE-ENABLE-AUTHENTICATION.md for permission system
 */

export interface Module {
  id: string;
  name: string;
  icon: string;
  path: string;
  description?: string;
  permissions?: string[];
  roles?: string[];
  children?: Module[];
}

export const modules: Module[] = [
  // Dashboard
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'Home',
    path: '/',
    description: 'Overview and statistics',
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'NURSE', 'RECEP', 'PHARM', 'LAB_TECH', 'CASHIER', 'ACCT'],
  },

  // User Management
  {
    id: 'users',
    name: 'User Management',
    icon: 'Users',
    path: '/users',
    description: 'Manage system users and staff',
    permissions: ['users.read', 'users.manage'],
    roles: ['SYS_ADMIN'],
  },

  // Patient Management
  {
    id: 'patients',
    name: 'Patients',
    icon: 'User',
    path: '/patients',
    description: 'Patient records and management',
    permissions: ['patients.read', 'patients.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'NURSE', 'RECEP', 'PHARM', 'LAB_TECH', 'CASHIER'],
  },

  // Appointments
  {
    id: 'appointments',
    name: 'Appointments',
    icon: 'Calendar',
    path: '/appointments',
    description: 'Schedule and manage appointments',
    permissions: ['appointments.read', 'appointments.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'NURSE', 'RECEP'],
  },

  // Medical Records / EMR
  {
    id: 'medical-records',
    name: 'Medical Records',
    icon: 'FileText',
    path: '/medical-records',
    description: 'Electronic medical records and consultations',
    permissions: ['emr.read', 'emr.write'],
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'NURSE'],
  },

  // Laboratory
  {
    id: 'laboratory',
    name: 'Laboratory',
    icon: 'Flask',
    path: '/laboratory',
    description: 'Lab tests and results management',
    permissions: ['laboratory.read', 'laboratory.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'LAB_TECH'],
  },

  // Pharmacy
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    icon: 'Pill',
    path: '/pharmacy',
    description: 'Medicines and prescriptions',
    permissions: ['pharmacy.read', 'pharmacy.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'PHARM'],
  },

  // Billing & Invoices
  {
    id: 'billing',
    name: 'Billing',
    icon: 'DollarSign',
    path: '/billing',
    description: 'Invoices and payments',
    permissions: ['billing.read', 'billing.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'RECEP', 'CASHIER', 'ACCT'],
  },

  // Insurance
  {
    id: 'insurance',
    name: 'Insurance',
    icon: 'Shield',
    path: '/insurance',
    description: 'Insurance companies and patient coverage',
    permissions: ['insurance.read', 'insurance.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'CASHIER', 'ACCT'],
  },

  // Inventory
  {
    id: 'inventory',
    name: 'Inventory',
    icon: 'Package',
    path: '/inventory',
    description: 'Stock and inventory management',
    permissions: ['inventory.read', 'inventory.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'PHARM', 'ACCT'],
  },

  // Wards & Beds
  {
    id: 'wards',
    name: 'Wards & Beds',
    icon: 'Building',
    path: '/wards',
    description: 'Ward and bed management',
    permissions: ['wards.read', 'wards.manage'],
    roles: ['SYS_ADMIN', 'MGR', 'NURSE'],
  },

  // Reports
  {
    id: 'reports',
    name: 'Reports',
    icon: 'BarChart',
    path: '/reports',
    description: 'System reports and analytics',
    permissions: ['reports.read'],
    roles: ['SYS_ADMIN', 'MGR', 'DOC', 'NURSE', 'RECEP', 'PHARM', 'LAB_TECH', 'CASHIER', 'ACCT'],
  },

  // Settings
  {
    id: 'settings',
    name: 'Settings',
    icon: 'Settings',
    path: '/settings',
    description: 'System configuration',
    roles: ['SYS_ADMIN'],
  },
];

/**
 * Get modules accessible to a specific role
 */
export function getModulesByRole(userRole: string): Module[] {
  return modules.filter(module => 
    !module.roles || module.roles.includes(userRole)
  );
}

/**
 * Get modules accessible based on permissions
 */
export function getModulesByPermissions(userPermissions: string[]): Module[] {
  return modules.filter(module => {
    if (!module.permissions) return true;
    return module.permissions.some(perm => userPermissions.includes(perm));
  });
}

/**
 * Check if a module is accessible to the current user
 */
export function canAccessModule(module: Module, userRole?: string, userPermissions?: string[]): boolean {
  // DEV: All modules accessible in development mode
  // Note: Auth is disabled in development via AuthProvider, so all modules are accessible
  // See: docs/RE-ENABLE-AUTHENTICATION.md

  if (userRole && module.roles) {
    return module.roles.includes(userRole);
  }

  if (userPermissions && module.permissions) {
    return module.permissions.some(perm => userPermissions.includes(perm));
  }

  return true;
}
