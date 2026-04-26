import { useEffect, useState, type CSSProperties } from 'react';
import type { Archetype } from '../archetypes';

interface Props {
  arch: Archetype;
  playerName: string;
  fitScore: number;
  onComplete: () => void;
}

/**
 * Cinematic player archetype reveal.
 *
 * Plays a ~3 s archetype-themed sequence before the modal opens:
 *  1. Backdrop fades in over the page.
 *  2. Themed effect plays in the background (scope ring, streaks, smoke …).
 *  3. Icon punches into view, archetype name rises, fit score pops.
 *  4. Overlay fades and `onComplete` is called so the parent can swap in the
 *     full archetype modal.
 *
 * Click anywhere to skip — same end state, just with a faster fade.
 */
const REVEAL_MS = 3100;
const FADE_OUT_MS = 320;

export default function ArchetypeReveal({ arch, playerName, fitScore, onComplete }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const tFade = setTimeout(() => setPhase('out'), REVEAL_MS - FADE_OUT_MS);
    const tDone = setTimeout(onComplete, REVEAL_MS);
    return () => {
      clearTimeout(tFade);
      clearTimeout(tDone);
    };
  }, [onComplete]);

  function skip() {
    if (phase === 'out') return;
    setPhase('out');
    setTimeout(onComplete, FADE_OUT_MS);
  }

  const Icon = arch.icon;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center cursor-pointer overflow-hidden ${
        phase === 'out' ? 'reveal-overlay-out' : 'reveal-overlay-in'
      }`}
      onClick={skip}
      role="dialog"
      aria-label={`Revealing ${arch.name}`}
    >
      {/* Layered backdrop: dark base + archetype-tinted gradient + blur. */}
      <div className="absolute inset-0 bg-dark-900/95" />
      <div className={`absolute inset-0 bg-gradient-to-br ${arch.gradientClass} opacity-70`} />
      <div className="absolute inset-0 backdrop-blur-md" />

      {/* Themed background effect (different per archetype). */}
      <div className="absolute inset-0 pointer-events-none">
        <ArchetypeDecorations arch={arch} />
      </div>

      {/* Center reveal column */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        <div className="reveal-pre-fade">
          <div className="text-[10px] uppercase tracking-[0.4em] text-slate-400">
            Now revealing
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">{playerName}</div>
        </div>

        <div
          className={`mt-8 p-6 sm:p-8 rounded-3xl bg-dark-800/80 border-2 ${arch.borderClass} shadow-2xl reveal-icon-punch`}
        >
          <Icon size={80} className={arch.textClass} strokeWidth={1.75} />
        </div>

        <div className="mt-8">
          <div
            className={`reveal-name-rise text-4xl sm:text-6xl font-extrabold ${arch.textClass} drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]`}
          >
            {arch.name}
          </div>
          <div className="reveal-tagline-fade mt-2 text-sm sm:text-base text-slate-300">
            {arch.role}
          </div>
          <div
            className={`reveal-tagline-fade mt-3 text-base sm:text-lg italic ${arch.textClass} opacity-90`}
          >
            "{arch.tagline}"
          </div>
        </div>

        <div className="reveal-score-pop mt-8 flex items-baseline gap-3">
          <div className={`text-5xl sm:text-7xl font-extrabold ${arch.textClass} tabular-nums`}>
            {Math.round(fitScore)}
          </div>
          <div className="text-left">
            <div className={`text-xs uppercase tracking-[0.2em] font-bold ${arch.textClass}`}>
              Fit Score
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">out of 100</div>
          </div>
        </div>
      </div>

      <div className="reveal-skip-hint absolute bottom-6 left-0 right-0 text-center text-[11px] uppercase tracking-[0.3em] text-slate-400">
        click anywhere to skip
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-archetype background decoration. Each branch produces a small set of
// absolutely-positioned elements wired to keyframes in index.css.
// ---------------------------------------------------------------------------

function ArchetypeDecorations({ arch }: { arch: Archetype }) {
  switch (arch.id) {
    case 'sharpshooter':
      return <SharpshooterDeco color={cssColor(arch.textClass)} />;
    case 'spearhead':
      return <SpearheadDeco color={cssColor(arch.textClass)} />;
    case 'phantom':
      return <PhantomDeco color={cssColor(arch.textClass)} />;
    case 'wall':
      return <WallDeco color={cssColor(arch.textClass)} />;
    case 'architect':
      return <ArchitectDeco color={cssColor(arch.textClass)} />;
    case 'wingman':
      return <WingmanDeco color={cssColor(arch.textClass)} />;
    case 'closer':
      return <CloserDeco color={cssColor(arch.textClass)} />;
    case 'hammer':
      return <HammerDeco color={cssColor(arch.textClass)} />;
    case 'vanguard':
      return <VanguardDeco color={cssColor(arch.textClass)} />;
    case 'maverick':
      return <MaverickDeco color={cssColor(arch.textClass)} />;
    default:
      return null;
  }
}

/**
 * Map an archetype's tailwind text-class (e.g. `text-violet-300`) to a raw
 * CSS color string we can drop into inline styles for borders/backgrounds.
 * Tailwind 4 will purge anything we don't reference statically, so we
 * keep this list 1:1 with what the archetype config actually uses.
 */
function cssColor(textClass: string): string {
  const map: Record<string, string> = {
    'text-violet-300': '#c4b5fd',
    'text-red-300': '#fca5a5',
    'text-indigo-300': '#a5b4fc',
    'text-cyan-300': '#67e8f9',
    'text-emerald-300': '#6ee7b7',
    'text-amber-300': '#fcd34d',
    'text-yellow-300': '#fde047',
    'text-rose-300': '#fda4af',
    'text-sky-300': '#7dd3fc',
    'text-orange-300': '#fdba74',
  };
  return map[textClass] ?? '#94a3b8';
}

// ---------------- Sharpshooter --------------------------------------------
function SharpshooterDeco({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 200, 400].map((delay, i) => (
        <div
          key={i}
          className="absolute deco-scope-ring rounded-full"
          style={{
            width: `${40 + i * 18}vmin`,
            height: `${40 + i * 18}vmin`,
            border: `2px solid ${color}`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
      {/* Crosshair */}
      <div
        className="absolute deco-scope-cross"
        style={{
          width: '60vmin',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div
        className="absolute deco-scope-cross"
        style={{
          width: '2px',
          height: '60vmin',
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
          animationDelay: '300ms',
        }}
      />
    </div>
  );
}

// ---------------- Spearhead -----------------------------------------------
function SpearheadDeco({ color }: { color: string }) {
  const streaks = [
    { from: '-50vw', to: '-50vh', rot: 30, delay: 0 },
    { from: '50vw', to: '-50vh', rot: -30, delay: 80 },
    { from: '-50vw', to: '50vh', rot: -30, delay: 160 },
    { from: '50vw', to: '50vh', rot: 30, delay: 240 },
    { from: '0', to: '-60vh', rot: 90, delay: 120 },
    { from: '0', to: '60vh', rot: -90, delay: 200 },
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {streaks.map((s, i) => (
        <div
          key={i}
          className="absolute deco-streak"
          style={
            {
              width: '60vmin',
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              transform: `rotate(${s.rot}deg)`,
              '--from-x': s.from,
              '--from-y': s.to,
              animationDelay: `${s.delay}ms`,
              filter: 'blur(1px)',
            } as RevealCSS
          }
        />
      ))}
      <div
        className="absolute deco-impact-flash rounded-full"
        style={{
          width: '40vmin',
          height: '40vmin',
          background: `radial-gradient(circle, ${color}88 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}

