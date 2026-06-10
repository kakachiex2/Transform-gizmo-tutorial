'use client';

import { useCallback } from 'react';
import { useSceneStore } from '@/store/sceneStore';
import { roundToStep } from '@/utils/math';

export function useSnap() {
  const snapSettings = useSceneStore((s) => s.snapSettings);
  const setSnapSettings = useSceneStore((s) => s.setSnapSettings);
  const toggleSnap = useSceneStore((s) => s.toggleSnap);

  const snapTranslate = useCallback(
    (value: number) => {
      if (!snapSettings.snapEnabled) return value;
      return roundToStep(value, snapSettings.translateSnap);
    },
    [snapSettings]
  );

  const snapRotate = useCallback(
    (radians: number) => {
      if (!snapSettings.snapEnabled) return radians;
      const stepRad = (snapSettings.rotateSnap * Math.PI) / 180;
      return roundToStep(radians, stepRad);
    },
    [snapSettings]
  );

  const snapScale = useCallback(
    (value: number) => {
      if (!snapSettings.snapEnabled) return value;
      return Math.max(0.01, roundToStep(value, snapSettings.scaleSnap));
    },
    [snapSettings]
  );

  return {
    snapSettings,
    setSnapSettings,
    toggleSnap,
    snapTranslate,
    snapRotate,
    snapScale,
  };
}
