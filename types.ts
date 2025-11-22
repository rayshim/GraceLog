export enum Role {
  ADMIN = 'ADMIN', // Church Creator
  CHURCH_LEADER = 'CHURCH_LEADER',
  DEPT_LEADER = 'DEPT_LEADER',
  TEACHER = 'TEACHER',
  PENDING = 'PENDING'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, hashed. Here, simple string.
  role: Role;
  churchId?: string;
  departmentId?: string;
  classId?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  dob: string;
  parentPhone: string;
  address: string;
  notes: string;
  attendance: Record<string, AttendanceStatus>; // date string -> status
}

export interface Church {
  id: string;
  name: string;
  code: string; // Unique code for joining
  adminId: string;
}

export interface Department {
  id: string;
  churchId: string;
  name: string;
  leaderId?: string;
}

export interface ClassGroup {
  id: string;
  departmentId: string;
  name: string;
  teacherId?: string;
}

export interface StatData {
  name: string;
  present: number;
  absent: number;
  rate: number;
}
