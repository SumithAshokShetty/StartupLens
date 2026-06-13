import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Lightweight self-contained implementation matching THREE.Timer API to avoid module import warnings/resolution errors in TypeScript
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

export const ImmersiveAnimationSection: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountRef = useRef<HTMLDivElement>(null);
    const textContentRef = useRef<HTMLDivElement>(null);

    // Cache WebGL scene, renderer, and active meshes/groups in refs to avoid recreating on scrolls/re-renders
    const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    
    // Core references for animation
    const coreGroupRef = useRef<THREE.Group | null>(null);
    const ring1Ref = useRef<THREE.Mesh | null>(null);
    const ring2Ref = useRef<THREE.Mesh | null>(null);
    const vectorLinesRef = useRef<THREE.LineSegments | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);

    useEffect(() => {
        if (!containerRef.current || !mountRef.current) return;

        // Clean up any duplicate canvases in the mount element to avoid HMR / double mount leaks
        while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        // Clean up any stray ScrollTriggers to prevent layout bugs
        ScrollTrigger.getAll().forEach((t) => t.kill());

        const scene = sceneRef.current;
        const rect = mountRef.current.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;

        // Initialize WebGLRenderer ONCE
        if (!rendererRef.current) {
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setSize(width, height);
            mountRef.current.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // Lights Setup
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
            dirLight.position.set(5, 10, 7);
            scene.add(dirLight);

            const cyanPointLight = new THREE.PointLight(0x00d2ff, 5.0, 30);
            cyanPointLight.position.set(0, 0, 4);
            scene.add(cyanPointLight);

            // 1. Sleek metallic dodecahedron core
            const coreGroup = new THREE.Group();
            coreGroup.scale.set(0.9, 0.9, 0.9);
            coreGroup.position.set(0, 0, 0); // Placed clearly at screen center coordinates (0, 0, 0)
            coreGroupRef.current = coreGroup;

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
            const edgeMat = new THREE.LineBasicMaterial({ color: 0x00d2ff });
            const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
            coreGroup.add(edgeLines);

            // 3. Orbiting digital builder coordinate rings
            const ringGeo1 = new THREE.TorusGeometry(1.5, 0.015, 8, 64);
            const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.8 });
            const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
            ring1.rotation.x = Math.PI / 2;
            coreGroup.add(ring1);
            ring1Ref.current = ring1;

            const ringGeo2 = new THREE.TorusGeometry(1.8, 0.01, 6, 48);
            const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6 });
            const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
            ring2.rotation.y = Math.PI / 4;
            coreGroup.add(ring2);
            ring2Ref.current = ring2;

            scene.add(coreGroup);

            // 4. Large background Network of vector data lines
            const lineCount = 60;
            const linePositions = [];
            for (let i = 0; i < lineCount; i++) {
                const x1 = (Math.random() - 0.5) * 3;
                const y1 = (Math.random() - 0.5) * 3;
                const z1 = (Math.random() - 0.5) * 3;
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
            const pSpeeds = [];

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
        }

        // Camera Setup - dynamic bounding aspect ratio match
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 8;
        cameraRef.current = camera;

        // Continuous rendering and rotation loop using CustomTimer
        const timer = new CustomTimer();
        let animationFrameId: number;

        const tick = () => {
            timer.update();
            const elapsedTime = timer.getElapsed();
            
            // Continuous rotational animation
            if (coreGroupRef.current) {
                coreGroupRef.current.rotation.y = elapsedTime * 0.3;
                coreGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15;
            }
            if (ring1Ref.current) {
                ring1Ref.current.rotation.z = elapsedTime * 0.5;
            }
            if (ring2Ref.current) {
                ring2Ref.current.rotation.x = -elapsedTime * 0.35;
            }
            if (particlesRef.current) {
                particlesRef.current.rotation.y = elapsedTime * 0.04;
            }
            if (vectorLinesRef.current) {
                vectorLinesRef.current.rotation.z = elapsedTime * 0.02;
            }

            if (rendererRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
            animationFrameId = requestAnimationFrame(tick);
        };
        tick();

        // 3D Animation & Layout Timelines using GSAP ScrollTrigger
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "bottom+=100% top",
                pin: true,
                scrub: 1,
                toggleActions: "play reverse play reverse",
                invalidateOnRefresh: true,
            }
        });

        // Mutate positions, scales, and line opacity smoothly matching scroll track
        if (coreGroupRef.current && vectorLinesRef.current) {
            // Step 1: Initial state (0, 0, 0) center -> breakout left & scale up (0.2 -> 0.55 progress)
            // Shifted x to -2.8 to keep the dodecahedron animation clearly to the left of the text card
            tl.to(coreGroupRef.current.position, {
                x: -2.8,
                z: 2.0,
                ease: "none",
                duration: 1
            }, 0)
            .to(coreGroupRef.current.scale, {
                x: 1.8,
                y: 1.8,
                z: 1.8,
                ease: "none",
                duration: 1
            }, 0)
            .to(vectorLinesRef.current.material, {
                opacity: 0.45,
                ease: "none",
                duration: 1
            }, 0)
            .to(vectorLinesRef.current.scale, {
                x: 1.4,
                y: 1.4,
                z: 1.4,
                ease: "none",
                duration: 1
            }, 0);

            // Step 2: Fade in the text description cleanly
            tl.to(textContentRef.current, {
                opacity: 1,
                y: 0,
                ease: "power2.out",
                duration: 0.5
            }, 0.5);

            // Step 3: Descend probe and network out of view smoothly into the pricing card
            tl.to(coreGroupRef.current.position, {
                x: 0,
                y: -6.0,
                z: -2.0,
                ease: "none",
                duration: 1
            }, 1.2)
            .to(coreGroupRef.current.scale, {
                x: 0.6,
                y: 0.6,
                z: 0.6,
                ease: "none",
                duration: 1
            }, 1.2)
            .to(vectorLinesRef.current.material, {
                opacity: 0.0,
                ease: "none",
                duration: 1
            }, 1.2);
        }

        // Handle browser window resize dynamically
        const handleResize = () => {
            if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;
            const r = mountRef.current.getBoundingClientRect();
            const w = r.width || window.innerWidth;
            const h = r.height || window.innerHeight;
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        // CLEANUP: Clean up triggers, clock update loops, and window listeners on unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, []);

    // Explicitly release GPU assets and empty scene nodes on overall component destruction (route changes)
    useEffect(() => {
        return () => {
            if (rendererRef.current) {
                if (mountRef.current && rendererRef.current.domElement) {
                    mountRef.current.removeChild(rendererRef.current.domElement);
                }
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
            sceneRef.current.clear();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="trigger-section-container"
            style={{ position: 'relative', width: '100%', overflow: 'hidden', backgroundColor: 'transparent', minHeight: '100vh' }}
        >
            {/* FIXED VIEWPORT LAYER: The WebGL canvas runs pinned to the screen viewport inside container boundaries */}
            <div 
                ref={mountRef} 
                className="canvas-takeover-layer"
                style={{ 
                    position: 'fixed', 
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh', 
                    zIndex: 10, 
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent'
                }}
            />

            {/* HTML CONTENT LAYER: Floats directly over the fixed canvas */}
            <div 
                className="split-screen-card-layout" 
                style={{ 
                    position: 'relative', 
                    zIndex: 20, 
                    display: 'flex', 
                    minHeight: '100vh', 
                    alignItems: 'center', 
                    padding: '0 10%', 
                    pointerEvents: 'none', 
                    backgroundColor: 'transparent' 
                }}
            >
                {/* Text aligned to right using marginLeft: 'auto', left element helper div fully removed */}
                <div 
                    ref={textContentRef} 
                    className="builder-tagline-text"
                    style={{ width: '50%', marginLeft: 'auto', opacity: 0, transform: 'translateY(50px)', pointerEvents: 'auto' }}
                >
                    <div className="space-y-6">
                        <span className="text-xs font-mono uppercase text-[#4B5563] tracking-widest font-bold">DIGITAL BUILDER NODE</span>
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#0f172a] leading-[1.05]">
                            AI Tool for <br /><span style={{ color: '#0d9488' }}>Real Builders.</span>
                        </h2>
                        <p className="text-base text-[#4B5563] leading-relaxed max-w-md">
                            Instantly validate your startup concepts against our database of historical startup failures and real-time market data. Analyze unit economics, map competitors, and identify critical failure factors before writing a single line of code.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImmersiveAnimationSection;
