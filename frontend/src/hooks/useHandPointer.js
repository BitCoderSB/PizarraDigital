import { useEffect, useRef } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export function useHandPointer({ videoRef, svgRef, enabled, onReady }) {
  const handsInstance = useRef(null)
  const cameraInstance = useRef(null)
  const isDrawing  = useRef(false)
  const isInitialized = useRef(false); 

  useEffect(() => {
    const currentVideoRef = videoRef.current;
    const currentSvgRef = svgRef.current;

    if (enabled && currentVideoRef && currentSvgRef && !isInitialized.current) {
      console.log('--- Iniciando MediaPipe y Cámara (primera vez o re-habilitado)...');

      handsInstance.current = new Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      handsInstance.current.setOptions({
        selfieMode: true,
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      handsInstance.current.onResults(results => {
        if (!enabled || !svgRef.current) { 
          if (isDrawing.current) {
            svgRef.current?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'touch' }));
            isDrawing.current = false;
          }
          return;
        }

        const svgEl = svgRef.current;
        const lm = results.multiHandLandmarks?.[0];

        if (!lm) { 
          if (isDrawing.current) {
            console.log('Mano perdida, dispatching pointerup.');
            svgEl.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'touch' }));
            isDrawing.current = false;
          }
          return;
        }

        const { left, top, width, height } = svgEl.getBoundingClientRect();
        const clientX = left + lm[8].x * width;
        const clientY = top  + lm[8].y * height;

        svgEl.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true, clientX, clientY, pointerId: 1, pointerType: 'touch'
        }));

        const indexUp  = lm[8].y < lm[6].y; 
        const middleUp = lm[12].y < lm[10].y; 

        if (indexUp && middleUp) {
          if (!isDrawing.current) {
            console.log('Índice y medio arriba, dispatching pointerdown.');
            svgEl.dispatchEvent(new PointerEvent('pointerdown', {
              bubbles: true, clientX, clientY, pointerId: 1, pointerType: 'touch'
            }));
            isDrawing.current = true;
          }
        } else if (indexUp && !middleUp && isDrawing.current) {
          console.log('Solo índice arriba, dispatching pointerup.');
          svgEl.dispatchEvent(new PointerEvent('pointerup', {
            bubbles: true, clientX, clientY, pointerId: 1, pointerType: 'touch'
          }));
          isDrawing.current = false;
        }
      });

      console.log('--- Iniciando cámara...');
      cameraInstance.current = new Camera(currentVideoRef, {
        onFrame: async () => {
          if (handsInstance.current && currentVideoRef && enabled) {
            await handsInstance.current.send({ image: currentVideoRef });
          }
        },
        width: 640,
        height: 480
      });
      cameraInstance.current.start();

      if (onReady) {
        onReady({
          hidePreview: () => { if (currentVideoRef) currentVideoRef.style.display = 'none' },
          showPreview: () => { if (currentVideoRef) currentVideoRef.style.display = 'block' }
        });
      }
      isInitialized.current = true; 
      console.log('--- MediaPipe y cámara iniciados correctamente.');

    } else if (!enabled && isInitialized.current) {
      console.log('--- Gestos deshabilitados: Limpiando MediaPipe y cámara...');
      if (cameraInstance.current) {
        cameraInstance.current.stop();
        cameraInstance.current = null;
      }
      if (handsInstance.current) {
        handsInstance.current.close();
        handsInstance.current = null;
      }
      isDrawing.current = false;
      isInitialized.current = false; 
      console.log('--- MediaPipe y cámara limpiados.');
    }

    return () => {
      console.log('--- Retornando función de limpieza final del efecto.');
      if (cameraInstance.current) {
        cameraInstance.current.stop();
        cameraInstance.current = null;
      }
      if (handsInstance.current) {
        handsInstance.current.close();
        handsInstance.current = null;
      }
      isDrawing.current = false;
      isInitialized.current = false;
      console.log('--- Limpieza final de MediaPipe/Cámara.');
    };

  }, [enabled, videoRef, svgRef, onReady]); 
}