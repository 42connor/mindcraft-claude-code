import { query } from '@anthropic-ai/claude-agent-sdk';
import { strictFormat } from '../utils/text.js';

// Subscription-backed Claude provider that uses the Claude Agent SDK.
// Auth comes from your existing `claude login` (Max/Pro/Team), not from
// ANTHROPIC_API_KEY. No keys.json entry is required.
//
// Profile usage:
//   { "model": "claude_code/sonnet" }
//   { "model": "claude_code/opus" }
//   { "model": "claude_code/claude-sonnet-4-6" }
export class ClaudeCode {
    static prefix = 'claude_code';

    constructor(model_name, url, params) {
        this.model_name = model_name || 'sonnet';
        this.params = params || {};
        if (url) {
            console.warn('claude_code provider ignores `url` — auth is delegated to the Claude Agent SDK.');
        }
    }

    async sendRequest(turns, systemMessage) {
        const messages = strictFormat(turns);

        // The Agent SDK is single-prompt-in / async-iterator-out.
        // Flatten the conversation into one prompt; the system prompt stays separate.
        let promptText;
        if (messages.length === 1 && messages[0].role === 'user') {
            promptText = messages[0].content;
        } else {
            const transcript = messages
                .map(m => `<${m.role}>\n${m.content}\n</${m.role}>`)
                .join('\n\n');
            promptText = `${transcript}\n\nRespond as the assistant to the latest user message. Output only the response text — no XML tags, no role prefix.`;
        }

        try {
            console.log(`Awaiting claude_code response from ${this.model_name}...`);
            const result = query({
                prompt: promptText,
                options: {
                    systemPrompt: systemMessage,
                    model: this.model_name,
                    maxTurns: 1,
                    allowedTools: [],
                    permissionMode: 'bypassPermissions',
                    ...(this.params || {}),
                },
            });

            let text = '';
            for await (const msg of result) {
                if (msg.type === 'assistant' && msg.message?.content) {
                    for (const c of msg.message.content) {
                        if (c.type === 'text') text += c.text;
                    }
                } else if (msg.type === 'result' && !text && typeof msg.result === 'string') {
                    text = msg.result;
                }
            }
            console.log('Received.');
            return text || 'No response from Claude.';
        } catch (err) {
            console.log(err);
            return 'My brain disconnected, try again.';
        }
    }

    async sendVisionRequest(turns, systemMessage, imageBuffer) {
        return this.sendRequest(
            turns,
            `${systemMessage}\n\n[Note: a vision input was provided but is not yet wired through the claude_code provider.]`
        );
    }

    async embed(_text) {
        throw new Error('Embeddings are not supported by claude_code. Set "embedding" in your profile (e.g. "openai" or "ollama") if you need them; mindcraft falls back to word-overlap retrieval otherwise.');
    }
}
