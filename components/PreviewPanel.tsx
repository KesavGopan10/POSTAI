import React, { useState, useEffect } from 'react';
import type { GeneratedContent, SocialPlatform, Language } from '../types';
import { CopyIcon, TranslateIcon, CheckIcon, LoaderIcon, GalaxyIcon, ClockIcon, LinkIcon, AlertTriangleIcon } from './icons'; // Assuming AlertTriangleIcon is added to icons
import { translateToEnglish } from '../services/geminiService';

// --- Prop Types ---
interface PreviewPanelProps {
  content: GeneratedContent | null;
  editedContent: string;
  setEditedContent: (value: string) => void;
  platform: SocialPlatform;
  selectedLanguage: Language;
  isLoading: boolean;
  error: string | null;
  onRefine: (instruction: string) => Promise<void>;
  isRefining: string | null; // Keep as string to identify which one is refining
}

// --- Constants ---
const REFINEMENT_OPTIONS = [
    { id: 'shorter', label: 'Condense', instruction: 'Make it shorter and more concise.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" /></svg> },
    { id: 'funnier', label: 'Inject Humor', instruction: 'Make it funnier and more playful.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.75h.008v.008H9V9.75zm6 0h.008v.008H15V9.75z" /></svg> },
    { id: 'professional', label: 'Formalize', instruction: 'Rewrite it in a more professional and formal tone.', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg> },
];

// --- UI Sub-components for different states ---

const InitialView: React.FC = () => (
    <div className="text-center flex flex-col items-center justify-center h-full bg-aether-dark/10 rounded-xl p-4 border border-aether-violet/10">
        <GalaxyIcon className="w-20 h-20 text-aether-violet/30 mb-4 animate-pulse-subtle" />
        <h3 className="text-xl font-bold font-display text-aether-light/80 text-shadow-glow">Awaiting Generation</h3>
        <p className="text-aether-light/50 mt-2 max-w-xs mx-auto">Enter a prompt and generate content to see your preview here.</p>
    </div>
);

const LoadingView: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-aether-light/70">
        <GalaxyIcon className="w-16 h-16 text-aether-cyan/50 animate-spin [animation-duration:5s]" />
        <p className="mt-4 font-display text-lg tracking-widest animate-pulse">Generating Content...</p>
        <div className="w-full max-w-xs h-1 mt-4 bg-aether-violet/30 rounded-full overflow-hidden">
            <div className="h-1 bg-aether-cyan animate-aurora-glow w-full"></div>
        </div>
    </div>
);

const ErrorView: React.FC<{ error: string }> = ({ error }) => (
    <div className="text-center flex flex-col items-center justify-center h-full bg-red-900/20 border border-red-500/30 rounded-xl p-6 animate-fade-in-up" role="alert" aria-live="polite">
        <AlertTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-xl font-bold font-display text-red-400">Generation Failed</h3>
        <p className="text-aether-light/80 mt-2 max-w-sm">{error}</p>
    </div>
);

const ContentDisplay: React.FC<Pick<PreviewPanelProps, 'content' | 'editedContent' | 'setEditedContent' | 'platform' | 'onRefine' | 'isRefining'>> = 
({ content, editedContent, setEditedContent, platform, onRefine, isRefining }) => {
    if (!content) return null;

    const charCount = editedContent.length;
    const charLimit = platform.charLimit;
    const isOverLimit = charLimit > 0 && charCount > charLimit;

    return (
        <div key={content.postText} className={`space-y-6 animate-fade-in-up transition-opacity duration-300 ${isRefining ? 'opacity-60' : 'opacity-100'}`}>
            {content.userImage && (
                <div className="rounded-lg overflow-hidden border border-aether-violet/30 shadow-lg">
                    <img src={content.userImage} alt="Context image" className="max-h-64 w-full object-cover" />
                </div>
            )}
            
            {/* Text Editor */}
            <div className="relative">
                <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-aether-dark/50 border border-aether-violet/50 text-aether-light rounded-lg focus:ring-2 focus:ring-aether-cyan focus:border-aether-cyan p-3 resize-y transition-all duration-300 hover:border-aether-violet backdrop-blur-sm shadow-inner"
                    rows={8}
                    disabled={!!isRefining}
                />
                <div className={`absolute bottom-2 right-3 text-sm font-mono transition-colors ${isOverLimit ? 'text-red-400 font-bold' : 'text-aether-light/60'}`}>
                    {charCount} / {charLimit || '∞'}
                </div>
            </div>
            
            {/* Refinement Options */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-aether-mid tracking-wider uppercase">Refine</h4>
                <div className="flex flex-wrap gap-3">
                    {REFINEMENT_OPTIONS.map(opt => (
                        <div className="group relative" key={opt.id}>
                            <button
                                onClick={() => onRefine(opt.instruction)}
                                disabled={!!isRefining}
                                className="flex items-center justify-center w-11 h-11 bg-aether-indigo/60 text-aether-cyan rounded-lg border border-aether-violet/40 hover:bg-aether-violet hover:border-aether-cyan transition-all duration-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-aether-cyan/80"
                            >
                                {isRefining === opt.instruction ? <LoaderIcon className="w-5 h-5 animate-spin" /> : opt.icon}
                            </button>
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max rounded-md bg-aether-dark/90 px-3 py-1.5 text-xs font-semibold text-aether-light opacity-0 transition-all delay-200 group-hover:opacity-100 pointer-events-none backdrop-blur-sm" role="tooltip">
                                {opt.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Suggestions & Sources */}
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-aether-mid tracking-wider uppercase">Suggestion</h4>
                    <div className="flex items-center gap-3 bg-aether-dark/40 p-3 rounded-lg border border-aether-violet/20 h-full">
                        <ClockIcon className="w-6 h-6 text-aether-cyan flex-shrink-0" />
                        <p className="text-aether-light/90 text-sm"><span className="font-semibold text-white">Best time to post:</span> {content.bestTimeToPost}</p>
                    </div>
                </div>
                 {content.sources && content.sources.length > 0 && (
                     <div className="space-y-3">
                         <h4 className="text-sm font-semibold text-aether-mid tracking-wider uppercase">Sources</h4>
                         <div className="space-y-2">
                             {content.sources.slice(0, 2).map((source, index) => ( // Show max 2 sources to avoid clutter
                                 <a href={source.uri} target="_blank" rel="noopener noreferrer" key={index} className="flex items-start gap-3 bg-aether-dark/40 p-3 rounded-lg border border-aether-violet/20 hover:border-aether-cyan group transition-colors">
                                    <LinkIcon className="w-4 h-4 text-aether-cyan/80 flex-shrink-0 mt-1 group-hover:text-aether-cyan transition-colors" />
                                    <p className="text-aether-light/80 text-xs group-hover:text-white transition-colors truncate" title={source.title}>{source.title || source.uri}</p>
                                 </a>
                             ))}
                         </div>
                     </div>
                )}
            </div>

            {/* Hashtags */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-aether-mid tracking-wider uppercase">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                    {content.hashtags.map((tag, index) => (
                        <span key={index} className="bg-aether-violet/20 text-aether-cyan font-medium px-3 py-1.5 rounded-full text-xs border border-aether-cyan/20 backdrop-blur-sm transition-all hover:bg-aether-cyan/20 hover:text-aether-light cursor-default">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
      </div>
    );
};


// --- Main Panel Component ---
const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, editedContent, setEditedContent, platform, selectedLanguage, isLoading, error, onRefine, isRefining }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Sync edited content when the original content changes
  useEffect(() => {
    if (content) {
      setEditedContent(content.postText);
    } else {
      setEditedContent('');
    }
  }, [content, setEditedContent]);

  const handleCopy = () => {
    if (isCopied) return;
    const textToCopy = `${editedContent}\n\n${content?.hashtags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleTranslate = async () => {
    if (!editedContent || isTranslating) return;
    setIsTranslating(true);
    setTranslationError(null);
    try {
        const translatedText = await translateToEnglish(editedContent);
        setEditedContent(translatedText);
    } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        setTranslationError(message);
        setTimeout(() => setTranslationError(null), 4000); // Longer timeout for errors
    } finally {
        setIsTranslating(false);
    }
  };
  
  const PlatformIcon = platform.icon;
  const headerStyle = platform.brandColor.startsWith('linear-gradient')
    ? { background: platform.brandColor }
    : { backgroundColor: platform.brandColor };
  const headerTextColor = platform.textColor || '#FFFFFF';

  const renderContent = () => {
    if (isLoading) return <LoadingView />;
    if (error) return <ErrorView error={error} />;
    if (!content) return <InitialView />;
    return <ContentDisplay {...{ content, editedContent, setEditedContent, platform, onRefine, isRefining }} />;
  };

  return (
    <div className="bg-aether-indigo/30 backdrop-blur-xl border border-aether-violet/30 p-4 sm:p-6 rounded-2xl shadow-2xl shadow-black/50 w-full h-full flex flex-col">
        {/* Panel Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0 gap-4">
            <div style={headerStyle} className="flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg">
                <PlatformIcon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: headerTextColor }} />
                <h2 className="text-xl sm:text-2xl font-bold font-display" style={{ color: headerTextColor }}>{platform.name} Preview</h2>
            </div>
            {/* Action Toolbar */}
            {content && !isLoading && !error && (
                 <div className="flex items-start gap-2">
                    {selectedLanguage.code !== 'en-US' && (
                        <div className="group relative">
                            <button
                                onClick={handleTranslate}
                                disabled={isTranslating || !!isRefining}
                                className="flex items-center justify-center w-10 h-10 bg-aether-indigo/50 text-aether-mid rounded-lg border border-aether-violet/40 hover:bg-aether-violet hover:text-aether-cyan hover:border-aether-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                aria-label="Translate to English"
                            >
                                {isTranslating ? <LoaderIcon className="h-5 w-5 animate-spin" /> : <TranslateIcon className="w-5 h-5" />}
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 w-max rounded-md bg-aether-dark/90 px-3 py-1.5 text-xs font-semibold text-aether-light opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none backdrop-blur-sm" role="tooltip">Translate to English</div>
                        </div>
                    )}
                    <div className="group relative">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300 transform hover:scale-105 ${isCopied ? 'bg-emerald-500/80 text-white border-emerald-400' : 'bg-aether-indigo/50 text-aether-mid border-aether-violet/40 hover:bg-aether-violet hover:text-aether-cyan hover:border-aether-cyan'}`}
                            aria-label={isCopied ? 'Copied to clipboard' : 'Copy post and hashtags'}
                        >
                            {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 w-max rounded-md bg-aether-dark/90 px-3 py-1.5 text-xs font-semibold text-aether-light opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none backdrop-blur-sm" role="tooltip">{isCopied ? 'Copied!' : 'Copy Post & Hashtags'}</div>
                    </div>
                </div>
            )}
        </div>

        {translationError && (
            <div className="mb-4 -mt-2 text-center text-xs bg-red-500/30 text-red-300 px-3 py-2 rounded-lg border border-red-500/50 animate-fade-in-up" role="alert">
                {translationError}
            </div>
        )}

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto pr-2 -mr-4 custom-scrollbar">
            {renderContent()}
        </div>
    </div>
  );
};

export default PreviewPanel;