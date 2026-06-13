import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

class CustomTimer {
    private _startTime: number;
    private _elapsedTime: number = 0;
    private _delta: number = 0;
    private _lastTime: number;

    constructor() {
        this._startTime = performance.now();
        this._lastTime = this._startTime;
    }

    update() {
        const now = performance.now();
        this._delta = (now - this._lastTime) / 1000;
        this._elapsedTime = (now - this._startTime) / 1000;
        this._lastTime = now;
    }

    getElapsed() {
        return this._elapsedTime;
    }

    getDelta() {
        return this._delta;
    }
}

interface ThreeSceneProps {
    isFullscreen: boolean;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ isFullscreen }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const lensGroupRef = useRef<THREE.Group | null>(null);

    // Dynamic resize handler
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = w / h;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(w, h);
            }
        };

        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100);

        return () => window.removeEventListener('resize', handleResize);
    }, [isFullscreen]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initialize Scene, Camera, Renderer
        let animationFrameId: number;
        const scene = new THREE.Scene();
        
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || 500;
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        camera.position.z = 8;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 10, 5);
        scene.add(dirLight);

        const cyanPointLight = new THREE.PointLight(0x00d2ff, 4.0, 20);
        cyanPointLight.position.set(0, 0, 3);
        scene.add(cyanPointLight);

        // Procedural 3D Camera/Prism Lens Assembly representing "StartupLens"
        const lensGroup = new THREE.Group();

        // 1. Lens Outer Metallic Barrel (Cylinder open at both ends)
        const barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 24, 1, true);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b, // Dark slate metal
            metalness: 0.95,
            roughness: 0.15,
            side: THREE.DoubleSide
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2; // Lie along Z axis
        lensGroup.add(barrel);

        // 2. Refractive Glass Lens Disc
        const glassGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.2, 24);
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.05,
            transmission: 0.95, // Transparent glass look
            thickness: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const glassElement = new THREE.Mesh(glassGeo, glassMat);
        glassElement.rotation.x = Math.PI / 2;
        lensGroup.add(glassElement);

        // 3. Central Scanning Light/Laser Beam (Passing through lens)
        const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 12);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0x00d2ff,
            transparent: true,
            opacity: 0.75
        });
        const scanBeam = new THREE.Mesh(beamGeo, beamMat);
        scanBeam.rotation.x = Math.PI / 2; // Aligned along Z-axis passing through lens center
        lensGroup.add(scanBeam);

        // 4. Orbiting data coordinates rings (Torus wireframe)
        const orbitGeo = new THREE.TorusGeometry(1.8, 0.02, 6, 48);
        const orbitMat = new THREE.MeshStandardMaterial({
            color: 0x00d2ff,
            metalness: 0.9,
            roughness: 0.1,
            wireframe: true
        });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        lensGroup.add(orbit);

        scene.add(lensGroup);
        lensGroupRef.current = lensGroup;

        // Surrounding diagnostic grid particles
        const particlesCount = 80;
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 8;     // X
            positions[i + 1] = (Math.random() - 0.5) * 8; // Y
            positions[i + 2] = (Math.random() - 0.5) * 6; // Z
            
            // Slate blue & cyan colors
            colors[i] = 0.2; // R
            colors[i + 1] = 0.6 + Math.random() * 0.4; // G
            colors[i + 2] = 0.9; // B
        }

        const particlesGeo = new THREE.BufferGeometry();
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particlesMat = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        const dataGrid = new THREE.Points(particlesGeo, particlesMat);
        scene.add(dataGrid);

        // Animation timer
        const timer = new CustomTimer();

        const tick = () => {
            timer.update();
            const elapsedTime = timer.getElapsed();

            if (lensGroup) {
                if (isFullscreen) {
                    // Full screen mode: rotate dramatically to show refraction
                    lensGroup.position.set(0, 0, -1.0);
                    lensGroup.scale.set(1.6, 1.6, 1.6);
                    lensGroup.rotation.y = elapsedTime * 0.8;
                    lensGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.5 + 0.3;
                    lensGroup.rotation.z = elapsedTime * 0.2;
                } else {
                    // Local Card mode: slow rotation, facing slightly diagonal
                    lensGroup.position.set(0, 0, 0);
                    lensGroup.scale.set(1.0, 1.0, 1.0);
                    lensGroup.rotation.x = 0.4;
                    lensGroup.rotation.y = elapsedTime * 0.3;
                    lensGroup.rotation.z = 0;
                }
            }

            // Animate data orbit rings and scanning beam pulse
            orbit.rotation.y = -elapsedTime * 0.5;
            scanBeam.scale.set(1.0, 1.0, 1.0 + Math.sin(elapsedTime * 6) * 0.15);

            // Rotate data points
            dataGrid.rotation.y = elapsedTime * 0.05;

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(tick);
        };

        tick();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }

            // Explicitly release GPU assets
            renderer.dispose();
            scene.clear();

            // Dispose geometries and materials
            barrelGeo.dispose();
            barrelMat.dispose();
            glassGeo.dispose();
            glassMat.dispose();
            beamGeo.dispose();
            beamMat.dispose();
            orbitGeo.dispose();
            orbitMat.dispose();
            particlesGeo.dispose();
            particlesMat.dispose();
        };
    }, [isFullscreen]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full min-h-[280px] flex items-center justify-center relative overflow-hidden"
        />
    );
};

export default ThreeScene;
