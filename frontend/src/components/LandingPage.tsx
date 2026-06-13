import React, { useState, useEffect } from 'react';
import { Linkedin, Mail, Bot, Menu, X, ArrowRight, Search, Globe, Shield, Check, Cpu } from 'lucide-react';
import ThreeScene from './ThreeScene';
import ImmersiveAnimationSection from './ImmersiveAnimationSection';
import InteractiveCanvas from './InteractiveCanvas';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
    onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [agentStep, setAgentStep] = useState(0);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const [activePlan, setActivePlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');
    const [scrollY, setScrollY] = useState(0);
    // Simulated real-time agent "video logs" loop
    const agentLogs = [
        "Initializing Scout Agent...",
        "Scouting Google Index for competitor profiles...",
        "Scraping competitor pricing, features, and target groups...",
        "Querying RAG Vector Database for failed startup records...",
        "Comparing failure factors (cash burn rate, high CAC)...",
        "Orchestrating findings via Analyst Agent...",
        "Compiling strategic investment diagnostic report..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setAgentStep((prev) => (prev + 1) % agentLogs.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        // Dust particle burst function when card stands up straight
        const triggerDust = () => {
            const pricingSection = document.getElementById('pricing');
            if (!pricingSection) return;

            // Create absolute dust container if it doesn't exist
            let dustContainer = document.getElementById('dust-container');
            if (!dustContainer) {
                dustContainer = document.createElement('div');
                dustContainer.id = 'dust-container';
                dustContainer.style.position = 'absolute';
                dustContainer.style.bottom = '12%';
                dustContainer.style.left = '50%';
                dustContainer.style.transform = 'translateX(-50%)';
                dustContainer.style.width = '80%';
                dustContainer.style.height = '60px';
                dustContainer.style.pointerEvents = 'none';
                dustContainer.style.zIndex = '40';
                pricingSection.appendChild(dustContainer);
            }

            // Spawn 35 slate gray dust particles blowing outwards
            for (let i = 0; i < 35; i++) {
                const particle = document.createElement('div');
                particle.style.position = 'absolute';
                particle.style.bottom = '0';
                particle.style.left = `${Math.random() * 100}%`;
                const size = Math.random() * 5 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.borderRadius = '50%';
                particle.style.backgroundColor = '#9CA3AF'; // Light slate dust
                particle.style.opacity = `${Math.random() * 0.4 + 0.3}`;
                dustContainer.appendChild(particle);

                // Animate particles expanding outwards and fading
                gsap.to(particle, {
                    x: (Math.random() - 0.5) * 220,
                    y: -(Math.random() * 80 + 20),
                    opacity: 0,
                    scale: 0.2,
                    duration: Math.random() * 1.2 + 0.8,
                    ease: "power2.out",
                    onComplete: () => particle.remove()
                });
            }
        };

        let dustTriggered = false;

        // Pricing card 3D lift/raising animation (rope pull & dust effect)
        // End point extended to "top 5%" and scrub raised to 2.0 to slow down the speed relative to scrolling
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#pricing",
                start: "top 95%",
                end: "top 5%",
                scrub: 2.0,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    // Trigger the dust burst right when the card stands up straight
                    if (self.progress > 0.82 && !dustTriggered) {
                        triggerDust();
                        dustTriggered = true;
                    } else if (self.progress < 0.6) {
                        dustTriggered = false; // Reset trigger so it can fire on scroll back
                    }
                }
            }
        });

        // 3D rotation of pricing card
        tl.fromTo("#pricing-card-3d", 
            { rotateX: 75, z: -120, opacity: 0.6, transformPerspective: 1500, transformOrigin: "bottom center" },
            { rotateX: -8, z: 0, opacity: 1, ease: "power1.out", duration: 1.2 }
        )
        .to("#pricing-card-3d", { rotateX: 0, ease: "power1.inOut", duration: 0.6 });

        return () => {
            tl.scrollTrigger?.kill();
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Plan detail mappings for the pricing panel (StartupLens validation runs)
    const planDetails = {
        starter: {
            title: "Starter",
            priceMonthly: 10,
            priceAnnually: 100,
            tagline: "GREAT FOR EARLY-STAGE CONCEPT VALIDATION.",
            features: [
                "5 AI ANALYSIS REPORTS",
                "BASIC SWOT MATRIX GENERATION",
                "FAILED STARTUPS SEARCH ENGINE",
                "EMAIL SUPPORT"
            ]
        },
        pro: {
            title: "Pro",
            priceMonthly: 20,
            priceAnnually: 200,
            tagline: "EVERYTHING YOU NEED TO SUCCESSFULLY LAUNCH.",
            features: [
                "UNLIMITED AI ANALYSIS REPORTS",
                "1-ON-1 STRATEGY SESSION WITH EXPERTS",
                "PITCH DECK REVIEW & FEEDBACK",
                "INVESTOR-READY FINANCIAL PROJECTIONS",
                "ADVANCED MARKET COMPETITOR TRACKING"
            ]
        },
        enterprise: {
            title: "Enterprise",
            priceMonthly: "Custom",
            priceAnnually: "Custom",
            tagline: "DESIGNED FOR VC FIRMS, INCUBATORS, AND STUDIOS.",
            features: [
                "EVERYTHING IN PRO INCLUDED",
                "DEDICATED RAG DATABASE CUSTOM PIPELINE",
                "CUSTOM RAG CORPUS INGESTION",
                "DEDICATED STRATEGY SLA",
                "ANALYST API INTEGRATION SUPPORT"
            ]
        }
    };

    const currentPlanInfo = planDetails[activePlan];

    return (
        <div className="min-h-screen bg-white font-sans text-[#111827] overflow-x-hidden scroll-smooth selection:bg-[#F0F0F0]">
            <style>
                {`
                    html { scroll-behavior: smooth; }
                    .bain-nav-link {
                        position: relative;
                        padding: 8px 0;
                        color: #4B5563;
                        font-weight: 500;
                        transition: color 250ms ease;
                    }
                    .bain-nav-link::after {
                        content: '';
                        position: absolute;
                        width: 100%;
                        height: 2px;
                        bottom: 0;
                        left: 0;
                        background-color: #111827;
                        transform: scaleX(0);
                        transform-origin: bottom right;
                        transition: transform 250ms ease-out;
                    }
                    .bain-nav-link:hover {
                        color: #111827;
                    }
                    .bain-nav-link:hover::after {
                        transform: scaleX(1);
                        transform-origin: bottom left;
                    }
                `}
            </style>

            {/* Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-white/95 border-b border-[#C0C0C0] h-[75px] flex items-center shadow-sm">
                <div className="max-w-[1320px] mx-auto px-6 md:px-12 flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3.5 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/logo.svg" alt="StartupLens Logo" className="w-10 h-10 object-contain" style={{ filter: 'brightness(0)' }} />
                        <span className="text-3xl font-medium tracking-tight text-[#111827] font-sans">StartupLens</span>
                    </div>

                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <a href="#home" className="bain-nav-link">Home</a>
                        <a href="#about" className="bain-nav-link">About</a>
                        <a href="#how-it-works" className="bain-nav-link">How It Works</a>
                        <a href="#pricing" className="bain-nav-link">Pricing</a>
                        <a href="#contact" className="bain-nav-link">Contact</a>
                    </div>
                    
                    <button
                        onClick={onStart}
                        className="hidden md:block brand-btn-primary"
                    >
                        Get Started
                    </button>

                    <button
                        className="md:hidden p-2 text-[#4B5563] hover:text-[#111827] transition-colors"
                        onClick={toggleMobileMenu}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-[75px] left-0 w-full bg-white border-b border-[#C0C0C0] shadow-xl animate-fade-in">
                        <div className="flex flex-col p-6 space-y-4">
                            <a href="#home" onClick={closeMobileMenu} className="bain-nav-link text-center">Home</a>
                            <a href="#about" onClick={closeMobileMenu} className="bain-nav-link text-center">About</a>
                            <a href="#how-it-works" onClick={closeMobileMenu} className="bain-nav-link text-center">How It Works</a>
                            <a href="#pricing" onClick={closeMobileMenu} className="bain-nav-link text-center">Pricing</a>
                            <a href="#contact" onClick={closeMobileMenu} className="bain-nav-link text-center">Contact</a>
                            <button
                                onClick={() => { closeMobileMenu(); onStart(); }}
                                className="w-full mt-4 brand-btn-primary"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section id="home" className="relative min-h-[calc(100vh-75px)] mt-[75px] flex items-center py-16 overflow-hidden bg-white">
                <InteractiveCanvas />
                <div className="max-w-[1320px] mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center relative z-10 w-full animate-reveal">
                    
                    {/* Left: Text Details */}
                    <div className="space-y-6" style={{ transform: `translateY(${Math.min(120, scrollY * 0.12)}px)`, transition: 'transform 100ms ease-out' }}>
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#C0C0C0] bg-[#F0F0F0] text-[#111827] text-[12px] font-semibold font-mono">
                            <Bot className="w-4 h-4 text-[#4B5563]" />
                            <span>MINIMALIST VALIDATION FRAMEWORK</span>
                        </div>
                        <h1 className="text-[44px] md:text-[64px] font-medium text-[#111827] leading-[1.04] tracking-tight">
                            Validate Concept with <span className="text-[#111827] font-semibold underline decoration-[#C0C0C0] decoration-wavy">Multi-Agent RAG</span>
                        </h1>
                        <p className="text-[16px] font-normal text-[#4B5563] leading-[1.6] max-w-lg">
                            An autonomous decision support engine that aggregates web index telemetry and historical startup failure records. Ensure strategic alignment before capital allocation.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <button onClick={onStart} className="brand-btn-primary w-full sm:w-auto">
                                Run Diagnostics
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                            <a href="#about" className="brand-btn-secondary w-full sm:w-auto text-center">
                                Review Process
                            </a>
                        </div>
                    </div>

                    {/* Right: Mock Terminal/Video Feed representing agent operations */}
                    <div className="w-full" style={{ transform: `translateY(${Math.max(-80, scrollY * -0.05)}px)`, transition: 'transform 100ms ease-out' }}>
                        <div className="border border-[#C0C0C0] bg-[#F0F0F0] rounded-lg overflow-hidden relative shadow-md">
                            {/* Window Header */}
                            <div className="bg-white text-[#111827] p-3 flex items-center justify-between text-xs border-b border-[#C0C0C0]">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2.5 h-2.5 bg-[#111827]/30 rounded-full"></div>
                                    <div className="w-2.5 h-2.5 bg-[#111827]/30 rounded-full"></div>
                                    <div className="w-2.5 h-2.5 bg-[#111827]/30 rounded-full"></div>
                                    <span className="text-[#4B5563] ml-2 font-mono text-[10px]">agent_scout_loop.sh</span>
                                </div>
                                <span className="px-2 py-0.5 bg-[#111827] text-white rounded-full font-bold font-mono tracking-wider uppercase text-[9px]">Live Simulation</span>
                            </div>

                            {/* Main Interactive Screen */}
                            <div className="aspect-video bg-[#FFFFFF] text-[#111827] p-5 font-mono text-[12px] flex flex-col justify-between relative select-none">
                                {/* Visual Scanning Grid Overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(17,24,39,0.01)_50%,rgba(0,0,0,0)_50%)] bg-[size:100%_4px] pointer-events-none"></div>
                                <div className="absolute left-0 w-full h-0.5 bg-[#111827]/10 shadow-[0_0_10px_#111827] animate-scan pointer-events-none"></div>

                                {/* Dynamic Animated UI Elements */}
                                <div className="space-y-2 z-10">
                                    <div className="flex justify-between items-center text-[#4B5563] text-[10px] border-b border-[#C0C0C0] pb-1.5">
                                        <span>STATUS: RUNNING</span>
                                        <span className="animate-pulse text-[#111827] font-bold">● SIMULATION ACTIVE</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[#111827]">
                                        <Cpu className="w-4 h-4 text-[#111827] animate-pulse" />
                                        <span>RAG VECTOR DB SERVER: CONNECTED</span>
                                    </div>
                                    <div className="text-[#4B5563] mt-1 text-[10px]">
                                        [07:36:20] MATCHING VECTOR SEMANTICS IN CORPUS...
                                    </div>
                                </div>

                                {/* Local 3D Startup Rocket Scene inside the Card */}
                                <div className="h-[130px] w-full flex items-center justify-center relative z-10">
                                    <ThreeScene isFullscreen={false} />
                                </div>

                                {/* Active step ticker output */}
                                <div className="bg-[#F0F0F0] p-2.5 border border-[#C0C0C0] rounded-md text-[#111827] font-mono text-[11px] relative z-10 transition-all duration-300">
                                    <span className="text-[#4B5563] font-bold">$ </span>
                                    {agentLogs[agentStep]}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 px-6 md:px-[80px] border-t border-[#C0C0C0] bg-[#F0F0F0] text-[#111827]">
                <div className="max-w-[1320px] mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        
                        <div className="lg:w-1/2 space-y-6">
                            <span className="text-[#111827] font-semibold font-mono tracking-wider uppercase text-xs">PLATFORM CONCEPT</span>
                            <h2 className="text-[32px] md:text-[48px] font-medium text-[#111827] leading-[1.1] tracking-tight">
                                Rigorous Market Intelligence
                            </h2>
                            <p className="text-[16px] font-normal text-[#4B5563] leading-[1.6]">
                                StartupLens integrates multi-agent reasoning, RAG fail logs, and Google Search grounding to deliver high-quality strategic validation report decks.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                <div className="bg-white p-6 rounded-lg border border-[#C0C0C0] min-h-[220px] flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="w-8 h-8 rounded-lg bg-[#F0F0F0] flex items-center justify-center mb-3 border border-[#C0C0C0]">
                                        <Search className="w-4 h-4 text-[#111827]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[#111827] text-sm mb-2">Grounded Indexing</h4>
                                        <p className="text-xs text-[#4B5563] leading-relaxed">Cross-references inputs with live search trends and competitor market caps.</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-[#C0C0C0] min-h-[220px] flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div className="w-8 h-8 rounded-lg bg-[#F0F0F0] flex items-center justify-center mb-3 border border-[#C0C0C0]">
                                        <Shield className="w-4 h-4 text-[#111827]" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-[#111827] text-sm mb-2">Failure Corpus RAG</h4>
                                        <p className="text-xs text-[#4B5563] leading-relaxed">Maps startup failure reasons to detect overlaps in capital burn and marketing strategy.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive diagram mockup */}
                        <div className="lg:w-1/2 w-full">
                            <div className="bg-white p-8 rounded-lg border border-[#C0C0C0] relative overflow-hidden min-h-[380px] flex flex-col justify-between shadow-sm">
                                <div className="flex justify-between items-center mb-6 border-b border-[#C0C0C0] pb-3">
                                    <span className="text-xs font-mono uppercase text-[#4B5563] font-bold">RAG Similarity Analyzer</span>
                                    <Globe className="w-4 h-4 text-[#111827]" />
                                </div>
                                
                                <div className="space-y-4 font-mono text-xs text-[#111827]">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-[#4B5563]">
                                            <span>VECTOR SIMILARITY GRID</span>
                                            <span>94.8% ACCURACY</span>
                                        </div>
                                        <div className="h-2 bg-[#F0F0F0] rounded-full w-full relative overflow-hidden">
                                            <div className="h-full bg-[#111827] rounded-full w-[94.8%] transition-all duration-500"></div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-[#F0F0F0] border border-[#C0C0C0] rounded-lg text-[#4B5563] text-[11px] leading-relaxed">
                                        Similarity matrix confirms matches in Sector: <strong className="text-[#111827]">Fintech Lending</strong>. Key failures matched: <em className="text-[#111827]">"Over-subsidizing user growth without positive unit economics."</em>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 px-6 md:px-[80px] border-t border-[#C0C0C0] bg-white text-[#111827]">
                <div className="max-w-[1320px] mx-auto text-center">
                    <span className="text-[#4B5563] font-semibold font-mono tracking-wider uppercase text-xs">PROCESS</span>
                    <h2 className="text-[32px] md:text-[48px] font-medium text-[#111827] mt-4 mb-12 leading-[1.1] tracking-tight">Diagnostics Workflow</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="brand-card p-6 bg-[#F0F0F0] rounded-lg border border-[#C0C0C0] text-left flex flex-col justify-between min-h-[300px]">
                            <div className="text-xs font-mono uppercase text-[#111827] font-bold">Step 01</div>
                            <div className="mt-4">
                                <h3 className="text-[20px] font-semibold text-[#111827] mb-4">Parameters Input</h3>
                                <p className="text-[#4B5563] text-xs leading-relaxed">
                                    Provide the idea description and industry context. Input telemetry registers data instantly.
                                </p>
                            </div>
                        </div>

                        <div className="brand-card p-6 bg-[#F0F0F0] rounded-lg border border-[#C0C0C0] text-left flex flex-col justify-between min-h-[300px]">
                            <div className="text-xs font-mono uppercase text-[#111827] font-bold">Step 02</div>
                            <div className="mt-4">
                                <h3 className="text-[20px] font-semibold text-[#111827] mb-4">Agent Execution</h3>
                                <p className="text-[#4B5563] text-xs leading-relaxed">
                                    Web-scouts extract competitor stats, compile SWOT formulas, and perform RAG vector operations.
                                </p>
                            </div>
                        </div>

                        <div className="brand-card p-6 bg-[#F0F0F0] rounded-lg border border-[#C0C0C0] text-left flex flex-col justify-between min-h-[300px]">
                            <div className="text-xs font-mono uppercase text-[#111827] font-bold">Step 03</div>
                            <div className="mt-4">
                                <h3 className="text-[20px] font-semibold text-[#111827] mb-4">Diagnostic Memo</h3>
                                <p className="text-[#4B5563] text-xs leading-relaxed">
                                    Review high-contrast reports, viability rates, market segment charts, and download print copies.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <ImmersiveAnimationSection />

            {/* Pricing Card Section */}
            <section id="pricing" className="py-12 px-6 md:px-[80px] border-t border-[#C0C0C0] bg-white text-white relative" style={{ perspective: '1500px' }}>
                 
                 <div 
                    id="pricing-card-3d"
                    className="max-w-[1200px] mx-auto bg-[#0a0c10] rounded-[24px] border border-white/10 p-6 md:p-8 relative overflow-hidden shadow-2xl"
                    style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
                >
                    {/* Glowing cyan backdrops inside card */}
                    <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none"></div>
                    <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none"></div>

                    {/* Navigation inside pricing card */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6 relative z-10">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono uppercase text-white/50 tracking-wider">StartupLens // Diagnostics Suite</span>
                        </div>
                        <button onClick={onStart} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white font-semibold text-xs tracking-wider transition-all">
                            Start Evaluating &rarr;
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6 relative z-10 items-stretch">
                        {/* Left Column: Heading and Plan Selectors */}
                        <div className="lg:col-span-5 flex flex-col justify-between">
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white leading-tight font-sans">
                                    Simple pricing<br />that grows with you
                                </h2>
                                <p className="text-white/60 text-xs leading-relaxed max-w-sm">
                                    Pick a plan today and switch anytime. Clear value across Starter, Pro, and Enterprise.
                                </p>

                                {/* StartupLens Contextual Box */}
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                                    <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">StartupLens Grounding</span>
                                    <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                                        Our diagnostics suite runs semantic similarity comparisons across 10K+ startup outcomes to pinpoint critical cash-burn coordinates.
                                    </p>
                                </div>

                                {/* Toggle switch */}
                                <div className="inline-flex bg-white/5 border border-white/10 rounded-full p-1 text-[10px] font-bold font-mono tracking-wider">
                                    <button 
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-3 py-1.5 rounded-full uppercase transition-all ${billingCycle === 'monthly' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button 
                                        onClick={() => setBillingCycle('annually')}
                                        className={`px-3 py-1.5 rounded-full uppercase transition-all ${billingCycle === 'annually' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'}`}
                                    >
                                        Annually
                                    </button>
                                </div>
                            </div>

                            {/* Compact Horizontal Plan Selectors */}
                            <div className="grid grid-cols-3 gap-2 mt-6">
                                <button 
                                    onClick={() => setActivePlan('starter')}
                                    className={`py-2 px-1 text-center rounded-lg border transition-all ${activePlan === 'starter' ? 'bg-white/10 border-white/30 shadow-md' : 'bg-transparent border-white/5 hover:border-white/15'}`}
                                >
                                    <h4 className="font-semibold text-white text-xs">Starter</h4>
                                </button>

                                <button 
                                    onClick={() => setActivePlan('pro')}
                                    className={`py-2 px-1 text-center rounded-lg border transition-all ${activePlan === 'pro' ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-transparent border-white/5 hover:border-white/15'}`}
                                >
                                    <h4 className="font-semibold text-white text-xs">Pro</h4>
                                </button>

                                <button 
                                    onClick={() => setActivePlan('enterprise')}
                                    className={`py-2 px-1 text-center rounded-lg border transition-all ${activePlan === 'enterprise' ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-transparent border-white/5 hover:border-white/15'}`}
                                >
                                    <h4 className="font-semibold text-white text-xs">Enterprise</h4>
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Pricing details */}
                        <div className="lg:col-span-7">
                            <div className="bg-[#101319] border border-white/15 rounded-2xl p-6 flex flex-col justify-between h-full shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>
                                
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide border-b border-white/5 pb-2">
                                        {currentPlanInfo.title}
                                    </h3>
                                    
                                    <div className="flex items-baseline space-x-1 py-2">
                                        <span className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
                                            {typeof currentPlanInfo.priceMonthly === 'number' ? `$${billingCycle === 'monthly' ? currentPlanInfo.priceMonthly : currentPlanInfo.priceAnnually}` : currentPlanInfo.priceMonthly}
                                        </span>
                                        {typeof currentPlanInfo.priceMonthly === 'number' && (
                                            <span className="text-white/50 text-xs font-mono tracking-wider lowercase">
                                                /{billingCycle === 'monthly' ? 'month' : 'year'}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[10px] text-white/40 font-mono tracking-wider font-semibold border-b border-white/5 pb-3 leading-relaxed">
                                        {currentPlanInfo.tagline}
                                    </p>

                                    {/* Features Bullet List - Laid out in 2 columns */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2">
                                        {currentPlanInfo.features.map((feat, idx) => (
                                            <div key={idx} className="flex items-center space-x-2 text-[11px] font-mono text-white/80">
                                                <div className="w-3.5 h-3.5 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                <span className="tracking-wide truncate">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={onStart} className="w-full mt-6 py-3 bg-white text-black font-semibold rounded-xl text-center hover:bg-white/95 transition-all text-xs tracking-wider uppercase font-mono shadow-md">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 px-6 md:px-[80px] border-t border-[#C0C0C0] bg-slate-50 text-[#111827]">
                <div className="max-w-[1320px] mx-auto">
                    <div className="grid lg:grid-cols-3 gap-12">
                        
                        <div className="space-y-4">
                            <span className="text-[#111827] font-semibold font-mono tracking-wider uppercase text-xs">CONTACT</span>
                            <h2 className="text-[32px] md:text-[48px] font-medium text-[#111827] leading-[1.1] tracking-tight">Request Info</h2>
                            <p className="text-[#4B5563] text-[16px] leading-[1.6]">
                                Submit inquiries regarding API telemetry keys, RAG failure logs integration, or custom node setups.
                            </p>
                            <div className="space-y-2 pt-4">
                                <div className="flex items-center space-x-2 text-xs text-[#4B5563]">
                                    <Mail className="w-4 h-4 text-[#111827]" />
                                    <span>info@startuplens.com</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-[#4B5563]">
                                    <Linkedin className="w-4 h-4 text-[#111827]" />
                                    <span>/startuplens</span>
                                </div>
                            </div>
                        </div>

                        {/* Flat Form inputs */}
                        <div className="lg:col-span-2">
                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Full Name</label>
                                        <input type="text" className="brand-input" placeholder="Consulting Partner" required />
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Email Address</label>
                                        <input type="email" className="brand-input" placeholder="partner@firm.com" required />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Inquiry Details</label>
                                    <textarea className="brand-input h-32 resize-none" placeholder="Provide details regarding your requirements..." required />
                                </div>
                                <button type="submit" className="brand-btn-primary w-full">
                                    Submit Request
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#F0F0F0] text-[#4B5563] py-16 border-t border-[#C0C0C0]">
                <div className="max-w-[1320px] mx-auto px-6 md:px-[80px]">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="col-span-1 space-y-3">
                            <div className="flex items-center space-x-2">
                                <img src="/logo.svg" alt="StartupLens Logo" className="w-5 h-5 object-contain" />
                                <span className="text-lg font-bold text-[#111827] tracking-wider">StartupLens</span>
                            </div>
                            <p className="text-xs leading-relaxed text-[#4B5563]">
                                Professional telemetry validation node. Designed for founders and investment partners.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Links</h4>
                            <ul className="space-y-2 text-xs">
                                <li><a href="#home" className="hover:text-[#111827] transition-colors">Home</a></li>
                                <li><a href="#about" className="hover:text-[#111827] transition-colors">About</a></li>
                                <li><a href="#pricing" className="hover:text-[#111827] transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Legal</h4>
                            <ul className="space-y-2 text-xs">
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-[#111827] transition-colors">Privacy Policy</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Contact</h4>
                            <ul className="space-y-2 text-xs font-mono">
                                <li><a href="mailto:info@startuplens.com" className="hover:text-[#111827] transition-colors">info@startuplens.com</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-[#C0C0C0] mt-12 pt-6 text-center text-[#4B5563]/40 text-[11px] font-mono">
                        &copy; {new Date().getFullYear()} StartupLens. Premium Nebula Theme.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
