import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ChatInterface } from './components/ChatInterface';
import { EmergentOpticalScene } from './components/EmergentOpticalScene';

function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/2 flex flex-col">
        <ChatInterface />
      </div>
      <div className="w-1/2">
        <Canvas>
          <EmergentOpticalScene />
        </Canvas>
      </div>
    </div>
  );
}

export default App;