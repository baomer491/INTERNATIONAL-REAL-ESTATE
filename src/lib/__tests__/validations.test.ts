import { describe, it, expect } from 'vitest';
import { loginSchema, bankSchema, beneficiarySchema, employeeSchema, taskSchema, validate } from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({ username: 'admin', password: 'secret123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty username', () => {
      const result = loginSchema.safeParse({ username: '', password: 'secret123' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ username: 'admin', password: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('bankSchema', () => {
    it('should validate a bank with only required name', () => {
      const result = bankSchema.safeParse({ name: 'Bank Muscat' });
      expect(result.success).toBe(true);
    });

    it('should reject bank without name', () => {
      const result = bankSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = bankSchema.safeParse({ name: 'Test Bank', email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('should accept empty string email', () => {
      const result = bankSchema.safeParse({ name: 'Test Bank', email: '' });
      expect(result.success).toBe(true);
    });

    it('should accept valid email', () => {
      const result = bankSchema.safeParse({ name: 'Test Bank', email: 'info@bank.com' });
      expect(result.success).toBe(true);
    });
  });

  describe('beneficiarySchema', () => {
    it('should validate correct beneficiary data', () => {
      const result = beneficiarySchema.safeParse({
        fullName: 'Ahmed Al-Rashid',
        relation: 'owner',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty fullName', () => {
      const result = beneficiarySchema.safeParse({
        fullName: '',
        relation: 'owner',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid relation', () => {
      const result = beneficiarySchema.safeParse({
        fullName: 'Ahmed',
        relation: 'invalid_relation',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid relations', () => {
      const relations = ['owner', 'buyer', 'bank_client', 'legal_representative', 'other'];
      for (const relation of relations) {
        const result = beneficiarySchema.safeParse({ fullName: 'Test', relation });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('employeeSchema', () => {
    it('should validate correct employee data', () => {
      const result = employeeSchema.safeParse({
        fullName: 'John Doe',
        username: 'johndoe',
        password: 'secret123',
        role: 'admin',
      });
      expect(result.success).toBe(true);
    });

    it('should reject username shorter than 3 chars', () => {
      const result = employeeSchema.safeParse({
        fullName: 'John',
        username: 'ab',
        password: 'secret123',
        role: 'admin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 6 chars', () => {
      const result = employeeSchema.safeParse({
        fullName: 'John',
        username: 'johndoe',
        password: '12345',
        role: 'admin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const result = employeeSchema.safeParse({
        fullName: 'John',
        username: 'johndoe',
        password: 'secret123',
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('taskSchema', () => {
    it('should validate correct task data', () => {
      const result = taskSchema.safeParse({
        title: 'Review report',
        priority: 'high',
        dueDate: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = taskSchema.safeParse({
        title: '',
        priority: 'high',
        dueDate: '2025-12-31',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const result = taskSchema.safeParse({
        title: 'Test',
        priority: 'urgent',
        dueDate: '2025-12-31',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty due date', () => {
      const result = taskSchema.safeParse({
        title: 'Test',
        priority: 'high',
        dueDate: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validate() helper', () => {
    it('should return success with data for valid input', () => {
      const result = validate(loginSchema, { username: 'admin', password: 'pass123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ username: 'admin', password: 'pass123' });
      }
    });

    it('should return errors object for invalid input', () => {
      const result = validate(loginSchema, { username: '', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(Object.keys(result.errors!).length).toBeGreaterThan(0);
      }
    });
  });
});
