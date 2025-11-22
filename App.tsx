import React, { useState, useEffect } from 'react';
import { Layout, getRoleName } from './components/Layout';
import { Auth } from './components/Auth';
import { StatsView } from './components/StatsView';
import { ProfileModal } from './components/ProfileModal';
import { MockService } from './services/mockService';
import { User, Role, Department, ClassGroup, Student, AttendanceStatus, Church } from './types';
import * as XLSX from 'xlsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentChurch, setCurrentChurch] = useState<Church | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalData, setModalData] = useState<{ target: User | Student, isStudent: boolean } | null>(null);
  
  // View Mode for Lists (Staff vs Students)
  const [viewMode, setViewMode] = useState<'staff' | 'students'>('students');

  // Creation Modal State
  const [createModal, setCreateModal] = useState<{ type: 'dept' | 'class' | 'student', isOpen: boolean }>({ type: 'dept', isOpen: false });
  const [createMethod, setCreateMethod] = useState<'manual' | 'excel'>('manual'); // Tab state
  const [newItemName, setNewItemName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Quick hack to refresh data

  const refresh = () => setRefreshTrigger(p => p + 1);

  // Load Data based on Scope
  useEffect(() => {
    if (!currentUser || !currentUser.churchId) return;
    
    // Load Church
    const church = MockService.getChurchById(currentUser.churchId);
    setCurrentChurch(church || null);

    // Only load what is necessary or load all for simplicity in this mock
    setUsers(MockService.getUsersByChurch(currentUser.churchId));
    setDepartments(MockService.getDepartments(currentUser.churchId));
    
    const allStudents = MockService.getAllStudentsInChurch(currentUser.churchId);
    
    // Filter Students View based on role
    let visibleStudents = allStudents;
    if (currentUser.role === Role.TEACHER && currentUser.classId) {
        visibleStudents = MockService.getStudentsByClass(currentUser.classId);
    } else if (currentUser.role === Role.DEPT_LEADER && currentUser.departmentId) {
        // Dept Leader sees only students in their department's classes
        const deptClasses = MockService.getClasses(currentUser.departmentId);
        const deptClassIds = deptClasses.map(c => c.id);
        visibleStudents = allStudents.filter(s => deptClassIds.includes(s.classId));
    }
    setStudents(visibleStudents);

    // Load classes (all classes in church for Admin/Leader context, or dept specific)
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.CHURCH_LEADER) {
       // Get all classes for all departments
       const depts = MockService.getDepartments(currentUser.churchId);
       const allClasses = depts.flatMap(d => MockService.getClasses(d.id));
       setClasses(allClasses);
    } else if (currentUser.departmentId) {
        setClasses(MockService.getClasses(currentUser.departmentId));
    }
    
    // Set default view mode based on role
    if (currentUser.role === Role.TEACHER) {
        setViewMode('students');
    } else {
        // For admins/leaders, keep current viewMode or default to staff if first load? 
        // We leave it controlled by state, but if switching users, maybe reset.
        // For simplicity, we rely on state initialization.
    }

  }, [currentUser, refreshTrigger]);


  // Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Default view mode logic
    if (user.role === Role.TEACHER) setViewMode('students');
    else setViewMode('staff');
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentChurch(null);
    setActiveTab('dashboard');
  };

  const handleUpdateProfile = (data: any) => {
    if (modalData?.isStudent) {
      MockService.updateStudent(data);
    } else {
      MockService.updateUser(data);
    }
    setModalData(null);
    refresh();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 이름: "홍길동", 생년월일: "2010-01-01", 연락처: "010-1234-5678", 주소: "서울시 강남구", 비고: "특이사항" },
      { 이름: "김철수", 생년월일: "2011-05-05", 연락처: "010-9876-5432", 주소: "서울시 서초구", 비고: "" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "학생등록양식");
    XLSX.writeFile(wb, "학생등록_양식.xlsx");
  };

  const handleExcelUpload = async () => {
    if (!excelFile) return;
    
    const targetClassId = currentUser?.classId || selectedClassId;
    if (!targetClassId) {
        alert("학생이 소속될 반을 선택해야 합니다.");
        return;
    }

    try {
        const data = await excelFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let count = 0;
        jsonData.forEach((row: any) => {
            if (row['이름']) {
                MockService.createStudent({
                    name: row['이름'],
                    classId: targetClassId,
                    dob: row['생년월일'] || '',
                    parentPhone: row['연락처'] || '',
                    address: row['주소'] || '',
                    notes: row['비고'] || ''
                });
                count++;
            }
        });
        
        alert(`${count}명의 학생이 성공적으로 등록되었습니다.`);
        setCreateModal({ ...createModal, isOpen: false });
        setExcelFile(null);
        setSelectedClassId('');
        refresh();

    } catch (e) {
        console.error(e);
        alert("파일 처리 중 오류가 발생했습니다. 양식을 확인해주세요.");
    }
  };

  const handleCreateItem = () => {
    if (createModal.type === 'student' && createMethod === 'excel') {
        handleExcelUpload();
        return;
    }

    if(!newItemName.trim()) return;
    
    try {
      if (createModal.type === 'dept' && currentUser?.churchId) {
          MockService.createDepartment({ churchId: currentUser.churchId, name: newItemName });
      } else if (createModal.type === 'class' && currentUser?.departmentId) {
          MockService.createClass({ departmentId: currentUser.departmentId, name: newItemName });
      } else if (createModal.type === 'student') {
          // Determine class ID: Teachers use their assigned class, others must select one
          const targetClassId = currentUser?.classId || selectedClassId;
          
          if (!targetClassId) {
              alert("학생이 소속될 반을 선택해야 합니다.");
              return;
          }

          MockService.createStudent({ 
            name: newItemName, 
            classId: targetClassId, 
            dob: '', parentPhone: '', address: '', notes: '' 
          });
      }
      
      setCreateModal({ ...createModal, isOpen: false });
      setNewItemName('');
      setSelectedClassId('');
      refresh();
    } catch (e) {
      alert('생성 중 오류가 발생했습니다.');
    }
  };

  // --- Render Sections ---

  const renderCreateModal = () => {
    if (!createModal.isOpen) return null;
    
    let title = '';
    let placeholder = '이름을 입력하세요';
    
    if (createModal.type === 'dept') title = '새 부서 생성';
    else if (createModal.type === 'class') title = '새 반 생성';
    else if (createModal.type === 'student') title = '새 학생 등록';

    // Show class selector if creating a student and user is NOT a teacher (since teachers have fixed class)
    const showClassSelect = createModal.type === 'student' && !currentUser?.classId;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                 {createModal.type === 'student' && (
                     <div className="bg-gray-100 p-1 rounded-lg flex text-xs">
                         <button 
                            onClick={() => setCreateMethod('manual')}
                            className={`px-3 py-1 rounded ${createMethod === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                         >
                             직접 입력
                         </button>
                         <button 
                            onClick={() => setCreateMethod('excel')}
                            className={`px-3 py-1 rounded ${createMethod === 'excel' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                         >
                             엑셀 업로드
                         </button>
                     </div>
                 )}
              </div>
              
              <div className="space-y-4">
                {/* Common Class Select */}
                {showClassSelect && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">소속 반 선택</label>
                        <select 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={selectedClassId}
                            onChange={e => setSelectedClassId(e.target.value)}
                        >
                            <option value="">반을 선택하세요</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {classes.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">등록된 반이 없습니다. 먼저 반을 생성해주세요.</p>
                        )}
                    </div>
                )}

                {/* Manual Input Mode */}
                {(createModal.type !== 'student' || createMethod === 'manual') && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">이름</label>
                        <input 
                            autoFocus
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={placeholder}
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateItem()}
                        />
                    </div>
                )}

                {/* Excel Upload Mode */}
                {createModal.type === 'student' && createMethod === 'excel' && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-indigo-800">엑셀 파일 (.xlsx)</span>
                            <button 
                                onClick={handleDownloadTemplate}
                                className="text-xs text-indigo-600 underline hover:text-indigo-800 flex items-center"
                            >
                                📄 양식 다운로드
                            </button>
                        </div>
                        <input 
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={e => setExcelFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                        />
                        <p className="text-[10px] text-gray-500 mt-2">
                            * 다운로드한 양식에 맞춰 작성 후 업로드해주세요.<br/>
                            * 선택한 반으로 일괄 등록됩니다.
                        </p>
                    </div>
                )}

              </div>

              <div className="flex justify-end space-x-2 mt-6">
                  <button 
                    onClick={() => {
                      setCreateModal({ ...createModal, isOpen: false });
                      setNewItemName('');
                      setSelectedClassId('');
                      setExcelFile(null);
                      setCreateMethod('manual');
                    }} 
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleCreateItem} 
                    disabled={createModal.type === 'student' && createMethod === 'excel' && !excelFile}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createModal.type === 'student' && createMethod === 'excel' ? '일괄 업로드' : 
                     createModal.type === 'student' ? '등록' : '생성'}
                  </button>
              </div>
          </div>
      </div>
    );
  };

  const renderAttendance = () => {
    if (currentUser?.role !== Role.TEACHER) return <div className="text-red-500">접근 권한이 없습니다.</div>;
    
    const today = new Date().toISOString().split('T')[0];

    const toggleStatus = (studentId: string, currentStatus: AttendanceStatus) => {
       // Simple toggle logic: Absent -> Present -> Late -> Absent
       let next = AttendanceStatus.PRESENT;
       if (currentStatus === AttendanceStatus.PRESENT) next = AttendanceStatus.LATE;
       else if (currentStatus === AttendanceStatus.LATE) next = AttendanceStatus.ABSENT;
       
       MockService.markAttendance(studentId, today, next);
       refresh();
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold">오늘의 출석부 ({today})</h2>
            <button className="text-indigo-600 text-sm font-medium hover:underline" onClick={() => setActiveTab('people')}>명단 관리</button>
        </div>
        <div className="divide-y divide-gray-100">
           {students.map(student => {
             const status = student.attendance[today] || AttendanceStatus.ABSENT;
             const statusText = status === AttendanceStatus.PRESENT ? '출석' : 
                                status === AttendanceStatus.LATE ? '지각' : '결석';
             return (
               <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">부모님: {student.parentPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleStatus(student.id, status)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors w-24
                        ${status === AttendanceStatus.PRESENT ? 'bg-green-100 text-green-700' : ''}
                        ${status === AttendanceStatus.ABSENT ? 'bg-red-100 text-red-700' : ''}
                        ${status === AttendanceStatus.LATE ? 'bg-yellow-100 text-yellow-700' : ''}
                      `}
                    >
                      {statusText}
                    </button>
                  </div>
               </div>
             );
           })}
           {students.length === 0 && <div className="p-8 text-center text-gray-500">등록된 학생이 없습니다.</div>}
        </div>
      </div>
    );
  };

  const renderPeople = () => {
     const canSwitchView = currentUser?.role === Role.ADMIN || currentUser?.role === Role.CHURCH_LEADER || currentUser?.role === Role.DEPT_LEADER;
     const showStaff = viewMode === 'staff';
     const listData = showStaff ? users : students;
     
     return (
       <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
               <h2 className="text-2xl font-bold text-gray-800">
                  {showStaff ? '교직원 관리' : '학생 명단'}
               </h2>
               {canSwitchView && (
                  <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
                      <button 
                        onClick={() => setViewMode('staff')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'staff' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        교직원
                      </button>
                      <button 
                        onClick={() => setViewMode('students')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        학생
                      </button>
                  </div>
               )}
            </div>

            <button 
                onClick={() => {
                   if(showStaff) {
                       alert("이메일 초대 기능은 아직 구현되지 않았습니다.");
                   } else {
                       setNewItemName('');
                       // Select first class by default if available to save clicks
                       setSelectedClassId(classes.length > 0 ? classes[0].id : '');
                       setCreateModal({ type: 'student', isOpen: true });
                       setCreateMethod('manual');
                   }
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 shadow flex items-center space-x-1"
            >
                <span>+</span>
                <span>{showStaff ? '교사 초대' : '학생 등록'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">이름</th>
                  <th className="p-4">정보/직책</th>
                  <th className="p-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {showStaff ? (
                         <div className="flex flex-col">
                             <span className={`w-fit px-2 py-1 rounded text-xs font-bold mb-1 ${item.role === Role.PENDING ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-50 text-indigo-700'}`}>
                               {getRoleName(item.role)}
                             </span>
                             {item.role === Role.DEPT_LEADER && (
                                 <span className="text-xs text-gray-400">{departments.find(d => d.id === item.departmentId)?.name || '부서 미지정'}</span>
                             )}
                             {item.role === Role.TEACHER && (
                                 <span className="text-xs text-gray-400">{classes.find(c => c.id === item.classId)?.name || '반 미지정'}</span>
                             )}
                         </div>
                      ) : (
                         <div className="flex flex-col">
                            <span>{item.parentPhone || '연락처 없음'}</span>
                            {/* Show Class Name for Admins/Leaders who see all students */}
                            {!currentUser?.classId && (
                                <span className="text-xs text-gray-400 mt-1">
                                    {classes.find(c => c.id === item.classId)?.name || '반 미배정'}
                                </span>
                            )}
                         </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setModalData({ target: item, isStudent: !showStaff })}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
                {listData.length === 0 && (
                    <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-400">
                            데이터가 없습니다.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>
     );
  };

  const renderStructure = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">부서 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {departments.map(dept => {
             const leader = users.find(u => u.id === dept.leaderId || (u.role === Role.DEPT_LEADER && u.departmentId === dept.id));
             return (
               <div key={dept.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-sm">
                  <h3 className="font-bold text-lg text-indigo-900 mb-2">{dept.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">부서장: {leader ? leader.name : '미지정'}</p>
                  <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                     이 부서에 소속된 반은 '내 반 관리' 또는 교사 프로필에서 할당됩니다.
                  </div>
               </div>
             );
           })}
           
           {/* Only Church Leader or Admin can create departments */}
           {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.CHURCH_LEADER) && (
             <button 
               onClick={() => {
                  setNewItemName('');
                  setCreateModal({ type: 'dept', isOpen: true });
                  setCreateMethod('manual');
               }}
               className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center p-6 text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors h-full min-h-[150px]"
             >
               <span className="flex flex-col items-center">
                 <span className="text-3xl mb-2">+</span>
                 <span>부서 생성</span>
               </span>
             </button>
           )}
        </div>
      </div>
    );
  };

  const renderMyClasses = () => {
    // For Dept Leader to manage classes
    if (currentUser?.role !== Role.DEPT_LEADER) return <div className="text-red-500">접근 권한이 없습니다.</div>;

    const myClasses = classes.filter(c => c.departmentId === currentUser.departmentId);

    return (
       <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">내 반 관리</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {myClasses.map(cls => (
             <div key={cls.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg text-indigo-900 mb-2">{cls.name}</h3>
                <p className="text-sm text-gray-500">담임교사: {users.find(u => u.id === cls.teacherId)?.name || '미지정'}</p>
             </div>
           ))}
           <button 
             onClick={() => {
               setNewItemName('');
               setCreateModal({ type: 'class', isOpen: true });
               setCreateMethod('manual');
             }}
             className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center p-6 text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors min-h-[150px]"
           >
             <span className="flex flex-col items-center">
                 <span className="text-3xl mb-2">+</span>
                 <span>반 생성</span>
             </span>
           </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentUser ? (
        <Layout 
          user={currentUser} 
          church={currentChurch}
          onLogout={handleLogout} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        >
          {activeTab === 'dashboard' && <StatsView user={currentUser} />}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'people' && renderPeople()}
          {activeTab === 'structure' && renderStructure()}
          {activeTab === 'classes' && renderMyClasses()}
        </Layout>
      ) : (
        <Auth onLogin={handleLogin} />
      )}

      {renderCreateModal()}

      {modalData && currentUser && (
        <ProfileModal 
          currentUser={currentUser}
          target={modalData.target} 
          isStudent={modalData.isStudent}
          departments={departments}
          classes={classes}
          onClose={() => setModalData(null)}
          onSave={handleUpdateProfile}
        />
      )}
    </>
  );
}