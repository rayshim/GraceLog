import React from 'react';
import { User, Role, Church } from '../types';

interface LayoutProps {
  user: User | null;
  church: Church | null;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Helper for Korean Roles
export const getRoleName = (role: Role) => {
  switch (role) {
    case Role.ADMIN: return '관리자';
    case Role.CHURCH_LEADER: return '교회장';
    case Role.DEPT_LEADER: return '부서장';
    case Role.TEACHER: return '담임교사';
    case Role.PENDING: return '승인 대기';
    default: return role;
  }
};

export const Layout: React.FC<LayoutProps> = ({ user, church, onLogout, children, activeTab, setActiveTab }) => {
  if (!user) return <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">{children}</div>;

  const NavItem = ({ id, label, icon }: { id: string, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        activeTab === id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  const copyToClipboard = () => {
    if (church?.code) {
      navigator.clipboard.writeText(church.code);
      alert(`교회 코드가 복사되었습니다: ${church.code}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0 z-20">
        <div className="p-6 border-b border-gray-100 flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
            ✝
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">GraceLog</h1>
          
          {church ? (
             <div className="mt-4 w-full bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100">
                <p className="text-sm font-bold text-indigo-900 mb-1">{church.name}</p>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center justify-center w-full space-x-1 bg-white border border-indigo-200 rounded px-2 py-1 cursor-pointer hover:bg-indigo-50 transition-colors group"
                  title="클릭하여 코드 복사"
                >
                   <span className="text-xs text-gray-500">초대 코드:</span>
                   <span className="text-xs font-mono font-bold text-indigo-700 group-hover:text-indigo-900">{church.code}</span>
                   <span className="text-xs">📋</span>
                </button>
             </div>
          ) : (
            <div className="mt-2 text-xs text-gray-400">소속된 교회가 없습니다</div>
          )}

          <div className="mt-4 text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === Role.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
               {getRoleName(user.role)}
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <NavItem id="dashboard" label="대시보드" icon="📊" />
          
          {(user.role === Role.ADMIN || user.role === Role.CHURCH_LEADER) && (
             <NavItem id="structure" label="부서 관리" icon="🏢" />
          )}
          
          {(user.role === Role.DEPT_LEADER) && (
             <NavItem id="classes" label="내 반 관리" icon="🏫" />
          )}

          {user.role !== Role.PENDING && (
            <NavItem id="people" label="성도/학생 관리" icon="👥" />
          )}

          {user.role === Role.TEACHER && (
             <NavItem id="attendance" label="출석 체크" icon="📝" />
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border border-gray-200"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center md:hidden flex-shrink-0">
           <div className="flex items-center space-x-2">
             <span className="font-bold text-lg text-indigo-600">GraceLog</span>
             {church && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{church.name}</span>}
           </div>
           <button onClick={onLogout} className="text-sm text-red-500 font-medium">로그아웃</button>
        </header>
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};