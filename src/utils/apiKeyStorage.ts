/**
 * Utility functions for storing, retrieving, and validating the API key in local storage.
 * Includes basic obfuscation to prevent casual inspection.
 */

const STORAGE_KEY = 'social_gen_api_key';

/**
 * Store the API key in local storage with basic obfuscation
 * @param key The API key to store
 */
export const storeApiKey = (key: string): void => {
  try {
    // Simple obfuscation by reversing the string and adding a prefix
    const obfuscatedKey = `obf_${key.split('').reverse().join('')}`;
    localStorage.setItem(STORAGE_KEY, obfuscatedKey);
  } catch (error) {
    console.error('Failed to store API key:', error);
    throw new Error('Failed to store API key');
  }
};

/**
 * Retrieve the API key from local storage
 * @returns The API key or null if not found
 */
export const getApiKey = (): string | null => {
  try {
    const obfuscatedKey = localStorage.getItem(STORAGE_KEY);
    if (!obfuscatedKey) return null;
    
    // Remove the obfuscation prefix and reverse the string
    if (obfuscatedKey.startsWith('obf_')) {
      return obfuscatedKey.slice(4).split('').reverse().join('');
    }
    
    // For backward compatibility with previously stored un-obfuscated keys
    return obfuscatedKey;
  } catch (error) {
    console.error('Failed to retrieve API key:', error);
    return null;
  }
};

/**
 * Remove the API key from local storage
 */
export const clearApiKey = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear API key:', error);
    throw new Error('Failed to clear API key');
  }
};

/**
 * Validate the format of an API key
 * @param key The API key to validate
 * @returns boolean indicating if the key is valid
 */
export const isValidApiKey = (key: string | null): boolean => {
  if (!key) return false;
  
  // Basic validation - Google Gemini API keys are typically 39 characters long
  // and start with 'AIza'
  const apiKeyPattern = /^AIza[0-9A-Za-z\-_]{35}$/;
  return apiKeyPattern.test(key);
};

// TypeScript type declarations
declare global {
  interface Window {
    // Add any global window properties if needed
  }
}