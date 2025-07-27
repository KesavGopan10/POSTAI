import { useState, useEffect } from 'react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onApiKeySet: (key: string) => void;
  initialApiKey?: string;
}

export function SettingsModal({ open, onClose, onApiKeySet, initialApiKey = '' }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [hasExtensions, setHasExtensions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const securityTips = [
    'Use a dedicated API key with limited permissions for this application',
    'Enable incognito/private browsing mode when entering sensitive information',
    'Regularly rotate your API keys and monitor usage',
    'Never share API keys or use them on untrusted websites'
  ];

  useEffect(() => {
    setIsSecure(window.location.protocol === 'https:');

    const checkSecurity = async () => {
      try {
        if (typeof (window as any).chrome?.runtime?.getManifest === 'function') {
          const manifest = (window as any).chrome.runtime.getManifest();
          if (manifest && Object.keys(manifest).length > 0) {
            console.warn('Browser extensions detected. For maximum security, use Incognito/Private mode.');
            setHasExtensions(true);
          }
        }

        const extensionIndicators = [
          'chrome-extension://',
          'moz-extension://',
          'safari-extension://',
          'ms-browser-extension://'
        ];

        const hasExtensionScripts = Array.from(document.scripts).some(script =>
          extensionIndicators.some(indicator => script.src.includes(indicator))
        );

        if (hasExtensionScripts) {
          setHasExtensions(true);
        }
      } catch (e) {
        console.log('Security check completed');
      }
    };

    if (open) {
      checkSecurity();
    }
  }, [open]);

  useEffect(() => {
    setApiKey(initialApiKey);
  }, [initialApiKey]);

  const handleSave = async () => {
    if (apiKey.trim()) {
      setIsLoading(true);
      // Simulate API validation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onApiKeySet(apiKey.trim());
      setIsLoading(false);
      onClose();
    }
  };

  const handleClear = () => {
    setApiKey('');
    onApiKeySet('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && apiKey.trim() && !isLoading) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    let maxScore = 3;

    if (isSecure) score += 1;
    if (!hasExtensions) score += 1;
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) score += 1;

    return { score, maxScore };
  };

  const { score, maxScore } = getSecurityScore();
  const securityLevel = score === maxScore ? 'high' : score >= maxScore - 1 ? 'medium' : 'low';

  const isValidApiKey = apiKey.trim().length > 20 && apiKey.startsWith('AIza');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                <svg className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">API Configuration</h2>
                <p className="text-slate-400">Secure your Google Gemini integration</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6 space-y-8">
            {/* API Key Input - Moved to Top */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="api-key" className="text-lg font-semibold text-white flex items-center space-x-2">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Google Gemini API Key</span>
                </label>
              </div>
              
              <div className="relative group">
                <input
                  type={showApiKey ? "text" : "password"}
                  id="api-key"
                  className={`w-full px-4 py-4 bg-slate-800/60 border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 pr-12 ${
                    isValidApiKey 
                      ? 'border-green-500/50 focus:border-green-400 focus:ring-2 focus:ring-green-500/20' 
                      : apiKey.trim() 
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } hover:border-slate-500/70`}
                  placeholder="Paste your API key here (AIza...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Validation indicator */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  {apiKey.trim() && (
                    isValidApiKey ? (
                      <div className="p-1 bg-green-500/20 rounded-full">
                        <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="p-1 bg-red-500/20 rounded-full">
                        <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )
                  )}
                </div>

<button
  type="button"
  onClick={() => setShowApiKey(!showApiKey)}
  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-aether-cyan hover:text-aether-light transition-colors rounded-lg hover:bg-aether-violet/50"
  aria-label={showApiKey ? "Hide API key" : "Show API key"}
>
  {showApiKey ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )}
</button>
</div>

              {/* Validation message */}
              <div className="flex items-center space-x-2 text-sm">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-slate-400">
                  {apiKey.trim() ? (
                    isValidApiKey ? (
                      <span className="text-green-400">✓ Valid API key format detected</span>
                    ) : (
                      <span className="text-red-400">⚠ Invalid format - should start with 'AIza'</span>
                    )
                  ) : (
                    'Your API key is stored locally and encrypted in your browser'
                  )}
                </span>
              </div>

              {/* Action Buttons - Now directly below input */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!apiKey.trim() || isLoading}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    apiKey.trim() && !isLoading
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-[1.02]'
                      : 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                      <span>Saving...</span>
                    </>
                  ) : apiKey.trim() ? (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save & Continue</span>
                    </>
                  ) : (
                    <span>Enter API Key</span>
                  )}
                </button>

                {initialApiKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-6 py-3.5 border-2 border-slate-600/50 text-slate-300 rounded-xl hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 font-semibold hover:scale-105"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Security Status */}
            <div className={`p-5 rounded-xl border-l-4 backdrop-blur-sm ${
              securityLevel === 'high'
                ? 'bg-green-500/10 border-green-500 text-green-100'
                : securityLevel === 'medium'
                ? 'bg-yellow-500/10 border-yellow-500 text-yellow-100'
                : 'bg-red-500/10 border-red-500 text-red-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-full ${
                    securityLevel === 'high'
                      ? 'bg-green-500/20'
                      : securityLevel === 'medium'
                      ? 'bg-yellow-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {securityLevel === 'high' ? (
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : securityLevel === 'medium' ? (
                      <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      Security Level: {securityLevel === 'high' ? 'High' : securityLevel === 'medium' ? 'Medium' : 'Low'}
                    </h3>
                    <p className="opacity-90">Security Score: {score}/{maxScore}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    securityLevel === 'high' ? 'text-green-400' : 
                    securityLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {Math.round((score / maxScore) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Security Checklist */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Security Checklist</span>
              </h3>

              <div className="grid grid-cols-1 gap-3">
                <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  isSecure ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isSecure ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      {isSecure ? (
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">HTTPS Connection</p>
                      <p className="text-sm text-slate-400">
                        {isSecure ? 'Secure connection established' : 'Insecure connection - use HTTPS'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  !hasExtensions ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${!hasExtensions ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                      {!hasExtensions ? (
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">Browser Extensions</p>
                      <p className="text-sm text-slate-400">
                        {!hasExtensions
                          ? 'No suspicious extensions detected'
                          : 'Extensions detected - consider using incognito mode'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Best Practices */}
            <div className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl backdrop-blur-sm">
              <h3 className="text-blue-400 font-bold mb-4 flex items-center space-x-2 text-lg">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>🛡️ Security Best Practices</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {securityTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-slate-300 text-sm leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to get API key */}
            <div className="p-5 bg-slate-800/30 border border-slate-600/50 rounded-xl">
              <h3 className="text-white font-bold mb-4 flex items-center space-x-2 text-lg">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>How to get your API key</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { step: "Visit", text: "Google AI Studio", link: "https://aistudio.google.com/" },
                  { step: "Sign in", text: "with your Google account" },
                  { step: "Navigate", text: "to 'API Keys' in the left sidebar" },
                  { step: "Click", text: "'Create API Key' button" },
                  { step: "Copy", text: "the generated key and paste it above" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 text-sm font-bold rounded-full flex items-center justify-center border border-blue-500/30">
                      {index + 1}
                    </div>
                    <span className="text-slate-300">
                      <strong className="text-white">{item.step}</strong> {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors font-medium">
                          {item.text}
                        </a>
                      ) : item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}