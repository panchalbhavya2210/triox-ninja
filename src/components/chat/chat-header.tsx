"use client";

import { useChat } from "@/lib/chat-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eraser, Swords, Download, Menu, Expand, Shrink } from "lucide-react";

export const MODELS = [
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    description: "Deep reasoning, best for heavy logic",
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B",
    description: "Fast, versatile daily usage",
  },
  {
    id: "moonshotai/kimi-k2-thinking",
    name: "Kimi 2 Thinking",
    description: "Advanced step-by-step reasoning",
  },
  {
    id: "moonshotai/kimi-k2-instruct",
    name: "Kimi 2 Instruct",
    description: "General knowledge & instructions",
  },
  {
    id: "moonshotai/kimi-k2-instruct-0905",
    name: "Kimi 2 Instruct 0905",
    description: "Stable Sept 0905 snapshot",
  },
  {
    id: "stepfun-ai/step-3.5-flash",
    name: "Step-3.5 Flash",
    description: "Incredibly fast latency",
  },

  {
    id: "mistralai/mistral-large-3-675b-instruct-2512",
    name: "Mistral Large",
    description: "Massive scale context and complexity",
  },
  {
    id: "mistralai/mixtral-8x22b-instruct-v0.1",
    name: "Mixtral 8x22B",
    description: "Efficient sparse mixture of experts",
  },
  {
    id: "google/gemma-2-9b-it",
    name: "Gemma 2 9B",
    description: "Compact Google instruction model",
  },
  {
    id: "microsoft/phi-3-mini-128k-instruct",
    name: "Phi-3 Mini",
    description: "Small footprint, huge context window",
  },
  {
    id: "deepseek-ai/deepseek-v3.1",
    name: "Deepseek V3.1",
    description: "Little slow but good",
  },
  {
    id: "deepseek-ai/deepseek-v3.2",
    name: "Deepseek V3.2",
    description: "Little slow but good",
  },
  {
    id: "tiiuae/falcon3-7b-instruct",
    name: "Falcon 3 7B",
    description: "Little slow but good",
  },
  {
    id: "qwen/qwen3-coder-480b-a35b-instruct",
    name: "Qwen3 Coder 480B",
    description: "Little slow but good",
  },
];

export function ChatHeader() {
  const {
    activeChatId,
    clearChat,
    activeModel,
    setActiveModel,
    isSparMode,
    setIsSparMode,
    sparModels,
    setSparModels,
    systemPrompt,
    chats,
    setIsSidebarOpen,
    isZenMode,
    setIsZenMode,
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

  if (isZenMode) {
    return (
      <div className="h-16 flex-none flex items-center justify-end px-4 z-50 absolute top-0 right-0 w-full pointer-events-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsZenMode(false)}
          className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8 p-0 pointer-events-auto bg-background/50 backdrop-blur-sm border shadow-sm"
          title="Exit Zen Mode"
        >
          <Shrink className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-16 border-b border-border bg-background/90 backdrop-blur-md flex flex-none items-center justify-between px-4 z-10 sticky top-0 overflow-x-auto gap-2">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden text-muted-foreground hover:text-foreground h-8 w-8 shrink-0 rounded-lg -ml-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Button
          variant={isSparMode ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setIsSparMode(!isSparMode)}
          className={`shrink-0 rounded-lg transition-colors font-semibold ${isSparMode ? "text-[var(--icon-accent)] bg-secondary hover:bg-secondary/80" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Swords className="w-4 h-4 mr-2" />
          Spar Mode
        </Button>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

        {!isSparMode ? (
          <Select
            value={activeModel}
            onValueChange={(v) => v && setActiveModel(v)}
          >
            <SelectTrigger className="w-[180px] sm:w-[260px] bg-muted/50 border-border focus:ring-0 shadow-sm font-medium h-auto py-2">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover max-h-[60vh]">
              {MODELS.map((m) => (
                <SelectItem
                  key={m.id}
                  value={m.id}
                  className="rounded-md cursor-pointer py-2"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-sm">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((idx) => (
              <Select
                key={idx}
                value={sparModels[idx]}
                onValueChange={(v) => v && handleSparModelChange(idx, v)}
              >
                <SelectTrigger className="w-[140px] sm:w-[180px] bg-muted/50 border-border focus:ring-0 shadow-sm text-xs sm:text-sm font-medium h-auto py-2">
                  <SelectValue placeholder={`Model ${idx + 1}`} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover max-h-[60vh]">
                  {MODELS.map((m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                      className="rounded-md cursor-pointer text-xs sm:text-sm py-2"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-semibold sm:text-sm">
                          {m.name}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {m.description}
                        </span>
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
          onClick={() => setIsZenMode(true)}
          className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8 p-0 ml-2"
          title="Enter Zen Mode"
        >
          <Expand className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
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
