import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { generateImage } from "./_core/imageGeneration";

/**
 * LLM Writing Assistant - helps engineers draft and improve documentation
 */
export async function getWritingAssistance(prompt: string, context?: string) {
  const systemPrompt = `You are an expert technical writing assistant for engineers. 
Help draft documentation, improve clarity, generate code examples, and provide writing suggestions.
Keep responses concise and actionable.`;

  const userMessage = context
    ? `${prompt}\n\nContext:\n${context}`
    : prompt;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  return response.choices[0]?.message.content || "";
}

/**
 * Auto-tag articles based on content analysis
 */
export async function generateArticleTags(title: string, content: string): Promise<string[]> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert at categorizing technical content. 
Analyze the given article and suggest 3-5 relevant tags.
Return ONLY a JSON array of tags, nothing else.
Example: ["database", "performance", "optimization"]`,
      },
      {
        role: "user",
        content: `Title: ${title}\n\nContent:\n${content.substring(0, 1000)}...`,
      },
    ],
  });

  try {
    const messageContent = response.choices[0]?.message.content;
    const tagsText = typeof messageContent === "string" ? messageContent : "[]";
    return JSON.parse(tagsText);
  } catch {
    return [];
  }
}

/**
 * Improve technical writing clarity
 */
export async function improveTechnicalWriting(content: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert technical editor. 
Improve the clarity, conciseness, and professionalism of technical writing.
Maintain the original meaning while enhancing readability.
Return the improved text only.`,
      },
      { role: "user", content },
    ],
  });

  return response.choices[0]?.message.content || content;
}

/**
 * Generate code examples from descriptions
 */
export async function generateCodeExamples(description: string, language: string = "typescript") {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert code generator. 
Generate practical, production-ready code examples based on descriptions.
Use the specified programming language.
Include comments explaining key parts.`,
      },
      {
        role: "user",
        content: `Language: ${language}\n\nDescription:\n${description}`,
      },
    ],
  });

  return response.choices[0]?.message.content || "";
}

/**
 * Transcribe audio recordings into article drafts
 */
export async function transcribeAndStructureAudio(audioUrl: string, title?: string) {
  try {
    // Transcribe audio
    const transcription = await transcribeAudio({
      audioUrl,
      language: "en",
      prompt: "Technical walkthrough or meeting notes",
    });

    // Check if transcription was successful
    if ("error" in transcription) {
      throw new Error(transcription.error);
    }

    // Structure transcription into article format
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at converting transcribed speech into well-structured technical articles.
Transform the raw transcription into a properly formatted article with:
- Clear title
- Summary
- Sections with headers
- Key takeaways
- Use markdown formatting.`,
        },
        {
          role: "user",
          content: `Title: ${title || "Technical Documentation"}\n\nTranscription:\n${transcription.text}`,
        },
      ],
    });

    return {
      transcription: transcription.text,
      structuredArticle: response.choices[0]?.message.content || "",
      language: transcription.language,
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

/**
 * Generate diagrams and illustrations from text descriptions
 */
export async function generateDiagramFromDescription(description: string, diagramType: string = "flowchart") {
  try {
    // First, generate a diagram description using LLM
    const diagramDescription = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at creating technical diagrams.
Convert text descriptions into detailed diagram specifications.
For flowcharts, use mermaid syntax.
For architecture diagrams, describe components and relationships.
Return only the diagram code/syntax.`,
        },
        {
          role: "user",
          content: `Diagram Type: ${diagramType}\n\nDescription:\n${description}`,
        },
      ],
    });

    // Generate visual representation
    const imagePrompt = `Create a professional ${diagramType} visualization based on this description: ${description}. 
Use clear colors, labels, and professional styling. Make it suitable for technical documentation.`;

    const image = await generateImage({ prompt: imagePrompt });

    return {
      diagramCode: diagramDescription.choices[0]?.message.content || "",
      imageUrl: image.url,
      type: diagramType,
    };
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
}

/**
 * Suggest improvements to article structure
 */
export async function suggestArticleImprovements(title: string, content: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert technical documentation reviewer.
Analyze the article and provide constructive suggestions for improvement.
Focus on: structure, clarity, completeness, code examples, and audience engagement.
Return suggestions as a numbered list.`,
      },
      {
        role: "user",
        content: `Title: ${title}\n\nContent:\n${content}`,
      },
    ],
  });

  return response.choices[0]?.message.content || "";
}
