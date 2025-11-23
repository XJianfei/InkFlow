import React, { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { DrawnStroke, StrokeSettings, ToolType } from './types';

const INITIAL_SETTINGS: StrokeSettings = {
  size: 14,
  thinning: 0.75, // High thinning creates strong "Bi-feng" (calligraphy) effect
  smoothing: 0.5,
  color: '#1c1917',
  simulatePressure: true,
};

const App: React.FC = () => {
  const [history, setHistory] = useState<DrawnStroke[]>([]);
  const [redoStack, setRedoStack] = useState<DrawnStroke[]>([]);
  const [settings, setSettings] = useState<StrokeSettings>(INITIAL_SETTINGS);
  const [tool, setTool] = useState<ToolType>(ToolType.PEN);
  const [triggerSave, setTriggerSave] = useState(0);

  // Undo/Redo Handlers
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack(prev => [...prev, last]);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, next]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleHistoryChange = (newHistory: DrawnStroke[]) => {
    setHistory(newHistory);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handleClear = () => {
    if (history.length > 0) {
        setHistory([]);
        setRedoStack([]);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, redoStack]);

  return (
    <div className="relative w-full h-screen bg-stone-100 overflow-hidden font-sans text-stone-900 select-none">
      
      {/* Background Texture/Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Header / Branding */}
      <div className="absolute top-6 left-6 z-40 pointer-events-none select-none">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-800 opacity-90">InkFlow</h1>
        <p className="text-xs text-stone-500 uppercase tracking-widest mt-1 pl-1">Zen Calligraphy Board</p>
      </div>

      <Canvas
        settings={settings}
        tool={tool}
        history={history}
        onHistoryChange={handleHistoryChange}
        triggerSave={triggerSave}
      />

      <Toolbar
        settings={settings}
        setSettings={setSettings}
        tool={tool}
        setTool={setTool}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSave={() => setTriggerSave(prev => prev + 1)}
      />
    </div>
  );
};

export default App;