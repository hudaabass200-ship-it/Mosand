import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Presentation, 
  Sparkles, 
  Layout as LayoutIcon, 
  BookOpen, 
  CheckCircle2, 
  Cpu, 
  ArrowRight,
  ClipboardCheck,
  Palette,
  Type,
  ChevronRight,
  ImageIcon,
  UploadCloud,
  Clock, // Added Clock
  Trash2 // Added Trash2
} from 'lucide-react';
import { rephraseToAcademic, getDesignSuggestions, analyzeSlide } from './services/geminiService';

// --- Types ---
type AppMode = 'home' | 'writer' | 'pptdesign' | 'slidereview' | 'structure' | 'history';

// --- Navigation ---
export interface HistoryItem {
  id: string;
  date: number;
  tool: string;
  title: string;
  inputPayload: any;
  outputResult: string;
}

export function saveToHistory(item: Omit<HistoryItem, 'id' | 'date'>) {
  try {
    const saved = localStorage.getItem('gradmaster_history');
    let history: HistoryItem[] = saved ? JSON.parse(saved) : [];
    history.unshift({
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      date: Date.now(),
    });
    // Keep last 50 items
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem('gradmaster_history', JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save to history', e);
  }
}

const NAV_ITEMS = [
  { id: 'writer', label: 'الصياغة الأكاديمية', icon: Sparkles },
  { id: 'pptdesign', label: 'تصميم العروض', icon: Presentation },
  { id: 'slidereview', label: 'مُقيّم الشرائح', icon: ImageIcon },
  { id: 'structure', label: 'دليل الهيكلة', icon: FileText },
];

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');

  return (
    <div className="min-h-screen bg-[#F7F5F2] selection:bg-[#8B7E66]/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => setMode('home')}
            className="flex items-center gap-3 group transition-all"
          >
            <div className="w-8 h-8 bg-[#8B7E66] rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-stone-800 transition-colors">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-stone-900 font-serif">GradMaster <span className="text-stone-400 font-sans font-normal">| AI Assistant</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setMode(item.id as AppMode)}
                className={`text-sm font-medium transition-colors ${
                  mode === item.id ? 'text-accent' : 'text-secondary hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMode('history')}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${mode === 'history' ? 'bg-[#8B7E66]/10 text-[#8B7E66]' : 'text-stone-500 hover:bg-stone-100'}`}
              title="سجل المحفوظات"
            >
              <Clock className="w-5 h-5" />
            </button>
            <button className="bg-stone-800 text-stone-50 px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-700 transition-colors shadow-sm italic font-serif hidden sm:block">
              ابدأ الآن
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {mode === 'home' && <Home onSetMode={setMode} />}
          {mode === 'writer' && <AcademicWriter />}
          {mode === 'pptdesign' && <PresentationDesign />}
          {mode === 'slidereview' && <SlideReview />}
          {mode === 'structure' && <StructureGuide />}
          {mode === 'history' && <HistoryView />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-12 bg-[#EFEBE6] mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-secondary text-sm">
            تم التطوير لمساعدتكم في رحلة التخرج - GradMaster AI 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Home Component ---
export async function copyToClipboard(text: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API not available');
  } catch (err) {
    // Fallback for iframe environments
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      // Make it invisible
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackErr) {
      console.error('Fallback: Oops, unable to copy', fallbackErr);
      return false;
    }
  }
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("عذراً، تعذر نسخ النص. الرجاء التحديد والنسخ يدوياً.");
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={className || `absolute top-4 left-4 px-3 py-2 bg-white border ${copied ? 'border-green-200 text-green-600' : 'border-stone-200 text-stone-500'} rounded-lg shadow-sm hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm font-medium z-10`}
      title="نسخ النص"
    >
      <ClipboardCheck className="w-4 h-4" /> {copied ? 'تم!' : 'نسخ'}
    </button>
  );
}

function Home({ onSetMode }: { onSetMode: (m: AppMode) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-16"
    >
      <section className="text-center py-20 space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B7E66]/10 text-[#8B7E66] text-xs font-bold uppercase tracking-wider"
        >
          <Sparkles className="w-4 h-4" /> مساعدك الأكاديمي الذكي
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary max-w-4xl mx-auto leading-tight">
          حول مشروع تخرجك إلى تحفة <span className="text-accent italic">أكاديمية</span>
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
          نساعدك من الصفر في هيكلة مشروعك، صياغة تقاريرك باحترافية، وتصميم العروض التقديمية بمعايير عالمية.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button 
            onClick={() => onSetMode('writer')}
            className="px-6 py-3 bg-[#8B7E66] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            حسن صياغتك الآن <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onSetMode('pptdesign')}
            className="px-8 py-4 border border-stone-200 bg-white text-stone-800 rounded-full font-bold hover:bg-stone-50 transition-colors text-sm shadow-sm"
          >
            اكتشف أسرار التصميم
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        {[
          {
            title: "الصياغة الاحترافية",
            desc: "أرسل مسودتك البسيطة واحصل على صياغة علمية رصينة تليق بتقرير تخرجك.",
            icon: Sparkles,
            action: () => onSetMode('writer')
          },
          {
            title: "تصميم الـ PowerPoint",
            desc: "دليل شامل لاختيار الألوان والخطوط وتوزيع العناصر كالمحترفين.",
            icon: Presentation,
            action: () => onSetMode('pptdesign')
          },
          {
            title: "تقييم الشرائح بالذكاء الاصطناعي",
            desc: "ارفع صورة شريحتك وسيقوم النظام بتقييم التصميم والمحتوى واقتراح التحسينات.",
            icon: ImageIcon,
            action: () => onSetMode('slidereview')
          },
          {
            title: "هيكلة المشروع",
            desc: "خريطة طريق واضحة لبناء فصول مشروع التخرج وتقارير التدريب.",
            icon: FileText,
            action: () => onSetMode('structure')
          }
        ].map((feat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            onClick={feat.action}
            className="academic-card p-8 cursor-pointer group hover:bg-stone-50"
          >
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#8B7E66] group-hover:text-white transition-colors">
              <feat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
            <p className="text-secondary text-sm leading-relaxed mb-6">{feat.desc}</p>
            <div className="flex items-center text-accent text-sm font-bold group-hover:translate-x-2 transition-transform">
              تعرف على المزيد <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </motion.div>
        ))}
      </section>
    </motion.div>
  );
}

// --- Academic Writer Component ---
function AcademicWriter() {
  const [input, setInput] = useState('');
  const [focus, setFocus] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const result = await rephraseToAcademic(input, language, focus);
    setOutput(result);
    saveToHistory({
      tool: 'المصيغ الأكاديمي',
      title: 'صياغة أكاديمية',
      inputPayload: { input, focus, language: language === 'ar' ? 'العربية' : 'الإنجليزية' },
      outputResult: result
    });
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">المصيغ الأكاديمي الذكي</h2>
          <p className="text-stone-500 mt-1">حول مسوداتك العادية إلى لغة علمية رصينة</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-stone-200 text-xs font-mono text-stone-500 uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> AI ENGINE: ACTIVE
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span> النص الأصلي (المسودة)
          </label>
          <div className="flex-1 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[24rem]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب هنا ما تريد صياغته بشكل احترافي..."
              className="flex-1 w-full resize-none focus:outline-none text-stone-700 leading-relaxed placeholder-stone-300 font-sans mb-4 min-h-[150px]"
            />
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="جزء معين للتركيز عليه أو تلخيصه (اختياري)"
              className="w-full px-4 py-3 mb-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7E66]/20 text-sm focus:border-[#8B7E66] transition-all text-stone-700"
            />
            <div className="pt-4 border-t border-stone-100 flex justify-between items-center mt-auto">
              <div className="flex bg-stone-100 rounded-full p-1 cursor-pointer">
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${language === 'ar' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  English
                </button>
              </div>
              <button 
                onClick={handleProcess}
                disabled={loading || !input}
                className="px-6 py-3 bg-[#8B7E66] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <>جاري المعالجة...</>
                ) : (
                  <>صغ النص بذكاء <Sparkles className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> النتيجة الأكاديمية المقترحة
          </label>
          <div className="w-full h-96 p-6 bg-white border border-stone-200 rounded-3xl shadow-sm relative overflow-hidden font-serif text-xl leading-relaxed text-stone-800 overflow-y-auto whitespace-pre-wrap relative group">
            {output ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {output}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm italic font-sans font-medium">
                ستظهر النتيجة الاحترافية هنا بعد معالجة النص
              </div>
            )}
            {output && (
              <CopyButton text={output} />
            )}
          </div>
          <div className="p-4 bg-stone-800/5 border border-stone-800/10 rounded-2xl flex gap-3">
            <div className="mt-1"><Sparkles className="w-4 h-4 text-[#8B7E66]" /></div>
            <p className="text-xs text-stone-600 leading-relaxed font-sans mt-0.5">
              <strong>نصيحة:</strong> يتم التركيز في الصياغة على استخدام الأسلوب "المبني للمجهول" في الأجزاء العملية، والكلمات الرابطة الدقيقة (مثل: علاوة على ذلك، في المقابل).
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PresentationDesign() {
  const [topic, setTopic] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const result = await getDesignSuggestions(topic);
    setSuggestions(result);
    saveToHistory({
      tool: 'تصميم العروض',
      title: 'اقتراحات تصميم العروض التقديمية',
      inputPayload: { topic },
      outputResult: result
    });
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      <div className="max-w-3xl">
        <h2 className="text-4xl font-serif font-bold mb-4">دليل المصمم المحترف للعروض التقديمية</h2>
        <p className="text-secondary text-lg">Presentation Designer Secrets</p>
      </div>

      {/* AI Design Assistant */}
      <section className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-[#8B7E66]" />
          <h3 className="text-xl font-bold">مصمم القوالب الذكي</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="أدخل عنوان مشروعك (مثلاً: نظام ري ذكي)..."
            className="flex-1 px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-stone-700 transition-all"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="px-8 py-4 bg-[#8B7E66] text-white rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? 'جاري التصميم...' : 'صمم لي قالباً'}
          </button>
        </div>
        {suggestions && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 relative p-8 bg-stone-50 rounded-2xl border border-stone-200 whitespace-pre-wrap text-sm leading-relaxed font-sans text-stone-700"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-stone-500 tracking-widest uppercase">AI Suggested Design System</span>
              <div className="flex items-center gap-2">
                <CopyButton text={suggestions} className="px-3 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-lg shadow-sm hover:bg-stone-50 transition-colors flex items-center gap-2 text-xs font-medium" />
                <button onClick={() => setSuggestions('')} className="text-xs text-stone-400 hover:text-stone-800 transition-colors">مسح</button>
              </div>
            </div>
            {suggestions}
          </motion.div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#8B7E66]/10 rounded-full flex items-center justify-center text-[#8B7E66]">
                <Type className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-stone-800">Typography ❘ الخطوط</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white border border-stone-200 rounded-xl border-r-4 border-r-[#8B7E66] shadow-sm">
                <p className="text-xs uppercase font-mono text-stone-400 mb-2 font-bold tracking-wider">Heading Font (Modern)</p>
                <h4 className="text-2xl font-serif text-stone-900">Almarai / Cairo</h4>
                <p className="text-sm text-stone-500 mt-1 italic">Bold, 36pt - 48pt</p>
              </div>
              <div className="p-4 bg-white border border-stone-200 rounded-xl border-r-4 border-r-stone-300 shadow-sm">
                <p className="text-xs uppercase font-mono text-stone-400 mb-2 font-bold tracking-wider">Body Font (Readable)</p>
                <p className="text-lg text-stone-800">Inter / Adobe Arabic</p>
                <p className="text-sm text-stone-500 mt-1 italic">Regular, 18pt - 24pt</p>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed p-2 border-r border-stone-200 mr-2 text-right">
                * تجنب استخدام أكثر من نوعين من الخطوط في عرضك. التزم بهوية بصرية موحدة للنصوص.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-stone-600">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-stone-800">Colours ❘ الألوان</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['#1C1917', '#8B7E66', '#EFEBE6', '#F7F5F2'].map((color) => (
                <div key={color} className="space-y-2">
                  <div className="h-16 rounded-xl w-full border border-stone-200 shadow-sm" style={{ backgroundColor: color }} />
                  <p className="text-[10px] font-mono text-center font-bold text-stone-500">{color}</p>
                </div>
              ))}
            </div>
            <p className="text-sm font-medium bg-stone-100 p-4 rounded-xl text-stone-600">
              💡 قاعدة 60-30-10: استخدم 60% لون خلفية هادئ، 30% لون ثانوي، و 10% للتنبيه والتركيز.
            </p>
          </section>
        </div>

        <div className="space-y-8 bg-[#EFEBE6] border border-stone-200 p-8 rounded-3xl text-stone-800">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <LayoutIcon className="w-5 h-5 text-[#8B7E66]" /> أفضل الممارسات في التصميم
          </h3>
          <ul className="space-y-6">
            {[
              {
                t: "مبدأ المساحة البيضاء",
                d: "لا تحشو الشريحة بالكثير من النصوص. اترك مساحة لعين المشاهد لترتاح."
              },
              {
                t: "شريحة واحدة = فكرة واحدة",
                d: "كل شريحة يجب أن تركز على رسالة واحدة واضحة وقوية."
              },
              {
                t: "تسلسل هرمي بصري",
                d: "اجعل أهم معلومة هي الأكبر حجماً أو الأبرز لوناً."
              },
              {
                t: "استخدم الصور بجودة عالية",
                d: "تجنب الصور المشوشة أو التي تحتوي على علامات مائية."
              }
            ].map((rule, i) => (
              <li key={i} className="flex gap-4 group">
                <div className="text-[#8B7E66] font-mono pt-1">0{i+1}</div>
                <div>
                  <h4 className="font-bold mb-1 group-hover:text-[#8B7E66] transition-colors">{rule.t}</h4>
                  <p className="text-sm text-stone-500 leading-relaxed">{rule.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// --- Slide Review Component ---
function SlideReview() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى رفع صورة (PNG, JPG، إلخ)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to prevent payload too large errors
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG to save space
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setMimeType('image/jpeg');
        setImagePreview(compressedBase64);
        setOutput('');
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReview = async () => {
    if (!imagePreview) return;
    setLoading(true);
    const result = await analyzeSlide(imagePreview, mimeType);
    setOutput(result);
    saveToHistory({
      tool: 'تقييم الشرائح',
      title: 'تحليل الشريحة بالذكاء الاصطناعي',
      inputPayload: { note: "تم تحليل صورة شريحة مرفقة." },
      outputResult: result
    });
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">مُقيّم الشرائح الذكي</h2>
          <p className="text-stone-500 mt-1">دع الذكاء الاصطناعي يحلل تصميمات عروضك التقديمية</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-stone-200 text-xs font-mono text-stone-500 uppercase tracking-widest hover:border-stone-300 transition-colors">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> VISION ENGINE: ACTIVE
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span> صورة الشريحة
          </label>
          
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            {imagePreview ? (
              <div className="w-full space-y-4 flex flex-col items-center">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200 shadow-inner group">
                  <img src={imagePreview} alt="Slide Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-white text-stone-800 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide">
                      تغيير الصورة
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleReview}
                  disabled={loading}
                  className="w-full py-3 bg-[#8B7E66] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {loading ? (
                    <>جاري التحليل...</>
                  ) : (
                    <>أعطني رأيك في الشريحة <Sparkles className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-stone-50 rounded-2xl border-2 border-dashed border-stone-300 transition-colors p-12">
                <div className="w-16 h-16 bg-[#8B7E66]/10 rounded-full flex items-center justify-center text-[#8B7E66]">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-stone-800 font-bold mb-1">انقر لرفع صورة الشريحة</p>
                  <p className="text-xs text-stone-500">يدعم JPG, PNG</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> تقرير التقييم
          </label>
          <div className="w-full bg-white border border-stone-200 rounded-3xl shadow-sm relative overflow-hidden font-sans text-sm leading-relaxed text-stone-700 min-h-[400px] flex flex-col">
             {output ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 overflow-y-auto whitespace-pre-wrap flex-1 relative">
                {output}
                <CopyButton text={output} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 gap-3">
                <ImageIcon className="w-10 h-10 opacity-20" />
                <p className="font-medium">بانتظار الصورة للبدء في التقييم...</p>
                <p className="text-xs max-w-xs text-stone-400 leading-relaxed">
                  سيقوم النظام بتحليل الألوان، دقة الخطوط، كمية النصوص، وتوزيع العناصر لاقتراح أفضل التحسينات لشريحتك.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Structure Guide Component ---
function StructureGuide() {
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    {
      title: "مشروع التخرج (Thesis)",
      steps: [
        "الغلاف (Cover Page)",
        "الملخص (Abstract)",
        "المقدمة (Introduction)",
        "الدراسات السابقة (Literature Review)",
        "المنهجية (Methodology)",
        "النتائج والمناقشة (Results & Discussion)",
        "الخاتمة والتوصيات (Conclusion)",
        "المصادر (References)"
      ]
    },
    {
      title: "تقرير التدريب (Internship Report)",
      steps: [
        "معلومات الجهة المستضيفة",
        "الأهداف المخطط لها",
        "المهام اليومية المنجزة",
        "المهارات المكتسبة",
        "التحديات والحلول",
        "التقييم الذاتي"
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="border-r-4 border-[#8B7E66] pr-6 py-2 text-right">
        <h2 className="text-3xl font-serif font-bold text-stone-900">خريطة هيكلة المحتوى الأكاديمي</h2>
        <p className="text-stone-500 mt-1 uppercase tracking-widest text-xs font-mono">Roadmap for Academic Excellence</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className={`academic-card overflow-hidden transition-all duration-300 ${activeChecklistId === idx ? 'ring-2 ring-[#8B7E66] shadow-md' : ''}`}>
            <div className="p-6 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2 text-stone-800">
                <FileText className="w-5 h-5 text-[#8B7E66]" /> {section.title}
              </h3>
              {activeChecklistId === idx && (
                <span className="text-xs font-mono text-stone-500 bg-stone-200 px-2 py-1 rounded-full">
                  {Object.values(checkedItems).filter(v => v).length}/{section.steps.length}
                </span>
              )}
            </div>
            <div className="p-8 space-y-4">
              {section.steps.map((step, sIdx) => {
                const stepId = `${idx}-${sIdx}`;
                const isChecked = checkedItems[stepId];
                const isActive = activeChecklistId === idx;
                
                return (
                  <div 
                    key={sIdx} 
                    className={`flex items-center gap-4 group ${isActive ? 'cursor-pointer hover:bg-stone-50 p-2 -mx-2 rounded-lg' : ''} transition-all`}
                    onClick={() => isActive && toggleCheck(stepId)}
                  >
                    {isActive ? (
                      <div className={`w-6 h-6 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-[#8B7E66] border-[#8B7E66]' : 'border-stone-300 group-hover:border-[#8B7E66]'}`}>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    ) : (
                      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 group-hover:bg-[#8B7E66] group-hover:text-white group-hover:border-[#8B7E66] transition-all">
                        {sIdx + 1}
                      </div>
                    )}
                    <span className={`${isChecked ? 'text-stone-400 line-through' : 'text-stone-600 group-hover:text-stone-900'} font-medium transition-colors`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-8 pb-8">
              {activeChecklistId === idx ? (
                <button 
                  onClick={() => setActiveChecklistId(null)}
                  className="w-full py-3 bg-[#8B7E66] text-white rounded-full text-xs font-bold hover:opacity-90 transition-colors uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> إغلاق القائمة التفاعلية
                </button>
              ) : (
                <button 
                  onClick={() => setActiveChecklistId(idx)}
                  className="w-full py-3 bg-stone-100 text-stone-600 rounded-full text-xs font-bold hover:bg-stone-200 transition-colors uppercase tracking-widest shadow-sm"
                >
                  View Detailed Checklist
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- History View Component ---
function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('gradmaster_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const clearHistory = () => {
    if (window.confirm("هل أنت متأكد من مسح السجل بالكامل؟")) {
      localStorage.removeItem('gradmaster_history');
      setHistory([]);
    }
  };

  const deleteItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem('gradmaster_history', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">سجل المحفوظات</h2>
          <p className="text-stone-500 mt-1">النتائج والمتطلبات السابقة التي قمت بمعالجتها</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> مسح السجل
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Clock className="w-12 h-12 text-stone-300 mb-4" />
          <p className="text-stone-500 font-medium text-lg">السجل فارغ</p>
          <p className="text-stone-400 text-sm mt-2 max-w-sm">سيتم حفظ جميع العمليات التي تقوم بها هنا لتمكينك من الرجوع إليها لاحقاً.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((item) => (
            <div key={item.id} className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 bg-[#8B7E66]/10 text-[#8B7E66] text-xs font-bold rounded-full uppercase tracking-wider">{item.tool}</span>
                    <span className="text-sm font-medium text-stone-900">{item.title}</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.date).toLocaleString('ar-SA')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <CopyButton text={item.outputResult} className="px-3 py-2 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-2 text-xs font-medium" />
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">المدخلات (المتطلبات)</span>
                  <div className="text-sm text-stone-600 bg-stone-50 p-4 rounded-xl font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {item.inputPayload?.input && <p className="mb-2"><strong>النص:</strong> {item.inputPayload.input}</p>}
                    {item.inputPayload?.focus && <p className="mb-2"><strong>التركيز:</strong> {item.inputPayload.focus}</p>}
                    {item.inputPayload?.topic && <p className="mb-2"><strong>الموضوع:</strong> {item.inputPayload.topic}</p>}
                    {item.inputPayload?.note && <p className="mb-2"><strong>ملاحظة:</strong> {item.inputPayload.note}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">المخرجات (النتائج)</span>
                  <div className="text-sm text-stone-800 bg-[#EFEBE6]/30 p-4 rounded-xl border border-stone-100 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto w-full max-w-full">
                    {item.outputResult}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
