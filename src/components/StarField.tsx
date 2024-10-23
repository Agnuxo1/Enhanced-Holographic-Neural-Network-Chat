import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Points } from '@react-three/drei';

interface StarFieldProps {
  count: number;
  radius: number;
}

export function StarField({ count, radius }: StarFieldProps) {
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);
      
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, [count, radius]);

  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.01}
        color={new THREE.Color(1, 1, 1)}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </Points>
  );
}