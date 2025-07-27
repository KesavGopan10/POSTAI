import React, { useState, useEffect, useRef } from 'react';
import type { SocialPlatform, Language, Tone } from '../types';
import { SOCIAL_PLATFORMS, SUPPORTED_LANGUAGES, TONES } from '../constants';
import { MicrophoneIcon, GalaxyIcon, LoaderIcon, LightbulbIcon, XIcon, PaperclipIcon } from './icons';
import { generatePostIdeas } from '../services/geminiService';

// --- PROPS INTERFACES ---
interface InputPanelProps {
  userInput: string;
  setUserInput: (value: string) => void;
  selectedPlatform: SocialPlatform;
  setSelectedPlatform: (platform: SocialPlatform) => void;
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
  selectedTone: Tone;
  setSelectedTone: (tone: Tone) => void;
  onGenerate: () => void;
  isLoading: boolean;
  useGoogleSearch: boolean;
  setUseGoogleSearch: (value: boolean) => void;
  userImage: string | null;
  setUserImage: (image: string | null) => void;
}

interface CustomDropdownProps<T> {
  id: string;
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  renderDisplayValue: (value: T) => React.ReactNode;
  getOptionKey: (value: T) => string | number;
}

interface IdeaGeneratorProps {
    onSelectIdea: (idea: string) => void;
    onClose: () => void;
}

// --- REUSABLE COMPONENTS ---

/**
 * A generic, customizable dropdown component with improved accessibility.
 */
