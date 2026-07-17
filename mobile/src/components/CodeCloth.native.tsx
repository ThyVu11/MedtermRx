import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Svg, { G, Text as SvgText } from "react-native-svg";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { medicalTermCloth } from "../data/clothWords";

type CodeClothProps = {
  code?: string;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  gravity?: number;
  damping?: number;
  maxClothWidth?: number;
  maxClothHeight?: number;
  padding?: number;
};

type Size = {
  width: number;
  height: number;
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

const FIXED_STEP = 1000 / 60;
const MAX_SUB_STEPS = 3;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;

  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

const getPointId = (row: number, column: number, gridHeight: number) =>
  column * gridHeight + row;

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
  downConstraint?: Constraint;
  renderX: number;
  renderY: number;

  constructor(
    public id: number,
    public char: string,
    x: number,
    y: number,
    pinned: boolean,
  ) {
    this.pos = new Vec2(x, y);
    this.oldPos = new Vec2(x, y);
    this.pinned = pinned;
    this.originalPinnedState = pinned;
    this.renderX = x;
    this.renderY = y;
  }

  update(_deltaMs: number, config: SimulationConfig) {
    if (this.pinned) {
      this.acceleration.zero();
      return;
    }

    this.velocity.reset(
      (this.pos.x - this.oldPos.x) * config.damping,
      (this.pos.y - this.oldPos.y) * config.damping,
    );

    this.oldPos.reset(this.pos.x, this.pos.y);

    this.gravityVector.reset(0, config.gravity);
    this.acceleration.add(this.gravityVector);

    this.pos.x += this.velocity.x + this.acceleration.x;
    this.pos.y += this.velocity.y + this.acceleration.y;
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

    if (distance < this.minLength) {
      targetLength = this.minLength;
    } else if (distance > this.maxLength) {
      targetLength = this.maxLength;
    } else {
      return;
    }

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
  const gridWidth = clamp(Math.floor(width / 10), 18, 106);
  const gridHeight = clamp(Math.floor(height / 10), 16, 106);

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
    iterationsPerFrame: 2,
    compressFactor: 0.15,
    stretchFactor: 1.08,
    touchRadiusSquared: 4_500,
    touchStrength: 10,
  };

  // Newlines and tabs create very large blank areas in a character grid.
  // Converting them to single spaces keeps the code readable and evenly spaced.
  const source = code.replace(/\s+/g, " ").trim() || " ";
  const particles: Particle[] = [];
  const constraints: Constraint[] = [];

  for (let column = 0; column < gridWidth; column += 1) {
    for (let row = 0; row < gridHeight; row += 1) {
      const id = getPointId(row, column, gridHeight);
      const characterIndex = (column + row * gridWidth) % source.length;

      particles.push(
        new Particle(
          id,
          source[characterIndex] ?? " ",
          column * cellWidth,
          row * cellHeight,
          row === 0,
        ),
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
        constraints.push(new Constraint(particle, right, cellWidth, 0.7, 1.5));
      }
    }
  }

  return { config, particles, constraints };
}

