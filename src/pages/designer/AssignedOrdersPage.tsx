import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AlertCircle, Clock } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { DetailCard } from '../../components/common/DetailCard';
import { Badge } from '../../components/common/Badge';
import { Order, useChatNotification } from '../../context/ChatNotificationContext';
import { useAuth } from '../../hooks/useAuth';

const STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Review: 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_VARIANT: Record<Order['priority'], 'danger' | 'warning' | 'muted'> = {
  High: 'danger',
  Medium: 'warning',
  Low: 'muted',
};

export function AssignedOrdersPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, upsertOrder } = useChatNotification();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const assignedOrders = orders.filter(
    (order) =>
      order.status !== 'Pending Approval' &&
      order.status !== 'Rejected' &&
      order.designerName.toLowerCase() === (user?.name ?? '').toLowerCase()
  );

  // Auto-select order from query param ?id=...
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      const order = assignedOrders.find((o) => o.id === id);
      if (order) {
        setSelectedOrder(order);
        // Clear search param so it doesn't reopen if closed
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, assignedOrders, setSearchParams]);

  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null);
  const [statusInput, setStatusInput] = useState<Order['status']>('Approved');
  const [progressInput, setProgressInput] = useState('');

  // Sync inputs when updatingOrder selection changes
  useEffect(() => {
    if (updatingOrder) {
      setStatusInput(updatingOrder.status);
      setProgressInput(updatingOrder.progress);
    }
  }, [updatingOrder]);


  const handleStatusUpdate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!updatingOrder) return;

    upsertOrder({
      ...updatingOrder,
      status: statusInput,
      progress: progressInput.endsWith('%') ? progressInput : `${progressInput}%`,
    });

    setUpdatingOrder(null);
  };

  return (
    <PageContainer>
      <PageTitle title="Assigned Orders" subtitle="Your current jewellery design assignments." className="mb-6 sm:mb-8" />
      <div className="space-y-4 sm:space-y-5">
        {assignedOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">No assigned orders</p>
            <p className="text-xs text-slate-400 mt-1">Orders assigned by admin will appear here.</p>
          </div>
        ) : (
          assignedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={PRIORITY_VARIANT[order.priority]}>{order.priority} Priority</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">{order.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Client: {order.customerName}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[order.status] ?? 'bg-slate-100 text-slate-700'}`}>{order.status}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap"><Clock size={11} className="flex-shrink-0" />{order.due}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600 italic">{order.notes || 'No extra notes were provided.'}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
                <button onClick={() => setUpdatingOrder(order)} className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">Update Status</button>
                <button onClick={() => setSelectedOrder(order)} className="px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">View Details</button>
              </div>
            </div>
          ))
        )}
      </div>

      {updatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setUpdatingOrder(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-800 mb-1">Update Order Status</h3>
            <p className="text-xs text-slate-400 mb-4">{updatingOrder.name}</p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select
                  value={statusInput}
                  onChange={(event) => setStatusInput(event.target.value as any)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400"
                >
                  <option>Approved</option>
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Completed</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Progress Percentage
                <input
                  type="text"
                  required
                  value={progressInput}
                  onChange={(event) => setProgressInput(event.target.value)}
                  placeholder="e.g. 35%"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <button type="button" onClick={() => setUpdatingOrder(null)} className="px-4 py-2.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" onClick={() => setSelectedOrder(null)}>
          <div className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <DetailCard
              title={selectedOrder.name}
              subtitle={selectedOrder.category}
              className="shadow-2xl h-full sm:h-auto sm:rounded-2xl rounded-none"
              onClose={() => setSelectedOrder(null)}
              badge={<span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${STATUS_COLORS[selectedOrder.status] ?? 'bg-slate-100 text-slate-700'}`}>{selectedOrder.status}</span>}
              fields={[
                { label: 'Customer', value: selectedOrder.customerName },
                { label: 'Budget', value: selectedOrder.budget },
                { label: 'Due Date', value: selectedOrder.due },
                { label: 'Priority', value: <Badge variant={PRIORITY_VARIANT[selectedOrder.priority]}>{selectedOrder.priority}</Badge> },
                { label: 'Metal', value: `${selectedOrder.metal || 'Not specified'} ${selectedOrder.karat ? `(${selectedOrder.karat})` : ''}` },
                { label: 'Size', value: selectedOrder.size || 'Not specified' },
                { label: 'Weight', value: selectedOrder.weight || 'Not specified' },
                { label: 'Progress', value: selectedOrder.progress },
              ]}
              actions={
                <button
                  onClick={() => {
                    setUpdatingOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Update Status
                </button>
              }
            >
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Order Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedOrder.notes || 'No extra notes were provided.'}</p>
              </div>
              {(selectedOrder.images?.length || selectedOrder.image) && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 mt-3">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Sample Images / Sketches</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(selectedOrder.images?.length ? selectedOrder.images : [{ id: 0, name: selectedOrder.name, url: selectedOrder.image ?? '', size: 0, type: 'image/*' }]).map((image) => (
                      <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={image.url} alt={image.name} className="h-32 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </DetailCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
