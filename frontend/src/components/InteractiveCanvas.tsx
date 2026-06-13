import React, { useRef, useEffect } from 'react';

interface InteractiveCanvasProps {
    className?: string;
    isFlat?: boolean;
}

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({ 
    className = "absolute inset-0 w-full h-full pointer-events-none z-0",
    isFlat = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        // Grid configurations
        const cols = 35;
        const rows = 38;
        const spacingX = 60;
        const spacingY = 60;

        // Mouse physics state
        const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2, radius: 250 };
        // Scroll state
        let scrollY = window.scrollY;

        // Camera angles
        let pitch = 0.6; // X rotation
        let yaw = 0.3;   // Y rotation
        let time = 0;

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.targetX = e.clientX - rect.left;
            mouse.targetY = e.clientY - rect.top;
        };

        const handleScroll = () => {
            scrollY = window.scrollY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        // Render loop
        const draw = () => {
            time += 0.012;
            
            // Clear canvas with white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            // Ease mouse position (spring physics)
            mouse.x += (mouse.targetX - mouse.x) * 0.08;
            mouse.y += (mouse.targetY - mouse.y) * 0.08;

            // Scroll influence on camera rotation and wave amplitude
            const scrollFactor = isFlat ? 0 : scrollY * 0.0008;
            const currentPitch = isFlat ? 0 : pitch + scrollFactor * 0.4;
            const currentYaw = isFlat ? 0 : yaw + scrollFactor * 0.2;

            // Compute grid points
            const points: { sx: number; sy: number; z: number }[][] = [];

            for (let r = 0; r < rows; r++) {
                points[r] = [];
                for (let c = 0; c < cols; c++) {
                    // Normalize grid coordinates centered around origin
                    const x = (c - cols / 2) * spacingX;
                    const y = (r - rows / 2) * spacingY;

                    // Start with a flat, single-layer grid (no automatic background waves)
                    let z = 0;

                    // Project mouse distance on grid plane
                    const worldMouseX = mouse.x - width / 2;
                    const worldMouseY = mouse.y - height / 2;
                    const dx = x - worldMouseX;
                    const dy = y - worldMouseY;
                    const distance = Math.hypot(dx, dy);

                    // Deform mesh locally around mouse pointer only (interactive cursor animation)
                    if (distance < mouse.radius) {
                        const force = (mouse.radius - distance) / mouse.radius;
                        z += Math.sin(distance * 0.05 - time * 6) * 35 * force;
                    }

                    // 3D rotation transformations
                    // Yaw (Y rotation)
                    let rotX = x * Math.cos(currentYaw) - z * Math.sin(currentYaw);
                    let rotZ = x * Math.sin(currentYaw) + z * Math.cos(currentYaw);
                    // Pitch (X rotation)
                    let rotY = y * Math.cos(currentPitch) - rotZ * Math.sin(currentPitch);
                    let finalZ = y * Math.sin(currentPitch) + rotZ * Math.cos(currentPitch) + 800; // Camera distance offset

                    // Perspective projection
                    const screenX = rotX * (650 / finalZ) + width / 2;
                    const screenY = rotY * (650 / finalZ) + height / 2;

                    points[r][c] = { sx: screenX, sy: screenY, z: z };
                }
            }

            // Draw grid lines
            ctx.lineWidth = 1.0;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const p = points[r][c];

                    // Draw connection rightwards
                    if (c < cols - 1) {
                        const right = points[r][c + 1];
                        const opacity = Math.max(0.02, 0.18 - Math.abs(p.z) * 0.002);
                        ctx.strokeStyle = `rgba(75, 85, 99, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(p.sx, p.sy);
                        ctx.lineTo(right.sx, right.sy);
                        ctx.stroke();
                    }

                    // Draw connection downwards
                    if (r < rows - 1) {
                        const down = points[r + 1][c];
                        const opacity = Math.max(0.02, 0.18 - Math.abs(p.z) * 0.002);
                        ctx.strokeStyle = `rgba(75, 85, 99, ${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(p.sx, p.sy);
                        ctx.lineTo(down.sx, down.sy);
                        ctx.stroke();
                    }

                    // Render mesh intersections (nodes) dynamically
                    if (Math.abs(p.z) > 18) {
                        const rRadius = Math.max(0.5, Math.abs(p.z) * 0.04);
                        ctx.fillStyle = `rgba(17, 24, 39, ${0.1 + rRadius * 0.05})`;
                        ctx.beginPath();
                        ctx.arc(p.sx, p.sy, rRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            // Draw subtle cursor tracking ring
            ctx.strokeStyle = 'rgba(17, 24, 39, 0.08)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 45 + Math.sin(time * 3) * 5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(17, 24, 39, 0.03)';
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
            ctx.fill();

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ opacity: 0.85 }}
        />
    );
};

export default InteractiveCanvas;
