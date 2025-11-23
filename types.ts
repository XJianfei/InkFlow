export interface Point {
  x: number;
  y: number;
  pressure?: number; // 0.0 to 1.0
  time?: number;     // Timestamp
}

export interface StrokeSettings {
  size: number;
  thinning: number; // 0.0 to 1.0 (how much velocity affects width)
  smoothing: number; // 0.0 to 1.0
  color: string;
  simulatePressure: boolean;
}

export interface DrawnStroke {
  points: Point[];
  color: string;
  settings: StrokeSettings;
}

export enum ToolType {
  PEN = 'PEN',
  ERASER = 'ERASER',
}