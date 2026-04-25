import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Try to get from process.env, or import.meta.env if using Vite standard vars
  let key = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  
  if (typeof key === 'string') {
    key = key.trim().replace(/^["']|["']$/g, '');
    // Remove any non-ASCII characters to prevent Header append errors
    key = key.replace(/[^\x00-\x7F]/g, "");
  }
  
  if (key === "undefined" || key === '""' || !key) {
    return "";
  }
  return key;
};

const apiKey = getApiKey();

if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export async function rephraseToAcademic(text: string): Promise<string> {
  if (!apiKey) return "خطأ: مفتاح GEMINI_API_KEY غير متوفر. إذا قمت برفع التطبيق على Vercel، يرجى إضافة هذا المفتاح في إعدادات (Environment Variables).";
  if (!text.trim()) return "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rephrase the following text into a professional, academic, and scientific format suitable for a graduation project or a formal internship report. Ensure the tone is objective, precise, and sophisticated. Use professional academic terminology.
      
      Input text: "${text}"`,
    });

    return response.text || "Failed to generate academic version.";
  } catch (error: any) {
    console.error("Error rephrasing text:", error);
    return `خطأ: تعذر الاتصال بالمساعد الذكي. تفاصيل: ${error.message || 'يرجى المحاولة مرة أخرى لاحقاً.'}`;
  }
}

export async function getDesignSuggestions(topic: string): Promise<string> {
  if (!apiKey) return "خطأ: مفتاح GEMINI_API_KEY غير متوفر. إذا قمت برفع التطبيق على Vercel، يرجى إضافة هذا المفتاح في إعدادات (Environment Variables).";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide professional presentation design suggestions for a graduation project on the topic: "${topic}". Include recommendations for:
      1. Color palette (hex codes and mood).
      2. Font pairings (Heading and Body).
      3. Image styles.
      4. Layout structure.
      Format the response in clear sections.`,
    });

    return response.text || "Failed to generate design suggestions.";
  } catch (error: any) {
    console.error("Error getting design suggestions:", error);
    return `خطأ في جلب الاقتراحات: ${error.message || 'يرجى المحاولة مرة أخرى'}`;
  }
}

export async function analyzeSlide(base64Data: string, mimeType: string): Promise<string> {
  if (!apiKey) return "خطأ: مفتاح GEMINI_API_KEY غير متوفر. إذا قمت برفع التطبيق على Vercel، يرجى إضافة هذا المفتاح في إعدادات (Environment Variables).";
  try {
    // Remove data URL prefix if present (e.g. data:image/png;base64,)
    const cleanBase64 = base64Data.split(',')[1] || base64Data;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          },
          {
            text: `أنت خبير محترف في تصميم العروض التقديمية الأكاديمية (Presentation Designer).
        قم بتحليل صورة الشريحة المرفقة وقدم تقييماً شاملاً بناءً على:
        1. التصميم المرئي (الألوان، الخطوط، التباين، والمساحات البيضاء).
        2. المحتوى (وضوح النص، كمية النص، والتنظيم).
        3. ملاحظات للتحسين (ما الذي يجب تغييره لجعل الشريحة أكثر احترافية).
        
        اكتب التقييم بلغة عربية احترافية ومنسقة في نقاط واضحة ومباشرة.`
          }
        ]
      },
    });

    return response.text || "لم أتمكن من تحليل الشريحة.";
  } catch (error: any) {
    console.error("Error analyzing slide:", error);
    return `حدث خطأ أثناء محاولة تحليل الشريحة. تفاصيل: ${error.message || 'يرجى المحاولة مرة أخرى'}.`;
  }
}
