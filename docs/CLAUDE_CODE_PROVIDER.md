# Claude Code Provider (subscription-backed Claude)

This fork adds a `claude_code` provider that drives the bot using the
[Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
instead of the Anthropic API.

That means inference uses your existing Claude subscription (Pro / Max / Team)
via the same OAuth login Claude Code itself uses — **no `ANTHROPIC_API_KEY`
required**, no separate API billing.

## Setup

1. Install Claude Code on the machine running the bot, then log in:
   ```sh
   npm install -g @anthropic-ai/claude-code   # if not already installed
   claude /login                                # opens browser, OAuth flow
   ```
   Verify with `claude -p "say hi"` — it should reply without prompting for a key.

2. Install bot deps:
   ```sh
   npm install --legacy-peer-deps
   ```
   `--legacy-peer-deps` is needed because the Agent SDK pulls a newer `zod`
   peer than some other deps declare.

3. In your profile (`profiles/claude.json` or your own), set:
   ```json
   {
       "name": "claude",
       "model": "claude_code/sonnet"
   }
   ```
   Other valid model values: `claude_code/opus`, `claude_code/haiku`,
   or any full model id like `claude_code/claude-sonnet-4-6`.

4. In `settings.js`, point `profiles` at the file:
   ```js
   "profiles": ["./profiles/claude.json"],
   ```

5. Run normally: `node main.js`.

## Auth note (online-mode servers)

If your Minecraft server has `online-mode=true` (the default for servers with
real Mojang players), the bot also needs `auth: "microsoft"` in `settings.js`
and a Microsoft account that owns Minecraft. On first run, mineflayer will
print a device-code URL — open it, paste the code, and the token is cached
for future runs.

If your server is offline-mode (cracked / LAN-only), leave `auth: "offline"`.

## Embeddings

The provider does not implement `embed()`. Mindcraft falls back to
word-overlap retrieval automatically, which is good enough for skill / example
selection. If you want vector retrieval, set an `embedding` field on the
profile:

```json
{
    "name": "claude",
    "model": "claude_code/sonnet",
    "embedding": "ollama/nomic-embed-text"
}
```

## Limitations

- Vision input is currently passed through as text-only context (no image
  bytes forwarded to the SDK).
- Multi-turn conversations are flattened into a single prompt with a
  `<user>...</user> <assistant>...</assistant>` transcript. Mindcraft caps
  context at ~15 messages, so this works fine in practice.
- The SDK enforces its own permission model. The provider runs with
  `allowedTools: []` and `permissionMode: 'bypassPermissions'` so the bot
  cannot trigger any tool use through Claude Code itself; all in-game actions
  still go through mindcraft's existing command system.
