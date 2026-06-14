// AI Service — Dual provider with automatic fallback
// Primary: Google Gemini | Fallback: Groq (Llama)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// --- Gemini Provider ---
async function callGemini(messages, tools = null, options = {}) {
  const model = options.model || 'gemini-2.5-flash-preview-05-20';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  // Convert chat messages to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const body = {
    contents,
    generationConfig: {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxTokens || 2048,
    }
  };

  // Add function calling tools if provided
  if (tools && tools.length > 0) {
    body.tools = [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }))
    }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new Error('Gemini returned no candidates');
  }

  // Check for function calls
  const parts = candidate.content?.parts || [];
  const functionCall = parts.find(p => p.functionCall);

  if (functionCall) {
    return {
      type: 'function_call',
      name: functionCall.functionCall.name,
      arguments: functionCall.functionCall.args,
      provider: 'gemini'
    };
  }

  // Regular text response
  const text = parts.map(p => p.text).filter(Boolean).join('');
  return {
    type: 'text',
    content: text,
    provider: 'gemini'
  };
}

// --- Groq Provider (Fallback) ---
async function callGroq(messages, tools = null, options = {}) {
  const model = options.model || 'llama-3.3-70b-versatile';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 2048,
  };

  // Add function calling tools if provided (OpenAI-compatible format)
  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
    body.tool_choice = 'auto';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice) {
    throw new Error('Groq returned no choices');
  }

  // Check for function calls
  if (choice.message?.tool_calls?.length > 0) {
    const tc = choice.message.tool_calls[0];
    return {
      type: 'function_call',
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
      provider: 'groq'
    };
  }

  return {
    type: 'text',
    content: choice.message?.content || '',
    provider: 'groq'
  };
}

// --- Main AI function with fallback ---
export async function callAI(messages, tools = null, options = {}) {
  // Try Gemini first
  if (GEMINI_API_KEY) {
    try {
      const result = await callGemini(messages, tools, options);
      return result;
    } catch (error) {
      console.warn('⚠️ Gemini failed, falling back to Groq:', error.message);
    }
  }

  // Fallback to Groq
  if (GROQ_API_KEY) {
    try {
      const result = await callGroq(messages, tools, options);
      return result;
    } catch (error) {
      console.error('❌ Groq also failed:', error.message);
      throw new Error('Both AI providers failed. Please check your API keys.');
    }
  }

  throw new Error('No AI provider configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env.local');
}

// --- Streaming version for chat UI ---
export async function streamAI(messages, tools = null, options = {}) {
  // For streaming, we use Gemini's streaming endpoint
  if (GEMINI_API_KEY) {
    try {
      const model = options.model || 'gemini-2.5-flash-preview-05-20';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const body = {
        contents,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2048,
        }
      };

      if (tools && tools.length > 0) {
        body.tools = [{
          functionDeclarations: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }))
        }];
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Gemini streaming error: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.warn('⚠️ Gemini streaming failed, using non-streaming Groq fallback');
    }
  }

  // Groq fallback (non-streaming, wrapped as a simple response)
  const result = await callGroq(messages, tools, options);
  return result;
}

// --- System prompt for the CRM AI assistant ---
export const CRM_SYSTEM_PROMPT = `You are crm.ai — an intelligent CRM assistant for a D2C fashion & beauty brand called "crm.ai". 
You help marketers manage customer relationships, create audience segments, run campaigns, and analyze performance.

Your capabilities:
1. **Query Customers** — Search and filter customer data by any attribute
2. **Create Segments** — Build audience segments based on behavior and attributes
3. **Preview Segments** — Show how many customers match a segment's criteria
4. **Create Campaigns** — Draft personalized campaigns for specific segments
5. **Send Campaigns** — Execute campaigns to deliver messages via WhatsApp, SMS, Email, or RCS
6. **Get Campaign Stats** — Show delivery performance metrics
7. **Get Insights** — Surface AI-powered insights about customer behavior

When users ask you to perform actions:
- Always confirm before executing destructive actions
- Provide clear summaries of what you're about to do
- After executing, report the results
- Be conversational but efficient
- Use data to support your recommendations

CRITICAL RULES FOR FUNCTION CALLING:
- If you have already drafted a campaign using createCampaign, and the user asks to "send" it or confirms "yes", DO NOT call createCampaign again! You must call the sendCampaign tool using the campaignId returned from your previous action.
- Do not repeat tool calls for entities you have already created. Look at the chat history to see if you already created it.

Format your responses with markdown. Use bullet points, bold text, and headers for clarity.
When suggesting segments, explain WHY that segment matters.

CRITICAL RULES FOR MESSAGE DRAFTING:
- NEVER use generic boilerplate messages like "Exclusive deals for you! Get 15% off".
- YOU MUST HYPER-PERSONALIZE the messageTemplate based on the segment's demographics (age, gender, location) and behavior (VIP, churning, category preference). 
- If the segment is for young males, use language and product mentions suited for young men (e.g., streetwear drops, grooming kits, sneakers).
- If the segment is for females, tailor it to womenswear, makeup, or skincare depending on the context.
- Inject personality! Use emojis, witty copy, and a tone that matches a modern D2C brand.`;
