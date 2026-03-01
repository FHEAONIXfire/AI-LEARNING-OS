import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  getTutorResponse, 
  analyzeSubmission, 
  generatePersonalizedProfile,
  generateTutorSpeech,
  generateAdaptiveTest,
  solveTextbookQuestion,
  generateStudyPlan
} from './services/geminiService';
import { Onboarding } from './components/Onboarding';
import { Practice } from './components/Practice';
import { SettingsPanel } from './components/SettingsPanel';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Target, 
  Brain, 
  Calendar, 
  Grid, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Zap,
  ChevronRight,
  Sparkles,
  Flame,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Circle,
  GripVertical,
  PlusSquare,
  FileText,
  Edit3,
  Download,
  BarChart,
  Box,
  ClipboardCheck,
  Wand2,
  Lightbulb,
  RefreshCw,
  ArrowRight,
  Activity,
  History,
  Mic,
  Layers,
  Languages,
  Image as ImageIcon,
  Loader2,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Screen = 'dashboard' | 'practice' | 'tutor' | 'planner' | 'heatmap' | 'feedback' | 'reports' | 'settings';

// --- Components ---

const Sidebar = ({ active, onChange }: { active: Screen, onChange: (s: Screen) => void }) => {
  const { t } = useLanguage();
  const items: { id: Screen, icon: any, label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { id: 'practice', icon: Target, label: t('nav.practice') },
    { id: 'tutor', icon: Brain, label: t('nav.tutor') },
    { id: 'planner', icon: Calendar, label: t('nav.planner') },
    { id: 'heatmap', icon: Grid, label: t('nav.heatmap') },
    { id: 'feedback', icon: Zap, label: t('nav.analyser') },
    { id: 'reports', icon: BarChart3, label: t('nav.reports') },
  ];

  return (
    <aside className="fixed left-6 top-28 bottom-6 w-24 liquid-glass flex flex-col items-center py-10 gap-10 z-40 border border-white/10 shadow-2xl">
      <nav className="flex flex-col gap-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`p-4 rounded-3xl transition-all relative group border ${
              active === item.id 
                ? 'bg-blue-500/20 text-white border-blue-500/50 neon-glow-blue shadow-lg shadow-blue-500/20' 
                : 'text-white/30 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
            }`}
            title={item.label}
          >
            <item.icon size={28} />
            <div className="absolute left-full ml-6 px-4 py-2 liquid-glass text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/10">
              {item.label}
            </div>
          </button>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-8">
        <button 
          onClick={() => onChange('settings')}
          className={`p-4 rounded-3xl transition-all relative group border ${
            active === 'settings' 
              ? 'bg-blue-500/20 text-white border-blue-500/50 neon-glow-blue shadow-lg shadow-blue-500/20' 
              : 'text-white/30 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10'
          }`}
          title={t('nav.settings')}
        >
          <Settings size={28} />
          <div className="absolute left-full ml-6 px-4 py-2 liquid-glass text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/10">
            {t('nav.settings')}
          </div>
        </button>
      </div>
    </aside>
  );
};

const TopNav = ({ profile, user, onSignOut, onNavigate, onUpdateProfile }: { profile: any, user: any, onSignOut: () => void, onNavigate: (screen: string) => void, onUpdateProfile: (stats: any) => void }) => {
  const { t } = useLanguage();
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMode = profile?.level_name?.toLowerCase().includes('school') || profile?.level_name?.toLowerCase().includes('ssc') 
    ? 'school' 
    : profile?.level_name?.toLowerCase().includes('mu') || profile?.level_name?.toLowerCase().includes('university') || profile?.level_name?.toLowerCase().includes('engineering')
    ? 'university'
    : 'college';

  const modes = [
    { id: 'school', label: t('mode.school'), level: 'SSC / School Mode' },
    { id: 'university', label: t('mode.university'), level: 'Mumbai University Mode' },
    { id: 'college', label: t('mode.college'), level: 'HSC / College Mode' }
  ];

  const handleModeChange = (level: string) => {
    onUpdateProfile({ level_name: level });
    setShowModeMenu(false);
  };

  return (
    <header className="fixed top-6 left-6 right-6 z-50 liquid-glass px-8 py-4 border border-white/10 shadow-2xl">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-blue-500/20 rounded-2xl neon-glow-blue border border-blue-500/30">
            <Activity className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent glass-text-pop">
            {t('app.title')}
          </h1>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowModeMenu(!showModeMenu)}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl liquid-glass border border-white/10 hover:border-white/30 transition-all group shadow-xl"
            >
              <span className="text-xs font-black text-white uppercase tracking-widest">
                {currentMode === 'school' ? t('mode.school') : currentMode === 'university' ? t('mode.university') : t('mode.college')}
              </span>
              <ChevronRight size={16} className={`text-white/60 transition-transform duration-500 ${showModeMenu ? 'rotate-90' : 'rotate-0'}`} />
            </button>

            <AnimatePresence>
              {showModeMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
                  className="absolute right-0 mt-4 w-64 liquid-glass p-3 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[60] border border-white/10 backdrop-blur-3xl"
                >
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleModeChange(m.level)}
                      className={`w-full text-left px-5 py-4 rounded-2xl text-sm transition-all flex items-center justify-between group mb-1 last:mb-0 ${
                        currentMode === m.id 
                          ? 'bg-blue-500/20 text-white border border-blue-500/30 neon-glow-blue' 
                          : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="font-black uppercase tracking-widest text-[10px]">{m.label}</span>
                      {currentMode === m.id && <CheckCircle2 size={16} className="text-blue-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div 
            className="flex items-center gap-4 pl-8 border-l border-white/10 cursor-pointer hover:opacity-80 transition-all group"
            onClick={() => onNavigate('settings')}
          >
            <div className="text-right hidden md:block">
              <p className="text-base font-black text-white glass-text-pop tracking-tight">{profile?.full_name || 'Learner'}</p>
              <p className="text-[10px] font-black secondary-text uppercase tracking-widest mt-0.5">{profile?.level_name || 'Level 1'}</p>
            </div>
            <div className="relative">
              <div className="size-12 rounded-3xl border-2 border-white/20 overflow-hidden shadow-2xl group-hover:border-blue-400/50 transition-all transform group-hover:scale-105">
                <img 
                  src={profile?.avatar_url || `https://picsum.photos/seed/${user?.id}/100/100`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const Dashboard = ({ stats, tasks, onToggleTask, onNavigate }: { stats: any, tasks: any[], onToggleTask: (id: string) => void, onNavigate: (screen: string) => void, key?: string }) => {
  const { t } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, filter: 'blur(20px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -30, filter: 'blur(20px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-12 gap-8"
    >
      {/* Mastery Overview */}
      <div className="col-span-12 lg:col-span-8 liquid-glass p-10 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse"></div>
        <div className="flex-1 space-y-6 relative z-10">
          <h3 className="text-4xl font-black text-white glass-text-pop tracking-tight">{t('dashboard.mastery_overview')}</h3>
          <p className="secondary-text max-w-lg font-medium text-lg leading-relaxed">{t('dashboard.mastery_desc')}</p>
          <div className="flex gap-4 pt-4">
            <div className="px-6 py-3 rounded-3xl liquid-glass border border-white/10 shadow-xl">
              <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{t('dashboard.top_skill')}</span>
              <p className="text-base font-black text-white glass-text-pop mt-1">{stats?.topSkill || t('dashboard.pending_analysis')}</p>
            </div>
            <div className="px-6 py-3 rounded-3xl liquid-glass border border-white/10 shadow-xl">
              <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">{t('dashboard.goal')}</span>
              <p className="text-base font-black text-white glass-text-pop mt-1">{stats?.goal || t('dashboard.set_goal')}</p>
            </div>
          </div>
        </div>
        <div className="relative size-60 flex items-center justify-center">
          <svg className="size-full transform -rotate-90" viewBox="0 0 100 100">
            <circle className="text-white/5 stroke-current" cx="50" cy="50" fill="transparent" r="42" strokeWidth="10"></circle>
            <motion.circle 
              initial={{ strokeDashoffset: 263.9 }}
              animate={{ strokeDashoffset: 263.9 - (263.9 * (stats?.mastery || 0)) / 100 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              className="text-blue-500 stroke-current neon-glow-blue" 
              cx="50" cy="50" fill="transparent" r="42" strokeWidth="10" 
              strokeDasharray="263.9" strokeLinecap="round"
            ></motion.circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white glass-text-pop tracking-tighter">{stats?.mastery || 0}%</span>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{t('dashboard.mastery')}</span>
          </div>
        </div>
      </div>


      {/* Readiness & Confidence */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
        <div className="liquid-glass p-8 flex flex-col justify-between border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black flex items-center gap-3 text-white glass-text-pop uppercase tracking-widest text-xs">
              <Zap className="text-blue-400" size={20} /> {t('dashboard.exam_readiness')}
            </h4>
            <span className="text-3xl font-black text-blue-400 glass-text-pop">{stats?.readiness || 0}%</span>
          </div>
          <div className="space-y-4">
            <div className="h-8 w-full bg-white/5 rounded-full overflow-hidden flex p-1.5 border border-white/10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats?.readiness || 0}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full neon-glow-blue"
              ></motion.div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
              <span>{t('dashboard.critical')}</span>
              <span>{t('dashboard.stable')}</span>
              <span className="text-blue-400">{t('dashboard.optimized')}</span>
            </div>
          </div>
        </div>

        <div className="liquid-glass p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black flex items-center gap-3 text-white glass-text-pop uppercase tracking-widest text-xs">
              <BarChart3 className="text-purple-400" size={20} /> {t('dashboard.confidence_index')}
            </h4>
            <div className="text-right">
              <span className="text-3xl font-black text-white glass-text-pop">{stats?.confidence || 0}%</span>
              <span className="text-xs text-green-400 font-black block mt-1">+5.2%</span>
            </div>
          </div>
          <div className="h-24 flex items-end gap-2 px-1">
            {[30, 50, 40, 60, 80, 75, 100].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 bg-gradient-to-t from-purple-600/20 to-purple-400 rounded-t-xl relative group border-t border-x border-purple-500/30"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 liquid-glass text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 border border-white/10 shadow-2xl z-20">
                  {h}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Weakness Alert */}
      <div className="col-span-12 lg:col-span-8 liquid-glass p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h4 className="font-black flex items-center gap-3 text-white glass-text-pop uppercase tracking-widest text-xs">
              <AlertTriangle className="text-red-400" size={20} /> {t('dashboard.neural_weakness_alert')}
            </h4>
            <p className="text-[10px] font-black secondary-text uppercase tracking-widest mt-2">{t('dashboard.weakness_desc')}</p>
          </div>
          <button 
            onClick={() => onNavigate('heatmap')} 
            className="px-4 py-2 liquid-glass border border-blue-500/30 text-blue-400 text-[10px] font-black hover:bg-blue-500/10 transition-all uppercase tracking-widest rounded-xl neon-glow-blue"
          >
            {t('dashboard.run_diagnostic')}
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          {(stats?.weaknesses?.length > 0 ? stats.weaknesses : (stats?.subjects?.length > 0 ? stats.subjects : [])).map((topic: string) => (
            <div 
              key={topic} 
              onClick={() => onNavigate('heatmap')} 
              className="px-6 py-4 rounded-3xl liquid-glass border border-red-500/20 flex items-center gap-4 neon-glow-red group cursor-pointer hover:bg-red-500/10 transition-all transform hover:scale-105"
            >
              <div className="size-3 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)] animate-pulse"></div>
              <div>
                <p className="text-base font-black text-red-400 glass-text-pop">{topic}</p>
                <p className="text-[10px] font-black text-red-400/40 uppercase tracking-widest">{t('dashboard.critical_review')}</p>
              </div>
            </div>
          ))}
          {(!stats?.weaknesses?.length && !stats?.subjects?.length) && (
            <p className="text-sm font-bold secondary-text">{t('dashboard.no_weaknesses')}</p>
          )}
        </div>
      </div>

      {/* Daily Study Plan */}
      <div className="col-span-12 lg:col-span-4 liquid-glass p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h4 className="font-black flex items-center gap-3 text-white glass-text-pop uppercase tracking-widest text-xs">
            <Calendar className="text-blue-400" size={20} /> {t('dashboard.daily_study_plan')}
          </h4>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="space-y-4">
          {tasks.map((task, i) => (
            <div 
              key={task.id} 
              onClick={() => onToggleTask(task.id)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center gap-4 group ${
                task.is_done 
                  ? 'bg-green-500/10 border-green-500/30 opacity-60' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className={`size-6 rounded-lg border flex items-center justify-center transition-all ${
                task.is_done 
                  ? 'bg-green-500 border-green-400 text-white' 
                  : 'border-white/20 text-transparent group-hover:text-blue-400 group-hover:bg-blue-500/10'
              }`}>
                {task.is_done && <CheckCircle2 size={14} />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-black text-white group-hover:text-blue-400 transition-colors ${task.is_done ? 'line-through' : ''}`}>{task.title}</p>
                <p className="text-[10px] font-black secondary-text uppercase tracking-widest mt-1">{task.sub_text}</p>
              </div>
              {task.is_recommended && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t('dashboard.recommended_now')}</span>
                </div>
              )}
            </div>
          ))}
          <button 
            onClick={() => onNavigate('planner')}
            className="w-full py-4 liquid-glass border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/30 transition-all rounded-2xl mt-4"
          >
            {t('dashboard.view_full_schedule')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AITutor = ({ profile, user, onViewReport, onUpdateStats }: { profile?: any, user?: User | null, onViewReport: (reportId: string) => void, onUpdateStats: (newStats: any) => void, key?: string }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string, parts: { text: string }[] }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [practicedTopics, setPracticedTopics] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, number>>({});
  const [testFeedback, setTestFeedback] = useState<any>(null);
  const [showTextbookModal, setShowTextbookModal] = useState(false);
  const [textbookQuestion, setTextbookQuestion] = useState('');
  const [textbookImage, setTextbookImage] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load sessions on mount
  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('tutor_sessions') || '[]');
    setSessions(savedSessions);
    if (savedSessions.length > 0) {
      setActiveSessionId(savedSessions[0].id);
      setMessages(savedSessions[0].messages);
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('tutor_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: `New Session`,
      timestamp: new Date().toISOString(),
      messages: [
        { role: 'model', parts: [{ text: t('tutor.welcome_msg') }] }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setShowHistory(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        loadSession(updated[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const updateActiveSessionMessages = (newMessages: any[]) => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, messages: newMessages, title: newMessages.find((m: any) => m.role === 'user')?.parts[0]?.text?.substring(0, 30) || s.title } 
        : s
    ));
  };

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  useEffect(() => {
    const fetchPracticedTopics = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('practiced_topics')
          .select('topic')
          .eq('user_id', user.id);
        
        if (!error && data) {
          setPracticedTopics(data.map(d => d.topic));
        }
      } else {
        const practiced = JSON.parse(localStorage.getItem('practiced_topics') || '[]');
        setPracticedTopics(practiced);
      }
    };
    fetchPracticedTopics();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakText = async (text: string) => {
    try {
      const base64Audio = await generateTutorSpeech(text);
      if (base64Audio) {
        const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))], { type: 'audio/pcm' });
        // Note: We need to convert PCM to WAV for browser playback, reusing the logic from Practice.tsx or using a simpler way
        // For now, let's assume we can use the same pcmToWav logic if we had it here, or just use a helper
        const wavBlob = pcmToWavHelper(base64Audio, 24000);
        const url = URL.createObjectURL(wavBlob);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      }
    } catch (err) {
      console.error('Speech error:', err);
    }
  };

  const pcmToWavHelper = (base64Pcm: string, sampleRate: number) => {
    const binaryString = window.atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    const samples = new Int16Array(bytes.buffer);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const handleSend = async (customMsg?: string) => {
    const msgText = customMsg || input;
    if (!msgText.trim() || isThinking) return;

    const userMsg = { role: 'user', parts: [{ text: msgText }] };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    updateActiveSessionMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      const response = await getTutorResponse(msgText, messages);
      const modelMsg = { role: 'model', parts: [{ text: response || t('tutor.error_process') }] };
      const finalMessages = [...newMessages, modelMsg];
      setMessages(finalMessages);
      updateActiveSessionMessages(finalMessages);
      if (response) speakText(response);
    } catch (err) {
      console.error('Tutor error:', err);
      const errorMsg = { role: 'model', parts: [{ text: t('tutor.error_interrupt') }] };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const startTest = async () => {
    if (practicedTopics.length === 0) {
      alert(t('tutor.study_first'));
      return;
    }
    setIsThinking(true);
    try {
      const test = await generateAdaptiveTest(practicedTopics, profile?.level_name || 'General');
      setCurrentTest(test);
      setTestAnswers({});
      setTestFeedback(null);
    } catch (err) {
      console.error('Test generation error:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const submitTest = async () => {
    let correct = 0;
    currentTest.questions.forEach((q: any) => {
      if (testAnswers[q.id] === q.correct_option) correct++;
    });
    
    const reportId = Date.now().toString();
    const reportData = {
      id: reportId,
      user_id: user?.id || 'guest',
      test_title: currentTest.test_title,
      score: correct,
      total_questions: currentTest.questions.length,
      details: {
        questions: currentTest.questions,
        answers: testAnswers
      },
      created_at: new Date().toISOString()
    };

    // Save report
    if (user) {
      await supabase.from('test_reports').insert([reportData]);
    }
    const savedReports = JSON.parse(localStorage.getItem('test_reports') || '[]');
    localStorage.setItem('test_reports', JSON.stringify([reportData, ...savedReports]));

    setTestFeedback({
      message: `You got ${correct} out of ${currentTest.questions.length} correct!`,
      reportId: reportId
    });

    // Update global stats based on test performance
    const scorePercentage = Math.round((correct / currentTest.questions.length) * 100);
    const newStats: any = {
      mastery: Math.min(100, Math.max(profile?.mastery || 0, scorePercentage)),
      readiness: Math.min(100, (profile?.readiness || 0) + 5),
      confidence: Math.min(100, (profile?.confidence || 0) + (scorePercentage > 70 ? 10 : 2))
    };

    if (scorePercentage > 85) {
      newStats.topSkill = currentTest.test_title.replace('Adaptive Test: ', '');
      const currentStrengths = profile?.strengths || [];
      if (!currentStrengths.includes(newStats.topSkill)) {
        newStats.strengths = [...currentStrengths, newStats.topSkill].slice(-3);
      }
    }

    if (scorePercentage < 60) {
      const currentWeaknesses = profile?.weaknesses || [];
      const newWeakness = currentTest.test_title.replace('Adaptive Test: ', '');
      if (!currentWeaknesses.includes(newWeakness)) {
        newStats.weaknesses = [...currentWeaknesses, newWeakness].slice(-3); // Keep last 3
      }
    }

    onUpdateStats(newStats);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTextbookImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolveTextbook = async () => {
    if (!textbookQuestion && !textbookImage) return;
    setIsSolving(true);
    try {
      let base64;
      let mimeType;
      if (textbookImage) {
        const parts = textbookImage.split(',');
        mimeType = parts[0].split(':')[1].split(';')[0];
        base64 = parts[1];
      }
      const solution = await solveTextbookQuestion(textbookQuestion, base64, mimeType);
      const userMsg = { role: 'user', parts: [{ text: `[Textbook Question] ${textbookQuestion}` }] };
      const modelMsg = { role: 'model', parts: [{ text: solution || t('tutor.solve_error') }] };
      const newMessages = [...messages, userMsg, modelMsg];
      setMessages(newMessages);
      updateActiveSessionMessages(newMessages);
      setShowTextbookModal(false);
      setTextbookQuestion('');
      setTextbookImage(null);
      if (solution) speakText(t('tutor.solved_msg'));
    } catch (err) {
      console.error('Solve error:', err);
      const userMsg = { role: 'user', parts: [{ text: `[Textbook Question] ${textbookQuestion}` }] };
      const modelMsg = { role: 'model', parts: [{ text: t('tutor.solve_error_generic') }] };
      const newMessages = [...messages, userMsg, modelMsg];
      setMessages(newMessages);
      updateActiveSessionMessages(newMessages);
      setShowTextbookModal(false);
      setTextbookQuestion('');
      setTextbookImage(null);
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)] relative"
    >
      <audio ref={audioRef} hidden />
      
      {/* Left Panel: Adaptive Test & Practice Tracking */}
      <div className="col-span-12 lg:col-span-5 liquid-glass p-8 flex flex-col relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black flex items-center gap-3 glass-text-pop">
            <ClipboardCheck className="text-blue-400" size={24} /> {t('tutor.adaptive_test_center')}
          </h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
              {practicedTopics.length} {t('tutor.topics_studied')}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
          {!currentTest ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 p-10">
              <div className="size-24 rounded-3xl bg-blue-500/10 flex items-center justify-center neon-glow-blue border border-blue-500/20">
                <Brain className="text-blue-400" size={48} />
              </div>
              <div className="space-y-3">
                <h4 className="font-black text-2xl text-white glass-text-pop">{t('tutor.ready_challenge')}</h4>
                <p className="secondary-text text-sm font-medium">{t('tutor.generate_test_desc')}</p>
              </div>
              <button 
                onClick={startTest}
                disabled={isThinking || practicedTopics.length === 0}
                className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm neon-glow-blue hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {isThinking ? t('tutor.generating_test') : t('tutor.start_test')}
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-blue-400 uppercase tracking-widest text-xs">{currentTest.test_title}</h4>
                <button onClick={() => setCurrentTest(null)} className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors">{t('tutor.cancel')}</button>
              </div>
              
              {currentTest.questions?.map((q: any, idx: number) => (
                <div key={q.id} className="space-y-6 p-6 liquid-glass border-white/5 shadow-xl">
                  <p className="text-sm font-bold leading-relaxed"><span className="text-blue-400 mr-2 font-black">Q{idx + 1}.</span> {q.question}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <button
                        key={optIdx}
                        onClick={() => setTestAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                        className={`p-4 text-left text-xs rounded-2xl border transition-all font-bold flex items-center gap-4 group ${
                          testAnswers[q.id] === optIdx 
                            ? 'bg-blue-500/20 border-blue-500/50 text-white neon-glow-blue' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        <span className={`size-8 rounded-xl flex items-center justify-center text-[10px] font-black border transition-all ${
                          testAnswers[q.id] === optIdx 
                            ? 'bg-blue-500 text-white border-blue-400' 
                            : 'bg-white/5 text-white/20 border-white/10 group-hover:bg-white/10 group-hover:text-white'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {testFeedback ? (
                <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-3xl text-center space-y-6 shadow-2xl shadow-green-500/10">
                  <p className="text-2xl font-black text-green-400 glass-text-pop">{testFeedback.message}</p>
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => onViewReport(testFeedback.reportId)}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm neon-glow-blue flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                    >
                      <BarChart3 size={20} /> {t('tutor.view_report')}
                    </button>
                    <button onClick={startTest} className="text-[10px] font-black text-white/40 hover:text-blue-400 uppercase tracking-widest transition-colors">{t('tutor.try_another')}</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={submitTest}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-lg neon-glow-blue shadow-xl shadow-blue-500/20"
                >
                  {t('tutor.submit_test')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Interactive AI Tutor */}
      <div className="col-span-12 lg:col-span-7 liquid-glass p-8 flex flex-col border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] animate-scanline bg-gradient-to-b from-transparent via-blue-400 to-transparent h-20 w-full z-10"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-3xl bg-blue-500/20 flex items-center justify-center neon-glow-blue border border-blue-500/30">
              <Brain className="text-blue-400" size={28} />
            </div>
            <div>
              <p className="text-xl font-black text-white glass-text-pop">{t('tutor.interactive_tutor')}</p>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">{t('tutor.voice_text')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 liquid-glass border-white/10 text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              <History size={16} /> {t('tutor.history')}
            </button>
            <button 
              onClick={createNewSession}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/30 transition-all neon-glow-blue"
            >
              <PlusSquare size={16} /> {t('tutor.new_chat')}
            </button>
            <button 
              onClick={() => setShowTextbookModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/30 transition-all neon-glow-purple"
            >
              <ImageIcon size={16} /> {t('tutor.ask_textbook')}
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar relative z-20">
          {showHistory && (
            <motion.div 
              initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
              className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-black text-blue-400 uppercase tracking-widest text-xs glass-text-pop">{t('tutor.chat_history')}</h4>
                <button onClick={() => setShowHistory(false)} className="text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]">{t('tutor.close')}</button>
              </div>
              <div className="space-y-4">
                {sessions.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                      activeSessionId === session.id 
                        ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${activeSessionId === session.id ? 'text-white' : 'text-white/60'}`}>{session.title}</p>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">{new Date(session.timestamp).toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 text-blue-400 mb-1 ml-2">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('tutor.ai_response')}</span>
                </div>
              )}
              <div className={`inline-block p-6 rounded-3xl text-sm leading-relaxed max-w-[85%] font-medium shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-white rounded-tr-none shadow-blue-500/10' 
                  : 'liquid-glass border-white/10 text-white rounded-tl-none'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{msg.parts[0].text}</Markdown>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isThinking && (
            <div className="flex items-center gap-3 text-blue-400 ml-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{t('tutor.ai_thinking')}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex gap-4 relative z-20">
          <div className="relative flex-1">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-6 pr-16 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all resize-none max-h-32 font-medium"
              placeholder={t('tutor.ask_placeholder')}
              rows={1}
            />
            <button 
              onClick={() => handleSend()}
              disabled={isThinking || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-12 bg-blue-600 text-white rounded-2xl neon-glow-blue disabled:opacity-50 flex items-center justify-center hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
            >
              <Send size={20} />
            </button>
          </div>
          <button 
            onClick={toggleListening}
            className={`p-5 rounded-2xl transition-all relative border ${
              isListening 
                ? 'bg-red-500/20 text-red-400 border-red-500/50 neon-glow-red' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-blue-400 hover:border-blue-500/30'
            }`}
            title={isListening ? t('tutor.stop_listening') : t('tutor.voice_input')}
          >
            <Mic size={24} className={isListening ? 'animate-pulse' : ''} />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Textbook Question Modal */}
      <AnimatePresence>
        {showTextbookModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTextbookModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(20px)' }}
              className="relative w-full max-w-2xl liquid-glass rounded-[40px] p-12 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="size-16 rounded-3xl bg-purple-500/20 flex items-center justify-center neon-glow-purple border border-purple-500/30">
                    <FileText className="text-purple-400" size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white glass-text-pop">{t('tutor.ask_textbook_title')}</h3>
                    <p className="secondary-text text-sm font-medium">{t('tutor.ask_textbook_desc')}</p>
                  </div>
                </div>
                <button onClick={() => setShowTextbookModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white">
                  <Square className="rotate-45" size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('tutor.question_text')}</label>
                  <textarea 
                    value={textbookQuestion}
                    onChange={(e) => setTextbookQuestion(e.target.value)}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                    placeholder={t('tutor.question_placeholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('tutor.upload_label')}</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                      {textbookImage ? (
                        <img src={textbookImage} className="w-full h-full object-contain p-2" alt="Preview" />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="text-slate-500 mb-2" size={24} />
                          <p className="text-xs text-slate-500">{t('tutor.click_upload')}</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={handleSolveTextbook}
                      disabled={isSolving || (!textbookQuestion && !textbookImage)}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold neon-glow-purple hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSolving ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                      {t('tutor.solve_btn')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Heatmap = ({ profile }: { profile?: any, key?: string }) => {
  const { t } = useLanguage();
  const items = profile?.weaknesses?.length > 0 ? profile.weaknesses : (profile?.subjects?.length > 0 ? profile.subjects : ['Mathematics', 'Comp. Science', 'Linguistics']);
  
  // Generate deterministic but "true-to-profile" node data based on item name and profile stats
  const generateNodes = (item: string, baseMastery: number) => {
    const nodes = [];
    const seed = item.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Determine item-specific mastery bias
    const isStrength = profile?.strengths?.some((s: string) => s.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(s.toLowerCase()));
    const isWeakness = profile?.weaknesses?.some((w: string) => w.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(w.toLowerCase()));
    
    let itemMastery = baseMastery;
    if (isStrength) itemMastery += 15;
    if (isWeakness) itemMastery -= 15;
    
    itemMastery = Math.min(95, Math.max(15, itemMastery));

    const topics = ['Core Concepts', 'Advanced Applications', 'Theoretical Foundations', 'Practical Scenarios', 'Problem Solving', 'Analytical Thinking', 'Methodology', 'Case Studies'];

    for (let i = 0; i < 24; i++) {
      const pseudoRandom = Math.abs(Math.sin(seed + i));
      // Nodes fluctuate around the item-specific mastery
      const val = Math.min(100, Math.max(0, itemMastery + (pseudoRandom * 30 - 15)));
      
      const topicIndex = Math.floor(pseudoRandom * topics.length);
      const testName = `Test ${i + 1}: ${topics[topicIndex]}`;
      
      // Generate a date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - (24 - i));
      
      nodes.push({
        value: val,
        testName,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return nodes;
  };

  const globalMastery = profile?.mastery || 72.4;
  const confidenceAvg = profile?.confidence || 64.0;
  const criticalGaps = Math.floor((100 - globalMastery) / 2);

  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ subject: string, index: number, value: number, testName: string, date: string, x: number, y: number } | null>(null);

  const handleRecalibrate = () => {
    setIsRecalibrating(true);
    // Simulate a neural recalibration process
    setTimeout(() => {
      setIsRecalibrating(false);
      alert("Neural Analytics Recalibrated Successfully.");
    }, 2000);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    // In a real app, this would fetch historical data. 
    // For now, we'll show a simulated history view.
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 relative"
    >
      {isRecalibrating && (
        <div className="absolute inset-0 z-50 bg-[#0B0F1C]/80 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-blue-400 font-mono text-sm uppercase tracking-[0.3em] animate-pulse">{t('heatmap.recalibrating')}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Activity size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('heatmap.diagnostic_report')}</span>
          </div>
          <h2 className="text-5xl font-black tracking-tight mb-4">{t('heatmap.title')}</h2>
          <p className="text-slate-400 max-w-xl leading-relaxed">
            {t('heatmap.description')}
          </p>
        </div>

      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('heatmap.global_mastery'), val: `${globalMastery}%`, sub: '+2.1%', subColor: 'text-emerald-400', icon: TrendingUp },
          { label: t('heatmap.confidence_avg'), val: `${confidenceAvg}%`, sub: '-0.8%', subColor: 'text-red-400', icon: TrendingDown },
          { label: t('heatmap.critical_gaps'), val: `${criticalGaps} ${t('heatmap.nodes')}`, sub: t('heatmap.high_urgency'), subColor: 'text-slate-500', icon: AlertTriangle, border: 'border-l-4 border-l-red-500' },
          { label: t('heatmap.active_study_time'), val: '42h 12m', sub: 'Level 12', subColor: 'text-blue-400', icon: History },
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-6 rounded-2xl ${stat.border || ''}`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="text-2xl font-bold">{stat.val}</h4>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <stat.icon size={12} className={stat.subColor} />
                <span className={stat.subColor}>{stat.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Heatmap Card */}
      <div className="glass-card rounded-3xl p-8 border border-white/5">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-bold text-slate-400">{t('heatmap.strong')} (&gt;85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
              <span className="text-xs font-bold text-slate-400">{t('heatmap.moderate')} (50-85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              <span className="text-xs font-bold text-slate-400">{t('heatmap.weak')} (&lt;50%)</span>
            </div>
          </div>
          <p className="text-[10px] italic text-slate-500">{t('heatmap.hover_node')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {items.map((item: string, sIdx: number) => (
            <div key={sIdx} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sIdx % 3 === 0 ? <Box className="text-blue-400" size={18} /> : sIdx % 3 === 1 ? <Layers className="text-purple-400" size={18} /> : <Languages className="text-emerald-400" size={18} />}
                  <h4 className="font-black uppercase tracking-widest text-sm">{item}</h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold">{t('heatmap.nodes_count')}</span>
              </div>
              
              <div className="grid grid-cols-6 gap-3">
                {generateNodes(item, globalMastery).map((nodeData, nIdx) => {
                  const val = nodeData.value;
                  const color = val > 85 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : val > 50 ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
                  return (
                    <motion.div
                      key={nIdx}
                      whileHover={{ scale: 1.2, zIndex: 10 }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredNode({
                          subject: item,
                          index: nIdx,
                          value: Math.round(val),
                          testName: nodeData.testName,
                          date: nodeData.date,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10
                        });
                      }}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`aspect-square rounded-xl ${color} cursor-pointer transition-all duration-300 hover:brightness-125 relative`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('heatmap.auto_scan')}: <span className="text-blue-400">{t('heatmap.interval')}</span></p>
            <div className="flex gap-1">
              <div className="size-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="size-1.5 rounded-full bg-blue-500/60 animate-pulse delay-75"></div>
              <div className="size-1.5 rounded-full bg-blue-500/30 animate-pulse delay-150"></div>
            </div>
          </div>
          <div className="flex gap-6">
            <button 
              onClick={handleRecalibrate}
              className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest underline underline-offset-4"
            >
              Recalibrate Analytics
            </button>
            <button 
              onClick={handleViewHistory}
              className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest underline underline-offset-4"
            >
              View History Map
            </button>
          </div>
        </div>
      </div>

      {/* History Modal Simulation */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl glass-card rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">{t('heatmap.history_title')}</h3>
                <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                  <PlusSquare className="rotate-45" size={24} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="text-blue-400 mx-auto mb-2" size={32} />
                    <p className="text-sm text-slate-400">{t('heatmap.history_compiling')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t('heatmap.peak_mastery')}</p>
                    <p className="text-xl font-bold text-emerald-400">78.2%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{t('heatmap.lowest_point')}</p>
                    <p className="text-xl font-bold text-red-400">42.1%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              left: hoveredNode.x,
              top: hoveredNode.y,
              transform: 'translate(-50%, -100%)',
              zIndex: 100
            }}
            className="pointer-events-none bg-[#1A1F35] border border-white/10 shadow-2xl rounded-xl p-3 min-w-[180px]"
          >
            <div className="flex justify-between items-start mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hoveredNode.subject}</p>
              <p className="text-[10px] text-slate-500">{hoveredNode.date}</p>
            </div>
            <p className="text-sm font-bold text-white mb-2">{hoveredNode.testName}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Proficiency</span>
              <span className={`text-xs font-bold ${hoveredNode.value > 85 ? 'text-emerald-400' : hoveredNode.value > 50 ? 'text-orange-400' : 'text-red-400'}`}>
                {hoveredNode.value}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Planner = ({ profile }: { profile?: any, key?: string }) => {
  const { t } = useLanguage();
  const [viewDate, setViewDate] = useState(new Date());
  const [examDates, setExamDates] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('exam_dates');
    return saved ? JSON.parse(saved) : {};
  });
  const [timetable, setTimetable] = useState<any[]>(() => {
    const saved = localStorage.getItem('study_timetable');
    return saved ? JSON.parse(saved) : [];
  });
  const [dailyGoals, setDailyGoals] = useState<any[]>(() => {
    const saved = localStorage.getItem('daily_study_goals');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSubjectInput(examDates[dateKey] || '');
  };

  const saveExamDate = () => {
    if (selectedDate !== null) {
      const updated = { ...examDates, [selectedDate]: subjectInput };
      setExamDates(updated);
      localStorage.setItem('exam_dates', JSON.stringify(updated));
      setSelectedDate(null);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateStudyPlan(examDates, profile);
      setTimetable(plan.timetable || []);
      setDailyGoals(plan.daily_goals || []);
      localStorage.setItem('study_timetable', JSON.stringify(plan.timetable));
      localStorage.setItem('daily_study_goals', JSON.stringify(plan.daily_goals));
    } catch (err) {
      console.error("Plan generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReschedule = () => {
    setExamDates({});
    setTimetable([]);
    setDailyGoals([]);
    localStorage.removeItem('exam_dates');
    localStorage.removeItem('study_timetable');
    localStorage.removeItem('daily_study_goals');
    setShowRescheduleConfirm(false);
  };

  const getCurrentStudySlot = () => {
    const hour = currentTime.getHours();
    const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Normalize day name matching
    const todayPlan = timetable.find(d => {
      const dName = d.day.toLowerCase();
      const currentDName = dayName.toLowerCase();
      return dName === currentDName || dName.startsWith(currentDName.substring(0, 3));
    });
    
    if (!todayPlan || !todayPlan.slots || todayPlan.slots.length === 0) return null;
    
    // Map hour to slot index: 19 (7PM) -> 0, 20 (8PM) -> 1, 21 (9PM) -> 2
    if (hour === 19) return todayPlan.slots[0];
    if (hour === 20) return todayPlan.slots[1];
    if (hour === 21) return todayPlan.slots[2];
    
    return null;
  };

  const getTimeRemaining = () => {
    if (!currentSlot) return null;
    const now = currentTime;
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const diff = nextHour.getTime() - now.getTime();
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSlot = getCurrentStudySlot();
  const timeRemaining = getTimeRemaining();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-12 gap-8"
    >
      <div className="col-span-12 lg:col-span-8 space-y-8">
        <div className="liquid-glass overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">{t('planner.title')}</h3>
              <p className="text-xs text-slate-500">{t('planner.desc')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowRescheduleConfirm(true)}
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all mr-2"
              >
                {t('planner.reschedule_btn')}
              </button>
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-blue-400">
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <span className="font-bold text-sm min-w-[120px] text-center">{monthName} {year}</span>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-blue-400">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center text-xs font-bold uppercase text-slate-500 bg-[#0B0F1C]">{day}</div>
            ))}
            {/* Empty slots for start of month */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-[#0B0F1C]/50"></div>
            ))}
            {/* Days of the month */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const examSubject = examDates[dateKey];
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
              
              return (
                <div 
                  key={day} 
                  onClick={() => handleDateClick(dateKey)}
                  className={`h-24 p-2 bg-[#0B0F1C] relative group cursor-pointer hover:bg-blue-500/5 transition-all border border-transparent ${examSubject ? 'bg-red-500/10 border-red-500/30' : ''} ${isToday ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
                >
                  <span className={`text-sm font-bold ${examSubject ? 'text-red-400' : isToday ? 'text-blue-400' : 'text-slate-500'}`}>{day}</span>
                  {examSubject && (
                    <div className="mt-1">
                      <p className="text-[10px] font-bold text-red-400 truncate uppercase">{examSubject}</p>
                      <div className="h-1 w-full bg-red-500 mt-1 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {timetable.length > 0 && (
          <div className="liquid-glass p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar className="text-blue-400" size={20} />
              {t('planner.timetable_title')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Day</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">7 PM - 8 PM</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">8 PM - 9 PM</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">9 PM - 10 PM</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((dayPlan, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                      <td className="py-4 px-4 font-bold text-sm text-blue-400">{dayPlan.day}</td>
                      {dayPlan.slots.map((slot: any, sIdx: number) => (
                        <td key={sIdx} className="py-4 px-4">
                          <p className="text-sm font-medium">{slot.subject}</p>
                          <p className="text-[10px] text-slate-500">{slot.topic}</p>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="liquid-glass p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold">Goals to Complete For Today</h3>
          </div>
          <ul className="space-y-4">
            {dailyGoals.length > 0 ? dailyGoals.map((goal: any, i: number) => (
              <li key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/10">
                <div className={`mt-1 size-4 rounded border flex items-center justify-center ${goal.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                  {goal.is_done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${goal.is_done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{goal.title}</p>
                  <p className="text-[10px] text-slate-500">{goal.sub_text}</p>
                </div>
              </li>
            )) : (
              <p className="text-sm text-slate-500 italic">No goals generated yet. Set your exam dates and generate a plan!</p>
            )}
          </ul>
          <button 
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {timetable.length > 0 ? t('planner.update_plan_btn') : t('planner.generate_plan_btn')}
          </button>
        </div>

        <div className="liquid-glass p-6 border-l-4 border-l-blue-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calendar size={80} className="text-blue-500" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-blue-400" size={20} />
            <h3 className="text-lg font-bold">{t('planner.live_timer')}</h3>
          </div>
          
          <div className="text-center py-4">
            <p className="text-4xl font-mono font-bold text-white mb-2">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              {currentSlot ? t('planner.session_active') : t('planner.next_session')}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            {currentSlot ? (
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">{t('planner.currently_studying')}</p>
                    <p className="text-xl font-bold text-blue-400">{currentSlot.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-500">{t('planner.ends_in')}</p>
                    <p className="text-sm font-mono font-bold text-blue-400">{timeRemaining}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">{currentSlot.topic}</p>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentTime.getMinutes() / 60) * 100}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  ></motion.div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-slate-400">{t('planner.no_session')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('planner.timetable_desc')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Confirmation Modal */}
      <AnimatePresence>
        {showRescheduleConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRescheduleConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md glass-card rounded-2xl p-8 border border-white/10 shadow-2xl text-center"
            >
              <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('planner.reschedule_confirm_title')}</h3>
              <p className="text-sm text-slate-400 mb-8">
                {t('planner.reschedule_confirm_desc')}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRescheduleConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  {t('planner.reschedule_cancel_btn')}
                </button>
                <button 
                  onClick={handleReschedule}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
                >
                  {t('planner.reschedule_confirm_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exam Date Input Modal */}
      <AnimatePresence>
        {selectedDate !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">{t('planner.set_exam_title').replace('{date}', selectedDate ? new Date(selectedDate).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' }) : '')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t('planner.subject_label')}</label>
                  <input 
                    type="text" 
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder={t('planner.subject_placeholder')}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all"
                  >
                    {t('planner.reschedule_cancel_btn')}
                  </button>
                  <button 
                    onClick={saveExamDate}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                  >
                    {t('planner.save_exam_btn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Reports = ({ user }: { user?: User | null, key?: string }) => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from('test_reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setReports(data);
        }
      } else {
        const saved = JSON.parse(localStorage.getItem('test_reports') || '[]');
        setReports(saved);
      }
      setLoading(false);
    };
    fetchReports();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]"
    >
      {/* Reports List */}
      <div className="col-span-12 lg:col-span-4 liquid-glass p-6 flex flex-col overflow-hidden border border-white/5">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <History className="text-blue-400" size={20} /> {t('reports.history_title')}
        </h3>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">{t('reports.no_tests')}</p>
            </div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedReport?.id === report.id 
                    ? 'bg-blue-500/10 border-blue-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold truncate pr-2">{report.test_title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    (report.score / report.total_questions) >= 0.7 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {Math.round((report.score / report.total_questions) * 100)}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{new Date(report.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Detail */}
      <div className="col-span-12 lg:col-span-8 liquid-glass p-8 flex flex-col overflow-y-auto custom-scrollbar border border-blue-500/20 relative">
        {!selectedReport ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
              <BarChart3 className="text-slate-500" size={40} />
            </div>
            <div>
              <h4 className="text-xl font-bold">{t('reports.select_report')}</h4>
              <p className="text-slate-400 text-sm">{t('reports.select_report_desc')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-bold text-blue-400">{selectedReport.test_title}</h3>
                <p className="text-slate-500 text-sm">{new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('reports.final_score')}</p>
                <p className="text-4xl font-bold text-white">
                  {selectedReport.score}<span className="text-xl text-slate-500">/{selectedReport.total_questions}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{t('reports.accuracy')}</p>
                <p className="text-2xl font-bold text-emerald-400">{Math.round((selectedReport.score / selectedReport.total_questions) * 100)}%</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{t('reports.questions')}</p>
                <p className="text-2xl font-bold text-blue-400">{selectedReport.total_questions}</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{t('reports.status')}</p>
                <p className={`text-2xl font-bold ${(selectedReport.score / selectedReport.total_questions) >= 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                  {(selectedReport.score / selectedReport.total_questions) >= 0.5 ? t('reports.passed') : t('reports.failed')}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck className="text-blue-400" size={20} /> {t('reports.breakdown')}
              </h4>
              <div className="space-y-4">
                {selectedReport.details.questions.map((q: any, idx: number) => {
                  const userAnswer = selectedReport.details.answers[q.id];
                  const isCorrect = userAnswer === q.correct_option;
                  return (
                    <div key={q.id} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <p className="text-sm font-medium leading-relaxed">
                          <span className="text-slate-500 mr-2">Q{idx + 1}.</span> {q.question}
                        </p>
                        {isCorrect ? (
                          <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                        ) : (
                          <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div 
                            key={optIdx}
                            className={`p-3 rounded-lg text-xs border ${
                              optIdx === q.correct_option 
                                ? 'bg-green-500/20 border-green-500 text-green-400' 
                                : optIdx === userAnswer 
                                  ? 'bg-red-500/20 border-red-500 text-red-400' 
                                  : 'bg-white/5 border-white/10 text-slate-500'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      {!isCorrect && (
                        <div className="mt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                          <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">AI Explanation</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AIAnalyser = ({ profile, onUpdateStats }: { profile?: any, onUpdateStats: (newStats: any) => void, key?: string }) => {
  const { t } = useLanguage();
  const [content, setContent] = useState(``);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSubmission(content);
      setAnalysis(result);
      
      // Update global stats based on analysis
      const newStats: any = {
        mastery: result.accuracy,
        readiness: result.clarity,
        confidence: result.depth
      };

      if (result.accuracy > 85) {
        newStats.topSkill = "Analytical Writing";
        const currentStrengths = profile?.strengths || [];
        if (!currentStrengths.includes("Analytical Writing")) {
          newStats.strengths = [...currentStrengths, "Analytical Writing"].slice(-3);
        }
      }

      const lowScoreTopics = result.feedback?.filter((f: any) => f.level === 'Critical' || f.level === 'Needs Improvement').map((f: any) => f.title);
      if (lowScoreTopics?.length > 0) {
        const currentWeaknesses = profile?.weaknesses || [];
        const combined = [...new Set([...currentWeaknesses, ...lowScoreTopics])].slice(-3);
        newStats.weaknesses = combined;
      }

      onUpdateStats(newStats);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard API not available');
      }
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch (err: any) {
      console.warn('Clipboard access denied or unavailable:', err);
      // If it's a permission error or blocked by policy, we can't do much but inform the user
      if (err.name === 'NotAllowedError' || err.message?.includes('blocked')) {
        alert('Clipboard access is restricted by your browser in this environment. Please use Ctrl+V (or Cmd+V) to paste manually into the text area.');
      } else {
        alert('Could not access clipboard. Please paste manually.');
      }
    }
  };

  const handleClear = () => {
    setContent('');
    setAnalysis(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)]"
    >
      <div className="col-span-12 lg:col-span-5 liquid-glass p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-2">
            <FileText size={14} /> {t('analyser.input_source')}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePaste}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <ClipboardCheck size={12} /> {t('analyser.paste_btn')}
            </button>
            <button 
              onClick={handleClear}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-white/10 transition-all"
            >
              {t('analyser.clear_btn')}
            </button>
          </div>
        </div>
        <div className="relative flex-1 bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('analyser.placeholder')}
            className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-300 leading-relaxed text-lg font-light resize-none p-6"
          />
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !content.trim()}
          className="mt-6 w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          {t('analyser.run_btn')}
        </button>
      </div>

      <div className="col-span-12 lg:col-span-7 liquid-glass p-6 flex flex-col overflow-y-auto scrollbar-hide relative">
        {isAnalyzing && (
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
            <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-blue-400 font-mono text-xs uppercase tracking-widest">{t('analyser.analyzing')}</p>
          </div>
        )}
        
        {!analysis && !isAnalyzing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Activity className="text-slate-500" size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t('analyser.summary_title')}</h3>
            <p className="text-slate-400 max-w-xs">{t('analyser.summary_desc')}</p>
          </div>
        ) : analysis && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center neon-glow-emerald">
                  <BarChart className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{t('analyser.summary_title')}</h3>
                  <p className="text-xs text-slate-400">{t('analyser.processed_by')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('analyser.global_score')}</p>
                <p className="text-2xl font-bold text-emerald-400">{Math.round((analysis.accuracy + analysis.clarity + analysis.depth) / 3)}<span className="text-sm font-medium text-slate-500">/100</span></p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: t('analyser.concept_accuracy'), val: analysis.accuracy, color: 'bg-emerald-500' },
                { label: t('analyser.clarity'), val: analysis.clarity, color: 'bg-blue-500' },
                { label: t('analyser.depth'), val: analysis.depth, color: 'bg-orange-500' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{m.label}</p>
                    <p className="text-lg font-bold">{m.val}%</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.val}%` }}
                      className={`h-full ${m.color}`}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest border-l-4 border-blue-500 pl-3">{t('analyser.rubric_feedback')}</h4>
              {(analysis.feedback || []).map((item: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Brain size={18} className="text-blue-400" />
                      <span className="font-semibold text-sm">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 bg-white/5 rounded border border-white/10">{item.level}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Smart Suggestions</h4>
              <div className="grid grid-cols-1 gap-3">
                {(analysis.suggestions || []).map((s: any, i: number) => (
                  <div key={i} className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex gap-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg h-fit">
                      <Wand2 className="text-emerald-400" size={20} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold">{s.title}</h5>
                      <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-3 px-6 py-3 bg-slate-800 text-white rounded-xl shadow-2xl hover:bg-slate-700 transition-all border border-slate-700 disabled:opacity-50"
              >
                <RefreshCw size={18} className={isAnalyzing ? 'animate-spin' : ''} />
                <span className="font-bold tracking-tight">Regenerate Analysis</span>
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

/**
 * SQL SCHEMA FOR SUPABASE (Run this in Supabase SQL Editor):
 * 
 * -- Create profiles table
 * create table profiles (
 *   id uuid references auth.users on delete cascade primary key,
 *   full_name text,
 *   level_name text default 'Level 1 Novice',
 *   avatar_url text,
 *   streak int default 0,
 *   mastery int default 0,
 *   readiness int default 0,
 *   confidence int default 0,
 *   updated_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Create tasks table
 * create table tasks (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade not null,
 *   title text not null,
 *   sub_text text,
 *   is_done boolean default false,
 *   is_recommended boolean default false,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Create saved_lessons table
 * create table saved_lessons (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade not null,
 *   topic text not null,
 *   subject text,
 *   scenes jsonb not null,
 *   exam_tricks jsonb,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Create practiced_topics table
 * create table practiced_topics (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade not null,
 *   topic text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()),
 *   unique(user_id, topic)
 * );
 * 
 * -- Create test_reports table
 * create table test_reports (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users on delete cascade not null,
 *   test_title text not null,
 *   score int not null,
 *   total_questions int not null,
 *   details jsonb not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Enable RLS
 * alter table profiles enable row level security;
 * alter table tasks enable row level security;
 * alter table saved_lessons enable row level security;
 * alter table practiced_topics enable row level security;
 * alter table test_reports enable row level security;
 * 
 * -- Create policies
 * create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
 * create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
 * create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
 * create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
 * create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
 * create policy "Users can view own lessons" on saved_lessons for select using (auth.uid() = user_id);
 * create policy "Users can insert own lessons" on saved_lessons for insert with check (auth.uid() = user_id);
 * create policy "Users can view own practiced topics" on practiced_topics for select using (auth.uid() = user_id);
 * create policy "Users can insert own practiced topics" on practiced_topics for insert with check (auth.uid() = user_id);
 * create policy "Users can view own reports" on test_reports for select using (auth.uid() = user_id);
 * create policy "Users can insert own reports" on test_reports for insert with check (auth.uid() = user_id);
 */

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => {
    return localStorage.getItem('onboarding_complete') === 'true';
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    return {
      full_name: 'Guest Learner',
      level_name: 'Level 1 Novice',
      streak: 1,
      mastery: 0,
      readiness: 0,
      confidence: 0
    };
  });
  const [tasks, setTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('user_tasks');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [aiStatus, setAiStatus] = useState<'connected' | 'error' | 'checking' | 'quota_exceeded'>('checking');

  useEffect(() => {
    // Initialize theme
    const isLightMode = localStorage.getItem('theme') === 'light';
    if (isLightMode) {
      document.body.classList.add('light-mode');
    }

    // Check current session in background
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user);
      }
    });

    // Listen for auth changes in background
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user);
      } else {
        setUser(null);
      }
    });

    // Check Supabase connection
    const checkSupabase = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
          if (error.message.includes('FetchError')) setSupabaseStatus('error');
          else if (error.message.includes('does not exist')) {
            console.warn('Supabase table "profiles" does not exist. Please run the SQL schema.');
            setSupabaseStatus('connected'); // Table missing but connection is ok
          } else {
            setSupabaseStatus('error');
          }
        } else {
          setSupabaseStatus('connected');
        }
      } catch (e) {
        setSupabaseStatus('error');
      }
    };
    checkSupabase();

    // Check AI connection
    const checkAI = async () => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        setAiStatus('error');
        return;
      }
      try {
        // Simple verification call
        await getTutorResponse("ping", []);
        setAiStatus('connected');
      } catch (e: any) {
        console.error('AI Health Check Failed:', e);
        if (e?.message?.includes('429') || e?.status === 429 || e?.message?.includes('quota')) {
          setAiStatus('quota_exceeded');
        } else {
          setAiStatus('error');
        }
      }
    };
    checkAI();

    return () => subscription.unsubscribe();
  }, []);

  const checkAndUpdateStreak = async (currentProfile: any, userId: string) => {
    const today = new Date().toLocaleDateString('en-CA');
    let lastActiveDate = localStorage.getItem(`last_active_date_${userId}`);
    
    // Fallback to database updated_at if local storage is empty (e.g., switching devices)
    if (!lastActiveDate && currentProfile?.updated_at) {
      lastActiveDate = new Date(currentProfile.updated_at).toLocaleDateString('en-CA');
    }
    
    let newStreak = currentProfile?.streak || 0;
    let shouldUpdateProfile = false;

    if (lastActiveDate) {
      if (lastActiveDate !== today) {
        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
        shouldUpdateProfile = true;
      }
    } else {
      newStreak = Math.max(1, newStreak);
      shouldUpdateProfile = true;
    }

    if (shouldUpdateProfile) {
      localStorage.setItem(`last_active_date_${userId}`, today);
      if (currentProfile?.id) {
        // Update streak and updated_at in Supabase
        await supabase.from('profiles').update({ 
          streak: newStreak,
          updated_at: new Date().toISOString()
        }).eq('id', userId);
      }
      return newStreak;
    }
    return currentProfile?.streak || 0;
  };

  const fetchUserData = async (currentUser: User) => {
    setLoading(true);
    const userId = currentUser.id;
    try {
      // Fetch profile
      let { data: profileData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (pError && (pError.code === 'PGRST116' || pError.message.includes('not found'))) {
        // Profile doesn't exist, create it
        const newProfile = {
          id: userId,
          full_name: currentUser.email?.split('@')[0] || 'New Learner',
          level_name: 'Level 1 Novice',
          streak: 1,
          mastery: 10,
          readiness: 15,
          confidence: 20,
          updated_at: new Date().toISOString()
        };
        const { data: created, error: cError } = await supabase.from('profiles').insert(newProfile).select().single();
        if (!cError) {
          profileData = created;
        } else {
          console.error('Error creating profile:', cError);
          // Fallback to local state if DB insert fails (e.g. RLS issue)
          profileData = newProfile;
        }
      }

      // --- Streak Logic ---
      const updatedStreak = await checkAndUpdateStreak(profileData, userId);
      profileData.streak = updatedStreak;
      // --- End Streak Logic ---

      setProfile((prev: any) => {
        const merged = { ...prev, ...profileData };
        localStorage.setItem('user_profile', JSON.stringify(merged));
        return merged;
      });

      // Fetch tasks
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (taskData && taskData.length > 0) {
        setTasks(taskData);
      } else {
        // Seed initial tasks if empty
        const initialTasks = [
          { user_id: userId, title: 'Review Redox Reactions', sub_text: 'Chapter 4.2 • 15 mins left', is_done: true },
          { user_id: userId, title: '10-min Physics Drill', sub_text: 'Focus on: Kinematics', is_done: false },
          { user_id: userId, title: 'AI Tutor Session', sub_text: 'Topic: Schrodinger\'s Cat', is_done: false, is_recommended: true },
        ];
        const { data: seeded } = await supabase.from('tasks').insert(initialTasks).select();
        if (seeded) setTasks(seeded);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = !task.is_done;
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, is_done: newStatus } : t));

    if (user) {
      const { error } = await supabase
        .from('tasks')
        .update({ is_done: newStatus })
        .eq('id', taskId);

      if (error) {
        // Rollback
        setTasks(tasks.map(t => t.id === taskId ? { ...t, is_done: !newStatus } : t));
      }
    }
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
    localStorage.removeItem('onboarding_complete');
    setOnboardingComplete(false);
  };

  const updateStats = async (newStats: any) => {
    let updatedProfile = { ...profile, ...newStats };
    
    if (user) {
      const updatedStreak = await checkAndUpdateStreak(updatedProfile, user.id);
      updatedProfile.streak = updatedStreak;
      newStats.streak = updatedStreak; // Ensure it gets saved to DB below if it changed
    }

    setProfile(updatedProfile);
    localStorage.setItem('user_profile', JSON.stringify(updatedProfile));

    if (user) {
      // Filter out fields that don't exist in Supabase schema to prevent errors
      const { weaknesses, strengths, topSkill, subjects, goal, tasks, plannerGoals, plannerModules, tutorTopic, tutorQuestion, tutorCodeSnippet, course, class_name, ...dbStats } = newStats;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...dbStats,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating stats:', error);
      }
    }
  };

  const handleOnboardingComplete = async (conversationContext: string) => {
    setLoading(true);
    try {
      const aiProfile = await generatePersonalizedProfile(conversationContext);
      
      const updatedProfile = {
        ...profile,
        level_name: aiProfile.level_name || 'MU/State Board Learner',
        subjects: aiProfile.subjects || [],
        mastery: 0,
        readiness: 0,
        confidence: 0,
        ...aiProfile
      };
      
      setProfile(updatedProfile);
      setTasks(aiProfile.tasks || []);
      
      setOnboardingComplete(true);
      setShowWelcome(true);
      localStorage.setItem('onboarding_complete', 'true');
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('user_tasks', JSON.stringify(aiProfile.tasks || []));
      
      if (user) {
        supabase.from('profiles').update({
          level_name: updatedProfile.level_name,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      }
    } catch (e) {
      console.error("Failed to generate profile", e);
      // Fallback if AI fails
      setOnboardingComplete(true);
      setShowWelcome(true);
      localStorage.setItem('onboarding_complete', 'true');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveScreen('reports');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-blue-400 font-mono text-xs uppercase tracking-widest">Initializing Neural OS...</p>
            <p className="text-slate-500 text-[10px] mt-2">Connecting to Supabase & Gemini Core</p>
          </div>
        </div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen">
      <TopNav profile={profile} user={user} onSignOut={handleSignOut} onNavigate={setActiveScreen} onUpdateProfile={updateStats} />
      <Sidebar active={activeScreen} onChange={setActiveScreen} />
      
      <main className="pl-20 pt-24 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-8">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 animate-pulse">
                  AI Optimized Plan
                </span>
              </div>
              <h2 className="text-3xl font-bold capitalize">{activeScreen.replace('_', ' ')}</h2>
              <p className="text-slate-500">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="glass-card px-6 py-3 rounded-xl flex items-center gap-4">
                <Flame className="text-orange-500" size={24} />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Current Streak</p>
                  <p className="text-xl font-bold">{profile?.streak || 0} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                  <div className={`size-2 rounded-full ${supabaseStatus === 'connected' ? 'bg-green-500' : supabaseStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`} title={`Supabase: ${supabaseStatus}`}></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">DB</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                  <div className={`size-2 rounded-full ${aiStatus === 'connected' ? 'bg-blue-500' : aiStatus === 'quota_exceeded' ? 'bg-orange-500' : aiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`} title={`AI: ${aiStatus}`}></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">AI</span>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeScreen === 'dashboard' && <Dashboard key="dashboard" stats={profile} tasks={tasks} onToggleTask={toggleTask} onNavigate={setActiveScreen} />}
            {activeScreen === 'practice' && <Practice key="practice" profile={profile} user={user} onUpdateStats={updateStats} />}
            {activeScreen === 'tutor' && <AITutor key="tutor" profile={profile} user={user} onViewReport={handleViewReport} onUpdateStats={updateStats} />}
            {activeScreen === 'heatmap' && <Heatmap key="heatmap" profile={profile} />}
            {activeScreen === 'planner' && <Planner key="planner" profile={profile} />}
            {activeScreen === 'feedback' && <AIAnalyser key="feedback" profile={profile} onUpdateStats={updateStats} />}
            {activeScreen === 'reports' && <Reports key="reports" user={user} />}
            {activeScreen === 'settings' && <SettingsPanel key="settings" profile={profile} user={user} onUpdateStats={updateStats} onSignOut={handleSignOut} />}
            {/* Fallback for other screens */}
            {!['dashboard', 'practice', 'tutor', 'heatmap', 'planner', 'feedback', 'reports', 'settings'].includes(activeScreen) && (
              <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <Zap className="text-blue-500 mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Screen Under Construction</h3>
                <p className="text-slate-400 max-w-sm">The {activeScreen} module is being optimized by the AI core. Check back shortly.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Welcome Reveal Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#05060f]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center space-y-8 liquid-glass p-12 md:p-20 max-w-2xl"
            >
              <div className="size-24 rounded-3xl bg-blue-500/20 flex items-center justify-center mx-auto neon-glow-blue">
                <Sparkles className="text-blue-400" size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Welcome, <span className="text-blue-400">{profile?.level_name || 'Learner'}</span> 🚀
                </h2>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  Your personalized AI Learning OS is now active and optimized for your goals.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWelcome(false)}
                className="px-12 py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg neon-glow-blue hover:brightness-110 transition-all"
              >
                Launch Dashboard
              </motion.button>
            </motion.div>

            {/* Background Effects - Liquid Glass Style */}
            <div className="absolute top-1/4 left-1/4 size-[600px] bg-blue-600/15 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 size-[600px] bg-purple-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-15%] left-[-15%] size-[1000px] bg-indigo-600/30 rounded-full blur-[150px]"
        ></motion.div>
        <motion.div 
          animate={{ 
            scale: [1.3, 1, 1.3],
            x: [0, -100, 0],
            y: [0, -50, 0],
            rotate: [0, -10, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-15%] right-[-15%] size-[1200px] bg-cyan-600/30 rounded-full blur-[180px]"
        ></motion.div>
        <motion.div 
          animate={{ 
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[25%] right-[15%] size-[800px] bg-pink-500/20 rounded-full blur-[120px]"
        ></motion.div>
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.25, 0.1],
            x: [0, 150, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[25%] left-[15%] size-[900px] bg-orange-500/20 rounded-full blur-[150px]"
        ></motion.div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
      </div>
    </div>
  );
}
