"use client";

import { X } from "lucide-react";
import { useChat, PERSONA_LIBRARY } from "@/lib/chat-context";
import { Button } from "@/components/ui/button";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const {
    themeAccent,
    setThemeAccent,
    cornerRounding,
    setCornerRounding,
    systemPrompt,
    setSystemPrompt,
    activePersonaId,
    setActivePersonaId,
  } = useChat();

  if (!open) return null;

  const ACCENTS = [
    { name: "Fuchsia", value: "#d946ef", class: "bg-fuchsia-500" },
    { name: "Blue", value: "#3b82f6", class: "bg-blue-500" },
    { name: "Emerald", value: "#10b981", class: "bg-emerald-500" },
    { name: "Amber", value: "#f59e0b", class: "bg-amber-500" },
    { name: "Rose", value: "#f43f5e", class: "bg-rose-500" },
    { name: "Zinc", value: "#a1a1aa", class: "bg-zinc-400" },
  ];

  const CORNERS = [
    { name: "Square", value: "0rem" },
    { name: "Default", value: "0.5rem" },
    { name: "Rounded", value: "1.5rem" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-lg overflow-hidden animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold tracking-tight">
            Personalization
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Icon Accent Color
            </h3>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.name}
                  onClick={() => setThemeAccent(accent.value)}
                  className={`w-8 h-8 rounded-full ${accent.class} transition-all border-2 flex items-center justify-center ${themeAccent === accent.value ? "border-white scale-110 shadow-sm" : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"}`}
                  title={accent.name}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Choose an accent color for icons, borders, and highlights. Chat
              text remains readable.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Corner Radius
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {CORNERS.map((corner) => (
                <button
                  key={corner.name}
                  onClick={() => setCornerRounding(corner.value)}
                  className={`py-2 px-3 text-sm font-medium border transition-colors ${
                    cornerRounding === corner.value
                      ? "border-[var(--icon-accent)] bg-[var(--icon-accent)]/10 text-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                  }`}
                  style={{ borderRadius: corner.value }}
                >
                  {corner.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-medium text-foreground">
              Persona Gallery
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {PERSONA_LIBRARY.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    setActivePersonaId(persona.id);
                    setSystemPrompt(persona.prompt);
                  }}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                    activePersonaId === persona.id
                      ? "border-[var(--icon-accent)] bg-[var(--icon-accent)]/10 shadow-sm"
                      : "border-border bg-transparent hover:bg-muted"
                  }`}
                >
                  <span className="text-xl shrink-0">{persona.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {persona.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                      {persona.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border mt-4">
            <h3 className="text-sm font-medium text-foreground">
              Custom Instructions
            </h3>
            <textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                if (
                  !PERSONA_LIBRARY.find((p) => p.prompt === e.target.value)
                ) {
                  setActivePersonaId("custom");
                }
              }}
              placeholder="Describe how the assistant should behave..."
              className="w-full min-h-[100px] bg-muted/50 border border-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-ring transition-all resize-none placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground">
              This prompt is permanently scripting the underlying instructions
              for every new message. Use it for strict coding mode or creative
              personas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
