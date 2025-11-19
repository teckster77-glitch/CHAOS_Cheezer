import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SigilResult, TarotCard } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Audio Helper Functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Generate a unique sigil based on intent
export const generateSigil = async (
  intent: string, 
  style: string = 'geometric', 
  strokeWidth: string = 'medium',
  styleImage?: string
): Promise<SigilResult> => {
  const ai = getAiClient();

  let styleInstruction = "";
  switch (style) {
    case 'organic':
      styleInstruction = "Use flowing curves, smooth loops, and natural, biological forms. Avoid sharp corners.";
      break;
    case 'abstract':
      styleInstruction = "Use chaotic lines, asymmetry, jagged edges, and experimental, non-traditional shapes.";
      break;
    case 'geometric':
    default:
      styleInstruction = "Use sharp angles, straight lines, symmetry, and precise geometric shapes (triangles, circles, squares).";
      break;
  }

  let strokeValue = "2";
  switch (strokeWidth) {
    case 'thin': strokeValue = "1"; break;
    case 'thick': strokeValue = "4"; break;
    case 'medium': default: strokeValue = "2"; break;
  }
  
  let promptText = `
    You are an expert Chaos Magician and a master of vector geometry.
    Your task is to create a "Sigil" based on the user's intent: "${intent}".
    
    1. Apply the Austin Osman Spare method conceptually: condense the intent into a mantra, remove repeating letters, and combine the remaining forms.
    2. Create a valid SVG XML string representing this sigil. The SVG should be:
       - Style: ${style}. ${styleInstruction}
       - Use a viewBox of "0 0 100 100".
       - Use white strokes (stroke="#ffffff") with a stroke-width of ${strokeValue}.
       - Transparent fill (fill="none").
       - Composed of paths, circles, and lines.
       - Centered and balanced.
  `;

  if (styleImage) {
    promptText += `
    3. **CRITICAL**: ANALYZE the provided reference image. Mimic its artistic qualities (e.g., line weight variance, complexity, chaos vs order, curvature) in your SVG path construction. The generated sigil should feel like it belongs in the same visual universe as the reference image.
    `;
  }

  promptText += `
    4. Provide a brief esoteric explanation of the design.
    5. Provide the phonetic "mantra" derived from the intent.

    Return the response as a valid JSON object.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      svg: { type: Type.STRING, description: "The raw SVG XML code string starting with <svg and ending with </svg>" },
      explanation: { type: Type.STRING, description: "A mystical explanation of the symbols used" },
      mantra: { type: Type.STRING, description: "The pronounceable mantra derived from the intent" },
    },
    required: ["svg", "explanation", "mantra"],
  };

  const parts: any[] = [{ text: promptText }];

  if (styleImage) {
    // Extract base64 data and mime type. styleImage is likely "data:image/png;base64,..."
    const match = styleImage.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 1.0,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from oracle.");
    return JSON.parse(text) as SigilResult;
  } catch (error) {
    console.error("Sigil generation failed:", error);
    throw error;
  }
};

// Interactive Chat for learning - Updated to support Deep Gnosis (Thinking Mode)
export const chatWithOracle = async (
  history: { role: string; parts: { text: string }[] }[], 
  message: string,
  deepGnosis: boolean = false
) => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are a modern Chaos Magician, well-versed in the works of Peter J. Carroll, Phil Hine, and Austin Osman Spare.
    You speak with a slightly enigmatic, philosophical, yet practical tone.
    Your goal is to demystify chaos magic, focusing on "belief as a tool", the psychological model of magic, and the use of symbols/sigils to influence the subconscious.
    Avoid roleplaying as a fantasy wizard; focus on the psychological and metaphysical engineering aspects.
    Be concise but insightful.
  `;

  const model = deepGnosis ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
  
  // Thinking config for deep gnosis
  const config: any = {
    systemInstruction,
  };

  if (deepGnosis) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const chat = ai.chats.create({
      model,
      config,
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat failed:", error);
    throw error;
  }
};

// Expand on a specific symbol concept
export const explainSymbol = async (symbolName: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the significance of the "${symbolName}" in the context of Chaos Magic. Explain it in 2 short paragraphs. Focus on its utility and psychological impact.`,
    });
    return response.text || "The void remains silent on this matter.";
  } catch (error) {
    console.error("Explanation failed:", error);
    return "The threads of chaos are tangled. Try again.";
  }
};

// --- NEW AI FEATURES ---

// 1. Generate Image using Imagen 4.0
export const generateMysticalImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A mystical, esoteric, chaos magic style visualization of: ${prompt}`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64) throw new Error("Failed to manifest image.");
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Image manifestation failed:", error);
    throw error;
  }
};

