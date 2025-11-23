import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, StrokeSettings, DrawnStroke, ToolType } from '../types';
import { getStrokeOutlinePoints, getSvgPathFromStroke } from '../utils/ink';

interface CanvasProps {
  settings: StrokeSettings;
  tool: ToolType;
  history: DrawnStroke[];
  onHistoryChange: (history: DrawnStroke[]) => void;
  triggerSave: number; // Increment to trigger save
}

export const Canvas: React.FC<CanvasProps> = ({ 
  settings, 
  tool, 
  history, 
  onHistoryChange,
  triggerSave 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for the stroke currently being drawn
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const isDrawing = useRef(false);

  // ---------------------------------------------------------------------------
  // Helper: Calculate Input Point with Simulated Pressure
  // ---------------------------------------------------------------------------
  const getPoint = useCallback((e: React.PointerEvent | PointerEvent, pointsBuffer: Point[]): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = performance.now();
    
    // Start with device pressure if available (0.5 is mouse default usually)
    let pressure = e.pressure;
    
    // If pressure is neutral (mouse/trackpad), simulate it based on velocity
    if (pressure === 0 || pressure === 0.5) {
        if (pointsBuffer.length > 0) {
            const last = pointsBuffer[pointsBuffer.length - 1];
            const dist = Math.hypot(x - last.x, y - last.y);
            const dt = t - (last.time || 0);
            
            // Velocity = pixels / ms
            const velocity = dist / (dt || 1);
            
            // Map velocity to pressure: 
            // Faster (> 2.0) -> Thinner (Low Pressure)
            // Slower (< 0.1) -> Thicker (High Pressure)
            const maxV = 2.5; 
            const normalizedV = Math.min(velocity, maxV) / maxV;
            
            // Inverse relationship
            pressure = Math.max(0.1, Math.min(1.0, 1.0 - normalizedV));
        } else {
            pressure = 0.5;
        }
    }

    return { x, y, pressure, time: t };
  }, []);

  // ---------------------------------------------------------------------------
  // Helper: Draw Stroke to Context
  // ---------------------------------------------------------------------------
  const drawStrokeToCtx = (ctx: CanvasRenderingContext2D, points: Point[], color: string, opts: StrokeSettings) => {
    if (points.length < 2) return;
    
    const outline = getStrokeOutlinePoints(points, opts);
    const pathData = getSvgPathFromStroke(outline);
    
    const p = new Path2D(pathData);
    ctx.fillStyle = color;
    ctx.fill(p);
  };

  // ---------------------------------------------------------------------------
  // Main Render Function
  // ---------------------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    // Clear logic: canvas is sized by logic pixels * DPR, so we assume transforms are set
    // Reset transform to clear everything safely then restore
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 1. Draw History
    history.forEach(stroke => {
      ctx.save();
      if (stroke.color === 'eraser') {
        // Destination-out acts as an eraser for the canvas content
        ctx.globalCompositeOperation = 'destination-out';
        drawStrokeToCtx(ctx, stroke.points, '#000000', stroke.settings);
      } else {
        ctx.globalCompositeOperation = 'source-over';
        drawStrokeToCtx(ctx, stroke.points, stroke.color, stroke.settings);
      }
      ctx.restore();
    });

    // 2. Draw Current Stroke
    if (currentPoints.length > 0) {
      ctx.save();
      if (tool === ToolType.ERASER) {
         ctx.globalCompositeOperation = 'destination-out';
         drawStrokeToCtx(ctx, currentPoints, '#000000', settings);
      } else {
         ctx.globalCompositeOperation = 'source-over';
         drawStrokeToCtx(ctx, currentPoints, settings.color, settings);
      }
      ctx.restore();
    }
  }, [history, currentPoints, settings, tool]);

  // ---------------------------------------------------------------------------
  // Effects: Resize & Redraw
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        renderCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial Setup

    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]); // Dependent on renderCanvas

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, currentPoints]); // Trigger when points update or history/tool changes

  // ---------------------------------------------------------------------------
  // Pointer Events
  // ---------------------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    
    // Start new stroke
    const pt = getPoint(e, []);
    pt.pressure = 0.1; // Force light start for "Bi-feng" entrance
    setCurrentPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    
    // Use Coalesced Events for higher precision if available
    let events: Array<React.PointerEvent | PointerEvent> = [e];

    const nativeEvent = e.nativeEvent;
    if (nativeEvent instanceof PointerEvent && typeof nativeEvent.getCoalescedEvents === 'function') {
      const coalesced = nativeEvent.getCoalescedEvents();
      if (coalesced.length > 0) {
        events = coalesced;
      }
    }
    
    setCurrentPoints(prev => {
        const next = [...prev];
        for (const evt of events) {
            const pt = getPoint(evt, next);
            // Skip duplicate points to avoid div-by-zero in velocity calc
            if (next.length > 0) {
                const last = next[next.length - 1];
                if (Math.hypot(pt.x - last.x, pt.y - last.y) < 1) continue;
            }
            next.push(pt);
        }
        return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Commit stroke to history
    if (currentPoints.length > 1) {
        const newStroke: DrawnStroke = {
            points: currentPoints,
            color: tool === ToolType.ERASER ? 'eraser' : settings.color,
            settings: { ...settings }
        };
        onHistoryChange([...history, newStroke]);
    }
    setCurrentPoints([]);
  };

  // ---------------------------------------------------------------------------
  // Image Saving
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (triggerSave === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
            // Draw White Background
            tCtx.fillStyle = '#f5f5f4';
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            // Composite original canvas
            tCtx.drawImage(canvas, 0, 0);
            
            const link = document.createElement('a');
            link.download = `inkflow-sketch-${Date.now()}.png`;
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        }
    }
  }, [triggerSave]);

  return (
    <div ref={containerRef} className="absolute inset-0 touch-none cursor-crosshair">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="block touch-none w-full h-full"
      />
    </div>
  );
};