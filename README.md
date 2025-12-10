# Appli-engin-de-levage
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Info, Truck, Anchor, Activity, 
  Wind, ShieldAlert, FileText, ChevronDown, ChevronUp, Move, 
  Ruler, Weight, Calculator, Search, Upload, FilePlus, ArrowLeft,
  Building, Plus, Save, Trash2, Edit3, Pencil
} from 'lucide-react';

// --- COULEURS CHARTE ---
const BRAND_BLUE = "#004e98"; // Bleu construction standard
const BRAND_RED = "#d92e2e";  // Rouge du logo
const BRAND_BG = "#ffffff";

// --- UTILITAIRES GÉOMÉTRIQUES & LOGIQUES ---

const isPointInPolygon = (x, y, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// ==================================================================================
// === BASE DE DONNÉES DES ENGINS ===
// ==================================================================================

const INITIAL_MACHINES = [
  {
    id: 1,
    category: "telehandler", // Engin télescopique
    name: "Manitou MLT 625-75H",
    type: "telehandler", 
    mode: "zone",
    maxLoad: 2500,
    maxReach: 3.30, 
    maxHeight: 5.90,
    zones: [
      { id: '2500kg', load: 2500, color: 'rgba(22, 163, 74, 0.9)', points: [[0,0], [1.1,0], [1.1,1.5], [0.9,3.0], [0.5,4.5], [0,5.5]] },
      { id: '2000kg', load: 2000, color: 'rgba(34, 197, 94, 0.7)', points: [[1.1,0], [1.7,0], [1.7,1.2], [1.5,3.0], [1.2,5.5], [0.6,5.9], [0,5.9], [0,4.5], [0.5,4.5], [0.9,3.0], [1.1,1.5]] },
      { id: '1500kg', load: 1500, color: 'rgba(234, 179, 8, 0.7)', points: [[1.7,0], [2.2,0], [2.2,0.8], [1.9,2.5], [1.5,3.0], [1.2,5.5], [1.5,3.0], [1.7,1.2]] },
      { id: '1000kg', load: 1000, color: 'rgba(249, 115, 22, 0.6)', points: [[2.2,0], [2.85,0], [2.85,0.5], [2.3,2.0], [1.9,2.5], [2.2,0.8]] },
      { id: '800kg', load: 800, color: 'rgba(239, 68, 68, 0.6)', points: [[2.85,0], [3.15,0], [3.3,0.5], [3.15,2], [3.10,2.5], [2.85,3.25]] }
    ]
  },
  {
    id: 2,
    category: "mobile_crane", // Grue télescopique
    name: "Liebherr LTM 1050-3.1 (9T)",
    type: "crane",
    mode: "multi_chart",
    maxLoad: 50000,
    maxReach: 34,
    maxHeight: 40,
    hasTelescoping: true, 
    boomLengths: [11.4, 16.7, 22, 27.3, 32.6, 35.8, 38],
    charts: {
      "11.4": { std: [{d:3, l:50}, {d:4, l:41.3}, {d:5, l:24.1}, {d:6, l:29}, {d:7, l:24.5}, {d:8, l:16.8}], tele: [{d:3, l:42}, {d:4, l:36.5}, {d:5, l:30.6}, {d:6, l:25.5}, {d:7, l:21.5}, {d:8, l:16.8}] },
      "16.7": { std: [{d:3, l:24.7}, {d:4, l:26.5}, {d:5, l:27.8}, {d:6, l:26}, {d:7, l:21.8}, {d:8, l:18.5}, {d:9, l:15.5}, {d:10, l:13.1}, {d:11, l:11.4}, {d:12, l:10}], tele: [{d:3, l:20.2}, {d:4, l:20.2}, {d:5, l:20.2}, {d:6, l:20.2}, {d:7, l:20.2}, {d:8, l:18.5}, {d:9, l:15.5}, {d:10, l:13.1}, {d:11, l:11.4}, {d:12, l:10}] },
      "22": { std: [{d:3, l:24.6}, {d:4, l:25.1}, {d:5, l:24.2}, {d:6, l:22.7}, {d:7, l:21}, {d:8, l:18.6}, {d:9, l:15.6}, {d:10, l:13.4}, {d:11, l:11.5}, {d:12, l:10.1}, {d:14, l:7.8}, {d:16, l:6.3}, {d:18, l:5.2}], tele: [{d:3, l:19.1}, {d:4, l:18.9}, {d:5, l:18.8}, {d:6, l:18.7}, {d:7, l:18.6}, {d:8, l:18.2}, {d:9, l:15.6}, {d:10, l:13.4}, {d:11, l:11.5}, {d:12, l:10.1}, {d:14, l:7.8}, {d:16, l:6.3}, {d:18, l:5.2}] },
      "27.3": { std: [{d:3, l:17}, {d:4, l:16.6}, {d:5, l:16}, {d:6, l:15.3}, {d:7, l:14.4}, {d:8, l:13.4}, {d:9, l:12.5}, {d:10, l:11.6}, {d:11, l:10.8}, {d:12, l:10.1}, {d:14, l:7.8}, {d:16, l:6.4}, {d:18, l:5.3}, {d:20, l:4.3}, {d:22, l:3.6}, {d:24, l:3}], tele: [{d:3, l:15.8}, {d:4, l:15.5}, {d:5, l:15.2}, {d:6, l:15}, {d:7, l:14.4}, {d:8, l:13.4}, {d:9, l:12.5}, {d:10, l:11.6}, {d:11, l:10.8}, {d:12, l:10.1}, {d:14, l:7.8}, {d:16, l:6.4}, {d:18, l:5.3}, {d:20, l:4.3}, {d:22, l:3.6}, {d:24, l:3}] },
      "32.6": { std: [{d:4, l:11.5}, {d:5, l:11.3}, {d:6, l:11}, {d:7, l:10.7}, {d:8, l:10.2}, {d:9, l:9.7}, {d:10, l:9.2}, {d:11, l:8.6}, {d:12, l:8}, {d:14, l:7.1}, {d:16, l:6.4}, {d:18, l:5.4}, {d:20, l:4.4}, {d:22, l:3.7}, {d:24, l:3.1}, {d:26, l:2.7}, {d:28, l:2.2}], tele: [{d:4, l:10.7}, {d:5, l:10.3}, {d:6, l:10}, {d:7, l:9.7}, {d:8, l:9.4}, {d:9, l:9.2}, {d:10, l:8.8}, {d:11, l:8.1}, {d:12, l:7.9}, {d:14, l:7.1}, {d:16, l:6.4}, {d:18, l:5.4}, {d:20, l:4.4}, {d:22, l:3.7}, {d:24, l:3.1}, {d:26, l:2.7}, {d:28, l:2.2}] },
      "35.8": { std: [{d:5, l:9.5}, {d:6, l:9.4}, {d:7, l:9.2}, {d:8, l:8.9}, {d:9, l:8.5}, {d:10, l:8.1}, {d:11, l:7.7}, {d:12, l:7.3}, {d:14, l:6.7}, {d:16, l:6.1}, {d:18, l:5.4}, {d:20, l:4.3}, {d:22, l:3.7}, {d:24, l:3.1}, {d:26, l:2.7}, {d:28, l:2.3}, {d:30, l:1.9}, {d:32, l:1.6}], tele: [{d:5, l:6.9}, {d:6, l:6.6}, {d:7, l:6.3}, {d:8, l:6.1}, {d:9, l:5.8}, {d:10, l:5.6}, {d:11, l:5.4}, {d:12, l:5.2}, {d:14, l:4.9}, {d:16, l:4.6}, {d:18, l:4}, {d:20, l:3.7}, {d:22, l:3.2}, {d:24, l:2.4}, {d:26, l:1.8}, {d:28, l:1.4}, {d:30, l:1}] },
      "38": { std: [{d:6, l:7.5}, {d:7, l:7.2}, {d:8, l:7}, {d:9, l:6.7}, {d:10, l:6.5}, {d:11, l:6.2}, {d:12, l:6}, {d:14, l:5.6}, {d:16, l:5.2}, {d:18, l:4.8}, {d:20, l:4.3}, {d:22, l:3.7}, {d:24, l:3.2}, {d:26, l:2.7}, {d:28, l:2.3}, {d:30, l:1.9}, {d:32, l:1.6}, {d:34, l:1.4}], tele: [{d:6, l:3.7}, {d:7, l:3.5}, {d:8, l:3.3}, {d:9, l:3.2}, {d:10, l:3}, {d:11, l:2.8}, {d:12, l:2.7}, {d:14, l:2.5}, {d:16, l:2.3}, {d:18, l:1.7}, {d:20, l:1.3}, {d:22, l:0.9}] }
    }
  },
  {
    id: 3,
    category: "crawler_crane", // Grue treillis
    name: "Liebherr LG 1750 (Treillis) - 250t",
    type: "crane",
    mode: "multi_chart",
    maxLoad: 596000, 
    maxReach: 80,
    maxHeight: 100,
    hasTelescoping: false,
    hasCounterweight: true,
    boomLengths: [21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91],
    charts: {
      "21": { std: [{d:6, l:596}, {d:6.5, l:571}, {d:7, l:547}, {d:8, l:506}, {d:9, l:475}, {d:10, l:443}, {d:11, l:416}, {d:12, l:383}, {d:14, l:328}, {d:16, l:283}, {d:18, l:240}, {d:20, l:186}] },
      "28": { std: [{d:6.5, l:573}, {d:7, l:550}, {d:8, l:508}, {d:9, l:472}, {d:10, l:440}, {d:11, l:412}, {d:12, l:381}, {d:14, l:326}, {d:16, l:281}, {d:18, l:246}, {d:20, l:218}, {d:22, l:196}, {d:24, l:171}, {d:26, l:144}] },
      "35": { std: [{d:7, l:546}, {d:8, l:504}, {d:9, l:468}, {d:10, l:436}, {d:11, l:409}, {d:12, l:378}, {d:14, l:323}, {d:16, l:279}, {d:18, l:244}, {d:20, l:216}, {d:22, l:193}, {d:24, l:175}, {d:26, l:159}, {d:28, l:144}, {d:30, l:126}, {d:32, l:110}] },
      "42": { std: [{d:8, l:501}, {d:9, l:465}, {d:10, l:433}, {d:11, l:406}, {d:12, l:376}, {d:14, l:321}, {d:16, l:277}, {d:18, l:242}, {d:20, l:214}, {d:22, l:191}, {d:24, l:173}, {d:26, l:157}, {d:28, l:144}, {d:30, l:132}, {d:32, l:121}, {d:34, l:109}, {d:36, l:97}, {d:38, l:86}, {d:40, l:74}] },
      "49": { std: [{d:8, l:497}, {d:9, l:461}, {d:10, l:430}, {d:11, l:402}, {d:12, l:373}, {d:14, l:318}, {d:16, l:274}, {d:18, l:239}, {d:20, l:211}, {d:22, l:189}, {d:24, l:170}, {d:26, l:154}, {d:28, l:141}, {d:30, l:129}, {d:32, l:119}, {d:34, l:111}, {d:36, l:101}, {d:38, l:92}, {d:40, l:83}, {d:44, l:66}] },
      "56": { std: [{d:9, l:458}, {d:10, l:427}, {d:11, l:399}, {d:12, l:371}, {d:14, l:316}, {d:16, l:272}, {d:18, l:237}, {d:20, l:209}, {d:22, l:187}, {d:24, l:168}, {d:26, l:152}, {d:28, l:139}, {d:30, l:127}, {d:32, l:117}, {d:34, l:108}, {d:36, l:101}, {d:38, l:93}, {d:40, l:85}, {d:44, l:71}, {d:48, l:58}, {d:52, l:45.5}] },
      "63": { std: [{d:10, l:424}, {d:11, l:397}, {d:12, l:369}, {d:14, l:314}, {d:16, l:271}, {d:18, l:235}, {d:20, l:208}, {d:22, l:185}, {d:24, l:166}, {d:26, l:150}, {d:28, l:137}, {d:30, l:125}, {d:32, l:115}, {d:34, l:107}, {d:36, l:99}, {d:38, l:91}, {d:40, l:84}, {d:44, l:71}, {d:48, l:60}, {d:52, l:49}, {d:56, l:39.5}, {d:60, l:32.5}, {d:64, l:25}] },
      "70": { std: [{d:10, l:411}, {d:11, l:394}, {d:12, l:368}, {d:14, l:313}, {d:16, l:269}, {d:18, l:234}, {d:20, l:206}, {d:22, l:183}, {d:24, l:165}, {d:26, l:149}, {d:28, l:135}, {d:30, l:124}, {d:32, l:114}, {d:34, l:105}, {d:36, l:97}, {d:38, l:90}, {d:40, l:83}, {d:44, l:70}, {d:48, l:59}, {d:52, l:49.5}, {d:56, l:41}, {d:60, l:33.5}, {d:64, l:26.5}, {d:68, l:20}, {d:72, l:13.5}] },
      "77": { std: [{d:11, l:347}, {d:12, l:343}, {d:14, l:308}, {d:16, l:268}, {d:18, l:233}, {d:20, l:205}, {d:22, l:182}, {d:24, l:163}, {d:26, l:148}, {d:28, l:134}, {d:30, l:122}, {d:32, l:112}, {d:34, l:103}, {d:36, l:96}, {d:38, l:88}, {d:40, l:82}, {d:44, l:68}, {d:48, l:58}, {d:52, l:49}, {d:56, l:41}, {d:60, l:33.5}, {d:64, l:27.1}, {d:68, l:21.3}, {d:72, l:15.8}, {d:76, l:10.6}] },
      "84": { std: [{d:11, l:295}, {d:12, l:291}, {d:14, l:284}, {d:16, l:260}, {d:18, l:230}, {d:20, l:204}, {d:22, l:181}, {d:24, l:162}, {d:26, l:146}, {d:28, l:133}, {d:30, l:121}, {d:32, l:111}, {d:34, l:102}, {d:36, l:94}, {d:38, l:87}, {d:40, l:80}, {d:44, l:67}, {d:48, l:56}, {d:52, l:47}, {d:56, l:40}, {d:60, l:31.5}, {d:64, l:26.3}, {d:68, l:21.2}, {d:72, l:16.4}, {d:76, l:11.9}, {d:80, l:7.6}] },
      "91": { std: [{d:12, l:250}, {d:14, l:244}, {d:16, l:237}, {d:18, l:221}, {d:20, l:198}, {d:22, l:178}, {d:24, l:160}, {d:26, l:145}, {d:28, l:131}, {d:30, l:120}, {d:32, l:109}, {d:34, l:100}, {d:36, l:90}, {d:38, l:83}, {d:40, l:77}, {d:44, l:65}, {d:48, l:55}, {d:52, l:45}, {d:56, l:37.5}, {d:60, l:31.5}, {d:64, l:26.3}, {d:68, l:21.2}, {d:72, l:16.4}, {d:76, l:11.9}, {d:80, l:7.6}] }
    }
  }
];

// --- SOUS-COMPOSANTS ---

const CMCLogo = () => (
  <svg width="220" height="50" viewBox="0 0 220 50" className="cursor-pointer">
    <g transform="translate(5, 5)">
      <path d="M 10 0 L 30 0 L 40 10 L 40 18 L 0 18 L 0 10 Z" fill={BRAND_BLUE} />
      <path d="M 0 22 L 40 22 L 40 30 L 30 40 L 10 40 L 0 30 Z" fill={BRAND_RED} />
    </g>
    <g transform="translate(55, 0)">
      <text x="0" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill={BRAND_BLUE} letterSpacing="0.5">CHANTIERS</text>
      <text x="0" y="36" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill={BRAND_BLUE} letterSpacing="0.5">MODERNES</text>
      <text x="0" y="48" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10" fill={BRAND_BLUE} letterSpacing="1">CONSTRUCTION</text>
    </g>
  </svg>
);

const Header = ({ goHome }) => (
  <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div onClick={goHome}><CMCLogo /></div>
      <div className="hidden md:block text-xs text-slate-400">Application Levage V5.5</div>
    </div>
  </header>
);

// 1. PAGE D'ACCUEIL
const HomePage = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white p-6 animate-in fade-in duration-700">
    <div className="max-w-4xl w-full text-center space-y-12">
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
        Bienvenue sur le portail <br/>
        <div className="mt-6"><span className="text-[#004e98]">Levage Sécurisé</span></div>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <button onClick={() => navigate('determine')} className="group relative h-64 rounded-2xl bg-[#004e98] text-white p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors"><Calculator size={48} /></div>
          <span className="text-2xl font-bold">Déterminer</span><span className="text-lg font-light opacity-90">le bon engin de levage</span>
        </button>
        <button onClick={() => navigate('verify')} className="group relative h-64 rounded-2xl bg-[#004e98] text-white p-8 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors"><CheckCircle size={48} /></div>
          <span className="text-2xl font-bold">Vérifier</span><span className="text-lg font-light opacity-90">mon engin de levage</span>
        </button>
      </div>
    </div>
  </div>
);

