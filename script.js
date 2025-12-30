const { useState, useMemo, useEffect, useRef } = React;
const { jsPDF } = window.jspdf;

// --- ICONS ---
const IconWrapper = ({ size = 24, className, children, ...props }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>{children}</svg> );
const Icons = {
    Calculator: (p) => <IconWrapper {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></IconWrapper>,
    CheckCircle: (p) => <IconWrapper {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></IconWrapper>,
    Truck: (p) => <IconWrapper {...p}><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></IconWrapper>,
    Anchor: (p) => <IconWrapper {...p}><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></IconWrapper>,
    Move: (p) => <IconWrapper {...p}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></IconWrapper>,
    Upload: (p) => <IconWrapper {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></IconWrapper>,
    Download: (p) => <IconWrapper {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></IconWrapper>,
    ArrowLeft: (p) => <IconWrapper {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></IconWrapper>,
    Trash2: (p) => <IconWrapper {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></IconWrapper>,
    Database: (p) => <IconWrapper {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></IconWrapper>,
    Save: (p) => <IconWrapper {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></IconWrapper>,
    FileJson: (p) => <IconWrapper {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></IconWrapper>,
    FileText: (p) => <IconWrapper {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></IconWrapper>,
    Info: (p) => <IconWrapper {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></IconWrapper>,
    Layers: (p) => <IconWrapper {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></IconWrapper>
};

const { Calculator, CheckCircle, Truck, Anchor, Move, Upload, Download, ArrowLeft, Trash2, Database, Save, FileJson, FileText, Info, Layers } = Icons;

// --- CONSTANTES ---
const DB_KEY = "cmc_levage_machines"; 
const SELECTED_CRANE_KEY = "selectedCrane"; 
const EXTERNAL_DB_URL = "engines.json";

// --- DONNÉES STATIQUES (Exemple fallback) ---
const HARDCODED_MACHINES = [
    {
        id: "fixed_1", source: "system", category: "telehandler", name: "Manitou MLT 625-75H", type: "telehandler", mode: "zone", maxLoad: 2500, maxReach: 3.30, maxHeight: 5.90,
        zones: [
            { id: '2500kg', load: 2500, color: 'rgba(22, 163, 74, 0.4)', borderColor: 'rgba(22, 163, 74, 1)', points: [[0,0], [1.1,0], [1.1,1.5], [0.9,3.0], [0.5,4.5], [0,5.5]] },
            { id: '2000kg', load: 2000, color: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 1)', points: [[1.1,0], [1.7,0], [1.7,1.2], [1.5,3.0], [1.2,5.5], [0.6,5.9], [0,5.9], [0,4.5], [0.5,4.5], [0.9,3.0], [1.1,1.5]] },
            { id: '1500kg', load: 1500, color: 'rgba(234, 179, 8, 0.3)', borderColor: 'rgba(234, 179, 8, 1)', points: [[1.7,0], [2.2,0], [2.2,0.8], [1.9,2.5], [1.5,3.0], [1.2,5.5], [1.5,3.0], [1.7,1.2]] },
            { id: '1000kg', load: 1000, color: 'rgba(249, 115, 22, 0.3)', borderColor: 'rgba(249, 115, 22, 1)', points: [[2.2,0], [2.85,0], [2.85,0.5], [2.3,2.0], [1.9,2.5], [2.2,0.8]] },
            { id: '800kg', load: 800, color: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 1)', points: [[2.85,0], [3.15,0], [3.3,0.5], [3.15,2], [3.10,2.5], [2.85,3.25]] }
        ]
    }
];

// --- UTILITAIRES ---
const isPointInPolygon = (x, y, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const calculateMachineCapacity = (machine, dist, height, specificBoom = null, specificCwt = null, specificTool = null) => {
    if (!machine) return 0;
    // Note: Pour les potences, la portée max peut être augmentée, mais on garde la limite machine pour l'instant
    if (dist > machine.maxReach + 2 || height > machine.maxHeight + 2) return 0; 

    // 1. GRUES MOBILES & TREILLIS (Abaques courbes)
    if (machine.mode === 'multi_chart') {
        const checkBoom = (boomLen, cwt) => {
            const reqReachSq = (dist * dist) + (height * height);
            if (reqReachSq > (boomLen * boomLen) + 0.1) return 0;
            
            let points;
            if (machine.hasCounterweights && cwt) { points = machine.charts[cwt]?.[boomLen]?.std; } 
            else { points = machine.charts[boomLen]?.std; }
            
            if (!points || points.length === 0) return 0;
            if (dist > points[points.length - 1].d) return 0;
            if (dist < points[0].d) return 0; 

            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];
                if (dist >= p1.d && dist <= p2.d) {
                     const slope = (p2.l - p1.l) / (p2.d - p1.d);
                     const interpolated = p1.l + slope * (dist - p1.d);
                     return Math.floor(interpolated * 1000); 
                }
            }
            return 0;
        }

        if (specificBoom) { return checkBoom(specificBoom, specificCwt); } 
        else {
            let maxCap = 0;
            // CORRECTION ICI : Si un contrepoids spécifique est demandé, on ne teste que celui-là.
            // Sinon, on teste tous les contrepoids disponibles.
            let cwtsToCheck = [null];
            if (machine.hasCounterweights) {
                cwtsToCheck = specificCwt ? [specificCwt] : machine.counterweights;
            }
            
            cwtsToCheck.forEach(cwt => {
                  machine.boomLengths.forEach(len => {
                    const cap = checkBoom(len, cwt);
                    if (cap > maxCap) maxCap = cap;
                });
            });
            return maxCap;
        }
    }
    // 2. TELESCOPIQUES SIMPLES (Zone unique)
    else if (machine.mode === 'zone') {
        let foundLoad = 0;
        if (machine.zones) {
            for (let zone of machine.zones) {
                if (isPointInPolygon(dist, height, zone.points)) {
                    if (zone.load > foundLoad) foundLoad = zone.load;
                }
            }
        }
        return foundLoad;
    } 
    // 3. TELESCOPIQUES MULTI-OUTILS (Nouveau)
    else if (machine.mode === 'zone_multi_tool') {
        let foundLoad = 0;
        // On récupère les zones de l'outil sélectionné ou du premier par défaut
        let activeZones = [];
        if (specificTool && machine.charts[specificTool]) {
            activeZones = machine.charts[specificTool].zones;
        } else if (machine.tools && machine.tools.length > 0) {
            activeZones = machine.charts[machine.tools[0]].zones;
        }

        if (activeZones) {
            for (let zone of activeZones) {
                if (isPointInPolygon(dist, height, zone.points)) {
                    if (zone.load > foundLoad) foundLoad = zone.load;
                }
            }
        }
        return foundLoad;
    }

    return 0;
};

// --- EXPORTS PDF / EXCEL ---
const formatDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0,10).replace(/-/g,'') + '_' + now.toTimeString().slice(0,5).replace(':','');
}

const exportCraneExcel = (machine) => {
    if (!machine) return;
    const wb = XLSX.utils.book_new();

    const createSheetForData = (chartData, sheetName) => {
         let ws_data = [];
         const boomLengths = machine.boomLengths;
         const header = ["Portée (m)", ...boomLengths.map(b => `Flèche ${b}m`)];
         ws_data.push(header);
         let allRadii = new Set();
         boomLengths.forEach(len => { if (chartData[len]?.std) { chartData[len].std.forEach(p => allRadii.add(p.d)); } });
         const sortedRadii = Array.from(allRadii).sort((a,b) => a - b);
         sortedRadii.forEach(r => {
             let row = [r];
             boomLengths.forEach(len => {
                 const points = chartData[len]?.std || [];
                 const p = points.find(pt => Math.abs(pt.d - r) < 0.1);
                 row.push(p ? p.l : ""); 
             });
             ws_data.push(row);
         });
         const ws = XLSX.utils.aoa_to_sheet(ws_data);
         XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    if (machine.mode === 'multi_chart') {
        if(machine.hasCounterweights) { machine.counterweights.forEach(cwt => { createSheetForData(machine.charts[cwt], cwt); }); } 
        else { createSheetForData(machine.charts, "Abaque"); }
    } else if (machine.mode === 'zone') {
        let ws_data = [["Zone ID", "Charge Max (kg)"]];
        machine.zones.forEach(z => { ws_data.push([z.id, z.load]); });
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Zones");
    }
    XLSX.writeFile(wb, `${machine.name}_abaque_${formatDateTime()}.xlsx`);
};

const generateAdequacyPDF = (machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt) => {
    if (!machine) return;
    const doc = new jsPDF();
    doc.setFillColor(0, 78, 152); doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("ADÉQUATION DE LEVAGE", 105, 12, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Généré le : " + new Date().toLocaleString(), 105, 19, { align: "center" });

    let y = 40;
    doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("1. PARAMÈTRES DE LA CHARGE", 14, y); y += 8;
    doc.autoTable({ startY: y, head: [['Masse à lever', 'Portée (Rayon)', 'Hauteur']], body: [[`${inputLoad} kg`, `${inputDist} m`, `${inputHeight} m`]], theme: 'striped', headStyles: { fillColor: [0, 78, 152] } });
    y = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("2. ENGIN SÉLECTIONNÉ", 14, y); y += 8;
    let configDetails = "";
    if(machine.hasCounterweights && currentCwt) { configDetails = `Contrepoids: ${currentCwt}`; }
    doc.autoTable({ startY: y, head: [['Modèle', 'Type', 'Config', 'Source']], body: [[machine.name, machine.category, configDetails || "Standard", machine.source === 'external' ? 'Externe' : (machine.source === 'system' ? 'Système' : 'Locale')]], theme: 'grid', headStyles: { fillColor: [100, 100, 100] } });
    y = doc.lastAutoTable.finalY + 15;

    doc.text("3. RÉSULTAT DU CALCUL", 14, y); y += 8;
    const status = isSafe ? "CONFORME / AUTORISÉ" : "NON CONFORME / INTERDIT";
    const color = isSafe ? [22, 163, 74] : [220, 38, 38];
    doc.autoTable({ startY: y, head: [['Statut', 'Capacité à cette portée', 'Taux d\'utilisation']], body: [[status, `${safeLoad} kg`, `${Math.round((inputLoad/safeLoad)*100)} %`]], headStyles: { fillColor: color }, styles: { fontSize: 12, fontStyle: 'bold' } });
    y = doc.lastAutoTable.finalY + 15;

    doc.text("4. CONCLUSION", 14, y); y += 10;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const text = isSafe ? "L'adéquation est VALIDÉE. L'engin sélectionné dispose de la capacité nécessaire pour effectuer la manœuvre en sécurité." : "L'adéquation est REFUSÉE. L'engin ne dispose pas de la capacité suffisante ou la configuration est hors abaque.";
    doc.text(doc.splitTextToSize(text, 180), 14, y); y += 30;
    doc.line(14, y, 196, y); y += 10; doc.text("Signature :", 14, y);
    doc.save(`${machine.name}_adequation_levage_${formatDateTime()}.pdf`);
};

const CMCLogo = () => (
    <svg width="220" height="50" viewBox="0 0 220 50" className="cursor-pointer">
        <g transform="translate(5, 5)">
            <path d="M 10 0 L 30 0 L 40 10 L 40 18 L 0 18 L 0 10 Z" fill="#004e98" />
            <path d="M 0 22 L 40 22 L 40 30 L 30 40 L 10 40 L 0 30 Z" fill="#d92e2e" />
        </g>
        <g transform="translate(55, 0)">
            <text x="0" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="#004e98" letterSpacing="0.5">CHANTIERS</text>
            <text x="0" y="36" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="#004e98" letterSpacing="0.5">MODERNES</text>
            <text x="0" y="48" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="10" fill="#004e98" letterSpacing="1">CONSTRUCTION</text>
        </g>
    </svg>
);

const CustomRange = ({ label, value, min, max, step, onChange, unit = "", maxLabel = "" }) => {
    const range = max - min;
    const percentage = range > 0 ? ((value - min) / range) * 100 : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <label className="text-lg font-bold text-slate-700">{label}</label>
                <span className="text-xl font-bold text-[#004e98]">{value} <span className="text-sm">{unit}</span></span>
            </div>
            <div className="relative w-full h-8">
                <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="absolute w-full h-full z-20 opacity-0 cursor-pointer" />
                <div className="absolute top-1/2 left-0 w-full h-3 bg-slate-200 rounded-full -translate-y-1/2 overflow-hidden z-10 pointer-events-none">
                    <div style={{ width: `${percentage}%` }} className="h-full bg-[#004e98] transition-all duration-100 ease-out"></div>
                </div>
                <div style={{ left: `calc(${percentage}% - 12px)` }} className="absolute top-1/2 w-6 h-6 bg-[#004e98] border-2 border-white rounded-full shadow-md -translate-y-1/2 z-10 pointer-events-none transition-all duration-100 ease-out"></div>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                <span>{min}{unit}</span>
                <span>{maxLabel || `Max : ${Math.round(max)}${unit}`}</span>
            </div>
        </div>
    );
};

const DbManagerModal = ({ machines, onClose, onDelete, onReset, onImport }) => {
    const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(machines));
        const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", "cmc_levage_backup.json"); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
    };
    const handleFileImport = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try { const imported = JSON.parse(evt.target.result); if (Array.isArray(imported)) { onImport(imported); } else { alert("Format JSON invalide."); } } catch (err) { alert("Erreur lecture fichier."); }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Database className="text-[#004e98]"/> Gestion Base de Données Locale</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-100 transition" onClick={downloadJson}>
                        <Save size={32} className="text-blue-600 mb-2"/>
                        <span className="font-bold text-blue-800">Sauvegarder BDD</span>
                        <span className="text-xs text-blue-600">Exporter en .JSON</span>
                    </div>
                    <label className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 transition">
                        <FileJson size={32} className="text-emerald-600 mb-2"/>
                        <span className="font-bold text-emerald-800">Restaurer BDD</span>
                        <span className="text-xs text-emerald-600">Importer un .JSON</span>
                        <input type="file" className="hidden" accept=".json" onChange={handleFileImport} />
                    </label>
                </div>
                <div className="mb-4">
                    <h4 className="font-bold text-slate-700 mb-2">Machines Locales ({machines.length})</h4>
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                        {machines.length === 0 ? ( <div className="p-4 text-center text-slate-400 italic">Aucune machine personnalisée.</div> ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0"><tr><th className="p-3">Nom</th><th className="p-3">Type</th><th className="p-3 text-right">Action</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {machines.map(m => (
                                        <tr key={m.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-medium text-slate-700">{m.name}</td>
                                            <td className="p-3 text-slate-500">{m.category}</td>
                                            <td className="p-3 text-right"><button onClick={() => onDelete(m.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={onReset} className="px-4 py-2 text-red-600 text-sm font-bold hover:bg-red-50 rounded-lg transition">Tout effacer</button>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition">Fermer</button>
                </div>
            </div>
        </div>
    );
};

const Header = ({ goHome }) => (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div onClick={goHome} className="hover:opacity-80 transition-opacity cursor-pointer"><CMCLogo /></div>
            <div className="flex items-center gap-4">
                <button onClick={() => window.openInfoModal()} className="text-[#004e98] text-2xl font-bold hover:opacity-80 transition p-2">
                    <Info size={28} />
                </button>
                <div className="hidden md:flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <Layers size={14} /> V10.3
                </div>
            </div>
        </div>
    </header>
);

const HomePage = ({ navigate }) => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 p-6 animate-fade-in">
        <div className="max-w-4xl w-full text-center space-y-12">
            <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">Bienvenue sur le portail <br/><span className="text-[#004e98]">Levage Sécurisé</span></h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 max-w-4xl mx-auto">
                <button onClick={() => navigate('determine')} className="animate-slide-up group relative h-64 rounded-xl bg-[#004e98] text-white p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-6" style={{animationDelay: '0.2s'}}>
                    <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm"><Calculator size={48} /></div>
                    <div><span className="block text-2xl font-bold mb-2">Déterminer</span><span className="text-blue-100 text-lg font-light">le bon engin de levage</span></div>
                </button>
                <button onClick={() => navigate('verify')} className="animate-slide-up group relative h-64 rounded-xl bg-[#004e98] text-white p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-6" style={{animationDelay: '0.3s'}}>
                    <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm"><CheckCircle size={48} /></div>
                    <div><span className="block text-2xl font-bold mb-2">Vérifier</span><span className="text-blue-100 text-lg font-light">mon engin de levage</span></div>
                </button>
            </div>
        </div>
    </div>
);

const DeterminePage = ({ allMachines }) => {
    const [mass, setMass] = useState(0); const [unit, setUnit] = useState('kg');
    const [distance, setDistance] = useState(0); const [height, setHeight] = useState(5);
    const [maxUsagePercent, setMaxUsagePercent] = useState(80);
    const [progress, setProgress] = useState(0); const [result, setResult] = useState(null); const [suggestedCrane, setSuggestedCrane] = useState(null);

    const performAutoSelect = (targetMassKg, targetDist, targetHeight) => {
        const candidates = [];
        allMachines.forEach(m => {
            const cap = calculateMachineCapacity(m, targetDist, targetHeight);
            const usage = cap > 0 ? (targetMassKg / cap) * 100 : 999;
            if (cap >= targetMassKg && usage <= maxUsagePercent) { candidates.push({ machine: m, capacity: cap, excess: cap - targetMassKg, usage: usage }); }
        });
        candidates.sort((a, b) => a.capacity - b.capacity);
        if (candidates.length > 0) { const best = candidates[0].machine; setSuggestedCrane(best); localStorage.setItem(SELECTED_CRANE_KEY, JSON.stringify(best)); } 
        else { setSuggestedCrane(null); localStorage.removeItem(SELECTED_CRANE_KEY); }
    };

    useEffect(() => {
        if (mass > 0 && distance > 0) {
            setProgress(0); setResult(null); setSuggestedCrane(null);
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) { clearInterval(interval); const massInTons = unit === 'kg' ? mass / 1000 : mass; const massKg = unit === 'kg' ? mass : mass * 1000; const moment = massInTons * distance; setResult({ tons: massInTons, moment: moment.toFixed(1) }); performAutoSelect(massKg, distance, height); return 100; } return p + 4;
                });
            }, 20); return () => clearInterval(interval);
        } else { setResult(null); setProgress(0); setSuggestedCrane(null); }
    }, [mass, unit, distance, height, maxUsagePercent, allMachines]); 

    return (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start min-h-[60vh] animate-fade-in">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Calculator className="text-brand-blue"/> Paramètres de la charge</h2>
                    <div className="space-y-6">
                        <div><label className="block text-sm font-semibold text-slate-600 mb-2">Masse</label><div className="flex gap-2"><input type="number" value={mass || ''} onChange={(e) => setMass(parseFloat(e.target.value))} className="flex-1 p-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none" placeholder="0"/><select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-24 p-3 text-lg font-bold bg-slate-50 border border-slate-300 rounded-lg"><option value="kg">kg</option><option value="t">t</option></select></div></div>
                        <div><label className="block text-sm font-semibold text-slate-600 mb-2">Portée (m)</label><div className="relative"><input type="number" value={distance || ''} onChange={(e) => setDistance(parseFloat(e.target.value))} className="w-full p-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none pl-4 pr-12" placeholder="0"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">m</span></div></div>
                        <div><label className="block text-sm font-semibold text-slate-600 mb-2">Hauteur (m)</label><div className="relative"><input type="number" value={height || ''} onChange={(e) => setHeight(parseFloat(e.target.value))} className="w-full p-3 text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none pl-4 pr-12" placeholder="0"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">m</span></div></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckCircle size={20} className="text-brand-blue"/> Critère de sécurité</h2>
                     <CustomRange label="Taux d'utilisation max" value={maxUsagePercent} min={70} max={98} step={1} unit="%" onChange={(e) => setMaxUsagePercent(parseInt(e.target.value))} maxLabel="Max : 98%"/>
                    <p className="text-xs text-slate-500 mt-2 italic">L'algorithme ne proposera que des engins utilisés à moins de {maxUsagePercent}% de leur capacité.</p>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg border border-slate-100 min-h-[300px]">
                    {!result ? (
                        <div className="relative w-56 h-56"><svg className="w-full h-full transform -rotate-90"><circle cx="112" cy="112" r="100" stroke="#f1f5f9" strokeWidth="12" fill="transparent" /><circle cx="112" cy="112" r="100" stroke="#004e98" strokeWidth="12" fill="transparent" strokeDasharray={2 * Math.PI * 100} strokeDashoffset={2 * Math.PI * 100 - (progress / 100) * 2 * Math.PI * 100} className="transition-all duration-100 ease-linear" strokeLinecap="round"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-4xl font-bold text-slate-800">{progress}%</span><span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Calcul</span></div></div>
                    ) : (
                        <div className="text-center w-full animate-slide-up">
                            <div className="w-full bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-8 mb-6 shadow-lg"><div className="text-blue-100 text-sm uppercase tracking-wide font-bold mb-2">Besoin Identifié</div><div className="text-5xl font-extrabold mb-1">{result.tons} <span className="text-2xl opacity-80">t</span></div><div className="text-xl opacity-90">à {distance} mètres</div></div>
                            <div className="grid grid-cols-1 gap-4"><div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Moment de charge</div><div className="text-3xl font-bold text-slate-800">{result.moment} <span className="text-sm text-slate-500 font-normal">t.m</span></div></div></div>
                        </div>
                    )}
                </div>
                {result && (
                    <div className="animate-slide-up bg-slate-50 border border-slate-300 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><CheckCircle size={16}/> Recommandation Auto</h3>
                        {suggestedCrane ? (
                            <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-1 font-bold rounded-bl-lg">RECOMMANDÉ</div>
                                <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 px-2 py-1 bg-slate-100 rounded">Source: {suggestedCrane.source === 'external' ? 'BDD Externe' : (suggestedCrane.source === 'system' ? 'Système' : 'Locale')}</div>
                                <h4 className="text-lg font-bold text-slate-800 mb-1">{suggestedCrane.name}</h4>
                                <p className="text-sm text-slate-500 mb-4">{suggestedCrane.category} • Max {suggestedCrane.maxLoad}kg</p>
                                <div className="flex gap-2">
                                    <button onClick={() => exportCraneExcel(suggestedCrane)} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-2 px-3 rounded border border-green-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Abaque Excel</button>
                                    
                                    {/* BOUTON PDF CORRIGÉ AVEC DÉTECTION DU CONTREPOIDS MAX */}
                                    <button onClick={() => {
                                        let cwtToPrint = null;
                                        // On cherche quel contrepoids donne la capacité MAX affichée
                                        if(suggestedCrane.hasCounterweights) {
                                            let currentMax = 0;
                                            suggestedCrane.counterweights.forEach(c => {
                                                const val = calculateMachineCapacity(suggestedCrane, distance, height, null, c);
                                                if(val > currentMax) { currentMax = val; cwtToPrint = c; }
                                            });
                                        }
                                        generateAdequacyPDF(suggestedCrane, (unit==='kg'?mass:mass*1000), distance, height, true, calculateMachineCapacity(suggestedCrane, distance, height), cwtToPrint);
                                    }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2 px-3 rounded border border-red-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> PDF Adéquation</button>
                                </div>
                            </div>
                        ) : ( <div className="text-center p-4 text-slate-500 italic text-sm">Aucun engin trouvé pour cette configuration (limite {maxUsagePercent}%).</div> )}
                    </div>
                )}
            </div>
        </div>
    );
};

const VerifyPage = ({ allMachines, onSaveLocal, onDeleteLocal, onResetLocal, onImportLocal }) => {
    const [showDbManager, setShowDbManager] = useState(false);
    const localMachinesOnly = useMemo(() => allMachines.filter(m => m.source === 'local'), [allMachines]);
    const [category, setCategory] = useState('telehandler');
    const [selectedMachineId, setSelectedMachineId] = useState(null);
    
    // Inputs
    const [inputLoad, setInputLoad] = useState(1000); 
    const [inputDist, setInputDist] = useState(5); 
    const [inputHeight, setInputHeight] = useState(2);
    
    // Configuration Machine
    const [selectedBoomLen, setSelectedBoomLen] = useState(0); 
    const [selectedCwt, setSelectedCwt] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null); // NOUVEAU
    
    const [isAutoCwt, setIsAutoCwt] = useState(false); 
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const autoSelected = localStorage.getItem(SELECTED_CRANE_KEY);
        if (autoSelected) {
            const m = JSON.parse(autoSelected); const found = allMachines.find(x => x.id === m.id);
            if (found) { setCategory(found.category); setSelectedMachineId(found.id); }
        }
    }, [allMachines]); 

    const filteredMachines = useMemo(() => {
        return allMachines
            .filter(m => m.category === category)
            .sort((a, b) => {
                if (a.source === 'local' && b.source !== 'local') return -1;
                if (a.source !== 'local' && b.source === 'local') return 1;
                if (a.source === 'local' && b.source === 'local') {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA; 
                }
                return a.name.localeCompare(b.name);
            });
    }, [allMachines, category]);

    useEffect(() => { if (filteredMachines.length > 0) { if (!selectedMachineId || !filteredMachines.find(m => m.id === selectedMachineId)) { setSelectedMachineId(filteredMachines[0].id); } } else { setSelectedMachineId(null); } }, [category, filteredMachines, selectedMachineId]);

    const machine = useMemo(() => allMachines.find(m => m.id === selectedMachineId) || filteredMachines[0], [selectedMachineId, allMachines, filteredMachines]);
    
    // Initialisation
    useEffect(() => { 
        if (machine?.mode === 'multi_chart' && machine?.boomLengths) { 
            setSelectedBoomLen(machine.boomLengths[0]); 
        } 
        if(machine?.hasCounterweights && machine?.counterweights) { 
            if (!isAutoCwt) { setSelectedCwt(machine.counterweights[machine.counterweights.length - 1]); }
        } else { setSelectedCwt(null); } 

        // Initialisation OUTILS
        if (machine?.hasTools && machine?.tools) {
            setSelectedTool(machine.tools[0]);
        } else {
            setSelectedTool(null);
        }
    }, [machine]);

    // Auto CWT logic
    useEffect(() => {
        if (isAutoCwt && machine && machine.hasCounterweights && machine.counterweights) {
            const sortedCwts = [...machine.counterweights].sort((a, b) => parseFloat(a) - parseFloat(b));
            let bestCwt = null; let found = false;
            for (const cwt of sortedCwts) {
                const capacity = calculateMachineCapacity(machine, inputDist, inputHeight, selectedBoomLen, cwt);
                if (capacity >= inputLoad) { bestCwt = cwt; found = true; break; }
            }
            if (!found && sortedCwts.length > 0) { bestCwt = sortedCwts[sortedCwts.length - 1]; }
            if (bestCwt && bestCwt !== selectedCwt) { setSelectedCwt(bestCwt); }
        }
    }, [isAutoCwt, inputLoad, inputDist, inputHeight, selectedBoomLen, machine]);

    // Calcul Final
    const allowedLoad = calculateMachineCapacity(machine, inputDist, inputHeight, (machine?.mode === 'multi_chart' ? selectedBoomLen : null), selectedCwt, selectedTool);
    const safeLoad = Math.floor(allowedLoad); 
    const calculatedMax = safeLoad > 0 ? safeLoad * 1.1 : (machine ? machine.maxLoad : 5000); 
    const finalMassSliderMax = Math.max(calculatedMax, 100);
    
    useEffect(() => { if (inputLoad > finalMassSliderMax) { setInputLoad(Math.floor(finalMassSliderMax)); } }, [finalMassSliderMax, inputLoad]);
    
    const isSafe = inputLoad <= safeLoad && safeLoad > 0; 
    const usagePercent = safeLoad > 0 ? (inputLoad / safeLoad) * 100 : (inputLoad > 0 ? 110 : 0);

    // Import Excel (Code inchangé, résumé ici)
    const handleExcelUpload = (e) => { /* ... Ton code d'import existant ... */ };
    const downloadTemplate = () => { /* ... Ton code template existant ... */ };

    // GRAPHIQUE 2D MIS À JOUR
    const GraphChart2D = () => {
        if(!machine) return null;
        const width = 600; const height = 450; const padding = 50; const maxX = machine.maxReach * 1.1; const maxY = machine.maxHeight * 1.1; const scaleX = (d) => padding + (d / maxX) * (width - 2 * padding); const scaleY = (h) => height - padding - (h / maxY) * (height - 2 * padding); const userX = scaleX(inputDist); const userY = scaleY(inputHeight); const gridStep = machine.category === 'telehandler' ? 1 : (maxX > 60 ? 10 : 5);
        
        // Déterminer les zones à dessiner
        let zonesToDraw = [];
        if (machine.mode === 'zone') { zonesToDraw = machine.zones; }
        else if (machine.mode === 'zone_multi_tool' && selectedTool && machine.charts[selectedTool]) {
            zonesToDraw = machine.charts[selectedTool].zones;
        }

        return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <defs><pattern id="grid" width={scaleX(gridStep) - scaleX(0)} height={scaleY(0) - scaleY(gridStep)} patternUnits="userSpaceOnUse"><path d={`M ${scaleX(gridStep) - scaleX(0)} 0 L 0 0 0 ${scaleY(0) - scaleY(gridStep)}`} fill="none" stroke="#f1f5f9" strokeWidth="1"/></pattern></defs>
                <rect width="100%" height="100%" fill="white"/><rect x={padding} y={padding} width={width-2*padding} height={height-2*padding} fill="url(#grid)" /><line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#334155" strokeWidth="2" /><line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#334155" strokeWidth="2" />
                {Array.from({ length: Math.ceil(maxX / gridStep) + 1 }).map((_, i) => { const val = i * gridStep; if (val > maxX) return null; return <text key={`x${i}`} x={scaleX(val)} y={height - padding + 20} fontSize="10" textAnchor="middle" fill="#64748b">{val}</text>; })}
                {Array.from({ length: Math.ceil(maxY / gridStep) + 1 }).map((_, i) => { const val = i * gridStep; if (val > maxY) return null; return <text key={`y${i}`} x={padding - 10} y={scaleY(val) + 3} fontSize="10" textAnchor="end" fill="#64748b">{val}</text>; })}
                
                {/* DESSIN DES ZONES (Polygones) */}
                {zonesToDraw.map(z => ( 
                    <g key={z.id}>
                        <path d={`M ${scaleX(z.points[0][0])} ${scaleY(z.points[0][1])}` + z.points.slice(1).map(p => ` L ${scaleX(p[0])} ${scaleY(p[1])}`).join("") + " Z"} fill={z.color} stroke={z.borderColor || 'none'} strokeWidth="1" />
                        {/* Affiche le texte de capacité au centre approximatif du polygone */}
                        {z.points.length > 2 && (
                            <text x={scaleX((z.points[0][0] + z.points[2][0])/2)} y={scaleY((z.points[0][1] + z.points[2][1])/2)} fontSize="10" fontWeight="bold" fill="#fff" textAnchor="middle" opacity="0.9" style={{textShadow: '0px 1px 2px rgba(0,0,0,0.5)'}}>{z.load/1000}t</text>
                        )}
                    </g> 
                ))}

                {machine.mode === 'multi_chart' && machine.boomLengths.map(len => ( <path key={len} d={`M ${scaleX(0)} ${scaleY(len)} A ${scaleX(len)-scaleX(0)} ${scaleY(0)-scaleY(len)} 0 0 1 ${scaleX(len)} ${scaleY(0)}`} fill="none" stroke={len===selectedBoomLen ? "#0f172a" : "#cbd5e1"} strokeWidth={len===selectedBoomLen ? "2" : "1"} strokeDasharray={len===selectedBoomLen ? "" : "4 2"}/> ))}
                
                <line x1={scaleX(0)} y1={scaleY(0)} x2={userX} y2={userY} stroke={isSafe ? "#16a34a" : "#dc2626"} strokeWidth="3" opacity="0.6" /><line x1={userX} y1={userY} x2={userX} y2={height-padding} stroke={isSafe ? "#16a34a" : "#dc2626"} strokeWidth="1" strokeDasharray="4 2" /><circle cx={userX} cy={userY} r="8" fill={isSafe ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="3" className="transition-all duration-300 ease-out" />
                <text x={width/2} y={height-10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">Portée (m)</text><text x={15} y={height/2} textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`} fontSize="12" fontWeight="600" fill="#334155">Hauteur (m)</text>
            </svg>
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${isSafe ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}> {isSafe ? 'ZONE SÉCURISÉE' : 'ZONE INTERDITE'} </div>
        </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
            {showDbManager && <DbManagerModal machines={localMachinesOnly} onClose={() => setShowDbManager(false)} onDelete={onDeleteLocal} onReset={onResetLocal} onImport={onImportLocal}/>}
            <div className="flex flex-wrap justify-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                {[{id: 'telehandler', label: 'Engin Télescopique', icon: Truck}, {id: 'mobile_crane', label: 'Grue Mobile', icon: Move}, {id: 'crawler_crane', label: 'Grue Treillis', icon: Anchor}].map(cat => ( <button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${category === cat.id ? 'bg-[#004e98] text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}> <cat.icon size={18} /> {cat.label} </button> ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#004e98]"></div>
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Truck size={18} className="text-[#004e98]"/> Choix de l'engin</h3><button onClick={() => setShowDbManager(true)} className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center gap-1"><Database size={12}/> Gérer Locale</button></div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Sélectionner dans la BDD (Globale & Locale)</label>
                            <select value={selectedMachineId || ''} onChange={(e) => setSelectedMachineId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-[#004e98] outline-none">
                                    {filteredMachines.map(m => ( <option key={m.id} value={m.id}> {m.name} {m.source === 'local' ? ` [Local - ${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Ancien'}]` : (m.source === 'external' ? " [BDD GitHub]" : " [Système]")} </option> ))}
                            </select>
                        </div>
                        {machine && (
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => exportCraneExcel(machine)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-2 rounded border border-slate-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Abaque .xlsx</button>
                                <button onClick={() => generateAdequacyPDF(machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, selectedCwt)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-2 rounded border border-slate-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Rapport .pdf</button>
                            </div>
                        )}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            {/* Le bloc Import (inchangé) */}
                            <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-blue-800 flex items-center gap-1"><Database size={12}/> Import Fichier Spécifique</span><button onClick={downloadTemplate} className="text-[10px] text-blue-600 underline flex items-center gap-1 hover:text-blue-800"><Download size={10}/> Modèle Multi-Onglet</button></div>
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                                {isUploading ? <span className="text-xs font-bold text-blue-600 animate-pulse">Traitement...</span> : ( <> <Upload size={20} className="text-blue-400 mb-1" /> <span className="text-[10px] text-blue-500 font-semibold">Glisser fichier Excel</span> </> )}
                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} disabled={isUploading} />
                            </label>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Calculator size={18} className="text-[#004e98]"/> Configuration de Levage</h3>
                        <div className="space-y-6">
                            {/* GRUES MOBILES: FLÈCHE & CONTREPOIDS */}
                            {machine && machine.mode === 'multi_chart' && (
                                <>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Longueur Flèche (m)</label>
                                        <div className="flex flex-wrap gap-2">{machine.boomLengths.map(len => ( <button key={len} onClick={() => setSelectedBoomLen(len)} className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedBoomLen === len ? 'bg-slate-800 text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'}`}> {len} </button> ))}</div>
                                    </div>
                                    {machine.hasCounterweights && (
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 block">Contrepoids</label>
                                                <button onClick={() => setIsAutoCwt(!isAutoCwt)} className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors flex items-center gap-1 ${isAutoCwt ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>{isAutoCwt ? <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> AUTO (ON)</span> : "MANUEL"}</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {machine.counterweights.map(cwt => ( <button key={cwt} onClick={() => { setSelectedCwt(cwt); setIsAutoCwt(false); }} className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedCwt === cwt ? 'bg-brand-red text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'} ${isAutoCwt && selectedCwt === cwt ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}> {cwt} </button> ))}
                                            </div>
                                            {isAutoCwt && <p className="text-[10px] text-green-600 mt-2 italic flex items-center gap-1"><CheckCircle size={10}/> Sélection automatique activée</p>}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* NOUVEAU : TELESCOPIQUES AVEC OUTILS */}
                            {machine && machine.hasTools && machine.tools && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block flex items-center gap-2"><Anchor size={12}/> Accessoire / Outil</label>
                                    <div className="flex flex-wrap gap-2">
                                        {machine.tools.map(tool => (
                                            <button 
                                                key={tool} 
                                                onClick={() => setSelectedTool(tool)}
                                                className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedTool === tool ? 'bg-[#004e98] text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'}`}
                                            > 
                                                {tool} 
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <CustomRange label="Masse (t)" value={inputLoad/1000} min={0} max={finalMassSliderMax/1000} step={0.05} unit="t" onChange={(e) => setInputLoad(Math.round(parseFloat(e.target.value)*1000))} />
                            <CustomRange label="Portée (m)" value={inputDist} min={0} max={machine?.maxReach + 2} step={0.5} unit="m" onChange={(e) => setInputDist(parseFloat(e.target.value))} />
                            <CustomRange label="Hauteur Crochet (m)" value={inputHeight} min={0} max={machine?.maxHeight + 2} step={0.5} unit="m" onChange={(e) => setInputHeight(parseFloat(e.target.value))} />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-8 space-y-6">
                    <div className={`relative rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row ${isSafe ? 'bg-[#ecfdf5]' : 'bg-red-50'}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-3 ${isSafe ? 'bg-[#10b981]' : 'bg-red-500'}`}></div>
                        <div className="p-6 pl-9 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div><h2 className={`text-2xl font-bold uppercase mb-1 ${isSafe ? 'text-[#065f46]' : 'text-red-800'}`}>{isSafe ? 'AUTORISÉ' : 'INTERDIT'}</h2><p className="text-slate-600 font-medium">{isSafe ? 'Configuration conforme' : 'Capacité dépassée ou hors de portée'}</p></div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-slate-800">{safeLoad/1000} <span className="text-xl font-semibold">t</span></div>
                                    <div className="text-xs text-slate-500 mt-1">Max Autorisé à {inputDist}m</div>
                                    {machine && machine.hasCounterweights && <div className="text-xs text-brand-red font-bold mt-1">CWT: {selectedCwt}</div>}
                                    {machine && machine.hasTools && <div className="text-xs text-[#004e98] font-bold mt-1">Outil: {selectedTool}</div>}
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="flex gap-2 items-end mb-2"><span className="text-sm font-bold text-black">Utilisation {Math.round(usagePercent)}%</span></div>
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden"><div style={{width: `${Math.min(100, usagePercent)}%`}} className={`h-full rounded-full transition-all duration-500 ease-out ${isSafe ? 'bg-[#10b981]' : 'bg-red-500'}`}></div></div>
                            </div>
                        </div>
                    </div>
                    <GraphChart2D />
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [page, setPage] = useState('home');
    const [localMachines, setLocalMachines] = useState([]); const [externalMachines, setExternalMachines] = useState([]);

    useEffect(() => { const saved = localStorage.getItem(DB_KEY); if (saved) { try { const parsed = JSON.parse(saved); setLocalMachines(parsed.map(m => ({...m, source: 'local'}))); } catch (e) { console.error("Err LocalStorage", e); } } }, []);
    useEffect(() => { const fetchExternal = async () => { try { const response = await fetch(EXTERNAL_DB_URL); if (!response.ok) throw new Error("Fichier non trouvé"); const data = await response.json(); setExternalMachines(data.map(m => ({...m, source: 'external'}))); } catch (err) { console.warn("Mode dégradé"); } }; fetchExternal(); }, []);
    const allMachines = useMemo(() => { return [...HARDCODED_MACHINES, ...externalMachines, ...localMachines]; }, [externalMachines, localMachines]);

    const saveLocal = (newMachines) => { const updated = [...localMachines, ...newMachines.map(m => ({...m, source: 'local'}))]; setLocalMachines(updated); localStorage.setItem(DB_KEY, JSON.stringify(updated)); };
    const deleteLocal = (id) => { if(confirm("Supprimer cette machine locale ?")) { const updated = localMachines.filter(m => m.id !== id); setLocalMachines(updated); localStorage.setItem(DB_KEY, JSON.stringify(updated)); } };
    const resetLocal = () => { if(confirm("Effacer TOUTES les machines locales ?")) { setLocalMachines([]); localStorage.setItem(DB_KEY, JSON.stringify([])); } };
    const importLocal = (imported) => { if(confirm(`Importer ${imported.length} machines ? Cela REMPLACE la base locale.`)) { const marked = imported.map(m => ({...m, source: 'local'})); setLocalMachines(marked); localStorage.setItem(DB_KEY, JSON.stringify(marked)); } }

    return (
        <div className="min-h-screen">
            <Header goHome={() => setPage('home')} />
            <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
                {page === 'home' && <HomePage navigate={setPage} />}
                {page !== 'home' && (
                    <div className="animate-fade-in">
                        <button onClick={() => setPage('home')} className="mb-6 flex items-center text-slate-500 hover:text-brand-blue font-bold px-4 py-2 hover:bg-white rounded-lg transition-colors"><ArrowLeft size={20} className="mr-2"/> Retour Accueil</button>
                        {page === 'determine' && <DeterminePage allMachines={allMachines} />}
                        {page === 'verify' && <VerifyPage allMachines={allMachines} onSaveLocal={saveLocal} onDeleteLocal={deleteLocal} onResetLocal={resetLocal} onImportLocal={importLocal}/>}
                    </div>
                )}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// ============================================================
//          MODULE INFORMATION / UPDATE / TUTO (VANILLA JS)
// ============================================================

// CONFIGURATION GITHUB
const GITHUB_CONFIG = { 
    username: 'antoto2021', 
    repo: 'Appli-engin-de-levage' 
};

const STORAGE_KEY_HASH = 'app_local_version_hash';
const STORAGE_KEY_TIME = 'app_local_update_timestamp';
const CHECK_DELAY_MS = 5000;
let hasPerformedCheck = false;

// DONNÉES DU TUTORIEL
const tutorialSlides = [
    { icon: "👋", title: "Bienvenue !", desc: "Levage Sécurisé : Votre assistant digital pour valider vos adéquations de levage sur chantier." },
    { icon: "🏗️", title: "Choix de l'engin", desc: "Sélectionnez votre grue parmi la base de données système ou importez vos propres modèles via Excel." },
    { icon: "📐", title: "Configuration", desc: "Définissez la flèche, le contrepoids (nouveau !) et les paramètres de la charge (Masse, Portée)." },
    { icon: "✅", title: "Vérification", desc: "Visualisez instantanément si le levage est autorisé (Vert) ou interdit (Rouge) grâce aux abaques intégrés." },
    { icon: "📄", title: "Rapports", desc: "Générez des rapports PDF d'adéquation professionnels prêts à signer en un clic." },
    { icon: "🔄", title: "Mises à jour", desc: "L'application vérifie automatiquement les nouvelles versions via GitHub tout en conservant vos données locales." }
];

let currentSlidesData = [];
let currentSlideIndex = 0;

window.addEventListener('load', () => {
    document.getElementById('year-copy').innerText = new Date().getFullYear();
    renderLocalInfo(); 
    startAutoCheck();
});

function renderLocalInfo() {
    const localHash = localStorage.getItem(STORAGE_KEY_HASH);
    const localTime = localStorage.getItem(STORAGE_KEY_TIME);
    document.getElementById('info-app-version').innerText = localHash ? localHash.substring(0, 7) : 'Aucun (Init)';
    if (localTime) {
        const diff = Date.now() - parseInt(localTime);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        let timeString = "À l'instant";
        if(days > 0) timeString = `Il y a ${days} jour(s)`;
        else if(hours > 0) timeString = `Il y a ${hours} heure(s)`;
        else if(minutes > 0) timeString = `Il y a ${minutes} min`;
        document.getElementById('info-local-time').innerText = "Mise à jour : " + timeString;
    } else {
        document.getElementById('info-local-time').innerText = "Date inconnue";
    }
}

function startAutoCheck() {
    setTimeout(() => { if (!hasPerformedCheck) checkGitHubUpdates(true); }, CHECK_DELAY_MS);
}

async function fetchLatestCommit() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/commits?per_page=1&t=${Date.now()}`;
        const r = await fetch(url);
        if (r.status === 404) return 'repo_not_found';
        if (!r.ok) throw new Error();
        const d = await r.json();
        return d[0];
    } catch (e) { return null; }
}

async function checkGitHubUpdates(bg = false) {
    hasPerformedCheck = true;
    const remoteEl = document.getElementById('info-remote-version');
    const statusDot = document.getElementById('connection-status');
    const btn = document.getElementById('btn-update-check');

    if(!bg) {
        remoteEl.innerText = "Connexion...";
        statusDot.className = "w-2 h-2 rounded-full bg-yellow-400 animate-pulse";
        btn.disabled = true;
    }

    const commit = await fetchLatestCommit();

    if (commit === 'repo_not_found') {
        if(!bg) {
            remoteEl.innerText = "Repo introuvable";
            statusDot.className = "w-2 h-2 rounded-full bg-red-500";
            alert("⚠️ Attention : Le dépôt GitHub configuré n'existe pas ou est privé.\nVérifiez la configuration en bas du script.");
        }
    } else if (commit) {
        const rHash = commit.sha;
        const lHash = localStorage.getItem(STORAGE_KEY_HASH);
        
        remoteEl.innerText = `Commit: ${rHash.substring(0,7)}`;
        statusDot.className = "w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";

        if (!lHash) {
            localStorage.setItem(STORAGE_KEY_HASH, rHash);
            localStorage.setItem(STORAGE_KEY_TIME, Date.now()); 
            renderLocalInfo(); 
        } else if (lHash !== rHash) {
            triggerUpdateAlert(); 
            remoteEl.innerHTML = `${rHash.substring(0,7)} <span class="bg-amber-100 text-amber-600 text-[9px] px-1 rounded font-bold">NEW</span>`;
        }
    } else {
        if(!bg) { remoteEl.innerText = "Hors ligne"; statusDot.className = "w-2 h-2 rounded-full bg-red-500"; }
    }
    btn.disabled = false;
}

function triggerUpdateAlert() { 
    document.getElementById('updateAlert').style.display = 'flex';
    document.querySelector('.update-dot').style.display = 'block';
}

function forceUpdate() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('rotating');
    setTimeout(() => {
        fetchLatestCommit().then(commit => {
            if(commit && typeof commit === 'object') {
                localStorage.setItem(STORAGE_KEY_HASH, commit.sha);
                localStorage.setItem(STORAGE_KEY_TIME, Date.now()); 
            }
            window.location.reload();
        });
    }, 800);
}

function openInfoModal() {
    document.getElementById('info-modal-overlay').classList.remove('hidden');
    renderLocalInfo(); 
    checkGitHubUpdates(false);
}
function closeInfoModal() { document.getElementById('info-modal-overlay').classList.add('hidden'); }
function toggleAccordion(id) { document.getElementById(id).classList.toggle('expanded'); }

function openTutorial() {
    currentSlidesData = tutorialSlides;
    currentSlideIndex = 0;
    const badge = document.getElementById('wn-badge-text');
    badge.innerText = "Tutoriel";
    badge.style.backgroundColor = "#004e98"; 
    badge.style.color = "#fff";
    document.getElementById('wn-main-title').innerText = "Guide Rapide";

    const overlay = document.getElementById('wn-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show-modal'), 10);

    renderSlides();
    updateSlideUI();
}

function closePopup() {
    const overlay = document.getElementById('wn-overlay');
    overlay.classList.remove('show-modal');
    setTimeout(() => overlay.style.display = 'none', 300);
}

function renderSlides() {
    const container = document.getElementById('wn-content');
    const dots = document.getElementById('wn-dots');
    
    container.innerHTML = currentSlidesData.map((s, i) => `
        <div class="wn-slide" id="slide-${i}">
            <span class="wn-icon">${s.icon}</span>
            <span class="wn-slide-title">${s.title}</span>
            <p class="wn-desc">${s.desc}</p>
        </div>
    `).join('');

    dots.innerHTML = currentSlidesData.map((_, i) => `<div class="wn-dot"></div>`).join('');
}

function updateSlideUI() {
    document.querySelectorAll('.wn-slide').forEach((el, i) => {
        el.style.display = i === currentSlideIndex ? 'block' : 'none';
    });
    document.querySelectorAll('.wn-dot').forEach((el, i) => {
        if(i === currentSlideIndex) el.classList.add('active');
        else el.classList.remove('active');
    });
    const btn = document.getElementById('wn-btn');
    if (currentSlideIndex === currentSlidesData.length - 1) {
        btn.innerText = "Terminer ✅";
        btn.style.backgroundColor = "#15803d";
    } else {
        btn.innerText = "Suivant ➜";
        btn.style.backgroundColor = "#004e98";
    }
}

function nextSlide() {
    if (currentSlideIndex < currentSlidesData.length - 1) {
        currentSlideIndex++;
        updateSlideUI();
    } else {
        closePopup();
    }
}
document.getElementById('wn-overlay').addEventListener('click', function(e) {
    if (e.target === this) closePopup();
});

// Attachement global pour les appels onclick HTML
window.forceUpdate = forceUpdate;
window.checkGitHubUpdates = checkGitHubUpdates;
window.closeInfoModal = closeInfoModal;
window.toggleAccordion = toggleAccordion;
window.openTutorial = openTutorial;
window.closePopup = closePopup;
window.nextSlide = nextSlide;
window.openInfoModal = openInfoModal;
