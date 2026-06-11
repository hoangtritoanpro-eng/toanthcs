import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getMathExplanation = async (
  topic: string, 
  problemData: string,
  userLevel: string = "lớp 6"
): Promise<string> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "Chức năng AI chưa được cấu hình (thiếu API KEY). Hãy hỏi thầy giáo trực tiếp nhé!";
    }

    const model = "gemini-3-flash-preview";
    const prompt = `
      Bạn là trợ lý ảo hỗ trợ học tập toán học vui vẻ và thân thiện cho học sinh ${userLevel}.
      Học sinh đang gặp khó khăn hoặc muốn tìm hiểu về chủ đề: "${topic}".
      Dữ liệu bài toán hiện tại: ${problemData}.
      
      Hãy giải thích ngắn gọn, dễ hiểu, sử dụng giọng văn khích lệ. 
      Không đưa ra đáp án trực tiếp ngay lập tức nếu là bài tập, hãy gợi ý phương pháp tư duy.
      Giới hạn câu trả lời dưới 100 từ.
      Định dạng trả về là văn bản thuần túy.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Thầy đang suy nghĩ, em đợi chút nhé...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Hiện tại kết nối với trợ lý AI đang gặp sự cố. Em hãy thử lại sau nhé.";
  }
};
