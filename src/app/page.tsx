import { ChatSidebar } from "@/components/layout/chat-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";

export default function Home() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Sidebar */}
      <ChatSidebar />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 h-full relative">
        <ChatHeader />
        <ChatMessages />
        <ChatInput />
      </main>
    </div>
  );
}
