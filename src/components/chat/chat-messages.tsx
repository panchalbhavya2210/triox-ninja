"use client";

import { useChat } from "@/lib/chat-context";
import { Copy, Bot, User, ArrowDown, LayoutGrid, Check, Pencil, RefreshCw, X, Save, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState, useMemo } from "react";
import { Message } from "@/lib/types";
import { MODELS } from "./chat-header";
import { motion, AnimatePresence } from "framer-motion";

type RenderBlock =
  | { type: "user"; message: Message }
  | { type: "assistant"; message: Message }
  | { type: "spar"; messages: Message[] };

const CodeBlock = ({
  children,
  className,
}: {
  children: any;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 bg-background/50 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground rounded-lg"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="w-3 h-3 mr-1" />
          ) : (
            <Copy className="w-3 h-3 mr-1" />
          )}
          <span className="text-[10px] font-medium">
            {copied ? "Copied" : "Copy"}
          </span>
        </Button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto p-4 rounded-xl bg-muted/30 border border-border/50 font-mono text-sm",
          className,
        )}
      >
        <code className={className}>{children}</code>
      </pre>
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
      return !inline && match ? (
        <CodeBlock className={className}>{children}</CodeBlock>
      ) : (
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
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
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
                  <div className="flex w-full group justify-end">
                    <div className="flex gap-4 max-w-[85%] flex-row-reverse">
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
                                  <Save className="w-3 h-3 mr-1" /> Save & Submit
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
                            onClick={() =>
                              activeChatId &&
                              toggleStar(activeChatId, block.message.id)
                            }
                            title={
                              block.message.isStarred ? "Unstar" : "Star message"
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
                            onClick={() =>
                              navigator.clipboard.writeText(block.message.content)
                            }
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {block.type === "assistant" && (
                  <div className="flex w-full group justify-start">
                    <div className="flex gap-4 max-w-[85%] flex-row">
                      <div className="sticky top-0 max-h-max">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-border mt-0 bg-muted">
                          <Bot
                            className="w-4 h-4"
                            style={{ color: "var(--icon-accent)" }}
                          />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity sticky justify-start ">
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
                              block.message.isStarred ? "Unstar" : "Star message"
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
                            onClick={() =>
                              activeChatId &&
                              regenerateMessage(activeChatId, block.message.id)
                            }
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
                            onClick={() =>
                              navigator.clipboard.writeText(block.message.content)
                            }
                          >
                            <Copy className="w-3.5 h-3.5" />
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
                    </div>
                  </div>
                )}

                {block.type === "spar" && (
                  <div className="w-full relative py-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {block.messages.map((message) => (
                        <div
                          key={message.id}
                          className="flex flex-col min-w-0 max-w-full bg-card rounded-2xl border border-border p-4 shadow-sm group"
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                              <Bot
                                className="w-4 h-4"
                                style={{ color: "var(--icon-accent)" }}
                              />
                              <span className="text-xs font-semibold text-foreground">
                                {getModelName(message.model)}
                              </span>
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
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                          <div className="prose-dark text-sm max-w-full overflow-hidden w-full break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>

          {isGenerating && (
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
          )}

          <div ref={bottomRef} className="h-4" />
        </div>

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
