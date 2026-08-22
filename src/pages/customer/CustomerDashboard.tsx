import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import {
  ShoppingBag, Clock, CheckCircle2, Star, MessageCircle,
  Plus, Search, Filter, X, Send, Download, HeadphonesIcon,
  FileText, Image as ImageIcon, Package, CheckCircle, Gem, Calendar
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { StatCard } from '../../components/common/StatCard';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { Order, OrderDetails, ChatAttachment } from '../../context/ChatNotificationContext';
import { METAL_OPTIONS, KARAT_OPTIONS } from '../../constants/order-options';
import { compressImageFile, readFileAsDataUrl } from '../../utils/imageCompression';

// ─── Constants & Helpers ───────────────────────────────────────────────────────

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;

const CATEGORY_EMOJIS: Record<string, string> = {
  Rings: '💍',
  Necklaces: '📿',
  Earrings: '✨',
  Bracelets: '🔱',
  Bangles: '⭕',
  Pendants: '💎',
  Other: '👑',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'Pending Approval': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: <Clock size={11} /> },
  'Approved':         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={11} /> },
  'Rejected':         { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <X size={11} /> },
  'In Progress':      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Package size={11} /> },
  'Review':           { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={11} /> },
  'Completed':        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={11} /> },
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  kind: 'image' | 'pdf' | 'file';
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: null,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap flex-shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {status}
    </span>
  );
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
              <img src={attachment.url} alt={attachment.name} className="max-h-48 max-w-full rounded-xl object-cover" />
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

// ─── Main Customer Dashboard ──────────────────────────────────────────────────

