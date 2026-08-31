import { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Send,
  Video,
  X,
  Download,
  Search,
  ExternalLink,
  Gem,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { ChatAttachment, useChatNotification } from '../../context/ChatNotificationContext';
import { compressImageFile, readFileAsDataUrl } from '../../utils/imageCompression';

function getAttachmentKind(file: File): ChatAttachment['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'file';
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORY_ICONS: Record<string, string> = {
  Rings: '💍',
  Necklaces: '📿',
  Earrings: '✨',
  Bracelets: '🔱',
  Bangles: '⭕',
  Pendants: '💎',
  Chains: '⛓️',
};

function AttachmentList({
  attachments,
  isAdmin,
  onImageClick,
}: {
  attachments: ChatAttachment[];
  isAdmin: boolean;
  onImageClick: (url: string, name: string) => void;
}) {
  return (
    <div className="space-y-2 mt-2">
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
                className="max-h-48 max-w-full rounded-xl object-cover border border-slate-200/60 shadow-2xs hover:opacity-95 transition-opacity"
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
              className="max-h-56 max-w-full rounded-xl bg-black border border-slate-200/60"
            />
          );
        }

        return (
          <a
            key={attachment.id}
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 border transition-colors ${
              isAdmin
                ? 'bg-emerald-700/60 border-emerald-500/40 text-white hover:bg-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <FileText size={17} className="flex-shrink-0 text-emerald-400" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold truncate">{attachment.name}</span>
              <span className={`block text-[10px] ${isAdmin ? 'text-emerald-100' : 'text-slate-400'}`}>
                {formatFileSize(attachment.size)}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export function ChatsPage() {
  const { threads, orders, sendAdminMessage, markThreadRead, deleteMessage } = useChatNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedThreadId = searchParams.get('thread');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    requestedThreadId || (threads.length > 0 ? threads[0].id : null)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Unread'>('All');
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  // Filtered threads list
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (filterTab === 'Unread' && t.unread <= 0) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.customerName.toLowerCase().includes(q) ||
        (t.orderName && t.orderName.toLowerCase().includes(q)) ||
        (t.orderId && t.orderId.toLowerCase().includes(q)) ||
        t.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [threads, filterTab, searchQuery]);

  useEffect(() => {
    if (requestedThreadId && threads.some((thread) => thread.id === requestedThreadId)) {
      setSelectedThreadId(requestedThreadId);
    } else if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id);
    }
  }, [requestedThreadId, threads, selectedThreadId]);

  useEffect(() => {
    if (selectedThreadId) {
      markThreadRead(selectedThreadId, 'admin');
    }
  }, [selectedThreadId, selectedThread?.messages.length, markThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages.length]);

  const selectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setSearchParams({ thread: threadId }, { replace: true });
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return;

    const incoming = Array.from(files);
    const oversized = incoming.filter((f) => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      alert(`"${oversized[0].name}" exceeds the 50 MB limit.`);
      return;
    }

    const attachments = await Promise.all(
      incoming.map(async (file, index) => {
        const kind = getAttachmentKind(file);
        const { url, size } =
          kind === 'image'
            ? await compressImageFile(file).then((r) => ({ url: r.dataUrl, size: r.size }))
            : { url: await readFileAsDataUrl(file), size: file.size };
        return {
          id: Date.now() + index,
          name: file.name,
          size,
          type: kind === 'image' ? 'image/jpeg' : file.type || 'application/octet-stream',
          url,
          kind,
        };
      })
    );

    setPendingAttachments((current) => [...current, ...attachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (attachmentId: number) => {
    setPendingAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
  };

  const handleSend = () => {
    if ((!input.trim() && pendingAttachments.length === 0) || !selectedThreadId) return;
    sendAdminMessage(selectedThreadId, input.trim(), pendingAttachments);
    setInput('');
    setPendingAttachments([]);
  };

  const linkedOrder = useMemo(() => {
    if (!selectedThread) return null;
    return orders.find(
      (o) =>
        (selectedThread.orderId && o.id === selectedThread.orderId) ||
        (selectedThread.orderName && o.name.toLowerCase() === selectedThread.orderName.toLowerCase())
    );
  }, [selectedThread, orders]);

  const totalUnreadCount = threads.reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <div className="flex-1 p-3 sm:p-4 h-[calc(100vh-4.25rem)] overflow-hidden flex flex-col max-w-screen-2xl mx-auto w-full">
      {/* Main Messaging Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col flex-1">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full flex-1 overflow-hidden">
          
          {/* ── Left Panel: Conversations List ── */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-slate-200/90 flex flex-col h-full overflow-hidden bg-slate-50/50">
            {/* Header & Filter */}
            <div className="p-3.5 border-b border-slate-200 bg-white flex-shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">Conversations</h3>
                  {totalUnreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-2xs">
                      {totalUnreadCount} new
                    </span>
                  )}
                </div>
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setFilterTab('All')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterTab === 'All' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All ({threads.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('Unread')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterTab === 'Unread' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Unread ({totalUnreadCount})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-100 transition-all">
                <Search size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order ID, item, client..."
                  className="bg-transparent outline-none w-full text-slate-900 placeholder:text-slate-400 text-xs"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Threads Scroll Area */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100/80">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {searchQuery ? 'No matching conversations' : 'No messages found'}
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = thread.id === selectedThreadId;
                  const matchingOrder = orders.find(
                    (o) =>
                      (thread.orderId && o.id === thread.orderId) ||
                      (thread.orderName && o.name.toLowerCase() === thread.orderName.toLowerCase())
                  );
                  const iconEmoji = matchingOrder ? (CATEGORY_ICONS[matchingOrder.category] || '💎') : '💎';

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => selectThread(thread.id)}
                      className={`w-full flex items-start gap-3 p-3.5 text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600 shadow-2xs'
                          : 'hover:bg-white active:bg-slate-100'
                      }`}
                    >
                      {/* Product Thumbnail or Jewelry Emoji */}
                      <div className="relative flex-shrink-0 mt-0.5">
                        {matchingOrder?.image ? (
                          <img
                            src={matchingOrder.image}
                            alt={thread.orderName || 'Order'}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100/80 to-teal-50 border border-emerald-200 text-lg flex items-center justify-center shadow-2xs select-none">
                            {iconEmoji}
                          </div>
                        )}
                        {thread.unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 border-2 border-white rounded-full" />
                        )}
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {thread.orderName || thread.customerName}
                          </h4>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">{thread.lastTime}</span>
                        </div>

                        {/* Order ID & Customer Name */}
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          {thread.orderId && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-[10px] font-bold font-mono">
                              #{thread.orderId}
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-slate-600 truncate">
                            👤 {thread.customerName}
                          </span>
                        </div>

                        {/* Last Message or New indicator */}
                        <p
                          className={`text-xs truncate ${
                            thread.unread > 0
                              ? 'text-emerald-800 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded-md inline-block max-w-full'
                              : 'text-slate-500'
                          }`}
                        >
                          {thread.unread > 0
                            ? (thread.unread === 1 ? '• 1 new message' : `• ${thread.unread} new messages`)
                            : thread.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Panel: Chat Thread Content ── */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-50/40">
            {selectedThread ? (
              <>
                {/* Active Chat Header */}
                <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {linkedOrder?.image ? (
                      <img
                        src={linkedOrder.image}
                        alt={selectedThread.orderName || 'Order'}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg flex-shrink-0">
                        💎
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {selectedThread.orderName || selectedThread.customerName}
                        </h3>
                        {selectedThread.orderId && (
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded-md flex-shrink-0">
                            #{selectedThread.orderId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Customer: <strong className="text-slate-800">{selectedThread.customerName}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {selectedThread.orderId && (
                      <button
                        onClick={() => navigate(`/dashboard/admin/orders?search=${encodeURIComponent(selectedThread.orderId || '')}`)}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="View order in Orders table"
                      >
                        <span>View Order</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live</span>
                    </div>
                  </div>
                </div>

                {/* Persistent Order Summary Ribbon */}
                {linkedOrder && (
                  <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white px-5 py-2.5 flex items-center justify-between gap-3 text-xs flex-shrink-0 shadow-inner">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-300 whitespace-nowrap">
                        <Gem size={13} />
                        <span>{linkedOrder.category || 'Jewellery'}</span>
                      </div>
                      <span className="text-white/30">•</span>
                      <span className="text-slate-200 whitespace-nowrap">{linkedOrder.metal} ({linkedOrder.karat})</span>
                      {linkedOrder.weight && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="text-slate-200 whitespace-nowrap">{linkedOrder.weight}</span>
                        </>
                      )}
                      {linkedOrder.budget && (
                        <>
                          <span className="text-white/30">•</span>
                          <span className="font-bold text-amber-300 whitespace-nowrap">{linkedOrder.budget}</span>
                        </>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-emerald-200 border border-white/20 whitespace-nowrap">
                      {linkedOrder.status || 'Active'}
                    </span>
                  </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {selectedThread.messages.map((msg) => {
                    const isAdmin = msg.from === 'admin';
                    const isOrderCard =
                      msg.text.startsWith('📋 ORDER DETAILS') ||
                      msg.text.includes('ORDER DETAILS') ||
                      msg.text.startsWith('ORDER DETAILS');

                    if (isOrderCard) {
                      const rows = msg.text.split('\n');
                      return (
                        <div key={msg.id} className="flex items-start gap-2.5 my-2">
                          <Avatar user={{ name: 'Dream Jewels Support' }} size="xs" />
                          <div className="max-w-[90%] sm:max-w-[80%] flex flex-col gap-1">
                            <div className="rounded-2xl rounded-bl-xs overflow-hidden border border-emerald-200 shadow-sm bg-white">
                              {/* Order Card Title Bar */}
                              <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-4 py-2.5 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                  <Gem size={14} />
                                  <span className="font-bold text-xs tracking-wide">Custom Order Specifications</span>
                                </div>
                                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                                  {selectedThread.orderId || 'Active Order'}
                                </span>
                              </div>

                              {/* Specs grid */}
                              <div className="p-4 space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {rows.slice(2).map((row, i) => {
                                    if (row.startsWith('──') || row.startsWith('--')) return null;
                                    const colonIdx = row.indexOf(':');
                                    if (colonIdx === -1) return null;
                                    const label = row.slice(0, colonIdx + 1).trim();
                                    const value = row.slice(colonIdx + 1).trim();
                                    return (
                                      <div key={i} className="flex gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                        <span className="text-slate-400 font-medium whitespace-nowrap w-24 flex-shrink-0">{label}</span>
                                        <span className="text-slate-800 font-semibold truncate">{value}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="pt-2 mt-2 border-t border-slate-100">
                                    <p className="text-[11px] font-bold text-slate-500 mb-1">Attached Files & Documents:</p>
                                    <AttachmentList attachments={msg.attachments} isAdmin={false} onImageClick={(url, name) => setLightboxImage({ url, name })} />
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
                      <div key={msg.id} className={`flex items-end gap-2.5 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                        <Avatar user={{ name: isAdmin ? 'You' : selectedThread.customerName }} size="xs" />
                        <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 group">
                            {isAdmin && (
                              <button
                                onClick={() => deleteMessage(selectedThread.id, msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-300 hover:text-red-600 rounded-lg text-xs transition-all cursor-pointer order-last"
                                title="Delete message"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isAdmin
                                  ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-2xs'
                              }`}
                            >
                              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <AttachmentList
                                  attachments={msg.attachments}
                                  isAdmin={isAdmin}
                                  onImageClick={(url, name) => setLightboxImage({ url, name })}
                                />
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachments Pending Preview */}
                {pendingAttachments.length > 0 && (
                  <div className="px-5 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
                    {pendingAttachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs shadow-2xs flex-shrink-0">
                        {att.kind === 'image' ? (
                          <img src={att.url} alt={att.name} className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <FileText size={14} className="text-slate-500" />
                        )}
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => removePendingAttachment(att.id)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                    title="Attach image, video or document"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message to customer..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-100 transition-all text-slate-900 placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() && pendingAttachments.length === 0}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex-shrink-0"
                    title="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare size={36} className="text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Select an order conversation</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  Choose any customer or order from the left list to review history and reply in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <a
              href={lightboxImage.url}
              download={lightboxImage.name}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
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

          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl select-none"
            />
            <p className="text-sm font-medium text-slate-300">{lightboxImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
