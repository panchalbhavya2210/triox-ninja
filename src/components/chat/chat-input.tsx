"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/chat-context";
import { Send, Square, Paperclip, X, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const {
    activeChatId,
    generatingChats,
    sendMessage,
    stopGeneration,
    isZenMode,
  } = useChat();

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGenerating = activeChatId ? !!generatingChats[activeChatId] : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || !activeChatId || isGenerating || isSearching) return;

    let content = input.trim() || (attachments.length > 0 ? "Attached image(s)" : "");
    const currentAttachments = [...attachments];
    
    if (isWebSearchEnabled && input.trim()) {
      setIsSearching(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input.trim() })
        });
        const data = await res.json();
        if (data.success && data.results?.length > 0) {
          const searchContext = data.results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nSummary: ${r.description}`).join('\n\n');
          content = `${content}\n\n<SEARCH_CONTEXT>\n${searchContext}\n</SEARCH_CONTEXT>\n\n<SYSTEM_INSTRUCTION>The user has requested a live web search. Use the provided SEARCH_CONTEXT to inform your answer. Always cite the URLs provided if you use the information.</SYSTEM_INSTRUCTION>`;
        }
      } catch (err) {
        console.error("Search failed:", err);
      }
      setIsSearching(false);
    }
    
    setInput("");
    setAttachments([]);
    await sendMessage(content, undefined, currentAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn(
      "p-4 border-t mt-auto shrink-0 relative flex-col transition-all duration-500",
      isZenMode ? "bg-transparent border-transparent max-w-4xl mx-auto w-full mb-6" : "bg-background/90 backdrop-blur-md border-border"
    )}>
      <div className="max-w-3xl mx-auto relative w-full">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3 animate-in fade-in slide-in-from-bottom-2">
            {attachments.map((url, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-border shadow-sm group bg-muted"
              >
                <img
                  src={url}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm text-foreground rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity border border-border shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative flex items-end bg-card rounded-2xl p-1 pb-1 transition-all focus-within:ring-2 focus-within:ring-ring border border-border shadow-sm"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div className="pb-1 pl-1 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              title="Attach images"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
              className={cn(
                "w-10 h-10 rounded-xl transition-colors shrink-0",
                isWebSearchEnabled 
                  ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Toggle Live Web Search"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
            </Button>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="w-full max-h-[200px] bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-foreground placeholder:text-muted-foreground"
            rows={1}
          />
          <div className="pb-1 pr-1 pl-2 shrink-0">
            {isGenerating ? (
              <Button
                type="button"
                size="icon"
                onClick={() => activeChatId && stopGeneration(activeChatId)}
                className="w-10 h-10 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            ) }
          </div>
        </form>
        <div className="text-center mt-3 text-xs text-muted-foreground font-medium">
          Powered by NVIDIA NIM • Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
