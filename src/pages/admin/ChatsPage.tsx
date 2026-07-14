import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { useChatNotification } from '../../context/ChatNotificationContext';

export function ChatsPage() {
  const { threads, sendAdminMessage, markThreadRead } = useChatNotification();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    threads.length > 0 ? threads[0].id : null
  );
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThreadId) {
      markThreadRead(selectedThreadId, 'admin');
    }
  }, [selectedThreadId, selectedThread?.messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

  const handleSend = () => {
    if (!input.trim() || !selectedThreadId) return;
    sendAdminMessage(selectedThreadId, input.trim());
    setInput('');
  };

  return (
    <PageContainer>
      <PageTitle title="Chats" subtitle="Manage customer conversations." className="mb-8" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: '560px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">

          {/* ── Conversation list ── */}
          <div className="border-r border-slate-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex-shrink-0">
              <h3 className="font-semibold text-slate-700 text-sm">
                Conversations
                {threads.reduce((sum, t) => sum + t.unread, 0) > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    {threads.reduce((sum, t) => sum + t.unread, 0)}
                  </span>
                )}
              </h3>
            </div>
            <div className="overflow-y-auto flex-1">
              {threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors ${
                    t.id === selectedThreadId ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : ''
                  }`}
                >
                  <Avatar user={{ name: t.customerName }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 truncate">{t.customerName}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{t.lastTime}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</p>
                  </div>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {t.unread}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Chat window ── */}
          <div className="col-span-2 flex flex-col h-full overflow-hidden bg-slate-50/30">
            {selectedThread ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center gap-3 flex-shrink-0">
                  <Avatar user={{ name: selectedThread.customerName }} size="sm" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedThread.customerName}</p>
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Online
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {selectedThread.messages.map((msg) => {
                    const isAdmin = msg.from === 'admin';
                    const isOrderCard = msg.text.startsWith('📋 ORDER DETAILS');

                    if (isOrderCard) {
                      // Render as a structured order summary card
                      const rows = msg.text.split('\n');
                      return (
                        <div key={msg.id} className="flex items-start gap-2">
                          <Avatar user={{ name: 'Support' }} size="xs" />
                          <div className="max-w-[85%] flex flex-col gap-1">
                            <div className="rounded-2xl rounded-bl-sm overflow-hidden border border-slate-200 shadow-sm bg-white">
                              {/* Card header */}
                              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 flex items-center gap-2">
                                <span className="text-base">📋</span>
                                <span className="text-white font-bold text-sm tracking-wide">New Custom Order</span>
                              </div>
                              {/* Card rows */}
                              <div className="px-4 py-3 space-y-1.5">
                                {rows.slice(2).map((row, i) => {
                                  if (row.startsWith('──')) return <div key={i} className="border-t border-slate-100 my-1.5" />;
                                  const colonIdx = row.indexOf(':');
                                  if (colonIdx === -1) return null;
                                  const label = row.slice(0, colonIdx + 1).trim();
                                  const value = row.slice(colonIdx + 1).trim();
                                  return (
                                    <div key={i} className="flex gap-2 text-xs">
                                      <span className="text-slate-400 font-medium whitespace-nowrap w-28 flex-shrink-0">{label}</span>
                                      <span className="text-slate-800 font-semibold">{value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <Avatar user={{ name: isAdmin ? 'Support' : selectedThread.customerName }} size="xs" />
                        <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isAdmin
                              ? 'bg-emerald-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center gap-3 flex-shrink-0">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Reply to ${selectedThread.customerName}…`}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <EmptyState
                  icon={MessageSquare}
                  title="Select a conversation"
                  description="Choose a conversation from the left panel to start chatting."
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </PageContainer>
  );
}

