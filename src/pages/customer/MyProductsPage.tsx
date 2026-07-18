import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import {
  CheckCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  Package,
  Plus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { OrderAttachment, OrderDetails, Project } from '../../context/ChatNotificationContext';
import { useAuth } from '../../hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../../app/components/ui/dialog';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadedFile {
  id: number;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  kind: 'image' | 'pdf' | 'file';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'Pending Approval': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: <Clock size={11} />,
  },
  'Approved': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle size={11} />,
  },
  'Rejected': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: <X size={11} />,
  },
  'In Progress': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Package size={11} />,
  },
  'Review': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <Clock size={11} />,
  },
  'Completed': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle size={11} />,
  },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Rings: '💍',
  Necklaces: '📿',
  Earrings: '✨',
  Bracelets: '🔱',
  Bangles: '⭕',
  Pendants: '💎',
  Other: '👑',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.icon}
      {status}
    </span>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ project }: { project: Project }) {
  const emoji = CATEGORY_EMOJIS[project.category] || '👑';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden flex flex-col">
      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-slate-50 to-emerald-50/50 flex items-center justify-center text-6xl select-none overflow-hidden relative">
        {project.image ? (
          <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          emoji
        )}
        {/* Completed ribbon */}
        {project.status === 'Completed' && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Completed
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-semibold text-slate-800 leading-tight text-sm">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>

        <p className="text-xs text-slate-400 mb-3">
          {project.category}
          {project.metal ? ` · ${project.metal}` : ''}
          {project.karat ? ` (${project.karat})` : ''}
        </p>

        {/* Technical specs */}
        {(project.size || project.weight || project.created) && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 text-slate-600">
            {project.size && (
              <div>
                <span className="font-semibold text-slate-500">Size: </span>No. {project.size}
              </div>
            )}
            {project.weight && (
              <div>
                <span className="font-semibold text-slate-500">Weight: </span>
                {project.weight}
              </div>
            )}
            {project.created && (
              <div className="col-span-2">
                <span className="font-semibold text-slate-500">Placed On: </span>
                {project.created}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {project.notes && (
          <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 line-clamp-2">
            {project.notes}
          </p>
        )}

        {/* Rejection reason */}
        {project.status === 'Rejected' && project.rejectionReason && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
            <p className="text-[11px] font-semibold text-red-500 mb-0.5">Rejection Reason</p>
            <p className="text-xs text-red-700">{project.rejectionReason}</p>
          </div>
        )}

        {/* Progress bar */}
        {project.progress && project.progress !== '0%' && (
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Progress</span>
              <span className="text-[10px] font-bold text-emerald-600">{project.progress}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: project.progress }}
              />
            </div>
          </div>
        )}

        {/* Budget */}
        <p className="font-bold text-emerald-600 text-base mt-3">{project.budget}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MyProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { createThreadForOrder, projects } = useChatNotification();

  // Derive customer's orders DIRECTLY from the shared projects context — never
  // use a separate localStorage list, so status updates from the admin always
  // show here immediately and completed orders never disappear.
  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';

  const myProjects = projects.filter(
    (p) =>
      p.customerId === customerId ||
      p.customerName.toLowerCase() === customerName.toLowerCase()
  );

  // ── Form state ────────────────────────────────────────────────────────────
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Rings');
  const [metal, setMetal] = useState('Gold');
  const [karat, setKarat] = useState('18k');
  const [size, setSize] = useState('');
  const [weight, setWeight] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open modal from ?new=true query param
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ── File handling ─────────────────────────────────────────────────────────
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
          const dataUrl = await readAsDataUrl(file);
          const isImage = file.type.startsWith('image/');
          const isPdf = file.type === 'application/pdf';
          return {
            id: Date.now() + i,
            name: file.name,
            size: file.size,
            type: file.type,
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

  const resetForm = () => {
    setName('');
    setCategory('Rings');
    setMetal('Gold');
    setKarat('18k');
    setSize('');
    setWeight('');
    setBudget('');
    setNotes('');
    setUploadedFiles([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name or title for your custom jewellery piece.');
      return;
    }
    if (!budget.trim()) {
      setError('Please provide an estimated budget.');
      return;
    }

    setIsSubmitting(true);

    const formattedBudget =
      budget.startsWith('₹') || budget.toLowerCase() === 'estimated'
        ? budget
        : `₹${budget}`;

    const attachments: OrderAttachment[] = uploadedFiles.map((f) => ({
      dataUrl: f.dataUrl,
      name: f.name,
      type: f.type,
      size: f.size,
    }));

    const orderDetails: OrderDetails = {
      name: name.trim(),
      category,
      metal,
      karat,
      size: size.trim() || undefined,
      weight: weight.trim() ? `${weight.trim()} gm` : undefined,
      budget: formattedBudget,
      notes: notes.trim() || undefined,
      deliveryDate: new Date().toLocaleDateString(),
      attachments,
    };

    // This adds the project to the shared context (Firebase-synced) and creates
    // the chat thread. The product will immediately appear in myProjects above.
    createThreadForOrder(customerId, customerName, orderDetails);

    resetForm();
    setIsOpen(false);
    setIsSubmitting(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageContainer>
      <PageTitle
        title="My Products"
        subtitle={`${myProjects.length} order${myProjects.length !== 1 ? 's' : ''} · status updates in real time`}
        className="mb-8"
        action={
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-100 transition-all active:scale-[0.98]"
          >
            <Plus size={16} />
            Request Custom Order
          </button>
        }
      />

      {/* ── Empty state ── */}
      {myProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <Sparkles size={28} className="text-emerald-500" />
          </div>
          <p className="font-semibold text-slate-700 mb-1">No orders yet</p>
          <p className="text-sm text-slate-400 mb-6">
            Request your first custom jewellery piece and track it here.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Request Custom Order
          </button>
        </div>
      ) : (
        <>
          {/* ── Summary row ── */}
          <div className="flex flex-wrap gap-3 mb-6">
            {(['Pending Approval', 'Approved', 'In Progress', 'Review', 'Completed', 'Rejected'] as const).map(
              (s) => {
                const count = myProjects.filter((p) => p.status === s).length;
                if (!count) return null;
                const cfg = STATUS_CONFIG[s];
                return (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.icon}
                    {s}
                    <span className="ml-0.5 font-bold">{count}</span>
                  </span>
                );
              }
            )}
          </div>

          {/* ── Product grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myProjects.map((project) => (
              <ProductCard key={project.id} project={project} />
            ))}
          </div>
        </>
      )}

      {/* ── New Order Dialog ── */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setIsOpen(open);
        }}
      >
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Sparkles size={20} className="text-emerald-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Request Custom Jewellery Piece
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Provide the details of your dream piece and our master designers will start crafting it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <label htmlFor="order-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Title / Name of the Piece
              </label>
              <input
                id="order-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Cascade Diamond Ring"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Category / Metal / Karat */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  id: 'order-category', label: 'Category', value: category,
                  onChange: setCategory,
                  options: ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles', 'Pendants', 'Other'],
                },
                {
                  id: 'order-metal', label: 'Metal', value: metal,
                  onChange: setMetal,
                  options: ['Gold', 'Rose Gold', 'White Gold', 'Platinum', 'Silver'],
                },
                {
                  id: 'order-karat', label: 'Karat', value: karat,
                  onChange: setKarat,
                  options: ['14k', '18k', '22k', '24k'],
                },
              ].map(({ id, label, value, onChange, options }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  >
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Size / Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="order-size" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Size
                </label>
                <input
                  id="order-size"
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
              <div>
                <label htmlFor="order-weight" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Weight (gm)
                </label>
                <input
                  id="order-weight"
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 4.000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="order-budget" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Estimated Budget (₹)
              </label>
              <input
                id="order-budget"
                type="text"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 1,50,000 or Estimated"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="order-notes" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Custom Requirements / Notes
              </label>
              <textarea
                id="order-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. AD diamond, please send CAD design..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
              />
            </div>

            {/* Multi-file Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Upload Files
                </span>
                <span className="text-[10px] text-slate-400">
                  {uploadedFiles.length}/{MAX_FILES} files
                </span>
              </div>

              {uploadedFiles.length < MAX_FILES && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 cursor-pointer rounded-xl p-4 transition-all flex flex-col items-center gap-1.5"
                >
                  <Upload size={18} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">
                    Click to upload images or PDFs
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG, WEBP, PDF · Max {MAX_FILE_SIZE_MB} MB each · Up to {MAX_FILES} files
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    className="hidden"
                  />
                </div>
              )}

              {uploadedFiles.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="relative flex items-center gap-2 border border-slate-100 rounded-xl p-2 bg-slate-50"
                    >
                      {file.kind === 'image' ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className={file.kind === 'pdf' ? 'text-red-500' : 'text-slate-400'} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            {/* Footer */}
            <DialogFooter className="flex items-center gap-2 pt-2 border-t border-slate-50">
              <DialogClose asChild>
                <button
                  type="button"
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
              >
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
