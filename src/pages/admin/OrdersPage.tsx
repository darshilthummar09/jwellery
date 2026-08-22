import { FormEvent, useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Clock, Plus, X, Image as ImageIcon, FileDown, Share2, FileText, ExternalLink, Download, ChevronDown, Calendar } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { DetailCard } from '../../components/common/DetailCard';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { Order, OrderStatus, useChatNotification } from '../../context/ChatNotificationContext';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { METAL_OPTIONS, KARAT_OPTIONS } from '../../constants/order-options';
import { generateOrderPdf } from '../../utils/orderPdf';

const STATUS_COLORS: Record<OrderStatus, string> = {
  'Pending Approval': 'bg-orange-100 text-orange-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Review: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_VARIANT: Record<Order['priority'], 'danger' | 'warning' | 'muted'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'muted',
};

function PriorityBadge({ priority }: { priority: Order['priority'] }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>;
}

function OrderThumb({ order, size = 'sm' }: { order: Order; size?: 'sm' | 'md' }) {
  const dimension = size === 'md' ? 'w-14 h-14' : 'w-10 h-10';
  if (order.image) {
    return <img src={order.image} alt={order.name} className={`${dimension} rounded-lg object-cover border border-slate-200 flex-shrink-0`} />;
  }
  return (
    <div className={`${dimension} rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 flex-shrink-0`}>
      <ImageIcon size={size === 'md' ? 20 : 16} />
    </div>
  );
}

