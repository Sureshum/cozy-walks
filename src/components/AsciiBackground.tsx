// Fondo ASCII reactivo - solo caracteres ASCII imprimibles (sin emojis)
// Mejor distribución, más densidad y tamaño adaptado al ancho de pantalla.
// Optimizado para rendimiento: 30fps max, pausa durante input, memoización.

import { memo, useEffect, useRef, useState, useCallback } from 'react';

const ASCII_CHARS = [
  // Puntuación y símbolos
  '.', ',', ':', ';', '-', '=', '+', '*', '/', '\\', '|', '~', '^', '_',
  '(', ')', '[', ']', '{', '}', '<', '>', "'", '"', '`', '!', '?', '@',
  '#', '$', '%', '&',
  // Alfanuméricos sueltos
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k', 'm', 'n', 'o', 'p', 's', 't', 'w', 'x', 'y', 'z',
  // Formas simples en ASCII
  '.', '*', '+', 'o', 'O', 'x', 'X', '-', '=', '~', '^',
];

interface AsciiBackgroundProps {
  className?: string;
  density?: number;        // 0-1: qué tan denso (default: 0.25)
  charSize?: number;       // tamaño base en px (default: 24)
  speed?: number;          // velocidad animación (default: 0.8)
  colors?: {
    base: string;
    hover: string[];
    glow: string;
  };
  mouseInfluence?: number; // radio de influencia del mouse (default: 200)
}

// Paleta por defecto estable (identidad constante: evita reiniciar la animación)
const DEFAULT_COLORS = {
  base: '#3a3a3a',
  hover: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#a855f7', '#06b6d4', '#f97316', '#84cc16', '#ec4899'],
  glow: 'rgba(255, 107, 107, 0.4)',
};

// Cache para grids precomputados
const gridCache = new Map<string, Array<{
  char: string;
  x: number;
  y: number;
  baseColor: string;
  currentColor: string;
  targetColor: string;
  glow: number;
  phase: number;
  speed: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
}>>();

export const AsciiBackgroundBase: React.FC<AsciiBackgroundProps> = ({
  className = '',
  density = 0.25,
  charSize = 24,
  colors = DEFAULT_COLORS,
  mouseInfluence = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const pausedRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const charSizeRef = useRef(charSize);
  const gridRef = useRef<Array<{
    char: string;
    x: number;
    y: number;
    baseColor: string;
    currentColor: string;
    targetColor: string;
    glow: number;
    phase: number;
    speed: number;
    scale: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Inicializar grid - con cache
  const initGrid = useCallback((width: number, height: number, size: number) => {
    const key = `${width}x${height}x${density}x${size}`;
    
    // Verificar cache
    const cached = gridCache.get(key);
    if (cached) {
      gridRef.current = cached.map(cell => ({ ...cell }));
      return;
    }

    const cols = Math.ceil(width / size);
    const rows = Math.ceil(height / size);
    const newGrid = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Saltar algunas celdas para distribución más natural (density)
        if (Math.random() > density) continue;

        // Posición con algo de jitter para que no sea grid perfecto
        const jitterX = (Math.random() - 0.5) * size * 0.6;
        const jitterY = (Math.random() - 0.5) * size * 0.6;

        const x = col * size + size / 2 + jitterX;
        const y = row * size + size / 2 + jitterY;

        // Variedad de caracteres
        const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];

        newGrid.push({
          char,
          x,
          y,
          baseColor: colors.base,
          currentColor: colors.base,
          targetColor: colors.base,
          glow: 0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 1.2,
          scale: 0.7 + Math.random() * 0.6,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    }
    
    gridRef.current = newGrid;
    // Guardar en cache (limitar tamaño del cache)
    if (gridCache.size > 10) {
      const firstKey = gridCache.keys().next().value;
      if (firstKey) gridCache.delete(firstKey);
    }
    gridCache.set(key, newGrid.map(cell => ({ ...cell })));
  }, [density, colors.base]);

  // Animación principal - optimizada
  const animate = useCallback((timeMs?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = typeof timeMs === 'number' ? timeMs : performance.now();

    // Pausado mientras se escribe en un campo
    if (pausedRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Limitar a ~30 fps
    if (now - lastFrameRef.current < 32) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameRef.current = now;

    const { width, height } = canvas;
    const time = now * 0.001;

    // Limpiar con fondo negro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Configuración de texto fuera del bucle
    ctx.font = `${charSizeRef.current}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    const hoverColors = colors.hover;
    const glowColor = colors.glow;
    const maxDist = mouseInfluence;
    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;

    // Actualizar y dibujar cada carácter
    for (let i = 0; i < gridRef.current.length; i++) {
      const cell = gridRef.current[i];
      const dx = mouseX - cell.x;
      const dy = mouseY - cell.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Efecto de proximidad al mouse
      if (dist < maxDist) {
        const intensity = 1 - dist / maxDist;
        const colorIndex = Math.floor((cell.x + cell.y + time * 50) % hoverColors.length);
        cell.targetColor = hoverColors[colorIndex];
        cell.glow = intensity * 20;
        // Ligera atracción hacia el mouse
        cell.x += dx * intensity * 0.005;
        cell.y += dy * intensity * 0.005;
      } else {
        cell.targetColor = cell.baseColor;
        cell.glow *= 0.92;
      }

      // Interpolar color actual hacia target
      cell.currentColor = cell.targetColor;

      // Animaciones continuas
      cell.phase += cell.speed * 0.008;
      cell.rotation += cell.rotationSpeed;

      // Respiración (pulse)
      const pulse = Math.sin(cell.phase) * 0.15 + 1;
      const finalScale = cell.scale * pulse;

      // Dibujar glow si está activo
      if (cell.glow > 0.5) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = cell.glow;
      }

      // Dibujar carácter con transformaciones
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.rotate(cell.rotation);
      ctx.scale(finalScale, finalScale);
      ctx.fillStyle = cell.currentColor;
      ctx.fillText(cell.char, 0, 0);
      ctx.restore();

      if (cell.glow > 0.5) ctx.shadowBlur = 0;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [colors.hover, colors.glow, mouseInfluence]);

  // Pausar el repintado mientras el usuario escribe
  useEffect(() => {
    const isEditable = (el: Element | null) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable);

    const onFocusIn = (e: FocusEvent) => {
      if (isEditable(e.target as Element)) pausedRef.current = true;
    };
    const onFocusOut = () => {
      pausedRef.current = false;
      lastFrameRef.current = 0;
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Manejar resize (con debounce)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const applySize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width === 0 || height === 0) return;
      if (canvas.width === width && canvas.height === height) return;

      // Caracteres más pequeños en pantallas estrechas (móvil)
      const effectiveSize =
        width < 480 ? Math.max(11, Math.round(charSize * 0.55))
        : width < 768 ? Math.max(14, Math.round(charSize * 0.75))
        : charSize;
      charSizeRef.current = effectiveSize;

      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });
      initGrid(width, height, effectiveSize);
    };

    const resize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(applySize, 150);
    };

    applySize();
    window.addEventListener('resize', resize);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [initGrid, charSize]);

  // Iniciar animación cuando tenemos dimensiones
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      lastFrameRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [dimensions, animate]);

  // Mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Mouse leave - reset
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  // Touch support para móviles
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      mouseRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
      aria-hidden="true"
    />
  );
};

// memo: el formulario se re-renderiza con cada tecla y no queremos reiniciar el canvas
export const AsciiBackground = memo(AsciiBackgroundBase);

export default AsciiBackground;