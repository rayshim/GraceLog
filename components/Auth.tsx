import React, { useState } from 'react';
import { User } from '../types';
import { MockService } from '../services/mockService';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'ONBOARDING'>('LOGIN');
  const [tempUser, setTempUser] = useState<User | null>(null);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MockService.login(email, password);
    if (user) {
      if (!user.churchId && user.role === 'PENDING') {
          // Edge case: registered but didn't finish onboarding
          setTempUser(user);
          setView('ONBOARDING');
      } else {
          onLogin(user);
      }
    } else {
      setError('이메일 또는 비밀번호가 잘못되었습니다.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = MockService.register(name, email, password);
      setTempUser(user);
      setView('ONBOARDING');
      setError(''); // Clear any previous errors
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateChurch = () => {
    if (!tempUser) return;
    const church = MockService.createChurch(churchName, tempUser);
    const updated = MockService.login(tempUser.email, tempUser.password!); // Refetch to get updated role
    if (updated) onLogin(updated);
  };

  const handleJoinChurch = () => {
    if (!tempUser) return;
    try {
      const updated = MockService.joinChurch(joinCode, tempUser);
      onLogin(updated);
    } catch (err) {
      setError("교회를 찾을 수 없습니다.");
    }
  };

  const clearError = () => {
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-800">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header Graphic */}
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="text-4xl mb-2">✝</div>
          <h1 className="text-2xl font-bold">GraceLog</h1>
          <p className="text-indigo-200 text-sm mt-2">함께 성장하는 교회 출결 관리</p>
        </div>

        <div className="p-8">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">&times;</button>
          </div>}

          {view === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={email} onChange={e => { setEmail(e.target.value); clearError(); }}
                  placeholder="example@church.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input 
                  type="password" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={password} onChange={e => { setPassword(e.target.value); clearError(); }}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                로그인
              </button>
              <p className="text-center text-sm text-gray-500">
                처음 오셨나요? <button type="button" onClick={() => { setView('REGISTER'); setError(''); }} className="text-indigo-600 font-medium hover:underline">회원가입</button>
              </p>
            </form>
          )}

          {view === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={name} onChange={e => { setName(e.target.value); clearError(); }}
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={email} onChange={e => { setEmail(e.target.value); clearError(); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input 
                  type="password" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={password} onChange={e => { setPassword(e.target.value); clearError(); }}
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                회원가입
              </button>
              <p className="text-center text-sm text-gray-500">
                이미 계정이 있으신가요? <button type="button" onClick={() => { setView('LOGIN'); setError(''); }} className="text-indigo-600 font-medium hover:underline">로그인</button>
              </p>
            </form>
          )}

          {view === 'ONBOARDING' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">환영합니다, {tempUser?.name}님!</h3>
                <p className="text-gray-500 text-sm">시작하려면 교회를 생성하거나 기존 교회에 가입하세요.</p>
              </div>
              
              <div className="space-y-4">
                <div className="border border-gray-200 p-4 rounded-xl hover:border-indigo-400 transition-colors">
                  <h4 className="font-semibold text-indigo-700 mb-2">새 교회 생성하기</h4>
                  <p className="text-xs text-gray-500 mb-3">관리자가 되어 부서와 조직을 관리합니다.</p>
                  <input 
                    placeholder="교회 이름 입력" 
                    className="w-full p-2 text-sm border border-gray-200 rounded mb-2"
                    value={churchName} onChange={e => setChurchName(e.target.value)}
                  />
                  <button onClick={handleCreateChurch} disabled={!churchName} className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50">생성 및 시작</button>
                </div>

                <div className="flex items-center text-gray-400 text-sm">
                   <div className="h-px bg-gray-200 flex-1"></div>
                   <span className="px-2">또는</span>
                   <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <div className="border border-gray-200 p-4 rounded-xl hover:border-indigo-400 transition-colors">
                  <h4 className="font-semibold text-gray-700 mb-2">기존 교회 가입하기</h4>
                  <p className="text-xs text-gray-500 mb-3">관리자에게 받은 교회 코드를 입력하세요.</p>
                  <input 
                    placeholder="코드 입력 (예: GRACE2024)" 
                    className="w-full p-2 text-sm border border-gray-200 rounded mb-2"
                    value={joinCode} onChange={e => { setJoinCode(e.target.value); clearError(); }}
                  />
                  <button onClick={handleJoinChurch} disabled={!joinCode} className="w-full bg-gray-800 text-white py-2 rounded text-sm hover:bg-gray-900 disabled:opacity-50">교회 찾기</button>
                   {/* Hint for demo purposes */}
                   <p className="text-[10px] text-gray-400 mt-2 text-center">데모 코드: GRACE2024</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};