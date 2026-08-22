import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { FileText, MessageCircle, Send, Download, X, HeadphonesIcon, ArrowLeft, Gem } from 'lucide-react';
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

export function GeneralChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderName = searchParams.get('orderName');

  const { threads, sendCustomerMessage, markThreadRead, createThreadForOrder, deleteMessage } = useChatNotification();
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

  useEffect(() => {
    if (!supportThread) {
      const generalInquiry: OrderDetails = {
        name: orderName ? `Inquiry: ${orderName}` : 'General Inquiry',
        category: 'General',
        metal: '-',
        karat: '-',
        budget: 'Not specified',
      };
      createThreadForOrder(customerId, customerName, generalInquiry);
    }
  }, [supportThread, customerId, customerName, createThreadForOrder, orderName]);

  useEffect(() => {
    if (supportThread) {
      markThreadRead(supportThread.id, 'customer');
    }
  }, [supportThread?.id, supportThread?.messages.length, markThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportThread?.messages.length]);

  const sendMessage = () => {
    if (!input.trim()) return;
    sendCustomerMessage(customerId, customerName, input.trim(), supportThread?.id);
    setInput('');
  };

  const messages = supportThread?.messages ?? [];

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <PageTitle title="Customer Support Chat" subtitle="Chat directly with our luxury jewellery experts." className="mb-0" />
        </div>
      </div>

      {orderName && (
        <div className="mb-4 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Gem size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">Inquiry Context: {orderName}</p>
              <p className="text-[11px] text-emerald-700">Order ID: {orderId ?? 'Active Order'}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/customer/my-products')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline whitespace-nowrap"
          >
            View Order
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 250px)', minHeight: '480px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <HeadphonesIcon size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Dream Jewels Support Team</p>
              <p className="text-xs flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full inline-block bg-emerald-500 animate-pulse" />
                Live & Online
              </p>
            </div>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <MessageCircle size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">How can we help you today?</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Send a message below and our jewellery team will respond right away.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.from === 'customer';
              const isOrderCard = msg.text.startsWith('ORDER DETAILS') || msg.text.includes('ORDER DETAILS') || msg.text.startsWith('📋 ORDER DETAILS');

              if (isOrderCard) {
                return (
                  <div key={msg.id} className="flex items-start gap-2.5">
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

              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && <Avatar user={{ name: 'Support' }} size="xs" />}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className="flex items-center gap-2 group">
                      {isMe && (
                        <button 
                          onClick={() => supportThread && deleteMessage(supportThread.id, msg.id)}
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

        {/* Input Bar */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
          <Avatar user={user} size="xs" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question or request updates on your order..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          <button onClick={sendMessage} className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95 cursor-pointer">
            <Send size={15} />
          </button>
        </div>
      </div>

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
