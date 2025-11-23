import { Point, StrokeSettings } from '../types';

/**
 * Calculates the distance between two points.
 */
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Linearly interpolates between two values.
 */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Adds two vectors.
 */
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });

/**
 * Subtracts vector b from vector a.
 */
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });

/**
 * Multiplies vector by scalar.
 */
const mul = (a: Point, n: number): Point => ({ x: a.x * n, y: a.y * n });

/**
 * Returns the perpendicular vector.
 */
const perp = (a: Point): Point => ({ x: a.y, y: -a.x });

/**
 * Normalizes a vector.
 */
const normalize = (a: Point): Point => {
  const d = Math.hypot(a.x, a.y);
  return d === 0 ? { x: 0, y: 0 } : { x: a.x / d, y: a.y / d };
};

/**
 * Core algorithm to generate a polygon outline from a set of points
 * simulating a pressure-sensitive brush (Bi-feng).
 */
export function getStrokeOutlinePoints(points: Point[], options: StrokeSettings): Point[] {
  if (points.length < 2) return [];

  const { size, thinning } = options;
  const leftPts: Point[] = [];
  const rightPts: Point[] = [];

  let prevPressure = points[0].pressure || 0.5;
  let prevVector = normalize(sub(points[1], points[0]));

  // Curve smoothing and width calculation
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    
    // Calculate pressure based on velocity if not provided
    let pressure = curr.pressure ?? 0.5;
    
    // Tapering: Force start and end pressure to simulate "Bi-feng" (sharp tip)
    // The taper length is dynamic based on stroke length to ensure short dots look like dots
    const taperLength = Math.min(5, Math.floor(points.length / 3));
    
    if (i < taperLength) {
        // Ease out quart for sharper start
        const t = i / taperLength;
        pressure *= (1 - Math.pow(1 - t, 3)); 
    } else if (i > points.length - 1 - taperLength) {
        // Ease out quart for sharper end
        const t = (points.length - 1 - i) / taperLength;
        pressure *= (1 - Math.pow(1 - t, 3));
    }

    // Smooth pressure jitter
    pressure = lerp(prevPressure, pressure, 0.5);
    prevPressure = pressure;

    // Calculate stroke width at this point
    // Logic: Higher pressure (slower speed) -> Thicker line
    // thinning factor controls dynamic range.
    const width = size * (1 - thinning * (1 - pressure)); 

    // Calculate Normal Vector for the offset
    let vector: Point;
    if (i < points.length - 1) {
        vector = normalize(sub(points[i + 1], curr));
    } else {
        vector = prevVector;
    }
    
    // Average with previous vector for smoother turns (Simple moving average)
    const smoothVector = normalize(add(vector, prevVector));
    prevVector = vector;

    const normal = perp(smoothVector);
    const offset = mul(normal, width / 2); // Half width to each side

    leftPts.push(sub(curr, offset));
    rightPts.push(add(curr, offset));
  }

  // Construct the polygon: Left points forward -> Right points backward (reverse)
  // Close the loop
  return [...leftPts, ...rightPts.reverse()];
}

/**
 * Converts a polygon point array to an SVG Path string.
 * Uses quadratic bezier curves to round the edges of the polygon.
 */
export function getSvgPathFromStroke(strokePoints: Point[]): string {
  if (strokePoints.length === 0) return "";

  const len = strokePoints.length;
  // Start at the first point
  let d = `M ${strokePoints[0].x.toFixed(2)} ${strokePoints[0].y.toFixed(2)}`;

  // Loop through points using midpoints as curve anchors for smoothness
  for (let i = 1; i < len; i++) {
    const p1 = strokePoints[i];
    const p2 = strokePoints[(i + 1) % len]; // Wrap around to close
    
    // Calculate midpoint
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    
    // Quadratic bezier from current point (handled by loop) to mid, using p1 as control
    // Wait, actually standard smoothing is: 
    // From previous midpoint to next midpoint, using current point as control.
    // Our points define the polygon vertices. To make it round, we can cut corners.
    
    d += ` Q ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}, ${mid.x.toFixed(2)} ${mid.y.toFixed(2)}`;
  }

  d += " Z"; // Close path
  return d;
}