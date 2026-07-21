import { useEffect, useRef, useState } from 'react';
import { FileText, MessageCircle, Send } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { ChatAttachment, OrderDetails } from '../../context/ChatNotificationContext';

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentList({ attachments }: { attachments: ChatAttachment[] }) {
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        if (attachment.kind === 'image') {
          return <img key={attachment.id} src={attachment.url} alt={attachment.name} className="max-h-48 max-w-full rounded-xl object-cover" />;
        }

        if (attachment.kind === 'video') {
          return <video key={attachment.id} src={attachment.url} controls className="max-h-56 max-w-full rounded-xl bg-black" />;
        }

        return (
          <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 border bg-slate-50 border-slate-200 text-slate-700">
            <FileText size={17} className="flex-shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold truncate">{attachment.name}</span>
              <span className="block text-[10px] text-slate-400">{formatFileSize(attachment.size)}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export function GeneralChatPage() {
  const { user } = useAuth();
  const { threads, sendCustomerMessage, markThreadRead, createThreadForOrder, deleteMessage } = useChatNotification();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';
  const thread = threads.find(
    (t) =>
      t.participantRole !== 'designer' &&
      (t.customerId === customerId || t.customerName.toLowerCase() === customerName.toLowerCase())
  );

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
  }, [thread, customerId, customerName, createThreadForOrder]);

  useEffect(() => {
    if (thread) {
      markThreadRead(thread.id, 'customer');
    }
  }, [thread?.id, thread?.messages.length, markThreadRead]);

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
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <MessageCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Dream Jewels Support</p>
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.from === 'customer';
            const isOrderCard = msg.text.startsWith('ORDER DETAILS') || msg.text.includes('ORDER DETAILS');

            if (isOrderCard) {
              return (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar user={{ name: 'Dream Jewels Support' }} size="xs" />
                  <div className="max-w-[85%] flex flex-col gap-1">
                    <div className="rounded-2xl rounded-bl-sm overflow-hidden border border-slate-200 shadow-sm bg-white">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5">
                        <span className="text-white font-bold text-sm tracking-wide">Your Order Summary</span>
                      </div>
                      <div className="px-4 py-3 space-y-1.5">
                        {msg.text.split('\n').slice(2).map((row, i) => {
                          if (row.startsWith('--') || row.startsWith('──') || row.startsWith('â')) return <div key={i} className="border-t border-slate-100 my-1.5" />;
                          const colonIdx = row.indexOf(':');
                          if (colonIdx === -1) return null;
                          return (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className="text-slate-400 font-medium whitespace-nowrap w-24 flex-shrink-0">{row.slice(0, colonIdx + 1).trim()}</span>
                              <span className="text-slate-800 font-semibold">{row.slice(colonIdx + 1).trim()}</span>
                            </div>
                          );
                        })}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Attached Files</p>
                            <AttachmentList attachments={msg.attachments} />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            }

            const isDeletable = isMe;

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && <Avatar user={{ name: 'Dream Jewels Support' }} size="xs" />}
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className="flex items-center gap-2 group">
                    {isDeletable && (
                      <button 
                        onClick={() => thread && deleteMessage(thread.id, msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-red-500 hover:text-red-700 text-xs transition-opacity cursor-pointer order-last"
                        title="Delete message"
                      >
                        Delete
                      </button>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed space-y-3 ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                      {msg.text && <p>{msg.text}</p>}
                      {msg.attachments && msg.attachments.length > 0 && <AttachmentList attachments={msg.attachments} />}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
          <Avatar user={user} size="xs" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95">
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
