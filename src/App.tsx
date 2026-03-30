import { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Loader2, ChevronDown, Bookmark, BookmarkCheck, Trash2, Library } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DAILY_MEDITATIONS } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PHILOSOPHERS = [
  { id: 'Any', name: 'General Wisdom (Any)' },
  { id: 'Marcus Aurelius', name: 'Marcus Aurelius (Stoicism)' },
  { id: 'Lao Tzu', name: 'Lao Tzu (Taoism)' },
  { id: 'The Buddha', name: 'The Buddha (Buddhism)' },
  { id: 'Aristotle', name: 'Aristotle (Virtue Ethics)' },
  { id: 'Socrates', name: 'Socrates (Socratic Method)' },
  { id: 'Confucius', name: 'Confucius (Confucianism)' },
  { id: 'Epictetus', name: 'Epictetus (Stoicism)' },
  { id: 'Seneca', name: 'Seneca (Stoicism)' },
];

const QUICK_THEMES = [
  "Anxiety", "Heartbreak", "Procrastination", 
  "Grief", "Anger", "Self-Doubt", "Loss of Purpose",
  "Loneliness", "Burnout", "Fear of Failure", 
  "Regret", "Overthinking", "Dealing with Change"
];

interface JournalEntry {
  id: string;
  date: string;
  problem: string;
  philosopher: string;
  advice: string;
}

