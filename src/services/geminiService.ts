import { GoogleGenAI, LiveConnectParameters } from "@google/genai";

// Use process.env for server-side/injected keys, fallback to VITE_ for local dev
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    if (process.env.API_KEY) return process.env.API_KEY;
  }
  // @ts-ignore - Handle Vite env vars
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
  }
  return "";
};

export const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const connectLive = (config: LiveConnectParameters) => {
  return ai.live.connect(config);
};

const cleanJson = (text: string) => {
  return text.replace(/```json\n?|```/g, '').trim();
};

export const getTutorResponse = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...history,
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: "You are a futuristic AI Tutor for the 'AI Learning OS'. You are intelligent, encouraging, and explain complex concepts simply. CRITICAL: Always provide answers in a proper exam format (Introduction, Main Points/Steps, Conclusion). Use analogies to explain things simply, but DO NOT include phrases like 'Explain Like I'm Five' or 'EL5' in your response. Keep responses very concise, precise, and powerful. Focus on high-impact information that is easy for a student to digest quickly.",
    }
  });

  const response = await model;
  return response.text;
};

export const analyzeSubmission = async (content: string) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `Analyze this student submission and provide scores (0-100) and feedback in JSON format. Content: ${content}` }] }],
    config: {
      systemInstruction: "You are an AI Diagnostic Engine. Analyze the submission for Concept Accuracy, Clarity, and Depth. Provide a JSON response with the following structure: { accuracy: number, clarity: number, depth: number, feedback: { title: string, level: string, desc: string }[], suggestions: { title: string, desc: string }[] }",
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Failed to parse analyzeSubmission JSON:", e, response.text);
    return {};
  }
};

export const getOnboardingNextStep = async () => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: "I want to set up my profile for the AI Learning OS." }] }],
    config: {
      systemInstruction: "You are an academic advisor for an AI Learning OS tailored for students in Maharashtra, India. Your goal is to ask all necessary questions at once to understand their academic profile (level, subjects, goals). Return a JSON object with an array of questions. Each question must have an id, a label, and a list of 4 relevant options. Structure: { \"questions\": [{ \"id\": \"string\", \"label\": \"string\", \"options\": [\"string\"] }] }",
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Failed to parse getOnboardingNextStep JSON:", e, response.text);
    return { questions: [] };
  }
};

export const generatePersonalizedProfile = async (conversationContext: string) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `Generate a personalized learning profile based on this student interview:\n\n${conversationContext}\n\nReturn ONLY a JSON object with this exact structure:
    {
      "level_name": "string (e.g., 'HSC Science Learner', 'MU Engineering Student')",
      "subjects": ["string", "string"],
      "topSkill": "string (a specific topic from their syllabus)",
      "goal": "string (a realistic short-term academic goal)",
      "weaknesses": ["string", "string"] (2 specific sub-topics they might struggle with),
      "tasks": [
        { "id": "1", "title": "string", "sub_text": "string", "is_done": false, "is_recommended": true },
        { "id": "2", "title": "string", "sub_text": "string", "is_done": false },
        { "id": "3", "title": "string", "sub_text": "string", "is_done": false }
      ],
      "plannerGoals": ["string", "string", "string"] (3 study goals),
      "plannerModules": [
        { "title": "string", "sub": "string", "tag": "HIGH" },
        { "title": "string", "sub": "string", "tag": "ACTIVE" }
      ],
      "tutorTopic": "string (a complex topic from their subjects)",
      "tutorQuestion": "string (a thought-provoking question or scenario about the topic)",
      "tutorCodeSnippet": "string (optional, a relevant code snippet, formula, or short text block. Leave empty string if not applicable)"
    }` }] }],
    config: {
      systemInstruction: "You are an AI Learning OS initialization engine for Maharashtra State Board and Mumbai University students. Provide highly tailored, realistic academic data based on the user's interview. Ensure the JSON is valid.",
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Failed to parse generatePersonalizedProfile JSON:", e, response.text);
    return {};
  }
};

export const generateTutorLesson = async (topic: string, subject: string, level: string) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `Explain the topic "${topic}" in the subject "${subject}" for a student at level "${level}". 
    The explanation should be conversational, friendly, and engaging, like a friend teaching a friend. 
    Use analogies and simple language. Keep it concise (under 150 words).` }] }],
    config: {
      systemInstruction: "You are a friendly, cool AI tutor. You explain things simply and clearly.",
    }
  });

  const response = await model;
  return response.text;
};

