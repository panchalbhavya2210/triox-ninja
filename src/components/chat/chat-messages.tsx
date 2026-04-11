"use client";

import { useChat } from "@/lib/chat-context";
import {
  Copy,
  Bot,
  User,
  ArrowDown,
  LayoutGrid,
  Check,
  Pencil,
  RefreshCw,
  X,
  Save,
  Star,
  Zap,
  Wand2,
  MessageSquareText,
  Swords,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState, useMemo } from "react";
import mermaid from "mermaid";
import { Message } from "@/lib/types";
import { MODELS } from "./chat-header";
import { motion, AnimatePresence } from "framer-motion";

type RenderBlock =
  | { type: "user"; message: Message }
  | { type: "assistant"; message: Message }
  | { type: "spar"; messages: Message[] };

export function hapticFeedback(pattern: number | number[] = 50) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

const CodeBlock = ({
  children,
  className,
}: {
  children: any;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"code" | "preview">("code");

  const onCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    hapticFeedback(30);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWebComponent =
    className?.includes("language-html") ||
    className?.includes("language-svg") ||
    className?.includes("language-xml");
  const langName = className?.replace("language-", "") || "code";

  return (
    <div className="relative group/code my-4 overflow-hidden rounded-xl border border-zinc-800/80 shadow-md bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-zinc-400 capitalize">
            {langName}
          </span>
          {isWebComponent && (
            <div className="flex bg-zinc-950 rounded-md p-0.5 border border-zinc-800 shadow-inner">
              <button
                onClick={() => setMode("code")}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all",
                  mode === "code"
                    ? "bg-zinc-800 shadow-sm text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                Code
              </button>
              <button
                onClick={() => setMode("preview")}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold rounded-sm transition-all flex items-center gap-1",
                  mode === "preview"
                    ? "bg-[var(--icon-accent)] shadow-[0_0_10px_var(--icon-accent)] text-white"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Zap className="w-2.5 h-2.5" /> Preview
              </button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="w-3 h-3 " />
          ) : (
            <Copy className="w-3 h-3 " />
          )}
        </Button>
      </div>

      {mode === "code" ? (
        <pre
          className={cn(
            "overflow-x-auto p-4 font-mono text-sm text-zinc-300 m-0 custom-scrollbar",
            className,
          )}
        >
          <code className={className}>{children}</code>
        </pre>
      ) : (
        <div className="bg-white relative border-t border-zinc-800 group/preview h-[400px] resize-y overflow-auto overflow-x-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/10 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-semibold text-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none">
            Interactive Preview
          </div>
          <iframe
            srcDoc={String(children)}
            className="w-full h-full min-h-[400px] border-0 outline-none"
            sandbox="allow-scripts"
            title="Preview"
          />
        </div>
      )}
    </div>
  );
};

const MermaidBlock = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
    });
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to render Mermaid chart");
      }
    };
    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 my-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-mono overflow-auto relative">
        <div className="font-bold flex items-center gap-2 mb-2">
          <X className="w-4 h-4" /> Mermaid Syntax Error
        </div>
        {error}
      </div>
    );
  }

  return (
    <div className="my-4 p-4 rounded-xl border border-border bg-card/50 flex justify-center overflow-x-auto shadow-sm group">
      {svg ? (
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="w-full h-full flex justify-center transition-opacity opacity-100"
        />
      ) : (
        <div className="animate-pulse flex items-center justify-center p-8 w-full">
          <Wand2 className="w-5 h-5 text-muted-foreground animate-bounce" />
        </div>
      )}
    </div>
  );
};

