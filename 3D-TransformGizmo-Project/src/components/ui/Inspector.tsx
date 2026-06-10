'use client';

import React from 'react';
import * as THREE from 'three';
import { useSelectionStore } from '@/store/selectionStore';
import { useSceneStore } from '@/store/sceneStore';
import { useGizmoStore } from '@/store/gizmoStore';
import { TransformMode, TransformSpace } from '@/types/gizmo';
import { radiansToDegrees, vectorToString, eulerToString } from '@/utils/math';
import { Box, Circle, Cylinder, Cone, Torus } from 'lucide-react';

export function Inspector() {
  const selectedId = useSelectionStore((s) => s.selectedId);
  const objects = useSceneStore((s) => s.objects);
  const activeMode = useGizmoStore((s) => s.activeMode);
  const space = useGizmoStore((s) => s.space);
  const updateTransform = useSceneStore((s) => s.updateTransform);
  const addObject = useSceneStore((s) => s.addObject);
  const removeObject = useSceneStore((s) => s.removeObject);

  const selectedObj = objects.find((o) => o.id === selectedId);

  const addPrimitive = (type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus') => {
    const id = `${type}_${Date.now()}`;
    addObject({
      id,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      transform: {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          0.5,
          (Math.random() - 0.5) * 4
        ),
        rotation: new THREE.Euler(0, 0, 0),
        quaternion: new THREE.Quaternion(),
        scale: new THREE.Vector3(1, 1, 1),
      },
      selected: false,
      visible: true,
    });
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-56 bg-[#1A1F2B]/90 backdrop-blur-md rounded-xl border border-[#2A3445] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#2A3445]">
        <h3 className="text-xs font-semibold text-[#BDC3C7] uppercase tracking-wider">Inspector</h3>
      </div>

      {/* Add Primitives */}
      <div className="px-3 py-2 border-b border-[#2A3445]">
        <p className="text-[10px] text-[#7F8C8D] mb-1.5 uppercase tracking-wider">Add Object</p>
        <div className="flex gap-1">
          <AddButton onClick={() => addPrimitive('cube')} tooltip="Cube"><Box size={13} /></AddButton>
          <AddButton onClick={() => addPrimitive('sphere')} tooltip="Sphere"><Circle size={13} /></AddButton>
          <AddButton onClick={() => addPrimitive('cylinder')} tooltip="Cylinder"><Cylinder size={13} /></AddButton>
          <AddButton onClick={() => addPrimitive('cone')} tooltip="Cone"><Cone size={13} /></AddButton>
          <AddButton onClick={() => addPrimitive('torus')} tooltip="Torus"><Torus size={13} /></AddButton>
        </div>
      </div>

      {/* Scene objects list */}
      <div className="px-3 py-2 border-b border-[#2A3445] max-h-36 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] text-[#7F8C8D] mb-1.5 uppercase tracking-wider">Scene</p>
        {objects.length === 0 && (
          <p className="text-[10px] text-[#7F8C8D]">No objects in scene</p>
        )}
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => useSelectionStore.getState().select(obj.id)}
            className={`flex items-center justify-between px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
              selectedId === obj.id
                ? 'bg-[#2A3445] text-white'
                : 'text-[#BDC3C7] hover:bg-[#2A3445]/50'
            }`}
          >
            <span>{obj.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeObject(obj.id);
                if (selectedId === obj.id) useSelectionStore.getState().select(null);
              }}
              className="text-[#7F8C8D] hover:text-[#E74C3C] transition-colors text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Selected object properties */}
      {selectedObj && (
        <div className="px-3 py-2">
          <p className="text-[10px] text-[#7F8C8D] mb-1.5 uppercase tracking-wider">
            {selectedObj.name} Properties
          </p>

          {/* Active Mode & Space info */}
          <div className="flex gap-2 mb-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A3445] text-[#3498DB]">
              {(activeMode || 'universal').toUpperCase()}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A3445] text-[#2ECC71]">
              {space.toUpperCase()}
            </span>
          </div>

          {/* Position */}
          <TransformField
            label="Position"
            value={selectedObj.transform.position}
            onChange={(v) => updateTransform(selectedObj.id, { position: v })}
          />

          {/* Rotation */}
          <TransformField
            label="Rotation"
            value={new THREE.Vector3(
              radiansToDegrees(selectedObj.transform.rotation.x),
              radiansToDegrees(selectedObj.transform.rotation.y),
              radiansToDegrees(selectedObj.transform.rotation.z)
            )}
            suffix="°"
            onChange={(v) =>
              updateTransform(selectedObj.id, {
                rotation: new THREE.Euler(
                  v.x * Math.PI / 180,
                  v.y * Math.PI / 180,
                  v.z * Math.PI / 180
                ),
              })
            }
          />

          {/* Scale */}
          <TransformField
            label="Scale"
            value={selectedObj.transform.scale}
            onChange={(v) => updateTransform(selectedObj.id, { scale: v })}
          />
        </div>
      )}

      {!selectedObj && (
        <div className="px-3 py-4 text-center">
          <p className="text-[11px] text-[#7F8C8D]">No selection</p>
          <p className="text-[9px] text-[#5A6577] mt-1">Click an object to select</p>
        </div>
      )}
    </div>
  );
}

function TransformField({
  label,
  value,
  suffix = '',
  onChange,
}: {
  label: string;
  value: THREE.Vector3;
  suffix?: string;
  onChange: (v: THREE.Vector3) => void;
}) {
  const axes = ['x', 'y', 'z'] as const;
  const colors = { x: 'text-[#E74C3C]', y: 'text-[#2ECC71]', z: 'text-[#3498DB]' };

  return (
    <div className="mb-2">
      <p className="text-[9px] text-[#7F8C8D] mb-0.5">{label}</p>
      <div className="flex gap-1">
        {axes.map((axis) => (
          <div key={axis} className="flex-1 flex items-center gap-0.5">
            <span className={`text-[9px] ${colors[axis]} w-2`}>{axis.toUpperCase()}</span>
            <input
              type="number"
              step={0.1}
              value={parseFloat(value[axis].toFixed(2))}
              onChange={(e) => {
                const newVal = value.clone();
                newVal[axis] = parseFloat(e.target.value) || 0;
                onChange(newVal);
              }}
              className="w-full bg-[#0D1117] border border-[#2A3445] rounded text-[10px] text-[#BDC3C7] px-1 py-0.5 focus:outline-none focus:border-[#3498DB] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddButton({
  onClick,
  tooltip,
  children,
}: {
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={`Add ${tooltip}`}
      className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1117] border border-[#2A3445] text-[#7F8C8D] hover:text-white hover:border-[#3498DB] transition-all duration-150"
    >
      {children}
    </button>
  );
}
