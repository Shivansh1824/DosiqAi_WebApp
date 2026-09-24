import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, Brain, Activity, Shield, ChevronDown, CheckCircle2, Lock, FileText, Users, Mail, MapPin, Sparkles, LayoutDashboard } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DosiqLogo } from '../common/DosiqLogo';

gsap.registerPlugin(ScrollTrigger);

// ── Main Layout Component ───────────────────────────────────────────────────
export const LandingPage = ({ onStart }) => {
  const [currentPage, setCurrentPage] = useState('home'); 
  const containerRef = useRef(null);
  const bgMeshRef = useRef(null);

  // Background Parallax
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!bgMeshRef.current) return;
      const xPos = (e.clientX / window.innerWidth - 0.5) * 2;
      const yPos = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(bgMeshRef.current, { x: xPos * -40, y: yPos * -40, duration: 2, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const navigateTo = (page, e) => {
    if (e) e.preventDefault();
    setCurrentPage(page);
  };

  const scrollToSection = (id, e) => {
    if (e) e.preventDefault();
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAFAFA] text-slate-900 overflow-hidden relative font-sans selection:bg-emerald-200">
      
      {/* Abstract Background Mesh */}
      <div 
        ref={bgMeshRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
        style={{
          background: `
            radial-gradient(circle at 10% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 90% 60%, rgba(20, 184, 166, 0.08) 0%, transparent 60%)
          `
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="nav-item cursor-pointer" onClick={(e) => navigateTo('home', e)}>
            <DosiqLogo size="large" showBadge={true} variant="dark" />
          </div>
          <div className="nav-item flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              <button onClick={(e) => scrollToSection('features', e)} className="hover:text-emerald-600 transition-colors">Features</button>
              <button onClick={(e) => scrollToSection('analysis', e)} className="hover:text-emerald-600 transition-colors">Analysis</button>
              <button onClick={(e) => scrollToSection('security', e)} className="hover:text-emerald-600 transition-colors">Security</button>
            </nav>
            <button 
              onClick={onStart}
              className="px-6 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-full font-bold text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              Access Vault <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 min-h-screen pt-20 flex flex-col">
        {currentPage === 'home' && <HomeView onStart={onStart} />}
        {currentPage === 'privacy' && <PrivacyView />}
        {currentPage === 'contact' && <ContactView />}
        
        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200/60 bg-white/50 backdrop-blur-sm pt-20 pb-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-2 pr-8">
                <DosiqLogo size="default" showBadge={false} variant="dark" />
                <p className="text-slate-500 mt-6 max-w-sm font-medium leading-relaxed">
                  Empowering families with AI-driven health intelligence. Make sense of your medical data safely, beautifully, and instantly.
                </p>
              </div>
              <div>
                <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Product</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-500">
                  <li><button onClick={(e) => scrollToSection('features', e)} className="hover:text-emerald-600 transition-colors">Features & Capabilities</button></li>
                  <li><button onClick={(e) => scrollToSection('security', e)} className="hover:text-emerald-600 transition-colors">Trust & Security</button></li>
                  <li><button onClick={(e) => scrollToSection('analysis', e)} className="hover:text-emerald-600 transition-colors">Health Analysis</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-900 font-bold mb-6 text-sm uppercase tracking-wider">Company</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-500">
                  <li><button onClick={(e) => navigateTo('privacy', e)} className="hover:text-emerald-600 transition-colors">Privacy Policy</button></li>
                  <li><button onClick={(e) => navigateTo('privacy', e)} className="hover:text-emerald-600 transition-colors">Terms of Service</button></li>
                  <li><button onClick={(e) => navigateTo('contact', e)} className="hover:text-emerald-600 transition-colors">Contact Support</button></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-200/60 flex flex-col items-center justify-center text-sm text-slate-500 font-medium text-center">
              <p>© {new Date().getFullYear()} Dosiq AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// ── Home View ────────────────────────────────────────────────────────────────
const HomeView = ({ onStart }) => {
  const heroRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);
  
  // Analysis section refs
  const analysisTriggerRef = useRef(null);
  const analysisDocRef = useRef(null);
  const analysisChip1Ref = useRef(null);
  const analysisChip2Ref = useRef(null);
  const analysisChip3Ref = useRef(null);

  useGSAP(() => {
    // Hero Entrance
    const tl = gsap.timeline();
    tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-desc', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }, '-=0.6')
      // Clean 2D transform for the cards to avoid broken 3D perspective issues
      .from([card1Ref.current, card2Ref.current, card3Ref.current], {
        y: 60, opacity: 0, scale: 0.9, duration: 1.2, stagger: 0.15, ease: 'power3.out'
      }, '-=0.8');

    // Smooth, safe floating animations (no extreme rotations)
    gsap.to(card1Ref.current, { y: '-=15', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(card2Ref.current, { y: '+=15', duration: 3.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5 });
    gsap.to(card3Ref.current, { y: '-=10', duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });

    // Hero Mouse Parallax (safe 2D translations)
    const onMouseMove = (e) => {
      if (!heroRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(card1Ref.current, { x: x * 15, y: y * 15, duration: 1, ease: 'power2.out' });
      gsap.to(card2Ref.current, { x: x * -25, y: y * -25, duration: 1, ease: 'power2.out' });
      gsap.to(card3Ref.current, { x: x * 35, y: y * 35, duration: 1, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', onMouseMove);

    // Fade up generic sections
    gsap.utils.toArray('.fade-up-section').forEach(section => {
      gsap.from(section, {
        scrollTrigger: { trigger: section, start: 'top 85%' },
        y: 40, opacity: 0, duration: 1, ease: 'power3.out'
      });
    });

    // Analysis Section Dribbble-Style Scroll Animation
    const analysisTl = gsap.timeline({
      scrollTrigger: {
        trigger: analysisTriggerRef.current,
        start: 'top 70%',
        end: 'bottom center',
        toggleActions: 'play none none reverse'
      }
    });

    analysisTl.from(analysisDocRef.current, { y: 100, opacity: 0, scale: 0.9, duration: 1, ease: 'power4.out' })
      .from(analysisChip1Ref.current, { x: -50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' }, '-=0.5')
      .from(analysisChip2Ref.current, { x: 50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' }, '-=0.6')
      .from(analysisChip3Ref.current, { y: 50, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' }, '-=0.6');

    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  const faqs = [
    { q: "How does Dosiq AI extract my medical data?", a: "We use advanced machine learning models fine-tuned on medical documents. When you upload a PDF or image, our AI identifies key biomarkers, medications, and clinical notes, structuring them into a clear, unified dashboard." },
    { q: "Is my personal health information secure?", a: "Absolutely. We employ bank-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Your medical data is your private property, and we strictly adhere to top-tier healthcare data protection standards. We never sell your data." },
    { q: "Can I manage records for my family members?", a: "Yes! Dosiq AI features a comprehensive 'Family Vault' where you can add profiles for your spouse, children, or parents, managing all their prescriptions and lab results in one centralized place." }
  ];

  return (
    <>
      {/* ── 1. Hero Section (Restored & Fixed Crypto 3D Style) ── */}
      <section ref={heroRef} className="pt-24 pb-16 min-h-[92vh] flex items-center relative">
        <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <div className="hero-text-content z-20">
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60 mb-8 uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Intelligent Health OS
            </div>
            
            <h1 className="hero-title text-5xl md:text-6xl lg:text-[76px] font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.05]">
              Transforming <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                Clinical Data.
              </span>
            </h1>
            
            <p className="hero-desc text-lg md:text-xl text-slate-500 mb-12 leading-relaxed max-w-lg font-medium">
              Upload complex medical records and watch our specialized AI structure them into a beautiful, trackable, and secure family health vault.
            </p>
            
            <div className="hero-cta flex flex-col sm:flex-row items-center gap-5">
              <button onClick={onStart} className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.4)] hover:-translate-y-1">
                Get Started Free
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold text-lg transition-all duration-300 border-2 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 shadow-sm flex items-center justify-center gap-2 group">
                <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                Explore Demo
              </button>
            </div>
          </div>

          {/* Right Floating Cards (Fixed clipping/broken look) */}
          <div className="relative h-[600px] hidden lg:block z-10">
            {/* Card 1: Main Chart (Z-index 20) */}
            <div ref={card1Ref} className="absolute top-12 left-0 w-[440px] bg-white rounded-[2rem] p-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 z-20">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Hemoglobin (Hb)</h3>
                  <p className="text-sm text-slate-500 font-medium">6 Month Trajectory</p>
                </div>
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm border border-emerald-100">
                  14.2 g/dL
                </div>
              </div>
              <div className="h-44 w-full flex items-end gap-3 justify-between border-b border-slate-100/80 pb-3">
                {[40, 55, 45, 75, 60, 90].map((h, i) => (
                  <div key={i} className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 shadow-sm relative group" style={{ height: `${h}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {h/5 + 10} g/dL
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </div>

            {/* Card 2: Prescription (Z-index 30, overlapping) */}
            <div ref={card2Ref} className="absolute bottom-16 -left-12 w-[320px] bg-slate-900 rounded-[2rem] p-6 shadow-[0_40px_80px_-20px_rgba(15,23,42,0.3)] border border-slate-700/50 z-30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Active Meds</h4>
                  <p className="text-emerald-400 text-xs font-semibold">Dr. A. Sharma</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-slate-200 font-medium text-sm">Rosuvastatin 20mg</span>
                  <span className="text-[10px] font-bold text-white bg-slate-700 px-2 py-1 rounded-md">0-0-1</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700/50">
                  <span className="text-slate-200 font-medium text-sm">Aspirin 75mg</span>
                  <span className="text-[10px] font-bold text-white bg-slate-700 px-2 py-1 rounded-md">1-0-0</span>
                </div>
              </div>
            </div>

            {/* Card 3: Vault Badge (Z-index 40) */}
            <div ref={card3Ref} className="absolute top-4 right-4 bg-white p-5 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-5 z-40">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full border-2 border-white bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">R</div>
                <div className="w-12 h-12 rounded-full border-2 border-white bg-teal-500 text-white flex items-center justify-center font-bold shadow-sm">S</div>
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">+2</div>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">Family Vault</p>
                <p className="text-xs text-emerald-600 font-bold tracking-wide">SYNCED SECURELY</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Health History / Analysis Section (Animated Dribbble Style) ── */}
      <section id="analysis" ref={analysisTriggerRef} className="py-32 bg-slate-900 border-y border-slate-800 overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          
          <div className="order-2 lg:order-1 relative h-[500px] flex justify-center items-center">
            {/* The "Static Report" Graphic */}
            <div ref={analysisDocRef} className="w-72 bg-white rounded-2xl p-6 shadow-2xl z-10">
              <div className="w-1/3 h-2 bg-slate-200 rounded-full mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-slate-100 rounded"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded w-4/6"></div>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-6 space-y-3">
                <div className="flex justify-between">
                  <div className="w-1/3 h-3 bg-slate-200 rounded"></div>
                  <div className="w-1/4 h-3 bg-slate-200 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-1/4 h-3 bg-slate-200 rounded"></div>
                  <div className="w-1/3 h-3 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Extracted Chips flying out */}
            <div ref={analysisChip1Ref} className="absolute -left-4 top-20 bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold shadow-[0_10px_30px_rgba(16,185,129,0.3)] z-20 flex items-center gap-3">
              <Activity className="w-5 h-5" />
              <span>Cholesterol: 180 mg/dL</span>
            </div>
            
            <div ref={analysisChip2Ref} className="absolute -right-8 top-1/2 bg-white text-slate-900 px-5 py-3 rounded-xl font-bold shadow-xl z-20 flex items-center gap-3 border border-slate-100">
              <Activity className="w-5 h-5 text-teal-500" />
              <span>Glucose: 95 mg/dL</span>
            </div>
            
            <div ref={analysisChip3Ref} className="absolute left-1/2 -translate-x-1/2 -bottom-10 bg-slate-800 border border-slate-700 text-white px-5 py-3 rounded-xl font-bold shadow-xl z-20 flex items-center gap-3 w-64">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">↑</div>
              <div className="text-xs">
                <p className="text-emerald-400">Trend Detected</p>
                <p className="font-medium text-slate-300">Improved over 3 months</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">We analyze your history,<br/>not just store it.</h2>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
              Most platforms act as a static digital filing cabinet. Dosiq AI fundamentally changes this by actively parsing your historical reports to understand the trajectory of your health.
            </p>
            <ul className="space-y-5 text-slate-300 font-medium mb-8">
              <li className="flex gap-4"><div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5 shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div> Automatically connects past lab results to current ones</li>
              <li className="flex gap-4"><div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5 shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div> Generates visual trendlines for critical biomarkers</li>
              <li className="flex gap-4"><div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5 shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div> Identifies out-of-range patterns over months or years</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 3. Structured Perfection (Features) ── */}
      <section id="features" className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="fade-up-section text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Structured perfection.</h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Dosiq AI actively reads, understands, and structures your medical data so you can make informed decisions instantly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Brain />}
              title="AI Medical Parsing"
              desc="Upload a PDF lab report. Our specialized LLM identifies biomarkers, extracts exact values, and structures them into databases instantly."
            />
            <FeatureCard 
              icon={<Activity />}
              title="Visual Health Trends"
              desc="We map your extracted cholesterol, glucose, and other vitals onto interactive timelines. See your trajectory without manual typing."
            />
            <FeatureCard 
              icon={<Users />}
              title="Multi-Profile Vaults"
              desc="Manage your entire family's health securely. Create separate profiles for dependents and track their distinct medication schedules."
            />
          </div>
        </div>
      </section>

      {/* ── 4. Deep Feature Capabilities ── */}
      <section className="py-24 bg-white border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="fade-up-section text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Powerful Capabilities</h2>
            <p className="text-slate-500 font-medium">Explore the deep technical features of Dosiq AI.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="fade-up-section bg-slate-50 p-8 rounded-[2rem] border border-slate-200/60 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Context-Aware LLM</h3>
              <p className="text-slate-600">Our engine is fine-tuned to understand complex clinical jargon, nested lab report tables, and varied prescription formats. It perfectly maps synonyms to unified database records.</p>
            </div>
            <div className="fade-up-section bg-slate-50 p-8 rounded-[2rem] border border-slate-200/60 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.11.03-1.84 1.18-5.22 3.47-.49.34-.94.5-1.34.49-.45-.01-1.3-.25-1.94-.46-.78-.26-1.4-.4-1.35-.85.03-.23.34-.47.93-.72 3.65-1.59 6.09-2.64 7.33-3.15 3.49-1.46 4.22-1.72 4.69-1.73.1 0 .34.02.49.14.12.1.17.24.19.34.01.07.03.22.02.32z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Telegram Integration</h3>
              <p className="text-slate-600">Interact with your vault on the go. Send a picture of a prescription to our Telegram bot and have it immediately parsed and added to your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Restored Bank-Grade Privacy (2-column layout) ── */}
      <section id="security" className="py-24 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="fade-up-section relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-[3rem] transform -rotate-3 scale-105 z-0"></div>
              <div className="relative z-10 bg-slate-900 text-white rounded-[2rem] p-10 shadow-xl border border-slate-800">
                <Lock className="w-12 h-12 text-emerald-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Bank-Grade Security Architecture</h3>
                <ul className="space-y-4">
                  {[
                    'End-to-end encryption for uploaded documents',
                    'Row-Level Security (RLS) guarantees data isolation',
                    'Processing in stateless edge functions',
                    'No data sold to third parties, ever'
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="fade-up-section">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">Your privacy is our core foundation.</h2>
              <p className="text-lg text-slate-600 mb-6 font-medium leading-relaxed">
                Medical records are the most sensitive data you own. We designed Dosiq AI from the ground up with a privacy-first methodology. 
              </p>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                Every document you upload is processed through secure environments. Only you and your authorized family members have the cryptographic keys to view this data. When you delete a record, it is hard-deleted everywhere immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ Section ── */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <div className="fade-up-section text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => <FaqItem key={i} faq={faq} />)}
        </div>
      </section>
    </>
  );
};

// ── Components ──────────────────────────────────────────────────────────────
const FeatureCard = ({ icon, title, desc }) => (
  <div className="fade-up-section p-10 rounded-[2rem] bg-white border border-slate-200/60 hover:border-emerald-300 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)] transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[4rem] -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-emerald-50/50" />
    <div className="relative z-10">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 text-emerald-600 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const FaqItem = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="fade-up-section border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:border-emerald-200 transition-colors">
      <button className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-slate-50" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-emerald-100 text-emerald-600' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out bg-slate-50 ${isOpen ? 'py-5 max-h-64 opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-600 font-medium leading-relaxed">{faq.a}</p>
      </div>
    </div>
  );
};

// ── Shared Generic Page Wrapper ─────────────────────────────────────────────
const PageWrapper = ({ title, subtitle, children }) => {
  useGSAP(() => {
    gsap.from('.page-content > *', { y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
  }, []);
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 w-full page-content">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xl text-slate-500 font-medium">{subtitle}</p>}
      </div>
      <div className="text-slate-600 text-lg leading-relaxed space-y-6">{children}</div>
    </div>
  );
};

// ── Static Sub-Pages (Privacy & Contact) ────────────────────────────────────
const PrivacyView = () => (
  <PageWrapper title="Privacy Policy & Terms" subtitle="Last updated: September 24, 2026">
    <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-200/60 space-y-6">
      <h3 className="text-2xl font-bold text-slate-900 mt-0">1. Data Collection and Usage</h3>
      <p>Dosiq AI collects only the necessary information to provide our medical parsing and dashboard services. This includes uploaded PDFs, images, and user profile data. We strictly process this data through isolated LLM environments and do not use your personal medical data to train public AI models.</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-8">2. Bank-Grade Encryption</h3>
      <p>All data at rest is encrypted using AES-256 standards. Data in transit is secured via TLS 1.3. We utilize Supabase's advanced Row-Level Security (RLS) to ensure that only authenticated users can access their specific rows of data.</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-8">3. No Data Selling</h3>
      <p>We operate on a strict privacy-first model. Your health data is your private property. We will never sell, rent, or distribute your personal health information or analytics to third-party data brokers or pharmaceutical companies.</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-8">4. Terms of Service</h3>
      <p>By using Dosiq AI, you acknowledge that our AI-extracted data is for informational purposes only. It does not replace professional medical advice. Always review the extracted numbers against your original physical documents.</p>
    </div>
  </PageWrapper>
);

const ContactView = () => (
  <PageWrapper title="Contact Support" subtitle="We're here to help you navigate your health data.">
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0"><Mail className="w-5 h-5" /></div>
          <div><h4 className="text-lg font-bold text-slate-900 m-0">Email Support</h4><p className="text-slate-500 mt-1">support@dosiq.ai</p></div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0"><MapPin className="w-5 h-5" /></div>
          <div><h4 className="text-lg font-bold text-slate-900 m-0">Headquarters</h4><p className="text-slate-500 mt-1">Bangalore, India</p></div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200/60">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Name</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Email</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Message</label>
            <textarea rows="4" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-medium text-slate-800 resize-none" placeholder="How can we help?"></textarea>
          </div>
          <button className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors">Send Message</button>
        </form>
      </div>
    </div>
  </PageWrapper>
);
