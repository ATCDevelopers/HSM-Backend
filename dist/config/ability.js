import { AbilityBuilder, createMongoAbility } from '@casl/ability';
export const defineAbilityFor = (user) => {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    switch (user.role) {
        case 'Admin':
            can('manage', 'all');
            break;
        case 'ClinicManager':
            can('read', 'User');
            can('manage', 'Department');
            can('read', 'Patient');
            can('manage', 'Appointment');
            can('read', 'Consultation');
            can('read', 'Diagnosis');
            can('read', 'Lab_test');
            can('read', 'Prescription');
            can('read', 'Prescription-Items');
            can('read', 'Medicine');
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
            can(['read', 'write'], 'Consultation');
            can('read', 'Diagnosis');
            can('read', 'Lab_test');
            can(['read', 'write'], 'Prescription');
            can(['read', 'write'], 'Prescription-Items');
            can(['read', 'request'], 'Laboratory');
            can(['read', 'prescribe'], 'Pharmacy');
            can('read', 'Report', { userId: user.id });
            break;
        case 'Nurse':
            can(['read', 'update'], 'Patient');
            can('read', 'Appointment');
            can('read', 'Prescription');
            can('read', 'Prescription-Items');
            can(['read', 'write'], 'Vitals');
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
            can('manage', 'Pharmacy');
            can('manage', 'Inventory');
            can('read', 'Report', { userId: user.id });
            break;
        case 'LabTechnician':
            can('read', 'Patient');
            can('manage', 'Diagnosis');
            can('manage', 'Lab_test');
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
            can('read', 'Prescription', { patientId: user.id });
            can('read', 'Prescription-Items', { patientId: user.id });
            can('read', 'Medicine', { patientId: user.id });
            can('read', 'Laboratory', { patientId: user.id });
            can('read', 'Billing', { patientId: user.id });
            break;
        default:
            break;
    }
    return build();
};
