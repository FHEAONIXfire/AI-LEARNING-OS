import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Image as ImageIcon, LogOut, Save, Upload, Moon, Sun, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../i18n';

interface SettingsProps {
  profile: any;
  user: any;
  onUpdateStats: (newStats: any) => void;
  onSignOut: () => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia'
];

export const SettingsPanel: React.FC<SettingsProps> = ({ profile, user, onUpdateStats, onSignOut }) => {
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState(profile?.full_name || '');
  const [course, setCourse] = useState(profile?.course || '');
  const [classLevel, setClassLevel] = useState(profile?.class_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || `https://picsum.photos/seed/${user?.id || 'guest'}/100/100`);
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    await onUpdateStats({
      full_name: username,
      avatar_url: avatarUrl,
      course: course,
      class_name: classLevel
    });
    
    setIsSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="liquid-glass p-8">
        <h3 className="text-3xl font-black mb-8 flex items-center gap-3 text-white glass-text-pop">
          <User className="text-blue-400" size={28} /> {t('settings.profile')}
        </h3>
        
        <div className="space-y-8">
          {/* Username */}
          <div>
            <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">{t('settings.username')}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder-white/20"
              placeholder="Enter your username"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course */}
            <div>
              <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">{t('settings.course')}</label>
              <input 
                type="text" 
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder-white/20"
                placeholder="e.g. B.Tech, B.Sc, etc."
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">{t('settings.class')}</label>
              <input 
                type="text" 
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder-white/20"
                placeholder="e.g. 9th Standard, 1st Year, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Toggle */}
            <div>
              <label className="block text-[10px] font-black text-white/40 mb-3 uppercase tracking-widest">{t('settings.appearance')}</label>
              <button
                onClick={handleThemeToggle}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl liquid-glass border-white/10 hover:bg-white/10 transition-all w-full group"
              >
                {isDarkMode ? (
                  <>
                    <Moon className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
                    <span className="font-bold text-white">{t('settings.dark_mode')}</span>
                  </>
                ) : (
                  <>
                    <Sun className="text-orange-400 group-hover:scale-110 transition-transform" size={20} />
                    <span className="font-bold text-white">{t('settings.light_mode')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-[10px] font-black text-white/40 mb-3 uppercase tracking-widest">{t('settings.language')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe className="text-blue-400" size={20} />
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-bold"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-[10px] font-black text-white/40 mb-3 uppercase tracking-widest">{t('settings.avatar')}</label>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="size-24 rounded-3xl border-2 border-blue-500/30 overflow-hidden shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <img src={avatarUrl} alt="Current Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap gap-3 mb-4">
                  {AVATAR_OPTIONS.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setAvatarUrl(url)}
                      className={`size-12 rounded-xl border-2 overflow-hidden transition-all ${
                        avatarUrl === url ? 'border-blue-400 scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <img src={url} alt={`Avatar option ${i + 1}`} className="w-full h-full object-cover bg-white/10" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl liquid-glass border-white/10 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    <Upload size={16} /> {t('settings.upload')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 neon-glow-blue"
            >
              {isSaving ? <span className="animate-pulse">{t('settings.saving')}</span> : <><Save size={20} /> {t('settings.save')}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="liquid-glass p-8 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <h3 className="text-xl font-black text-red-400 mb-2 uppercase tracking-widest">{t('settings.danger')}</h3>
        <p className="secondary-text text-sm mb-6 font-medium">{t('settings.signout_desc')}</p>
        <button 
          onClick={onSignOut}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-black uppercase tracking-widest group neon-glow-red"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          {t('settings.signout')}
        </button>
      </div>
    </motion.div>
  );
};
