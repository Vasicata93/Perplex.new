import { CreateWebWorkerMLCEngine, MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";
import { Message, Role } from "../types";

class LocalLLMService {
  private engine: MLCEngineInterface | null = null;
  private currentModelId: string | null = null;

  async initModel(modelId: string, onProgress?: (progress: number, text: string) => void) {
    if (this.engine && this.currentModelId === modelId) {
      return; // Already initialized
    }

    const initProgressCallback = (report: InitProgressReport) => {
      if (onProgress) {
        // report.progress is between 0 and 1
        onProgress(Math.round(report.progress * 100), report.text);
      }
    };

    // Create a new worker
    const worker = new Worker(new URL('./llm.worker.ts', import.meta.url), { type: 'module' });

    this.engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback,
    });
    this.currentModelId = modelId;
  }

  async generateResponse(
    history: Message[],
    prompt: string,
    systemInstruction: string,
    onChunk?: (text: string) => void
  ): Promise<{ text: string }> {
    if (!this.engine) {
      throw new Error("Local model not initialized. Please select and download a model first.");
    }

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    history.slice(-10).forEach(msg => {
      messages.push({
        role: msg.role === Role.MODEL ? "assistant" : "user",
        content: msg.content
      });
    });

    messages.push({ role: "user", content: prompt });

    const chunks = await this.engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.7,
    });

    let fullText = "";
    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullText += content;
      if (onChunk && content) {
        onChunk(content);
      }
    }

    return { text: fullText };
  }

  async deleteModel(modelId: string) {
    // WebLLM uses Cache API. We can try to clear it.
    try {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        if (key.includes("webllm")) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const req of requests) {
            if (req.url.includes(modelId)) {
              await cache.delete(req);
            }
          }
        }
      }
      if (this.currentModelId === modelId) {
        this.engine = null;
        this.currentModelId = null;
      }
    } catch (e) {
      console.error("Failed to delete model cache:", e);
    }
  }
}

export const localLlmService = new LocalLLMService();
