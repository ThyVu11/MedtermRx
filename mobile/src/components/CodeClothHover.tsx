import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { medicalTermCloth } from "@/data/clothWords";
import {
  ClothConfig,
  Constraint,
  ConstraintOptions,
  Particle,
  ParticleOptions,
  PointerState,
  Vec2,
} from "@/types/cloth/clothType";
import { colors, radii, spacing, typography } from "@/theme";

const HEIGHT_SCALE = 2.5;
const WIDTH_SCALE = 0.8;
const SOUND_COOLDOWN_MS = 150;
const SOUND_DISTANCE_THRESHOLD = 40;
const LETTER_HOVER_RADIUS = 10;
const FONT_SIZE = 8;
const SIMULATION_SPEED = 1.25;
const STARTUP_FRAMES = 45;
const SVG_TOP_PADDING = 8;
const SVG_BOTTOM_SPACE = 100;
const WIND_STRENGTH = 0.012;
const WIND_SPEED = 0.0012;
const WIND_SPATIAL_VARIATION = 0.035;

const CodeClothContainer: React.CSSProperties = {
  position: "relative",
  display: "flex",
  width: "100%",
  alignItems: "flex-start",
  justifyContent: "center",
  overflow: "visible",
  touchAction: "none",
};

const svg: React.CSSProperties = {
  display: "block",
  width: "100%",
  pointerEvents: "auto",
  touchAction: "none",
};

const createVec2 = (x = 0, y = 0): Vec2 => ({ x, y });
const resetVec2 = (v: Vec2, x = 0, y = 0) => {
  v.x = x;
  v.y = y;
};
const zeroVec2 = (v: Vec2) => resetVec2(v);
const addVec2 = (target: Vec2, value: Vec2) => {
  target.x += value.x;
  target.y += value.y;
};

const createParticle = (options: ParticleOptions): Particle => ({
  pos: createVec2(options.x, options.y),
  oldPos: createVec2(options.x, options.y),
  velocity: createVec2(),
  acceleration: createVec2(),
  gravityVector: createVec2(),
  pinned: options.pinned,
  originalPinnedState: options.pinned,
  id: options.id,
  char: options.char,
});

const updateParticle = (
  particle: Particle,
  deltaMs: number,
  config: ClothConfig,
) => {
  if (particle.pinned) {
    zeroVec2(particle.acceleration);
    return;
  }

  resetVec2(
    particle.velocity,
    (particle.pos.x - particle.oldPos.x) * config.damping,
    (particle.pos.y - particle.oldPos.y) * config.damping,
  );

  resetVec2(particle.oldPos, particle.pos.x, particle.pos.y);

  const normalizedDelta = (Math.max(deltaMs, 1) / 16.667) * SIMULATION_SPEED;
  const deltaSquared = normalizedDelta ** 2;

  resetVec2(particle.gravityVector, 0, config.gravity);
  addVec2(particle.acceleration, particle.gravityVector);

  particle.pos.x +=
    particle.velocity.x + particle.acceleration.x * deltaSquared;
  particle.pos.y +=
    particle.velocity.y + particle.acceleration.y * deltaSquared;

  zeroVec2(particle.acceleration);
};

const applyForce = (particle: Particle, vector: Vec2) => {
  addVec2(particle.acceleration, vector);
};

const containParticle = (particle: Particle, config: ClothConfig) => {
  if (particle.pinned) return;

  const radius = 5;

  if (particle.pos.x < radius) {
    particle.pos.x = radius;
    particle.oldPos.x =
      particle.pos.x + Math.abs(particle.oldPos.x - particle.pos.x) * 0.8;
  } else if (particle.pos.x > config.width - radius) {
    particle.pos.x = config.width - radius;
    particle.oldPos.x =
      particle.pos.x - Math.abs(particle.oldPos.x - particle.pos.x) * 0.8;
  }

  if (particle.pos.y < radius) {
    particle.pos.y = radius;
    particle.oldPos.y =
      particle.pos.y + Math.abs(particle.oldPos.y - particle.pos.y) * 0.8;
  } else if (particle.pos.y > config.height - radius) {
    particle.pos.y = config.height - radius;
    particle.oldPos.y =
      particle.pos.y - Math.abs(particle.oldPos.y - particle.pos.y) * 0.8;
  }
};

const createConstraint = (options: ConstraintOptions): Constraint => ({
  p1Id: options.p1Id,
  p2Id: options.p2Id,
  length: options.length,
  id: options.id,
  minLength: options.length * options.compressFactor,
  maxLength: options.length * options.stretchFactor,
});

