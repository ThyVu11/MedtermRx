import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import Svg, { G, Text as SvgText } from "react-native-svg";

type CodeClothProps = {
  code?: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  gravity?: number;
  damping?: number;
};

type SimulationConfig = {
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
  touchRadiusSquared: number;
  touchStrength: number;
};

type ParticleOptions = {
  x: number;
  y: number;
  pinned: boolean;
  id: number;
  char: string;
};

const DEFAULT_CODE = `export default function App() {
  return <CodeCloth />;
}`;

const getPointId = (row: number, column: number, gridHeight: number) =>
  column * gridHeight + row;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

class Vec2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  reset(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  zero() {
    this.reset(0, 0);
  }

  add(vector: Vec2) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }
}

class Particle {
  pos: Vec2;
  oldPos: Vec2;
  velocity = new Vec2();
  acceleration = new Vec2();
  gravityVector = new Vec2();
  pinned: boolean;
  originalPinnedState: boolean;
  id: number;
  char: string;
  downConstraint?: Constraint;

  constructor(options: ParticleOptions) {
    this.pos = new Vec2(options.x, options.y);
    this.oldPos = new Vec2(options.x, options.y);
    this.pinned = options.pinned;
    this.originalPinnedState = options.pinned;
    this.id = options.id;
    this.char = options.char;
  }

  update(deltaMs: number, config: SimulationConfig) {
    if (this.pinned) {
      this.acceleration.zero();
      return;
    }

    this.velocity.reset(
      (this.pos.x - this.oldPos.x) * config.damping,
      (this.pos.y - this.oldPos.y) * config.damping,
    );

    this.oldPos.reset(this.pos.x, this.pos.y);

    const normalizedDelta = clamp(deltaMs / 16.667, 0.25, 2);
    const deltaSquared = normalizedDelta * normalizedDelta;

    this.gravityVector.reset(0, config.gravity);
    this.acceleration.add(this.gravityVector);

    this.pos.x += this.velocity.x + this.acceleration.x * deltaSquared;
    this.pos.y += this.velocity.y + this.acceleration.y * deltaSquared;
    this.acceleration.zero();
  }

  applyForce(x: number, y: number) {
    this.acceleration.x += x;
    this.acceleration.y += y;
  }
}

class Constraint {
  minLength: number;
  maxLength: number;

  constructor(
    public p1: Particle,
    public p2: Particle,
    public length: number,
    compressFactor: number,
    stretchFactor: number,
  ) {
    this.minLength = length * compressFactor;
    this.maxLength = length * stretchFactor;
  }

  solve() {
    const dx = this.p2.pos.x - this.p1.pos.x;
    const dy = this.p2.pos.y - this.p1.pos.y;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) return;

    let targetLength = this.length;
    if (distance < this.minLength) targetLength = this.minLength;
    else if (distance > this.maxLength) targetLength = this.maxLength;
    else return;

    const percent = (targetLength - distance) / distance / 2;
    const offsetX = dx * percent;
    const offsetY = dy * percent;

    if (!this.p1.pinned) {
      this.p1.pos.x -= offsetX;
      this.p1.pos.y -= offsetY;
    }

    if (!this.p2.pinned) {
      this.p2.pos.x += offsetX;
      this.p2.pos.y += offsetY;
    }
  }
}

type Simulation = {
  config: SimulationConfig;
  particles: Particle[];
  constraints: Constraint[];
};

function createSimulation(
  code: string,
  width: number,
  height: number,
  gravity: number,
  damping: number,
): Simulation {
  // Smaller than the browser grid because each character is an SVG node.
  const gridWidth = clamp(Math.floor(width / 15), 12, 28);
  const gridHeight = clamp(Math.floor(height / 14), 18, 40);
  const cellWidth = width / Math.max(gridWidth - 1, 1);
  const cellHeight = height / Math.max(gridHeight - 1, 1);

  const config: SimulationConfig = {
    width,
    height,
    gridWidth,
    gridHeight,
    cellWidth,
    cellHeight,
    gravity,
    damping,
    iterationsPerFrame: 4,
    compressFactor: 0.35,
    stretchFactor: 1.12,
    touchRadiusSquared: 5_000,
    touchStrength: 4,
  };

  const source = code.length > 0 ? code : " ";
  const particles: Particle[] = [];
  const constraints: Constraint[] = [];

  for (let column = 0; column < gridWidth; column += 1) {
    for (let row = 0; row < gridHeight; row += 1) {
      const id = getPointId(row, column, gridHeight);
      const charIndex = (column + row * gridWidth) % source.length;

      particles.push(
        new Particle({
          x: column * cellWidth,
          y: row * cellHeight,
          pinned: row === 0,
          id,
          char: source[charIndex] ?? " ",
        }),
      );
    }
  }

  for (let column = 0; column < gridWidth; column += 1) {
    for (let row = 0; row < gridHeight; row += 1) {
      const particle = particles[getPointId(row, column, gridHeight)];

      if (row < gridHeight - 1) {
        const below = particles[getPointId(row + 1, column, gridHeight)];
        const constraint = new Constraint(
          particle,
          below,
          cellHeight,
          config.compressFactor,
          config.stretchFactor,
        );
        particle.downConstraint = constraint;
        constraints.push(constraint);
      }

      if (column < gridWidth - 1) {
        const right = particles[getPointId(row, column + 1, gridHeight)];
        constraints.push(new Constraint(particle, right, cellWidth, 0.6, 4));
      }
    }
  }

  return { config, particles, constraints };
}

