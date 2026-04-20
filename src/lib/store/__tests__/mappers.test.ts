import { describe, it, expect } from 'vitest';
import {
  mapEmployeeRow,
  employeeToSnake,
  mapBankRow,
  bankToSnake,
  mapBeneficiaryRow,
  beneficiaryToSnake,
  mapReportRow,
  reportToSnake,
  mapNotificationRow,
  notificationToSnake,
  mapTaskRow,
  taskToSnake,
  mapLoginLogRow,
  loginLogToSnake,
  mapSettingsRow,
  settingsToSnake,
} from '@/lib/store/mappers';

// ===== Employee Mappers =====

describe('mapEmployeeRow (snake_case → camelCase)', () => {
  it('should map all snake_case fields to camelCase', () => {
    const row = {
      id: 'emp-1',
      full_name: 'Ahmed Al-Rashid',
      username: 'ahmed',
      password_hash: '$2b$10$hash',
      email: 'ahmed@test.com',
      phone: '+96812345678',
      role: 'admin',
      status: 'active',
      avatar: 'avatar.png',
      department: 'Valuation',
      join_date: '2024-01-15',
      last_login: '2024-06-01T10:00:00Z',
      last_logout: '2024-06-01T18:00:00Z',
      is_active_session: true,
      permissions: ['reports.create', 'reports.approve'],
      notes: 'Senior appraiser',
    };

    const emp = mapEmployeeRow(row);
    expect(emp.id).toBe('emp-1');
    expect(emp.fullName).toBe('Ahmed Al-Rashid');
    expect(emp.username).toBe('ahmed');
    expect(emp.password).toBe('$2b$10$hash');
    expect(emp.email).toBe('ahmed@test.com');
    expect(emp.phone).toBe('+96812345678');
    expect(emp.role).toBe('admin');
    expect(emp.status).toBe('active');
    expect(emp.avatar).toBe('avatar.png');
    expect(emp.department).toBe('Valuation');
    expect(emp.joinDate).toBe('2024-01-15');
    expect(emp.lastLogin).toBe('2024-06-01T10:00:00Z');
    expect(emp.lastLogout).toBe('2024-06-01T18:00:00Z');
    expect(emp.isActiveSession).toBe(true);
    expect(emp.permissions).toEqual(['reports.create', 'reports.approve']);
    expect(emp.notes).toBe('Senior appraiser');
  });

  it('should use defaults for missing fields', () => {
    const row = { id: 'emp-2' };
    const emp = mapEmployeeRow(row);
    expect(emp.fullName).toBe('');
    expect(emp.role).toBe('viewer');
    expect(emp.status).toBe('active');
    expect(emp.isActiveSession).toBe(false);
    expect(emp.permissions).toEqual([]);
  });
});

describe('employeeToSnake (camelCase → snake_case)', () => {
  it('should map all camelCase fields to snake_case', () => {
    const emp = {
      fullName: 'Ahmed',
      username: 'ahmed',
      password: 'secret',
      email: 'a@b.com',
      phone: '123',
      role: 'admin' as const,
      status: 'active' as const,
      avatar: 'av.png',
      department: 'Dept',
      joinDate: '2024-01-01',
      lastLogin: null,
      lastLogout: null,
      isActiveSession: false,
      permissions: [],
      notes: '',
    };

    const result = employeeToSnake(emp);
    expect(result.full_name).toBe('Ahmed');
    expect(result.username).toBe('ahmed');
    expect(result.password_hash).toBe('secret');
    expect(result.email).toBe('a@b.com');
    expect(result.phone).toBe('123');
    expect(result.role).toBe('admin');
    expect(result.status).toBe('active');
    expect(result.avatar).toBe('av.png');
    expect(result.department).toBe('Dept');
    expect(result.join_date).toBe('2024-01-01');
    expect(result.last_login).toBeNull();
    expect(result.last_logout).toBeNull();
    expect(result.is_active_session).toBe(false);
    expect(result.permissions).toEqual([]);
    expect(result.notes).toBe('');
  });

  it('should only include defined fields', () => {
    const result = employeeToSnake({ fullName: 'Test' });
    expect(result.full_name).toBe('Test');
    expect(result).not.toHaveProperty('username');
    expect(result).not.toHaveProperty('password_hash');
  });
});

// ===== Bank Mappers =====

describe('mapBankRow', () => {
  it('should map bank row correctly', () => {
    const row = {
      id: 'bank-1',
      name: 'Bank Muscat',
      name_en: 'Bank Muscat',
      logo: 'logo.png',
      is_active: true,
      report_template: 'template1',
      contact_person: 'John',
      phone: '123',
      email: 'bank@test.com',
      address: 'Muscat',
    };
    const bank = mapBankRow(row);
    expect(bank.id).toBe('bank-1');
    expect(bank.name).toBe('Bank Muscat');
    expect(bank.nameEn).toBe('Bank Muscat');
    expect(bank.logo).toBe('logo.png');
    expect(bank.isActive).toBe(true);
    expect(bank.reportTemplate).toBe('template1');
    expect(bank.contactPerson).toBe('John');
    expect(bank.phone).toBe('123');
    expect(bank.email).toBe('bank@test.com');
    expect(bank.address).toBe('Muscat');
  });

  it('should use defaults for missing bank fields', () => {
    const bank = mapBankRow({ id: 'b1' });
    expect(bank.isActive).toBe(true);
    expect(bank.name).toBe('');
    expect(bank.reportTemplate).toBe('');
  });
});

