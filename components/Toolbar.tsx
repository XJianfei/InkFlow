import React from 'react';
import { Button } from './Button';
import { StrokeSettings, ToolType } from '../types';
import { 
  Undo, 
  Redo, 
  Trash2, 
  Download, 
  Eraser, 
  PenTool, 
  Minus, 
  Circle 
} from 'lucide-react';

interface ToolbarProps {
  settings: StrokeSettings;
  setSettings: (s: StrokeSettings) => void;
  tool: ToolType;
  setTool: (t: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
}

const PRESET_COLORS = [
  '#1c1917', // Stone 900 (Ink)
  '#dc2626', // Red 600 (Stamp red)
  '#2563eb', // Blue
  '#16a34a', // Green
  '#ea580c', // Orange
];

export const Toolbar: React.FC<ToolbarProps> = ({
  settings,
  setSettings,
  tool,
  setTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSave,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-xl border border-stone-200 rounded-2xl p-3 flex flex-col md:flex-row gap-4 items-center z-50 max-w-[95vw] overflow-x-auto">
      
      {/* Tools Group */}
      <div className="flex items-center gap-2 border-r border-stone-200 pr-4">
        <Button 
          variant={tool === ToolType.PEN ? 'primary' : 'ghost'} 
          onClick={() => setTool(ToolType.PEN)}
          icon={<PenTool size={18} />}
          title="Ink Pen"
        />
        <Button 
          variant={tool === ToolType.ERASER ? 'primary' : 'ghost'} 
          onClick={() => setTool(ToolType.ERASER)}
          icon={<Eraser size={18} />}
          title="Eraser"
        />
      </div>

      {/* Settings Group */}
      {tool === ToolType.PEN && (
        <div className="flex items-center gap-4 border-r border-stone-200 pr-4">
          
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSettings({ ...settings, color })}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-stone-400 ${
                  settings.color === color ? 'ring-2 ring-offset-1 ring-stone-800 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
             <div className="relative w-6 h-6 rounded-full overflow-hidden border border-stone-300 ml-1">
                <input 
                    type="color" 
                    value={settings.color} 
                    onChange={(e) => setSettings({...settings, color: e.target.value})}
                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                />
            </div>
          </div>

          {/* Size Slider */}
          <div className="flex items-center gap-2">
            <Minus size={14} className="text-stone-400" />
            <input
              type="range"
              min="2"
              max="50"
              value={settings.size}
              onChange={(e) => setSettings({ ...settings, size: Number(e.target.value) })}
              className="w-24 h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-800"
            />
            <Circle 
                size={settings.size} 
                className="text-stone-800 fill-stone-800" 
                style={{ width: Math.min(20, Math.max(8, settings.size / 2)), height: Math.min(20, Math.max(8, settings.size / 2)) }} 
            />
          </div>
        </div>
      )}

      {/* Actions Group */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          onClick={onUndo} 
          disabled={!canUndo} 
          className={!canUndo ? 'opacity-30' : ''}
          icon={<Undo size={18} />}
        />
        <Button 
          variant="ghost" 
          onClick={onRedo} 
          disabled={!canRedo}
          className={!canRedo ? 'opacity-30' : ''}
          icon={<Redo size={18} />}
        />
        <div className="w-px h-6 bg-stone-200 mx-1"></div>
        <Button 
          variant="danger" 
          onClick={onClear}
          icon={<Trash2 size={18} />}
          title="Clear Board"
        />
        <Button 
          variant="secondary" 
          onClick={onSave}
          icon={<Download size={18} />}
          title="Save as Image"
        />
      </div>
    </div>
  );
};