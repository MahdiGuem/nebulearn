"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    chunksUsed?: string[];
    documentsReferenced?: { id: string; title: string }[];
    weaknessesContext?: string[];
  };
  createdAt: string;
}

interface SourceDocument {
  id: string;
  title: string;
}

export function ChatClient({
  classId,
  className,
}: {
  classId: string;
  className: string;
}) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSources, setShowSources] = useState<SourceDocument[] | null>(null);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, [classId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?classId=${classId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);
    setError(null);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, classId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: data.messageId || crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        metadata: {
          documentsReferenced: data.sources,
        },
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showMessageSources = (metadata?: ChatMessage["metadata"]) => {
    if (metadata?.documentsReferenced) {
      setShowSources(metadata.documentsReferenced);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stars">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10 backdrop-blur-md bg-black/30">
        <Link
          href={`/student/classes/${classId}`}
          className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-purple-200">AI Study Assistant</h1>
          <p className="text-sm text-white/50">{className}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-white/50">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">🤖</div>
            <div className="space-y-2">
              <h2 className="title text-2xl">Ask me anything!</h2>
              <p className="text-white/50 max-w-md">
                I can help you understand your study materials, clarify concepts,
                and answer questions based on your class documents.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg w-full mt-4">
              <button
                type="button"
                onClick={() => setInput("Can you explain the main concepts?")}
                className="text-left p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-all text-sm text-white/80 cursor-pointer pointer-events-auto relative z-20"
                disabled={isLoading}
              >
                💡 Explain the main concepts
              </button>
              <button
                type="button"
                onClick={() => setInput("What are the key points to remember?")}
                className="text-left p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-all text-sm text-white/80 cursor-pointer pointer-events-auto relative z-20"
                disabled={isLoading}
              >
                📝 Key points to remember
              </button>
              <button
                type="button"
                onClick={() => setInput("Can you give me an example?")}
                className="text-left p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-all text-sm text-white/80 cursor-pointer pointer-events-auto relative z-20"
                disabled={isLoading}
              >
                🔍 Give me an example
              </button>
              <button
                type="button"
                onClick={() => setInput("Help me understand this better")}
                className="text-left p-3 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-all text-sm text-white/80 cursor-pointer pointer-events-auto relative z-20"
                disabled={isLoading}
              >
                🎯 Help me understand
              </button>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-purple-600/80 border border-purple-500/50 rounded-br-sm"
                    : "bg-white/10 border border-white/20 rounded-bl-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/50">
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </span>
                  {message.role === "assistant" &&
                    message.metadata?.documentsReferenced && (
                      <button
                        onClick={() => showMessageSources(message.metadata)}
                        className="text-xs text-purple-300 hover:text-purple-200 underline"
                      >
                        Sources
                      </button>
                    )}
                </div>
                <div className="whitespace-pre-wrap text-sm md:text-base text-white/90">
                  {message.content}
                </div>
                <div className="text-xs text-white/30 mt-2">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-sm p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-200 text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sources Modal */}
      {showSources && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glassmorphic-card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-200">Sources</h3>
              <button
                onClick={() => setShowSources(null)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {showSources.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <p className="text-sm text-white/80">{doc.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10 backdrop-blur-md bg-black/30 relative z-10">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your materials..."
            disabled={isLoading}
            className="flex-1 bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 resize-none cursor-text pointer-events-auto"
            rows={1}
            style={{ minHeight: "50px", maxHeight: "150px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-purple-600 border border-purple-500/50 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors cursor-pointer pointer-events-auto"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-white/40 mt-2 text-center">
          AI responses are based on your class materials
        </p>
      </div>
    </div>
  );
}
