import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ScoutSceneProps {
    progress: number;
    velocity: number;
}

const ScoutScene: React.FC<ScoutSceneProps> = ({ progress, velocity }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    
    // Core references for animation
    const coreRef = useRef<THREE.Group | null>(null);
    const vectorLinesRef = useRef<THREE.LineSegments | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);

    // Keep progress & velocity in refs for the animation loop
    const progressRef = useRef(progress);
    const velocityRef = useRef(velocity);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    useEffect(() => {
        velocityRef.current = velocity;
    }, [velocity]);

    // Handle resizing
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
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let animationFrameId: number;
        const scene = new THREE.Scene();
        sceneRef.current = scene;

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        const cyanPointLight = new THREE.PointLight(0x00d2ff, 5.0, 30);
        cyanPointLight.position.set(0, 0, 4);
        scene.add(cyanPointLight);

        // Core Probe Group
        const coreGroup = new THREE.Group();

        // 1. Sleek metallic dodecahedron core
        const coreGeo = new THREE.DodecahedronGeometry(1.0, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a, // Rich dark slate
            metalness: 0.95,
            roughness: 0.1,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreGroup.add(coreMesh);

        // 2. Glowing edges
        const edgeGeo = new THREE.EdgesGeometry(coreGeo);
        const edgeMat = new THREE.LineBasicMaterial({
            color: 0x00d2ff
        });
        const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
        coreGroup.add(edgeLines);

        // 3. Orbiting digital builder coordinate rings
        const ringGeo1 = new THREE.TorusGeometry(1.5, 0.015, 8, 64);
        const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.8 });
        const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
        ring1.rotation.x = Math.PI / 2;
        coreGroup.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(1.8, 0.01, 6, 48);
        const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6 });
        const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
        ring2.rotation.y = Math.PI / 4;
        coreGroup.add(ring2);

        scene.add(coreGroup);
        coreRef.current = coreGroup;

        // 4. Large background Network of vector data lines
        const lineCount = 60;
        const linePositions = [];
        for (let i = 0; i < lineCount; i++) {
            // Start points closer to center
            const x1 = (Math.random() - 0.5) * 3;
            const y1 = (Math.random() - 0.5) * 3;
            const z1 = (Math.random() - 0.5) * 3;
            // End points extending far outwards
            const x2 = x1 * 4 + (Math.random() - 0.5) * 6;
            const y2 = y1 * 4 + (Math.random() - 0.5) * 6;
            const z2 = z1 * 4 + (Math.random() - 0.5) * 4;

            linePositions.push(x1, y1, z1, x2, y2, z2);
        }

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00d2ff,
            transparent: true,
            opacity: 0.0
        });
        const vectorLines = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(vectorLines);
        vectorLinesRef.current = vectorLines;

        // 5. Orbiting particles
        const particlesCount = 150;
        const pPositions = new Float32Array(particlesCount * 3);
        const pSpeeds: number[] = [];

        for (let i = 0; i < particlesCount * 3; i += 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 2.0 + Math.random() * 4.0;
            pPositions[i] = Math.cos(angle) * radius;
            pPositions[i + 1] = Math.sin(angle) * radius;
            pPositions[i + 2] = (Math.random() - 0.5) * 4;
            pSpeeds.push(0.5 + Math.random() * 1.5);
        }

        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        const pMat = new THREE.PointsMaterial({
            size: 0.06,
            color: 0x00d2ff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);
        particlesRef.current = particles;

        // Animation loop
        const clock = new THREE.Clock();

        const tick = () => {
            const elapsedTime = clock.getElapsedTime();
            const prog = progressRef.current;
            const vel = velocityRef.current;

            // Base rotation
            if (coreGroup) {
                coreGroup.rotation.y = elapsedTime * 0.4 + prog * 2.0;
                coreGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2 + prog * 1.0;
                
                // Ring counters
                ring1.rotation.z = elapsedTime * 0.6;
                ring2.rotation.x = -elapsedTime * 0.4;

                // Position and Scale driven by scroll timeline
                if (prog < 0.2) {
                    // Trigger Phase: Card container size
                    coreGroup.position.set(0, 0, 0);
                    coreGroup.scale.set(0.9, 0.9, 0.9);
                } else if (prog >= 0.2 && prog <= 0.55) {
                    // Transition Phase: Break out of card and take over the screen background
                    const t = (prog - 0.2) / 0.35; // Normalize 0 to 1
                    coreGroup.position.x = THREE.MathUtils.lerp(0, -1.5, t); // Move left slightly to frame right-side message
                    coreGroup.position.z = THREE.MathUtils.lerp(0, 2.0, t);  // Fly forward
                    const s = THREE.MathUtils.lerp(0.9, 1.8, t);
                    coreGroup.scale.set(s, s, s);
                } else if (prog > 0.55 && prog <= 0.8) {
                    // Display Phase: Prominent screen presence
                    coreGroup.position.set(-1.5, 0, 2.0);
                    coreGroup.scale.set(1.8, 1.8, 1.8);
                } else {
                    // Landing Phase: Shrinks and guides focus down
                    const t = (prog - 0.8) / 0.2; // Normalize 0 to 1
                    coreGroup.position.x = THREE.MathUtils.lerp(-1.5, 0, t);
                    coreGroup.position.y = THREE.MathUtils.lerp(0, -3.0, t);
                    coreGroup.position.z = THREE.MathUtils.lerp(2.0, -1.0, t);
                    const s = THREE.MathUtils.lerp(1.8, 0.6, t);
                    coreGroup.scale.set(s, s, s);
                }
            }

            // Vector lines activation
            if (vectorLines) {
                if (prog < 0.2) {
                    vectorLines.material.opacity = 0.0;
                } else if (prog >= 0.2 && prog <= 0.6) {
                    const t = (prog - 0.2) / 0.4;
                    vectorLines.material.opacity = t * 0.45;
                } else if (prog > 0.6 && prog <= 0.85) {
                    vectorLines.material.opacity = 0.45;
                } else {
                    const t = (prog - 0.85) / 0.15;
                    vectorLines.material.opacity = Math.max(0, 0.45 * (1 - t));
                }

                // Gentle expansion movement of data lines
                vectorLines.rotation.z = elapsedTime * 0.03;
                vectorLines.scale.set(1 + prog * 0.5, 1 + prog * 0.5, 1 + prog * 0.5);
            }

            // Particles rotation linked to speed
            if (particles) {
                const speedFactor = 1.0 + Math.abs(vel) * 20.0;
                particles.rotation.y = elapsedTime * 0.05 * speedFactor;

                // Animate points individually to swirl outwards matching velocity
                const positions = particles.geometry.attributes.position.array as Float32Array;
                for (let i = 0; i < particlesCount; i++) {
                    const i3 = i * 3;
                    const speed = pSpeeds[i];
                    // Pull coordinates outward depending on velocity
                    positions[i3] += Math.sin(elapsedTime * speed) * 0.002 * speedFactor;
                    positions[i3 + 1] += Math.cos(elapsedTime * speed) * 0.002 * speedFactor;
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }

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
            coreGeo.dispose();
            coreMat.dispose();
            edgeGeo.dispose();
            edgeMat.dispose();
            ringGeo1.dispose();
            ringMat1.dispose();
            ringGeo2.dispose();
            ringMat2.dispose();
            lineGeo.dispose();
            lineMat.dispose();
            pGeo.dispose();
            pMat.dispose();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full min-h-[300px] flex items-center justify-center relative overflow-hidden"
        />
    );
};

export default ScoutScene;
