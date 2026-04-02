# n8n native MCP Server Setup Guide

n8n (Version 2.14.0+) now has a native **Model Context Protocol (MCP)** server. This allows AI agents (like me) to directly interact with your n8n workflows.

## 🟢 Step 1: Enable MCP in n8n
1. Open your **n8n Dashboard**.
2. Go to **Settings** > **MCP**.
3. Toggle the switch to **"Enable MCP Server"**.
4. You will see an **MCP Server URL** (e.g., `https://n8n.your-domain.com/mcp`).
5. **Copy the API Key** provided on that page.

## 🟢 Step 2: Make Workflows Discoverable
By default, workflows are hidden from the MCP server.
1. Open any workflow you want to expose to AI agents.
2. Click the three dots (`...`) in the menu bar.
3. Select **"Enable MCP Access"**.
4. An MCP icon will appear next to the workflow name.

## 🟢 Step 3: Connect to this AI Assistant
Tell me (the AI assistant) your MCP Server URL and API Key, and I will be able to:
- **Discover Workflows:** See what tools you already have.
- **Trigger Automaions:** Run a workflow for you.
- **Build New Tools:** Help you "vibe code" new integrations without manual setup.

---

### 💡 Why use MCP?
- **Speed:** Instead of waiting for tokens to sync via database polls, the AI can trigger the sync immediately.
- **Customization:** If you need a special integration logic, I can build an n8n workflow for you through the MCP protocol.
