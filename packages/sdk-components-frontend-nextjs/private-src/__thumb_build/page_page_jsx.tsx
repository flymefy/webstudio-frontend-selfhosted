import React from 'react';
import { createRoot } from 'react-dom/client';
import { PagePageJsx } from '../components';
function App(){ return (
    <div>
      <PagePageJsx />
    </div>
  ); }
const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(<App />);
