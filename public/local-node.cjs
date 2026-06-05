/**
 * Hermes Agent - Local Execution Node
 * 
 * This is a lightweight local Node.js server that gives the Progressive Web App
 * access to your local computer (keyboard, mouse, file system, terminal).
 * 
 * Usage:
 * npm init -y
 * npm install express cors robotjs child_process
 * node local-node.cjs
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Optional: for mouse/keyboard control if installed
let robot;
try {
  robot = require('robotjs');
} catch (e) {
  console.log("robotjs not installed. Mouse/Keyboard control disabled.");
  console.log("To enable: npm install robotjs");
}

let LlamaChatSession, LlamaContext, LlamaModel, setLlama;
try {
  const nodeLlama = require("node-llama-cpp");
  LlamaChatSession = nodeLlama.LlamaChatSession;
  LlamaContext = nodeLlama.LlamaContext;
  LlamaModel = nodeLlama.LlamaModel;
} catch(e) {
  console.log("node-llama-cpp not installed. Local LLM hosting disabled.");
  console.log("To enable: npm install node-llama-cpp");
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8123;
const MODELS_DIR = path.join(process.cwd(), 'models');

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR);
}

// In-memory active models Cache
const activeSessions = {};

app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    version: '1.0.0',
    capabilities: {
      robot: !!robot,
      llama: !!LlamaModel
    }
  });
});

// GET list of local GGUF models
app.get('/models', (req, res) => {
  try {
    const files = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith('.gguf'));
    res.json({ success: true, models: files });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST Download a model
const activeDownloads = {};
app.post('/download', (req, res) => {
  const { url, filename } = req.body;
  if (!url || !filename) return res.status(400).json({ error: "Missing url or filename" });
  
  const destPath = path.join(MODELS_DIR, filename);
  if (fs.existsSync(destPath)) {
    return res.json({ success: false, error: "File already exists" });
  }

  activeDownloads[filename] = { progress: 0, status: 'downloading' };

  const file = fs.createWriteStream(destPath);
  const client = url.startsWith('https') ? https : http;

  client.get(url, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Simple redirect handling
        client.get(response.headers.location, handleResponse);
    } else {
        handleResponse(response);
    }

    function handleResponse(res) {
        const totalSize = parseInt(res.headers['content-length'], 10);
        let downloadedAt = 0;

        res.pipe(file);

        res.on('data', (chunk) => {
            downloadedAt += chunk.length;
            if (totalSize) {
                activeDownloads[filename].progress = Math.round((downloadedAt / totalSize) * 100);
            }
        });

        file.on('finish', () => {
            file.close();
            activeDownloads[filename].status = 'completed';
            activeDownloads[filename].progress = 100;
        });
    }
  }).on('error', (err) => {
    fs.unlinkSync(destPath);
    activeDownloads[filename].status = 'error';
    activeDownloads[filename].error = err.message;
  });

  res.json({ success: true, message: "Download started", filename });
});

// GET Download status
app.get('/download/:filename', (req, res) => {
  const info = activeDownloads[req.params.filename];
  if (!info) return res.status(404).json({ error: "Download not found" });
  res.json(info);
});

// POST Chat with Local Model
app.post('/chat', async (req, res) => {
  const { modelName, prompt, history } = req.body;
  if (!LlamaModel) return res.status(400).json({ error: "node-llama-cpp is not installed." });
  if (!modelName || !prompt) return res.status(400).json({ error: "Missing modelName or prompt" });

  try {
    if (!activeSessions[modelName]) {
       const modelPath = path.join(MODELS_DIR, modelName);
       if (!fs.existsSync(modelPath)) return res.status(404).json({ error: "Model file not found." });
       
       const model = new LlamaModel({ modelPath });
       const context = new LlamaContext({ model });
       const session = new LlamaChatSession({ context });
       activeSessions[modelName] = session;
    }

    const session = activeSessions[modelName];
    // In a real production app, we'd map the full history. For now, simple prompt.
    const answer = await session.prompt(prompt);
    
    res.json({ success: true, answer });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/execute', (req, res) => {
  const { tool, params } = req.body;
  
  console.log(`[LocalNode] Executing tool: ${tool}`, params);

  try {
    switch (tool) {
      case 'execute_command':
        exec(params.command, { cwd: params.cwd || process.cwd() }, (error, stdout, stderr) => {
          if (error) {
            return res.status(500).send(stderr || error.message);
          }
          res.json({ success: true, output: stdout });
        });
        break;
        
      case 'read_file':
        const content = fs.readFileSync(path.resolve(params.path), 'utf8');
        res.json({ success: true, output: content });
        break;
        
      case 'write_file':
        fs.writeFileSync(path.resolve(params.path), params.content);
        res.json({ success: true, output: "File written successfully." });
        break;
        
      case 'list_directory':
        const files = fs.readdirSync(path.resolve(params.path || '.'));
        res.json({ success: true, data: files });
        break;

      case 'mouse_move':
        if (!robot) return res.status(400).send("robotjs not available");
        robot.moveMouse(params.x, params.y);
        res.json({ success: true });
        break;

      case 'mouse_click':
        if (!robot) return res.status(400).send("robotjs not available");
        robot.mouseClick(params.button || 'left');
        res.json({ success: true });
        break;

      case 'keyboard_type':
        if (!robot) return res.status(400).send("robotjs not available");
        robot.typeString(params.text);
        res.json({ success: true });
        break;

      default:
        res.status(400).send(`Unknown tool: ${tool}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n=================================================`);
  console.log(`🚀 Local Execution Node is running!`);
  console.log(`🔌 Listening on http://127.0.0.1:${PORT}`);
  console.log(`🔒 Ensure this is only accessible from your machine.`);
  console.log(`=================================================\n`);
});
