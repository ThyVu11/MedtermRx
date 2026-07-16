export type ClothConfig = {
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
  cellWidth: number;
  cellHeight: number;
  gravity: number;
  damping: number;
  iterationsPerFrame: number;
  compressFactor: number;
  stretchFactor: number;
  mouseSize: number;
  mouseStrength: number;
  contain: boolean;
  randomSolve: boolean;
};

export type PointerState = {
  mousePos: Vec2;
  hovering: boolean;
  lastMousePos: Vec2;
  soundDistance: number;
};

export type Vec2 = { x: number; y: number };

export type Particle = {
  pos: Vec2;
  oldPos: Vec2;
  velocity: Vec2;
  acceleration: Vec2;
  gravityVector: Vec2;
  pinned: boolean;
  originalPinnedState: boolean;
  id: number;
  char: string;
  downConstraintId?: number;
};

export type ParticleOptions = {
  x: number;
  y: number;
  pinned: boolean;
  id: number;
  char: string;
};

export type Constraint = {
  p1Id: number;
  p2Id: number;
  length: number;
  id: number;
  minLength: number;
  maxLength: number;
};

export type ConstraintOptions = {
  p1Id: number;
  p2Id: number;
  length: number;
  id: number;
  compressFactor: number;
  stretchFactor: number;
};
