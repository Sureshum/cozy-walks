// Fondo ASCII reactivo - caracteres que cambian color al pasar el mouse

import { useEffect, useRef, useState, useCallback } from 'react';

const ASCII_CHARS = ['░', '▒', '▓', '█', '◆', '◇', '■', '□', '●', '○', '▲', '△', '▼', '▽', '◉', '◎', '★', '☆', '✦', '✧', '✨', '*', '+', '×', '÷', '≈', '≠', '≤', '≥', '∞', '∑', '∏', '√', '∫', '∂', '∆', '∇', '∈', '∉', '⊂', '⊃', '∪', '∩', '∀', '∃', '¬', '∧', '∨', '⊕', '⊗', '⊥', '⊤', '⟂', '∠', '∟', '⊾', '≡', '≢', '≣', '≦', '≧', '≨', '≩', '≪', '≫', '≬', '≭', '≮', '≯', '≰', '≱', '≲', '≳', '≴', '≵', '≶', '≷', '≸', '≹', '≺', '≻', '≼', '≽', '≾', '≿', '⊀', '⊁', '⊂', '⊃', '⊄', '⊅', '⊆', '⊇', '⊈', '⊉', '⊊', '⊋', '⊌', '⊍', '⊎', '⊏', '⊐', '⊑', '⊒', '⊓', '⊔', '⊕', '⊖', '⊗', '⊘', '⊙', '⊚', '⊛', '⊜', '⊝', '⊞', '⊟', '⊠', '⊡', '⊢', '⊣', '⊤', '⊥', '⊦', '⊧', '⊨', '⊩', '⊪', '⊫', '⊬', '⊭', '⊮', '⊯', '⊰', '⊱', '⊲', '⊳', '⊴', '⊵', '⊶', '⊷', '⊸', '⊹', '⊺', '⊻', '⊼', '⊽', '⊾', '⊿', '⋀', '⋁', '⋂', '⋃', '⋄', '⋅', '⋆', '⋇', '⋈', '⋉', '⋊', '⋋', '⋌', '⋍', '⋎', '⋏', '⋐', '⋑', '⋒', '⋓', '⋔', '⋕', '⋖', '⋗', '⋘', '⋙', '⋚', '⋛', '⋜', '⋝', '⋞', '⋟', '⋠', '⋡', '⋢', '⋣', '⋤', '⋥', '⋦', '⋧', '⋨', '⋩', '⋪', '⋫', '⋬', '⋭', '⋮', '⋯', '⋰', '⋱', '⋲', '⋳', '⋴', '⋵', '⋶', '⋷', '⋸', '⋹', '⋺', '⋻', '⋼', '⋽', '⋾', '⋿'];

interface AsciiBackgroundProps {
  className?: string;
  density?: number; // 0-1, qué tan denso es el grid
  charSize?: number; // tamaño en px de cada carácter
  colors?: {
    base: string;
    hover: string[];
    glow: string;
  };
}

export const AsciiBackground: React.FC<AsciiBackgroundProps> = ({
  className = '',
  density = 0.15,
  charSize = 20,
  colors = {
    base: '#3a3a3a',
    hover: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#a855f7', '#06b6d4', '#f97316'],
    glow: 'rgba(255, 107, 107, 0.3)',
  },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Grid de caracteres
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
  }>>([]);

  // Inicializar grid
  const initGrid = useCallback((width: number, height: number) => {
    const cols = Math.floor(width / charSize);
    const rows = Math.floor(height / charSize);
    const newGrid = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() > density) continue;

        const char = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
        const x = col * charSize + charSize / 2;
        const y = row * charSize + charSize / 2;
        
        newGrid.push({
          char,
          x,
          y,
          baseColor: colors.base,
          currentColor: colors.base,
          targetColor: colors.base,
          glow: 0,
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 1.5,
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
      const maxDist = 180; // radio de influencia del mouse

      // Efecto de proximidad al mouse
      if (dist < maxDist) {
        const intensity = 1 - dist / maxDist;
        const colorIndex = Math.floor((cell.x + cell.y + time * 100) % colors.hover.length);
        cell.targetColor = colors.hover[colorIndex];
        cell.glow = intensity * 15;
      } else {
        cell.targetColor = cell.baseColor;
        cell.glow *= 0.95;
      }

      // Interpolar color actual hacia target
      // Simple interpolación para el color (aproximación)
      cell.currentColor = cell.targetColor;

      // Animación de fase (respiración suave)
      cell.phase += cell.speed * 0.01;
      const pulse = Math.sin(cell.phase) * 0.15 + 1;
      const size = charSize * pulse * 0.5;

      // Dibujar glow si está activo
      if (cell.glow > 0.5) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = cell.glow;
      } else {
        ctx.shadowBlur = 0;
      }

      // Dibujar carácter
      ctx.font = `${size}px monospace`;
      ctx.fillStyle = cell.currentColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.char, cell.x, cell.y);
      
      ctx.shadowBlur = 0;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [colors.hover, colors.glow, charSize]);

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
      aria-hidden="true"
    />
  );
};

export default AsciiBackground;