// 2. PAGE DÉTERMINER (Identique V5.2)
const DeterminePage = () => {
  const [mass, setMass] = useState(0);
  const [unit, setUnit] = useState('kg');
  const [distance, setDistance] = useState(0);
  const [surface, setSurface] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (mass > 0 && distance > 0) {
      setIsCalculating(true); setProgress(0); setResult(null);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval); setIsCalculating(false);
            const massInTons = unit === 'kg' ? mass / 1000 : mass;
            const moment = massInTons * distance;
            setResult({ tons: massInTons, moment: moment.toFixed(1) });
            return 100;
          }
          return p + 5;
        });
      }, 50);
      return () => clearInterval(interval);
    } else { setResult(null); setProgress(0); }
  }, [mass, unit, distance]);

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[60vh]">
      <div className="space-y-8 animate-in slide-in-from-left duration-500">
        <h2 className="text-2xl font-bold text-[#004e98] border-b pb-4 mb-6">Paramètres de la mission</h2>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-lg font-semibold text-slate-700 mb-3">Masse de la charge à soulever</label>
          <div className="flex gap-4">
            <input type="number" value={mass || ''} onChange={(e) => setMass(parseFloat(e.target.value))} className="flex-1 p-4 text-xl border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004e98] outline-none" placeholder="0"/>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-24 p-4 text-xl font-bold bg-white border border-slate-300 rounded-lg text-[#004e98]"><option value="kg">kg</option><option value="t">t</option></select>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-lg font-semibold text-slate-700 mb-3">Distance de prise en charge / pose (m)</label>
          <input type="number" value={distance || ''} onChange={(e) => setDistance(parseFloat(e.target.value))} className="w-full p-4 text-xl border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004e98] outline-none" placeholder="0"/>
        </div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-lg font-semibold text-slate-700 mb-3">Surface disponible pour l'engin (m²)</label>
          <input type="number" value={surface || ''} onChange={(e) => setSurface(parseFloat(e.target.value))} className="w-full p-4 text-xl border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004e98] outline-none" placeholder="0"/>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-2xl border border-slate-100 min-h-[400px]">
        {!result ? (
          <div className="relative w-64 h-64">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-slate-100"/>
              <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="15" fill="transparent" strokeDasharray={2 * Math.PI * 120} strokeDashoffset={2 * Math.PI * 120 - (progress / 100) * 2 * Math.PI * 120} className="text-[#004e98] transition-all duration-300 ease-out" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold text-[#004e98]">{progress}%</span><span className="text-sm text-slate-400 mt-2 uppercase tracking-widest">Analyse</span></div>
          </div>
        ) : (
          <div className="text-center animate-in zoom-in duration-500">
             <div className="w-64 h-64 rounded-full bg-[#004e98] text-white flex flex-col items-center justify-center shadow-lg mb-6 mx-auto">
                <span className="text-xl font-light opacity-80 mb-2">Besoin de Levage</span><span className="text-6xl font-bold">{result.tons} <span className="text-2xl">t</span></span><span className="text-lg mt-2">à {distance} mètres</span>
             </div>
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 inline-block"><div className="text-sm text-slate-500 uppercase tracking-wide">Moment de charge</div><div className="text-2xl font-bold text-slate-800">{result.moment} t.m</div></div>
             <p className="mt-6 text-slate-500 max-w-sm mx-auto">Ce calcul de pré-dimensionnement vous permet de filtrer les engins dans l'étape suivante.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. NOUVEAU COMPOSANT : MACHINE CREATOR (Formulaire Manuel)
const MachineCreator = ({ category, onSave, onCancel, initialData }) => {
    const isTonnes = category === 'mobile_crane' || category === 'crawler_crane';
    const [name, setName] = useState('');
    const [maxReach, setMaxReach] = useState(40);
    const [maxHeight, setMaxHeight] = useState(50);
    // Initialiser maxLoad selon l'unité (50t ou 2500kg par défaut)
    const [maxLoad, setMaxLoad] = useState(isTonnes ? 50 : 2500);
    
    const [booms, setBooms] = useState([{ id: 1, len: 10, dataStr: "" }]);

    // Initialisation en cas d'édition
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setMaxReach(initialData.maxReach);
            setMaxHeight(initialData.maxHeight);
            // Conversion Kg -> Tonnes si nécessaire pour l'affichage
            setMaxLoad(isTonnes ? initialData.maxLoad / 1000 : initialData.maxLoad);
            
            if (initialData.charts && initialData.boomLengths) {
                const loadedBooms = initialData.boomLengths.map((len, idx) => {
                    const data = initialData.charts[len]?.std || [];
                    const dataStr = data.map(p => `${p.d} ; ${p.l}`).join('\n');
                    return { id: idx, len, dataStr };
                });
                setBooms(loadedBooms);
            }
        }
    }, [initialData, isTonnes]);

    const addBoom = () => {
        setBooms([...booms, { id: Date.now(), len: (booms[booms.length-1]?.len || 0) + 10, dataStr: "" }]);
    };

    const updateBoom = (id, field, value) => {
        setBooms(booms.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBoom = (id) => {
        if(booms.length > 1) setBooms(booms.filter(b => b.id !== id));
    };

    const handleSave = () => {
        const charts = {};
        const boomLengths = [];

        booms.forEach(b => {
            const points = [];
            const lines = b.dataStr.split('\n');
            lines.forEach(line => {
                const parts = line.split(/[;:\t,]/);
                if(parts.length >= 2) {
                    const d = parseFloat(parts[0].trim());
                    const l = parseFloat(parts[1].trim());
                    if(!isNaN(d) && !isNaN(l)) {
                        points.push({d, l});
                    }
                }
            });
            if(points.length > 0) {
                points.sort((a,b) => a.d - b.d);
                charts[b.len] = { std: points };
                boomLengths.push(parseFloat(b.len));
            }
        });

        if(boomLengths.length === 0) {
            alert("Ajoutez au moins une longueur de flèche avec des données valides (ex: 5; 20).");
            return;
        }

        // Reconversion Tonnes -> Kg pour le stockage si nécessaire
        const finalMaxLoad = isTonnes ? maxLoad * 1000 : maxLoad;

        const newMachine = {
            id: initialData ? initialData.id : Date.now(),
            category,
            name: name || "Nouvelle Grue",
            type: "crane",
            mode: "multi_chart",
            maxLoad: finalMaxLoad,
            maxReach,
            maxHeight,
            hasTelescoping: false,
            boomLengths: boomLengths.sort((a,b) => a - b),
            charts
        };
        onSave(newMachine);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-[#004e98] animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-[#004e98] mb-4 flex items-center gap-2">
                <Edit3 /> {initialData ? "Modifier l'engin" : "Créateur d'Engin"}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Nom de l'engin</label>
                    <input className="w-full border p-2 rounded" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Liebherr LTM 1030" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Charge Max ({isTonnes ? 't' : 'kg'})</label>
                    <input 
                        className="w-full border p-2 rounded" 
                        type="number" 
                        value={isNaN(maxLoad) ? '' : maxLoad} 
                        onChange={e=>setMaxLoad(parseFloat(e.target.value))} 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Portée Max (m)</label>
                    <input className="w-full border p-2 rounded" type="number" value={isNaN(maxReach) ? '' : maxReach} onChange={e=>setMaxReach(parseFloat(e.target.value))} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Hauteur Max (m)</label>
                    <input className="w-full border p-2 rounded" type="number" value={isNaN(maxHeight) ? '' : maxHeight} onChange={e=>setMaxHeight(parseFloat(e.target.value))} />
                </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
                <label className="text-sm font-bold text-slate-700 mb-2 block">Abaques par longueur de flèche</label>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {booms.map((b, idx) => (
                        <div key={b.id} className="bg-slate-50 p-3 rounded border border-slate-200">
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-slate-200 px-2 py-1 rounded">#{idx+1}</span>
                                    <input 
                                        type="number" 
                                        className="w-20 p-1 border rounded text-center font-bold" 
                                        value={b.len} 
                                        onChange={(e) => updateBoom(b.id, 'len', e.target.value)}
                                    />
                                    <span className="text-sm text-slate-600">mètres</span>
                                </div>
                                <button onClick={() => removeBoom(b.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                            </div>
                            <textarea 
                                className="w-full text-xs font-mono p-2 border rounded h-24"
                                placeholder={`Format: Distance ; Charge (${isTonnes ? 'tonnes' : 'kg'})\nExemple:\n3 ; ${isTonnes ? '50' : '2500'}\n4 ; ${isTonnes ? '42' : '2000'}`}
                                value={b.dataStr}
                                onChange={(e) => updateBoom(b.id, 'dataStr', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                <button onClick={addBoom} className="mt-2 text-sm text-[#004e98] font-bold flex items-center gap-1 hover:underline">
                    <Plus size={16}/> Ajouter une longueur de flèche
                </button>
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t border-slate-200">
                <button onClick={onCancel} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded">Annuler</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-[#004e98] text-white font-bold rounded hover:bg-blue-800 flex justify-center items-center gap-2">
                    <Save size={18}/> {initialData ? "Mettre à jour" : "Enregistrer"}
                </button>
            </div>
        </div>
    );
};

// 4. PAGE VÉRIFIER
const VerifyPage = () => {
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [category, setCategory] = useState('telehandler');
  const [showCreator, setShowCreator] = useState(false); // Mode Créateur
  const [machineToEdit, setMachineToEdit] = useState(null); // Machine en cours d'édition
  
  // États de sélection et calcul (hérités de V4.3)
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [inputLoad, setInputLoad] = useState(1000); 
  const [inputDist, setInputDist] = useState(5);    
  const [inputHeight, setInputHeight] = useState(2);
  const [selectedBoomLen, setSelectedBoomLen] = useState(0);
  const [factors, setFactors] = useState({ wind: false, stabilizers: true, dynamic: false, telescoping: false, counterweight: 250 });

  const filteredMachines = useMemo(() => machines.filter(m => m.category === category), [machines, category]);

  useEffect(() => {
    if (filteredMachines.length > 0) { setSelectedMachineId(filteredMachines[0].id); } 
    else { setSelectedMachineId(null); }
  }, [category, filteredMachines]);

  const machine = useMemo(() => machines.find(m => m.id === parseInt(selectedMachineId)) || filteredMachines[0], [selectedMachineId, machines, filteredMachines]);

  useEffect(() => {
    if (machine?.mode === 'multi_chart' && machine?.boomLengths) { setSelectedBoomLen(machine.boomLengths[0]); }
    if (machine?.hasCounterweight) { setFactors(f => ({...f, counterweight: 250})); }
  }, [machine]);

  const safetyFactor = useMemo(() => {
    let factor = 1.0;
    if (factors.wind) factor -= 0.15;      
    if (!factors.stabilizers) factor -= 0.40; 
    if (factors.dynamic) factor -= 0.20;   
    return Math.max(0.1, factor); 
  }, [factors]);

  const calculateLimit = () => {
    if (!machine) return 0;
    if (machine.mode === 'multi_chart') {
      const effectiveBoomLen = selectedBoomLen; 
      const requiredReach = Math.sqrt(Math.pow(inputDist, 2) + Math.pow(inputHeight, 2));
      if (requiredReach > (effectiveBoomLen - 1)) return 0; 

      const chartType = (factors.telescoping && machine.hasTelescoping) ? 'tele' : 'std';
      const points = machine.charts[selectedBoomLen]?.[chartType];

      if (!points || points.length === 0) return 0;
      if (inputDist > points[points.length - 1].d) return 0; 
      if (inputDist < points[0].d) return machine.maxLoad; 

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        if (inputDist >= p1.d && inputDist <= p2.d) {
             const slope = (p2.l - p1.l) / (p2.d - p1.d);
             const interpolated = p1.l + slope * (inputDist - p1.d);
             return Math.floor(interpolated * 1000); 
        }
      }
      return 0;
    }
    else if (machine.mode === 'zone') {
      let foundLoad = 0;
      if (machine.zones) {
          for (let zone of machine.zones) {
            if (isPointInPolygon(inputDist, inputHeight, zone.points)) {
              if (zone.load > foundLoad) foundLoad = zone.load;
            }
          }
      }
      return foundLoad;
    } 
    return 0;
  };

  const allowedLoad = calculateLimit();
  const safeLoad = Math.floor(allowedLoad * safetyFactor);
  const isSafe = inputLoad <= safeLoad && safeLoad > 0;
  const usagePercent = safeLoad > 0 ? (inputLoad / safeLoad) * 100 : (inputLoad > 0 ? 110 : 0);
  const dynamicMassSliderMax = allowedLoad > 0 ? Math.ceil(allowedLoad * 1.10) : machine?.maxLoad;
  const finalMassSliderMax = Math.max(dynamicMassSliderMax, inputLoad);

  // --- RENDU GRAPHIQUE ---
  const GraphChart2D = () => {
    // Si on est en mode créateur, on montre un graphique vide ou de preview
    if(showCreator) return <div className="h-[400px] flex items-center justify-center text-slate-400 bg-slate-50 border-2 border-dashed rounded">L'aperçu sera disponible après sauvegarde</div>;
    
    if(!machine) return null;
    const width = 500;
    const height = 400;
    const padding = 40;
    const maxX = machine.maxReach + (machine.category === 'telehandler' ? 1 : 5); 
    const maxY = machine.maxHeight + (machine.category === 'telehandler' ? 1 : 5);
    const scaleX = (d) => padding + (d / maxX) * (width - 2 * padding);
    const scaleY = (h) => height - padding - (h / maxY) * (height - 2 * padding);
    const userX = scaleX(inputDist);
    const userY = scaleY(inputHeight);
    const gridStep = machine.category === 'telehandler' ? 1 : (maxX > 60 ? 10 : 5);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-[#fff9c4] border-2 border-slate-800 rounded shadow-lg">
         {Array.from({ length: Math.ceil(maxX / gridStep) }).map((_, i) => {
             const val = i * gridStep;
             const x = scaleX(val);
             return (<g key={`v${i}`}><line x1={x} y1={padding} x2={x} y2={height-padding} stroke="white" strokeWidth="1.5" /><text x={x} y={height - padding + 15} fontSize="10" textAnchor="middle" fill="#666">{val}</text></g>);
         })}
         {Array.from({ length: Math.ceil(maxY / gridStep) }).map((_, i) => {
             const val = i * gridStep;
             const y = scaleY(val);
             return (<g key={`h${i}`}><line x1={padding} y1={y} x2={width-padding} y2={y} stroke="white" strokeWidth="1.5" /><text x={padding - 10} y={y + 3} fontSize="10" textAnchor="end" fill="#666">{val}</text></g>);
         })}
         {machine.mode === 'zone' && machine.zones.map(z => (
             <path key={z.id} d={`M ${scaleX(z.points[0][0])} ${scaleY(z.points[0][1])}` + z.points.slice(1).map(p => ` L ${scaleX(p[0])} ${scaleY(p[1])}`).join("") + " Z"} fill={z.color} stroke="#333" />
         ))}
         {machine.mode === 'multi_chart' && machine.boomLengths.map(len => (
             <path key={len} d={`M ${scaleX(0)} ${scaleY(len)} A ${scaleX(len)-scaleX(0)} ${scaleX(len)-scaleX(0)} 0 0 1 ${scaleX(len)} ${scaleY(0)}`} fill="none" stroke={len===selectedBoomLen ? "black" : "#ccc"} strokeWidth={len===selectedBoomLen ? "2" : "1"} />
         ))}
         <line x1={scaleX(0)} y1={scaleY(0)} x2={userX} y2={userY} stroke="#dc2626" strokeWidth="2" strokeDasharray="5" />
         <circle cx={userX} cy={userY} r="6" fill="#dc2626" stroke="white" strokeWidth="2" />
         <text x={width/2} y={height-5} textAnchor="middle" fontSize="12" fontWeight="bold">Portée (m)</text>
         <text x={10} y={height/2} textAnchor="middle" transform={`rotate(-90, 10, ${height/2})`} fontSize="12" fontWeight="bold">Hauteur (m)</text>
      </svg>
    );
  };

  const handleCreateOrUpdateMachine = (newMachine) => {
      // Si l'ID existe déjà, on met à jour
      if (machines.find(m => m.id === newMachine.id)) {
          setMachines(machines.map(m => m.id === newMachine.id ? newMachine : m));
      } else {
          // Sinon création
          setMachines([...machines, newMachine]);
      }
      setSelectedMachineId(newMachine.id);
      setShowCreator(false);
      setMachineToEdit(null);
  };

  const handleEditClick = () => {
      setMachineToEdit(machine);
      setShowCreator(true);
  };

  const handleCancelCreator = () => {
      setShowCreator(false);
      setMachineToEdit(null);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-center gap-4 bg-slate-100 p-2 rounded-xl">
            {[{id: 'telehandler', label: 'Engin Télescopique', icon: Truck},{id: 'mobile_crane', label: 'Grue Télescopique', icon: Move},{id: 'crawler_crane', label: 'Grue Treillis', icon: Anchor}].map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${category === cat.id ? 'bg-[#004e98] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-200'}`}>
                    <cat.icon size={20} /> {cat.label}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-[#004e98]">
                    <h3 className="font-bold text-[#004e98] mb-3">Sélection de la machine</h3>
                    <div className="flex gap-2 mb-4">
                        <select value={selectedMachineId || ''} onChange={(e) => setSelectedMachineId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 font-medium" disabled={showCreator}>
                            {filteredMachines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        {/* BOUTON ÉDITION */}
                        {!showCreator && selectedMachineId && (
                            <button onClick={handleEditClick} className="p-3 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-100" title="Modifier cet engin">
                                <Pencil size={20}/>
                            </button>
                        )}
                    </div>
                    
                    {!showCreator && (
                        <button onClick={() => { setMachineToEdit(null); setShowCreator(true); }} className="w-full py-3 border-2 border-dashed border-[#004e98] text-[#004e98] font-bold rounded-lg hover:bg-blue-50 transition-colors flex justify-center items-center gap-2">
                            <Plus size={20}/> Créer un engin manuellement
                        </button>
                    )}
                </div>

                {!showCreator && (
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-in slide-in-from-left duration-300">
                        <h3 className="font-bold text-slate-700">Paramètres de levage</h3>
                        {machine && machine.mode === 'multi_chart' && (
                            <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                <label className="text-xs font-bold uppercase mb-2 block text-slate-500">Longueur Flèche</label>
                                <div className="flex flex-wrap gap-1">
                                    {machine.boomLengths.map(len => (
                                        <button key={len} onClick={() => setSelectedBoomLen(len)} className={`px-2 py-1 text-xs rounded border ${selectedBoomLen === len ? 'bg-slate-800 text-white' : 'bg-white'}`}>{len}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div><div className="flex justify-between text-sm"><label>Masse (t)</label> <span className="font-bold text-[#004e98]">{inputLoad/1000} t</span></div><input type="range" min="0" max={finalMassSliderMax} step="50" value={inputLoad} onChange={(e) => setInputLoad(parseInt(e.target.value))} className="w-full accent-[#004e98] h-2 bg-slate-200 rounded cursor-pointer" /><div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>0t</span><span>Max échelle : {Math.round(finalMassSliderMax/1000)}t</span></div></div>
                            <div><div className="flex justify-between text-sm"><label>Portée (m)</label> <span className="font-bold text-[#004e98]">{inputDist} m</span></div><input type="range" min="0" max={machine?.maxReach + 2} step="0.5" value={inputDist} onChange={(e) => setInputDist(parseFloat(e.target.value))} className="w-full accent-[#004e98] h-2 bg-slate-200 rounded cursor-pointer" /></div>
                            <div><div className="flex justify-between text-sm"><label>Hauteur Crochet (m)</label> <span className="font-bold text-[#004e98]">{inputHeight} m</span></div><input type="range" min="0" max={machine?.maxHeight + 2} step="0.5" value={inputHeight} onChange={(e) => setInputHeight(parseFloat(e.target.value))} className="w-full accent-[#004e98] h-2 bg-slate-200 rounded cursor-pointer" /></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-7 space-y-4">
                {showCreator ? (
                    <MachineCreator 
                        key={category} // FORCE REMOUNT ON CATEGORY CHANGE
                        category={category}
                        onSave={handleCreateOrUpdateMachine}
                        onCancel={handleCancelCreator}
                        initialData={machineToEdit}
                    />
                ) : (
                    <>
                        <div className={`p-6 rounded-xl shadow-md border-l-8 ${isSafe ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} animate-in zoom-in duration-300`}>
                            <div className="flex justify-between items-start">
                                <div><h2 className={`text-2xl font-bold ${isSafe ? 'text-green-800' : 'text-red-800'}`}>{isSafe ? 'AUTORISÉ' : 'INTERDIT'}</h2><p className="text-sm text-slate-600">{isSafe ? 'Configuration conforme' : 'Capacité dépassée ou hors portée'}</p></div>
                                <div className="text-right"><div className="text-3xl font-bold text-slate-800">{safeLoad/1000} t</div><div className="text-xs text-slate-500">Max Autorisé à {inputDist}m</div></div>
                            </div>
                            <div className="mt-4"><div className="flex justify-between text-xs font-bold mb-1"><span>Utilisation {Math.round(usagePercent)}%</span></div><div className="h-3 bg-slate-200 rounded-full overflow-hidden"><div style={{width: `${Math.min(100, usagePercent)}%`}} className={`h-full transition-all duration-500 ${isSafe ? 'bg-green-500' : 'bg-red-500'}`}></div></div></div>
                        </div>
                        <div className="bg-white p-2 rounded-xl shadow border border-slate-200"><GraphChart2D /></div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default function LiftingApp() {
  const [page, setPage] = useState('home');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header goHome={() => setPage('home')} />
      <main className="p-4 md:p-8">
        {page === 'home' && <HomePage navigate={setPage} />}
        {page === 'determine' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><button onClick={() => setPage('home')} className="mb-4 flex items-center text-slate-500 hover:text-[#004e98] font-bold"><ArrowLeft size={20} className="mr-1"/> Retour Accueil</button><DeterminePage /></div>}
        {page === 'verify' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><button onClick={() => setPage('home')} className="mb-4 flex items-center text-slate-500 hover:text-[#004e98] font-bold"><ArrowLeft size={20} className="mr-1"/> Retour Accueil</button><VerifyPage /></div>}
      </main>
    </div>
  );
}
