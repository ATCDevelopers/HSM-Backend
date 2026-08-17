import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'request' | 'prescribe' | 'write' | 'process';

export type SubjectNames =
  | 'User'
  | 'Patient'
  | 'Appointment'
  | 'EMR'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Billing'
  | 'Insurance'
  | 'Inventory'
  | 'Report';

export type Subjects = 'all' | SubjectNames | Record<string, any>;

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export const defineAbilityFor = (user: { id: string; role: string }): AppAbility => {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (user.role) {
    case 'Admin':
      can('manage', 'all');
      break;

    case 'ClinicManager':
      can('read', 'User');
      can('read', 'Patient');
      can('manage', 'Appointment');
      can('read', 'EMR');
      can('read', 'Laboratory');
      can('read', 'Pharmacy');
      can('read', 'Billing');
      can('manage', 'Insurance');
      can('manage', 'Inventory');
      can('manage', 'Report');
      break;

    case 'Doctor':
      can('manage', 'Patient');
      can('manage', 'Appointment');
      can('manage', 'EMR');
      can(['read', 'request'], 'Laboratory');
      can(['read', 'prescribe'], 'Pharmacy');
      can('read', 'Report', { userId: user.id });
      break;

    case 'Nurse':
      can(['read', 'update'], 'Patient');
      can('read', 'Appointment');
      can(['read', 'write'], 'EMR');
      can('read', 'Report', { userId: user.id });
      break;

    case 'Receptionist':
      can('manage', 'Patient');
      can('manage', 'Appointment');
      can('read', 'Billing');
      can('read', 'Report', { userId: user.id });
      break;

    case 'Pharmacist':
      can('read', 'Patient');
      can('read', 'EMR');
      can('manage', 'Pharmacy');
      can('manage', 'Inventory');
      can('read', 'Report', { userId: user.id });
      break;

    case 'LabTechnician':
      can('read', 'Patient');
      can('manage', 'Laboratory');
      can('read', 'Inventory');
      can('read', 'Report', { userId: user.id });
      break;

    case 'Cashier':
      can('read', 'Patient');
      can('manage', 'Billing');
      can('manage', 'Insurance');
      can('read', 'Report', { category: 'financial' });
      break;

    case 'Accountant':
      can('manage', 'Billing');
      can('manage', 'Insurance');
      can('manage', 'Inventory');
      can('read', 'Report', { category: 'financial' });
      break;

    case 'Patient':
      can('read', 'Patient', { userId: user.id });
      can('manage', 'Appointment', { patientId: user.id });
      can('read', 'EMR', { patientId: user.id });
      can('read', 'Pharmacy', { patientId: user.id });
      can('read', 'Laboratory', { patientId: user.id });
      can('read', 'Billing', { patientId: user.id });
      break;

    default:
      break;
  }

  return build();
};
