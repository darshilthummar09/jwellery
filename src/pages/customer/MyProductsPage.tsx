import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Sparkles, Upload, X } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useChatNotification } from '../../context/ChatNotificationContext';
import type { OrderDetails } from '../../context/ChatNotificationContext';
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

interface CustomOrder {
  id: number;
  name: string;
  category: string;
  status: string;
  price: string;
  image: string; // Base64 Data URL or Emoji
  metal?: string;
  karat?: string;
  size?: string;
  weight?: string;
  deliveryDate?: string;
  notes?: string;
}

const DEFAULT_PRODUCTS: CustomOrder[] = [
  {
    id: 54,
    name: 'Custom Diamond Ring (Order #54)',
    category: 'Rings',
    status: 'In Design',
    price: 'Estimated',
    image: '💍',
    metal: 'Rose Gold',
    karat: '18k',
    size: '24',
    weight: '4.000 gm',
    deliveryDate: '14/07/2026',
    notes: 'Sample received (moklavel che) · AD diamond · CAD required (cade mokljo)',
  },
  { id: 1, name: 'Solitaire Engagement Ring', category: 'Rings',     status: 'In Design', price: '₹2,45,000', image: '💍' },
  { id: 2, name: 'Gold Bangles Set',           category: 'Bangles',   status: 'Ready',     price: '₹3,10,000', image: '⭕' },
  { id: 3, name: 'Diamond Pendant',            category: 'Pendants',  status: 'In Review', price: '₹95,000',   image: '💎' },
];

const STATUS_COLORS: Record<string, string> = {
  'In Design': 'bg-purple-100 text-purple-700 border-purple-200',
  'Ready':     'bg-emerald-100 text-emerald-700 border-emerald-200',
  'In Review': 'bg-amber-100 text-amber-700 border-amber-200',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  'Rings': '💍',
  'Necklaces': '📿',
  'Earrings': '✨',
  'Bracelets': '🔱',
  'Bangles': '⭕',
  'Pendants': '💎',
  'Other': '👑',
};

const STORAGE_KEY = 'dreamjewels_customer_orders';

export function MyProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { createThreadForOrder } = useChatNotification();
  const [products, setProducts] = useState<CustomOrder[]>(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PRODUCTS;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Rings');
  const [metal, setMetal] = useState('Gold');
  const [karat, setKarat] = useState('18k');
  const [size, setSize] = useState('');
  const [weight, setWeight] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  
  // Image upload states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [error, setError] = useState('');

  // Sync state with sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  // Open modal if ?new=true query param is present
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsOpen(true);
      // Remove the query param to avoid reopen on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file must be under 2MB.');
      return;
    }

    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name or title for your custom jewellery piece.');
      return;
    }
    if (!budget.trim()) {
      setError('Please provide an estimated budget.');
      return;
    }

    const formattedBudget = budget.startsWith('₹') || budget.toLowerCase() === 'estimated' ? budget : `₹${budget}`;

    const newOrder: CustomOrder = {
      id: Date.now(),
      name: name.trim(),
      category,
      status: 'In Design',
      price: formattedBudget,
      image: uploadedImage || CATEGORY_EMOJIS[category] || '👑',
      metal,
      karat,
      size: size.trim() || undefined,
      weight: weight.trim() ? `${weight.trim()} gm` : undefined,
      deliveryDate: new Date().toLocaleDateString(),
      notes: notes.trim() || undefined,
    };

    setProducts((prev) => [newOrder, ...prev]);

    // Create chat thread with full order details for admin
    const customerId = user?.id ?? user?.email ?? 'customer';
    const customerName = user?.name ?? 'Customer';
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
      hasImage: !!uploadedImage,
    };
    createThreadForOrder(customerId, customerName, orderDetails);

    // Reset Form
    setName('');
    setCategory('Rings');
    setMetal('Gold');
    setKarat('18k');
    setSize('');
    setWeight('');
    setBudget('');
    setNotes('');
    setUploadedImage(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
    setIsOpen(false);
  };

  return (
    <PageContainer>
      <PageTitle
        title="My Products"
        subtitle="Track the status of your jewellery orders."
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => {
          const isBase64Image = p.image.startsWith('data:image/');
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-40 bg-gradient-to-br from-slate-50 to-emerald-50/50 flex items-center justify-center text-6xl select-none overflow-hidden">
                  {isBase64Image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    p.image
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 leading-tight">{p.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 border ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{p.category} {p.metal ? `· ${p.metal}` : ''} {p.karat ? `(${p.karat})` : ''}</p>

                  {/* Specific technical specifications */}
                  {(p.size || p.weight || p.deliveryDate) && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 text-slate-600">
                      {p.size && <div><span className="font-semibold text-slate-500">Size:</span> No. {p.size}</div>}
                      {p.weight && <div><span className="font-semibold text-slate-500">Weight:</span> {p.weight}</div>}
                      {p.deliveryDate && <div className="col-span-2"><span className="font-semibold text-slate-500">Delivery Date:</span> {p.deliveryDate}</div>}
                    </div>
                  )}

                  {p.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">{p.notes}</p>
                  )}
                </div>
              </div>
              <div className="px-5 pb-5 pt-0">
                <p className="font-bold text-emerald-600 text-lg">{p.price}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Order Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <Sparkles size={20} className="text-emerald-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Request Custom Jewellery Piece</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Provide the details of your dream piece, and our master designers will start crafting it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Piece Title */}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Category & Metal & Karat */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="order-category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  id="order-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
                >
                  <option value="Rings">Rings</option>
                  <option value="Necklaces">Necklaces</option>
                  <option value="Earrings">Earrings</option>
                  <option value="Bracelets">Bracelets</option>
                  <option value="Bangles">Bangles</option>
                  <option value="Pendants">Pendants</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="order-metal" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Metal
                </label>
                <select
                  id="order-metal"
                  value={metal}
                  onChange={(e) => setMetal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
                >
                  <option value="Gold">Gold</option>
                  <option value="Rose Gold">Rose Gold</option>
                  <option value="White Gold">White Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Silver">Silver</option>
                </select>
              </div>

              <div>
                <label htmlFor="order-karat" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Purity / Karat
                </label>
                <select
                  id="order-karat"
                  value={karat}
                  onChange={(e) => setKarat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-950 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
                >
                  <option value="14k">14k</option>
                  <option value="18k">18k</option>
                  <option value="22k">22k</option>
                  <option value="24k">24k</option>
                </select>
              </div>
            </div>

            {/* Size & Weight */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
                />
              </div>
            </div>

            {/* Estimated Budget */}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Brief Notes */}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm outline-none focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100 transition-all resize-none"
              />
            </div>

            {/* Image Upload Area */}
            <div>
              <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Upload Sample Image / Sketch
              </span>
              
              {!uploadedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 cursor-pointer rounded-xl p-4 transition-all flex flex-col items-center justify-center text-slate-400 gap-1.5"
                >
                  <Upload size={18} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">Click to upload design/sketch</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG or WEBP (Max 2MB)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border border-slate-100 rounded-xl p-3 bg-slate-50 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                    <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{fileName}</p>
                    <p className="text-[10px] text-slate-400">Ready to save</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeUploadedImage}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}

            {/* Footer buttons */}
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
              >
                Submit Request
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
