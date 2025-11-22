import { User, Church, Role, Department, ClassGroup, Student, AttendanceStatus } from '../types';

// Initial Mock Data Helpers
const generateId = () => Math.random().toString(36).substr(2, 9);

const MOCK_CHURCH_ID = 'church_001';
const MOCK_ADMIN_ID = 'user_admin';

const initialUsers: User[] = [
  { id: MOCK_ADMIN_ID, name: '김목사', email: 'admin@church.com', password: '123', role: Role.ADMIN, churchId: MOCK_CHURCH_ID },
  { id: 'user_leader', name: '박장로', email: 'sarah@church.com', password: '123', role: Role.CHURCH_LEADER, churchId: MOCK_CHURCH_ID },
  { id: 'user_dept', name: '이부장', email: 'mike@church.com', password: '123', role: Role.DEPT_LEADER, churchId: MOCK_CHURCH_ID, departmentId: 'dept_01' },
  { id: 'user_teacher', name: '최선생', email: 'jane@church.com', password: '123', role: Role.TEACHER, churchId: MOCK_CHURCH_ID, departmentId: 'dept_01', classId: 'class_01' },
];

const initialChurches: Church[] = [
  { id: MOCK_CHURCH_ID, name: '은혜 한인 교회', code: 'GRACE2024', adminId: MOCK_ADMIN_ID }
];

const initialDepts: Department[] = [
  { id: 'dept_01', churchId: MOCK_CHURCH_ID, name: '중고등부', leaderId: 'user_dept' },
  { id: 'dept_02', churchId: MOCK_CHURCH_ID, name: '유초등부', leaderId: '' }
];

const initialClasses: ClassGroup[] = [
  { id: 'class_01', departmentId: 'dept_01', name: '고등부 1반', teacherId: 'user_teacher' },
  { id: 'class_02', departmentId: 'dept_01', name: '고등부 2반', teacherId: '' }
];

const initialStudents: Student[] = [
  { 
    id: 'stu_01', classId: 'class_01', name: '김철수', dob: '2008-05-12', parentPhone: '010-1234-5678', address: '서울시 강남구', notes: '기타 연주 가능',
    attendance: { '2023-10-27': AttendanceStatus.PRESENT, '2023-11-03': AttendanceStatus.ABSENT } 
  },
  { 
    id: 'stu_02', classId: 'class_01', name: '이영희', dob: '2009-02-14', parentPhone: '010-9876-5432', address: '서울시 서초구', notes: '',
    attendance: { '2023-10-27': AttendanceStatus.PRESENT, '2023-11-03': AttendanceStatus.PRESENT } 
  },
];

// Local Storage Wrappers
const getLS = <T>(key: string, def: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : def;
  } catch (e) {
    return def;
  }
};
const setLS = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export const MockService = {
  // --- Auth & User ---
  login: (email: string, pass: string): User | null => {
    const users = getLS<User[]>('users', initialUsers);
    return users.find(u => u.email === email && u.password === pass) || null;
  },

  register: (name: string, email: string, pass: string): User => {
    const users = getLS<User[]>('users', initialUsers);
    // Case-insensitive check for existing email
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("이미 존재하는 이메일입니다.");
    }
    
    const newUser: User = { id: generateId(), name, email, password: pass, role: Role.PENDING }; // No church initially
    setLS('users', [...users, newUser]);
    return newUser;
  },

  updateUser: (updatedUser: User) => {
    const users = getLS<User[]>('users', initialUsers);
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      setLS('users', users);
    }
  },

  getUsersByChurch: (churchId: string): User[] => {
    const users = getLS<User[]>('users', initialUsers);
    return users.filter(u => u.churchId === churchId);
  },

  // --- Church Management ---
  createChurch: (name: string, adminUser: User): Church => {
    const churches = getLS<Church[]>('churches', initialChurches);
    const newChurch: Church = {
      id: generateId(),
      name,
      code: name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000),
      adminId: adminUser.id
    };
    setLS('churches', [...churches, newChurch]);
    
    // Update admin user
    const updatedUser = { ...adminUser, churchId: newChurch.id, role: Role.ADMIN };
    MockService.updateUser(updatedUser);
    
    return newChurch;
  },

  joinChurch: (code: string, user: User) => {
    const churches = getLS<Church[]>('churches', initialChurches);
    const church = churches.find(c => c.code === code);
    if (!church) throw new Error("교회를 찾을 수 없습니다.");
    
    const updatedUser = { ...user, churchId: church.id, role: Role.PENDING };
    MockService.updateUser(updatedUser);
    return updatedUser;
  },

  getChurches: (): Church[] => getLS<Church[]>('churches', initialChurches),
  
  getChurchById: (id: string): Church | undefined => {
    const churches = getLS<Church[]>('churches', initialChurches);
    return churches.find(c => c.id === id);
  },

  // --- Departments & Classes ---
  getDepartments: (churchId: string): Department[] => {
    return getLS<Department[]>('departments', initialDepts).filter(d => d.churchId === churchId);
  },
  
  createDepartment: (dept: Omit<Department, 'id'>) => {
    const depts = getLS<Department[]>('departments', initialDepts);
    const newDept = { ...dept, id: generateId(), leaderId: dept.leaderId || '' };
    setLS('departments', [...depts, newDept]);
    return newDept;
  },

  getClasses: (deptId: string): ClassGroup[] => {
    return getLS<ClassGroup[]>('classes', initialClasses).filter(c => c.departmentId === deptId);
  },

  createClass: (cls: Omit<ClassGroup, 'id'>) => {
    const classes = getLS<ClassGroup[]>('classes', initialClasses);
    const newClass = { ...cls, id: generateId(), teacherId: cls.teacherId || '' };
    setLS('classes', [...classes, newClass]);
    return newClass;
  },

  // --- Students & Attendance ---
  getStudentsByClass: (classId: string): Student[] => {
    return getLS<Student[]>('students', initialStudents).filter(s => s.classId === classId);
  },

  getAllStudentsInChurch: (churchId: string): Student[] => {
     // Helper: find all classes in this church
     const depts = MockService.getDepartments(churchId).map(d => d.id);
     const classes = getLS<ClassGroup[]>('classes', initialClasses).filter(c => depts.includes(c.departmentId)).map(c => c.id);
     return getLS<Student[]>('students', initialStudents).filter(s => classes.includes(s.classId));
  },

  createStudent: (student: Omit<Student, 'id' | 'attendance'>) => {
    const students = getLS<Student[]>('students', initialStudents);
    setLS('students', [...students, { ...student, id: generateId(), attendance: {} }]);
  },

  updateStudent: (student: Student) => {
    const students = getLS<Student[]>('students', initialStudents);
    const idx = students.findIndex(s => s.id === student.id);
    if (idx !== -1) {
      students[idx] = student;
      setLS('students', students);
    }
  },

  markAttendance: (studentId: string, date: string, status: AttendanceStatus) => {
    const students = getLS<Student[]>('students', initialStudents);
    const student = students.find(s => s.id === studentId);
    if (student) {
      student.attendance[date] = status;
      setLS('students', students);
    }
  }
};