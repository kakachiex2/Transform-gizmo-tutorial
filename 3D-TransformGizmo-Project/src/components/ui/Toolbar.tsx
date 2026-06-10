'use client';

import React, { useState } from 'react';
import { Globe, Pin, Magnet, MousePointer2, Settings, X } from 'lucide-react';
import { useGizmoStore } from '@/store/gizmoStore';
import { useSceneStore } from '@/store/sceneStore';
import { TransformSpace } from '@/types/gizmo';
import { cn } from '@/lib/utils';

/**
 * Background gradient presets (Blender-style vignette)
 */
export interface GradientPreset {
  name: string;
  value: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Dark Navy', value: 'radial-gradient(ellipse at center, #2A3A52 0%, #1A1F2B 50%, #0D1117 100%)' },
  { name: 'Blender Dark', value: 'radial-gradient(ellipse at center, #303030 0%, #1A1A1A 50%, #0A0A0A 100%)' },
  { name: 'Midnight Blue', value: 'radial-gradient(ellipse at center, #1B2838 0%, #0F1923 50%, #050A10 100%)' },
  { name: 'Deep Space', value: 'radial-gradient(ellipse at center, #1A1A2E 0%, #16213E 40%, #0A0E1A 100%)' },
  { name: 'Charcoal', value: 'radial-gradient(ellipse at center, #3A3A3A 0%, #222222 50%, #111111 100%)' },
  { name: 'Ocean Deep', value: 'radial-gradient(ellipse at center, #1B3A4B 0%, #0D2137 50%, #060E18 100%)' },
  { name: 'Forest Night', value: 'radial-gradient(ellipse at center, #1E3322 0%, #0F1A10 50%, #050A05 100%)' },
  { name: 'Flat Dark', value: '#1E2532' },
];

export function Toolbar({
  currentGradient,
  onGradientChange,
}: {
  currentGradient: string;
  onGradientChange: (gradient: string) => void;
}) {
  const space = useGizmoStore((s) => s.space);
  const setSpace = useGizmoStore((s) => s.setSpace);
  const snapEnabled = useSceneStore((s) => s.snapSettings.snapEnabled);
  const toggleSnap = useSceneStore((s) => s.toggleSnap);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#1A1F2B]/90 backdrop-blur-md rounded-xl border border-[#2A3445] p-1 shadow-2xl">
        {/* Selection mode */}
        <ToolButton
          active={false}
          onClick={() => {}}
          tooltip="Select (Q)"
          shortcut="Q"
        >
          <MousePointer2 size={16} />
        </ToolButton>

        <div className="w-px h-6 bg-[#2A3445] mx-1" />

        {/* Space modes */}
        <ToolButton
          active={space === TransformSpace.WORLD}
          onClick={() => setSpace(TransformSpace.WORLD)}
          tooltip="World Space"
        >
          <Globe size={16} />
        </ToolButton>
        <ToolButton
          active={space === TransformSpace.LOCAL}
          onClick={() => setSpace(TransformSpace.LOCAL)}
          tooltip="Local Space"
        >
          <Pin size={16} />
        </ToolButton>

        <div className="w-px h-6 bg-[#2A3445] mx-1" />

        {/* Snap toggle */}
        <ToolButton
          active={snapEnabled}
          onClick={toggleSnap}
          tooltip="Snap (Shift)"
          shortcut="⇧"
        >
          <Magnet size={16} />
        </ToolButton>

        <div className="w-px h-6 bg-[#2A3445] mx-1" />

        {/* Settings */}
        <ToolButton
          active={showSettings}
          onClick={() => setShowSettings(!showSettings)}
          tooltip="Viewport Settings"
        >
          <Settings size={16} />
        </ToolButton>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-72 bg-[#1A1F2B]/95 backdrop-blur-md rounded-xl border border-[#2A3445] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A3445]">
            <h3 className="text-xs font-semibold text-[#BDC3C7] uppercase tracking-wider">Viewport Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-[#7F8C8D] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-3 py-3">
            <p className="text-[10px] text-[#7F8C8D] mb-2 uppercase tracking-wider">Background Gradient</p>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onGradientChange(preset.value)}
                  className={cn(
                    'group relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-150',
                    currentGradient === preset.value
                      ? 'border-[#3498DB] bg-[#2A3445]'
                      : 'border-[#2A3445] hover:border-[#3D4F65] hover:bg-[#2A3445]/50'
                  )}
                >
                  <div
                    className="w-full h-8 rounded-md border border-[#2A3445]"
                    style={{ background: preset.value }}
                  />
                  <span className="text-[9px] text-[#BDC3C7] group-hover:text-white transition-colors">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToolButton({
  active,
  onClick,
  tooltip,
  shortcut,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tooltip?: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150',
        'text-[#BDC3C7] hover:text-white hover:bg-[#2A3445]',
        active && 'bg-[#2A3445] text-white shadow-inner',
        active && 'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:rounded-full after:bg-[#3498DB]'
      )}
    >
      {children}
      {shortcut && (
        <span className="absolute -bottom-4 text-[8px] text-[#7F8C8D] opacity-0 group-hover:opacity-100">
          {shortcut}
        </span>
      )}
    </button>
  );
}
