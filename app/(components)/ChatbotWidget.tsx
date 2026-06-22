"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, X, Send, Mic, MicOff, Sparkles, 
  HelpCircle, Bot, User, Volume2, AlertCircle 
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  engine?: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your InfraCharge AI Assistant ⚡. How can I help you find charging stations, calculate solar capacity, or analyze EV registrations today?",
      engine: "System"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to always hold the latest handleSendMessage function (prevents stale closure in speech callback)
  const handleSendMessageRef = useRef<any>(null);


  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-IN"; // Set to Indian English

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            setInputValue(transcript);
            if (handleSendMessageRef.current) {
              handleSendMessageRef.current(transcript);
            }
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) throw new Error("Server responded with error status");
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          engine: data.engine
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered a communication error. Please ensure your internet is connected or try again.",
          engine: "Error Fallback"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep the ref always updated with the latest state closure
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Premade fast actions
  const actionPrompts = [
    { label: "Delhi EV Sales", text: "How many EV purchases are registered in Delhi?" },
    { label: "1000m² Solar potential", text: "What is the solar charging capacity for a 1000 sqm land area?" },
    { label: "CCS2 vs AC Type 2", text: "What is the difference between AC Type 2 and CCS2 charging standard?" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* CHAT WINDOW PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-[90vw] sm:w-[400px] h-[550px] bg-card/90 backdrop-blur-xl border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-red-600 to-orange-500 flex items-center justify-between text-white shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">InfraCharge AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Active Hybrid Mode</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-bg/30">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Icon Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0
                    ${msg.role === "user" 
                      ? "bg-primary border-primary/20 text-white" 
                      : "bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/5 text-primary"}`}
                  >
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble Container */}
                  <div className="flex flex-col max-w-[75%]">
                    <div 
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm break-words
                        ${msg.role === "user" 
                          ? "bg-white/10 dark:bg-white/5 border border-white/10 text-text rounded-tr-none" 
                          : "bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 text-text rounded-tl-none"}`}
                    >
                      {/* Formatted Text renderer */}
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    {/* Meta Engine Label */}
                    {msg.engine && (
                      <span className="text-[8px] text-muted font-bold tracking-wider mt-1 px-1.5 uppercase opacity-60">
                        {msg.engine}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loader Typing bubble */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-primary">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Prompts */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap bg-bg/10">
              {actionPrompts.map((act) => (
                <button
                  key={act.label}
                  onClick={() => handleSendMessage(act.text)}
                  className="px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 text-[10px] font-bold text-muted hover:text-text transition-all"
                >
                  {act.label}
                </button>
              ))}
            </div>

            {/* Speech Visualizer Indicator */}
            {isListening && (
              <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-[11px] font-bold text-red-500 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>InfraCharge Voice listening ... Speak clearly now</span>
                </div>
                {/* Micro Audio bar graph */}
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-[2px] bg-red-500 rounded-full h-2 animate-bounce" style={{ animationDuration: "0.5s" }}></div>
                  <div className="w-[2px] bg-red-500 rounded-full h-3 animate-bounce" style={{ animationDuration: "0.3s" }}></div>
                  <div className="w-[2px] bg-red-500 rounded-full h-1 animate-bounce" style={{ animationDuration: "0.4s" }}></div>
                </div>
              </div>
            )}

            {/* Input Form Box */}
            <div className="p-3 border-t border-border bg-card/50 flex items-center gap-2">
              <div className="flex-1 bg-bg border border-border rounded-2xl flex items-center px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask InfraCharge..."}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs text-text border-none focus:outline-none placeholder:text-muted placeholder:font-semibold h-7"
                />
                
                {/* Voice mic triggers */}
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition-all 
                      ${isListening 
                        ? "text-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                        : "text-muted hover:text-text hover:bg-white/5"}`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 text-white flex items-center justify-center shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION TOGGLE BUTTON */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-3xl bg-gradient-to-r from-red-600 to-orange-500 text-white flex items-center justify-center shadow-[0_8px_30px_rgba(239,68,68,0.4)] hover:shadow-[0_12px_40px_rgba(239,68,68,0.5)] transition-shadow relative overflow-hidden group border border-white/10"
      >
        {/* Shimmer reflection element */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        {isOpen ? <X className="w-6 h-6 z-10" /> : <MessageSquare className="w-6 h-6 z-10" />}
      </motion.button>

    </div>
  );
}
