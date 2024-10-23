import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CoreProcessorProps {
  position: [number, number, number];
  scale: number;
}

export function CoreProcessor({ position, scale }: CoreProcessorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          time: { value: 0 },
          resolution: { value: new THREE.Vector2(1024, 1024) }
        }}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec2 resolution;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          vec3 colorA = vec3(0.5, 0.0, 1.0);
          vec3 colorB = vec3(0.0, 0.5, 1.0);
          
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float len = length(p);
            
            float pattern = sin(len * 10.0 - time) * 0.5 + 0.5;
            vec3 color = mix(colorA, colorB, pattern);
            
            float pulse = sin(time * 2.0) * 0.5 + 0.5;
            color *= pulse;
            
            gl_FragColor = vec4(color, 0.9);
          }
        `}
        transparent
      />
    </mesh>
  );
}