describe('bankToSnake', () => {
  it('should convert bank to snake_case', () => {
    const result = bankToSnake({ nameEn: 'Bank Dhofar', isActive: false, contactPerson: 'Ali' });
    expect(result.name_en).toBe('Bank Dhofar');
    expect(result.is_active).toBe(false);
    expect(result.contact_person).toBe('Ali');
  });
});

// ===== Report Mappers =====

describe('mapReportRow', () => {
  it('should map all report fields from snake_case', () => {
    const row = {
      id: 'r1',
      report_number: 'VER-2024-001',
      bank_id: 'bank-1',
      bank_name: 'Bank Muscat',
      beneficiary_id: 'bn1',
      beneficiary_name: 'Ahmed',
      beneficiary_civil_id: 'CID123',
      beneficiary_phone: '123',
      beneficiary_email: 'a@b.com',
      beneficiary_address: 'Muscat',
      beneficiary_relation: 'owner',
      beneficiary_workplace: 'Company',
      applicant_name: 'Sponsor',
      property_type: 'land',
      property_usage: 'residential',
      property_condition: 'good',
      property_details: { area: 500 },
      documents: [{ id: 'doc1' }],
      extracted_data: { key: 'value' },
      valuation: { amount: 100000 },
      status: 'draft',
      approval: { approvedBy: 'admin' },
      appraiser_id: 'emp-1',
      appraiser_name: 'Ahmed',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      fees: 500,
      notes: 'Test notes',
      purpose_of_valuation: 'banking',
      apartment_details: { floor: 3 },
    };

    const report = mapReportRow(row);
    expect(report.id).toBe('r1');
    expect(report.reportNumber).toBe('VER-2024-001');
    expect(report.bankId).toBe('bank-1');
    expect(report.beneficiaryId).toBe('bn1');
    expect(report.beneficiaryCivilId).toBe('CID123');
    expect(report.propertyType).toBe('land');
    expect(report.propertyUsage).toBe('residential');
    expect(report.fees).toBe(500);
    expect(report.propertyDetails).toEqual({ area: 500 });
  });

  it('should use defaults for missing report fields', () => {
    const report = mapReportRow({ id: 'r2' });
    expect(report.reportNumber).toBe('');
    expect(report.propertyType).toBe('land');
    expect(report.propertyUsage).toBe('residential');
    expect(report.status).toBe('draft');
    expect(report.fees).toBe(0);
    expect(report.propertyDetails).toEqual({});
  });
});

describe('reportToSnake', () => {
  it('should convert empty string IDs to null', () => {
    const result = reportToSnake({
      bankId: '',
      beneficiaryId: '',
      appraiserId: '',
    });
    expect(result.bank_id).toBeNull();
    expect(result.beneficiary_id).toBeNull();
    expect(result.appraiser_id).toBeNull();
  });

  it('should preserve non-empty IDs', () => {
    const result = reportToSnake({
      bankId: 'bank-1',
      beneficiaryId: 'bn-1',
      appraiserId: 'emp-1',
    });
    expect(result.bank_id).toBe('bank-1');
    expect(result.beneficiary_id).toBe('bn-1');
    expect(result.appraiser_id).toBe('emp-1');
  });

  it('should map report fields to snake_case', () => {
    const result = reportToSnake({
      reportNumber: 'VER-2024-001',
      propertyType: 'villa',
      propertyUsage: 'commercial',
      fees: 750,
    });
    expect(result.report_number).toBe('VER-2024-001');
    expect(result.property_type).toBe('villa');
    expect(result.property_usage).toBe('commercial');
    expect(result.fees).toBe(750);
  });
});

// ===== Notification Mappers =====

describe('mapNotificationRow', () => {
  it('should map notification row correctly', () => {
    const row = {
      id: 'n1',
      type: 'report',
      title: 'New report',
      message: 'A new report has been created',
      priority: 'high',
      is_read: true,
      created_at: '2024-01-01',
      related_report_id: 'r1',
      target_employee_id: 'emp-1',
    };
    const notif = mapNotificationRow(row);
    expect(notif.id).toBe('n1');
    expect(notif.type).toBe('report');
    expect(notif.title).toBe('New report');
    expect(notif.isRead).toBe(true);
    expect(notif.relatedReportId).toBe('r1');
  });

  it('should use defaults for missing notification fields', () => {
    const notif = mapNotificationRow({ id: 'n2' });
    expect(notif.type).toBe('system');
    expect(notif.priority).toBe('medium');
    expect(notif.isRead).toBe(false);
  });
});

