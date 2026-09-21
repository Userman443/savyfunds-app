import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, X, Send, Bot, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  keyPoints?: string[];
}

const quickQuestions = [
  "How do I start budgeting?",
  "What's compound interest?",
  "How do I build an emergency fund?",
];

const greeting: ChatMessage = {
  id: 0,
  role: "assistant",
  text: "Hi! You can ask me anything about your money: budgeting, saving, investing, debt, credit, and more.",
};

let nextId = 1;

const HelpButton = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isLoading, open]);

  const askQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setInput("");
    setMessages((prev) => [...prev, { id: nextId++, role: "user", text: trimmed }]);
    try {
      const res = await apiRequest("POST", "/api/financial-ai/ask", { query: trimmed });
      const data = await res.json();
      const answerText =
        typeof data.answer === "string" && data.answer.trim()
          ? data.answer
          : "Sorry, I couldn't find an answer to that. Try asking about budgeting, saving, investing, debt, or credit.";
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: "assistant", text: answerText, keyPoints: data.keyPoints },
      ]);
    } catch (error: any) {
      const message = error?.message ?? "";
      const isLimit = message.includes("429");
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: "assistant",
          text: isLimit
            ? "You've used your free questions. Create a free account to keep asking me anything."
            : "Sorry, I couldn't get an answer right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] max-w-[380px] h-[min(560px,70dvh)] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">Savyfunds AI</p>
              <p className="text-xs text-white/80 leading-tight">You can ask me anything about money</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ml-auto p-1.5 rounded-full hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.text}
                  {msg.keyPoints && msg.keyPoints.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {msg.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            )}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => askQuestion(q)}
                    className="text-xs bg-white border border-primary/30 text-primary rounded-full px-3 py-1.5 hover:bg-primary/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-200 bg-white shrink-0">
            <Input
              placeholder="Ask a money question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
              aria-label="Ask Savyfunds AI"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon" aria-label="Send">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="w-12 h-12 rounded-full p-0 shadow-lg"
              aria-label={open ? "Close AI chat" : "Ask SavyFunds AI"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You can ask me anything</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default HelpButton;
