import { useState, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import PreviewPanel from './components/PreviewPanel';
import HistoryPanel from './components/HistoryPanel';
import { SOCIAL_PLATFORMS, SUPPORTED_LANGUAGES, TONES } from './constants';
import { generatePostContent, refinePostText } from './services/geminiService';
import type { SocialPlatform, Language, GeneratedContent, Tone, HistoryItem } from './types';
import { HistoryIcon, LogoIcon } from './components/icons';
import { getApiKey, storeApiKey, clearApiKey, isValidApiKey } from './src/utils/apiKeyStorage';
import { SettingsModal } from './src/components/SettingsModal';

const MAX_HISTORY_ITEMS = 20;

function App() {
  const [userInput, setUserInput] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>(() => SOCIAL_PLATFORMS.find(p => p.id === localStorage.getItem('social-gen-platform')) || SOCIAL_PLATFORMS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => SUPPORTED_LANGUAGES.find(l => l.code === localStorage.getItem('social-gen-language')) || SUPPORTED_LANGUAGES[0]);
  const [selectedTone, setSelectedTone] = useState<Tone>(() => TONES.find(t => t.id === localStorage.getItem('social-gen-tone')) || TONES[0]);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(() => getApiKey());
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(!getApiKey());
  const [hasExtensions, setHasExtensions] = useState<boolean>(false);

  useEffect(() => {
    const checkForExtensions = () => {
      try {
        const chrome = (window as any).chrome;
        if (chrome?.runtime?.getManifest) {
          const manifest = chrome.runtime.getManifest();
          if (manifest && Object.keys(manifest).length > 0) {
            setHasExtensions(true);
          }
        }
      } catch (e) {
        console.log('Running in a secure environment');
      }
    };
    checkForExtensions();
  }, []);

  useEffect(() => {
    localStorage.setItem('social-gen-platform', selectedPlatform.id);
  }, [selectedPlatform]);

  useEffect(() => {
    localStorage.setItem('social-gen-language', selectedLanguage.code);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('social-gen-tone', selectedTone.id);
  }, [selectedTone]);

  // Load history from localStorage on initial render
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedHistory = localStorage.getItem('social-gen-history');
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          console.log('Loaded history from localStorage:', parsedHistory);
          
          // Ensure we have a valid array with the expected structure
          if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
            // Filter out any invalid entries and ensure required fields exist
            const validHistory = parsedHistory.filter(item => 
              item && 
              typeof item.id === 'string' && 
              item.postText && // Changed from content to postText
              item.platformId && 
              item.date // Changed from timestamp to date
            );
            
            console.log('Valid history items:', validHistory);
            setHistory(validHistory);
            return;
          }
        }
        // If we get here, either no history or invalid history
        console.log('No valid history found in localStorage');
        setHistory([]);
      } catch (e) {
        console.error("Failed to load history from localStorage", e);
        // Clear corrupted history
        localStorage.removeItem('social-gen-history');
        setHistory([]);
      }
    };
    
    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(loadHistory, 100);
    return () => clearTimeout(timer);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    const saveHistory = () => {
      try {
        console.log('Saving history to localStorage:', history);
        localStorage.setItem('social-gen-history', JSON.stringify(history));
      } catch (e) {
        console.error("Failed to save history to localStorage", e);
      }
    };
    
    // Only save if history is not empty
    if (history.length > 0) {
      saveHistory();
    }
  }, [history]);

  const handleGenerate = async () => {
    if (!userInput.trim()) return;

    if (!validateApiKey()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    let imageForApi;
    if (userImage) {
      const [meta, base64Data] = userImage.split(',');
      const mimeType = meta.match(/:(.*?);/)?.[1];
      if (mimeType && base64Data) {
        imageForApi = { mimeType, data: base64Data };
      }
    }

    try {
      const apiResult = await generatePostContent(
        userInput,
        selectedPlatform,
        selectedLanguage.name,
        selectedTone.instruction,
        {
          useGoogleSearch,
          image: imageForApi,
        }
      );

      const newContent = {
        ...apiResult,
        userImage: userImage,
      };

      setGeneratedContent(newContent);

      const newHistoryItem = {
        id: Date.now().toString(),
        userInput,
        platformId: selectedPlatform.id,
        languageCode: selectedLanguage.code,
        toneId: selectedTone.id,
        useGoogleSearch,
        date: new Date().toISOString(),
        ...newContent
      };

      setHistory(prev => [newHistoryItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!editedContent || isRefining) return;

    setIsRefining(instruction);
    setError(null);

    try {
      const refinedText = await refinePostText(editedContent, selectedPlatform, selectedLanguage.name, instruction);
      setEditedContent(refinedText);
      if (generatedContent) {
        setGeneratedContent(prev => prev ? ({ ...prev, postText: refinedText }) : null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during refinement.";
      setError(message);
      console.error(err);
    } finally {
      setIsRefining(null);
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === item.platformId) || SOCIAL_PLATFORMS[0];
    const language = SUPPORTED_LANGUAGES.find(l => l.code === item.languageCode) || SUPPORTED_LANGUAGES[0];
    const tone = TONES.find(t => t.id === item.toneId) || TONES[0];

    setSelectedPlatform(platform);
    setSelectedLanguage(language);
    setSelectedTone(tone);
    setUserInput(item.userInput);
    setUseGoogleSearch(item.useGoogleSearch);
    setUserImage(item.userImage);
    setGeneratedContent({
      postText: item.postText,
      hashtags: item.hashtags,
      bestTimeToPost: item.bestTimeToPost,
      sources: item.sources,
      userImage: item.userImage,
    });
    setError(null);
    setIsHistoryOpen(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleApiKeySet = (key: string) => {
    if (key) {
      storeApiKey(key);
      setApiKey(key);
      setShowApiKeyPrompt(false);
      setError(null);
      setIsSettingsOpen(false);
    } else {
      clearApiKey();
      setApiKey(null);
      setShowApiKeyPrompt(true);
    }
  };

  const validateApiKey = (): boolean => {
    if (!apiKey) {
      setError('Please set your API key in settings first');
      setIsSettingsOpen(true);
      return false;
    }
    if (!isValidApiKey(apiKey)) {
      setError('Invalid API key format. Please check your API key and try again.');
      return false;
    }
    return true;
  };

  const settingsButton = (
    <button
      onClick={() => setIsSettingsOpen(true)}
      className="p-2 rounded-full text-aether-mid hover:text-aether-cyan hover:bg-aether-violet/30 transition-all duration-300 absolute top-0 left-0"
      aria-label="Open settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );

  return (
    <>
      <div className="text-aether-light p-4 sm:p-6 lg:p-8 font-sans min-h-screen flex flex-col">
        <div className="container mx-auto max-w-screen-2xl flex-grow flex flex-col">
          <header className="relative text-center mb-8 md:mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-center items-center gap-4">
              <LogoIcon className="w-12 h-12 sm:w-14 sm:h-14" />
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-aether-cyan to-aether-mid">
                POSTAI
              </h1>
            </div>
            <p className="mt-4 text-lg sm:text-xl text-aether-light/70 max-w-3xl mx-auto text-shadow-glow">
              Craft perfect, multilingual posts with AI for any platform.
            </p>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="absolute top-0 right-0 p-2 rounded-full text-aether-mid hover:text-aether-cyan hover:bg-aether-violet/30 transition-all duration-300"
              aria-label="Open post history"
            >
              <HistoryIcon className="w-8 h-8" />
            </button>
            {settingsButton}
          </header>

          {showApiKeyPrompt && (
            <div className="bg-aether-dark/80 backdrop-blur-sm border-l-4 border-aether-cyan p-6 mx-6 my-8 rounded-lg shadow-lg animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="h-6 w-6 text-aether-cyan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-aether-cyan mb-2">Welcome to AI Post Generator</h3>
                  <div className="text-aether-light/90">
                    <p>To start creating amazing social media content, you'll need to add your Google Gemini API key.</p>
                    {hasExtensions && (
                      <div className="mt-3 p-3 bg-aether-violet/20 border border-aether-violet/30 rounded">
                        <p className="text-sm text-aether-light/90">
                          <span className="font-semibold text-aether-cyan">Security Tip:</span> For better security, we recommend using a dedicated API key with limited permissions.
                        </p>
                      </div>
                    )}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-aether-cyan text-aether-dark hover:bg-aether-cyan/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aether-cyan/50"
                      >
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Add API Key
                      </button>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg border border-aether-mid text-aether-light hover:bg-aether-mid/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aether-cyan/50"
                      >
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Get API Key
                      </a>
                    </div>
                    <p className="mt-4 text-xs text-aether-mid">
                      Your API key is stored securely in your browser and never sent to our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 flex-grow animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="lg:col-span-5 flex flex-col">
              <InputPanel
                userInput={userInput}
                setUserInput={setUserInput}
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
                selectedTone={selectedTone}
                setSelectedTone={setSelectedTone}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                useGoogleSearch={useGoogleSearch}
                setUseGoogleSearch={setUseGoogleSearch}
                userImage={userImage}
                setUserImage={setUserImage}
              />
            </div>
            <div className="lg:col-span-7 flex flex-col">
              <PreviewPanel
                content={generatedContent}
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                platform={selectedPlatform}
                selectedLanguage={selectedLanguage}
                isLoading={isLoading}
                error={error}
                onRefine={handleRefine}
                isRefining={isRefining}
              />
            </div>
          </main>

          <footer className="text-center mt-12 text-aether-light/40 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <p>Visit and Give us a star on <a href="https://github.com/KesavGopan10/POSTAI" target="_blank" rel="noopener noreferrer" className="text-aether-cyan hover:text-aether-cyan/80 transition-colors duration-200">GitHub</a> | POSTAI</p>
          </footer>
        </div>
      </div>

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={handleLoadHistory}
        onDelete={handleDeleteHistoryItem}
        onClear={handleClearHistory}
      />

      {isSettingsOpen && (
        <SettingsModal
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onApiKeySet={handleApiKeySet}
          initialApiKey={apiKey || ''}
        />
      )}
    </>
  );
}

export default App;
