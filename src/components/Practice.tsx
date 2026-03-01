import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, Pause, Square, Volume2, ArrowRight, Brain, Image as ImageIcon, Download, Share2, Languages, Film, Loader2, BookOpen } from 'lucide-react';
import { generateVideoScript, generateAnimeImage, generateMultiSpeakerVoiceover } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useLanguage } from '../contexts/LanguageContext';

interface PracticeProps {
  profile: any;
  user: User | null;
  onUpdateStats: (newStats: any) => void;
  key?: string;
}

interface Scene {
  imageUrl: string;
  audioBase64: string;
  audioUrl?: string;
  narration: string;
}

interface SavedLesson {
  id: string;
  topic: string;
  subject: string;
  scenes: Scene[];
  examTricks: string[];
  timestamp: number;
}

export const Practice = ({ profile, user, onUpdateStats }: PracticeProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'input' | 'generating' | 'viewing'>('input');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('English');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [examTricks, setExamTricks] = useState<string[]>([]);
  const [savedLessons, setSavedLessons] = useState<SavedLesson[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerateLesson = async () => {
    if (!topic || !subject || !language) return;
    setStep('generating');
    setLoadingStatus(t('practice.creating_script'));
    
    try {
      // 1. Generate Script
      const script = await generateVideoScript(topic, subject, profile.level_name, language);
      setExamTricks(script.exam_tricks || []);
      
      // 2. Generate Scenes (Images + Audio) in parallel
      setLoadingStatus(t('practice.generating_scenes'));
      
      const scenePromises = (script.scenes || []).map(async (sceneData: any, i: number) => {
        const [imageBase64, audioBase64] = await Promise.all([
          generateAnimeImage(sceneData.visual_prompt),
          generateMultiSpeakerVoiceover(sceneData.narration, language)
        ]);

        if (imageBase64 && audioBase64) {
          const blob = pcmToWav(audioBase64, 24000);
          const audioUrl = URL.createObjectURL(blob);
          return {
            index: i,
            scene: {
              imageUrl: `data:image/png;base64,${imageBase64}`,
              audioBase64,
              audioUrl,
              narration: sceneData.narration
            }
          };
        }
        return null;
      });

      const results = await Promise.all(scenePromises);
      const generatedScenes = results
        .filter((r): r is { index: number; scene: Scene } => r !== null)
        .sort((a, b) => a.index - b.index)
        .map(r => r.scene);

      if (generatedScenes.length === 0) throw new Error("Failed to generate scenes");

      setScenes(generatedScenes);
      setCurrentSceneIndex(0);
      setStep('viewing');
      setIsPlaying(true);

      // Save topic to practiced topics list for AI Tutor
      if (user) {
        await supabase.from('practiced_topics').upsert({
          user_id: user.id,
          topic: topic
        }, { onConflict: 'user_id,topic' });
      } else {
        const practiced = JSON.parse(localStorage.getItem('practiced_topics') || '[]');
        if (!practiced.includes(topic)) {
          practiced.push(topic);
          localStorage.setItem('practiced_topics', JSON.stringify(practiced));
        }
      }

      // Update global stats
      onUpdateStats({
        readiness: Math.min(100, (profile?.readiness || 0) + 8),
        confidence: Math.min(100, (profile?.confidence || 0) + 5),
        topSkill: topic
      });
    } catch (error: any) {
      console.error("Error generating lesson:", error);
      if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('quota')) {
        alert(t('practice.quota_exceeded'));
      } else {
        alert(t('practice.generic_error'));
      }
      setStep('input');
    }
  };

  const pcmToWav = (base64Pcm: string, sampleRate: number) => {
    if (!base64Pcm) return new Blob([], { type: 'audio/wav' });
    try {
      const binaryString = window.atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const samples = new Int16Array(bytes.buffer);
      
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);

      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
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

      for (let i = 0; i < samples.length; i++) {
        view.setInt16(44 + i * 2, samples[i], true);
      }

      return new Blob([buffer], { type: 'audio/wav' });
    } catch (e) {
      console.error("Error converting PCM to WAV:", e);
      return new Blob([], { type: 'audio/wav' });
    }
  };

  const saveLesson = async () => {
    if (scenes.length === 0) return;
    const newLesson: SavedLesson = {
      id: Math.random().toString(36).substr(2, 9),
      topic,
      subject,
      scenes,
      examTricks,
      timestamp: Date.now()
    };

    if (user) {
      const { data, error } = await supabase.from('saved_lessons').insert({
        user_id: user.id,
        topic,
        subject,
        scenes,
        exam_tricks: examTricks
      }).select().single();

      if (!error && data) {
        setSavedLessons(prev => [...prev, {
          ...newLesson,
          id: data.id
        }]);
        alert(t('practice.save_success_cloud'));
      } else {
        console.error('Error saving lesson:', error);
        alert(t('practice.save_fail_cloud'));
        saveLocally(newLesson);
      }
    } else {
      saveLocally(newLesson);
    }
  };

  const saveLocally = (lesson: SavedLesson) => {
    const updated = [...savedLessons, lesson];
    setSavedLessons(updated);
    localStorage.setItem('saved_anime_lessons', JSON.stringify(updated));
    alert(t('practice.save_success_local'));
  };

  const shareLesson = () => {
    if (navigator.share && scenes.length > 0) {
      navigator.share({
        title: t('practice.share_title').replace('{topic}', topic),
        text: t('practice.share_text').replace('{topic}', topic),
        url: window.location.href
      }).catch(console.error);
    } else {
      alert(t('practice.share_unsupported'));
    }
  };

  useEffect(() => {
    const loadLessons = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('saved_lessons')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          const formatted: SavedLesson[] = data.map(d => ({
            id: d.id,
            topic: d.topic,
            subject: d.subject,
            scenes: d.scenes,
            examTricks: d.exam_tricks,
            timestamp: new Date(d.created_at).getTime()
          }));
          setSavedLessons(formatted);
        }
      } else {
        const saved = localStorage.getItem('saved_anime_lessons');
        if (saved) setSavedLessons(JSON.parse(saved));
      }
    };
    loadLessons();
  }, [user]);

  useEffect(() => {
    if (step === 'viewing' && isPlaying && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, [step, isPlaying]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'input' ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <BookOpen className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white glass-text-pop">{t('practice.title')}</h3>
                  <p className="secondary-text text-sm font-medium">{t('practice.desc')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <div className="liquid-glass p-8 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  
                  <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('practice.subject')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {profile.subjects?.map((sub: string) => (
                            <button
                              key={sub}
                              onClick={() => setSubject(sub)}
                              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                                subject === sub 
                                  ? 'bg-purple-500/20 text-white border-purple-500 neon-glow-purple' 
                                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('practice.language')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil'].map((lang) => (
                            <button
                              key={lang}
                              onClick={() => setLanguage(lang)}
                              className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                                language === lang 
                                  ? 'bg-purple-500/20 text-white border-purple-500 neon-glow-purple' 
                                  : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Languages size={14} /> {lang}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('practice.topic')}</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={t('practice.topic_placeholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                      />
                    </div>

                    <button
                      onClick={handleGenerateLesson}
                      disabled={!topic || !subject || !language}
                      className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg neon-glow-purple hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                      {t('practice.generate_btn')} <Sparkles size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="liquid-glass p-6 flex flex-col h-full">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" /> {t('practice.library')}
                  </h4>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {savedLessons.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-white/20 p-4">
                        <Film size={32} className="opacity-20 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">{t('practice.no_lessons')}</p>
                      </div>
                    ) : (
                      savedLessons.map((lesson) => (
                        <div key={lesson.id} className="p-4 liquid-glass border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-white truncate max-w-[150px]">{lesson.topic}</p>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{lesson.subject} • {new Date(lesson.timestamp).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => {
                              const rehydratedScenes = (lesson.scenes || []).map(s => {
                                if (!s.audioBase64) return s;
                                const blob = pcmToWav(s.audioBase64, 24000);
                                return {
                                  ...s,
                                  audioUrl: URL.createObjectURL(blob)
                                };
                              });
                              setScenes(rehydratedScenes);
                              setExamTricks(lesson.examTricks || []);
                              setCurrentSceneIndex(0);
                              setTopic(lesson.topic);
                              setSubject(lesson.subject);
                              setStep('viewing');
                              setIsPlaying(true);
                            }} className="p-2 bg-purple-500/20 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity neon-glow-purple">
                              <Play size={14} fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : step === 'generating' ? (
          <motion.div 
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8"
          >
            <div className="relative">
              <div className="size-48 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-purple-500 animate-pulse" size={48} />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">{t('practice.creating')}</h2>
              <p className="text-slate-400 max-w-md mx-auto">{loadingStatus}</p>
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="size-2 bg-purple-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-6 gap-6 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => {
                  setStep('input');
                  setIsPlaying(false);
                }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white">
                  <ArrowRight className="rotate-180" />
                </button>
                <div>
                  <h3 className="text-2xl font-black text-white glass-text-pop">{topic}</h3>
                  <p className="secondary-text text-sm font-bold uppercase tracking-widest">{subject} • {t('practice.title')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveLesson} className="flex items-center gap-2 px-6 py-2.5 liquid-glass border-white/10 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest text-white">
                  <Download size={16} /> {t('practice.save')}
                </button>
                <button onClick={shareLesson} className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-full hover:brightness-110 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 neon-glow-purple">
                  <Share2 size={16} /> {t('practice.share')}
                </button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
              <div className="lg:col-span-8 liquid-glass overflow-hidden relative group">
                {scenes.length > 0 ? (
                  <div className="relative w-full h-full overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSceneIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                      >
                        <motion.img 
                          src={scenes[currentSceneIndex].imageUrl} 
                          className="w-full h-full object-cover"
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                        />
                      </motion.div>
                    </AnimatePresence>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    <audio 
                      ref={audioRef} 
                      src={scenes[currentSceneIndex].audioUrl} 
                      autoPlay
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => {
                        if (currentSceneIndex < scenes.length - 1) {
                          setCurrentSceneIndex(prev => prev + 1);
                        } else {
                          setIsPlaying(false);
                        }
                      }}
                      onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                      onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                    />

                    <div className="absolute top-8 left-8 flex gap-2">
                      {scenes.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            i === currentSceneIndex ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-4 bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 space-y-6">
                      {/* Subtitles/Narration */}
                      <motion.div
                        key={`narration-${currentSceneIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                      >
                        <p className="text-xl md:text-2xl font-medium text-white leading-relaxed drop-shadow-lg">
                          {scenes[currentSceneIndex].narration}
                        </p>
                      </motion.div>

                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress" onClick={(e) => {
                          if (!audioRef.current) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          audioRef.current.currentTime = percentage * audioRef.current.duration;
                        }}>
                          <motion.div 
                            className="h-full bg-purple-500 relative"
                            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                          </motion.div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  if (currentSceneIndex > 0) setCurrentSceneIndex(prev => prev - 1);
                                }}
                                disabled={currentSceneIndex === 0}
                                className="p-2 text-white/60 hover:text-white disabled:opacity-30"
                              >
                                <ArrowRight className="rotate-180" size={20} />
                              </button>
                              <button 
                                onClick={() => {
                                  if (audioRef.current?.paused) audioRef.current.play();
                                  else audioRef.current?.pause();
                                }}
                                className="size-16 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-2xl neon-glow-purple hover:scale-110 transition-all"
                              >
                                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                              </button>
                              <button 
                                onClick={() => {
                                  if (currentSceneIndex < scenes.length - 1) setCurrentSceneIndex(prev => prev + 1);
                                }}
                                disabled={currentSceneIndex === scenes.length - 1}
                                className="p-2 text-white/60 hover:text-white disabled:opacity-30"
                              >
                                <ArrowRight size={20} />
                              </button>
                            </div>

                            <div className="text-white font-mono text-sm">
                              {t('practice.scene')} {currentSceneIndex + 1}/{scenes.length} • {Math.floor(currentTime / 60)}:
                              {Math.floor(currentTime % 60).toString().padStart(2, '0')}
                              <span className="text-white/40 mx-1">/</span>
                              {Math.floor(duration / 60)}:
                              {Math.floor(duration % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <Volume2 size={20} className="text-purple-400" />
                            <div className="flex gap-1 items-end h-4">
                              {[...Array(8)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ height: isPlaying ? [4, 16, 4] : 4 }}
                                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                  className="w-1 bg-purple-400 rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <p className="text-slate-500">{t('practice.visuals_failed')}</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="liquid-glass p-6 flex-1 flex flex-col">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" /> {t('practice.summary')}
                  </h4>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                      <p className="text-xs font-bold text-purple-400 uppercase mb-1">{t('practice.concept')}</p>
                      <p className="text-sm text-slate-300">{t('practice.concept_desc').replace('{topic}', topic)}</p>
                    </div>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                      <p className="text-xs font-bold text-purple-400 uppercase mb-1">{t('practice.exam_tricks')}</p>
                      <ul className="text-sm text-slate-300 list-disc list-inside space-y-2">
                        {examTricks.map((trick, i) => (
                          <li key={i}>{trick}</li>
                        ))}
                        {examTricks.length === 0 && (
                          <>
                            <li>{t('practice.trick_1')}</li>
                            <li>{t('practice.trick_2')}</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <button onClick={() => setStep('input')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">
                  {t('practice.generate_another')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