// ---------------- Phantom -------------------------------------------------
function PhantomDeco({ color }: { color: string }) {
  const wisps = Array.from({ length: 7 }, (_, i) => ({
    x: -40 + i * 14,
    delay: i * 180,
    size: 18 + (i % 3) * 6,
  }));
  return (
    <div className="absolute inset-0">
      {wisps.map((w, i) => (
        <div
          key={i}
          className="absolute deco-smoke rounded-full"
          style={
            {
              left: '50%',
              bottom: '20%',
              width: `${w.size}vmin`,
              height: `${w.size}vmin`,
              background: `radial-gradient(circle, ${color}80, transparent 70%)`,
              '--drift-x': `${w.x}vmin`,
              animationDelay: `${w.delay}ms`,
            } as RevealCSS
          }
        />
      ))}
    </div>
  );
}

// ---------------- Wall ----------------------------------------------------
function WallDeco({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 220, 440, 660].map((delay, i) => (
        <div
          key={i}
          className="absolute deco-ripple rounded-full"
          style={{
            width: '30vmin',
            height: '30vmin',
            border: `3px solid ${color}`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------- Architect -----------------------------------------------
function ArchitectDeco({ color }: { color: string }) {
  const lines = 8;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Horizontal grid lines */}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={`h${i}`}
          className="absolute deco-grid-h left-0 right-0"
          style={{
            top: `${(i + 1) * (100 / (lines + 1))}%`,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
      {/* Vertical grid lines */}
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={`v${i}`}
          className="absolute deco-grid-v top-0 bottom-0"
          style={{
            left: `${(i + 1) * (100 / (lines + 1))}%`,
            width: '1px',
            background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
            animationDelay: `${i * 60 + 200}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------- Wingman -------------------------------------------------
function WingmanDeco({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="absolute deco-arrow-left"
        style={{
          width: '50vmin',
          height: '4px',
          background: `linear-gradient(90deg, transparent, ${color})`,
          filter: 'blur(1px)',
        }}
      />
      <div
        className="absolute deco-arrow-right"
        style={{
          width: '50vmin',
          height: '4px',
          background: `linear-gradient(270deg, transparent, ${color})`,
          filter: 'blur(1px)',
          animationDelay: '60ms',
        }}
      />
      <div
        className="absolute deco-arrow-left"
        style={{
          width: '40vmin',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color})`,
          transform: 'translateY(20px)',
          animationDelay: '180ms',
        }}
      />
      <div
        className="absolute deco-arrow-right"
        style={{
          width: '40vmin',
          height: '2px',
          background: `linear-gradient(270deg, transparent, ${color})`,
          transform: 'translateY(-20px)',
          animationDelay: '240ms',
        }}
      />
    </div>
  );
}

// ---------------- Closer --------------------------------------------------
function CloserDeco({ color }: { color: string }) {
  return (
    <div
      className="absolute inset-0 deco-spotlight"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${color}40 0%, transparent 65%)`,
      }}
    />
  );
}

// ---------------- Hammer --------------------------------------------------
function HammerDeco({ color }: { color: string }) {
  const sparkCount = 14;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="absolute inset-0 deco-screen-flash"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
        }}
      />
      {[0, 180, 360].map((delay, i) => (
        <div
          key={i}
          className="absolute deco-shockwave rounded-full"
          style={{
            width: '25vmin',
            height: '25vmin',
            border: `4px solid ${color}`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
      {Array.from({ length: sparkCount }, (_, i) => {
        const angle = (i / sparkCount) * Math.PI * 2;
        const dist = 35 + (i % 3) * 10;
        return (
          <div
            key={`sp${i}`}
            className="absolute deco-spark rounded-full"
            style={
              {
                width: '6px',
                height: '6px',
                background: color,
                boxShadow: `0 0 12px ${color}`,
                '--spark-x': `${Math.cos(angle) * dist}vmin`,
                '--spark-y': `${Math.sin(angle) * dist}vmin`,
                animationDelay: `${300 + (i % 4) * 60}ms`,
              } as RevealCSS
            }
          />
        );
      })}
    </div>
  );
}

// ---------------- Vanguard ------------------------------------------------
function VanguardDeco({ color }: { color: string }) {
  const rays = 12;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {Array.from({ length: rays }, (_, i) => (
        <div
          key={i}
          className="absolute deco-ray"
          style={
            {
              width: '4px',
              height: '70vmin',
              background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
              '--ray-rot': `${(i / rays) * 360}deg`,
              animationDelay: `${i * 50}ms`,
              filter: 'blur(0.5px)',
            } as RevealCSS
          }
        />
      ))}
    </div>
  );
}

// ---------------- Maverick ------------------------------------------------
function MaverickDeco({ color }: { color: string }) {
  const coins = Array.from({ length: 18 }, (_, i) => ({
    x: -45 + (i * 5.5),
    delay: i * 90,
    size: 14 + ((i * 7) % 12),
  }));
  return (
    <div className="absolute inset-0 overflow-hidden">
      {coins.map((c, i) => (
        <div
          key={i}
          className="absolute deco-coin rounded-full"
          style={
            {
              left: '50%',
              top: '0',
              width: `${c.size}px`,
              height: `${c.size}px`,
              background: `radial-gradient(circle at 35% 30%, ${color}, ${color}99 60%, transparent 100%)`,
              boxShadow: `0 0 8px ${color}88`,
              '--coin-x': `${c.x}vmin`,
              animationDelay: `${c.delay}ms`,
            } as RevealCSS
          }
        />
      ))}
    </div>
  );
}

/**
 * Inline-style helper type so we can use CSS custom properties (e.g.
 * `--from-x`) in `style` props without TypeScript complaining.
 */
type RevealCSS = CSSProperties & Record<`--${string}`, string | number>;