const CustomDropdown = <T,>({
  id,
  label,
  options,
  value,
  onChange,
  renderDisplayValue,
  getOptionKey,
}: CustomDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={dropdownRef}>
      <label htmlFor={id} className="block text-sm font-medium text-aether-light/70 mb-1.5 transition-colors group-hover:text-aether-cyan">{label}</label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="appearance-none w-full bg-aether-dark/50 border border-aether-violet/50 text-aether-light rounded-lg focus:ring-1 focus:ring-aether-cyan focus:border-aether-cyan p-2.5 pr-8 transition-all duration-300 hover:border-aether-violet backdrop-blur-sm text-left flex justify-between items-center"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex-grow min-w-0">{renderDisplayValue(value)}</div>
          <div className={`pointer-events-none text-aether-mid transition-transform duration-300 group-hover:text-aether-cyan ${isOpen ? 'rotate-180' : ''}`}><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
        </button>
        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-aether-indigo/90 backdrop-blur-lg border border-aether-violet/50 rounded-lg shadow-2xl shadow-black/50 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-up" style={{animationDuration: '200ms'}}>
            <ul role="listbox" aria-labelledby={id}>
              {options.map((option: T) => (
                <li
                  key={getOptionKey(option)}
                  onClick={() => { onChange(option); setIsOpen(false); }}
                  role="option"
                  aria-selected={value === option}
                  className="px-3 py-2 text-aether-light hover:bg-aether-violet/50 cursor-pointer flex items-center gap-2 transition-colors"
                >
                  {renderDisplayValue(option)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ToggleSwitch = ({ label, enabled, setEnabled, disabled = false }: { label: string, enabled: boolean, setEnabled: (e:boolean) => void, disabled?: boolean }) => (
    <label className={`flex items-center justify-between cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <span className="text-sm font-medium text-aether-light/80">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={enabled} onChange={() => !disabled && setEnabled(!enabled)} disabled={disabled} />
            <div className={`block w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-aether-cyan' : 'bg-aether-dark/50'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
        </div>
    </label>
);

/**
 * A modal component for generating post ideas based on a topic.
 * Features keyboard navigation and accessibility improvements.
 */
const IdeaGenerator = ({ onSelectIdea, onClose }: IdeaGeneratorProps) => {
    const [topic, setTopic] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Effect for handling keyboard interactions and focus trapping.
    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        // On mount, focus the main input field.
        inputRef.current?.focus();

        const focusableElements = Array.from(modal.querySelectorAll<HTMLElement>(
            'button, [href], input, [tabindex]:not([tabindex="-1"])'
        ));
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus Trapping: Trap Tab key presses within the modal.
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            }

            // Close modal on Escape key.
            if (e.key === 'Escape') {
                onClose();
            }

            // Navigate idea list with arrow keys.
            if (ideas.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % ideas.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + ideas.length) % ideas.length);
                } else if (e.key === 'Enter' && selectedIndex !== -1 && document.activeElement !== inputRef.current) {
                    e.preventDefault();
                    onSelectIdea(ideas[selectedIndex]);
                }
            }
        };

        modal.addEventListener('keydown', handleKeyDown);
        return () => modal.removeEventListener('keydown', handleKeyDown);
    }, [ideas, selectedIndex, onClose, onSelectIdea]); // Re-run if these change.

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex !== -1) {
            modalRef.current?.querySelector(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleGenerateIdeas = async () => {
        if (!topic.trim() || isGenerating) return;
        setIsGenerating(true);
        setError(null);
        setIdeas([]);
        setSelectedIndex(-1);
        try {
            const generatedIdeas = await generatePostIdeas(topic);
            setIdeas(generatedIdeas);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to generate ideas. ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerateIdeas();
        }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in-up"
        style={{ animationDuration: '200ms' }}
        // This outer div handles clicks outside the modal
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl bg-aether-indigo/90 border border-aether-violet/50 rounded-xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="idea-modal-title"
          tabIndex={-1} // Makes the modal container focusable
        >
          {/* ... modal content (unchanged from original) ... */}
            <div className="flex items-center justify-between p-4 border-b border-aether-violet/30 flex-shrink-0">
                <h3 id="idea-modal-title" className="text-xl font-bold font-display text-aether-light/90 flex items-center gap-2">
                    <LightbulbIcon className="w-6 h-6 text-aether-cyan" />
                    <span>Generate Post Ideas</span>
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-aether-mid hover:bg-aether-violet/50 hover:text-aether-cyan transition-colors"
                    aria-label="Close modal"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="p-4 flex-shrink-0">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Enter a topic, e.g., 'sustainable energy'"
                        className="flex-grow bg-aether-dark/50 border border-aether-violet/50 text-aether-light rounded-lg focus:ring-2 focus:ring-aether-cyan focus:border-aether-cyan p-3 transition-colors hover:border-aether-violet"
                    />
                    <button
                        onClick={handleGenerateIdeas}
                        disabled={isGenerating || !topic.trim()}
                        className="px-4 py-2 bg-aether-violet text-aether-cyan font-semibold rounded-lg hover:bg-aether-violet/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
                    >
                        {isGenerating ? <LoaderIcon className="w-5 h-5 animate-spin" /> : "Get Ideas"}
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 pt-0">
                {isGenerating && (
                    <div className="flex justify-center items-center h-48">
                        <LoaderIcon className="w-8 h-8 text-aether-cyan animate-spin" />
                    </div>
                )}
                {error && (
                    <div className="flex justify-center items-center text-center h-48 text-red-400 bg-red-900/20 p-4 rounded-lg">
                        {error}
                    </div>
                )}
                {!isGenerating && !error && ideas.length === 0 && (
                    <div className="flex flex-col justify-center items-center text-center h-48 text-aether-light/50">
                        <p>Your brilliant ideas will appear here.</p>
                        <p className="text-sm">Use arrow keys to navigate and 'Enter' to select.</p>
                    </div>
                )}
                {ideas.length > 0 && (
                    <ul className="space-y-2">
                        {ideas.map((idea, index) => (
                            <li
                                key={index}
                                data-index={index}
                                onClick={() => onSelectIdea(idea)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                    selectedIndex === index
                                        ? 'bg-aether-violet/70 border-aether-cyan shadow-lg scale-105'
                                        : 'bg-aether-dark/50 border-aether-violet/30 hover:bg-aether-violet/40 hover:border-aether-violet'
                                }`}
                            >
                                <p className="text-aether-light/90">{idea}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
      </div>
    );
}

// --- MAIN COMPONENT ---

/**
 * The main input panel for configuring and generating social media posts.
 */
const InputPanel: React.FC<InputPanelProps> = ({
  userInput, setUserInput, selectedPlatform, setSelectedPlatform, selectedLanguage, setSelectedLanguage,
  selectedTone, setSelectedTone, onGenerate, isLoading, useGoogleSearch, setUseGoogleSearch,
  userImage, setUserImage
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textBeforeListening = useRef<string>('');
  const [isIdeasOpen, setIsIdeasOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup Speech Recognition API
  useEffect(() => {
    // Gracefully handle browsers that don't support the API.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      // Accumulate final results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        textBeforeListening.current += finalTranscript.trim() + ' ';
      }
      
      // Combine previous text with the current interim transcript for a live preview.
      const interimTranscript = Array.from(event.results)
        .slice(event.resultIndex)
        .map(r => r[0].transcript)
        .join('');
      
      setUserInput(textBeforeListening.current + interimTranscript);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    // Cleanup: stop recognition if the component unmounts.
    return () => recognitionRef.current?.stop();
  }, [setUserInput]);

  // Update recognition language when selection changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage.code;
    }
  }, [selectedLanguage]);

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
        // Provide feedback if speech recognition is not supported. A toast notification would be ideal.
        alert("Sorry, your browser does not support speech recognition.");
        return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      // Store the current text so we can append to it.
      textBeforeListening.current = userInput ? userInput.trim() + ' ' : '';
      recognition.start();
      setIsListening(true);
    }
  };
  
  const handleSelectIdea = (idea: string) => {
    setUserInput(idea);
    setIsIdeasOpen(false);
  };

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        // Automatically disable Google Search when an image is attached for a clearer UX.
        setUseGoogleSearch(false);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting the same file again.
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="bg-aether-indigo/30 backdrop-blur-lg border border-aether-violet/30 p-4 md:p-6 rounded-2xl shadow-2xl shadow-black/50 flex flex-col gap-5 w-full h-full">
        <h2 className="text-2xl font-bold font-display text-aether-light text-shadow-glow text-center">Generator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomDropdown id="platform" label="Select Platform" options={SOCIAL_PLATFORMS} value={selectedPlatform} onChange={setSelectedPlatform} getOptionKey={(p: SocialPlatform) => p.id} renderDisplayValue={(p: SocialPlatform) => <div className="flex items-center gap-2 truncate"><p.icon className="w-5 h-5 flex-shrink-0" /><span className="truncate">{p.name}</span></div>} />
          <CustomDropdown id="language" label="Select Language" options={SUPPORTED_LANGUAGES} value={selectedLanguage} onChange={setSelectedLanguage} getOptionKey={(l: Language) => l.code} renderDisplayValue={(l: Language) => <span className="truncate">{l.name}</span>} />
        </div>
        <CustomDropdown id="tone" label="Select Tone of Voice" options={TONES} value={selectedTone} onChange={setSelectedTone} getOptionKey={(t: Tone) => t.id} renderDisplayValue={(t: Tone) => <span className="truncate">{t.name}</span>} />
        
        <div className="flex-grow flex flex-col min-h-[150px] lg:min-h-0 relative group">
          <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="userInput" className="block text-sm font-medium text-aether-light/70 transition-colors group-hover:text-aether-cyan">Describe your post idea</label>
              <button onClick={() => setIsIdeasOpen(true)} className="flex items-center gap-1 text-sm text-aether-cyan hover:text-aether-light transition-colors p-1 rounded-md hover:bg-aether-violet/50">
                  <LightbulbIcon className="w-4 h-4"/> Get Ideas
              </button>
          </div>
          <div className="relative flex-grow">
            <textarea
              id="userInput"
              className="w-full h-full bg-aether-dark/50 border border-aether-violet/50 text-aether-light rounded-lg focus:ring-1 focus:ring-aether-cyan focus:border-aether-cyan p-3 pl-14 pr-14 resize-none transition-all duration-300 hover:border-aether-violet backdrop-blur-sm placeholder:text-aether-light/30"
              placeholder="e.g., A post announcing a new lunar base..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" aria-hidden="true" />
            
            {!userImage && (
                <button onClick={handleFileSelectClick} disabled={useGoogleSearch} className={`absolute bottom-3 left-3 p-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-aether-dark focus:ring-aether-cyan bg-aether-dark/50 text-aether-mid hover:bg-aether-violet hover:text-aether-cyan disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-aether-dark/50`} aria-label="Attach image">
                    <PaperclipIcon className="w-5 h-5" />
                </button>
            )}
            <button onClick={handleMicClick} className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-aether-dark focus:ring-aether-cyan ${isListening ? 'bg-aether-violet text-aether-cyan shadow-cyan-glow animate-pulse' : 'bg-aether-dark/50 text-aether-mid hover:bg-aether-violet hover:text-aether-cyan'}`} aria-label={isListening ? 'Stop recording' : 'Start recording'}>
              <MicrophoneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {userImage && (
            <div className="relative group animate-fade-in-up" style={{ animationDuration: '300ms' }}>
                <p className="text-sm font-medium text-aether-light/70 mb-1.5">Attached Image</p>
                <img src={userImage} alt="Uploaded preview" className="rounded-lg max-h-32 w-full object-cover border border-aether-violet/50" />
                <button 
                    onClick={() => setUserImage(null)} 
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-50 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    aria-label="Remove attached image"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        <div className="space-y-2 p-4 bg-aether-dark/30 rounded-lg border border-aether-violet/20">
            <ToggleSwitch label="Use Google Search" enabled={useGoogleSearch} setEnabled={(val) => { setUseGoogleSearch(val); if (val) setUserImage(null); }} disabled={!!userImage}/>
            {userImage && <p className="text-xs text-aether-mid text-center -mt-1">Google Search is disabled when an image is attached.</p>}
        </div>

        <div className="flex justify-center items-center mt-2">
          <button onClick={onGenerate} disabled={isLoading || !userInput.trim()} className="relative group w-32 h-32 flex items-center justify-center bg-gradient-to-br from-aether-indigo to-aether-dark text-aether-cyan font-bold rounded-full shadow-lg shadow-black/50 transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-aether-violet/30 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105" aria-label="Generate Post">
            <div className="absolute inset-0 border-2 border-aether-violet/50 rounded-full animate-pulse-subtle group-hover:animate-none"></div>
            <div className="absolute inset-1 border border-aether-violet/30 rounded-full"></div>
            <div className="z-10 flex flex-col items-center justify-center">
                {isLoading ? (<><LoaderIcon className="h-8 w-8 text-aether-cyan"/><span className="text-xs mt-2 font-sans">Generating</span></>) : (<><GalaxyIcon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" /><span className="mt-1 font-display tracking-wider">GENERATE</span></>)}
            </div>
          </button>
        </div>
      </div>
      {isIdeasOpen && <IdeaGenerator onSelectIdea={handleSelectIdea} onClose={() => setIsIdeasOpen(false)} />}
    </>
  );
};

export default InputPanel;