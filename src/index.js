import React from 'react';
import { createRoot } from 'react-dom/client';

import HelloWorld from './HelloWorld.js';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<HelloWorld />);

// <App tab="knights" />
