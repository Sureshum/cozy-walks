// Fondo ASCII reactivo - MÁS caracteres, mejor distribución, más densidad

import { useEffect, useRef, useState, useCallback } from 'react';

const ASCII_CHARS = [
  // Caracteres decorativos
  '░', '▒', '▓', '█', '◆', '◇', '■', '□', '●', '○', '▲', '△', '▼', '▽', '◉', '◎',
  '★', '☆', '✦', '✧', '✨', '*', '+', '×', '÷', '≈', '≠', '≤', '≥', '∞', '∑', '∏',
  // Símbolos técnicos
  '√', '∫', '∂', '∆', '∇', '∈', '∉', '⊂', '⊃', '∪', '∩', '∀', '∃', '¬', '∧', '∨',
  '⊕', '⊗', '⊥', '⊤', '⟂', '∠', '∟', '⊾', '≡', '≢', '≣', '≦', '≧', '≨', '≩',
  // Flechas
  '←', '→', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '⇐', '⇒', '⇑', '⇓', '⇔',
  // Geométricos
  '◇', '◆', '□', '■', '△', '▲', '▽', '▼', '○', '●', '◎', '◉', '◆', '◇', '◈', '◆',
  // Naturaleza / Cozy
  '🍃', '🌿', '🌱', '🌸', '🌼', '🌻', '🍂', '🍁', '🌾', '🌲', '🌳', '🌴', '🌵', '🌿', '☘️', '🍀',
];

interface AsciiBackgroundProps {
  className?: string;
  density?: number;        // 0-1: qué tan denso (default: 0.25 - MÁS denso)
  charSize?: number;       // tamaño base en px (default: 24 - MÁS grande)
  speed?: number;          // velocidad animación (default: 0.8)
  colors?: {
    base: string;
    hover: string[];
    glow: string;
  };
  mouseInfluence?: number; // radio de influencia del mouse (default: 200)
}

export const AsciiBackground: React.FC<AsciiBackgroundProps> = ({
  className = '',
  density = 0.25,        // AUMENTADO: más caracteres
  charSize = 24,         // AUMENTADO: caracteres más grandes
  colors = {
    base: '#3a3a3a',
    hover: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#a855f7', '#06b6d4', '#f97316', '#84cc16', '#ec4899'],
    glow: 'rgba(255, 107, 107, 0.4)',
  },
  mouseInfluence = 200,  // AUMENTADO: más radio
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Grid de caracteres - memoizado para rendimiento
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

  // Inicializar grid - memoizado
  const initGrid = useCallback((width: number, height: number) => {
    const cols = Math.ceil(width / charSize);
    const rows = Math.ceil(height / charSize);
    const newGrid = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Saltar algunas celdas para distribución más natural (density)
        if (Math.random() > density) continue;

        // Posición con algo de jitter para que no sea grid perfecto
        const jitterX = (Math.random() - 0.5) * charSize * 0.6;
        const jitterY = (Math.random() - 0.5) * charSize * 0.6;
        
        const x = col * charSize + charSize / 2 + jitterX;
        const y = row * charSize + charSize / 2 + jitterY;
        
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
          speed: 0.3 + Math.random() * 1.2,        // Velocidad variada
          scale: 0.7 + Math.random() * 0.6,        // Escala variada 0.7-1.3
          rotation: Math.random() * Math.PI * 2,    // Rotación inicial aleatoria
          rotationSpeed: (Math.random() - 0.5) * 0.02, // Rotación lenta
        });
      }
    }
    gridRef.current = newGrid;
  }, [charSize, density, colors.base]);

  // Animación principal
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const time = Date.now() * 0.001;

    // Limpiar con fondo negro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Actualizar y dibujar cada carácter
    gridRef.current.forEach((cell) => {
      const dx = mouseRef.current.x - cell.x;
      const dy = mouseRef.current.y - cell.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = mouseInfluence;

      // Efecto de proximidad al mouse
      if (dist < maxDist) {
        const intensity = 1 - dist / maxDist;
        const colorIndex = Math.floor((cell.x + cell.y + time * 50) % colors.hover.length);
        cell.targetColor = colors.hover[colorIndex];
        cell.glow = intensity * 20;
        // Ligera atracción hacia el mouse
        cell.x += dx * intensity * 0.005;
        cell.y += dy * intensity * 0.005;
      } else {
        cell.targetColor = cell.baseColor;
        cell.glow *= 0.92;
      }

      // Interpolar color actual hacia target (aproximación simple)
      cell.currentColor = cell.targetColor;

      // Animaciones continuas
      cell.phase += cell.speed * 0.008;
      cell.rotation += cell.rotationSpeed;
      
      // Respiración (pulse)
      const pulse = Math.sin(cell.phase) * 0.15 + 1;
      const finalScale = cell.scale * pulse;

      // Dibujar glow si está activo
      if (cell.glow > 0.5) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = cell.glow;
      } else {
        ctx.shadowBlur = 0;
      }

      // Dibujar carácter con transformaciones
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.rotate(cell.rotation);
      ctx.scale(finalScale, finalScale);
      
      ctx.font = `${charSize}px monospace`;
      ctx.fillStyle = cell.currentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.char, 0, 0);
      
      ctx.restore();
      ctx.shadowBlur = 0;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [colors.hover, colors.glow, charSize, mouseInfluence]);

  // Manejar resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        setDimensions({ width: rect.width, height: rect.height });
        initGrid(rect.width, rect.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [initGrid]);

  // Iniciar animación cuando tenemos dimensiones
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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

export default AsciiBackground;