import { GoogleGenAI } from "@google/genai";
import { StatData } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
export const generateAttendanceInsight = async (stats: StatData[], role: string): Promise<string> => {
  if (!apiKey) return "API 키가 설정되지 않았습니다.";

  const ai = new GoogleGenAI({ apiKey });

  // Translate Role for context
  const roleKR = role === 'ADMIN' ? '관리자' :
                 role === 'CHURCH_LEADER' ? '교회장' :
                 role === 'DEPT_LEADER' ? '부서장' :
                 '담임교사';

  const prompt = `
    당신은 교회 출결 관리 앱의 AI 비서입니다.
    다음은 ${roleKR}를 위한 출석 통계 데이터입니다:
    ${JSON.stringify(stats)}

    이 데이터를 바탕으로 한국어로 짧고 격려가 되는 분석 인사이트를 제공해주세요 (최대 150자).
    성장한 부분과 주의가 필요한 부분을 짚어주고, 출석률을 높일 수 있는 실질적인 조언을 하나 해주세요.
    어조: 전문적이면서도 목회적이고 따뜻하게.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "인사이트를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 서비스에 연결할 수 없습니다.";
  }
};