const solveConstraint = (constraint: Constraint, particles: Particle[]) => {
  const p1 = particles[constraint.p1Id];
  const p2 = particles[constraint.p2Id];
  if (!p1 || !p2) return;

  const dx = p2.pos.x - p1.pos.x;
  const dy = p2.pos.y - p1.pos.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return;

  let targetLength = constraint.length;
  if (distance < constraint.minLength) targetLength = constraint.minLength;
  else if (distance > constraint.maxLength) targetLength = constraint.maxLength;
  else return;

  const percent = (targetLength - distance) / distance / 2;
  const offsetX = dx * percent;
  const offsetY = dy * percent;

  if (!p1.pinned) {
    p1.pos.x -= offsetX;
    p1.pos.y -= offsetY;
  }

  if (!p2.pinned) {
    p2.pos.x += offsetX;
    p2.pos.y += offsetY;
  }
};

const getPointId = (row: number, column: number, gridHeight: number) =>
  column * gridHeight + row;

const shuffleArray = <T,>(array: T[]) => {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
};

export default function CodeCloth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef(0);

  const configRef = useRef<ClothConfig>({
    width: 0,
    height: 0,
    gridWidth: 0,
    gridHeight: 0,
    cellWidth: 0,
    cellHeight: 0,
    gravity: 0.1,
    damping: 0.96,
    iterationsPerFrame: 5,
    compressFactor: 0.8,
    stretchFactor: 1.05,
    mouseSize: 2000,
    mouseStrength: 6,
    contain: false,
    randomSolve: false,
  });

  const particlesRef = useRef<Particle[]>([]);
  const constraintsRef = useRef<Constraint[]>([]);
  const textElementsRef = useRef<Map<number, SVGTextElement>>(new Map());

  const pointerStateRef = useRef<PointerState>({
    mousePos: createVec2(),
    hovering: false,
    lastMousePos: createVec2(),
    soundDistance: 0,
  });

  const touchSound = useAudioPlayer(
    require("../../assets/sounds/bamboo-wind-chime.mp3"),
  );
  const touchSoundStatus = useAudioPlayerStatus(touchSound);
  const lastSoundTimeRef = useRef(0);

  const playTouchSound = useCallback(() => {
    const now = Date.now();

    if (now - lastSoundTimeRef.current < SOUND_COOLDOWN_MS) return;
    if (!touchSoundStatus.isLoaded) return;

    lastSoundTimeRef.current = now;
    touchSound.volume = 0.8;

    if (touchSoundStatus.playing) {
      touchSound.pause();
    }

    void touchSound.seekTo(0).then(() => {
      touchSound.play();
    });
  }, [touchSound, touchSoundStatus.isLoaded, touchSoundStatus.playing]);

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;
    if (!container || !svgElement) return;

    const buildSimulation = () => {
      frameRef.current = 0;

      const cssWidth = container.clientWidth || window.innerWidth;
      const viewportWidth = container.clientWidth || window.innerWidth;
      const viewportHeight = container.clientHeight || window.innerHeight;

      const nextConfig: ClothConfig = {
        ...configRef.current,
        width: Math.max(100, Math.min(400, viewportWidth - 40)),
        height: Math.max(100, Math.min(400, viewportHeight - 40)),
      };

      nextConfig.gridWidth = Math.max(
        2,
        Math.min(50, Math.floor(nextConfig.width / 10)),
      );
      nextConfig.gridHeight = Math.floor(nextConfig.width / 12);
      nextConfig.cellWidth =
        (nextConfig.width / (nextConfig.gridWidth - 1)) * WIDTH_SCALE;
      nextConfig.cellHeight =
        (nextConfig.height / Math.max(nextConfig.gridHeight - 1, 1)) *
        HEIGHT_SCALE;

      const actualClothHeight =
        (nextConfig.gridHeight - 1) * nextConfig.cellHeight;
      const svgHeight = actualClothHeight + SVG_TOP_PADDING + SVG_BOTTOM_SPACE;

      svgElement.setAttribute("width", String(cssWidth));
      svgElement.setAttribute("height", String(svgHeight));
      svgElement.setAttribute(
        "viewBox",
        `${-SVG_TOP_PADDING} ${-SVG_TOP_PADDING} ${cssWidth} ${svgHeight}`,
      );

      const nextParticles: Particle[] = [];
      const nextConstraints: Constraint[] = [];

      for (let column = 0; column < nextConfig.gridWidth; column += 1) {
        for (let row = 0; row < nextConfig.gridHeight; row += 1) {
          const id = getPointId(row, column, nextConfig.gridHeight);
          const characterIndex =
            (column + row * nextConfig.gridWidth) %
            Math.max(medicalTermCloth.length, 1);

          nextParticles.push(
            createParticle({
              x: column * nextConfig.cellWidth,
              y: row * nextConfig.cellHeight,
              pinned: row === 0,
              id,
              char: medicalTermCloth[characterIndex] ?? " ",
            }),
          );
        }
      }

      for (let column = 0; column < nextConfig.gridWidth; column += 1) {
        for (let row = 0; row < nextConfig.gridHeight; row += 1) {
          const id = getPointId(row, column, nextConfig.gridHeight);

          if (row < nextConfig.gridHeight - 1) {
            const belowId = getPointId(row + 1, column, nextConfig.gridHeight);
            const constraint = createConstraint({
              p1Id: id,
              p2Id: belowId,
              length: nextConfig.cellHeight,
              id: id + nextConfig.gridWidth * nextConfig.gridHeight,
              compressFactor: nextConfig.compressFactor,
              stretchFactor: nextConfig.stretchFactor,
            });

            nextParticles[id].downConstraintId = constraint.id;
            nextConstraints.push(constraint);
          }

          if (column < nextConfig.gridWidth - 1) {
            const rightId = getPointId(row, column + 1, nextConfig.gridHeight);
            nextConstraints.push(
              createConstraint({
                p1Id: id,
                p2Id: rightId,
                length: nextConfig.cellWidth,
                id: id + nextConfig.gridWidth * nextConfig.gridHeight * 2,
                compressFactor: 0.85,
                stretchFactor: 1.2,
              }),
            );
          }
        }
      }

      configRef.current = nextConfig;
      particlesRef.current = nextParticles;
      constraintsRef.current = nextConstraints;

      svgElement.replaceChildren();
      textElementsRef.current.clear();

      const hoverTarget = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      hoverTarget.setAttribute("x", "0");
      hoverTarget.setAttribute("y", "0");
      hoverTarget.setAttribute("width", "100%");
      hoverTarget.setAttribute("height", "100%");
      hoverTarget.setAttribute("fill", "transparent");
      hoverTarget.setAttribute("pointer-events", "all");
      svgElement.appendChild(hoverTarget);

      for (const particle of nextParticles) {
        if (!particle.char || particle.char === " ") continue;

        const textElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        textElement.textContent = particle.char;
        textElement.setAttribute("x", "0");
        textElement.setAttribute("y", "0");
        textElement.setAttribute("fill", "#0e1a1bc0");

        textElement.setAttribute("font-family", typography.label.fontFamily);
        textElement.setAttribute("font-size", String(FONT_SIZE));
        textElement.setAttribute("font-weight", "600");
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("dominant-baseline", "central");
        textElement.setAttribute("pointer-events", "none");

        textElementsRef.current.set(particle.id, textElement);
        svgElement.appendChild(textElement);
      }
    };

    buildSimulation();
    window.addEventListener("resize", buildSimulation);

    return () => {
      window.removeEventListener("resize", buildSimulation);
      svgElement.replaceChildren();
      textElementsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const updateMousePosition = (event: PointerEvent): boolean => {
      const rect = svgElement.getBoundingClientRect();

      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) return false;

      const currentConfig = configRef.current;
      const viewBox = svgElement.viewBox.baseVal;
      const svgWidth = viewBox.width || rect.width;
      const svgHeight = viewBox.height || rect.height;

      const svgX =
        ((event.clientX - rect.left) / Math.max(rect.width, 1)) * svgWidth;
      const svgY =
        ((event.clientY - rect.top) / Math.max(rect.height, 1)) * svgHeight;

      const actualWidth =
        (currentConfig.gridWidth - 1) * currentConfig.cellWidth;
      const offsetX = (svgWidth - actualWidth) / 2;
      const offsetY = 0;

      resetVec2(
        pointerStateRef.current.mousePos,
        svgX - offsetX,
        svgY - offsetY,
      );

      return true;
    };

    const pointerMove = (event: PointerEvent) => {
      const pointerState = pointerStateRef.current;

      if (!updateMousePosition(event)) {
        pointerState.hovering = false;
        pointerState.soundDistance = 0;
        return;
      }

      const currentParticles = particlesRef.current;
      let isOverLetter = false;

      for (const particle of currentParticles) {
        if (!particle.char || particle.char === " ") continue;

        const dx = pointerState.mousePos.x - particle.pos.x;
        const dy = pointerState.mousePos.y - particle.pos.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= LETTER_HOVER_RADIUS * LETTER_HOVER_RADIUS) {
          isOverLetter = true;
          break;
        }
      }

      if (!isOverLetter) {
        pointerState.hovering = false;
        pointerState.soundDistance = 0;
        return;
      }

      const moveX = pointerState.mousePos.x - pointerState.lastMousePos.x;
      const moveY = pointerState.mousePos.y - pointerState.lastMousePos.y;

      pointerState.soundDistance += Math.sqrt(moveX * moveX + moveY * moveY);

      resetVec2(
        pointerState.lastMousePos,
        pointerState.mousePos.x,
        pointerState.mousePos.y,
      );

      if (!pointerState.hovering) {
        pointerState.hovering = true;
        pointerState.soundDistance = 0;
        playTouchSound();
      } else if (pointerState.soundDistance > SOUND_DISTANCE_THRESHOLD) {
        pointerState.soundDistance = 0;
        playTouchSound();
      }

      const currentConfig = configRef.current;

      for (const particle of currentParticles) {
        const dx = pointerState.mousePos.x - particle.pos.x;
        const dy = pointerState.mousePos.y - particle.pos.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared >= currentConfig.mouseSize) continue;

        const distance = Math.sqrt(distanceSquared);
        const influence = 1 - distance / Math.sqrt(currentConfig.mouseSize);

        if (influence <= 0) continue;

        const safeDistance = Math.max(distance, 0.001);
        const force = influence * currentConfig.mouseStrength;

        applyForce(
          particle,
          createVec2(
            (-dx / safeDistance) * force,
            (-dy / safeDistance) * force,
          ),
        );
      }
    };

    const pointerLeave = () => {
      pointerStateRef.current.hovering = false;
    };

    const preventContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    window.addEventListener("pointermove", pointerMove, { passive: true });
    svgElement.addEventListener("pointerleave", pointerLeave);
    svgElement.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("pointermove", pointerMove);
      svgElement.removeEventListener("pointerleave", pointerLeave);
      svgElement.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [playTouchSound]);

  useEffect(() => {
    let frameId = 0;
    let previousTime = performance.now();

    const drawCode = () => {
      const svgElement = svgRef.current;
      if (!svgElement) return;

      const currentConfig = configRef.current;
      const currentParticles = particlesRef.current;
      const currentConstraints = constraintsRef.current;
      const constraintMap = new Map(
        currentConstraints.map((constraint) => [constraint.id, constraint]),
      );

      const svgWidth =
        svgElement.viewBox.baseVal.width || svgElement.clientWidth;
      const actualWidth =
        (currentConfig.gridWidth - 1) * currentConfig.cellWidth;
      const offsetX = (svgWidth - actualWidth) / 2;
      const offsetY = 0;

      for (const particle of currentParticles) {
        const textElement = textElementsRef.current.get(particle.id);
        if (!textElement) continue;

        let rotation = 0;

        if (particle.downConstraintId !== undefined) {
          const downConstraint = constraintMap.get(particle.downConstraintId);

          if (downConstraint) {
            const below = currentParticles[downConstraint.p2Id];

            if (below) {
              const dx = below.pos.x - particle.pos.x;
              const dy = below.pos.y - particle.pos.y;
              rotation = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
            }
          }
        }

        textElement.setAttribute(
          "transform",
          `translate(${particle.pos.x + offsetX} ${
            particle.pos.y + offsetY
          }) rotate(${rotation})`,
        );
      }
    };

    const render = (time: number) => {
      frameRef.current += 1;

      const delta = Math.min(time - previousTime, 32);
      previousTime = time;

      const currentConfig = configRef.current;
      const currentParticles = particlesRef.current;
      const currentConstraints = constraintsRef.current;

      const progress = Math.min(frameRef.current / STARTUP_FRAMES, 1);
      const gravity = currentConfig.gravity * (0.2 + progress * 0.8);
      const simulationConfig = { ...currentConfig, gravity };

      for (const particle of currentParticles) {
        if (!particle.pinned) {
          const rowProgress =
            currentConfig.gridHeight > 1
              ? (particle.id % currentConfig.gridHeight) /
                (currentConfig.gridHeight - 1)
              : 0;

          const wind =
            Math.sin(
              time * WIND_SPEED + particle.pos.y * WIND_SPATIAL_VARIATION,
            ) *
            WIND_STRENGTH *
            rowProgress;

          applyForce(particle, createVec2(wind, 0));
        }

        updateParticle(particle, delta, simulationConfig);
      }

      const constraintsToSolve = currentConfig.randomSolve
        ? [...currentConstraints]
        : currentConstraints;

      if (currentConfig.randomSolve) {
        shuffleArray(constraintsToSolve);
      }

      for (
        let iteration = 0;
        iteration < currentConfig.iterationsPerFrame;
        iteration += 1
      ) {
        for (const constraint of constraintsToSolve) {
          solveConstraint(constraint, currentParticles);
        }
      }

      if (currentConfig.contain) {
        for (const particle of currentParticles) {
          containParticle(particle, currentConfig);
        }
      }

      drawCode();
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      style={CodeClothContainer}
      ref={containerRef}
      aria-label="Interactive code cloth animation"
    >
      <svg ref={svgRef} style={svg} aria-hidden="true" />
    </div>
  );
}