// 2. Edit/Transmute Image using Gemini 2.5 Flash Image (Nano Banana)
export const transmuteImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Extract image from parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No visual transmutation returned.");
  } catch (error) {
    console.error("Transmutation failed:", error);
    throw error;
  }
};

// 3. Analyze/Scry Image using Gemini 3 Pro
export const scryImage = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image for esoteric symbolism, omens, and hidden meanings within the context of chaos magic or general mysticism. Be profound yet concise.",
          },
        ],
      },
    });
    return response.text || "The scrying glass remains cloudy.";
  } catch (error) {
    console.error("Scrying failed:", error);
    throw error;
  }
};

// 4. Generate Video using Veo
export const projectAstralVideo = async (base64Data: string, mimeType: string, prompt: string = "A mystical transformation"): Promise<string> => {
  const ai = getAiClient();
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: base64Data,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) throw new Error("Astral projection failed to materialize.");
    
    // The URI needs the API key appended to fetch the raw bytes if we were fetching it,
    // but for a video src we can often use it directly if signed, or fetch blob.
    // The guide says: `fetch(${downloadLink}&key=${process.env.API_KEY})`
    
    return `${uri}&key=${process.env.API_KEY}`;

  } catch (error) {
    console.error("Astral projection failed:", error);
    throw error;
  }
};

// 5. Thoth Tarot Reader
export const consultThothTarot = async (
  cards: { name: string; position: string }[], 
  query: string
): Promise<string> => {
  const ai = getAiClient();

  const systemInstruction = `
    You are Aleister Crowley, author of 'The Book of Thoth'. 
    Your task is to interpret a Tarot spread.
    
    CRITICAL RULES:
    1. STRICTLY use the symbolism, Qabalistic attributions, and Astrological associations from 'The Book of Thoth'.
    2. DO NOT use Rider-Waite-Smith interpretations (e.g., if 2 of Disks appears, call it "Change", not "Juggling").
    3. Refer to the cards by their Thoth specific names (e.g., Art instead of Temperance, Lust instead of Strength, Adjustment instead of Justice, Aeon instead of Judgment).
    4. Use the Court Card titles: Knight (Fire), Queen (Water), Prince (Air), Princess (Earth). 
    5. Incorporate the "Dignity" of the cards relative to each other.
    6. Your tone should be esoteric, authoritative, slightly archaic, and profound.
    7. Structure the response with Markdown.
  `;

  const prompt = `
    Querent's Question: "${query}"
    
    The Cards Drawn:
    ${cards.map(c => `- Position: ${c.position}, Card: ${c.name}`).join('\n')}
    
    Provide a synthesis of this reading.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 16000 } // Use thinking for deep esoteric connections
      }
    });

    return response.text || "The cards are silent.";
  } catch (error) {
    console.error("Tarot reading failed:", error);
    return "The Astral Light is too turbulent for a clear reading.";
  }
};

// 5.1 Detailed Thoth Card Analysis
export const analyzeThothCard = async (card: TarotCard): Promise<string> => {
  const ai = getAiClient();
  const cardName = card.thothTitle ? `${card.name} ("${card.thothTitle}")` : card.name;
  
  const prompt = `
    Analyze the Thoth Tarot card: "${cardName}" based on Aleister Crowley's 'The Book of Thoth'.
    
    Return the response as a raw HTML string (do not use markdown code blocks) with the following structure and CSS classes:
    
    <div class="space-y-6">
      <div>
        <h4 class="text-[#d4af37] font-mystic text-xl border-b border-[#d4af37]/30 pb-2 mb-3">Qabalistic & Astrological</h4>
        <p class="text-sm text-zinc-400 font-serif italic leading-relaxed">[Insert Attribution here, e.g., Path of Samekh, Sagittarius, or Sun in Capricorn]</p>
      </div>
      <div>
         <h4 class="text-[#d4af37] font-mystic text-xl border-b border-[#d4af37]/30 pb-2 mb-3">Esoteric Description</h4>
         <p class="text-zinc-300 font-serif leading-relaxed text-lg">[Insert a detailed description of the card's imagery and symbolism according to Crowley]</p>
      </div>
      <div>
         <h4 class="text-[#d4af37] font-mystic text-xl border-b border-[#d4af37]/30 pb-2 mb-3">Divinatory Meaning</h4>
         <p class="text-zinc-300 font-serif leading-relaxed text-lg">[Insert meanings for divination]</p>
      </div>
    </div>

    Keep the tone scholarly, esoteric, and authoritative.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Card analysis failed:", error);
    return "The archive is sealed.";
  }
};

