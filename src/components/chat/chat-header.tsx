"use client";

import { useChat } from "@/lib/chat-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eraser, Swords, Download } from "lucide-react";

export const MODELS = [
  { id: "meta/llama-3.1-70b-instruct", name: "Llama 3.1 70B", description: "Deep reasoning, best for heavy logic" },
  { id: "meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B", description: "Fast, versatile daily usage" },
  { id: "moonshotai/kimi-k2-thinking", name: "Kimi 2 Thinking", description: "Advanced step-by-step reasoning" },
  { id: "moonshotai/kimi-k2-instruct", name: "Kimi 2 Instruct", description: "General knowledge & instructions" },
  { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi 2 Instruct 0905", description: "Stable Sept 0905 snapshot" },
  { id: "stepfun-ai/step-3.5-flash", name: "Step-3.5 Flash", description: "Incredibly fast latency" },
  { id: "z-ai/glm4.7", name: "Zai GLM 4.7", description: "Multilingual & structured output" },
  { id: "mistralai/devstral-2-123b-instruct-2512", name: "Devstral Fast", description: "Specialized for developers & coding" },
  { id: "mistralai/mistral-large-3-675b-instruct-2512", name: "Mistral Large", description: "Massive scale context and complexity" },
  { id: "mistralai/mixtral-8x22b-instruct-v0.1", name: "Mixtral 8x22B", description: "Efficient sparse mixture of experts" },
  { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", description: "Compact Google instruction model" },
  { id: "microsoft/phi-3-mini-128k-instruct", name: "Phi-3 Mini", description: "Small footprint, huge context window" },
  { id: "nvidia/nemotron-4-340b-instruct", name: "Nemotron-4 340B", description: "NVIDIA's massive conversational agent" },
];

export function ChatHeader() {
  const { 
    activeChatId, clearChat, 
    activeModel, setActiveModel,
    isSparMode, setIsSparMode,
    sparModels, setSparModels,
    systemPrompt,
    chats
  } = useChat();

  const getModelName = (modelId?: string) => {
    if (!modelId) return "NVIDIA NIM";
    return MODELS.find((m) => m.id === modelId)?.name || modelId;
  };

  const handleSparModelChange = (index: number, modelId: string) => {
    const newSparModels = [...sparModels];
    newSparModels[index] = modelId;
    setSparModels(newSparModels);
  };

  const exportChat = () => {
    if (!activeChatId) return;
    const chat = chats.find((c) => c.id === activeChatId);
    if (!chat) return;

    let content = `# ${chat.title}\n\n`;
    content += `> **System Persona:** ${systemPrompt}\n\n---\n\n`;
    chat.messages.forEach((m) => {
      content += `### ${m.role === "user" ? "👤 User" : "🤖 Assistant"} (${getModelName(m.model)})\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${chat.title.replace(/\s+/g, "_")}_transcript.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-16 border-b border-border bg-background/90 backdrop-blur-md flex flex-none items-center justify-between px-4 z-10 sticky top-0 overflow-x-auto">
      <div className="flex items-center gap-3">
        <Button
          variant={isSparMode ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setIsSparMode(!isSparMode)}
          className={`shrink-0 rounded-lg transition-colors font-semibold ${isSparMode ? 'text-[var(--icon-accent)] bg-secondary hover:bg-secondary/80' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Swords className="w-4 h-4 mr-2" />
          Spar Mode
        </Button>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

        {!isSparMode ? (
          <Select value={activeModel} onValueChange={(v) => v && setActiveModel(v)}>
            <SelectTrigger className="w-[180px] sm:w-[260px] bg-muted/50 border-border focus:ring-0 shadow-sm font-medium h-auto py-2">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover max-h-[60vh]">
              {MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="rounded-md cursor-pointer py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-sm">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <Select key={idx} value={sparModels[idx]} onValueChange={(v) => v && handleSparModelChange(idx, v)}>
                <SelectTrigger className="w-[140px] sm:w-[180px] bg-muted/50 border-border focus:ring-0 shadow-sm text-xs sm:text-sm font-medium h-auto py-2">
                  <SelectValue placeholder={`Model ${idx + 1}`} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover max-h-[60vh]">
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="rounded-md cursor-pointer text-xs sm:text-sm py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold sm:text-sm">{m.name}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={exportChat}
          className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8 p-0"
          title="Export as Markdown"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => activeChatId && clearChat(activeChatId)}
          className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8 p-0"
          title="Clear Chat"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
