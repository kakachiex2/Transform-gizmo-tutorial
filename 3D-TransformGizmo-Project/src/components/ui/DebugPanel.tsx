'use client';

import React from 'react';
import { useGizmoStore } from '@/store/gizmoStore';
import { useSceneStore } from '@/store/sceneStore';
import { useSelectionStore } from '@/store/selectionStore';
import { getHandleMode } from '@/types/gizmo';
import { radiansToDegrees } from '@/utils/math';

export function DebugPanel() {
  const activeMode = useGizmoStore((s) => s.activeMode);
  const space = useGizmoStore((s) => s.space);
  const isDragging = useGizmoStore((s) => s.dragState.isDragging);
  const activeHandle = useGizmoStore((s) => s.dragState.activeHandle);
  const hoveredHandle = useGizmoStore((s) => s.hoveredHandle);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const objects = useSceneStore((s) => s.objects);
  const snapSettings = useSceneStore((s) => s.snapSettings);

  const selectedObj = objects.find((o) => o.id === selectedId);

  // Show auto-detected mode from handle
  const currentHandle = activeHandle || hoveredHandle;
  const displayMode = activeMode || (currentHandle ? getHandleMode(currentHandle) : null);

  return (
    <div className="absolute bottom-10 left-4 z-20 w-52 bg-[#1A1F2B]/90 backdrop-blur-md rounded-xl border border-[#2A3445] shadow-2xl overflow-hidden text-[10px]">
      <div className="px-3 py-1.5 border-b border-[#2A3445]">
        <h3 className="text-[10px] font-semibold text-[#7F8C8D] uppercase tracking-wider">Debug</h3>
      </div>
      <div className="px-3 py-2 space-y-1">
        <DebugRow label="Mode" value={displayMode || 'universal'} />
        <DebugRow label="Space" value={space} />
        <DebugRow label="Dragging" value={isDragging ? 'Yes' : 'No'} highlight={isDragging} />
        <DebugRow label="Active Handle" value={activeHandle ?? '—'} />
        <DebugRow label="Hovered Handle" value={hoveredHandle ?? '—'} />
        <DebugRow label="Selected" value={selectedId ?? '—'} />
        <DebugRow label="Snap" value={snapSettings.snapEnabled ? `${snapSettings.translateSnap}/${snapSettings.rotateSnap}°/${snapSettings.scaleSnap}` : 'Off'} />

        {selectedObj && (
          <>
            <div className="border-t border-[#2A3445] my-1" />
            <DebugRow label="Position" value={`${selectedObj.transform.position.x.toFixed(2)}, ${selectedObj.transform.position.y.toFixed(2)}, ${selectedObj.transform.position.z.toFixed(2)}`} />
            <DebugRow label="Rotation" value={`${radiansToDegrees(selectedObj.transform.rotation.x).toFixed(1)}°, ${radiansToDegrees(selectedObj.transform.rotation.y).toFixed(1)}°, ${radiansToDegrees(selectedObj.transform.rotation.z).toFixed(1)}°`} />
            <DebugRow label="Scale" value={`${selectedObj.transform.scale.x.toFixed(2)}, ${selectedObj.transform.scale.y.toFixed(2)}, ${selectedObj.transform.scale.z.toFixed(2)}`} />
          </>
        )}
      </div>
    </div>
  );
}

function DebugRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#7F8C8D]">{label}</span>
      <span className={highlight ? 'text-[#E74C3C] font-medium' : 'text-[#BDC3C7]'}>{value}</span>
    </div>
  );
}
