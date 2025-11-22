import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Student, AttendanceStatus, User, Role, StatData } from '../types';
import { MockService } from '../services/mockService';
import { generateAttendanceInsight } from '../services/geminiService';

interface StatsViewProps {
  user: User;
}

export const StatsView: React.FC<StatsViewProps> = ({ user }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Compute stats based on role scope
  const stats: StatData[] = useMemo(() => {
    let students: Student[] = [];
    
    // Scoping Logic
    if (user.role === Role.ADMIN || user.role === Role.CHURCH_LEADER) {
      if (!user.churchId) return [];
      students = MockService.getAllStudentsInChurch(user.churchId);
    } else if (user.role === Role.DEPT_LEADER && user.departmentId) {
      const classes = MockService.getClasses(user.departmentId!);
      const classIds = classes.map(c => c.id);
      if (!user.churchId) return [];
      students = MockService.getAllStudentsInChurch(user.churchId).filter(s => classIds.includes(s.classId));
    } else if (user.role === Role.TEACHER && user.classId) {
      students = MockService.getStudentsByClass(user.classId);
    }

    if (students.length === 0) return [];

    const dataMap: Record<string, { present: number, absent: number, total: number }> = {};
    
    students.forEach(s => {
      // Analyze last 4 weeks (mocking dates)
      const dates = Object.keys(s.attendance).sort().slice(-4);
      dates.forEach(d => {
        if (!dataMap[d]) dataMap[d] = { present: 0, absent: 0, total: 0 };
        dataMap[d].total++;
        if (s.attendance[d] === AttendanceStatus.PRESENT || s.attendance[d] === AttendanceStatus.LATE) {
          dataMap[d].present++;
        } else {
          dataMap[d].absent++;
        }
      });
    });

    return Object.keys(dataMap).map(date => ({
      name: date,
      present: dataMap[date].present,
      absent: dataMap[date].absent,
      rate: dataMap[date].total > 0 ? Math.round((dataMap[date].present / dataMap[date].total) * 100) : 0
    }));

  }, [user]);

  const handleGetInsight = async () => {
    setLoadingAi(true);
    const text = await generateAttendanceInsight(stats, user.role);
    setInsight(text);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">출석 현황</h2>
          <button 
            onClick={handleGetInsight}
            disabled={loadingAi || stats.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loadingAi ? (
              <span>분석 중...</span>
            ) : (
              <>
                <span>✨ AI 인사이트</span>
              </>
            )}
          </button>
        </div>

        {insight && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm leading-relaxed animate-fade-in">
            <strong className="block mb-2 font-semibold">Gemini 분석:</strong>
            {insight}
          </div>
        )}

        <div className="h-80 w-full">
          {stats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                  labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '0.5rem' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="present" name="출석" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="absent" name="결석" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400">
               데이터가 없습니다.
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="총 인원" value={stats.length > 0 ? stats[stats.length-1].present + stats[stats.length-1].absent : 0} icon="👥" color="bg-blue-50 text-blue-600" />
        <StatCard title="최근 출석률" value={`${stats.length > 0 ? stats[stats.length-1].rate : 0}%`} icon="📈" color="bg-green-50 text-green-600" />
        <StatCard title="결석 인원" value={stats.length > 0 ? stats[stats.length-1].absent : 0} icon="⚠️" color="bg-red-50 text-red-600" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);