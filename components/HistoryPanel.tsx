
import React from 'react';
import type { HistoryItem, SocialPlatform } from '../types';
import { SOCIAL_PLATFORMS } from '../constants';
import { TrashIcon, XIcon, HistoryIcon } from './icons';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onLoad, onDelete, onClear }) => {

  const getPlatformById = (id: string): SocialPlatform | undefined => {
    return SOCIAL_PLATFORMS.find(p => p.id === id);
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <aside 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-aether-indigo/80 backdrop-blur-xl border-l border-aether-violet/50 shadow-2xl shadow-black/50 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        <header className="flex items-center justify-between p-4 border-b border-aether-violet/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-aether-cyan" />
            <h2 className="text-2xl font-bold font-display text-aether-light">Post History</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-aether-mid hover:bg-aether-violet/50 hover:text-aether-cyan transition-colors"
            aria-label="Close history panel"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        {history.length > 0 ? (
          <>
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-3">
              {history.map(item => {
                const platform = getPlatformById(item.platformId);
                const PlatformIcon = platform?.icon;

                return (
                  <div key={item.id} className="bg-aether-dark/50 p-3 rounded-lg border border-aether-violet/30 hover:border-aether-cyan/50 transition-all group flex gap-4 animate-fade-in-up">
                    {item.userImage && (
                        <div className="w-16 h-16 flex-shrink-0 bg-aether-dark rounded-md overflow-hidden">
                            <img src={item.userImage} alt="User attachment" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-grow overflow-hidden">
                      <div className="flex items-center gap-2">
                          {PlatformIcon && <PlatformIcon className="w-4 h-4 text-aether-mid" />}
                          <p className="text-sm text-aether-light/70 font-medium">{platform?.name || item.platformId}</p>
                      </div>
                      <p className="text-aether-light/90 truncate text-sm mt-1" title={item.postText}>{item.postText}</p>
                      <p className="text-xs text-aether-light/50 mt-1">{new Date(item.date).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => onLoad(item)}
                          className="px-3 py-1 text-xs bg-aether-violet text-aether-cyan rounded-md hover:bg-aether-violet/70 transition-colors"
                        >
                            Load
                        </button>
                        <button 
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 text-aether-mid rounded-md hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            aria-label="Delete item"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <footer className="p-4 border-t border-aether-violet/30 flex-shrink-0">
              <button
                onClick={() => {
                  if(window.confirm("Are you sure you want to clear all post history? This action cannot be undone.")) {
                    onClear();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-900/50 text-red-300 border border-red-500/30 hover:bg-red-800/50 hover:text-white transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Clear All History</span>
              </button>
            </footer>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <HistoryIcon className="w-16 h-16 text-aether-violet/30" />
            <p className="mt-4 text-aether-light/70">No history yet.</p>
            <p className="text-sm text-aether-light/50">Generated posts will appear here.</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default HistoryPanel;