import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { CoreProcessor } from './CoreProcessor';
import { NeuralLayer } from './NeuralLayer';
import { StarField } from './StarField';

export function EmergentOpticalScene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Core Processing Unit */}
      <CoreProcessor position={[0, 0, 0]} scale={1} />
      
      {/* Neural Network Layer */}
      <NeuralLayer radius={5} neuronCount={100} />
      
      {/* Outer Star Field */}
      <StarField count={100000} radius={15} />
      
      {/* Environment */}
      <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Post Processing */}
      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.1} />
        <ChromaticAberration offset={[0.002, 0.002]} />
      </EffectComposer>
      
      <OrbitControls />
    </>
  );
}