function CodeClothComponent({
  code = medicalTermCloth,
  style,
  backgroundColor = "transparent",
  textColor = "#333333",
  fontSize = 8,
  gravity = 0.18,
  damping = 0.96,
  maxClothWidth = 420,
  maxClothHeight = 420,
  padding = 20,
}: CodeClothProps) {
  const touchSound = useAudioPlayer(
    require("../../assets/sounds/paper-audio.mp3"),
  );

  const touchSoundStatus = useAudioPlayerStatus(touchSound);

  const lastSoundTimeRef = useRef(0);
  const playTouchSound = () => {

    const now = Date.now();

    if (now - lastSoundTimeRef.current < 150) return;
    if (!touchSoundStatus.isLoaded) return;

    lastSoundTimeRef.current = now;

    touchSound.volume = 0.8;

    if (touchSoundStatus.playing) {
      touchSound.pause();
    }

    void touchSound.seekTo(0).then(() => {
      touchSound.play();
    });
  };

  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  const availableWidth = Math.max(1, containerSize.width - padding * 2);
  const availableHeight = Math.max(1, containerSize.height - padding * 2);

  const clothWidth = Math.min(availableWidth, maxClothWidth);
  const clothHeight = Math.min(availableHeight, maxClothHeight);

  const offsetX = Math.max(0, (containerSize.width - clothWidth) / 2);
  const offsetY = 8;

  const simulation = useMemo(
    () => createSimulation(code, clothWidth, clothHeight, gravity, damping),
    [code, clothWidth, clothHeight, gravity, damping],
  );

  const simulationRef = useRef(simulation);
  const grabbedParticleRef = useRef<Particle | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const [, renderFrame] = useState(0);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    simulationRef.current = simulation;
    grabbedParticleRef.current = null;
    lastFrameRef.current = null;
    accumulatorRef.current = 0;
  }, [simulation]);

  useEffect(() => {
    mountedRef.current = true;

    // void setAudioModeAsync({
    //   playsInSilentMode: true,
    // });

    const animate = (timestamp: number) => {
      const current = simulationRef.current;

      const previousTimestamp = lastFrameRef.current ?? timestamp;
      const frameDelta = Math.min(timestamp - previousTimestamp, 100);
      lastFrameRef.current = timestamp;

      accumulatorRef.current += frameDelta;

      let steps = 0;

      while (accumulatorRef.current >= FIXED_STEP && steps < MAX_SUB_STEPS) {
        current.particles.forEach((particle) =>
          particle.update(FIXED_STEP, current.config),
        );

        for (
          let iteration = 0;
          iteration < current.config.iterationsPerFrame;
          iteration += 1
        ) {
          current.constraints.forEach((constraint) => constraint.solve());
        }

        accumulatorRef.current -= FIXED_STEP;
        steps += 1;
      }

      const alpha = accumulatorRef.current / FIXED_STEP;

      current.particles.forEach((particle) => {
        particle.renderX =
          particle.oldPos.x + (particle.pos.x - particle.oldPos.x) * alpha;

        particle.renderY =
          particle.oldPos.y + (particle.pos.y - particle.oldPos.y) * alpha;
      });

      // Prevent a large backlog after the app freezes or resumes.
      if (steps === MAX_SUB_STEPS) {
        accumulatorRef.current = 0;
      }

      if (mountedRef.current) {
        renderFrame((frame) => (frame + 1) % 1_000_000);
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

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setContainerSize((currentSize) => {
      if (
        Math.abs(currentSize.width - width) < 1 &&
        Math.abs(currentSize.height - height) < 1
      ) {
        return currentSize;
      }

      return { width, height };
    });
  };

  const updateTouch = (event: GestureResponderEvent, shouldGrab: boolean) => {
    const localX = event.nativeEvent.locationX - offsetX;
    const localY = event.nativeEvent.locationY - offsetY;
    const current = simulationRef.current;

    if (
      localX < 0 ||
      localY < 0 ||
      localX > current.config.width ||
      localY > current.config.height
    ) {
      return;
    }

    if (shouldGrab && !grabbedParticleRef.current) {
      let nearestParticle: Particle | null = null;
      let nearestDistanceSquared = 30 * 30;

      current.particles.forEach((particle) => {
        const dx = localX - particle.pos.x;
        const dy = localY - particle.pos.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < nearestDistanceSquared) {
          nearestParticle = particle;
          nearestDistanceSquared = distanceSquared;
        }
      });

      if (nearestParticle) {
        nearestParticle.originalPinnedState = nearestParticle.pinned;
        nearestParticle.pinned = true;
        grabbedParticleRef.current = nearestParticle;
        playTouchSound();
      }
    }

    const grabbedParticle = grabbedParticleRef.current;

    if (grabbedParticle) {
      grabbedParticle.pos.reset(localX, localY);
      grabbedParticle.oldPos.reset(localX, localY);
      return;
    }

    current.particles.forEach((particle) => {
      const dx = localX - particle.pos.x;
      const dy = localY - particle.pos.y;
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
    const grabbedParticle = grabbedParticleRef.current;

    if (!grabbedParticle) return;

    grabbedParticle.pinned = grabbedParticle.originalPinnedState;
    grabbedParticleRef.current = null;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateTouch(event, true);
        },
        onPanResponderMove: (event) => {
          updateTouch(event, false);
        },
        onPanResponderRelease: releaseGrabbedParticle,
        onPanResponderTerminate: releaseGrabbedParticle,
        onShouldBlockNativeResponder: () => true,
      }),
    [offsetX, offsetY, simulation],
  );

  const resolvedFontSize =
    fontSize ?? Math.max(8, simulation.config.cellHeight * 0.65);

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      style={[styles.container, { backgroundColor }, style]}
    >
      {containerSize.width > 0 ? (
        <Svg width={containerSize.width} height={containerSize.height}>
          {simulation.particles.map((particle) => {
            if (!particle.char || particle.char === " ") return null;

            let rotation = 0;

            if (particle.downConstraint) {
              const dx =
                particle.downConstraint.p2.renderX -
                particle.downConstraint.p1.renderX;

              const dy =
                particle.downConstraint.p2.renderY -
                particle.downConstraint.p1.renderY;

              rotation = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
            }

            return (
              <G
                key={particle.id}
                transform={`translate(${particle.renderX + offsetX} ${
                  particle.renderY + offsetY
                }) rotate(${rotation})`}
              >
                <SvgText
                  x={0}
                  y={0}
                  fill={textColor}
                  fontFamily="monospace"
                  fontSize={resolvedFontSize}
                  fontWeight="400"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {particle.char}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 320,
    // marginBottom: 50,
  },
});

export default memo(CodeClothComponent);
