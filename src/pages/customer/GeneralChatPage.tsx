import { useEffect, useRef, useState } from 'react';
import { FileText, MessageCircle, Send, Download, X } from 'lucide-react';
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

function AttachmentList({
  attachments,
  onImageClick,
}: {
  attachments: ChatAttachment[];
  onImageClick: (url: string, name: string) => void;
}) {
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        if (attachment.kind === 'image') {
          return (
            <button
              key={attachment.id}
              type="button"
              onClick={() => onImageClick(attachment.url, attachment.name)}
              className="block cursor-pointer outline-none active:scale-[0.99] transition-transform text-left border-0 p-0 bg-transparent"
            >
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-h-48 max-w-full rounded-xl object-cover"
              />
            </button>
          );
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

import { Palette, ArrowLeft, HeadphonesIcon } from 'lucide-react';

export function GeneralChatPage() {
  const { user } = useAuth();
  const { threads, sendCustomerMessage, markThreadRead, createThreadForOrder, deleteMessage } = useChatNotification();
  const [activeChannel, setActiveChannel] = useState<'support' | 'designer' | null>(null);
  const [input, setInput] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';
  
  const supportThread = threads.find(
    (t) =>
      t.participantRole !== 'designer' &&
      (t.customerId === customerId || t.customerName.toLowerCase() === customerName.toLowerCase())
  );

  const designerThread = threads.find(
    (t) =>
      t.participantRole === 'designer' &&
      (t.customerId === customerId || t.customerName.toLowerCase() === customerName.toLowerCase())
  );

  useEffect(() => {
    if (!supportThread && activeChannel === 'support') {
      const generalInquiry: OrderDetails = {
        name: 'General Inquiry',
        category: 'General',
        metal: '-',
        karat: '-',
        budget: 'Not specified',
      };
      createThreadForOrder(customerId, customerName, generalInquiry);
    }
  }, [supportThread, activeChannel, customerId, customerName, createThreadForOrder]);

  const activeThread = activeChannel === 'designer' ? designerThread : supportThread;

  useEffect(() => {
    if (activeThread && activeChannel) {
      markThreadRead(activeThread.id, 'customer');
    }
  }, [activeThread?.id, activeThread?.messages.length, markThreadRead, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, activeChannel]);

  const sendMessage = () => {
    if (!input.trim() || !activeChannel) return;
    
    if (activeChannel === 'designer' && designerThread) {
      sendCustomerMessage(customerId, customerName, input.trim(), designerThread.id);
    } else {
      sendCustomerMessage(customerId, customerName, input.trim(), supportThread?.id);
    }
    
    setInput('');
  };

  const messages = activeThread?.messages ?? [];

  return (
    <PageContainer>
      <PageTitle title="Chat" subtitle="Connect with our team." className="mb-6" />
      
      {!activeChannel ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {/* Support Channel */}
          <button
            onClick={() => setActiveChannel('support')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-md hover:bg-emerald-50/20 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HeadphonesIcon size={28} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Customer Support</h3>
            <p className="text-sm text-slate-500 text-center">Ask general questions, track orders, or get help with your account.</p>
            {supportThread && supportThread.customerUnread > 0 && (
              <span className="mt-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                {supportThread.customerUnread} new message{supportThread.customerUnread > 1 ? 's' : ''}
              </span>
            )}
          </button>

          {/* Designer Channel */}
          <button
            onClick={() => setActiveChannel('designer')}
            className={`flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all group ${designerThread ? 'hover:border-purple-200 hover:shadow-md hover:bg-purple-50/20 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
            disabled={!designerThread}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${designerThread ? 'bg-purple-100 group-hover:scale-110' : 'bg-slate-100'}`}>
              <Palette size={28} className={designerThread ? 'text-purple-600' : 'text-slate-400'} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Your Designer</h3>
            <p className="text-sm text-slate-500 text-center">
              {designerThread ? 'Discuss design details and share feedback directly with your assigned designer.' : 'You will be connected to a designer once your custom order is approved.'}
            </p>
            {designerThread && designerThread.customerUnread > 0 && (
              <span className="mt-4 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                {designerThread.customerUnread} new message{designerThread.customerUnread > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: '520px' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <button 
              onClick={() => setActiveChannel(null)}
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors mr-2"
            >
              <ArrowLeft size={18} />
            </button>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeChannel === 'designer' ? 'bg-purple-100' : 'bg-emerald-100'}`}>
              {activeChannel === 'designer' ? <Palette size={18} className="text-purple-600" /> : <HeadphonesIcon size={18} className="text-emerald-600" />}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{activeChannel === 'designer' ? 'Designer Chat' : 'Support Chat'}</p>
              <p className={`text-xs flex items-center gap-1 ${activeChannel === 'designer' ? 'text-purple-500' : 'text-emerald-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${activeChannel === 'designer' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                Online
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center px-4">
                 <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                   <MessageCircle size={24} className="text-slate-300" />
                 </div>
                 <p className="text-sm font-semibold text-slate-700">Say Hello!</p>
                 <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
                   {activeChannel === 'designer' ? 'Start discussing your jewellery design here.' : 'Send a message to our support team and we will get back to you.'}
                 </p>
               </div>
            ) : (
              messages.map((msg) => {
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
                                <AttachmentList attachments={msg.attachments} onImageClick={(url, name) => setLightboxImage({ url, name })} />
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
                    {!isMe && <Avatar user={{ name: activeChannel === 'designer' ? 'Designer' : 'Support' }} size="xs" />}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className="flex items-center gap-2 group">
                        {isDeletable && (
                          <button 
                            onClick={() => activeThread && deleteMessage(activeThread.id, msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-red-500 hover:text-red-700 text-xs transition-opacity cursor-pointer order-last"
                            title="Delete message"
                          >
                            Delete
                          </button>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed space-y-3 ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                          {msg.text && <p>{msg.text}</p>}
                          {msg.attachments && msg.attachments.length > 0 && <AttachmentList attachments={msg.attachments} onImageClick={(url, name) => setLightboxImage({ url, name })} />}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })
            )}
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
      )}

      {/* Lightbox Modal overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={lightboxImage.url}
              download={lightboxImage.name}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Download Image"
            >
              <Download size={18} />
            </a>
            <button
              onClick={() => setLightboxImage(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl select-none"
            />
            <p className="text-sm font-medium text-slate-300">{lightboxImage.name}</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
