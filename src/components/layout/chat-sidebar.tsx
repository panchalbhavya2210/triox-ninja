"use client";

import { useChat } from "@/lib/chat-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MessageSquare, Trash2, Zap, Settings, Search, Pin, PinOff, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { SettingsDialog } from "./settings-dialog";

export function ChatSidebar() {
  const { chats, activeChatId, setActiveChatId, createChat, deleteChat, togglePin } =
    useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStarred = !showStarredOnly || chat.messages.some(m => m.isStarred);
      return matchesSearch && matchesStarred;
    });
  }, [chats, searchQuery, showStarredOnly]);

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const recentChats = filteredChats.filter((c) => !c.isPinned);

  const renderChatItem = (chat: any) => (
    <div
      key={chat.id}
      className={cn(
        "group relative flex border border-transparent items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
        activeChatId === chat.id
          ? "bg-secondary text-secondary-foreground border-border/50 shadow-sm"
          : "hover:bg-muted text-muted-foreground",
      )}
      onClick={() => setActiveChatId(chat.id)}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      <div className="flex-1 truncate text-sm">{chat.title}</div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            togglePin(chat.id);
          }}
          title={chat.isPinned ? "Unpin chat" : "Pin chat"}
        >
          {chat.isPinned ? (
            <PinOff className="w-3.5 h-3.5" />
          ) : (
            <Pin className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            deleteChat(chat.id);
          }}
          title="Delete chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full shrink-0 relative">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Zap
            className="w-6 h-6 shrink-0"
            style={{ color: "var(--icon-accent)", fill: "var(--icon-accent)" }}
          />
          <h1 className="font-semibold text-lg text-foreground tracking-tight">
            Triox
          </h1>
        </div>
        <Button
          onClick={createChat}
          className="w-full justify-start gap-2 font-medium rounded-xl shadow-sm mb-4"
        >
          <PlusCircle className="w-4 h-4" />
          New Chat
        </Button>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-ring transition-all placeholder:text-muted-foreground/70 outline-none"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={cn(
              "shrink-0 rounded-xl h-9 w-9 border transition-all",
              showStarredOnly 
                ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" 
                : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
            )}
            title={showStarredOnly ? "Show all chats" : "Show only chats with stars"}
          >
            <Star className={cn("w-4 h-4", showStarredOnly && "fill-current")} />
          </Button>
        </div>
      </div>
      <Separator className="bg-border/50" />
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {pinnedChats.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5 ml-0.5">
                <Pin className="w-2.5 h-2.5" />
                Pinned
              </div>
              {pinnedChats.map(renderChatItem)}
              <Separator className="mt-4 bg-border/30" />
            </div>
          )}

          <div className="space-y-1">
            {pinnedChats.length > 0 && (
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-0.5">
                Recent
              </div>
            )}
            {recentChats.map(renderChatItem)}
            {filteredChats.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground italic">
                No chats found
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium text-sm">Settings</span>
        </Button>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
