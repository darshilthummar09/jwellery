import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Clock, Filter, Plus, X, CalendarRange, Image as ImageIcon, FileDown, Send } from 'lucide-react';
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
  designerName: 'Riya Sharma',
  status: 'Pending Approval',
  due: '',
  budget: '',
  priority: 'Medium',
  category: '',
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
  const { orders, ensureDesignerThread, sendAdminMessage, upsertOrder, approveOrder, rejectOrder, deleteOrder } = useChatNotification();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pdfBusyOrderId, setPdfBusyOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | Order['priority']>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
      if (dateFrom || dateTo) {
        const created = new Date(order.created);
        if (isNaN(created.getTime())) return false;
        if (dateFrom && created < new Date(dateFrom)) return false;
        if (dateTo && created > new Date(`${dateTo}T23:59:59`)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, priorityFilter, dateFrom, dateTo, clientFilter]);

  const hasActiveFilters = statusFilter !== 'All' || priorityFilter !== 'All' || !!dateFrom || !!dateTo || !!clientFilter;

  const clearFilters = () => {
    setStatusFilter('All');
    setPriorityFilter('All');
    setDateFrom('');
    setDateTo('');
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

  const openDesignerChat = () => {
    if (!selectedOrder) return;

    const threadId = ensureDesignerThread(selectedOrder.designerName, selectedOrder.name);
    setSelectedOrder(null);

    const chatsPath = user?.role === 'super-admin' ? '/dashboard/super-admin/chats' : '/dashboard/admin/chats';
    navigate(`${chatsPath}?thread=${encodeURIComponent(threadId)}`);
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

  // Always regenerated fresh from the current order fields (never cached) so that
  // if the admin edits missing/wrong info first, the PDF reflects that latest data.
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
    } finally {
      setPdfBusyOrderId(null);
    }
  };

  const handleSendPdfToDesigner = async (order: Order) => {
    setPdfBusyOrderId(order.id);
    try {
      const { dataUri, fileName } = await generateOrderPdf(order, user?.name ?? 'Admin');
      const threadId = ensureDesignerThread(order.designerName, order.name);
      sendAdminMessage(
        threadId,
        `📎 Design brief for "${order.name}" — full order details and images attached as PDF.`,
        [{ id: Date.now(), name: fileName, size: Math.round((dataUri.length * 3) / 4), type: 'application/pdf', url: dataUri, kind: 'file' }]
      );
      setSelectedOrder(null);
      const chatsPath = user?.role === 'super-admin' ? '/dashboard/super-admin/chats' : '/dashboard/admin/chats';
      navigate(`${chatsPath}?thread=${encodeURIComponent(threadId)}`);
    } finally {
      setPdfBusyOrderId(null);
    }
  };

  const canGeneratePdf = (order: Order) => order.status !== 'Pending Approval' && order.status !== 'Rejected';

  return (
    <PageContainer>
      <PageTitle
        title="Orders"
        subtitle="Manage all jewellery design orders."
        className="mb-6 sm:mb-8"
        action={
          <button onClick={openNewOrderModal} className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <Plus size={16} />
            New Order
          </button>
        }
      />

      {clientFilter && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            Filtered by client: {clientFilter.name}
            <button onClick={() => setClientFilter(null)} aria-label="Clear client filter" className="hover:text-emerald-900">
              <X size={13} />
            </button>
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-medium text-emerald-600 hover:underline flex-shrink-0">
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-500 w-full sm:w-auto">
              <Filter size={14} className="flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'All' | OrderStatus)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-sm outline-none focus:border-emerald-400"
              >
                <option value="All">All statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-500 w-full sm:w-auto">
              <span className="w-3.5 h-3.5 rounded-full bg-red-400 flex-shrink-0" />
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as 'All' | Order['priority'])}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-sm outline-none focus:border-emerald-400"
              >
                <option value="All">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            <div className="flex items-center gap-2 text-sm text-slate-500 w-full sm:w-auto">
              <CalendarRange size={14} className="flex-shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                aria-label="From date"
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-sm outline-none focus:border-emerald-400"
              />
              <span className="text-slate-300">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                aria-label="To date"
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base sm:text-sm outline-none focus:border-emerald-400"
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
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Designer</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Priority</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Budget</th>
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
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{order.designerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><PriorityBadge priority={order.priority} /></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{order.budget}</td>
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
                      <p className="text-xs text-slate-500 mb-2">{order.customerName} · {order.designerName}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={order.priority} />
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={11} /> {order.created}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-700 text-sm">{order.budget}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" onClick={() => setSelectedOrder(null)}>
          <div className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <DetailCard
              title={selectedOrder.name}
              subtitle={selectedOrder.category}
              className="shadow-2xl h-full sm:h-auto sm:rounded-2xl rounded-none"
              onClose={() => setSelectedOrder(null)}
              badge={<span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[selectedOrder.status]}`}>{selectedOrder.status}</span>}
              fields={[
                { label: 'Customer', value: selectedOrder.customerName },
                { label: 'Designer', value: selectedOrder.designerName },
                { label: 'Budget', value: selectedOrder.budget },
                { label: 'Order Date', value: selectedOrder.created },
                { label: 'Due Date', value: selectedOrder.due },
                { label: 'Priority', value: <PriorityBadge priority={selectedOrder.priority} /> },
                { label: 'Metal', value: `${selectedOrder.metal || 'Not specified'} ${selectedOrder.karat ? `(${selectedOrder.karat})` : ''}` },
                { label: 'Size', value: selectedOrder.size || 'Not specified' },
                { label: 'Weight', value: selectedOrder.weight || 'Not specified' },
                { label: 'Progress', value: selectedOrder.progress },
              ]}
              actions={
                <>
                  {selectedOrder.status === 'Pending Approval' && (
                    <>
                      <button onClick={() => handleApproveOrder(selectedOrder)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => setRejectingOrder(selectedOrder)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold rounded-xl transition-colors">
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setEditingOrder(selectedOrder)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">Edit Order</button>
                  <button onClick={openDesignerChat} className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors">Message Designer</button>
                  {canGeneratePdf(selectedOrder) && (
                    <>
                      <button
                        onClick={() => handleGeneratePdf(selectedOrder)}
                        disabled={pdfBusyOrderId === selectedOrder.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
                      >
                        <FileDown size={14} /> {pdfBusyOrderId === selectedOrder.id ? 'Generating…' : 'Generate PDF'}
                      </button>
                      <button
                        onClick={() => handleSendPdfToDesigner(selectedOrder)}
                        disabled={pdfBusyOrderId === selectedOrder.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors"
                      >
                        <Send size={14} /> {pdfBusyOrderId === selectedOrder.id ? 'Sending…' : 'Send PDF to Designer'}
                      </button>
                    </>
                  )}
                  <button onClick={() => setDeletingOrder(selectedOrder)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-xl transition-colors">Delete</button>
                </>
              }
            >
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedOrder.notes}</p>
              </div>
              {selectedOrder.image && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 mt-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Sample Image / Sketch</div>
                  <a href={selectedOrder.image} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 bg-white max-w-xs">
                    <img src={selectedOrder.image} alt={selectedOrder.name} className="h-40 w-full object-cover" />
                  </a>
                  <p className="text-[10px] text-slate-400 mt-2">Additional files (PDFs, sketches) are visible in the customer's chat thread.</p>
                </div>
              )}
              {selectedOrder.rejectionReason && (
                <div className="bg-red-50 rounded-xl px-4 py-3 mt-3 border border-red-100">
                  <div className="text-xs font-medium uppercase tracking-wider text-red-400 mb-1">Rejection Reason</div>
                  <p className="text-sm text-red-700 leading-relaxed">{selectedOrder.rejectionReason}</p>
                </div>
              )}
            </DetailCard>
          </div>
        </div>
      )}

      {editingOrder && (
        <Modal title={orders.some((order) => order.id === editingOrder.id) ? 'Edit Order' : 'New Order'} onClose={() => setEditingOrder(null)}>
          <form onSubmit={saveOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Order Name', 'name'],
              ['Customer', 'customerName'],
              ['Designer', 'designerName'],
              ['Category', 'category'],
              ['Budget', 'budget'],
              ['Due Date', 'due'],
              ['Progress', 'progress'],
            ].map(([label, key]) => (
              <label key={key} className="text-sm font-medium text-slate-700">
                {label}
                <input
                  required
                  value={String(editingOrder[key as keyof Order])}
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
