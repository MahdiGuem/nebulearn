import { useState } from 'react';

export function PlanetCustomizer() {
  const [size, setSize] = useState(65);
  const [rotation, setRotation] = useState(45);
  const [atmosphere, setAtmosphere] = useState(80);
  const [hasRings, setHasRings] = useState(true);
  const [hasAurora, setHasAurora] = useState(false);
  const [hasMoons, setHasMoons] = useState(true);

  return (
    <div className="glassmorphic-sidebar rounded-[24px] p-6 border border-purple-500/30 shadow-3d w-[340px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-[12px] bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/30">
          <span className="text-indigo-300 text-xl">🌍</span>
        </div>
        <h2 className="text-purple-100 tracking-wide">Planet Customizer</h2>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-purple-200/90 text-sm tracking-wide flex items-center gap-2">
            <span>✨</span>
            Planet Size
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="cosmic-slider"
          />
          <div className="text-right text-purple-300/60 text-xs">{size}%</div>
        </div>

        <div className="space-y-3">
          <label className="text-purple-200/90 text-sm tracking-wide flex items-center gap-2">
            <span>🔄</span>
            Rotation Speed
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="cosmic-slider"
          />
          <div className="text-right text-purple-300/60 text-xs">{rotation}%</div>
        </div>

        <div className="space-y-3">
          <label className="text-purple-200/90 text-sm tracking-wide flex items-center gap-2">
            <span>⚡</span>
            Atmosphere Density
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={atmosphere}
            onChange={(e) => setAtmosphere(Number(e.target.value))}
            className="cosmic-slider"
          />
          <div className="text-right text-purple-300/60 text-xs">{atmosphere}%</div>
        </div>

        <div className="h-px bg-purple-500/20 my-6"></div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-purple-200/90 text-sm tracking-wide">Planetary Rings</label>
            <button
              type="button"
              onClick={() => setHasRings(!hasRings)}
              className={`cosmic-toggle ${hasRings ? 'active' : ''}`}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-purple-200/90 text-sm tracking-wide">Aurora Effect</label>
            <button
              type="button"
              onClick={() => setHasAurora(!hasAurora)}
              className={`cosmic-toggle ${hasAurora ? 'active' : ''}`}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-purple-200/90 text-sm tracking-wide">Orbital Moons</label>
            <button
              type="button"
              onClick={() => setHasMoons(!hasMoons)}
              className={`cosmic-toggle ${hasMoons ? 'active' : ''}`}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}