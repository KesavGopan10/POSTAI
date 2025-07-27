/**
 * Type declarations for the apiKeyStorage module
 */

// Export the functions directly instead of using a module declaration
export function storeApiKey(key: string): void;

export function getApiKey(): string | null;

export function clearApiKey(): void;

export function isValidApiKey(key: string | null): boolean;