import React, { useState, useEffect } from 'react';
import { Activity, Target, AlertTriangle, CheckCircle, ArrowRight, Zap, Users, TrendingUp, DollarSign, Shield, BarChart3, PieChart as PieChartIcon, Layers, Lock, RefreshCw, Download, Home, Info, X, Search, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import InteractiveCanvas from './InteractiveCanvas';

const colors = {
    bg: 'bg-white text-[#111827]',
    card: 'brand-card bg-[#F0F0F0] text-[#111827] border border-[#C0C0C0] rounded-lg shadow-sm',
    cardHover: 'hover:translate-y-[-4px] hover:border-[#111827]/30 transition-all duration-300',
    accent: 'text-[#111827]',
    border: 'border-[#C0C0C0]',
    text: 'text-[#4B5563]',
    highlight: 'text-[#111827]',
    buttonPrimary: 'brand-btn-primary text-xs font-semibold',
    buttonSecondary: 'brand-btn-secondary text-xs font-semibold'
};

const COLORS = ['#111827', '#4B5563', '#334155', '#C0C0C0', '#9CA3AF', '#F0F0F0'];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7860';

const renderBoldText = (text: string) => {
    if (!text) return null;
    const parts = text.split('**');
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <strong key={index} className="font-bold text-[#111827]">{part}</strong>;
        }
        return part;
    });
};

interface DashboardProps {
    onBack: (target?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
    const [idea, setIdea] = useState('');
    const [industry, setIndustry] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [isQuotaError, setIsQuotaError] = useState(false);
    const [customKey, setCustomKey] = useState('');
    const [failedStartupsData, setFailedStartupsData] = useState<any>(null);
    const [failedStartupsLoading, setFailedStartupsLoading] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [showMethodology, setShowMethodology] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const [placeholderText, setPlaceholderText] = useState('Describe your idea in detail...');
    const ideas = [
        "A hyper-local B2B marketplace connecting farmers directly with retail grocery stores...",
        "An autonomous logistics optimization routing engine for micro-fulfillment centers...",
        "A RAG-powered cybersecurity advisor that audits smart contracts for vulnerabilities...",
        "An AI co-founder that validates startup concepts using multi-agent RAG engines..."
    ];

    useEffect(() => {
        if (idea) return;
        let ideaIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 60;
        let timer: any;

        const handleType = () => {
            const currentIdea = ideas[ideaIndex];
            if (!isDeleting) {
                setPlaceholderText(currentIdea.substring(0, charIndex + 1));
                charIndex++;
                if (charIndex === currentIdea.length) {
                    isDeleting = true;
                    typingSpeed = 2000;
                } else {
                    typingSpeed = 60;
                }
            } else {
                setPlaceholderText(currentIdea.substring(0, charIndex - 1));
                charIndex--;
                if (charIndex === 0) {
                    isDeleting = false;
                    ideaIndex = (ideaIndex + 1) % ideas.length;
                    typingSpeed = 500;
                } else {
                    typingSpeed = 30;
                }
            }
            timer = setTimeout(handleType, typingSpeed);
        };

        timer = setTimeout(handleType, 1000);
        return () => clearTimeout(timer);
    }, [idea]);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (totalScroll > 0) {
                setScrollProgress((window.scrollY / totalScroll) * 100);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.05 }
        );

        const elements = document.querySelectorAll('.scroll-reveal');
        elements.forEach((el) => observer.observe(el));

