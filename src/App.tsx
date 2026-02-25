/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  BarChart3, 
  Shield, 
  ArrowUpRight, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Info,
  ChevronRight,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { SentinelAgent, MarketAnalysis, AgentStep } from './services/sentinelService';
import { cn } from './lib/utils';

const API_KEY = process.env.GEMINI_API_KEY || "";

// Helper to clean up markdown strings and ensure headers have spaces
const formatMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    // Ensure space after # headers if missing (e.g. ##Header -> ## Header)
    .replace(/^(#+)([A-Za-z0-9])/gm, '$1 $2');
};

const STEPS: Record<AgentStep, { label: string; agent: string }> = {
  RESEARCHER_GATHERING: { label: "Scraping news & stock data...", agent: "Researcher Agent" },
  ANALYST_VALIDATING: { label: "Validating bias & sentiment...", agent: "Analyst Agent" },
  QUANT_MODELING: { label: "Running financial risk models...", agent: "Quant Agent" },
  EDITOR_SYNTHESIZING: { label: "Synthesizing final report...", agent: "Editor Agent" }
};

export default function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStep>("RESEARCHER_GATHERING");
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '1M' | '1Y'>('7D');
  const [error, setError] = useState<string | null>(null);
  const agentRef = useRef<SentinelAgent | null>(null);

  useEffect(() => {
    if (API_KEY) {
      agentRef.current = new SentinelAgent(API_KEY);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !agentRef.current) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await agentRef.current.researchCompany(query, (step) => {
        setCurrentStep(step);
      });
      setAnalysis(result);
      setTimeframe('7D');
    } catch (err: any) {
      let message = "An unexpected error occurred";
      if (err.message?.includes("429") || err.status === "RESOURCE_EXHAUSTED") {
        message = "Gemini API rate limit exceeded. Please wait a minute and try again.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to generate data for different timeframes
  const getTimeframeData = () => {
    if (!analysis) return [];
    const baseData = analysis.stockData.history;
    const lastPrice = baseData[baseData.length - 1].price;

    switch (timeframe) {
      case '1D':
        // Simulate intraday data (hourly)
        return Array.from({ length: 24 }, (_, i) => ({
          date: `${i}:00`,
          price: lastPrice * (1 + (Math.random() - 0.5) * 0.02)
        }));
      case '1M':
        // Simulate monthly data (4 weeks)
        return Array.from({ length: 30 }, (_, i) => ({
          date: `Day ${i + 1}`,
          price: lastPrice * (0.9 + (i / 30) * 0.2 + (Math.random() - 0.5) * 0.05)
        }));
      case '1Y':
        // Simulate yearly data (12 months)
        return Array.from({ length: 12 }, (_, i) => ({
          date: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          price: lastPrice * (0.7 + (i / 12) * 0.5 + (Math.random() - 0.5) * 0.1)
        }));
      default:
        return baseData;
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    
    const content = `
SENTINEL AI - AUTONOMOUS MARKET INTELLIGENCE BRIEF
Generated on: ${new Date().toLocaleString()}
--------------------------------------------------

EXECUTIVE SUMMARY: ${analysis.companyName} (${analysis.ticker})
Current Price: $${analysis.stockData.price}
Recommendation: ${analysis.recommendation}

[RISK ASSESSMENT]
- Volatility: ${analysis.riskMetrics.volatility}%
- P/E Ratio: ${analysis.riskMetrics.peRatio}
- Market Cap: ${analysis.riskMetrics.marketCap}
- Dividend Yield: ${analysis.riskMetrics.dividendYield}

[TECHNICAL INDICATORS]
- RSI (14): ${analysis.technicalIndicators.rsi}
- 50D Moving Average: $${analysis.technicalIndicators.movingAverage50.toLocaleString()}
- 200D Moving Average: $${analysis.technicalIndicators.movingAverage200.toLocaleString()}
- Beta: ${analysis.technicalIndicators.beta}

[MARKET SENTIMENT]
- Sentiment Score: ${analysis.sentimentScore}%
- Positive: ${analysis.sentimentBreakdown.positive}%
- Neutral: ${analysis.sentimentBreakdown.neutral}%
- Negative: ${analysis.sentimentBreakdown.negative}%

[LATEST INTELLIGENCE]
${analysis.news.map(n => `- [${n.sentiment.toUpperCase()}] ${n.title} (${n.source})`).join('\n')}

--------------------------------------------------
FULL ANALYSIS REPORT
--------------------------------------------------
${analysis.report}

--------------------------------------------------
Sentinel AI • Autonomous Market Research • 2026
`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${analysis.ticker}_Sentinel_Full_Analysis.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* API Key Warning */}
      {!API_KEY && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-center">
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Gemini API Key Missing. Please configure it in your environment.
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="font-serif text-lg md:text-xl font-bold tracking-tight hidden sm:inline-block">Sentinel AI</span>
          </div>
          
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search company..."
              className="w-full bg-black/3 border border-black/8 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
          </form>

          <div className="hidden lg:flex items-center gap-4 text-[10px] font-medium text-black/60 uppercase tracking-widest shrink-0">
            <span>Market Live</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        <AnimatePresence mode="wait">
          {!analysis && !isLoading && !error && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="min-h-[80vh] flex flex-col items-center justify-center text-center py-12 space-y-12"
            >
              <div className="space-y-6">
                <h1 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter leading-[0.9]">
                  Autonomous <br />
                  <span className="italic text-black/40">Market Intelligence</span>
                </h1>
                <p className="text-black/60 max-w-lg mx-auto text-base md:text-lg">
                  Real-time research, stock analysis, and professional investment reports powered by agentic AI.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
                {[
                  { icon: Activity, label: "Live Stock Data", desc: "Real-time pricing and history" },
                  { icon: Newspaper, label: "News Sentiment", desc: "AI-powered news analysis" },
                  { icon: BarChart3, label: "Deep Research", desc: "Automated investment reports" }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-white border border-black/5 text-left space-y-3 hover:border-black/10 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-black/3 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm tracking-tight">{item.label}</h3>
                      <p className="text-xs text-black/50 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center space-y-8"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-black/5 rounded-full animate-ping" />
                <Loader2 className="w-16 h-16 text-black animate-spin relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <Shield className="w-5 h-5 text-black/40" />
                </div>
              </div>
              
              <div className="text-center space-y-4 max-w-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em]">
                    {STEPS[currentStep].agent} Active
                  </span>
                  <h2 className="font-serif text-3xl font-bold italic leading-tight">
                    {STEPS[currentStep].label}
                  </h2>
                </div>
                
                <div className="flex gap-1 justify-center">
                  {(Object.keys(STEPS) as AgentStep[]).map((step) => (
                    <div 
                      key={step}
                      className={cn(
                        "h-1 w-8 rounded-full transition-all duration-500",
                        currentStep === step ? "bg-black w-12" : "bg-black/10"
                      )}
                    />
                  ))}
                </div>
                
                <p className="text-black/40 text-xs italic">
                  Agents are collaborating in real-time to validate market data...
                </p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-red-50 border border-red-100 rounded-3xl flex flex-col items-center justify-center text-center space-y-4"
            >
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-red-900">Research Failed</h3>
                <p className="text-red-700/70 max-w-md">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {analysis && !isLoading && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Header Info */}
              <div className="lg:col-span-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-black/5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-serif font-bold">{analysis.companyName}</h1>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded uppercase tracking-tighter">
                        {analysis.ticker}
                      </span>
                      {analysis.isSimulated && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-tighter border border-amber-200">
                          Simulated
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-black/60 max-w-2xl text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-xs font-mono text-black/40 uppercase tracking-widest block mb-1">Current Price</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-mono font-medium tracking-tighter">
                        ${analysis.stockData.price.toLocaleString()}
                      </span>
                      <div className={cn(
                        "flex items-center text-sm font-medium",
                        analysis.stockData.change >= 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {analysis.stockData.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {analysis.stockData.changePercent}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-12 w-px bg-black/5" />
                  
                  <div className="text-right">
                    <span className="text-xs font-mono text-black/40 uppercase tracking-widest block mb-1">Recommendation</span>
                    <span className={cn(
                      "text-2xl font-serif font-bold italic",
                      analysis.recommendation === "Buy" ? "text-emerald-600" : 
                      analysis.recommendation === "Sell" ? "text-red-600" : "text-amber-600"
                    )}>
                      {analysis.recommendation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-8 space-y-6">
                {/* Price Chart */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3" />
                      Price Performance (7D)
                    </h3>
                    <div className="flex gap-2">
                      {(['1D', '7D', '1M', '1Y'] as const).map(t => (
                        <button 
                          key={t} 
                          onClick={() => setTimeframe(t)}
                          className={cn(
                            "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                            t === timeframe ? "bg-black text-white" : "bg-black/3 text-black/40 hover:bg-black/5"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-75 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getTimeframeData()}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#000" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000005" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#00000030', fontWeight: 500 }}
                          dy={10}
                        />
                        <YAxis 
                          hide 
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: '1px solid rgba(0,0,0,0.05)', 
                            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#000" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Market Sentiment (Full Width) */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                      <PieChart className="w-3 h-3" />
                      Market Sentiment Analysis
                    </h3>
                    <div className="text-3xl font-mono font-medium tracking-tighter">
                      {analysis.sentimentScore}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    <div className="md:col-span-2 h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: 'Positive', value: analysis.sentimentBreakdown.positive, color: '#10b981' },
                            { name: 'Neutral', value: analysis.sentimentBreakdown.neutral, color: '#f59e0b' },
                            { name: 'Negative', value: analysis.sentimentBreakdown.negative, color: '#ef4444' }
                          ]}
                          layout="vertical"
                          margin={{ left: 10, right: 30 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#00000040' }} 
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }}
                          />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                            {[
                              { color: '#10b981' },
                              { color: '#f59e0b' },
                              { color: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${analysis.sentimentScore}%` }}
                          className={cn(
                            "h-full rounded-full",
                            analysis.sentimentScore > 60 ? "bg-emerald-500" : 
                            analysis.sentimentScore < 40 ? "bg-red-500" : "bg-amber-500"
                          )}
                        />
                      </div>
                      <p className="text-[10px] text-black/40 leading-relaxed italic">
                        Aggregated sentiment based on {analysis.news.length} validated intelligence sources and real-time social signals.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Report */}
                <div className="bg-white p-8 rounded-3xl border border-black/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-black/5 pb-4">
                    <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" />
                      Investment Analysis Report
                    </h3>
                    <button 
                      onClick={downloadReport}
                      className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline text-black/60"
                    >
                      Download Report <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown>{formatMarkdown(analysis.report)}</ReactMarkdown>
                  </div>
                </div>

                {/* News Feed (Moved to Main and Gridified) */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                      <Newspaper className="w-3 h-3" />
                      Latest Intelligence
                    </h3>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors">
                      View All News
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.news.map((item, i) => (
                      <a 
                        key={i} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group block p-4 rounded-2xl bg-black/[0.02] hover:bg-black/[0.04] transition-all border border-black/5"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest">
                            {item.source}
                          </span>
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase",
                            item.sentiment === 'positive' ? "bg-emerald-100 text-emerald-700" :
                            item.sentiment === 'negative' ? "bg-red-100 text-red-700" : "bg-black/10 text-black/60"
                          )}>
                            {item.sentiment}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium leading-snug group-hover:text-black transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] text-black/30">{item.date}</span>
                          <ExternalLink className="w-2 h-2 text-black/20" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Area */}
              <div className="lg:col-span-4 space-y-6">
                {/* Risk Analysis */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-4">
                  <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Risk Assessment
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/2 rounded-xl border border-black/3">
                      <span className="text-[8px] font-bold text-black/30 uppercase block mb-1">Volatility</span>
                      <div className="flex items-end justify-between">
                        <span className="text-lg font-mono font-medium">{analysis.riskMetrics.volatility}%</span>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          analysis.riskMetrics.volatility > 70 ? "bg-red-500" : "bg-emerald-500"
                        )} />
                      </div>
                    </div>
                    <div className="p-3 bg-black/2 rounded-xl border border-black/3">
                      <span className="text-[8px] font-bold text-black/30 uppercase block mb-1">P/E Ratio</span>
                      <span className="text-lg font-mono font-medium">{analysis.riskMetrics.peRatio}</span>
                    </div>
                    <div className="p-3 bg-black/2 rounded-xl border border-black/3">
                      <span className="text-[8px] font-bold text-black/30 uppercase block mb-1">Market Cap</span>
                      <span className="text-sm font-mono font-medium">{analysis.riskMetrics.marketCap}</span>
                    </div>
                    <div className="p-3 bg-black/2 rounded-xl border border-black/3">
                      <span className="text-[8px] font-bold text-black/30 uppercase block mb-1">Div Yield</span>
                      <span className="text-sm font-mono font-medium">{analysis.riskMetrics.dividendYield}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Analysis */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-4">
                  <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Technical Indicators
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-black/2 rounded-lg">
                      <span className="text-[10px] font-bold text-black/40 uppercase">RSI (14)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold">{analysis.technicalIndicators.rsi}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          analysis.technicalIndicators.rsi > 70 ? "bg-red-500" : 
                          analysis.technicalIndicators.rsi < 30 ? "bg-emerald-500" : "bg-black/20"
                        )} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-black/2 rounded-lg">
                      <span className="text-[10px] font-bold text-black/40 uppercase">50D MA</span>
                      <span className="text-xs font-mono font-bold">${analysis.technicalIndicators.movingAverage50.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-black/2 rounded-lg">
                      <span className="text-[10px] font-bold text-black/40 uppercase">200D MA</span>
                      <span className="text-xs font-mono font-bold">${analysis.technicalIndicators.movingAverage200.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-black/2 rounded-lg">
                      <span className="text-[10px] font-bold text-black/40 uppercase">Beta (Risk)</span>
                      <span className="text-xs font-mono font-bold">{analysis.technicalIndicators.beta}</span>
                    </div>
                  </div>
                </div>

                {/* Agent Thought Logs */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 space-y-4">
                  <h3 className="text-xs font-mono text-black/40 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Agent Thought Process
                  </h3>
                  <div className="space-y-4">
                    {analysis.agentLogs.map((log, i) => (
                      <div key={i} className="relative pl-6 border-l border-black/5">
                        <div className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-black" />
                        <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1">
                          {log.agent}
                        </span>
                        <p className="text-xs text-black/60 italic leading-relaxed">
                          "{log.thought}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentinel Insight (Moved to Sidebar) */}
                <div className="bg-black text-white p-6 rounded-3xl shadow-xl shadow-black/10 space-y-4">
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Sentinel Conclusion
                  </h3>
                  <p className="text-sm italic font-serif leading-relaxed text-white/90">
                    "The current market structure suggests a {analysis.recommendation.toLowerCase()} position. News sentiment is leaning {analysis.news.filter(n => n.sentiment === 'positive').length > 2 ? 'bullish' : 'cautious'} with key resistance levels forming near recent highs."
                  </p>
                  <div className="pt-4 flex items-center justify-between border-t border-white/10">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-white/10 flex items-center justify-center overflow-hidden">
                          <img src={`https://picsum.photos/seed/${i}/32/32`} alt="Analyst" className="w-full h-full object-cover opacity-50" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      3 Analysts Monitoring
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-8 border-t border-black/5 text-center">
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">
          Sentinel AI • Autonomous Market Research • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}