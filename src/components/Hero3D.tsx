import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';

const Hero3D: React.FC = () => {
    return (
        <div className="h-[400px] w-full md:h-[600px]">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <mesh>
                    <Sphere visible args={[1, 100, 200]} scale={2.5}>
                        <MeshDistortMaterial
                            color="#4F46E5"
                            attach="material"
                            distort={0.5}
                            speed={2}
                            roughness={0.2}
                        />
                    </Sphere>
                </mesh>
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={4} />
            </Canvas>
        </div>
    );
};

export default Hero3D;