export function CustomerDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    orders,
    threads,
    createThreadForOrder,
    sendCustomerMessage,
    markThreadRead,
    deleteMessage,
    getChatUnreadCount,
  } = useChatNotification();

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';

  // Customer's orders
  const myOrders = orders.filter(
    (o) =>
      o.customerId === customerId ||
      o.customerName.toLowerCase() === customerName.toLowerCase()
  );

  const activeOrders = myOrders.filter((o) => o.status !== 'Completed' && o.status !== 'Rejected');
  const readyOrders = myOrders.filter((o) => o.status === 'Completed');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Approval' | 'In Progress' | 'Completed' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = myOrders.filter((order) => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.name.toLowerCase().includes(q) ||
      order.category.toLowerCase().includes(q) ||
      order.metal.toLowerCase().includes(q) ||
      (order.notes && order.notes.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // ── Order Request Modal State ──────────────────────────────────────────────
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Rings');
  const [metal, setMetal] = useState<string>(METAL_OPTIONS[0]);
  const [karat, setKarat] = useState<string>(KARAT_OPTIONS[2]);
  const [size, setSize] = useState('');
  const [weight, setWeight] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Chat Drawer State ──────────────────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedOrderContext, setSelectedOrderContext] = useState<{ id: string; name: string } | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Support thread
  const supportThread = threads.find(
    (t) =>
      t.participantRole !== 'designer' &&
      (t.customerId === customerId || t.customerName.toLowerCase() === customerName.toLowerCase())
  );

  const unreadChatCount = getChatUnreadCount('customer');

  // Open Chat from ?chat=true query param
  useEffect(() => {
    if (searchParams.get('chat') === 'true') {
      setIsChatOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('chat');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Open Order Modal from ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsOrderModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Mark read when chat open
  useEffect(() => {
    if (isChatOpen && supportThread) {
      markThreadRead(supportThread.id, 'customer');
    }
  }, [isChatOpen, supportThread?.id, supportThread?.messages.length, markThreadRead]);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatOpen, supportThread?.messages.length]);

  const handleOpenChatForOrder = (order: Order) => {
    setSelectedOrderContext({ id: order.id, name: order.name });
    setIsChatOpen(true);
  };

  const handleOpenGeneralChat = () => {
    setSelectedOrderContext(null);
    setIsChatOpen(true);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    if (!supportThread) {
      const generalInquiry: OrderDetails = {
        name: selectedOrderContext ? `Inquiry: ${selectedOrderContext.name}` : 'General Inquiry',
        category: 'General',
        metal: '-',
        karat: '-',
        budget: 'Custom Order',
      };
      createThreadForOrder(customerId, customerName, generalInquiry);
    }

    sendCustomerMessage(customerId, customerName, chatInput.trim(), supportThread?.id);
    setChatInput('');
  };

  // File handling for order modal
  const handleFilesSelected = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setError('');

      const incoming = Array.from(fileList);
      const remaining = MAX_FILES - uploadedFiles.length;
      if (remaining <= 0) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return;
      }
      const toProcess = incoming.slice(0, remaining);

      const oversized = toProcess.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
      if (oversized.length > 0) {
        setError(`"${oversized[0].name}" exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
        return;
      }

      const newFiles: UploadedFile[] = await Promise.all(
        toProcess.map(async (file, i) => {
          const isImage = file.type.startsWith('image/');
          const isPdf = file.type === 'application/pdf';
          const { dataUrl, size } = isImage
            ? await compressImageFile(file)
            : { dataUrl: await readFileAsDataUrl(file), size: file.size };
          return {
            id: Date.now() + i,
            name: file.name,
            size,
            type: isImage ? 'image/jpeg' : file.type,
            dataUrl,
            kind: isImage ? 'image' : isPdf ? 'pdf' : 'file',
          };
        })
      );

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadedFiles.length]
  );

  const removeFile = (id: number) => setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

  const resetOrderForm = () => {
    setName('');
    setCategory('Rings');
    setMetal(METAL_OPTIONS[0]);
    setKarat(KARAT_OPTIONS[2]);
    setSize('');
    setWeight('');
    setDesiredDate('');
    setNotes('');
    setUploadedFiles([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for your custom jewellery piece.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = desiredDate
        ? new Date(desiredDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'To be scheduled';

      const orderPayload: OrderDetails = {
        name: name.trim(),
        category,
        metal,
        karat,
        size: size.trim() || undefined,
        weight: weight.trim() || undefined,
        budget: formattedDate,
        deliveryDate: formattedDate,
        notes: notes.trim() || undefined,
        attachments: uploadedFiles.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          dataUrl: f.dataUrl,
        })),
      };

      createThreadForOrder(customerId, customerName, orderPayload);
      setIsOrderModalOpen(false);
      resetOrderForm();
    } catch {
      setError('Failed to submit order request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const messages = supportThread?.messages ?? [];

  return (
    <PageContainer>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <PageTitle
            title={`Welcome back, ${user?.name?.split(' ')[0]} 💎`}
            subtitle="Explore and track your bespoke jewellery orders in real-time."
            className="mb-0"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Support Chat Button */}
          <button
            onClick={handleOpenGeneralChat}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl border border-emerald-200 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle size={16} className="text-emerald-600" />
            <span>Support Chat</span>
            {unreadChatCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] font-bold rounded-full animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* + Request Custom Order Button */}
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            Request Custom Order
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-8">
        <StatCard
          title="Active Orders"
          value={activeOrders.length.toString()}
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          title="Ready / Completed"
          value={readyOrders.length.toString()}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Live Support Chat"
          value={unreadChatCount > 0 ? `${unreadChatCount} New` : "Online"}
          icon={MessageCircle}
          color="purple"
          onClick={handleOpenGeneralChat}
        />
      </div>

      {/* Main Orders Catalog Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 mb-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Jewellery Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click "Chat" on any piece to message our master craftsmen directly.</p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 w-full sm:w-64 focus-within:border-emerald-400 focus-within:bg-white transition-all">
              <Search size={14} className="text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, metal, notes..."
                className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium overflow-x-auto">
              {(['All', 'Pending Approval', 'In Progress', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag size={24} />
            </div>
            <p className="text-base font-semibold text-slate-800">
              {myOrders.length === 0 ? 'No custom orders yet' : 'No matching orders found'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {myOrders.length === 0
                ? 'Create your first bespoke jewellery request and watch our master artisans bring your dream piece to life.'
                : 'Try adjusting your search query or filter to view other orders.'}
            </p>
            {myOrders.length === 0 && (
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={14} />
                Create First Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const emoji = CATEGORY_EMOJIS[order.category] || '👑';
              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id}`}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden flex flex-col group"
                >
                  {/* Card Cover */}
                  <div className="h-44 bg-gradient-to-br from-slate-50 to-emerald-50/40 flex items-center justify-center text-6xl select-none overflow-hidden relative">
                    {order.image ? (
                      <img src={order.image} alt={order.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span>{emoji}</span>
                    )}
                    {/* Status ribbon */}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                      <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-emerald-700 transition-colors">
                        {order.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {order.category} · {order.metal} ({order.karat})
                      </p>
                    </div>

                    {/* Specs badges */}
                    {(order.size || order.weight || order.created) && (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-slate-600">
                        {order.size && (
                          <div>
                            <span className="font-semibold text-slate-400">Size: </span>
                            <span className="font-medium text-slate-800">No. {order.size}</span>
                          </div>
                        )}
                        {order.weight && (
                          <div>
                            <span className="font-semibold text-slate-400">Weight: </span>
                            <span className="font-medium text-slate-800">{order.weight}</span>
                          </div>
                        )}
                        {order.created && (
                          <div className="col-span-2">
                            <span className="font-semibold text-slate-400">Placed On: </span>
                            <span className="font-medium text-slate-800">{order.created}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 mb-3 line-clamp-2">
                        "{order.notes}"
                      </p>
                    )}

                    {/* Rejection reason */}
                    {order.status === 'Rejected' && order.rejectionReason && (
                      <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3 text-xs text-red-700">
                        <span className="font-bold block text-red-600 mb-0.5">Reason:</span>
                        {order.rejectionReason}
                      </div>
                    )}

                    {/* Progress */}
                    {order.progress && order.progress !== '0%' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1">
                          <span>Crafting Progress</span>
                          <span className="font-bold text-emerald-600">{order.progress}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: order.progress }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Wanted By</span>
                          <p className="font-bold text-slate-800 text-xs">{order.due || order.created || 'To be scheduled'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenChatForOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-semibold rounded-xl border border-emerald-200 hover:border-emerald-600 transition-all shadow-xs group/chat cursor-pointer"
                        title="Open live chat about this order"
                      >
                        <MessageCircle size={14} className="text-emerald-600 group-hover/chat:text-white transition-colors" />
                        <span>Order Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide-Over Live Chat Drawer ─────────────────────────────────────── */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsChatOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <HeadphonesIcon size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Dream Jewels Support & Artisans</h3>
                  <p className="text-xs flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-2 h-2 rounded-full inline-block bg-emerald-500 animate-pulse" />
                    Online & Ready to Help
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Order Context Banner */}
            {selectedOrderContext && (
              <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-medium truncate">
                  <Gem size={14} className="text-emerald-600 flex-shrink-0" />
                  <span className="truncate">Order Context: <span className="font-bold">{selectedOrderContext.name}</span></span>
                </div>
                <button
                  onClick={() => setSelectedOrderContext(null)}
                  className="text-[11px] text-emerald-700 hover:underline flex-shrink-0 ml-2 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <MessageCircle size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Say Hello!</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                    Have a question about a design or custom order? Message our team directly.
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
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2">
                              <span className="text-white font-bold text-xs tracking-wide">Order Summary</span>
                            </div>
                            <div className="px-4 py-3 space-y-1.5">
                              {msg.text.split('\n').slice(2).map((row, i) => {
                                if (row.startsWith('--') || row.startsWith('──')) return <div key={i} className="border-t border-slate-100 my-1" />;
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
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed space-y-2 ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
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
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center gap-2.5 bg-white">
              <Avatar user={user} size="xs" />
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder={selectedOrderContext ? `Ask about ${selectedOrderContext.name}...` : "Type a message..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <button
                onClick={handleSendChatMessage}
                className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs active:scale-95 cursor-pointer flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Order Request Modal ─────────────────────────────────────── */}
      {isOrderModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => { setIsOrderModalOpen(false); resetOrderForm(); }}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-y-auto flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50 sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-serif font-bold text-slate-900">
                  Request Custom Jewellery Order
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in your custom jewelry specifications and our artisans will review and price your design.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsOrderModalOpen(false); resetOrderForm(); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              )}

              <form onSubmit={handleOrderSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Piece Title / Name *</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 2.5ct Solitaire Diamond Engagement Ring"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>

                {/* Category & Karat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none cursor-pointer"
                    >
                      {Object.keys(CATEGORY_EMOJIS).map((cat) => (
                        <option key={cat} value={cat} className="text-slate-800">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Metal & Purity</label>
                    <select
                      value={karat}
                      onChange={(e) => setKarat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none cursor-pointer"
                    >
                      {KARAT_OPTIONS.map((k) => (
                        <option key={k} value={k} className="text-slate-800">{k}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metal Option & Size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Metal Type</label>
                    <select
                      value={metal}
                      onChange={(e) => setMetal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none cursor-pointer"
                    >
                      {METAL_OPTIONS.map((m) => (
                        <option key={m} value={m} className="text-slate-800">{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Size (Optional)</label>
                    <input
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 7 or 18mm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Weight & Date when you want this */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Est. Weight (Optional)</label>
                    <input
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 4.5g"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Calendar size={13} className="text-emerald-600" />
                      When do you want this? *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={desiredDate}
                      onChange={(e) => setDesiredDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Special Instructions / Gemstones</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe any engravings, specific diamond cuts, or bespoke design preferences..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none resize-none transition-all"
                  />
                </div>

                {/* Image & File Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reference Images & Sketches (Max 10)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-xl p-4 text-center cursor-pointer transition-all"
                  >
                    <ImageIcon size={24} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Click to upload reference photos</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, PDF up to 5MB</p>
                  </div>

                  {/* Uploaded File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="relative rounded-lg border border-slate-200 overflow-hidden group aspect-square">
                          {file.kind === 'image' ? (
                            <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-50 flex items-center justify-center p-2 text-center text-[10px] text-slate-600 font-semibold truncate">
                              {file.name}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsOrderModalOpen(false); resetOrderForm(); }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
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
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-sm font-medium text-slate-300">{lightboxImage.name}</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
