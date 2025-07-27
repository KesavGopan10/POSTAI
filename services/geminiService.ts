
import { GoogleGenAI, Type } from "@google/genai";
import type { SocialPlatform } from '../types';
import { getApiKey } from '../src/utils/apiKeyStorage';

// Initialize without API key, will be set per-request
let aiInstance: GoogleGenAI | null = null;

const getAIInstance = (): GoogleGenAI => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("API key not set. Please set your API key in the settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const ideasGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'An array of 3-5 distinct and creative social media post ideas based on the user\'s topic.'
        }
    },
    required: ['ideas']
};

export const generatePostIdeas = async (topic: string): Promise<string[]> => {
    const prompt = `You are a creative strategist. Brainstorm a list of 3 to 5 distinct social media post ideas about "${topic}". The ideas should be short, engaging, and suitable for a general audience. Return the ideas as a JSON object with a single key "ideas" which is an array of strings.`;

    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: ideasGenerationSchema,
        }
    });
    
    if (!response.text) {
        throw new Error('No response text received from the API');
    }
    
    const parsed = JSON.parse(response.text) as { ideas: string[] };
    return parsed.ideas || [];
}


const postGenerationSchema: {
    type: Type;
    properties: Record<string, any>;
    required: string[];
} = {
    type: Type.OBJECT,
    properties: {
        postText: { type: Type.STRING },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        bestTimeToPost: { type: Type.STRING }
    },
    required: ['postText', 'hashtags', 'bestTimeToPost'],
};

export const generatePostContent = async (
    userInput: string,
    platform: SocialPlatform,
    language: string,
    toneInstruction: string,
    options: {
        useGoogleSearch: boolean;
        image?: { mimeType: string; data: string; };
    }
): Promise<{ postText: string; hashtags: string[]; bestTimeToPost: string; sources: { uri: string; title: string; }[] | null }> => {
    
    let promptParts: string[] = [
        `You are an expert social media manager. ${toneInstruction}`,
        `Generate a social media post based on the following details.`,
        `Details:`,
        `- User's Goal: "${userInput}"`,
        `- Target Platform: "${platform.name}" (Character limit: ${platform.charLimit} characters. Be mindful of this limit.)`,
        `- Target Language: "${language}"`,
        `- Do not add any extra text like citations numbers([1][2] etc),also do not add "**".`,
        `-Must be properly formatted and easy to read.Must be Publish ready.`
    ];

    if (options.image) {
        promptParts.splice(3, 0, `- Context from attached image: Analyze the provided image and incorporate its theme, objects, and mood into the post.`);
    }
    
    const requiredFields = [
        `"postText": An engaging post for the specified platform and language. It must not exceed the character limit.`,
        `"hashtags": An array of 5-7 relevant and trending hashtags, in the target language where appropriate.`,
        `"bestTimeToPost": A suggestion for the optimal posting time on this platform.`
    ];

    if (options.useGoogleSearch) {
        promptParts.push(
            `\nUse Google Search to find relevant, up-to-date information if needed.`,
            `The response MUST be ONLY a single valid JSON object, adhering to the schema described below. Do not include any text outside of the JSON object.`,
            `The JSON object must be enclosed in \`\`\`json ... \`\`\`.`,
            `\nJSON Schema:`,
            `{`,
            ...requiredFields.map(f => `  ${f}`),
            `}`
        );
        const contents = [{ text: promptParts.join('\n') }];
        
        const ai = getAIInstance();
    const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web)
            .filter((web): web is { uri: string } => web?.uri !== undefined) || null;
        
        const responseText = response.text;
        if (!responseText) {
            throw new Error("The AI response was empty. This might be due to the content policy.");
        }

        try {
            const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/);
            const jsonText = jsonMatch ? jsonMatch[1] : responseText;
            const parsed = JSON.parse(jsonText.trim());
            return { ...parsed, sources };
        } catch (e) {
            console.error("Failed to parse Gemini response with Google Search:", e);
            console.error("Raw response text:", responseText);
            throw new Error("The AI returned an invalid response. Please try again.");
        }
    } else {
        promptParts.push(
            `\nThe response MUST be in valid JSON format, adhering to the provided schema.`,
            `\nGenerate the following:`,
            ...requiredFields
        );
        
        const textPart = { text: promptParts.join('\n') };
        let requestContents;

        if (options.image) {
            const imagePart = {
                inlineData: {
                    mimeType: options.image.mimeType,
                    data: options.image.data,
                },
            };
            requestContents = { parts: [textPart, imagePart] };
        } else {
            requestContents = [textPart];
        }

        const ai = getAIInstance();
    const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: requestContents,
            config: {
                responseMimeType: "application/json",
                responseSchema: postGenerationSchema,
            },
            ...(options.image && {
                files: [{
                    mimeType: options.image.mimeType,
                    data: options.image.data
                }]
            })
        });

        if (!response.text) {
            throw new Error('No response text received from the API');
        }

        const result = JSON.parse(response.text) as {
            postText: string;
            hashtags?: string[];
            bestTimeToPost: string;
        };

        // Initialize empty sources array for web search results
        const sources: { uri: string; title: string }[] = [];
        
        // Add a note that web search functionality is currently disabled
        if (options.useGoogleSearch) {
            console.log('Web search is currently disabled due to API limitations.');
        }

        return {
            postText: result.postText,
            hashtags: result.hashtags || [],
            bestTimeToPost: result.bestTimeToPost,
            sources: sources.length > 0 ? sources : null
        };
    }
};

export const translateToEnglish = async (text: string): Promise<string> => {
    const prompt = `Translate the following text to English. Respond with only the translated text, nothing else:\n\n"${text}"`;
    try {
        const ai = getAIInstance();
    const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0,
            }
        });

        const translatedText = response.text;
        if (!translatedText) {
            throw new Error("Translation failed to produce a result.");
        }
        return translatedText;

    } catch (e) {
        console.error("Failed to translate text:", e);
        throw new Error("Translation failed. Please try again.");
    }
};

export const refinePostText = async (
    originalText: string,
    platform: SocialPlatform,
    language: string,
    instruction: string
): Promise<string> => {
    const prompt = `
        You are an expert social media copy editor.
        A user has generated the following text for a post on "${platform.name}" in "${language}":
        ---
        ${originalText}
        ---
        The user wants to refine it. Your instruction is: "${instruction}".
        The character limit for ${platform.name} is ${platform.charLimit} characters. The refined text must not exceed this limit.
        Respond with ONLY the refined text, nothing else. Keep it in the original language (${language}).Do not add any extra text like citations numbers(1,2 etc) also do not add any extra text like citations numbers([1][2] etc),also do not add "**".
    `;
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    const refinedText = response.text;
    if (!refinedText) {
        throw new Error("Refinement failed to produce a result.");
    }
    return refinedText.trim();
};