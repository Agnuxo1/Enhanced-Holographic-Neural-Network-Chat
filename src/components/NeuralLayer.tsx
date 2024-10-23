import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

interface NeuralLayerProps {
  radius: number;
  neuronCount: number;
}

export function NeuralLayer({ radius, neuronCount }: NeuralLayerProps) {
  const neurons = useMemo(() => {
    const temp = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    
    for (let i = 0; i < neuronCount; i++) {
      const y = 1 - (i / (neuronCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      
      temp.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
    return temp;
  }, [radius, neuronCount]);

  const connections = useMemo(() => {
    const temp = [];
    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        if (Math.random() < 0.03) { // 3% chance of connection
          temp.push({
            points: [neurons[i], neurons[j]],
            color: new THREE.Color(0.1, 0.5, 1.0)
          });
        }
      }
    }
    return temp;
  }, [neurons]);

  return (
    <group>
      {neurons.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={new THREE.Color(0.1, 0.5, 1.0)} />
        </mesh>
      ))}
      
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={conn.points}
          color={conn.color}
          lineWidth={1}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
}