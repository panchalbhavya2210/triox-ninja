"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { Chat, Message, Role } from "./types";

export const PERSONA_LIBRARY = [
  {
    id: "default",
    name: "Standard",
    icon: "🤖",
    description: "Helpful and efficient developer assistant",
    prompt:
      "You are Triox, a helpful and efficient AI assistant built for developers.",
  },
  {
    id: "coding-ninja",
    name: "Coding Ninja",
    icon: "🥷",
    description: "Concise, bug-squashing code specialist",
    prompt:
      "You are a Coding Ninja. Provide extremely concise, clean, and bug-free code. Avoid long explanations unless asked. Focus on performance and modern best practices.",
  },
  {
    id: "tech-architect",
    name: "Architect",
    icon: "🏛️",
    description: "Deep reasoning for complex systems",
    prompt:
      "You are a Senior System Architect. Analyze requests with a focus on scalability, maintainability, and design patterns. Provide high-level abstractions before drilling into implementation.",
  },
  {
    id: "creative-writer",
    name: "Creative",
    icon: "✍️",
    description: "Eloquent and imaginative prose",
    prompt:
      "You are a Creative Writing assistant. Use rich, evocative language. Focus on tone, storytelling, and narrative flow. Be imaginative and unrestricted.",
  },
  {
    id: "debugger",
    name: "Debugger",
    icon: "🐞",
    description: "Step-by-step troubleshooting",
    prompt:
      "You are a Debugging Expert. Your goal is to find the root cause of issues by asking clarifying questions and analyzing code step-by-step. Be methodical and skeptical of assumptions.",
  },
];

interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  activeModel: string;
  setActiveModel: (model: string) => void;
  isSparMode: boolean;
  setIsSparMode: (mode: boolean) => void;
  sparModels: string[];
  setSparModels: (models: string[]) => void;
  generatingChats: Record<string, boolean>;
  setGeneratingStatus: (chatId: string, status: boolean) => void;
  themeAccent: string;
  setThemeAccent: (color: string) => void;
  cornerRounding: string;
  setCornerRounding: (radius: string) => void;
  createChat: () => void;
  deleteChat: (id: string) => void;
  clearChat: (id: string) => void;
  setActiveChatId: (id: string) => void;
  addMessage: (
    chatId: string,
    role: Role,
    content: string,
    model?: string,
    groupId?: string,
  ) => string;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  branchChat: (chatId: string, messageId: string) => void;
  togglePin: (chatId: string) => void;
  truncateFromMessage: (chatId: string, messageId: string) => void;
  sendMessage: (
    content: string,
    specificChatId?: string,
    images?: string[],
  ) => Promise<void>;
  regenerateMessage: (chatId: string, messageId: string) => Promise<void>;
  toggleStar: (chatId: string, messageId: string) => void;
  stopGeneration: (chatId: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  activePersonaId: string;
  setActivePersonaId: (id: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isZenMode: boolean;
  setIsZenMode: (isZen: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState("meta/llama-3.1-70b-instruct");
  const [isSparMode, setIsSparMode] = useState(false);
  const [sparModels, setSparModels] = useState([
    "meta/llama-3.1-70b-instruct",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "google/gemma-2-9b-it",
  ]);
  const [generatingChats, setGeneratingChats] = useState<
    Record<string, boolean>
  >({});

  // Theme state
  const [themeAccent, setThemeAccent] = useState("#d946ef"); // default fuchsia
  const [cornerRounding, setCornerRounding] = useState("0.5rem"); // default
  const [systemPrompt, setSystemPrompt] = useState(PERSONA_LIBRARY[0].prompt);
  const [activePersonaId, setActivePersonaId] = useState("default");
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const abortControllersRef = useRef<Record<string, AbortController[]>>({});

  const setGeneratingStatus = (chatId: string, status: boolean) => {
    setGeneratingChats((prev) => ({ ...prev, [chatId]: status }));
  };

  const togglePin = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isPinned: !c.isPinned } : c)),
    );
  };

  const truncateFromMessage = (chatId: string, messageId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const index = c.messages.findIndex((m) => m.id === messageId);
          if (index !== -1) {
            return {
              ...c,
              messages: c.messages.slice(0, index),
              updatedAt: Date.now(),
            };
          }
        }
        return c;
      }),
    );
  };

  const branchChat = (chatId: string, messageId: string) => {
    setChats((prev) => {
      const sourceChat = prev.find((c) => c.id === chatId);
      if (!sourceChat) return prev;
      
      const messageIndex = sourceChat.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return prev;

      const newChatId = crypto.randomUUID();
      const newChat: Chat = {
        ...sourceChat,
        id: newChatId,
        title: `${sourceChat.title} (Branch)`,
        isPinned: false,
        messages: sourceChat.messages.slice(0, messageIndex + 1),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setActiveChatId(newChatId);
      return [newChat, ...prev];
    });
  };

  const addMessage = (
    chatId: string,
    role: Role,
    content: string,
    model?: string,
    groupId?: string,
  ) => {
    const messageId = crypto.randomUUID();
    const newMessage: Message = {
      id: messageId,
      role,
      content,
      createdAt: Date.now(),
      model,
      groupId,
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          let title = c.title;
          if (c.messages.length === 0 && role === "user") {
            title =
              content.substring(0, 30) + (content.length > 30 ? "..." : "");
          }
          return {
            ...c,
            title,
            messages: [...c.messages, newMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      }),
    );
    return messageId;
  };

  const updateMessage = (
    chatId: string,
    messageId: string,
    content: string,
  ) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, content } : m,
            ),
            updatedAt: Date.now(),
          };
        }
        return c;
      }),
    );
  };

  const executeFetchStream = async (
    targetChatId: string,
    messagesPayload: any[],
    modelId: string,
    assistantMessageId: string,
    signal: AbortSignal,
  ) => {
    const startTime = Date.now();
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesPayload,
          model: modelId,
        }),
        signal,
      });

      if (!response.ok) throw new Error("Network response was not ok");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let textBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.substring(6));
                const delta = data.choices[0]?.delta?.content || "";
                textBuffer += delta;
                const latency = Date.now() - startTime;

                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id === targetChatId) {
                      return {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: textBuffer, latency }
                            : m,
                        ),
                      };
                    }
                    return c;
                  }),
                );
              } catch (e) {}
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Chat generation error:", error);
        updateMessage(
          targetChatId,
          assistantMessageId,
          "⚠️ **Error:** Failed to gather response from the NVIDIA NIM API.",
        );
      }
    }
  };

  const stopGeneration = (chatId: string) => {
    if (abortControllersRef.current[chatId]) {
      abortControllersRef.current[chatId].forEach((c) => c.abort());
      abortControllersRef.current[chatId] = [];
      setGeneratingStatus(chatId, false);
    }
  };

  const sendMessage = async (
    content: string,
    specificChatId?: string,
    images?: string[],
  ) => {
    const targetChatId = specificChatId || activeChatId;
    if (!targetChatId || !content.trim()) return;

    const activeChat = chats.find((c) => c.id === targetChatId);
    if (!activeChat) return;

    setGeneratingStatus(targetChatId, true);
    abortControllersRef.current[targetChatId] = [];

    const prepareContent = (text: string, currentImages?: string[]) => {
      if (!currentImages || currentImages.length === 0) return text;
      const contentParts: any[] = [{ type: "text", text }];
      currentImages.forEach((url) => {
        contentParts.push({ type: "image_url", image_url: { url } });
      });
      return contentParts;
    };

    const messagesPayloadBase = [
      { role: "system", content: systemPrompt },
      ...activeChat.messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prepareContent(content.trim(), images) },
    ];

    if (isSparMode) {
      const groupId = crypto.randomUUID();
      addMessage(targetChatId, "user", content.trim(), undefined, groupId);

      const fetchPromises = sparModels.map((modelId) => {
        const assistantMessageId = addMessage(
          targetChatId,
          "assistant",
          "",
          modelId,
          groupId,
        );
        const controller = new AbortController();
        abortControllersRef.current[targetChatId].push(controller);
        return executeFetchStream(
          targetChatId,
          messagesPayloadBase,
          modelId,
          assistantMessageId,
          controller.signal,
        );
      });

      await Promise.allSettled(fetchPromises);
    } else {
      addMessage(targetChatId, "user", content.trim());
      const assistantMessageId = addMessage(
        targetChatId,
        "assistant",
        "",
        activeModel,
      );
      const controller = new AbortController();
      abortControllersRef.current[targetChatId].push(controller);

      await executeFetchStream(
        targetChatId,
        messagesPayloadBase,
        activeModel,
        assistantMessageId,
        controller.signal,
      );
    }

    setGeneratingStatus(targetChatId, false);
    abortControllersRef.current[targetChatId] = [];
  };

  const regenerateMessage = async (chatId: string, messageId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    const msgIndex = chat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const messageToRegenerate = chat.messages[msgIndex];
    let userContent = "";
    let truncateAt = -1;

    if (messageToRegenerate.role === "assistant") {
      let i = msgIndex - 1;
      while (i >= 0 && chat.messages[i].role !== "user") i--;
      if (i === -1) return;
      userContent = chat.messages[i].content;
      truncateAt = i + 1;
    } else {
      userContent = messageToRegenerate.content;
      truncateAt = msgIndex + 1;
    }

    stopGeneration(chatId);

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.slice(0, truncateAt - 1),
            updatedAt: Date.now(),
          };
        }
        return c;
      }),
    );

    setTimeout(() => {
      sendMessage(userContent, chatId);
    }, 0);
  };

  const toggleStar = (chatId: string, messageId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, isStarred: !m.isStarred } : m,
            ),
          };
        }
        return c;
      }),
    );
  };

  const createChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id: string) => {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const newChat: Chat = {
          id: crypto.randomUUID(),
          title: "New Chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveChatId(newChat.id);
        return [newChat];
      }
      if (activeChatId === id) setActiveChatId(remaining[0].id);
      return remaining;
    });
  };

  const clearChat = (id: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: [], updatedAt: Date.now(), title: "New Chat" }
          : c,
      ),
    );
  };

  useEffect(() => {
    const savedChats = localStorage.getItem("nim_chat_history");
    const savedActiveChatId = localStorage.getItem("nim_active_chat_id");
    const savedModel = localStorage.getItem("nim_active_model");
    const savedSparMode = localStorage.getItem("nim_spar_mode");
    const savedSparModels = localStorage.getItem("nim_spar_models");
    const savedAccent = localStorage.getItem("triox_theme_accent");
    const savedCorner = localStorage.getItem("triox_corner_rounding");
    const savedSystemPrompt = localStorage.getItem("triox_system_prompt");
    const savedPersonaId = localStorage.getItem("triox_active_persona_id");

    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (e) {
        console.error("Failed to parse chats from local storage");
      }
    } else {
      const initialChat: Chat = {
        id: crypto.randomUUID(),
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChats([initialChat]);
      setActiveChatId(initialChat.id);
    }

    if (savedActiveChatId) setActiveChatId(savedActiveChatId);
    if (savedModel) setActiveModel(savedModel);
    if (savedSparMode) setIsSparMode(savedSparMode === "true");
    if (savedSparModels) {
      try {
        setSparModels(JSON.parse(savedSparModels));
      } catch (e) {}
    }
    if (savedPersonaId) setActivePersonaId(savedPersonaId);

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder="Search chats..."]',
        ) as HTMLInputElement;
        searchInput?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        createChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createChat]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("nim_chat_history", JSON.stringify(chats));
      if (activeChatId)
        localStorage.setItem("nim_active_chat_id", activeChatId);
      localStorage.setItem("nim_active_model", activeModel);
      localStorage.setItem("nim_spar_mode", isSparMode.toString());
      localStorage.setItem("nim_spar_models", JSON.stringify(sparModels));
      localStorage.setItem("triox_theme_accent", themeAccent);
      localStorage.setItem("triox_corner_rounding", cornerRounding);
      localStorage.setItem("triox_system_prompt", systemPrompt);
      localStorage.setItem("triox_active_persona_id", activePersonaId);
    }
  }, [
    chats,
    activeChatId,
    activeModel,
    isSparMode,
    sparModels,
    themeAccent,
    cornerRounding,
    systemPrompt,
    activePersonaId,
    isLoaded,
  ]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeModel,
        setActiveModel,
        isSparMode,
        setIsSparMode,
        sparModels,
        setSparModels,
        generatingChats,
        setGeneratingStatus,
        themeAccent,
        setThemeAccent,
        cornerRounding,
        setCornerRounding,
        createChat,
        deleteChat,
        clearChat,
        setActiveChatId,
        addMessage,
        updateMessage,
        togglePin,
        truncateFromMessage,
        branchChat,
        sendMessage,
        regenerateMessage,
        toggleStar,
        stopGeneration,
        systemPrompt,
        setSystemPrompt,
        activePersonaId,
        setActivePersonaId,
        isSidebarOpen,
        setIsSidebarOpen,
        isZenMode,
        setIsZenMode,
      }}
    >
      {isLoaded && (
        <>
          <style>{`
            :root {
              --radius: ${cornerRounding};
              --icon-accent: ${themeAccent};
            }
          `}</style>
          {children}
        </>
      )}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
