import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Send, Sparkles, Wand2, Hammer, ShoppingBag, RotateCcw, ShieldCheck } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageTitle } from '../../components/common/PageTitle';
import { useAuth } from '../../hooks/useAuth';
import { useChatNotification } from '../../context/ChatNotificationContext';
import { Avatar } from '../../components/common/Avatar';
import type { OrderDetails } from '../../context/ChatNotificationContext';
import { METAL_OPTIONS, KARAT_OPTIONS } from '../../constants/order-options';

const METAL_SETTING_OPTIONS = KARAT_OPTIONS.flatMap((karat) => METAL_OPTIONS.map((metal) => `${karat} ${metal}`));

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

const DEFAULT_SPECS = {
  category: 'Ring',
  metal: '18 KT White Gold',
  karat: '18 KT',
  gems: 'Diamond (Solitaire)',
  size: '6.5',
  weight: '3.2g',
  notes: 'Round cut diamond with a pave band.',
};

const RENDER_IMAGES: Record<string, string> = {
  Ring: '/ai-ring.png',
  Pendant: '/ai-pendant.png',
  Earrings: '/ai-earrings.png',
  Bracelet: '/ai-bracelet.png',
  Necklace: '/ai-pendant.png',
  Bangles: '/ai-bracelet.png',
};

const RENDERING_STEPS = [
  'Initializing generative diffusion model...',
  'Analyzing geometry & symmetry constants...',
  'Calculating 18K metal shader reflections...',
  'Simulating diamond ray-tracing refractions...',
  'Refining soft studio lighting shadows...',
  'Polishing high-fidelity 4K render...',
];

