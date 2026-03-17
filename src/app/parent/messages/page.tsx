"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Loader2, User, ChevronLeft, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

interface Participant { id: string; name: string; role: string; }
interface Message { id: string; senderId: string; body: string; createdAt: string; sender: { name: string } };
interface Conversation {
  id: string;
  lastMessageAt: string;
  participants: Participant[];
  messages: Message[];
}

export default function ParentMessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConv?.messages]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to load");
      const d = await res.json();
      setConversations(d.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(id: string) {
    try {
      const res = await fetch(`/api/messages/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const d = await res.json();
      setActiveConv(d.conversation);
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !activeConv || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, content }),
      });
      if (!res.ok) throw new Error("Failed to send");
      
      await selectConversation(activeConv.id);
      setContent("");
      loadConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (loading && conversations.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
      <p className="text-sm font-medium">Loading your conversations…</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-[calc(100vh-14rem)] flex bg-slate-900/40 backdrop-blur border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Sidebar: Conversations List */}
        <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
              <h2 className="font-bold text-white">Inbox</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-slate-500 text-sm">No active conversations found.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = conv.participants.find(p => p.id !== session?.user?.id);
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition text-left border-b border-white/5 ${activeConv?.id === conv.id ? 'bg-indigo-600/10 border-indigo-500/30' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-white font-bold truncate text-sm">{other?.name || "School Admin"}</p>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs truncate">
                        {conv.messages[0]?.body || "New conversation started"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Main Area: Chat Window */}
        <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 p-8">
              <div className="w-20 h-20 rounded-full bg-slate-800/30 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 opacity-10" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Stay Connected</p>
                <p className="text-sm mt-1 max-w-[200px]">Select a chat to communicate with school administrators.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex items-center gap-4">
                <button 
                  onClick={() => setActiveConv(null)}
                  className="md:hidden p-2 hover:bg-white/5 rounded-xl text-slate-400 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {activeConv.participants.find(p => p.id !== session?.user?.id)?.name || "School Admin"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-900" />
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Active Now</p>
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/20">
                {activeConv.messages.map((msg, idx) => {
                  const isMe = msg.senderId === session?.user?.id;
                  const prevMsg = activeConv.messages[idx - 1];
                  const showName = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showName && <p className="text-[10px] font-bold text-indigo-400 mb-1.5 ml-1 uppercase tracking-tighter">{msg.sender.name}</p>}
                      <div className={`group relative max-w-[85%] p-3.5 rounded-2xl text-[13px] shadow-lg transition-all ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-500' 
                          : 'bg-slate-800 text-slate-300 rounded-tl-none hover:bg-slate-700 border border-white/5'
                      }`}>
                        {msg.body}
                        <p className={`text-[9px] mt-1.5 font-medium opacity-40 ${isMe ? 'text-right' : ''}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/60">
                <form onSubmit={sendMessage} className="relative flex gap-2">
                  <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your message..."
                    autoFocus
                    className="flex-1 bg-slate-800 border border-white/5 rounded-2xl px-5 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800/80 transition shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={sending || !content.trim()}
                    className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
