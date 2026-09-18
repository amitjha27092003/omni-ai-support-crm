import { GoogleGenAI } from "@google/genai";
import { detectLanguageHeuristic, isRTL } from "./languageDetection";

export interface MultilingualTriageParams {
  customerMessage: string;
  customerName?: string;
  tone?: "Formal" | "Concise" | "Apologetic" | string;
  targetLanguage?: string; // e.g. "auto", "en", "Hindi", "es", etc.
  channel?: string;
}

export interface MultilingualTriageResult {
  detected_language: string;
  detected_language_iso: string;
  english_translation: string;
  suggested_reply: string;
  suggested_reply_english: string;
  confidence_score: number;
  is_rtl: boolean;
  is_fallback?: boolean;
}

/**
 * Universal Multilingual Gemini 2.5 AI Engine
 * Handles inbound language detection, native dialect matching, English translation for Ops,
 * and tone-aware response generation.
 */
export async function generateMultilingualTriage(
  params: MultilingualTriageParams
): Promise<MultilingualTriageResult> {
  const {
    customerMessage,
    customerName = "Customer",
    tone = "Formal",
    targetLanguage = "auto",
    channel = "OmniChannel",
  } = params;

  // 1. Initial heuristic check for baseline fallback & script properties
  const heuristic = detectLanguageHeuristic(customerMessage);
  const apiKey = process.env.GEMINI_API_KEY || "";

  // 2. Build detailed tone instructions
  const normalizedTone = String(tone).trim().toLowerCase();
  let toneInstruction = "Professional, courteous, and well-structured executive tone. Address the customer respectfully.";
  if (normalizedTone === "concise") {
    toneInstruction = "Ultra-concise, crisp, and direct (1-2 sentences maximum). Cut all fluff, filler, and repetitive greetings; state the solution or next operational step immediately.";
  } else if (normalizedTone === "apologetic") {
    toneInstruction = "Deeply empathetic, sincere, humble, and reassuring. Sincerely apologize for the inconvenience and express personal commitment to resolving their issue quickly.";
  }

  // 3. Language instruction for target reply
  let targetLangInstruction = "";
  if (!targetLanguage || targetLanguage === "auto") {
    targetLangInstruction = `Match the customer's exact inbound language and dialect naturally. If the customer wrote in Hindi, reply in Hindi (Devanagari). If Hinglish (Hindi in Roman script), reply in natural Hinglish. If Arabic, reply in Modern Standard Arabic. If Spanish, French, German, Japanese, Bengali, Tamil, etc., reply in that exact language.`;
  } else {
    targetLangInstruction = `The operator has explicitly requested the reply to be in "${targetLanguage}". Translate and formulate the suggested response strictly in "${targetLanguage}".`;
  }

  const systemInstruction = `You are OmniAI, an enterprise autonomous customer support intelligence suite.
You are processing a customer inquiry received via ${channel}.

TASK REQUIREMENTS:
1. UNIVERSAL LANGUAGE DETECTION:
   - Accurately detect the customer's inbound language and dialect (e.g., "Hindi", "Hinglish", "Spanish", "Arabic", "Japanese", "Bengali", "Tamil", "English", "French", "German", etc.).
   - Provide the ISO code (e.g., "hi", "hi-Latn", "es", "ar", "ja", "bn", "ta", "en", "fr", "de").

2. STRICT NATIVE MATCHING & TONE:
   - Target Tone: ${tone.toUpperCase()}
   - Tone Rules: ${toneInstruction}
   - Language Rules: ${targetLangInstruction}
   - Ensure native punctuation, script accuracy (Devanagari, Arabic RTL, CJK, etc.), and culturally natural phrasing.

3. INTERNAL ENGLISH TRANSLATION FOR OPS:
   - Provide a faithful, concise English translation of what the customer is asking/reporting, regardless of the inbound language. If already in English, provide the message as-is.
   - Also provide an English translation of the suggested reply.

OUTPUT FORMAT:
Respond with STRICT VALID JSON only with NO markdown fences, matching this schema:
{
  "detected_language": "string (e.g. Hindi, Hinglish, Spanish, Arabic)",
  "detected_language_iso": "string (e.g. hi, hi-Latn, es, ar)",
  "english_translation": "string (concise English translation of customer transmission)",
  "suggested_reply": "string (reply drafted in the requested target language with requested tone)",
  "suggested_reply_english": "string (English translation of the suggested reply)",
  "confidence_score": number (between 70 and 99)
}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `${systemInstruction}\n\nCustomer Name: ${customerName}\nCustomer Transmission:\n${customerMessage}`;

      // Try primary gemini-2.5-flash, fallback to gemini-2.0-flash-exp if needed
      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        responseText = response.text || "";
      } catch (err25) {
        console.warn("[gemini.ts] gemini-2.5-flash call fallback, trying gemini-2.0-flash-exp:", err25);
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: prompt,
        });
        responseText = response.text || "";
      }

      if (responseText) {
        // Strip any markdown code fences if model output them
        const cleaned = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const detectedLang = parsed.detected_language || heuristic.name;
        const detectedIso = parsed.detected_language_iso || heuristic.iso;
        const detectedRtl = isRTL(detectedIso) || isRTL(detectedLang);

        return {
          detected_language: detectedLang,
          detected_language_iso: detectedIso,
          english_translation: parsed.english_translation || customerMessage,
          suggested_reply: parsed.suggested_reply || parsed.suggested_reply_english || "",
          suggested_reply_english: parsed.suggested_reply_english || parsed.suggested_reply || "",
          confidence_score: Number(parsed.confidence_score) || 94,
          is_rtl: detectedRtl,
          is_fallback: false,
        };
      }
    } catch (apiError: unknown) {
      console.warn("[gemini.ts] AI Generation error, using multilingual heuristic fallback:", apiError);
    }
  }

  // 4. Intelligent Fallback Heuristic Generator (Zero API key / Network resilience)
  return generateFallbackMultilingualTriage({
    customerMessage,
    customerName,
    tone: normalizedTone,
    targetLanguage,
    heuristic,
  });
}

/**
 * High-fidelity fallback heuristic generator for Hindi, Hinglish, Spanish, Arabic, CJK, etc.
 */
function generateFallbackMultilingualTriage(params: {
  customerMessage: string;
  customerName: string;
  tone: string;
  targetLanguage: string;
  heuristic: ReturnType<typeof detectLanguageHeuristic>;
}): MultilingualTriageResult {
  const { customerMessage, customerName, tone, targetLanguage, heuristic } = params;
  const lang = targetLanguage !== "auto" && targetLanguage ? targetLanguage.toLowerCase() : heuristic.name.toLowerCase();
  const lowerMsg = customerMessage.toLowerCase();

  const isRefund = lowerMsg.includes("refund") || lowerMsg.includes("paise") || lowerMsg.includes("reembolso") || lowerMsg.includes("استرداد") || lowerMsg.includes("退款");
  const isHelp = lowerMsg.includes("help") || lowerMsg.includes("madad") || lowerMsg.includes("ayuda") || lowerMsg.includes("مساعدة") || lowerMsg.includes("帮助");

  let suggestedReply = "";
  let englishReply = "";
  let englishTrans = customerMessage;

  // Language specific generation
  if (lang.includes("hindi") || heuristic.name === "Hindi") {
    englishTrans = isRefund
      ? "Customer is inquiring about their refund and transaction status."
      : isHelp
      ? "Customer is requesting urgent operational support."
      : `Customer states: "${customerMessage.slice(0, 80)}"`;

    if (tone === "concise") {
      suggestedReply = isRefund
        ? "आपका रिफंड प्रोसेस कर दिया गया है। 24 घंटे में आपके खाते में आ जाएगा।"
        : "आपकी समस्या दर्ज कर ली गई है। हमारी टीम जल्द ही सहायता करेगी।";
      englishReply = "Your refund is processed and will reflect within 24 hours.";
    } else if (tone === "apologetic") {
      suggestedReply = `नमस्ते ${customerName}, हुई असुविधा के लिए हमें गहरा खेद है। हम आपके मामले को प्राथमिकता पर हल कर रहे हैं।`;
      englishReply = `Dear ${customerName}, we sincerely apologize for the inconvenience caused. We are resolving your query on priority.`;
    } else {
      suggestedReply = `नमस्ते ${customerName}, आपका अनुरोध प्राप्त हो गया है। हमारी ऑपरेशंस टीम इस पर तुरंत कार्यवाही कर रही है।`;
      englishReply = `Namaste ${customerName}, your request has been logged. Our operations team is actively resolving this.`;
    }
  } else if (lang.includes("hinglish") || heuristic.name === "Hinglish") {
    englishTrans = isRefund
      ? "Customer is asking when their refund money will be credited."
      : "Customer is asking for assistance with their account or order.";

    if (tone === "concise") {
      suggestedReply = isRefund
        ? "Aapka refund initiate ho gaya hai. 24 hours mai credit ho jayega."
        : "Ticket log ho gayi hai. Hum turant check kar rahe hain.";
      englishReply = "Your refund has been initiated and will credit in 24 hours.";
    } else if (tone === "apologetic") {
      suggestedReply = `Dear ${customerName}, hui pareshani ke liye dil se maafi chahte hain. Hamari team isko priority pe dekh rahi hai.`;
      englishReply = `Dear ${customerName}, we are truly sorry for the trouble. Our team is resolving this on top priority.`;
    } else {
      suggestedReply = `Hello ${customerName}, aapki request register ho chuki hai. Operations team is par turant action le rahi hai.`;
      englishReply = `Hello ${customerName}, your request has been registered. Our operations team is on it.`;
    }
  } else if (lang.includes("arabic") || heuristic.name === "Arabic") {
    englishTrans = isRefund
      ? "Customer is asking about the status of their refund."
      : "Customer is requesting assistance with their service.";

    if (tone === "concise") {
      suggestedReply = "تم استلام طلبكم وجاري مراجعته على الفور.";
      englishReply = "Your request has been received and is being reviewed immediately.";
    } else if (tone === "apologetic") {
      suggestedReply = `عزيزي ${customerName}، نعتذر بشدة عن أي إزعاج. يعمل فريقنا على حل مشكلتكم بأعلى أولوية.`;
      englishReply = `Dear ${customerName}, we sincerely apologize for any inconvenience. Our team is solving this with utmost priority.`;
    } else {
      suggestedReply = `مرحباً ${customerName}، تم تسجيل طلبكم وسيقوم فريق العمليات بمتابعة الإجراءات وإعلامكم قريباً.`;
      englishReply = `Hello ${customerName}, your request has been logged and our operations team will update you shortly.`;
    }
  } else if (lang.includes("spanish") || heuristic.name === "Spanish") {
    englishTrans = isRefund
      ? "Customer is asking when their refund will be processed."
      : "Customer is asking for technical/billing support.";

    if (tone === "concise") {
      suggestedReply = "Su solicitud ha sido registrada y está en proceso de revisión.";
      englishReply = "Your request has been registered and is under review.";
    } else if (tone === "apologetic") {
      suggestedReply = `Estimado/a ${customerName}, lamentamos profundamente los inconvenientes. Estamos atendiendo su caso con máxima prioridad.`;
      englishReply = `Dear ${customerName}, we sincerely apologize for the inconvenience. We are handling your case on high priority.`;
    } else {
      suggestedReply = `Hola ${customerName}, hemos recibido su consulta. Nuestro equipo de operaciones la está revisando ahora mismo.`;
      englishReply = `Hello ${customerName}, we have received your inquiry. Our operations team is reviewing it now.`;
    }
  } else {
    // English default fallback
    englishTrans = customerMessage;
    if (tone === "concise") {
      suggestedReply = isRefund
        ? "Refund initiated. Expected clearance is within 24 hours."
        : "Inquiry logged. Our operations team is investigating now.";
      englishReply = suggestedReply;
    } else if (tone === "apologetic") {
      suggestedReply = `Dear ${customerName}, we sincerely apologize for any inconvenience caused. We have escalated your query to get this resolved at once.`;
      englishReply = suggestedReply;
    } else {
      suggestedReply = `Hello ${customerName}, your request has been logged. Our operations team is actively working on your case.`;
      englishReply = suggestedReply;
    }
  }

  const finalIso = heuristic.iso;
  const finalRtl = isRTL(finalIso) || isRTL(heuristic.name);

  return {
    detected_language: heuristic.name,
    detected_language_iso: finalIso,
    english_translation: englishTrans,
    suggested_reply: suggestedReply,
    suggested_reply_english: englishReply,
    confidence_score: 91,
    is_rtl: finalRtl,
    is_fallback: true,
  };
}
