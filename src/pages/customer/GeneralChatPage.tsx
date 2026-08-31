import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  FileText,
  MessageCircle,
  Send,
  Download,
  X,
  HeadphonesIcon,
  ArrowLeft,
  Gem,
  Paperclip,
  Trash2,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { ChatAttachment, ChatThread } from '../../context/ChatNotificationContext';
import { compressImageFile, readFileAsDataUrl } from '../../utils/imageCompression';

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
          return (
            <video
              key={attachment.id}
              src={attachment.url}
              controls
              className="max-h-56 max-w-full rounded-xl bg-black"
            />
          );
        }

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2 border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <FileText size={17} className="flex-shrink-0 text-emerald-600" />
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOrderId = searchParams.get('orderId');
  const requestedThreadId = searchParams.get('thread');

  const { threads, sendCustomerMessage, markThreadRead, deleteMessage } = useChatNotification();
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [showMobileList, setShowMobileList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';

  // 1. Gather all conversations belonging to this customer
  const customerThreads = useMemo(() => {
    const my = threads.filter(
      (t) =>
        t.participantRole !== 'designer' &&
        (t.customerId === customerId ||
          t.customerName.toLowerCase() === customerName.toLowerCase() ||
          t.id === `customer-${customerId}` ||
          t.id.startsWith(`order-${customerId}`))
    );

    // If no general thread exists in the list, create a virtual placeholder representation
    const hasGeneral = my.some((t) => t.id === `customer-${customerId}`);
    if (!hasGeneral && my.length === 0) {
      return [
        {
          id: `customer-${customerId}`,
          customerName,
          customerId,
          participantRole: 'customer' as const,
          messages: [
            {
              id: 1,
              from: 'admin' as const,
              senderName: 'Dream Jewels Support',
              text: `👋 Welcome to Dream Jewels, ${customerName}! How can our master jewelers assist you today?`,
              time: 'Just now',
            },
          ],
          unread: 0,
          customerUnread: 0,
          lastMessage: 'Welcome to Dream Jewels support!',
          lastTime: 'Just now',
        },
      ];
    }
    return my;
  }, [threads, customerId, customerName]);

  // 2. Select initial or requested thread
  const [selectedThreadId, setSelectedThreadId] = useState<string>(() => {
    if (requestedThreadId) return requestedThreadId;
    if (requestedOrderId) {
      const match = customerThreads.find((t) => t.orderId === requestedOrderId || t.id === `order-${requestedOrderId}`);
      if (match) return match.id;
    }
    return customerThreads[0]?.id || `customer-${customerId}`;
  });

  // Keep selectedThreadId in sync when requested via URL or when customerThreads load
  useEffect(() => {
    if (requestedThreadId && customerThreads.some((t) => t.id === requestedThreadId)) {
      setSelectedThreadId(requestedThreadId);
    } else if (requestedOrderId) {
      const match = customerThreads.find((t) => t.orderId === requestedOrderId || t.id === `order-${requestedOrderId}`);
      if (match) setSelectedThreadId(match.id);
    } else if (!customerThreads.some((t) => t.id === selectedThreadId) && customerThreads.length > 0) {
      setSelectedThreadId(customerThreads[0].id);
    }
  }, [requestedThreadId, requestedOrderId, customerThreads, selectedThreadId]);

  const activeThread = customerThreads.find((t) => t.id === selectedThreadId) ?? customerThreads[0];

  useEffect(() => {
    if (activeThread?.id) {
      markThreadRead(activeThread.id, 'customer');
    }
  }, [activeThread?.id, activeThread?.messages.length, markThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, pendingAttachments.length]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSearchParams({ thread: threadId }, { replace: true });
    setShowMobileList(false);
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return;
    const incoming: ChatAttachment[] = await Promise.all(
      Array.from(files).map(async (file, index) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const { url, size } = isImage
          ? await compressImageFile(file).then((r) => ({ url: r.dataUrl, size: r.size }))
          : { url: await readFileAsDataUrl(file), size: file.size };

        return {
          id: Date.now() + index,
          name: file.name,
          size,
          type: isImage ? 'image/jpeg' : file.type || 'application/octet-stream',
          url,
          kind: (isImage ? 'image' : isVideo ? 'video' : 'file') as ChatAttachment['kind'],
        };
      })
    );

    setPendingAttachments((prev) => [...prev, ...incoming]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (id: number) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const sendMessage = () => {
    if (!input.trim() && pendingAttachments.length === 0) return;
    const targetThreadId = activeThread?.id || `customer-${customerId}`;
    sendCustomerMessage(customerId, customerName, input.trim(), targetThreadId, pendingAttachments);
    setInput('');
    setPendingAttachments([]);
  };

  const messages = activeThread?.messages ?? [];

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 mb-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <PageTitle
            title="Messages & Consultations"
            subtitle="Chat directly with our luxury jewellery experts on custom designs and orders."
            className="mb-0"
          />
        </div>
      </div>

      <div
        className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden relative"
        style={{ height: 'calc(100vh - 230px)', minHeight: '520px' }}
      >
        {/* ─── Left Sidebar: Thread List ─── */}
        <div
          className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/60 z-10 md:static absolute inset-0 transition-transform ${
            showMobileList ? 'translate-x-0 bg-white' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageCircle size={17} />
              </div>
              <span className="font-semibold text-slate-800 text-sm">Conversations</span>
            </div>
            {showMobileList && (
              <button
                onClick={() => setShowMobileList(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {customerThreads.map((t) => {
              const isSelected = activeThread?.id === t.id;
              const isOrder = t.orderName || t.id.startsWith('order-');
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectThread(t.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'hover:bg-white bg-slate-50/50 text-slate-700 border border-transparent hover:border-slate-200/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isOrder ? (
                        <Gem size={14} className={isSelected ? 'text-white' : 'text-emerald-600'} />
                      ) : (
                        <HeadphonesIcon size={14} className={isSelected ? 'text-white' : 'text-emerald-600'} />
                      )}
                      <p className="font-semibold text-xs truncate">
                        {t.orderName ? `Order: ${t.orderName}` : 'General Support'}
                      </p>
                    </div>
                    {t.customerUnread > 0 && !isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {t.customerUnread}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {t.lastMessage || 'No messages yet'}
                  </p>
                  <div className={`flex items-center gap-1 text-[10px] mt-1.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                    <Clock size={10} />
                    <span>{t.lastTime || 'Recent'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right Area: Active Chat Window ─── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 mr-1"
                title="View Conversations"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                {activeThread?.orderName ? (
                  <Gem size={18} className="text-emerald-600" />
                ) : (
                  <HeadphonesIcon size={18} className="text-emerald-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {activeThread?.orderName ? `Order Discussion: ${activeThread.orderName}` : 'Dream Jewels Support Team'}
                </p>
                <p className="text-xs flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full inline-block bg-emerald-500 animate-pulse" />
                  Live & Online
                </p>
              </div>
            </div>

            {activeThread?.orderId && (
              <button
                onClick={() => navigate(`/dashboard/customer/my-products?id=${activeThread.orderId}`)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                View Order Details
              </button>
            )}
          </div>

          {/* Message feed */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <MessageCircle size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">How can we help you today?</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                  Send a message or upload jewellery reference photos below and our team will respond right away.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.from === 'customer';
                const isOrderCard =
                  msg.text.startsWith('ORDER DETAILS') ||
                  msg.text.includes('ORDER DETAILS') ||
                  msg.text.startsWith('📋 ORDER DETAILS');

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
                            {msg.text
                              .split('\n')
                              .slice(2)
                              .map((row, i) => {
                                if (
                                  row.startsWith('--') ||
                                  row.startsWith('──') ||
                                  row.startsWith('â')
                                )
                                  return <div key={i} className="border-t border-slate-100 my-1.5" />;
                                const colonIdx = row.indexOf(':');
                                if (colonIdx === -1) return null;
                                return (
                                  <div key={i} className="flex gap-2 text-xs">
                                    <span className="text-slate-400 font-medium whitespace-nowrap w-24 flex-shrink-0">
                                      {row.slice(0, colonIdx + 1).trim()}
                                    </span>
                                    <span className="text-slate-800 font-semibold">
                                      {row.slice(colonIdx + 1).trim()}
                                    </span>
                                  </div>
                                );
                              })}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="pt-2 mt-2 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                                  Attached Files
                                </p>
                                <AttachmentList
                                  attachments={msg.attachments}
                                  onImageClick={(url, name) => setLightboxImage({ url, name })}
                                />
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
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {!isMe && <Avatar user={{ name: 'Support' }} size="xs" />}
                    <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2">
                            <AttachmentList
                              attachments={msg.attachments}
                              onImageClick={(url, name) => setLightboxImage({ url, name })}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                        <span>{msg.time}</span>
                        {isMe && activeThread && (
                          <button
                            onClick={() => deleteMessage(activeThread.id, msg.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5"
                            title="Delete message"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending attachments preview bar */}
          {pendingAttachments.length > 0 && (
            <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              {pendingAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-2xs flex-shrink-0"
                >
                  {att.kind === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <FileText size={14} className="text-emerald-600" />
                  )}
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removePendingAttachment(att.id)}
                    className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-2 sm:gap-3 bg-white">
            <Avatar user={user} size="xs" />

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFilesSelected(e.target.files)}
              multiple
              accept="image/*,video/*,application/pdf,.pdf,.doc,.docx"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
              title="Attach images, documents or sketches"
            >
              <Paperclip size={17} />
            </button>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message or share design sketches..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() && pendingAttachments.length === 0}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex-shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="absolute top-4 right-4 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
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
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div
            className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
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