// 6. Generate Audio Voice (Crowley Persona)
// Returns a function to stop the audio
export const playCrowleyVoice = async (text: string, onEnded?: () => void): Promise<() => void> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      // STRICT FORMAT: [{ parts: [{ text }] }] for array of contents
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deeper voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio manifested.");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
        if (onEnded) onEnded();
    };

    source.start();
    
    return () => {
        try {
            source.stop();
        } catch (e) {
            // ignore if already stopped
        }
    };

  } catch (error) {
    console.error("Crowley's voice failed to manifest:", error);
    throw error;
  }
};

// 7. Procedural Level Generation (Game AI)
export interface LevelParams {
    themeName: string;
    fogColor: string;
    terrainColor: string;
    targetColor: string;
    islandCount: number;
    islandSize: number;
    chaosFactor: number; // 0 to 1, affects volatility
    geometryStyle?: 'CUBE' | 'PYRAMID' | 'OCTAHEDRON';
    physicsGravity?: number;
}

export const generateLevelData = async (userPhilosophy: string, currentSymbolName: string): Promise<LevelParams> => {
    const ai = getAiClient();
    
    const prompt = `
        The user is playing a psychedelic voxel flight simulator game about Chaos Magic.
        They just reached the monolith for the symbol: "${currentSymbolName}".
        They gave this philosophical answer to a question about it: "${userPhilosophy}".
        
        Based on their answer, generate the visual and physical parameters for the NEXT level.
        
        If their answer is aggressive, make the world red, chaotic, and jagged.
        If their answer is peaceful, make it blue, smooth, and expansive.
        If their answer is cryptic, make it purple, foggy, and dense.
        
        Return a JSON object with this schema:
        {
            "themeName": "string (e.g. 'The Crimson Void')",
            "fogColor": "hex string (e.g. '#ff0000')",
            "terrainColor": "hex string",
            "targetColor": "hex string",
            "islandCount": number (10-50),
            "islandSize": number (30-150),
            "chaosFactor": number (0.1 - 1.0),
            "geometryStyle": "string (one of: CUBE, PYRAMID, OCTAHEDRON)",
            "physicsGravity": "number (-0.2 to 0.2, where negative is upward pull)"
        }
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            themeName: { type: Type.STRING },
            fogColor: { type: Type.STRING },
            terrainColor: { type: Type.STRING },
            targetColor: { type: Type.STRING },
            islandCount: { type: Type.INTEGER },
            islandSize: { type: Type.NUMBER },
            chaosFactor: { type: Type.NUMBER },
            geometryStyle: { type: Type.STRING, enum: ['CUBE', 'PYRAMID', 'OCTAHEDRON'] },
            physicsGravity: { type: Type.NUMBER },
        },
        required: ["themeName", "fogColor", "terrainColor", "targetColor", "islandCount", "islandSize", "chaosFactor", "geometryStyle", "physicsGravity"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 1.0
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("No level data");
        return JSON.parse(text) as LevelParams;
    } catch (e) {
        console.error("Level generation failed", e);
        // Fallback level
        return {
            themeName: "The Static Void",
            fogColor: "#111111",
            terrainColor: "#333333",
            targetColor: "#d4af37",
            islandCount: 20,
            islandSize: 60,
            chaosFactor: 0.5,
            geometryStyle: 'CUBE',
            physicsGravity: 0
        };
    }
};