export function ChatMessages() {
  const {
    chats,
    activeChatId,
    updateMessage,
    regenerateMessage,
    toggleStar,
    generatingChats,
    sendMessage,
    isZenMode,
    branchChat,
  } = useChat();
  const activeChat = chats.find((c) => c.id === activeChatId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const isGenerating = activeChatId ? !!generatingChats[activeChatId] : false;

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      if (!inline && match) {
        if (match[1] === "mermaid") {
          return <MermaidBlock chart={String(children)} />;
        }
        return <CodeBlock className={className}>{children}</CodeBlock>;
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const handleEditOpen = (message: Message) => {
    setEditingMessageId(message.id);
    setEditValue(message.content);
  };

  const handleEditSave = () => {
    if (!activeChatId || !editingMessageId) return;
    updateMessage(activeChatId, editingMessageId, editValue);
    const mid = editingMessageId;
    setEditingMessageId(null);
    regenerateMessage(activeChatId, mid);
  };

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [selectedText, setSelectedText] = useState("");

  const handleSelection = () => {
    const selection = window.getSelection();
    if (
      selection &&
      selection.toString().trim().length > 0 &&
      !selection.isCollapsed
    ) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const top =
          rect.top - containerRect.top + containerRef.current!.scrollTop;
        const left = rect.left - containerRect.left + rect.width / 2;
        setSelectionRect(new DOMRect(left, top, rect.width, rect.height));
        setSelectedText(selection.toString().trim());
      }
    } else {
      setSelectionRect(null);
      setSelectedText("");
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () =>
      document.removeEventListener("selectionchange", handleSelection);
  }, []);

  const handleQuickAction = (action: "explain" | "summarize") => {
    if (!selectedText) return;
    hapticFeedback(40);
    const prompt =
      action === "explain"
        ? `Explain this portion of text:\n\n"${selectedText}"`
        : `Summarize this:\n\n"${selectedText}"`;
    sendMessage(prompt);
    setSelectionRect(null);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollButton(!isNearBottom);
  };

  const getModelName = (modelId?: string) => {
    if (!modelId) return "NVIDIA NIM";
    return MODELS.find((m) => m.id === modelId)?.name || modelId;
  };

  const blocks = useMemo(() => {
    if (!activeChat) return [];
    const result: RenderBlock[] = [];
    let idx = 0;
    while (idx < activeChat.messages.length) {
      const msg = activeChat.messages[idx];
      if (msg.role === "assistant" && msg.groupId) {
        const groupModelModels = [msg];
        while (
          idx + 1 < activeChat.messages.length &&
          activeChat.messages[idx + 1].role === "assistant" &&
          activeChat.messages[idx + 1].groupId === msg.groupId
        ) {
          idx++;
          groupModelModels.push(activeChat.messages[idx]);
        }
        result.push({ type: "spar", messages: groupModelModels });
      } else {
        result.push({
          type: msg.role === "user" ? "user" : "assistant",
          message: msg,
        });
      }
      idx++;
    }
    return result;
  }, [activeChat?.messages]);

  if (!activeChat || activeChat.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center border border-border">
          <Bot className="w-8 h-8" style={{ color: "var(--icon-accent)" }} />
        </div>
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          Welcome to Triox
        </h2>
        <p className="text-muted-foreground flex items-center justify-center gap-2 max-w-sm">
          <span>Toggle</span>
          <span className="bg-secondary px-2 py-0.5 rounded-md border border-border text-xs flex items-center gap-1 font-medium">
            <LayoutGrid className="w-3 h-3" /> Spar Mode
          </span>
          <span>to compare 3 models!</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 scroll-smooth relative"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {/* Ambient glowing background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.02, 0.05, 0.02],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--icon-accent)] blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.08, 0.03],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5,
          }}
          className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/20 blur-[120px]"
        />
      </div>

      <div
        className={cn(
          "mx-auto space-y-8 pb-10 relative z-10 w-full transition-all duration-500",
          isZenMode ? "max-w-6xl" : "max-w-4xl",
        )}
      >
        <AnimatePresence initial={false}>
          {blocks.map((block) => {
            const key =
              block.type === "spar"
                ? "spar-" + block.messages[0].id
                : block.message.id;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full"
              >
                {block.type === "user" && (
                  <div className="flex w-full group justify-end overflow-hidden">
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={{ left: 0.2, right: 0 }}
                      dragSnapToOrigin={true}
                      onDragEnd={(e, info) => {
                        if (info.offset.x < -40) {
                          hapticFeedback(30);
                          handleEditOpen(block.message);
                        }
                      }}
                      className="flex gap-4 max-w-[85%] flex-row-reverse w-full relative"
                    >
                      {/* Swipe left to edit visual indicator */}
                      <div
                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 text-muted-foreground pointer-events-none transition-opacity"
                        style={{
                          opacity:
                            editingMessageId !== block.message.id
                              ? undefined
                              : 0,
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </div>
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-border mt-1 bg-secondary">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <div className="flex flex-col min-w-0 max-w-full relative group/message">
                        <div className="px-4 py-3 rounded-2xl min-w-0 break-words bg-zinc-800 text-white">
                          {editingMessageId === block.message.id ? (
                            <div className="flex flex-col gap-2 min-w-[300px]">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-transparent border-0 focus:ring-0 resize-none text-sm p-0 text-white outline-none"
                                autoFocus
                                rows={Math.max(3, editValue.split("\n").length)}
                              />
                              <div className="flex justify-end gap-2 border-t border-white/10 pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white/60 hover:text-white hover:bg-white/10 h-7 text-xs"
                                  onClick={() => setEditingMessageId(null)}
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 text-xs font-semibold"
                                  onClick={handleEditSave}
                                >
                                  <Save className="w-3 h-3 mr-1" /> Save &
                                  Submit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="prose-dark max-w-full overflow-hidden w-full break-words">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {block.message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity sticky bottom-4 pt-1 justify-end pr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 transition-colors bg-background/50 backdrop-blur-sm border shadow-sm",
                              block.message.isStarred
                                ? "text-yellow-500 hover:text-yellow-600"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => {
                              if (activeChatId)
                                toggleStar(activeChatId, block.message.id);
                              hapticFeedback();
                            }}
                            title={
                              block.message.isStarred
                                ? "Unstar"
                                : "Star message"
                            }
                          >
                            <Star
                              className={cn(
                                "w-3.5 h-3.5",
                                block.message.isStarred && "fill-current",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
                            onClick={() => handleEditOpen(block.message)}
                            title="Edit message"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                block.message.content,
                              );
                              hapticFeedback(20);
                            }}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
                            onClick={() => {
                              if (activeChatId) {
                                hapticFeedback();
                                branchChat(activeChatId, block.message.id);
                              }
                            }}
                            title="Branch conversation from here"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {block.type === "assistant" && (
                  <div className="flex w-full group justify-start">
                    <motion.div className="flex gap-4 max-w-[85%] flex-row w-full relative">
                      {/* Swipe right to regenerate visual indicator */}
                      <div className="absolute -left-8 top-4 opacity-0 text-muted-foreground pointer-events-none transition-opacity">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div className="sticky top-0 max-h-max">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-border mt-0 bg-muted">
                          <Bot
                            className="w-4 h-4"
                            style={{ color: "var(--icon-accent)" }}
                          />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity sticky justify-start flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 transition-colors bg-background/50 backdrop-blur-sm border shadow-sm",
                              block.message.isStarred
                                ? "text-yellow-500 hover:text-yellow-600"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() =>
                              activeChatId &&
                              toggleStar(activeChatId, block.message.id)
                            }
                            title={
                              block.message.isStarred
                                ? "Unstar"
                                : "Star message"
                            }
                          >
                            <Star
                              className={cn(
                                "w-3.5 h-3.5",
                                block.message.isStarred && "fill-current",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
                            onClick={() => {
                              if (activeChatId)
                                regenerateMessage(
                                  activeChatId,
                                  block.message.id,
                                );
                              hapticFeedback();
                            }}
                            disabled={isGenerating}
                            title="Regenerate response"
                          >
                            <RefreshCw
                              className={cn(
                                "w-3.5 h-3.5",
                                isGenerating && "animate-spin",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                block.message.content,
                              );
                              hapticFeedback(20);
                            }}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm border shadow-sm"
                            onClick={() => {
                              if (activeChatId) {
                                hapticFeedback();
                                branchChat(activeChatId, block.message.id);
                              }
                            }}
                            title="Branch conversation from here"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0 max-w-full relative group/message">
                        <div className="text-xs text-muted-foreground font-medium capitalize tracking-tight ml-0">
                          {getModelName(block.message.model)}
                        </div>
                        <div className="pr-4 py-2 rounded-2xl min-w-0 break-words bg-transparent text-foreground">
                          <div className="prose-dark max-w-full overflow-hidden w-full break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {block.message.content}
                            </ReactMarkdown>
                          </div>
                          {block.message.latency && (
                            <div className="flex gap-2 items-center mt-2 px-1 animate-in fade-in slide-in-from-top-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold bg-muted/40 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-border/50 shadow-sm">
                                <Zap className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500/20" />
                                {block.message.latency}ms
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {block.type === "spar" && (
                  <div className="w-full relative py-4 mb-8 mt-4 bg-muted/20 rounded-3xl p-6 border border-border/50 shadow-inner">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-background border border-border rounded-full text-[10px] uppercase font-bold tracking-widest text-[var(--icon-accent)] flex items-center gap-1.5 shadow-sm">
                      <Swords className="w-3 h-3" /> Multi-Agent War Room
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {block.messages.map((message, idx) => {
                        const colors = [
                          "from-blue-500/10",
                          "from-fuchsia-500/10",
                          "from-emerald-500/10",
                        ];
                        const iconColors = [
                          "text-blue-500",
                          "text-fuchsia-500",
                          "text-emerald-500",
                        ];
                        return (
                          <div
                            key={message.id}
                            className="flex flex-col min-w-0 max-w-full bg-card rounded-2xl border border-border/80 p-5 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden"
                          >
                            {/* Ambient Top Gradient */}
                            <div
                              className={cn(
                                "absolute top-0 left-0 w-full h-32 bg-gradient-to-b to-transparent pointer-events-none opacity-50",
                                colors[idx % colors.length],
                              )}
                            />

                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 relative z-10">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "p-1.5 rounded-lg bg-background border shadow-sm",
                                    iconColors[idx % iconColors.length],
                                  )}
                                >
                                  <Bot className="w-4 h-4 text-current" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                                    Agent {idx + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-foreground">
                                    {getModelName(message.model)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() =>
                                  navigator.clipboard.writeText(message.content)
                                }
                                title="Copy message"
                              >
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="prose-dark text-sm max-w-full overflow-hidden w-full break-words relative z-10">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-center gap-3 pl-12 py-2"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border/50 animate-pulse">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex gap-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30 shadow-sm backdrop-blur-sm">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      delay: i * 0.2,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--icon-accent)]"
                  />
                ))}
              </div>
            </motion.div>
          )} */}

        <div ref={bottomRef} className="h-4" />
      </div>

      <AnimatePresence>
        {selectionRect && selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-700/50 rounded-lg shadow-2xl backdrop-blur-xl pointer-events-auto"
            style={{
              top: `${selectionRect.y - 48}px`,
              left: `${selectionRect.x}px`,
              transform: "translateX(-50%)", // Center the tooltip
            }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
              onPointerDown={() => handleQuickAction("explain")}
            >
              <Wand2 className="w-3 h-3 mr-1.5" /> Explain
            </Button>
            <div className="w-[1px] h-4 bg-zinc-700" />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
              onPointerDown={() => handleQuickAction("summarize")}
            >
              <MessageSquareText className="w-3 h-3 mr-1.5" /> Summarize
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {showScrollButton && (
        <div className="sticky bottom-6 left-1/2 -translate-x-1/2 flex justify-center z-10 pointer-events-none w-full max-w-3xl">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-md bg-background pointer-events-auto h-10 w-10 text-muted-foreground hover:text-foreground transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
            onClick={scrollToBottom}
          >
            <ArrowDown className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
