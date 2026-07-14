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

type CodeClothProps = {
  // code?: string;
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

const DEFAULT_CODE = `
cardiology
neurology
hematology
oncology
dermatology
gastroenterology
pulmonology
nephrology
endocrinology
urology
gynecology
obstetrics
orthopedics
ophthalmology
otolaryngology
anatomy
physiology
pathology
histology
cytology
etiology
diagnosis
prognosis
symptom
syndrome
disease
infection
inflammation
fracture
hemorrhage
edema
necrosis
atrophy
hypertrophy
hyperplasia
hypoplasia
dysplasia
metastasis
embolism
thrombosis
ischemia
hypoxia
cyanosis
tachycardia
bradycardia
hypertension
hypotension
arrhythmia
palpitation
dyspnea
apnea
orthopnea
tachypnea
bradypnea
hemoptysis
cyanosis
pneumonia
bronchitis
asthma
emphysema
arthritis
osteoporosis
osteoarthritis
rheumatoid
myalgia
arthralgia
scoliosis
kyphosis
lordosis
diabetes
hyperglycemia
hypoglycemia
insulin
glucose
thyroid
pituitary
adrenal
pancreas
liver
kidney
stomach
esophagus
intestine
appendix
colon
rectum
bladder
ureter
urethra
brain
cerebellum
cerebrum
neuron
synapse
spinal cord
ventricle
atrium
artery
vein
capillary
aorta
atrioventricular
electrocardiogram
electroencephalogram
radiography
ultrasound
computed tomography
magnetic resonance imaging
biopsy
catheter
intravenous
intramuscular
subcutaneous
antibiotic
analgesic
anesthetic
anticoagulant
vaccination
immunity
pathogen
bacteria
virus
fungus
parasite
`;

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
  const gridWidth = clamp(Math.floor(width / 14), 18, 30);
  const gridHeight = clamp(Math.floor(height / 12), 22, 34);

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
    iterationsPerFrame: 5,
    compressFactor: 0.15,
    stretchFactor: 1.08,
    touchRadiusSquared: 4_500,
    touchStrength: 5,
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
  // code = DEFAULT_CODE,
  style,
  backgroundColor = "transparent",
  textColor = "#333333",
  fontSize,
  gravity = 0.18,
  damping = 0.99,
  maxClothWidth = 420,
  maxClothHeight = 420,
  padding = 20,
}: CodeClothProps) {
  const [containerSize, setContainerSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  const availableWidth = Math.max(1, containerSize.width - padding * 2);
  const availableHeight = Math.max(1, containerSize.height - padding * 2);

  const clothWidth = Math.min(availableWidth, maxClothWidth);
  const clothHeight = Math.min(availableHeight, maxClothHeight);

  const offsetX = Math.max(0, (containerSize.width - clothWidth) / 2);
  const offsetY = 50;

  const simulation = useMemo(
    () =>
      createSimulation(DEFAULT_CODE, clothWidth, clothHeight, gravity, damping),
    [DEFAULT_CODE, clothWidth, clothHeight, gravity, damping],
  );

  const simulationRef = useRef(simulation);
  const grabbedParticleRef = useRef<Particle | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
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
      const previousTimestamp = lastFrameRef.current ?? timestamp;
      const delta = timestamp - previousTimestamp;
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
        renderFrame((currentFrame) => (currentFrame + 1) % 1_000_000);
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
        onPanResponderGrant: (event) => updateTouch(event, true),
        onPanResponderMove: (event) => updateTouch(event, false),
        onPanResponderRelease: releaseGrabbedParticle,
        onPanResponderTerminate: releaseGrabbedParticle,
        onShouldBlockNativeResponder: () => true,
      }),
    [offsetX, offsetY, simulation],
  );

  const resolvedFontSize =
    fontSize ?? Math.max(9, simulation.config.cellHeight * 0.75);

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      style={[styles.container, { backgroundColor }, style]}
    >
      {containerSize.width > 0 && containerSize.height > 0 ? (
        <Svg
          width={containerSize.width}
          height={containerSize.height}
          pointerEvents="none"
        >
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
                transform={`translate(${particle.pos.x + offsetX} ${
                  particle.pos.y + offsetY
                }) rotate(${rotation})`}
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 260,
    overflow: "hidden",
  },
});

export default memo(CodeClothComponent);
