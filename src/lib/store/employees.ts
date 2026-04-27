'use client';

import type { Employee } from '@/types';
import { cache, db } from './shared';
import { employeeToSnake, mapEmployeeRow } from './mappers';
import { hashPassword } from './auth';

export const employeesStore = {
  getEmployees: (): Employee[] => cache.employees,

  getEmployee: (id: string): Employee | undefined => cache.employees.find((e) => e.id === id),

  addEmployee: async (employee: Employee): Promise<void> => {
    let hashedPw: string;
    try {
      const res = await fetch('/api/auth/hash-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: employee.password }),
      });
      const data = await res.json();
      if (data.success && data.hash) {
        hashedPw = data.hash;
      } else {
        hashedPw = await hashPassword(employee.password);
      }
    } catch {
      hashedPw = await hashPassword(employee.password);
    }
    const empWithHash = { ...employee, password: hashedPw };
    cache.employees.push(empWithHash);
    const row = employeeToSnake(empWithHash);
    row.id = employee.id;
    row.created_at = new Date().toISOString();
    row.updated_at = new Date().toISOString();
    const { error } = await db.from('employees').insert(row);
    if (error) {
      console.error('[store] addEmployee error:', error.message);
      cache.employees = cache.employees.filter(e => e.id !== employee.id);
      throw new Error(error.message);
    }
  },

  updateEmployee: async (id: string, data: Partial<Employee>): Promise<void> => {
    const idx = cache.employees.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const oldValue = { ...cache.employees[idx] };
      let updateData = { ...data };
      if (data.password && !data.password.startsWith('$2b$') && !data.password.startsWith('$2a$') && !data.password.includes(':')) {
        try {
          const res = await fetch('/api/auth/hash-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: data.password }),
          });
          const hashData = await res.json();
          if (hashData.success && hashData.hash) {
            updateData.password = hashData.hash;
          } else {
            updateData.password = await hashPassword(data.password);
          }
        } catch {
          updateData.password = await hashPassword(data.password);
        }
      }
      cache.employees[idx] = { ...cache.employees[idx], ...updateData };
      const row = employeeToSnake(updateData);
      row.updated_at = new Date().toISOString();
      const { error } = await db.from('employees').update(row).eq('id', id);
      if (error) {
        console.error('[store] updateEmployee error:', error.message);
        cache.employees[idx] = oldValue;
        throw new Error(error.message);
      }
    }
  },

  deleteEmployee: async (id: string): Promise<void> => {
    // Check for dependent tasks before deleting
    const { data: dependentTasks, error: checkError } = await db
      .from('tasks')
      .select('id')
      .eq('assigned_to', id)
      .limit(1);
    if (checkError) {
      console.error('[store] deleteEmployee check error:', checkError.message);
      throw new Error('فشل في التحقق من المهام المرتبطة');
    }
    if (dependentTasks && dependentTasks.length > 0) {
      throw new Error('لا يمكن حذف الموظف — توجد مهام مسندة إليه');
    }

    // Also check tasks created by this employee
    const { data: createdTasks, error: checkCreatedError } = await db
      .from('tasks')
      .select('id')
      .eq('created_by', id)
      .limit(1);
    if (checkCreatedError) {
      console.error('[store] deleteEmployee check created_by error:', checkCreatedError.message);
      throw new Error('فشل في التحقق من المهام المرتبطة');
    }
    if (createdTasks && createdTasks.length > 0) {
      throw new Error('لا يمكن حذف الموظف — توجد مهام أنشأها');
    }

    // Delete notifications targeting this employee (cascade)
    const { error: notifDeleteError } = await db
      .from('notifications')
      .delete()
      .eq('target_employee_id', id);
    if (notifDeleteError) {
      console.error('[store] deleteEmployee notifications cleanup error:', notifDeleteError.message);
      throw new Error('فشل في حذف الإشعارات المرتبطة');
    }
    // Also update cache
    cache.notifications = cache.notifications.filter(n => n.targetEmployeeId !== id);

    const deleted = cache.employees.find(e => e.id === id);
    cache.employees = cache.employees.filter((e) => e.id !== id);
    const { error } = await db.from('employees').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteEmployee error:', error.message);
      if (deleted) cache.employees.push(deleted);
      throw new Error(error.message);
    }
  },

  refreshEmployeesFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db.from('employees').select('*');
      if (!error && data) {
        cache.employees = data.map((r: Record<string, unknown>) => mapEmployeeRow(r));
        console.log('[store] refreshEmployeesFromDB: refreshed', cache.employees.length, 'employees');
      } else if (error) {
        console.error('[store] refreshEmployeesFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshEmployeesFromDB exception:', err);
    }
  },

  suspendEmployee: async (id: string, updateFn: (id: string, data: Partial<Employee>) => Promise<void>): Promise<void> => {
    await updateFn(id, { status: 'suspended' });
  },

  activateEmployee: async (id: string, updateFn: (id: string, data: Partial<Employee>) => Promise<void>): Promise<void> => {
    await updateFn(id, { status: 'active' });
  },
};
