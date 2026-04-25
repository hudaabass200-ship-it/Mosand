import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  let key = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  if (typeof key === 'string') {
    key = key.trim().replace(/^["']|["']$/g, '');
    key = key.replace(/[^\x00-\x7F]/g, "");
  }
  return key;
};

const apiKey = getApiKey();

if (!apiKey) {
  console.error("GEMINI_API_KEY is not defined in the environment variables.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null as any;

export async function rephraseToAcademic(text: string, language: 'ar' | 'en' = 'ar', focus: string = ''): Promise<string> {
  if (!ai) return "خطأ: مفتاح GEMINI_API_KEY غير متوفر. يرجى التحقق من إعدادات المفتاح.";
  if (!text.trim()) return "";

  let promptLang = language === 'ar' ? 
    `أعد صياغة وتلخيص النص التالي بلغة عربية أكاديمية وعلمية واحترافية مناسبة لمشروع تخرج أو تقرير تدريب رسمي. تأكد من أن النبرة موضوعية ودقيقة وراقية. استخدم مصطلحات أكاديمية احترافية.` : 
    `Rephrase and summarize the following text into a professional, academic, and scientific English format suitable for a graduation project or a formal internship report. Ensure the tone is objective, precise, and sophisticated. Use professional academic terminology.`;

  if (focus.trim()) {
      promptLang += language === 'ar' ? 
        `\n\nتعليمات هامة: ركز بشكل خاص على تلخيص وصياغة هذا الجزء أو الفكرة: "${focus}".` :
        `\n\nImportant Instructions: Focus specifically on summarizing and rephrasing this part or idea: "${focus}".`;
  }
  
  promptLang += language === 'ar' ?
    `\n\nملاحظة هامة جداً: قدم النص النهائي كنقاط أو فقرات احترافية نظيفة. **لا تستخدم أبداً** علامات التنسيق مثل النجمات (*** أو **) أو علامات المربع (###) أو أي تنسيقات Markdown أخرى.` :
    `\n\nVERY IMPORTANT: Provide the final text as clean, professional paragraphs or bullet points. **NEVER use** markdown formatting such as asterisks (*** or **) or hash/pound signs (###). Output pure text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${promptLang}
      
      Input text: "${text}"`,
    });

    return response.text || "Failed to generate academic version.";
  } catch (error: any) {
    console.error("Error rephrasing text:", error);
    // If the error contains API_KEY_INVALID, give a clear message
    if (error?.message?.includes('API_KEY_INVALID') || JSON.stringify(error).includes('API_KEY_INVALID')) {
       return `خطأ: مفتاح API غير صالح. يرجى التأكد من نسخ المفتاح بشكل صحيح بدون مسافات إضافية.`;
    }
    return `خطأ: تعذر الاتصال بالمساعد الذكي. تفاصيل: ${error.message || 'يرجى المحاولة مرة أخرى لاحقاً.'}`;
  }
}

export async function getDesignSuggestions(topic: string): Promise<string> {
  if (!ai) return "خطأ: مفتاح GEMINI_API_KEY غير متوفر. يرجى التحقق من إعدادات المفتاح.";
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
    if (error?.message?.includes('API_KEY_INVALID') || JSON.stringify(error).includes('API_KEY_INVALID')) {
       return `خطأ: مفتاح API غير صالح. يرجى التأكد من نسخ المفتاح بشكل صحيح بدون مسافات إضافية.`;
    }
    return `خطأ في جلب الاقتراحات: ${error.message || 'يرجى المحاولة مرة أخرى'}`;
  }
}

export async function analyzeSlide(base64Data: string, mimeType: string): Promise<string> {
  if (!ai) return "خطأ: مفتاح GEMINI_API_KEY غير متوفر. يرجى التحقق من إعدادات المفتاح.";
  try {
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
    if (error?.message?.includes('API_KEY_INVALID') || JSON.stringify(error).includes('API_KEY_INVALID')) {
       return `خطأ: مفتاح API غير صالح. يرجى التأكد من نسخ المفتاح بشكل صحيح بدون مسافات إضافية من موقع Google AI Studio.`;
    }
    return `حدث خطأ أثناء محاولة تحليل الشريحة. تفاصيل: ${error.message || 'يرجى المحاولة مرة أخرى'}.`;
  }
}