export default function App() {
  const [view, setView] = useState<'counsel' | 'journal'>('counsel');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  
  const [input, setInput] = useState('');
  const [philosopher, setPhilosopher] = useState(PHILOSOPHERS[0].id);
  
  const [currentProblem, setCurrentProblem] = useState('');
  const [currentPhilosopher, setCurrentPhilosopher] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('philosopher_journal');
    if (saved) {
      try {
        setJournal(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse journal", e);
      }
    }
  }, []);

  const todayMeditation = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return DAILY_MEDITATIONS[dayOfYear % DAILY_MEDITATIONS.length];
  }, []);

  const fetchAdvice = async (problemText: string) => {
    if (!problemText.trim()) return;

    setIsLoading(true);
    setError('');
    setAdvice('');
    setCurrentProblem(problemText);
    setCurrentPhilosopher(PHILOSOPHERS.find(p => p.id === philosopher)?.name || philosopher);

    const philosopherContext = philosopher === 'Any' 
      ? 'ancient philosophical traditions (such as Stoicism, Buddhism, Aristotelian ethics, Taoism, etc.)'
      : `the teachings, voice, and perspective of ${philosopher}`;

    const quoteInstruction = philosopher === 'Any'
      ? 'a specific ancient philosopher'
      : philosopher;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `The user is dealing with the following emotion or problem: "${problemText}". 
        
Provide thoughtful, comforting, and practical advice drawing from ${philosopherContext}. 

Structure your response nicely using Markdown:
1. Start with a relevant quote from ${quoteInstruction}.
2. Provide the core philosophical perspective on their issue.
3. Offer a practical, actionable takeaway.

Keep the tone empathetic, wise, and grounded.`,
        config: {
          temperature: 0.7,
        }
      });

      if (response.text) {
        setAdvice(response.text);
      } else {
        setError("The philosophers are silent at the moment. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching advice:", err);
      setError("An error occurred while seeking counsel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchAdvice(input);
  };

  const handleThemeClick = (theme: string) => {
    setInput(theme);
    fetchAdvice(theme);
  };

  const saveToJournal = () => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      problem: currentProblem,
      philosopher: currentPhilosopher,
      advice: advice
    };
    const updated = [newEntry, ...journal];
    setJournal(updated);
    localStorage.setItem('philosopher_journal', JSON.stringify(updated));
  };

  const removeFromJournal = (id: string) => {
    const updated = journal.filter(e => e.id !== id);
    setJournal(updated);
    localStorage.setItem('philosopher_journal', JSON.stringify(updated));
  };

  const isSaved = journal.some(entry => entry.advice === advice);

  return (
    <div className="min-h-screen font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center mb-4"
          >
            <div className="p-4 bg-[#5A5A40] text-[#f5f5f0] rounded-full shadow-lg">
              <BookOpen size={36} strokeWidth={1.5} />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-serif font-semibold text-[#2c2c2a] mb-4"
          >
            Philosopher's Counsel
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-[#5A5A40] font-serif italic mb-8"
          >
            Seek timeless wisdom for modern struggles.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex justify-center gap-4"
          >
            <button 
              onClick={() => setView('counsel')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-colors ${view === 'counsel' ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-[#e0e0d8] text-[#5A5A40] hover:bg-[#d0d0c8]'}`}
            >
              <Sparkles size={18} />
              Seek Counsel
            </button>
            <button 
              onClick={() => setView('journal')} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-colors ${view === 'journal' ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-[#e0e0d8] text-[#5A5A40] hover:bg-[#d0d0c8]'}`}
            >
              <Library size={18} />
              Journal
            </button>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {view === 'counsel' ? (
            <motion.div
              key="counsel-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-10 text-center px-4">
                <p className="text-sm font-medium text-[#5A5A40] uppercase tracking-widest mb-3">Daily Meditation</p>
                <blockquote className="text-xl sm:text-2xl font-serif text-[#2c2c2a] italic mb-3">
                  "{todayMeditation.quote}"
                </blockquote>
                <cite className="text-sm text-[#5A5A40] font-serif not-italic font-medium">— {todayMeditation.author}</cite>
              </div>

              <div className="bg-white rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8 mb-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="problem" className="block text-sm font-medium text-[#5A5A40] mb-3 uppercase tracking-wider">
                      What weighs on your mind?
                    </label>
                    <textarea
                      id="problem"
                      rows={4}
                      className="w-full px-5 py-4 rounded-2xl border border-[#e0e0d8] bg-[#fafaf8] focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent transition-colors resize-none text-[#2c2c2a] text-lg font-serif"
                      placeholder="e.g., I feel overwhelmed by my responsibilities at work..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                    />
                    <div className="mt-4">
                      <p className="text-xs text-[#5A5A40] mb-2 uppercase tracking-wider font-medium">Or choose a common theme:</p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_THEMES.map(theme => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => handleThemeClick(theme)}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-sm bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#e0e0d8] rounded-full transition-colors disabled:opacity-50 border border-[#e0e0d8]"
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-2">
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={philosopher}
                        onChange={(e) => setPhilosopher(e.target.value)}
                        disabled={isLoading}
                        className="w-full sm:w-64 appearance-none bg-[#fafaf8] border border-[#e0e0d8] text-[#5A5A40] py-3 pl-5 pr-10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent font-serif text-lg cursor-pointer disabled:opacity-50"
                        aria-label="Choose a philosopher"
                      >
                        {PHILOSOPHERS.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A5A40] pointer-events-none" size={20} />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5A5A40] hover:bg-[#4a4a34] text-white px-8 py-3.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Seeking Wisdom...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Consult the Ancients
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-800 p-4 rounded-xl mb-8 text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {advice && !isLoading && (
                  <motion.div
                    key="advice"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-8 sm:p-10 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#5A5A40]"></div>
                    <div className="prose prose-stone max-w-none font-serif text-xl leading-relaxed prose-headings:font-sans prose-headings:font-medium prose-headings:text-[#2c2c2a] prose-p:text-[#4a4a4a] prose-blockquote:border-l-4 prose-blockquote:border-[#5A5A40] prose-blockquote:bg-[#f5f5f0] prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-[#2c2c2a] prose-blockquote:shadow-sm prose-strong:text-[#2c2c2a]">
                      <ReactMarkdown>{advice}</ReactMarkdown>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[#e0e0d8] flex justify-end">
                      <button
                        onClick={saveToJournal}
                        disabled={isSaved}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors ${isSaved ? 'bg-[#e0e0d8] text-[#5A5A40] cursor-default' : 'bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#e0e0d8] border border-[#e0e0d8]'}`}
                      >
                        {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        {isSaved ? 'Saved to Journal' : 'Save to Journal'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="journal-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {journal.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-dashed border-[#d0d0c8]">
                  <Library size={48} className="mx-auto text-[#d0d0c8] mb-4" />
                  <p className="text-[#5A5A40] font-serif text-xl italic">Your journal is empty.</p>
                  <p className="text-[#8a8a78] mt-2">Seek counsel and save your favorite wisdom here.</p>
                  <button 
                    onClick={() => setView('counsel')}
                    className="mt-6 px-6 py-2 bg-[#f5f5f0] text-[#5A5A40] hover:bg-[#e0e0d8] rounded-full font-medium transition-colors border border-[#e0e0d8]"
                  >
                    Return to Counsel
                  </button>
                </div>
              ) : (
                journal.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#5A5A40]"></div>
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#f0f0e8]">
                      <div>
                        <p className="text-xs text-[#8a8a78] font-medium uppercase tracking-wider mb-1">{entry.date} • {entry.philosopher}</p>
                        <p className="font-serif text-xl text-[#2c2c2a] italic">"{entry.problem}"</p>
                      </div>
                      <button 
                        onClick={() => removeFromJournal(entry.id)} 
                        className="text-[#d0d0c8] hover:text-red-500 transition-colors p-2"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="prose prose-stone max-w-none font-serif text-lg leading-relaxed prose-headings:font-sans prose-headings:font-medium prose-headings:text-[#2c2c2a] prose-p:text-[#4a4a4a] prose-blockquote:border-l-4 prose-blockquote:border-[#5A5A40] prose-blockquote:bg-[#f5f5f0] prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-[#2c2c2a] prose-blockquote:shadow-sm prose-strong:text-[#2c2c2a]">
                      <ReactMarkdown>{entry.advice}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
