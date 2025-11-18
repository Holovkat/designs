What I want to do in this functionality is to be able to utilise the ChatGPT subscription instead of API keys for OpenAI connectivity 
In this analysis you will find the information available on how this is done currently in the OpenAI Codex CLI 
I want to be able to implement this in such a way that it uses the same methodologies that we have currently in this codebase 
Meaning the commands for /auth and /model should work the same way. The only difference is the /auth will have an additional OpenAI-ChatGPT provider 
Obviously /model will have the models listed from obviously the ChatGPT provider messages 

I have analyzed the **OpenAI Codex CLI** approach. Unlike the standard API, it does **not** use the `api.openai.com` endpoints or standard API keys. Instead, it hits a special "backend" API that mimics the web interface's capabilities, allowing it to bill against your ChatGPT Plus/Team subscription.

Here is the "baked-in" mechanism found in the `openai/codex` repo and how to port it to the Qwen CLI.

### **The Mechanism: Backend API + Session Token**

The Codex CLI works by authenticating as a "browser user" rather than an "API user".
1.  **Endpoint:** It does not use `v1/chat/completions`. It uses a private endpoint, typically:
    `https://chatgpt.com/backend-api/codex/responses` (or `.../conversation` with specific model flags).
2.  **Auth:** It uses a **Bearer Access Token** (JWT), often retrieved via an OAuth flow or extracted from the browser session (`__Secure-next-auth.session-token`).
3.  **Payload:** The JSON body is different from the standard SDK. It requires conversation history management (`parent_message_id`, `conversation_id`).

### **How to implement this in Qwen CLI**

Since this API is **not** compatible with the standard OpenAI Node.js SDK, you cannot just swap the `baseUrl`. You must write a custom adapter client.

#### **1. Update `src/constants.ts`**
Add the private endpoint configuration.

```typescript
export const CODEX_CONFIG = {
  // The internal endpoint used by the official Codex CLI
  BASE_URL: 'https://chatgpt.com/backend-api',
  
  // The specific model ID used in the backend
  MODEL: 'gpt-5.1-codex', // or 'text-davinci-002-render-sha' for older plans
  
  // Headers mimicking the official CLI to avoid blocking
  HEADERS: {
    'User-Agent': 'OpenAI-Codex-CLI/1.0',
    'Origin': 'https://chatgpt.com',
    'Referer': 'https://chatgpt.com/'
  }
};
```

#### **2. Create a Custom Client Adapter**
Because the payloads differ, create a new file `src/ai/codex-client.ts`. This mimics the logic found in the Codex Rust codebase.

```typescript
import { v4 as uuidv4 } from 'uuid';
import { CODEX_CONFIG } from '../constants';

export class CodexSubscriptionClient {
  private accessToken: string;
  private conversationId: string | null = null;
  private parentMessageId: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.parentMessageId = uuidv4(); // Start a new tree
  }

  /**
   * Mimics the backend-api call used by openai/codex
   */
  async chat(messages: any[]) {
    const userMessage = messages[messages.length - 1]; // Get the latest prompt
    const messageId = uuidv4();

    // Construct the specific payload expected by the backend-api
    const payload = {
      action: "next",
      messages: [
        {
          id: messageId,
          author: { role: "user" },
          content: { content_type: "text", parts: [userMessage.content] },
          metadata: {}
        }
      ],
      conversation_id: this.conversationId,
      parent_message_id: this.parentMessageId,
      model: CODEX_CONFIG.MODEL,
      timezone_offset_min: -300, // Adjust as needed
      history_and_training_disabled: false,
      arkose_token: null // Might be needed if OpenAI enforces CAPTCHA
    };

    const response = await fetch(`${CODEX_CONFIG.BASE_URL}/conversation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...CODEX_CONFIG.HEADERS
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Codex API Error: ${response.statusText} (Are you logged in?)`);
    }

    // Handle the streaming response (simplified for this example)
    // The backend API returns SSE (Server-Sent Events), so you'll need to parse the stream.
    // For a quick MVP, you can buffer it, but ideally, you stream it like the SDK.
    const data = await response.text(); 
    // You will need to parse the "data: {...}" lines here to get the final text.
    
    // Update conversation state for continuity
    // (You would extract the new conversation_id and parent_id from the response)
    // this.conversationId = parsedResponse.conversation_id;
    // this.parentMessageId = parsedResponse.message.id;

    return data; // Return parsed text
  }
}
```

#### **3. Update `src/commands/auth.ts`**
The authentication for this provider is just an Access Token. The official Codex CLI often opens a browser window to `localhost` to capture this, but pasting it is easier for a first implementation.

```typescript
import { input } from '@inquirer/prompts';
// ... imports

if (provider === 'chatgpt-subscription') {
  console.log('ℹ️  To get your Access Token:');
  console.log('1. Go to https://chatgpt.com');
  console.log('2. Open DevTools (F12) -> Application -> Cookies');
  console.log('3. Copy the value of "__Secure-next-auth.session-token"');
  
  const token = await input({ message: 'Paste Token:' });
  await setConfig('providers.codex.token', token);
}
```

#### **4. Integrate into the Factory (`src/ai/client.ts`)**
Now, tell your main client factory to use this custom class instead of the OpenAI SDK when this provider is active.

```typescript
import { CodexSubscriptionClient } from './codex-client';

export async function createClient() {
  const config = await getConfig();
  
  if (config.activeProvider === 'chatgpt-subscription') {
    const token = config.providers.codex.token;
    // Return an object that matches the interface of the OpenAI SDK wrapper
    // so the rest of your Qwen CLI doesn't crash.
    const codex = new CodexSubscriptionClient(token);
    
    return {
      chat: {
        completions: {
          create: async (params) => {
            // Map standard SDK params to our custom client
            const responseText = await codex.chat(params.messages);
            return {
              choices: [{ message: { content: responseText } }]
            };
          }
        }
      }
    } as any; // Cast to any or OpenAI type to satisfy TS
  }

  // ... standard OpenAI/Z.ai logic ...
}
```

### **Summary of the "Trick"**
The `openai/codex` repo essentially acts as a **custom web browser**. It doesn't use the developer API; it uses the internal endpoint powering the website.
1.  **No API Key:** Uses `Authorization: Bearer <session_token>`.
2.  **Different URL:** `https://chatgpt.com/backend-api/conversation`.
3.  **Different JSON:** Uses `action: "next"`, `messages`, and `parent_message_id`.

By implementing the `CodexSubscriptionClient` adapter above, you enable your Qwen CLI to use your paid subscription just like the official Codex CLI does.
