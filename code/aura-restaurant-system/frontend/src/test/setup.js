import '@testing-library/jest-dom';

// Mock import.meta.glob for menuImages.js
global.import = { meta: { glob: () => ({}) } };