        return () => {
            elements.forEach((el) => observer.unobserve(el));
        };
    }, [data, failedStartupsData, failedStartupsLoading]);

    const handleAnalyze = async (keyOverride?: string) => {
        if (!idea || !industry) return;
        setLoading(true);
        setError('');
        setIsQuotaError(false);
        setData(null);
        setFailedStartupsData(null);

        const activeKey = keyOverride || customKey;

        try {
            const bodyPayload: any = { idea, industry };
            if (activeKey) {
                bodyPayload.custom_api_key = activeKey;
            }

            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });

            if (response.status === 429) {
                throw new Error("API_QUOTA_EXHAUSTED");
            }

            if (!response.ok) throw new Error('Analysis failed');
            const result = await response.json();
            console.log("Analysis Result:", result);
            setData(result);

            setFailedStartupsLoading(true);
            fetch(`${API_BASE_URL}/api/failed-startups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: `${industry} ${idea}` })
            })
            .then(res => res.json())
            .then(fsData => {
                setFailedStartupsData(fsData);
                setFailedStartupsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch failed startups data:", err);
                setFailedStartupsData({ error: "Could not connect to the RAG backend server. Please verify python -m src.server is running." });
                setFailedStartupsLoading(false);
            });

            if (keyOverride) {
                setCustomKey(keyOverride);
            }

        } catch (err: any) {
            console.error(err);
            if (err.message === "API_QUOTA_EXHAUSTED") {
                setIsQuotaError(true);
                setError('Daily API Quota Exceeded');
            } else {
                setError('Failed to connect to the analysis engine. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    let marketShareData = (data?.research?.competitors || []).map((c: any) => ({
        name: c.name,
        value: typeof c.market_share === 'string' ? parseFloat(c.market_share.replace(/[^0-9.]/g, '')) || 0 : Number(c.market_share || 0)
    })).filter((item: any) => !isNaN(item.value) && item.value > 0);

    if (marketShareData.length === 0 && data?.research?.competitors?.length > 0) {
        const fallbackShare = Math.floor(100 / data.research.competitors.length);
        marketShareData = data.research.competitors.map((c: any) => ({
            name: c.name || 'Unknown',
            value: fallbackShare
        }));
    }

    let demographicsData = data?.strategy?.demographics?.age_groups ?
        Object.entries(data.strategy.demographics.age_groups).map(([key, value]: [string, any]) => ({
            name: key,
            percentage: typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : Number(value || 0)
        })).filter((item: any) => !isNaN(item.percentage) && item.percentage > 0) : [];

    if (demographicsData.length === 0 && data?.strategy?.demographics?.age_groups) {
        demographicsData = [
            { name: '18-24', percentage: 20 },
            { name: '25-34', percentage: 40 },
            { name: '35-44', percentage: 25 },
            { name: '45+', percentage: 15 }
        ];
    }

    return (
        <div className={`min-h-screen ${!data && !loading && !error ? 'h-screen overflow-hidden' : ''} ${colors.bg} ${colors.text} font-sans selection:bg-blue-500/30 print:bg-white relative`}>
            <style>
                {`
          .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .scroll-reveal.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .hash-loader {
            position: relative;
            width: 50px;
            height: 50px;
            transform: rotate(165deg);
          }
          .hash-loader:before,
          .hash-loader:after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            display: block;
            width: 10px;
            height: 10px;
            border-radius: 5px;
            transform: translate(-50%, -50%);
            transition: all 0.3s;
          }
          .hash-loader:before {
            animation: hash-before 2s infinite ease-in-out;
          }
          .hash-loader:after {
            animation: hash-after 2s infinite ease-in-out;
          }
          @keyframes hash-before {
            0% {
              width: 10px;
              box-shadow: 15px -15px 0 #111827, -15px 15px 0 #111827;
            }
            35% {
              width: 65px;
              box-shadow: 0 -15px 0 #111827, 0 15px 0 #111827;
            }
            70% {
              width: 10px;
              box-shadow: -15px -15px 0 #111827, 15px 15px 0 #111827;
            }
            100% {
              box-shadow: 15px -15px 0 #111827, -15px 15px 0 #111827;
            }
          }
          @keyframes hash-after {
            0% {
              height: 10px;
              box-shadow: -15px -15px 0 #111827, 15px 15px 0 #111827;
            }
            35% {
              height: 65px;
              box-shadow: -15px 0 0 #111827, 15px 0 0 #111827;
            }
            70% {
              height: 10px;
              box-shadow: -15px 15px 0 #111827, 15px -15px 0 #111827;
            }
            100% {
              box-shadow: -15px -15px 0 #111827, 15px 15px 0 #111827;
            }
          }

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; color: #0f172a !important; -webkit-print-color-adjust: exact; }
            .print-card { 
               background-color: white !important; 
               border: 1px solid #cbd5e1 !important; 
               box-shadow: none !important; 
               color: #0f172a !important; 
               break-inside: avoid;
            }
            /* Universal text colors for high-contrast print readability */
            .text-white, .text-slate-100, .text-slate-200, .text-slate-300 { color: #0f172a !important; }
            .text-slate-400, .text-slate-500 { color: #475569 !important; }
            .text-blue-300, .text-blue-400, .text-blue-500 { color: #1e40af !important; }
            .text-emerald-400, .text-emerald-500 { color: #064e3b !important; }
            .text-amber-400, .text-amber-500 { color: #92400e !important; }
            .text-purple-400, .text-purple-500 { color: #6b21a8 !important; }
            .text-red-400, .text-red-500 { color: #991b1b !important; }

            /* Remove dark backgrounds and transparency */
            .bg-slate-900, .bg-slate-950, .bg-slate-900\/50, .bg-slate-900\/40, .bg-slate-900\/60, .bg-slate-950\/50, .bg-slate-900\/10 { 
                background-color: transparent !important; 
            }
            .backdrop-blur-sm, .backdrop-blur-md { backdrop-filter: none !important; }
            
            /* Give failed startups boxes and insights a subtle background for contrast */
            .bg-blue-900\/10, .bg-slate-950\/50, .bg-red-500\/10 { 
                background-color: #f8fafc !important; 
                border: 1px solid #e2e8f0 !important; 
            }
            
            /* Ensure bars and indicators remain visible */
            .bg-blue-600, .bg-blue-500 { background-color: #2563eb !important; }
          }
        `}
            </style>

            <div className="no-print absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <InteractiveCanvas className="fixed inset-0 w-full h-full pointer-events-none z-0" isFlat={true} />
            </div>

            {/* Scroll Progress Bar */}
            <div className="no-print fixed top-[75px] left-0 w-full h-[3px] bg-black/5 z-[60]">
                <div 
                    className="h-full bg-[#111827] transition-all duration-75"
                    style={{ width: `${scrollProgress}%` }}
                ></div>
            </div>

            <nav className="sticky top-0 z-50 bg-white/95 border-b border-[#C0C0C0] h-[75px] flex items-center shadow-sm print:hidden">
                <div className="max-w-[1320px] mx-auto px-6 md:px-12 flex items-center justify-between w-full">
                    <div
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={() => onBack()}
                    >
                        <img src="/logo.svg" alt="StartupLens Logo" className="w-8 h-8 object-contain" style={{ filter: 'brightness(0)' }} />
                        <span className="text-2xl font-medium tracking-tight text-[#111827] font-sans">StartupLens</span>
                    </div>
                    <button
                        onClick={() => onBack()}
                        className="flex items-center space-x-2 text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span>Back to Home</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-[1320px] mx-auto p-4 md:pt-[30px] md:pb-[60px] md:px-[80px] space-y-[32px] relative z-10">

                {!data && !loading && !error && (
                    <div className="max-w-3xl mx-auto mt-2 space-y-6 animate-fade-in-up">
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl md:text-5xl font-semibold text-[#111827] tracking-tight">
                                Validate Your <span className="text-[#111827] underline decoration-2 underline-offset-4 font-bold">Vision.</span>
                            </h2>
                            <p className="text-[#4B5563] text-lg leading-relaxed max-w-xl mx-auto">
                                Enter your startup concept below to generate a professional market analysis, competitor breakdown, and strategic roadmap.
                            </p>
                        </div>

                        <div className={`p-8 ${colors.card} space-y-6 relative overflow-hidden`}>
                            <div className="space-y-6 relative z-10">
                                <div className="flex flex-col space-y-2">
                                    <label className="text-xs font-bold text-black uppercase tracking-widest">Startup Concept</label>
                                    <textarea
                                        className="bain-input h-32 resize-none"
                                        placeholder={placeholderText}
                                        value={idea}
                                        onChange={(e) => setIdea(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-xs font-bold text-black uppercase tracking-widest">Target Industry</label>
                                    <input
                                        type="text"
                                        className="bain-input"
                                        placeholder="e.g., EdTech, Fintech, Agritech"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAnalyze()}
                                    disabled={!idea || !industry}
                                    className={`w-full ${colors.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <span>Generate Intelligence Report</span>
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center h-96 space-y-12">
                        <div className="flex items-center justify-center p-8">
                            <div className="hash-loader"></div>
                        </div>

                        <div className="text-center space-y-4 animate-pulse">
                            <h3 className="text-3xl font-semibold text-[#111827]">Generating Intelligence...</h3>
                            <p className="text-[#4B5563] text-lg">Analyzing competitors, risks, and market gaps.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="max-w-2xl mx-auto mt-20 animate-fade-in text-center">
                        <div className={`p-8 ${colors.card} border ${colors.border} shadow-lg relative overflow-hidden`}>
                            {isQuotaError ? (
                                <div className="space-y-6">
                                    <div className="flex justify-center mb-2">
                                        <div className="p-4 bg-red-100 rounded-none animate-pulse">
                                            <Lock className="w-8 h-8 text-red-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-primary mb-2">API Limit Reached</h2>
                                        <p className="text-mutedtext mb-6 leading-relaxed max-w-lg mx-auto">
                                            The demo server's daily rate limit has been exhausted. You can try again later, or use your own Google Gemini API key to continue testing immediately.
                                        </p>
                                    </div>

                                    <div className="max-w-md mx-auto bg-pagebg p-6 border border-bordercolor text-left space-y-4">
                                        <div className="flex flex-col space-y-2">
                                            <label className="text-xs font-bold text-primary uppercase tracking-wider">Enter Your Gemini API Key</label>
                                            <input
                                                type="password"
                                                className="bain-input w-full"
                                                placeholder="AIzaSy..."
                                                value={customKey}
                                                onChange={(e) => setCustomKey(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleAnalyze(customKey)}
                                            disabled={!customKey}
                                            className="w-full py-3 bg-[#111827] hover:bg-[#4B5563] text-white rounded-none border border-[#111827] font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Retry with My Key</span>
                                        </button>
                                        <p className="text-[11px] text-[#4B5563] text-center">
                                            Your key is only used for this session and isn't stored.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => { setError(''); setIsQuotaError(false); }}
                                        className="text-[#111827] hover:underline text-sm font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-center mb-6">
                                        <AlertTriangle className="w-12 h-12 text-amber-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-[#111827] mb-2">Analysis Failed</h2>
                                    <p className="text-[#4B5563] mb-6">{error}</p>
                                    <button
                                        onClick={() => setError('')}
                                        className="px-6 py-2 bg-[#111827] hover:bg-[#4B5563] text-white rounded-none transition-all font-medium border border-[#111827]"
                                    >
                                        Dismiss
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {data && !loading && (
                    <div className="space-y-8 animate-fade-in pb-20 relative z-10">

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 scroll-reveal">
                            <div className={`col-span-1 ${colors.card} min-h-[190px] flex flex-col justify-between relative overflow-hidden shadow-none print-card`}>
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-bold text-[#111827] flex-1">Viability Score</h3>
                                    <button 
                                        onClick={() => setShowMethodology(true)}
                                        className="p-1 hover:bg-black/5 rounded-none text-black/40 hover:text-accent transition-colors no-print"
                                        title="View Calculation Methodology"
                                    >
                                        <Info className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="relative flex-1 flex items-center justify-center py-2">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/10" />
                                        <circle
                                            cx="64" cy="64" r="54"
                                            stroke="currentColor" strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={339}
                                            strokeDashoffset={339 - (339 * (data.strategy?.viability_score || 0)) / 100}
                                            className="text-[#111827] transition-all duration-200 ease-in-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-bold text-[#111827] font-mono">{data.strategy?.viability_score || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`col-span-1 md:col-span-3 ${colors.card} min-h-[190px] flex flex-col justify-center shadow-none print-card`}>
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-black/5 border border-black/10 rounded-none no-print">
                                        <Zap className="w-5 h-5 text-[#111827]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#111827]">The Whitespace Opportunity</h3>
                                </div>
                                <p className="text-black/80 text-sm leading-relaxed">
                                    {data.research?.opportunity || "Analysis pending..."}
                                </p>
                            </div>
                        </div>

                        {data.strategy?.financials && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 scroll-reveal">
                                <div className={`${colors.card} h-[220px] flex flex-col justify-between shadow-none print-card`}>
                                    <h4 className="text-xs font-bold text-black/50 uppercase">Revenue / User</h4>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-bold text-emerald-700">{data.strategy.financials.revenue_per_user.split('(')[0].trim()}</p>
                                        {data.strategy.financials.revenue_per_user.includes('(') && (
                                            <p className="text-[10px] text-black/40 font-bold uppercase tracking-brand mt-1">
                                                {data.strategy.financials.revenue_per_user.split('(')[1].replace(')', '')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`${colors.card} h-[220px] flex flex-col justify-between shadow-none print-card`}>
                                    <h4 className="text-xs font-bold text-black/50 uppercase">Min Investment</h4>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-bold text-[#111827]">{data.strategy.financials.min_investment.split('(')[0].trim()}</p>
                                        {data.strategy.financials.min_investment.includes('(') && (
                                            <p className="text-[10px] text-black/40 font-bold uppercase tracking-brand mt-1">
                                                {data.strategy.financials.min_investment.split('(')[1].replace(')', '')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`${colors.card} h-[220px] flex flex-col justify-between shadow-none print-card`}>
                                    <h4 className="text-xs font-bold text-black/50 uppercase">Break-even</h4>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-bold text-amber-700">{data.strategy.financials.break_even.split('(')[0].trim()}</p>
                                        {data.strategy.financials.break_even.includes('(') && (
                                            <p className="text-[10px] text-black/40 font-bold uppercase tracking-brand mt-1">
                                                {data.strategy.financials.break_even.split('(')[1].replace(')', '')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`${colors.card} h-[220px] flex flex-col justify-between shadow-none print-card`}>
                                    <h4 className="text-xs font-bold text-black/50 uppercase">Growth Rate</h4>
                                    <div className="flex flex-col">
                                        <p className="text-3xl font-bold text-purple-700">{data.strategy.financials.user_growth_rate.split('(')[0].trim()}</p>
                                        {data.strategy.financials.user_growth_rate.includes('(') && (
                                            <p className="text-[10px] text-black/40 font-bold uppercase tracking-brand mt-1">
                                                {data.strategy.financials.user_growth_rate.split('(')[1].replace(')', '')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`${colors.card} shadow-sm print-card scroll-reveal`}>
                            <div className="flex items-center space-x-3 mb-6">
                                <TrendingUp className="w-5 h-5 text-[#111827] no-print" />
                                <h2 className="text-xl font-bold text-[#111827]">Supporting Market Trends</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(data.research?.market_trends || []).map((trend: string, i: number) => (
                                    <div key={i} className="flex items-start space-x-3 p-4 rounded-none bg-white border border-black/10 text-black">
                                        <div className="mt-1"><ArrowRight className="w-4 h-4 text-[#111827]" /></div>
                                        <p className="text-black/80 text-sm leading-relaxed">{renderBoldText(trend)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid scroll-reveal">
                            <div className={`${colors.card} shadow-sm print-card`}>
                                <div className='flex justify-between items-center mb-4'>
                                    <h3 className="text-lg font-bold text-[#111827] flex items-center">
                                        <PieChartIcon className="w-5 h-5 mr-2 text-[#111827] no-print" /> Market Share
                                    </h3>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={marketShareData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {marketShareData.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#000000', borderColor: '#FFFFFF', color: '#FFFFFF', borderRadius: '0px', boxShadow: 'none' }}
                                                itemStyle={{ color: '#FFFFFF' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 p-4 bg-black/5 rounded-none border border-black/10">
                                    <div className="flex items-start space-x-2">
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-[#111827] flex-shrink-0 animate-pulse no-print"></div>
                                        <p className="text-xs text-black/70 leading-relaxed font-medium">
                                            {data.research?.market_share_insight || "Competitors are fighting for dominance in this fragmented landscape."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`${colors.card} shadow-sm print-card`}>
                                <div className='flex justify-between items-center mb-4'>
                                    <h3 className="text-lg font-bold text-[#111827] flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-[#111827] no-print" /> Age Demographics
                                    </h3>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={demographicsData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#CCCCCC" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#000000"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#000000"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}%`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#111827', opacity: 0.05 }}
                                                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#C0C0C0', color: '#111827', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                            />
                                            <Bar dataKey="percentage" fill="#111827" radius={[8, 8, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 p-4 bg-white rounded-lg border border-[#C0C0C0]">
                                    <div className="flex items-start space-x-2">
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-[#111827] flex-shrink-0 animate-pulse no-print"></div>
                                        <p className="text-xs text-[#4B5563] leading-relaxed font-medium">
                                            {data.strategy?.demographics?.demographics_insight || "Targeting the most active user base for maximum adoption."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 scroll-reveal">
                            <div className="flex items-center space-x-3">
                                <Layers className="w-6 h-6 text-[#111827] no-print" />
                                <h2 className="text-2xl font-bold text-[#111827] font-medium">Execution Strategy</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <div className="flex items-center space-x-3 mb-6">
                                        <TrendingUp className="w-5 h-5 text-[#111827] no-print" />
                                        <h3 className="text-lg font-bold text-black font-mono">Acquisition</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        {(data.strategy?.user_acquisition || []).map((item: string, i: number) => {
                                            const parts = item.includes(':') ? item.split(':') : [item, ''];
                                            return (
                                                <li key={i}>
                                                    <span className="text-black font-semibold block mb-1">{renderBoldText(parts[0])}</span>
                                                    {parts[1] && <span className="text-black/60 text-xs leading-relaxed block">{renderBoldText(parts[1])}</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <div className="flex items-center space-x-3 mb-6">
                                        <DollarSign className="w-5 h-5 text-[#111827] no-print" />
                                        <h3 className="text-lg font-bold text-black font-mono">Monetization</h3>
                                    </div>
                                    <ul className="space-y-4">
                                        {(data.strategy?.business_models || []).map((item: string, i: number) => {
                                            const parts = item.includes(':') ? item.split(':') : [item, ''];
                                            return (
                                                <li key={i}>
                                                    <span className="text-black font-semibold block mb-1">{renderBoldText(parts[0])}</span>
                                                    {parts[1] && <span className="text-black/60 text-xs leading-relaxed block">{renderBoldText(parts[1])}</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <div className="flex items-center space-x-3 mb-6">
                                        <Shield className="w-5 h-5 text-red-500 no-print" />
                                        <h3 className="text-lg font-bold text-black font-mono">Primary Risk</h3>
                                    </div>
                                    <div className="p-4 bg-red-50 border border-red-200/50 rounded-none print:bg-red-50 print:border-red-200">
                                        <p className="text-red-600 text-sm leading-relaxed font-medium">{renderBoldText(data.strategy?.risk_analysis)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <BarChart3 className="w-6 h-6 text-[#111827] no-print" />
                                <h2 className="text-2xl font-bold text-[#111827] font-medium">SWOT Analysis</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <h4 className="text-emerald-700 font-bold mb-4 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Strengths</h4>
                                    <ul className="list-disc list-inside space-y-2 text-black/80 text-xs">
                                        {(data.strategy?.swot?.strengths || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <h4 className="text-red-600 font-bold mb-4 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Weaknesses</h4>
                                    <ul className="list-disc list-inside space-y-2 text-black/80 text-xs">
                                        {(data.strategy?.swot?.weaknesses || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <h4 className="text-[#111827] font-bold mb-4 flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Opportunities</h4>
                                    <ul className="list-disc list-inside space-y-2 text-black/80 text-xs">
                                        {(data.strategy?.swot?.opportunities || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className={`${colors.card} shadow-sm print-card`}>
                                    <h4 className="text-amber-600 font-bold mb-4 flex items-center"><Shield className="w-4 h-4 mr-2" /> Threats</h4>
                                    <ul className="list-disc list-inside space-y-2 text-black/80 text-xs">
                                        {(data.strategy?.swot?.threats || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {failedStartupsLoading && (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="w-8 h-8 bg-[#111827] animate-spin mb-4"></div>
                                    <p className="text-[#4B5563] font-mono text-xs">Analyzing past failures in {industry}...</p>
                                </div>
                            </div>
                        )}

                        {failedStartupsData && failedStartupsData.startups && (
                            <div className="space-y-6 mt-12 bg-white p-8 rounded-none border-none shadow-none text-black scroll-reveal">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center space-x-3">
                                        <AlertTriangle className="w-8 h-8 text-amber-500 no-print" />
                                        <h2 className="text-3xl font-bold text-black tracking-tight font-light">Ghost Town: <span className="text-[#111827] underline decoration-2 underline-offset-4 font-normal">Failed Startups</span></h2>
                                    </div>
                                </div>

                                {failedStartupsData.summary && (
                                    <div className="p-6 rounded-none bg-black/5 border-l-4 border-[#111827] shadow-none mb-8">
                                        <p className="text-black/85 text-lg leading-relaxed font-medium">"{failedStartupsData.summary}"</p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {failedStartupsData.startups.map((startup: any, i: number) => (
                                         <div key={i} className="p-10 rounded-none bg-white border border-black/10 transition-all duration-[350ms] ease-out shadow-none print-card flex flex-col gap-6 relative overflow-hidden group hover:translate-y-[-6px] hover:border-[#111827] min-h-[420px]">
                                             <div className="absolute top-0 left-0 w-full h-1 bg-[#111827] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-[350ms]"></div>
                                             
                                             <div className="flex justify-between items-start border-b border-black/10 pb-4">
                                                 <div>
                                                     <h3 className="text-2xl font-bold text-black mb-1 group-hover:text-[#111827] transition-colors">{startup.name}</h3>
                                                     <p className="text-[#4B5563] text-sm font-medium">{startup.sector}</p>
                                                 </div>
                                                 <div className="bg-black/5 px-3 py-1 rounded-none border border-black/10">
                                                     <span className="text-xs text-black/75 font-mono font-medium">{startup.years_of_operation}</span>
                                                 </div>
                                             </div>
                                             
                                             <div className="space-y-5 flex-grow">
                                                 <div>
                                                     <span className="text-[10px] text-black/40 uppercase tracking-brand font-bold block mb-1 font-mono">What They Did</span>
                                                     <p className="text-sm text-black/80 leading-relaxed">{startup.product_type}</p>
                                                 </div>
                                                 
                                                 <div className="bg-red-50/50 p-4 rounded-none border border-red-200/40">
                                                     <span className="text-[10px] text-red-600 uppercase tracking-brand font-bold block mb-2 font-mono">Why They Failed</span>
                                                     <p className="text-sm text-red-700/80 leading-relaxed">{startup.failure_analysis}</p>
                                                 </div>
                                             </div>
                                             
                                             <div className="mt-auto pt-5 border-t border-black/10 flex justify-between items-end">
                                                <div className="w-2/3 pr-4">
                                                    <span className="text-[10px] text-[#111827] uppercase tracking-brand font-bold block mb-1 font-mono">Key Learning</span>
                                                    <p className="text-sm text-black/85 font-medium">{startup.learnings}</p>
                                                </div>
                                                <div className="w-1/3 text-right">
                                                    <span className="text-[10px] text-black/40 uppercase tracking-brand font-bold block mb-1 font-mono">Cash Burned</span>
                                                    <span className="text-lg text-black font-bold">{startup.cash_burned}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {failedStartupsData && failedStartupsData.error && (
                            <div className="space-y-6 mt-12 bg-white p-8 rounded-none border border-red-200/50 animate-fade-in shadow-none text-black">
                                <div className="flex items-center space-x-3 text-red-600">
                                    <AlertTriangle className="w-8 h-8 no-print" />
                                    <h2 className="text-2xl font-bold">Failed Startups Analysis Error</h2>
                                </div>
                                <div className="p-4 bg-black/5 border border-black/10">
                                    <p className="text-black/80 leading-relaxed font-medium">It looks like the RAG engine couldn't start: <strong>{failedStartupsData.error}</strong></p>
                                </div>
                            </div>
                        )}

                        <div className="p-8 rounded-none bg-[#111827] text-white shadow-none border border-white/10 relative overflow-hidden mt-12 mb-8 group no-print">
                            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                                <div className="space-y-4 max-w-2xl text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start space-x-3">
                                        <div className="p-2 bg-white/10 rounded-none border border-white/20">
                                            <Zap className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white tracking-tight font-light">Need Expert Guidance?</h3>
                                    </div>
                                    <p className="text-white/90 text-lg leading-relaxed font-light">
                                        Take your startup from idea to execution with our <span className="text-white font-bold font-sans">Pro Plan</span>. Get 1-on-1 mentorship, pitch deck reviews, and deep-dive strategy sessions with industry experts.
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={() => setShowPricing(true)}
                                    className="w-full md:w-auto px-8 py-4 bg-white text-black border border-white hover:bg-black hover:text-white rounded-none font-bold transition-all duration-300 flex items-center justify-center space-x-3 flex-shrink-0 cursor-pointer"
                                >
                                    <span>Upgrade to Pro</span>
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 mt-12 pt-8 border-t border-white/10 no-print">
                            <button
                                onClick={() => setData(null)}
                                className={`${colors.buttonSecondary} w-full sm:w-auto`}
                            >
                                Evaluate Another Idea
                            </button>
                            <button
                                onClick={handlePrint}
                                className={`${colors.buttonPrimary} w-full sm:w-auto`}
                            >
                                <Download className="w-5 h-5 mr-2" />
                                <span>Download & Print</span>
                            </button>
                        </div>

                    </div>
                )}
            </div>

            {/* Pricing Modal */}
            {showPricing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 transition-opacity" 
                        onClick={() => setShowPricing(false)}
                    ></div>
                    
                    <div className="relative bg-white border border-black p-8 max-w-lg w-full shadow-none rounded-none max-h-[90vh] overflow-y-auto no-scrollbar group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#111827]"></div>
                        
                        <button 
                            onClick={() => setShowPricing(false)} 
                            className="absolute top-4 right-4 text-black/40 hover:text-black transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-black mb-2">StartupLens <span className="text-[#111827] font-bold">Pro</span></h3>
                            <p className="text-black/60 text-sm">Everything you need to successfully launch.</p>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="text-center bg-black/5 p-6 rounded-none border border-black/10 w-full">
                                <span className="text-5xl font-bold text-black font-mono">$20</span>
                                <span className="text-black/60 ml-2 font-mono">/ month</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            {[
                                "Unlimited AI Analysis Reports",
                                "1-on-1 Strategy Session with Experts",
                                "Pitch Deck Review & Feedback",
                                "Investor-Ready Financial Projections",
                                "Advanced Market Competitor Tracking"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center space-x-3 text-sm text-black/80">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 mt-6">
                            <button 
                                className="w-full bg-[#111827] py-3 text-white rounded-none border border-[#111827] hover:bg-[#4B5563] font-bold transition-all duration-300 text-xs tracking-wider uppercase cursor-pointer"
                                onClick={() => {
                                    setShowPricing(false);
                                    onBack('pricing');
                                }}
                            >
                                View All Plans
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Methodology Modal */}
            {showMethodology && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 transition-opacity" 
                        onClick={() => setShowMethodology(false)}
                    ></div>
                    
                    <div className="relative bg-white border border-black p-5 md:p-6 max-w-2xl w-full shadow-none rounded-none max-h-[95vh] overflow-y-auto no-scrollbar">
                        <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-2">
                            <div className="flex items-center space-x-2 text-[#111827]">
                                <Info className="w-5 h-5" />
                                <h3 className="text-xl font-bold text-black">Analysis Methodology</h3>
                            </div>
                            <button onClick={() => setShowMethodology(false)} className="text-black/40 hover:text-black transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-black/5 rounded-none border border-black/10 space-y-1.5 shadow-none">
                                <div className="p-1.5 bg-black/5 rounded-none border border-black/10 w-fit">
                                    <Activity className="w-4 h-4 text-[#111827]" />
                                </div>
                                <h4 className="font-bold text-black uppercase text-[10px] tracking-wider font-mono">Agentic Reasoning</h4>
                                <p className="text-xs text-black/70 leading-relaxed">
                                    Our system uses <span className="text-[#111827] font-semibold">Multi-Agent Orchestration</span>. Point-agents gather raw data, Analyst-agents process and weigh details to output the Viability Score.
                                </p>
                            </div>
                            
                            <div className="p-4 bg-black/5 rounded-none border border-black/10 space-y-1.5 shadow-none">
                                <div className="p-1.5 bg-emerald-50 rounded-none border border-emerald-200/50 w-fit">
                                    <Search className="w-4 h-4 text-emerald-700" />
                                </div>
                                <h4 className="font-bold text-black uppercase text-[10px] tracking-wider font-mono">RAG Failure Mapping</h4>
                                <p className="text-xs text-black/70 leading-relaxed">
                                    Metrics are grounded using <span className="text-emerald-700 font-semibold">Retrieval-Augmented Generation</span>. The AI maps your idea against a database of verified startup failures.
                                </p>
                            </div>

                            <div className="p-4 bg-black/5 rounded-none border border-black/10 space-y-1.5 shadow-none">
                                <div className="p-1.5 bg-amber-50 rounded-none border border-amber-200/50 w-fit">
                                    <BarChart2 className="w-4 h-4 text-amber-700" />
                                </div>
                                <h4 className="font-bold text-black uppercase text-[10px] tracking-wider font-mono">Heuristic Weighting</h4>
                                <p className="text-xs text-black/70 leading-relaxed">
                                    The 0-100 score is calculated based on <span className="text-amber-700 font-semibold">6 Core Heuristics</span>: Market Density, Entry Barrier, Capital Intensity, Trends, Complexity, and Scalability.
                                </p>
                            </div>

                            <div className="p-4 bg-black/5 rounded-none border border-black/10 space-y-1.5 shadow-none">
                                <div className="p-1.5 bg-purple-50 rounded-none border border-purple-200/50 w-fit">
                                    <Target className="w-4 h-4 text-purple-700" />
                                </div>
                                <h4 className="font-bold text-black uppercase text-[10px] tracking-wider font-mono">Market Inferencing</h4>
                                <p className="text-xs text-black/70 leading-relaxed">
                                    Financials are not generic; they are <span className="text-purple-700 font-semibold">Inferred Projections</span>. By analyzing competitor CAC, the AI simulates a realistic breakeven timeline.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#111827]/5 p-4 border border-[#111827]/10 rounded-none">
                            <p className="text-xs text-black/85 leading-relaxed italic text-center">
                                "The AI serves as a <strong>Decision Support System</strong>, synthesizing millions of data points into a strategic draft. For production deployment, these metrics should be validated against actual primary market research."
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