const emptyOrder = (nextId: string): Order => ({
  id: nextId,
  name: '',
  customerId: `manual-${Date.now()}`,
  customerName: '',
  designerName: '',
  status: 'Pending Approval',
  due: '',
  budget: '',
  priority: 'Medium',
  category: 'Rings',
  metal: METAL_OPTIONS[0],
  karat: KARAT_OPTIONS[2],
  progress: '0%',
  created: new Date().toLocaleDateString(),
  notes: '',
});

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, upsertOrder, approveOrder, rejectOrder, deleteOrder } = useChatNotification();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pdfBusyOrderId, setPdfBusyOrderId] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | Order['priority']>('All');
  const [dateFilter, setDateFilter] = useState('');
  const [clientFilter, setClientFilter] = useState<{ id: string; name: string } | null>(null);

  // Auto-select order from query param ?id=...
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setSelectedOrder(order);
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, orders, setSearchParams]);

  // Pre-filter by client (drill-down from the admin home page) via ?customerId=&customerName=
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setClientFilter({ id: customerId, name: searchParams.get('customerName') ?? 'this client' });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('customerId');
      newParams.delete('customerName');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && order.priority !== priorityFilter) return false;
      if (clientFilter && order.customerId !== clientFilter.id && order.customerName !== clientFilter.name) return false;
      if (dateFilter) {
        const filterDateFormatted = new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const createdDate = new Date(order.created);
        const orderIso = !isNaN(createdDate.getTime()) ? createdDate.toISOString().split('T')[0] : '';
        const matchesCreated =
          order.created === dateFilter ||
          order.created === filterDateFormatted ||
          orderIso === dateFilter ||
          order.created?.toLowerCase().includes(filterDateFormatted.toLowerCase());
        const matchesDue =
          order.due === dateFilter ||
          order.due === filterDateFormatted ||
          order.due?.toLowerCase().includes(filterDateFormatted.toLowerCase());
        if (!matchesCreated && !matchesDue) return false;
      }
      return true;
    });
  }, [orders, statusFilter, priorityFilter, dateFilter, clientFilter]);

  const hasActiveFilters = statusFilter !== 'All' || priorityFilter !== 'All' || !!dateFilter || !!clientFilter;

  const clearFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setDateFilter('');
    setClientFilter(null);
  };

  const openNewOrderModal = () => {
    const nextId = `ORD-${String(orders.length + 1).padStart(3, '0')}`;
    setEditingOrder(emptyOrder(nextId));
  };

  const saveOrder = (event: FormEvent) => {
    event.preventDefault();
    if (!editingOrder) return;

    upsertOrder(editingOrder);
    setSelectedOrder(editingOrder);
    setEditingOrder(null);
  };

  const handleApproveOrder = (order: Order) => {
    approveOrder(order.id);
    setSelectedOrder({ ...order, status: 'Approved' });
  };

  const handleRejectOrder = (event: FormEvent) => {
    event.preventDefault();
    if (!rejectingOrder) return;

    rejectOrder(rejectingOrder.id, rejectionReason);
    setSelectedOrder(null);
    setRejectingOrder(null);
    setRejectionReason('');
  };

  // Generate & Download PDF
  const handleGeneratePdf = async (order: Order) => {
    setPdfBusyOrderId(order.id);
    try {
      const { dataUri, fileName } = await generateOrderPdf(order, user?.name ?? 'Admin');
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setPdfBusyOrderId(null);
    }
  };

  // Generate & Share PDF via System Web Share or Apps
  const handleSharePdf = async (order: Order) => {
    setPdfBusyOrderId(order.id);
    try {
      const { dataUri, fileName } = await generateOrderPdf(order, user?.name ?? 'Admin');

      // Convert dataUri to Blob/File for native Web Share API
      const res = await fetch(dataUri);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Order Specification - ${order.name}`,
          text: `Order Brief for "${order.name}" (${order.customerName}) — Dream Jewels`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Order Specification - ${order.name}`,
          text: `Order ${order.id}: ${order.name} | Customer: ${order.customerName} | Metal: ${order.metal} (${order.karat}) | Target: ${order.due || 'To be scheduled'}`,
        });
      } else {
        // Fallback: Download the PDF and copy order brief to clipboard
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const summary = `Order ${order.id}: ${order.name}\nCustomer: ${order.customerName}\nMetal: ${order.metal} (${order.karat})\nTarget Date: ${order.due || 'To be scheduled'}`;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(summary);
        }
        alert('PDF downloaded! Order details summary copied to clipboard to share.');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('Error sharing PDF:', err);
      }
    } finally {
      setPdfBusyOrderId(null);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Orders</h1>
          <p className="hidden sm:block text-sm text-slate-500 mt-0.5">Manage all jewellery design orders.</p>
        </div>
        <button
          onClick={openNewOrderModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer flex-shrink-0"
        >
          <Plus size={15} />
          <span>New Order</span>
        </button>
      </div>

      {clientFilter && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            Filtered by client: {clientFilter.name}
            <button onClick={() => setClientFilter(null)} aria-label="Clear client filter" className="hover:text-emerald-900 ml-0.5">
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-slate-100 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
            </span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-semibold text-emerald-600 hover:underline flex-shrink-0 cursor-pointer">
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-3">
            {/* Status Dropdown */}
            <div className="relative inline-flex items-center w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | OrderStatus)}
                className={`w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100/80 border text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl pl-2 sm:pl-3.5 pr-5 sm:pr-8 py-1.5 sm:py-2 h-8 sm:h-auto outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition-all cursor-pointer truncate ${
                  statusFilter !== 'All' ? 'border-emerald-300 text-emerald-800 bg-emerald-50/60 font-semibold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">Status</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown size={12} className="absolute right-1.5 sm:right-2.5 pointer-events-none text-slate-400" />
            </div>

            {/* Priority Dropdown */}
            <div className="relative inline-flex items-center w-full sm:w-auto">
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as 'All' | Order['priority'])}
                className={`w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100/80 border text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl pl-2 sm:pl-3.5 pr-5 sm:pr-8 py-1.5 sm:py-2 h-8 sm:h-auto outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-100 transition-all cursor-pointer truncate ${
                  priorityFilter !== 'All' ? 'border-emerald-300 text-emerald-800 bg-emerald-50/60 font-semibold' : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown size={12} className="absolute right-1.5 sm:right-2.5 pointer-events-none text-slate-400" />
            </div>

            {/* Date Filter - Click Anywhere to Open Date Picker Popup */}
            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className={`relative inline-flex items-center justify-between gap-1 px-2 sm:px-3.5 py-1.5 sm:py-2 h-8 sm:h-auto rounded-lg sm:rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer select-none w-full sm:w-auto ${
                dateFilter
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 font-semibold shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2 truncate min-w-0">
                <Calendar size={13} className={dateFilter ? 'text-emerald-600 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
                <span className="truncate">
                  {dateFilter
                    ? new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Date'}
                </span>
              </div>
              {dateFilter ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateFilter('');
                  }}
                  className="p-0.5 hover:bg-emerald-200/60 rounded-full text-emerald-700 transition-colors flex-shrink-0"
                  title="Clear date"
                >
                  <X size={11} />
                </button>
              ) : (
                <ChevronDown size={12} className="text-slate-400 pointer-events-none flex-shrink-0" />
              )}
              {/* Invisible native input covering container so clicking anywhere triggers the picker */}
              <input
                ref={dateInputRef}
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState title="No orders found" description="Change the filters or create a new order." />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Image</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Order</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Customer</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Category</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Priority</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Wanted By</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="text-right px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-slate-50/60 transition-colors cursor-pointer">
                      <td className="px-6 py-4"><OrderThumb order={order} /></td>
                      <td className="px-6 py-4 font-medium text-slate-800">{order.name}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{order.customerName}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{order.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={order.priority} /></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{order.due || order.created || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-300 flex-shrink-0" />
                          {order.created}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === 'Pending Approval' ? (
                          <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                            <button onClick={() => handleApproveOrder(order)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                              <Check size={13} /> Accept
                            </button>
                            <button onClick={() => setRejectingOrder(order)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                              <X size={13} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedOrder(order)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedOrder(order);
                    }
                  }}
                  className="w-full text-left px-4 py-4 active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex gap-3">
                    <OrderThumb order={order} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mb-1">{order.name}</p>
                      <p className="text-xs text-slate-500 mb-2">{order.customerName} · {order.category}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={order.priority} />
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={11} /> {order.created}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-700 text-xs">{order.due || order.created}</span>
                      </div>
                    </div>
                  </div>
                  {order.status === 'Pending Approval' && (
                    <div className="flex gap-2 mt-3" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => handleApproveOrder(order)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                        <Check size={13} /> Accept
                      </button>
                      <button onClick={() => setRejectingOrder(order)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded-lg transition-colors">
                        <X size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-shrink-0 bg-white">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{selectedOrder.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[selectedOrder.status]}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">{selectedOrder.category} · #{selectedOrder.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4 sm:space-y-5 custom-scrollbar">
              {/* Specification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedOrder.customerName}</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Created Date</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedOrder.created || 'Today'}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Wanted By Date</p>
                  <p className="text-sm font-bold text-emerald-900 truncate">{selectedOrder.due || selectedOrder.budget || 'To be scheduled'}</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                  <div className="mt-0.5">
                    <PriorityBadge priority={selectedOrder.priority} />
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Metal & Purity</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {selectedOrder.metal || 'Not specified'} {selectedOrder.karat ? `(${selectedOrder.karat})` : ''}
                  </p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Size</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedOrder.size || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedOrder.weight ? `${selectedOrder.weight}g` : 'Not specified'}</p>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Crafting Progress</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedOrder.progress || '0%'}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Custom Notes & Instructions</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedOrder.notes || 'No special instructions provided.'}</p>
              </div>

              {/* Uploaded Reference Images */}
              {((selectedOrder.images && selectedOrder.images.some((f) => f.type?.startsWith('image/'))) || selectedOrder.image) && (
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Reference Images & Sketches
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedOrder.images && selectedOrder.images.length > 0
                      ? selectedOrder.images
                          .filter((f) => f.type?.startsWith('image/'))
                          .map((img) => (
                            <a
                              key={img.id}
                              href={img.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group block rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-emerald-400 transition-all shadow-2xs"
                            >
                              <div className="h-32 sm:h-36 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                                <img src={img.url} alt={img.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <div className="p-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
                                <span className="truncate">{img.name}</span>
                                <ExternalLink size={13} className="text-slate-400 flex-shrink-0 ml-1.5" />
                              </div>
                            </a>
                          ))
                      : selectedOrder.image && (
                          <a
                            href={selectedOrder.image}
                            target="_blank"
                            rel="noreferrer"
                            className="group block rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-emerald-400 transition-all shadow-2xs"
                          >
                            <img src={selectedOrder.image} alt={selectedOrder.name} className="h-32 sm:h-36 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="p-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
                              <span className="truncate">{selectedOrder.name}</span>
                              <ExternalLink size={13} className="text-slate-400 flex-shrink-0" />
                            </div>
                          </a>
                        )}
                  </div>
                </div>
              )}

              {/* Uploaded PDF Documents & Blueprints */}
              {selectedOrder.images && selectedOrder.images.some((f) => !f.type?.startsWith('image/')) && (
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Attached PDF Documents & Blueprints
                  </div>
                  <div className="space-y-2.5">
                    {selectedOrder.images
                      .filter((f) => !f.type?.startsWith('image/'))
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {doc.size ? `${(doc.size / 1024).toFixed(1)} KB · ` : ''}Merged in Spec Brief
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            download={doc.name}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ml-2"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedOrder.rejectionReason && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-1">Rejection Reason</div>
                  <p className="text-sm text-red-700 leading-relaxed">{selectedOrder.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Fixed Sticky Footer Toolbar */}
            <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {selectedOrder.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => handleApproveOrder(selectedOrder)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectingOrder(selectedOrder)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setEditingOrder(selectedOrder)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Edit Order
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Generate PDF Button */}
                <button
                  onClick={() => handleGeneratePdf(selectedOrder)}
                  disabled={pdfBusyOrderId === selectedOrder.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
                >
                  <FileDown size={14} className="text-emerald-600" />
                  <span>{pdfBusyOrderId === selectedOrder.id ? 'Generating…' : 'Generate PDF'}</span>
                </button>

                {/* Share PDF Button */}
                <button
                  onClick={() => handleSharePdf(selectedOrder)}
                  disabled={pdfBusyOrderId === selectedOrder.id}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>{pdfBusyOrderId === selectedOrder.id ? 'Preparing…' : 'Share PDF'}</span>
                </button>

                <button
                  onClick={() => setDeletingOrder(selectedOrder)}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingOrder && (
        <Modal title={orders.some((order) => order.id === editingOrder.id) ? 'Edit Order' : 'New Order'} onClose={() => setEditingOrder(null)}>
          <form onSubmit={saveOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Order Name', 'name'],
              ['Customer', 'customerName'],
              ['Category', 'category'],
              ['Due Date', 'due'],
              ['Progress', 'progress'],
            ].map(([label, key]) => (
              <label key={key} className="text-sm font-medium text-slate-700">
                {label}
                <input
                  required={key !== 'due'}
                  value={String(editingOrder[key as keyof Order] ?? '')}
                  onChange={(event) => setEditingOrder({ ...editingOrder, [key]: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            ))}
            <label className="text-sm font-medium text-slate-700">
              Metal
              <select value={editingOrder.metal} onChange={(event) => setEditingOrder({ ...editingOrder, metal: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400">
                {METAL_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Karat
              <select value={editingOrder.karat} onChange={(event) => setEditingOrder({ ...editingOrder, karat: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400">
                {KARAT_OPTIONS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select value={editingOrder.status} onChange={(event) => setEditingOrder({ ...editingOrder, status: event.target.value as OrderStatus })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400">
                <option>Pending Approval</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Completed</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Priority
              <select value={editingOrder.priority} onChange={(event) => setEditingOrder({ ...editingOrder, priority: event.target.value as Order['priority'] })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">
              Notes
              <textarea value={editingOrder.notes} onChange={(event) => setEditingOrder({ ...editingOrder, notes: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">Save Order</button>
            </div>
          </form>
        </Modal>
      )}

      {rejectingOrder && (
        <Modal title="Reject Order" subtitle={rejectingOrder.name} onClose={() => setRejectingOrder(null)}>
          <form onSubmit={handleRejectOrder} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Reason for Rejection</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Optional explanation for the customer..."
              className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 resize-none transition-all"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRejectingOrder(null)} className="px-4 py-2.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">Reject Order</button>
            </div>
          </form>
        </Modal>
      )}

      {deletingOrder && (
        <ConfirmModal
          title="Delete Order"
          message={`Are you sure you want to delete ${deletingOrder.name}? This action cannot be undone.`}
          confirmLabel="Delete Order"
          onConfirm={() => {
            deleteOrder(deletingOrder.id);
            setDeletingOrder(null);
            setSelectedOrder(null);
          }}
          onClose={() => setDeletingOrder(null)}
        />
      )}
    </PageContainer>
  );
}