export const generateTutorSpeech = async (text: string) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Zephyr" },
        },
      },
    },
  });

  const response = await model;
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};

export const generateAdaptiveTest = async (topics: string[], level: string) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `Generate a short test (3-5 questions) based on these topics: ${topics.join(', ')}. The student is at level "${level}". Provide the test in JSON format with questions and options.` }] }],
    config: {
      systemInstruction: "You are an AI Examiner. Generate a JSON response with the following structure: { test_title: string, questions: { id: string, question: string, options: string[], correct_option: number, explanation: string }[] }",
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Failed to parse generateAdaptiveTest JSON:", e, response.text);
    return { test_title: "Adaptive Test", questions: [] };
  }
};

export const solveTextbookQuestion = async (question: string, imageBase64?: string, mimeType?: string) => {
  const parts: any[] = [{ text: `Solve this textbook question: ${question}. Provide the answer in a stepwise format according to exam standards. Every step should be detailed and nicely explained so a student can easily understand it.` }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageBase64
      }
    });
  }

  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: "You are an expert textbook solver. You provide stepwise, concise, and precise solutions in a proper exam format. Every step should be clear and easy to understand, but avoid unnecessary fluff. DO NOT include phrases like 'Explain Like I'm Five' or 'EL5'. Ensure the tone is helpful and educational.",
    }
  });

  const response = await model;
  return response.text;
};

export const generateStudyPlan = async (examDates: Record<string, string>, profile: any) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ 
      role: "user", 
      parts: [{ 
        text: `Based on these exam dates: ${JSON.stringify(examDates)} and student profile (Weaknesses: ${JSON.stringify(profile.weaknesses)}, Subjects: ${JSON.stringify(profile.subjects)}), generate a weekly study timetable (7 PM - 10 PM daily) and specific goals for today. Today is ${new Date().toLocaleDateString()}.` 
      }] 
    }],
    config: {
      systemInstruction: "You are an AI Academic Planner. Generate a JSON response with: { timetable: { day: string, slots: { time: string, subject: string, topic: string }[] }[], daily_goals: { id: string, title: string, sub_text: string, is_done: boolean }[] }. Ensure the timetable covers 7 PM to 10 PM in 1-hour slots. Prioritize weak subjects more frequently. Ensure every subject is covered at least once a week.",
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Failed to parse generateStudyPlan JSON:", e, response.text);
    return { timetable: [], daily_goals: [] };
  }
};

export const generateVideoScript = async (topic: string, subject: string, level: string, language: string) => {
  const model = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: `Create an educational anime-style storyboard about "${topic}" in "${subject}" for a student at level "${level}". 
    The explanation should be simple but detailed (EL5 style).
    
    CRITICAL: The "narration" text MUST be written in "${language}".
    
    Structure the response as a JSON object with:
    {
      "scenes": [
        {
          "visual_prompt": "detailed anime scene description",
          "narration": "narration text in ${language}"
        }
      ],
      "exam_tricks": ["trick 1 in ${language}", "trick 2 in ${language}"]
    }
    
    Provide 5-7 distinct scenes that follow a logical teaching flow. Each scene's narration should be detailed and informative, ensuring the topic is thoroughly explained while remaining easy to understand.` }] }],
    config: {
      systemInstruction: "You are a creative scriptwriter for educational anime in the style of Studio Ghibli. You make learning whimsical, nature-focused, simple, and visually engaging. You provide deep, detailed explanations broken down into scannable scenes. You always respect the requested language for narration.",
      responseMimeType: "application/json"
    }
  });

  const response = await model;
  try {
    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
    console.error("Failed to parse generateVideoScript JSON:", e, response.text);
    return { scenes: [], exam_tricks: [] };
  }
};

export const generateAnimeImage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Studio Ghibli art style, hand-drawn aesthetic, whimsical atmosphere, high quality, vibrant colors, educational setting, cinematic lighting: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });
  
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) return null;

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  return null;
};

export const generateMultiSpeakerVoiceover = async (script: string, language: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `In ${language}, narrate this script naturally like a storyteller: ${script}` }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' } // Human-like storyteller voice
        }
      }
    }
  });
  
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