function CodeClothComponent({
  code = DEFAULT_CODE,
  width,
  height,
  style,
  backgroundColor = "#eeeeee",
  textColor = "#333333",
  fontSize,
  gravity = 0.2,
  damping = 0.99,
}: CodeClothProps) {
  const window = useWindowDimensions();
  const clothWidth = Math.max(1, width ?? window.width);
  const clothHeight = Math.max(1, height ?? window.height);

  const simulation = useMemo(
    () => createSimulation(code, clothWidth, clothHeight, gravity, damping),
    [code, clothWidth, clothHeight, gravity, damping],
  );

  const simulationRef = useRef(simulation);
  const grabbedParticleRef = useRef<Particle | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const [, renderFrame] = useState(0);

  useEffect(() => {
    simulationRef.current = simulation;
    grabbedParticleRef.current = null;
    lastFrameRef.current = null;
  }, [simulation]);

  useEffect(() => {
    mountedRef.current = true;

    const animate = (timestamp: number) => {
      const current = simulationRef.current;
      const previous = lastFrameRef.current ?? timestamp;
      const delta = timestamp - previous;
      lastFrameRef.current = timestamp;

      current.particles.forEach((particle) =>
        particle.update(delta, current.config),
      );

      for (
        let iteration = 0;
        iteration < current.config.iterationsPerFrame;
        iteration += 1
      ) {
        current.constraints.forEach((constraint) => constraint.solve());
      }

      if (mountedRef.current) {
        renderFrame((value) => (value + 1) % 1_000_000);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      mountedRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateTouch = (event: GestureResponderEvent, shouldGrab: boolean) => {
    const { locationX: x, locationY: y } = event.nativeEvent;
    const current = simulationRef.current;

    if (shouldGrab && !grabbedParticleRef.current) {
      let nearest: Particle | null = null;
      let nearestDistance = 24 * 24;

      current.particles.forEach((particle) => {
        const dx = x - particle.pos.x;
        const dy = y - particle.pos.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < nearestDistance) {
          nearest = particle;
          nearestDistance = distanceSquared;
        }
      });

      if (nearest) {
        nearest.originalPinnedState = nearest.pinned;
        nearest.pinned = true;
        grabbedParticleRef.current = nearest;
      }
    }

    const grabbed = grabbedParticleRef.current;
    if (grabbed) {
      grabbed.pos.reset(x, y);
      grabbed.oldPos.reset(x, y);
      return;
    }

    current.particles.forEach((particle) => {
      const dx = x - particle.pos.x;
      const dy = y - particle.pos.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared >= current.config.touchRadiusSquared) return;

      const angle = Math.atan2(dy, dx) - Math.PI;
      const strength =
        (smoothstep(
          current.config.touchRadiusSquared,
          -2_000,
          distanceSquared,
        ) *
          current.config.touchStrength) /
        300;

      particle.applyForce(
        Math.cos(angle) * strength,
        Math.sin(angle) * strength,
      );
    });
  };

  const releaseGrabbedParticle = () => {
    const grabbed = grabbedParticleRef.current;
    if (!grabbed) return;

    grabbed.pinned = grabbed.originalPinnedState;
    grabbedParticleRef.current = null;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => updateTouch(event, true),
        onPanResponderMove: (event) => updateTouch(event, false),
        onPanResponderRelease: releaseGrabbedParticle,
        onPanResponderTerminate: releaseGrabbedParticle,
        onShouldBlockNativeResponder: () => true,
      }),
    [simulation],
  );

  const resolvedFontSize =
    fontSize ?? Math.max(10, simulation.config.cellHeight * 0.9);

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          width: clothWidth,
          height: clothHeight,
          backgroundColor,
        },
        style,
      ]}
    >
      <Svg width={clothWidth} height={clothHeight} pointerEvents="none">
        {simulation.particles.map((particle) => {
          if (!particle.char || particle.char === " ") return null;

          let rotation = 0;
          if (particle.downConstraint) {
            const dx =
              particle.downConstraint.p2.pos.x -
              particle.downConstraint.p1.pos.x;
            const dy =
              particle.downConstraint.p2.pos.y -
              particle.downConstraint.p1.pos.y;
            rotation = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
          }

          return (
            <G
              key={particle.id}
              transform={`translate(${particle.pos.x} ${particle.pos.y}) rotate(${rotation})`}
            >
              <SvgText
                x={0}
                y={0}
                fill={textColor}
                fontFamily="monospace"
                fontSize={resolvedFontSize}
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {particle.char}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

export default memo(CodeClothComponent);