export function AiStudioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createThreadForOrder } = useChatNotification();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [specs, setSpecs] = useState(DEFAULT_SPECS);
  const [renderImage, setRenderImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStepText, setRenderStepText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const customerId = user?.id ?? user?.email ?? 'customer';
  const customerName = user?.name ?? 'Customer';

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: 'ai',
        text: `Hello ${customerName}! I'm Aura, your AI Jewellery Co-Creator. Together, we can design the perfect jewelry piece. What style of jewellery are you looking to design today? (e.g. Ring, Pendant, Bracelet)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [customerName]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle Chat Input
  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      processAiResponse(userMsg.text);
    }, 1500);
  };

  // Rule-based keyword matching to auto-update specs & reply intelligently
  const processAiResponse = (text: string) => {
    const lower = text.toLowerCase();
    let reply = '';
    let updatedSpecs = { ...specs };

    if (lower.includes('ring') || lower.includes('solitaire')) {
      updatedSpecs.category = 'Ring';
      updatedSpecs.metal = '18 KT White Gold';
      updatedSpecs.gems = 'Diamond (Solitaire)';
      updatedSpecs.notes = 'Elegant ring with solitaire central gem.';
      reply = "A custom ring is a beautiful choice! I have adjusted the category to 'Ring'. Would you prefer White Gold, Yellow Gold, or Rose Gold for the metal setting?";
    } else if (lower.includes('pendant') || lower.includes('emerald')) {
      updatedSpecs.category = 'Pendant';
      updatedSpecs.metal = '18 KT Yellow Gold';
      updatedSpecs.gems = 'Emerald';
      updatedSpecs.notes = 'Intricate pendant with surrounded emerald cut.';
      reply = "An emerald pendant is incredibly timeless! I've updated the settings to a 'Pendant' in 18 KT Yellow Gold. Would you like a halo of small diamonds surrounding the emerald?";
    } else if (lower.includes('earring') || lower.includes('halo')) {
      updatedSpecs.category = 'Earrings';
      updatedSpecs.metal = '14 KT White Gold';
      updatedSpecs.gems = 'Diamond (Halo)';
      updatedSpecs.notes = 'Round cut diamond earrings with halo.';
      reply = "Brilliant halo earrings! I have modified the selection to 'Earrings'. Do you prefer 9 KT, 14 KT, or 18 KT settings?";
    } else if (lower.includes('bracelet') || lower.includes('sapphire')) {
      updatedSpecs.category = 'Bracelet';
      updatedSpecs.metal = '18 KT White Gold';
      updatedSpecs.gems = 'Sapphire & Diamond';
      updatedSpecs.notes = '18 KT White Gold bracelet encrusted with diamonds and sapphires.';
      reply = "A sapphire tennis bracelet is a majestic choice. I've adjusted the configurator. What length or wrist size should we target?";
    } else if (lower.includes('gold')) {
      if (lower.includes('yellow')) {
        updatedSpecs.metal = '18 KT Yellow Gold';
      } else if (lower.includes('rose')) {
        updatedSpecs.metal = '18 KT Rose Gold';
      } else {
        updatedSpecs.metal = '18 KT White Gold';
      }
      reply = `Got it! Selecting ${updatedSpecs.metal} setting. We should now look at the gemstones. Would you prefer diamonds, emeralds, rubies, or sapphires?`;
    } else if (lower.includes('diamond') || lower.includes('ruby') || lower.includes('emerald') || lower.includes('sapphire')) {
      if (lower.includes('diamond')) {
        updatedSpecs.gems = 'Diamond';
      } else if (lower.includes('ruby')) {
        updatedSpecs.gems = 'Ruby';
      } else if (lower.includes('emerald')) {
        updatedSpecs.gems = 'Emerald';
      } else if (lower.includes('sapphire')) {
        updatedSpecs.gems = 'Sapphire';
      }
      reply = `Perfect. Setting the primary gemstone to ${updatedSpecs.gems}. You can adjust size and weight in the control panel to the right, or we can go ahead and render the design! Click the 'Generate AI Design Render' button when you're ready.`;
    } else {
      reply = "I've recorded that detail in our specifications. Feel free to refine any configuration elements manually on the right, or tell me more about your engraving, details, or size preferences!";
      if (lower.length > 5 && lower.length < 150) {
        updatedSpecs.notes = text;
      }
    }

    setSpecs(updatedSpecs);
    setIsTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Run Simulated Render
  const triggerSimulatedRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStepText(RENDERING_STEPS[0]);

    const interval = setInterval(() => {
      setRenderProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setRenderImage(RENDER_IMAGES[specs.category] ?? '/ai-ring.png');
          setIsRendering(false);
          return 100;
        }
        // Change text step based on progress
        const stepIdx = Math.floor((next / 100) * RENDERING_STEPS.length);
        setRenderStepText(RENDERING_STEPS[stepIdx] || RENDERING_STEPS[RENDERING_STEPS.length - 1]);
        return next;
      });
    }, 150);
  };

  // Place Custom Order
  const handlePlaceOrder = () => {
    const customImage = RENDER_IMAGES[specs.category] || '/ai-ring.png';

    const orderDetails: OrderDetails = {
      name: `AI Co-Created ${specs.category}`,
      category: specs.category,
      metal: specs.metal,
      karat: specs.karat,
      budget: 'Est. $1,800 - $3,500',
      size: specs.size,
      weight: specs.weight,
      notes: `${specs.notes} | AI-Rendered Image Seed: ${specs.category}.`,
      deliveryDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 3 weeks
      image: customImage,
      imageName: `AI_${specs.category}_Render.png`,
      attachments: [{
        dataUrl: customImage,
        name: `AI_${specs.category}_Render.png`,
        type: 'image/png',
        size: 450000,
      }],
      images: [{
        id: Date.now(),
        name: `AI_${specs.category}_Render.png`,
        url: customImage,
        size: 450000,
        type: 'image/png'
      }]
    };

    createThreadForOrder(customerId, customerName, orderDetails);
    setIsSuccess(true);

    // Redirect user to My Products page after success popup
    setTimeout(() => {
      navigate('/dashboard/customer/my-products');
    }, 2500);
  };

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <PageTitle title="AI Design Studio" subtitle="Co-create custom jewelry designs interactively with our AI agent." />
        <button
          onClick={() => {
            setSpecs(DEFAULT_SPECS);
            setRenderImage(null);
            setMessages([
              {
                id: Date.now(),
                sender: 'ai',
                text: `Welcome back! Let's start fresh. What style of jewellery are you looking to design?`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
        >
          <RotateCcw size={12} /> Reset Canvas
        </button>
      </div>

      {/* Success banner */}
      {isSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-sm">Design Submitted Successfully!</p>
            <p className="text-xs text-emerald-600">Your AI co-created design has been converted to a custom order request. Redirecting you to your products...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Chat with Aura */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '560px' }}>
          <div className="bg-gradient-to-r from-slate-900 via-emerald-955 to-slate-955 px-5 py-4 text-white flex items-center gap-3 relative">
            <div className="absolute right-4 top-4 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="absolute right-4 top-4 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden">
              <Sparkles size={20} className="text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-55 tracking-wide">Aura</p>
              <p className="text-[10px] text-emerald-300 font-medium">AI Jewellery Co-Creator</p>
            </div>
          </div>

          {/* Chat message space */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 max-h-[380px]">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={12} className="text-emerald-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${isUser ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Sparkles size={12} className="text-emerald-600 animate-spin" />
                </div>
                <div className="bg-slate-50 px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick choices */}
          <div className="px-5 py-2 flex flex-wrap gap-2 border-t border-slate-50 bg-slate-50/50">
            {['Engagement Ring', 'Gold Emerald Pendant', 'Diamond Earrings'].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setInput(`Generate design specs for a ${opt}`);
                }}
                className="text-[10px] font-semibold bg-white border border-slate-150 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 px-2.5 py-1 rounded-xl transition-all cursor-pointer hover:shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Input block */}
          <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-2.5 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tell Aura how to refine your design..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <button
              onClick={handleSendMessage}
              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors active:scale-95 flex-shrink-0"
            >
              <Send size={12} />
            </button>
          </div>
        </div>

        {/* Right Column: Configurator & Render View */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Top Panel: Configurator specs */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Wand2 size={16} className="text-emerald-600" />
              <h2 className="font-bold text-slate-800 text-sm tracking-wide">Design Configuration</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Category</label>
                <select
                  value={specs.category}
                  onChange={(e) => setSpecs({ ...specs, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 transition-all font-semibold"
                >
                  {['Ring', 'Pendant', 'Earrings', 'Bracelet', 'Necklace', 'Bangles'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Metal Setting</label>
                <select
                  value={specs.metal}
                  onChange={(e) => setSpecs({ ...specs, metal: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 transition-all font-semibold"
                >
                  {METAL_SETTING_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Karat</label>
                <select
                  value={specs.karat}
                  onChange={(e) => setSpecs({ ...specs, karat: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 transition-all font-semibold"
                >
                  {KARAT_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Gemstones</label>
                <input
                  value={specs.gems}
                  onChange={(e) => setSpecs({ ...specs, gems: e.target.value })}
                  placeholder="e.g. Solitaire Diamond"
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Ring / Wrist Size</label>
                <input
                  value={specs.size}
                  onChange={(e) => setSpecs({ ...specs, size: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Estimated Weight</label>
                <input
                  value={specs.weight}
                  onChange={(e) => setSpecs({ ...specs, weight: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Engraving / Custom Notes</label>
              <textarea
                value={specs.notes}
                onChange={(e) => setSpecs({ ...specs, notes: e.target.value })}
                rows={2}
                className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-slate-800 text-xs outline-none focus:border-emerald-400 transition-all resize-none leading-normal"
                placeholder="Describe specific modifications or engravings..."
              />
            </div>

            <button
              onClick={triggerSimulatedRender}
              disabled={isRendering || isSuccess}
              className={`w-full py-2.5 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all ${
                isSuccess
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
              }`}
            >
              <Sparkles size={14} className={isRendering ? 'animate-spin' : ''} />
              {isRendering ? 'Generating AI Render...' : 'Generate AI Design Render'}
            </button>
          </div>

          {/* Bottom Panel: Render Output */}
          <div className="bg-slate-900 rounded-3xl p-5 text-white flex flex-col justify-center relative overflow-hidden" style={{ minHeight: '260px' }}>
            {/* Shimmer grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            {/* Rendering Progress */}
            {isRendering && (
              <div className="relative z-10 flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/25 border-t-emerald-500 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-400 animate-pulse">{renderStepText}</p>
                  <p className="text-[10px] text-slate-400">Raytracing Render Engine v2.0</p>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${renderProgress}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-300">{renderProgress}%</span>
              </div>
            )}

            {/* Normal State: Show Rendered Image */}
            {!isRendering && renderImage && (
              <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-full rounded-2xl overflow-hidden border border-emerald-500/20 bg-white/5 backdrop-blur-md flex items-center justify-center p-2 relative group max-h-[180px]">
                  <img
                    src={renderImage}
                    alt="AI Design Render"
                    className="max-h-[160px] object-contain rounded-xl select-none"
                  />
                  <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[8px] font-bold text-emerald-400 border border-emerald-500/20 tracking-wider uppercase">
                    Raytraced Render
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSuccess}
                  className="w-full py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <Hammer size={13} />
                  Submit Request for Custom Order
                </button>
              </div>
            )}

            {/* Empty State: No rendering done yet */}
            {!isRendering && !renderImage && (
              <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <ShoppingBag size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-200">No Render Active</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">Customize specifications or talk with Aura, then click render to visualize your jewelry piece.</p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </PageContainer>
  );
}
