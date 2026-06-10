'use client';

import React from 'react';
import { useGizmoStore } from '@/store/gizmoStore';
import { useSceneStore } from '@/store/sceneStore';
import { useSelectionStore } from '@/store/selectionStore';
import { TransformMode } from '@/types/gizmo';
import { getHandleMode } from '@/types/gizmo';
import { radiansToDegrees } from '@/utils/math';

export function StatusBar() {
  const activeMode = useGizmoStore((s) => s.activeMode);
  const space = useGizmoStore((s) => s.space);
  const hoveredHandle = useGizmoStore((s) => s.hoveredHandle);
  const isDragging = useGizmoStore((s) => s.dragState.isDragging);
  const activeHandle = useGizmoStore((s) => s.dragState.activeHandle);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const objects = useSceneStore((s) => s.objects);
  const snapEnabled = useSceneStore((s) => s.snapSettings.snapEnabled);

  const selectedObj = objects.find((o) => o.id === selectedId);

  // Determine the current operation mode from hover or drag
  const currentHandle = activeHandle || hoveredHandle;
  const displayMode = activeMode || (currentHandle ? getHandleMode(currentHandle) : null);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-7 bg-[#1A1F2B]/90 backdrop-blur-md border-t border-[#2A3445] flex items-center px-3 gap-4 text-[10px]">
      {/* Operation mode (auto-detected from handle) */}
      <StatusItem
        label="Mode"
        value={displayMode ? displayMode.charAt(0).toUpperCase() + displayMode.slice(1) : 'Universal'}
        color={displayMode === TransformMode.TRANSLATE ? '#2ECC71' : displayMode === TransformMode.ROTATE ? '#E74C3C' : displayMode === TransformMode.SCALE ? '#3498DB' : '#7F8C8D'}
      />

      <Separator />

      {/* Space indicator */}
      <StatusItem label="Space" value={space.toUpperCase()} color="#F39C12" />

      <Separator />

      {/* Active handle */}
      {currentHandle && (
        <>
          <StatusItem
            label="Handle"
            value={currentHandle.replace(/_/g, ' ')}
            color="#9B59B6"
          />
          <Separator />
        </>
      )}

      {/* Drag status */}
      <StatusItem
        label="Drag"
        value={isDragging ? 'Active' : 'Idle'}
        color={isDragging ? '#E74C3C' : '#7F8C8D'}
      />

      <Separator />

      {/* Snap status */}
      <StatusItem
        label="Snap"
        value={snapEnabled ? 'On' : 'Off'}
        color={snapEnabled ? '#2ECC71' : '#7F8C8D'}
      />

      <Separator />

      {/* Shortcut hints */}
      <span className="text-[#5A6577]">
        <span className="text-[#7F8C8D]">Arrows</span> Move · <span className="text-[#7F8C8D]">Arcs</span> Rotate · <span className="text-[#7F8C8D]">Cubes</span> Scale · <span className="text-[#7F8C8D]">Alt+LMB</span> Orbit · <span className="text-[#7F8C8D]">Alt+RMB</span> Pan · <span className="text-[#7F8C8D]">Alt+Scroll</span> Zoom · <span className="text-[#7F8C8D]">Shift</span> Snap · <span className="text-[#7F8C8D]">Del</span> Delete · <span className="text-[#7F8C8D]">Q</span> Deselect
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selection info */}
      {selectedObj && (
        <>
          <span className="text-[#7F8C8D]">
            <span className="text-[#BDC3C7]">{selectedObj.name}</span>
            {' '}pos: ({selectedObj.transform.position.x.toFixed(1)}, {selectedObj.transform.position.y.toFixed(1)}, {selectedObj.transform.position.z.toFixed(1)})
          </span>
          <Separator />
          <span className="text-[#7F8C8D]">
            rot: ({radiansToDegrees(selectedObj.transform.rotation.x).toFixed(1)}°, {radiansToDegrees(selectedObj.transform.rotation.y).toFixed(1)}°, {radiansToDegrees(selectedObj.transform.rotation.z).toFixed(1)}°)
          </span>
          <Separator />
          <span className="text-[#7F8C8D]">
            scale: ({selectedObj.transform.scale.x.toFixed(2)}, {selectedObj.transform.scale.y.toFixed(2)}, {selectedObj.transform.scale.z.toFixed(2)})
          </span>
        </>
      )}

      {!selectedObj && (
        <span className="text-[#7F8C8D]">No selection</span>
      )}

      <Separator />

      {/* Object count */}
      <span className="text-[#7F8C8D]">
        Objects: {objects.length}
      </span>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="text-[#7F8C8D]">
      {label}: <span style={{ color }}>{value}</span>
    </span>
  );
}

function Separator() {
  return <span className="text-[#2A3445]">|</span>;
}
