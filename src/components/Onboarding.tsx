import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  ArrowRight, 
  ArrowLeft, 
  School as SchoolIcon, 
  BookOpen, 
  Library, 
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
  onComplete: (conversationContext: string) => void;
}

interface StepOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="relative flex flex-col items-center">
            <motion.div 
              initial={false}
              animate={{ 
                backgroundColor: i + 1 <= currentStep ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                scale: i + 1 === currentStep ? 1.2 : 1,
                borderColor: i + 1 <= currentStep ? '#A78BFA' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: i + 1 === currentStep ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none'
              }}
              className="size-10 rounded-full border flex items-center justify-center relative z-10 transition-colors duration-500 backdrop-blur-md"
            >
              {i + 1 < currentStep ? (
                <CheckCircle2 size={20} className="text-purple-400" />
              ) : (
                <span className={`text-sm font-black ${i + 1 <= currentStep ? 'text-white' : 'text-white/20'}`}>
                  {i + 1}
                </span>
              )}
              {i + 1 === currentStep && (
                <motion.div 
                  layoutId="active-glow"
                  className="absolute inset-0 rounded-full bg-purple-500/30 blur-md -z-10"
                />
              )}
            </motion.div>
            <span className={`absolute -bottom-6 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
              i + 1 <= currentStep ? 'text-purple-400' : 'text-white/20'
            }`}>
              Step {i + 1}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div className="w-12 h-[2px] bg-white/5 relative overflow-hidden">
              <motion.div 
                initial={false}
                animate={{ width: i + 1 < currentStep ? '100%' : '0%' }}
                className="absolute inset-0 bg-purple-500 transition-all duration-500"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ThreeDCard = ({ 
  option, 
  isSelected, 
  onClick, 
  isGrid = false 
}: { 
  option: StepOption, 
  isSelected: boolean, 
  onClick: () => void,
  isGrid?: boolean
}) => {
  return (
    <Tilt
      perspective={1000}
      glareEnable={true}
      glareMaxOpacity={0.15}
      glareColor="#ffffff"
      glarePosition="all"
      scale={1.05}
      transitionSpeed={1500}
      className="h-full"
    >
      <motion.button
        whileHover={{ y: -10, scale: 1.02 }}
        whileTap={{ scale: 1.1 }}
        onClick={onClick}
        className={`w-full h-full p-8 rounded-[32px] border transition-all duration-500 flex flex-col items-center justify-center gap-6 relative overflow-hidden group ${
          isSelected 
            ? 'bg-purple-500/20 border-purple-400/50 neon-glow-purple shadow-[0_0_40px_rgba(168,85,247,0.3)]' 
            : 'liquid-glass border-white/10 hover:border-white/30 shadow-2xl'
        } ${isGrid ? 'aspect-square' : 'min-h-[220px]'}`}
      >
        {/* Animated Background Gradient */}
        <AnimatePresence>
          {isSelected && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-blue-500/30 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Icon with floating animation */}
        {option.icon && (
          <motion.div 
            animate={{ y: [0, -8, 0], rotate: isSelected ? [0, 5, -5, 0] : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className={`p-5 rounded-3xl transition-all duration-500 ${
              isSelected ? 'bg-purple-500 text-white scale-110 shadow-lg neon-glow-purple' : 'bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10'
            }`}
          >
            {option.icon}
          </motion.div>
        )}

        <div className="text-center z-10">
          <h3 className={`font-black transition-all duration-500 ${
            isSelected ? 'text-white text-2xl glass-text-pop' : 'text-white/60 text-lg group-hover:text-white'
          }`}>
            {option.label}
          </h3>
          {option.description && (
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 transition-all duration-500 ${
              isSelected ? 'text-purple-300' : 'text-white/20 group-hover:text-white/40'
            }`}>
              {option.description}
            </p>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div 
            layoutId="selection-check"
            className="absolute top-4 right-4 text-purple-400"
          >
            <CheckCircle2 size={20} />
          </motion.div>
        )}
      </motion.button>
    </Tilt>
  );
};

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({
    level: '',
    board: '',
    standard: ''
  });
  const [isRevealing, setIsRevealing] = useState(false);

  const handleSelect = (key: keyof typeof selections, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
    
    // Auto-advance if not on the last step
    if (step < 3) {
      setTimeout(() => setStep(step + 1), 400);
    }
  };

  const handleFinalize = () => {
    setIsRevealing(true);
    setTimeout(() => {
      const context = `Level: ${selections.level}\nBoard: ${selections.board}\nStandard: ${selections.standard}`;
      localStorage.setItem('onboarding_complete', 'true');
      localStorage.setItem('user_profile', JSON.stringify(selections));
      onComplete(context);
    }, 2500);
  };

  const getOptions = () => {
    switch (step) {
      case 1:
        return [
          { id: 'school', label: 'School', icon: <SchoolIcon size={32} />, description: 'Primary & Secondary' },
          { id: 'junior_college', label: 'Junior College', icon: <BookOpen size={32} />, description: '11th & 12th Standard' },
          { id: 'university', label: 'University', icon: <Library size={32} />, description: 'Degree & Post-Grad' }
        ];
      case 2:
        if (selections.level === 'school') {
          return [
            { id: 'ssc', label: 'SSC', description: 'Maharashtra State Board' },
            { id: 'cbse', label: 'CBSE', description: 'Central Board' },
            { id: 'icse', label: 'ICSE', description: 'Indian Certificate' }
          ];
        }
        if (selections.level === 'junior_college') {
          return [
            { id: 'hsc', label: 'HSC', description: 'Maharashtra State Board' },
            { id: 'cbse', label: 'CBSE', description: 'Central Board' }
          ];
        }
        return [
          { id: 'mu', label: 'Mumbai University', description: 'MU Affiliated' }
        ];
      case 3:
        if (selections.level === 'school') {
          return Array.from({ length: 10 }).map((_, i) => ({
            id: `${i + 1}`,
            label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Std`
          }));
        }
        if (selections.level === 'junior_college') {
          return [
            { id: '11', label: '11th Standard' },
            { id: '12', label: '12th Standard' }
          ];
        }
        return [
          { id: 'fy', label: 'First Year' },
          { id: 'sy', label: 'Second Year' },
          { id: 'ty', label: 'Third Year' }
        ];
      default:
        return [];
    }
  };

  const options = getOptions();

  if (isRevealing) {
    return (
      <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 z-10"
        >
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="size-40 rounded-full border-4 border-t-purple-500 border-r-blue-500 border-b-pink-500 border-l-transparent mx-auto blur-sm opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="text-purple-400 animate-pulse" size={64} />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tight glass-text-pop">Initializing Your OS</h2>
            <p className="text-white/40 font-black uppercase tracking-widest text-xs">Personalizing modules for {selections.board} {selections.standard}...</p>
          </div>

          <div className="w-80 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 neon-glow-purple"
            />
          </div>
        </motion.div>

        {/* Background Morphing Blobs - Liquid Glass Style */}
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, 180, 0],
            x: [0, 200, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 size-[600px] bg-purple-600/30 rounded-full blur-[150px]"
        />
        <motion.div 
          animate={{ 
            scale: [1.5, 1, 1.5],
            rotate: [0, -180, 0],
            x: [0, -200, 0],
            y: [0, -100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 size-[700px] bg-blue-600/30 rounded-full blur-[180px]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060f] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor - Liquid Glass Style */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950"></div>
      
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          x: [-100, 100, -100],
          y: [-50, 50, -50]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] left-[-15%] size-[1000px] bg-indigo-600/20 rounded-full blur-[150px]"
      ></motion.div>
      <motion.div 
        animate={{ 
          scale: [1.3, 1, 1.3],
          x: [100, -100, 100],
          y: [50, -50, 50]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-15%] right-[-15%] size-[1200px] bg-cyan-600/20 rounded-full blur-[180px]"
      ></motion.div>
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.25, 0.1],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[900px] bg-pink-500/15 rounded-full blur-[180px]"
      ></motion.div>

      <motion.div 
        className="w-full max-w-6xl liquid-glass p-12 md:p-20 relative z-10 flex flex-col min-h-[800px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-3xl bg-purple-500/20 flex items-center justify-center neon-glow-purple border border-purple-500/30">
              <Brain className="text-purple-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight glass-text-pop">AI Learning OS</h1>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Neural Profiler v2.0</p>
            </div>
          </div>
          
          {step > 1 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-all group font-black uppercase tracking-widest text-xs"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </motion.button>
          )}
        </div>

        <ProgressBar currentStep={step} totalSteps={3} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, filter: 'blur(20px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -30, filter: 'blur(20px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 glass-text-pop">
                {step === 1 && "What's your education level?"}
                {step === 2 && "Select your educational board"}
                {step === 3 && "Which standard are you in?"}
              </h2>
              <p className="secondary-text max-w-lg mx-auto font-medium text-lg">
                {step === 1 && "Choose the path that best describes your current academic journey."}
                {step === 2 && "This helps us tailor the syllabus and exam patterns to your board."}
                {step === 3 && "Almost there! Select your current year or standard to finalize."}
              </p>
            </div>

            <div className={`grid gap-8 flex-1 ${
              step === 3 && selections.level === 'school' 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' 
                : 'grid-cols-1 md:grid-cols-3'
            }`}>
              {options.map((opt, idx) => (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <ThreeDCard 
                    option={opt}
                    isSelected={
                      (step === 1 && selections.level === opt.id) ||
                      (step === 2 && selections.board === opt.id) ||
                      (step === 3 && selections.standard === opt.id)
                    }
                    onClick={() => handleSelect(
                      step === 1 ? 'level' : step === 2 ? 'board' : 'standard',
                      opt.id
                    )}
                    isGrid={step === 3 && selections.level === 'school'}
                  />
                </motion.div>
              ))}
            </div>

            {step === 3 && selections.standard && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16 flex justify-center"
              >
                <button
                  onClick={handleFinalize}
                  className="px-16 py-6 bg-purple-600 text-white rounded-full font-black text-xl neon-glow-purple hover:brightness-110 transition-all flex items-center gap-6 group shadow-2xl shadow-purple-500/30 uppercase tracking-widest"
                >
                  Enter Dashboard
                  <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
