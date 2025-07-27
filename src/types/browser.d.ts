// Type definitions for browser extension APIs
declare namespace chrome {
  namespace runtime {
    interface Manifest {
      // Add any manifest properties you need
      [key: string]: any;
    }
    function getManifest(): Manifest;
  }
}

// This makes the chrome object available globally
declare const chrome: {
  runtime: {
    getManifest: () => any;
  };
} | undefined;