describe('notificationToSnake', () => {
  it('should convert notification to snake_case with null target for empty string', () => {
    const result = notificationToSnake({ targetEmployeeId: '' });
    expect(result.target_employee_id).toBeNull();
  });
});

// ===== Task Mappers =====

describe('mapTaskRow', () => {
  it('should map task row correctly', () => {
    const row = {
      id: 't1',
      title: 'Review report',
      description: 'Check the valuation',
      priority: 'high',
      status: 'in_progress',
      due_date: '2024-12-31',
      created_at: '2024-01-01',
      assigned_to: 'emp-1',
      assigned_name: 'Ahmed',
      created_by: 'emp-2',
      created_by_name: 'Sara',
      completed_at: null,
      recurrence: 'weekly',
      category: 'reports',
      related_report_id: 'r1',
      related_report_number: 'VER-2024-001',
    };
    const task = mapTaskRow(row);
    expect(task.id).toBe('t1');
    expect(task.title).toBe('Review report');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('in_progress');
    expect(task.dueDate).toBe('2024-12-31');
    expect(task.assignedTo).toBe('emp-1');
    expect(task.recurrence).toBe('weekly');
  });

  it('should use defaults for missing task fields', () => {
    const task = mapTaskRow({ id: 't2' });
    expect(task.priority).toBe('medium');
    expect(task.status).toBe('pending');
    expect(task.recurrence).toBe('none');
    expect(task.category).toBe('general');
  });
});

describe('taskToSnake', () => {
  it('should convert empty string IDs to null', () => {
    const result = taskToSnake({
      assignedTo: '',
      createdBy: '',
      completedAt: '',
    });
    expect(result.assigned_to).toBeNull();
    expect(result.created_by).toBeNull();
    expect(result.completed_at).toBeNull();
  });
});

// ===== LoginLog Mappers =====

describe('mapLoginLogRow', () => {
  it('should map login log row correctly', () => {
    const row = {
      id: 'log-1',
      employee_id: 'emp-1',
      employee_name: 'Ahmed',
      action: 'login',
      timestamp: '2024-01-01T10:00:00Z',
      ip_address: '192.168.1.1',
    };
    const log = mapLoginLogRow(row);
    expect(log.id).toBe('log-1');
    expect(log.employeeId).toBe('emp-1');
    expect(log.employeeName).toBe('Ahmed');
    expect(log.action).toBe('login');
    expect(log.ipAddress).toBe('192.168.1.1');
  });
});

describe('loginLogToSnake', () => {
  it('should convert login log to snake_case', () => {
    const log = {
      id: 'log-1',
      employeeId: 'emp-1',
      employeeName: 'Ahmed',
      action: 'login' as const,
      timestamp: '2024-01-01T10:00:00Z',
      ipAddress: '10.0.0.1',
    };
    const result = loginLogToSnake(log);
    expect(result.employee_id).toBe('emp-1');
    expect(result.employee_name).toBe('Ahmed');
    expect(result.ip_address).toBe('10.0.0.1');
  });
});

// ===== Settings Mappers =====

describe('mapSettingsRow', () => {
  it('should map settings row correctly', () => {
    const row = {
      office_name: 'IREO',
      office_name_en: 'International Real Estate Office',
      logo: 'logo.png',
      report_prefix: 'VER',
      report_next_number: 42,
      default_currency: 'OMR',
      language: 'ar',
      theme: 'light',
      user_name: 'Admin',
      user_role: 'admin',
      user_email: 'admin@test.com',
      user_phone: '123',
      default_fees: 500,
    };
    const settings = mapSettingsRow(row);
    expect(settings.officeName).toBe('IREO');
    expect(settings.officeNameEn).toBe('International Real Estate Office');
    expect(settings.reportNextNumber).toBe(42);
    expect(settings.defaultCurrency).toBe('OMR');
    expect(settings.defaultFees).toBe(500);
  });

  it('should use defaults for missing settings', () => {
    const settings = mapSettingsRow({});
    expect(settings.reportPrefix).toBe('VER');
    expect(settings.reportNextNumber).toBe(1);
    expect(settings.defaultCurrency).toBe('OMR');
    expect(settings.language).toBe('ar');
    expect(settings.defaultFees).toBe(500);
  });
});

describe('settingsToSnake', () => {
  it('should always include updated_at timestamp', () => {
    const result = settingsToSnake({});
    expect(result.updated_at).toBeDefined();
    expect(typeof result.updated_at).toBe('string');
  });

  it('should map settings fields to snake_case', () => {
    const result = settingsToSnake({
      officeName: 'Test Office',
      reportNextNumber: 10,
      defaultFees: 750,
    });
    expect(result.office_name).toBe('Test Office');
    expect(result.report_next_number).toBe(10);
    expect(result.default_fees).toBe(750);
  });
});
