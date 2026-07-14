import { useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { OrderDetails } from '../../context/ChatNotificationContext';

export function GeneralChatPage() {
  const { user } = useAuth();
  const { threads, sendCustomerMessage, markThreadRead, createThreadForOrder } = useChatNotification();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';

  // Find or create the customer's thread
  const thread = threads.find((t) => t.customerId === customerId);

  // If no thread exists yet, create a default one when the page loads
  useEffect(() => {
    if (!thread) {
      const generalInquiry: OrderDetails = {
        name: 'General Inquiry',
        category: 'General',
        metal: '-',
        karat: '-',
        budget: 'Not specified',
      };
      createThreadForOrder(customerId, customerName, generalInquiry);
    }
  }, []);

  // Mark messages as read when the chat is opened
  useEffect(() => {
    if (thread) {
      markThreadRead(thread.id, 'customer');
    }
  }, [thread?.id, thread?.messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  const sendMessage = () => {
    if (!input.trim()) return;
    sendCustomerMessage(customerId, customerName, input.trim());
    setInput('');
  };

  const messages = thread?.messages ?? [];

  return (
    <PageContainer>
      <PageTitle title="General Chat" subtitle="Chat with our support team." className="mb-6" />
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: '520px' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MessageCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Dream Jewels Support</p>
            <p className="text-xs text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.from === 'customer';
            const isOrderCard = msg.text.startsWith('📋 ORDER DETAILS');

            if (isOrderCard) {
              return (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar user={{ name: 'Dream Jewels Support' }} size="xs" />
                  <div className="max-w-[85%] flex flex-col gap-1">
                    <div className="rounded-2xl rounded-bl-sm overflow-hidden border border-slate-200 shadow-sm bg-white">
                      {/* Card header */}
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 flex items-center gap-2">
                        <span className="text-base">📋</span>
                        <span className="text-white font-bold text-sm tracking-wide">Your Order Summary</span>
                      </div>
                      {/* Card rows */}
                      <div className="px-4 py-3 space-y-1.5">
                        {msg.text.split('\n').slice(2).map((row, i) => {
                          if (row.startsWith('──')) return <div key={i} className="border-t border-slate-100 my-1.5" />;
                          const colonIdx = row.indexOf(':');
                          if (colonIdx === -1) return null;
                          const label = row.slice(0, colonIdx + 1).trim();
                          const value = row.slice(colonIdx + 1).trim();
                          return (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="text-slate-400 font-medium whitespace-nowrap w-24 flex-shrink-0">{label}</span>
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
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar user={{ name: 'Dream Jewels Support' }} size="xs" />}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
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
        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
          <Avatar user={user} size="xs" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          <button
            onClick={sendMessage}
            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageContainer>
  );
}

