import { api } from './client';
import type { Employee, EmployeeCreate } from '../types';

export const getEmployees = () => api.get<Employee[]>('/employees');
export const getEmployee = (id: number) => api.get<Employee>(`/employees/${id}`);
export const createEmployee = (data: EmployeeCreate) => api.post<Employee>('/employees', data);
export const updateEmployee = (id: number, data: Partial<EmployeeCreate>) => api.put<Employee>(`/employees/${id}`, data);
export const deleteEmployee = (id: number) => api.delete(`/employees/${id}`);
