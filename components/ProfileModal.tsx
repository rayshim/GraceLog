import React, { useState, useEffect } from 'react';
import { User, Role, Student, Department, ClassGroup } from '../types';
import { getRoleName } from './Layout';

interface ProfileModalProps {
  currentUser: User;
  target: User | Student;
  isStudent: boolean;
  departments: Department[];
  classes: ClassGroup[];
  onClose: () => void;
  onSave: (data: any) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ currentUser, target, isStudent, departments, classes, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({ ...target });

  // Permission Logic
  const canEdit = (): boolean => {
    // 1. Admin & Church Leader: Can edit everyone
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.CHURCH_LEADER) return true;

    // 2. Self Edit (Users only)
    if (!isStudent && (target as User).id === currentUser.id) return true;

    // 3. Dept Leader Logic
    if (currentUser.role === Role.DEPT_LEADER) {
      // Can edit Teachers
      if (!isStudent && (target as User).role === Role.TEACHER) return true;
      // Can edit Students (Hierarchy implies ability to manage students in dept)
      if (isStudent) return true;
    }

    // 4. Teacher Logic
    if (currentUser.role === Role.TEACHER) {
      // Can edit Students
      if (isStudent) return true;
    }

    return false;
  };

  const isEditable = canEdit();
  const isAdminOrChurchLeader = currentUser.role === Role.ADMIN || currentUser.role === Role.CHURCH_LEADER;
  const isDeptLeader = currentUser.role === Role.DEPT_LEADER;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isEditable) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-gray-800">
             {isEditable ? '프로필 수정' : '프로필 보기'}
           </h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">이름</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              disabled={!isEditable}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
            />
          </div>

          {isStudent ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">생년월일</label>
                  <input 
                    name="dob" 
                    type="date"
                    value={formData.dob} 
                    onChange={handleChange}
                    disabled={!isEditable}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">보호자 연락처</label>
                  <input 
                    name="parentPhone" 
                    value={formData.parentPhone} 
                    onChange={handleChange}
                    disabled={!isEditable}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">주소</label>
                <input 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  disabled={!isEditable}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50"
                />
              </div>
              {/* Allow moving student to another class if teacher/admin/leader */}
              {isEditable && (
                 <div>
                   <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">소속 반</label>
                   <select 
                     name="classId" 
                     value={formData.classId} 
                     onChange={handleChange}
                     className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                   >
                     {classes.map(c => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                   </select>
                 </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">비고</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange}
                  disabled={!isEditable}
                  rows={3}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 resize-none"
                />
              </div>
            </>
          ) : (
            <>
               <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">이메일</label>
                <input 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  disabled={!isEditable} 
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none"
                />
              </div>
               
              {/* Role Assignment - Only Admin or Church Leader can change roles */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">직책</label>
                {isAdminOrChurchLeader && (target as User).id !== currentUser.id ? (
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={Role.PENDING}>승인 대기</option>
                    <option value={Role.TEACHER}>담임교사</option>
                    <option value={Role.DEPT_LEADER}>부서장</option>
                    <option value={Role.CHURCH_LEADER}>교회장</option>
                    <option value={Role.ADMIN}>관리자</option>
                  </select>
                ) : (
                  <div className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                    {getRoleName(formData.role)}
                  </div>
                )}
              </div>

              {/* Department Assignment (Visible if Dept Leader or Teacher) - Admin/Church Leader Only */}
              {(formData.role === Role.DEPT_LEADER || formData.role === Role.TEACHER) && isAdminOrChurchLeader && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">소속 부서</label>
                  <select 
                    name="departmentId" 
                    value={formData.departmentId || ''} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">(선택 안함)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Assignment (Visible if Teacher) - Admin/Church Leader OR Dept Leader editing Teacher */}
              {formData.role === Role.TEACHER && (isAdminOrChurchLeader || isDeptLeader) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">담당 반</label>
                  <select 
                    name="classId" 
                    value={formData.classId || ''} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">(선택 안함)</option>
                    {/* Show classes. If Dept Leader, they only see their dept classes via App.tsx logic */}
                    {classes
                      .filter(c => !formData.departmentId || c.departmentId === formData.departmentId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {isAdminOrChurchLeader && (
                 <div className="text-xs text-gray-400 mt-2">
                   * 직책을 변경한 후에는 반드시 해당 부서나 반을 지정해주세요.
                 </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
          {isEditable && (
             <button 
              onClick={() => onSave(formData)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
             >
               저장
             </button>
          )}
        </div>
      </div>
    </div>
  );
};