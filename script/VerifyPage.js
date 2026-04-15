const CRANE_SLINGS_TABLE = [
    { upTo: 6000, mass: 22 },    // Jusqu'à 6t -> 22kg d'élingues (4 élingues de 5m chacunes, diamètre 7mm)
    { upTo: 12600, mass: 44 },  // Jusqu'à 12.6t -> 44kg d'élingues (diamètre 10mm)
    { upTo: 32000, mass: 114 },  // Jusqu'à 32t -> 114kg d'élingues (diamètre 16mm)
    { upTo: 50000, mass: 180 },  // Jusqu'à 50t -> 180kg d'élingues (diamètre 20mm)
    { upTo: 84800, mass: 304 },  // Jusqu'à 84.8t -> 304kg d'élingues (diamètre 26mm)
    { upTo: Infinity, mass: 460 } // Au delà -> 460kg d'élingues
];

const CustomRange = ({ label, value, min, max, step, onChange, unit = "", maxLabel = "" }) => {
    const range = max - min;
    const percentage = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 0;
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
    // --- NOUVELLE FONCTION D'EXPORT FORMATÉ ---
    const downloadJson = () => {
        // 1. On convertit en JSON avec des indentations (2 espaces)
        let jsonStr = JSON.stringify(machines, null, 2);

        // 2. On compresse les coordonnées des Grues { "d": X, "l": Y } sur une seule ligne
        jsonStr = jsonStr.replace(/\{\s*"d":\s*([-\d.]+),\s*"l":\s*([-\d.]+)\s*\}/g, '{ "d": $1, "l": $2 }');

        // 3. On compresse les coordonnées des Manitous [X, Y] sur une seule ligne
        jsonStr = jsonStr.replace(/\[\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\]/g, '[$1, $2]');

        // 4. On force certains petits tableaux à tenir sur une seule ligne au lieu d'un élément par ligne
        const arraysToCompress = ["boomLengths", "counterweights", "tools", "points"];
        arraysToCompress.forEach(key => {
            const regex = new RegExp(`"${key}":\\s*\\[([\\s\\S]*?)\\]`, 'g');
            jsonStr = jsonStr.replace(regex, (match, content) => {
                // Remplace les sauts de ligne à l'intérieur du tableau par de simples espaces
                return `"${key}": [` + content.replace(/\s*\n\s*/g, ' ').trim() + `]`;
            });
        });

        // 5. Création et téléchargement du fichier (Méthode Blob plus robuste pour les gros fichiers)
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a'); 
        downloadAnchorNode.setAttribute("href", url); 
        downloadAnchorNode.setAttribute("download", "cmc_levage_backup.json"); 
        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click(); 
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
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

const PredimModal = ({ machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt, selectedBoomLen, currentMoufle, onClose }) => {
    const [chantierName, setChantierName] = useState("");

    const handleDownload = () => {
        if (!chantierName.trim()) { alert("Veuillez indiquer un nom de chantier."); return; }
        generatePredimPDF(machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt, selectedBoomLen, currentMoufle, chantierName);
    };

    const handleSendMail = () => {
        if (!chantierName.trim()) { alert("Veuillez indiquer un nom de chantier."); return; }
        
        const subject = encodeURIComponent(`[${chantierName}] Prédimensionnement ${machine.category === 'telehandler' ? 'Télescopique' : 'Grue'} - ${new Date().toLocaleDateString()}`);
        const body = encodeURIComponent(
            `Bonjour à tous,\n\nVeuillez trouver ci-joint le prédimensionnement de levage pour le chantier : ${chantierName}.\n\n` +
            `Détails rapides :\n` +
            `- Engin : ${machine.name}\n` +
            `- Masse : ${inputLoad / 1000} t\n` +
            `- Portée : ${inputDist} m\n` +
            `- Statut : ${isSafe ? 'CONFORME' : 'NON CONFORME'}\n\n` +
            `⚠️ N'oubliez pas d'insérer le PDF prédimensionnement téléchargé en pièce jointe de cet e-mail !\n\nCordialement.`
        );
        
        // Ouvre le client mail par défaut
        window.location.href = `mailto:methodes@vinci.com,qpe@vinci.com?subject=${subject}&body=${body}`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-slide-up border-t-8 border-[#004e98] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                
                <h2 className="text-2xl font-black text-slate-800 mb-2">Prédimensionnement</h2>
                <p className="text-slate-500 text-sm mb-6">Préparez le document officiel pour validation par les équipes Méthodes et QPE.</p>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nom du Chantier / Opération *</label>
                    <input 
                        type="text" 
                        value={chantierName} 
                        onChange={(e) => setChantierName(e.target.value)} 
                        placeholder="Ex: Pôle Gare - Levage CTA"
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004e98] outline-none"
                    />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Engin :</span> <span className="font-bold">{machine.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Taux d'utilisation :</span> <span className="font-bold">{Math.round((inputLoad / safeLoad) * 100)} %</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                        <span className="text-slate-500">Statut :</span> 
                        <span className={`font-bold ${isSafe ? 'text-green-600' : 'text-red-600'}`}>{isSafe ? 'AUTORISÉ' : 'INTERDIT'}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={handleDownload} className="w-full bg-[#004e98] hover:bg-[#003b75] text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                        <Download size={18} /> 1. Télécharger le PDF
                    </button>
                    
                    <button onClick={handleSendMail} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                        <span>✉️</span> 2. Envoyer par mail (Méthodes & QPE)
                    </button>
                    <p className="text-[10px] text-slate-400 text-center italic mt-2">Note: Le navigateur ne pouvant joindre le PDF automatiquement au mail, pensez à le glisser dans votre message.</p>
                </div>
            </div>
        </div>
    );
};

const GraphChart2D = ({ machine, inputDist, inputHeight, selectedBoomLen, selectedTool, isSafe, isAngleWarning, badgeText, badgeBg }) => {
        if(!machine) return null;
        
        const width = 600; const height = 450; 
        const padding = 50; 
        const isTelehandler = machine.category === 'telehandler';

        const paddingLeft = 80; 
        
        const maxX = Math.max(machine.maxReach * 1.1, inputDist * 1.1); 
        const maxY = Math.max(machine.maxHeight, inputHeight * 1.1, 5); 
        
        const scaleX = (d) => paddingLeft + (d / maxX) * (width - paddingLeft - padding); 
        const scaleY = (h) => height - padding - (h / maxY) * (height - 2 * padding); 
        
        const hookX = scaleX(inputDist); 
        const hookY = scaleY(inputHeight);
        
        const pivotX = scaleX(0);
        const pivotY = scaleY(0);
        
        let tipX = hookX; 
        let tipY; 

        if (machine.mode === 'multi_chart') {
            const hGeo = Math.sqrt(Math.pow(selectedBoomLen, 2) - Math.pow(inputDist, 2));
            tipY = scaleY(isNaN(hGeo) ? 0 : hGeo);
        } else { tipY = hookY; }

        const gridStep = isTelehandler ? 1 : (maxX > 60 ? 10 : 5);
        let zonesToDraw = [];
        if (machine.mode === 'zone') zonesToDraw = machine.zones;
        else if (machine.mode === 'zone_multi_tool' && selectedTool && machine.charts[selectedTool]) zonesToDraw = machine.charts[selectedTool].zones;
        
        const statusColor = !isSafe ? "#dc2626" : (isAngleWarning ? "#f59e0b" : "#16a34a"); 
        const statusFill = !isSafe ? "#ef4444" : (isAngleWarning ? "#fbbf24" : "#22c55e");

        return (
        <div id="tour-graph" className="w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <defs>
                    <pattern id="grid" width={scaleX(gridStep) - scaleX(0)} height={scaleY(0) - scaleY(gridStep)} patternUnits="userSpaceOnUse">
                        <path d={`M ${scaleX(gridStep) - scaleX(0)} 0 L 0 0 0 ${scaleY(0) - scaleY(gridStep)}`} fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="white"/>
                <rect x={paddingLeft} y={padding} width={width-paddingLeft-padding} height={height-2*padding} fill="url(#grid)" />
                
                <line x1={paddingLeft} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#334155" strokeWidth="2" />
                <line x1={paddingLeft} y1={padding} x2={paddingLeft} y2={height-padding} stroke="#334155" strokeWidth="2" />
                
                {Array.from({ length: Math.ceil(maxX / gridStep) + 1 }).map((_, i) => { const val = i * gridStep; if (val > maxX) return null; return <text key={`x${i}`} x={scaleX(val)} y={height - padding + 20} fontSize="10" textAnchor="middle" fill="#64748b">{val}</text>; })}
                {Array.from({ length: Math.ceil(maxY / gridStep) + 1 }).map((_, i) => { const val = i * gridStep; if (val > maxY) return null; return <text key={`y${i}`} x={paddingLeft - 10} y={scaleY(val) + 3} fontSize="10" textAnchor="end" fill="#64748b">{val}</text>; })}
                
                {zonesToDraw.map(z => {
                    // 1. Trouver les bords gauche et droit extrêmes de la zone
                    let minX = Infinity, maxX = -Infinity;
                    z.points.forEach(p => {
                        if (p[0] < minX) minX = p[0];
                        if (p[0] > maxX) maxX = p[0];
                    });
                    
                    // 2. On cible le milieu horizontal parfait de la zone
                    let cx = (minX + maxX) / 2;
                    
                    // 3. On trace une ligne verticale imaginaire pour trouver le plafond et le plancher
                    let intersectYs = [];
                    const pts = z.points;
                    for (let i = 0; i < pts.length; i++) {
                        let p1 = pts[i];
                        let p2 = pts[(i + 1) % pts.length];
                        
                        // Si le bord de la zone croise notre ligne verticale
                        if ((p1[0] <= cx && p2[0] > cx) || (p2[0] <= cx && p1[0] > cx)) {
                            let t = (cx - p1[0]) / (p2[0] - p1[0]);
                            let y = p1[1] + t * (p2[1] - p1[1]);
                            intersectYs.push(y);
                        }
                    }
                    
                    let cy;
                    // 4. Si on trouve bien un haut et un bas, on se place pile au centre
                    if (intersectYs.length >= 2) {
                        let yMin = Math.min(...intersectYs);
                        let yMax = Math.max(...intersectYs);
                        cy = (yMin + yMax) / 2;
                    } else {
                        // Secours si la forme est anormale
                        cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
                        cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
                    }

                    return ( 
                        <g key={z.id}>
                            <path d={`M ${scaleX(z.points[0][0])} ${scaleY(z.points[0][1])}` + z.points.slice(1).map(p => ` L ${scaleX(p[0])} ${scaleY(p[1])}`).join("") + " Z"} fill={z.color} stroke={z.borderColor || '#ffffff'} strokeWidth="1.5" strokeLinejoin="round" />
                            {z.points.length > 2 && (<text x={scaleX(cx)} y={scaleY(cy)} fontSize="11" fontWeight="bold" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" style={{textShadow: '0px 0px 3px rgba(0,0,0,0.5)'}}>{z.load/1000}t</text>)}
                        </g> 
                    );
                })}

                {machine.mode === 'multi_chart' && machine.boomLengths.map(len => ( 
                    <path 
                        key={len} 
                        d={`M ${scaleX(0)} ${scaleY(len)} A ${scaleX(len)-scaleX(0)} ${scaleY(0)-scaleY(len)} 0 0 1 ${scaleX(len)} ${scaleY(0)}`} 
                        fill="none" 
                        stroke={len === selectedBoomLen ? "#0f172a" : "#cbd5e1"} 
                        strokeWidth={len === selectedBoomLen ? "2" : "1"} 
                        strokeDasharray={len === selectedBoomLen ? "" : "4 2"}
                    /> 
                ))}

                <line x1={pivotX} y1={pivotY} x2={tipX} y2={tipY} stroke={statusColor} strokeWidth="6" opacity="0.9" strokeLinecap="round" />
                <circle cx={pivotX} cy={pivotY} r="5" fill="#0f172a" />

                {machine.mode === 'multi_chart' && (
                    <line x1={tipX} y1={tipY} x2={hookX} y2={hookY} stroke="#334155" strokeWidth="2" strokeDasharray="4 2" />
                )}

                <circle cx={hookX} cy={hookY} r="6" fill={statusFill} stroke="#0f172a" strokeWidth="1" />
                
                <text x={width/2} y={height-10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">Portée (m)</text>
                <text x={15} y={height/2} textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`} fontSize="12" fontWeight="600" fill="#334155">Hauteur (m)</text>
            </svg>

            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1.5 rounded-full border border-slate-300 text-sm font-bold text-slate-700 z-10 shadow-sm">
                {machine.category === 'telehandler' 
                    ? "📍 Point d'origine : Devant les roues de l'engin"
                    : "📍 Point d'origine : Milieu de la cabine"}
            </div>
                            
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${badgeBg}`}> 
                {badgeText} 
            </div>
        </div>
        );
    };

const VerifyPage = ({ allMachines, onSaveLocal, onDeleteLocal, onResetLocal, onImportLocal }) => {
    const [showDbManager, setShowDbManager] = useState(false);
    const localMachinesOnly = useMemo(() => allMachines.filter(m => m.source === 'local'), [allMachines]);
    const [category, setCategory] = useState('telehandler');
    const [selectedMachineId, setSelectedMachineId] = useState(null);
    const [isPredimModalOpen, setIsPredimModalOpen] = useState(false);
    
    // Inputs (Le Besoin)
    const [inputLoad, setInputLoad] = useState(1000); 
    const [inputDist, setInputDist] = useState(3); 
    const [inputHeight, setInputHeight] = useState(2);
    
    // Configuration (La Solution)
    const [selectedBoomLen, setSelectedBoomLen] = useState(0); 
    const [selectedCwt, setSelectedCwt] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    
    const [isAutoConfig, setIsAutoConfig] = useState(true); 
    
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

    useEffect(() => { if (filteredMachines.length > 0 && (!selectedMachineId || !filteredMachines.find(m => m.id === selectedMachineId))) { setSelectedMachineId(filteredMachines[0].id); } }, [category, filteredMachines, selectedMachineId]);

    const machine = useMemo(() => allMachines.find(m => m.id === selectedMachineId) || filteredMachines[0], [selectedMachineId, allMachines, filteredMachines]);
    
    // --- CALCUL DE LA PORTÉE MINIMALE ABSOLUE DE LA MACHINE ---
    const absoluteMinReach = useMemo(() => {
        if (!machine) return 0;
        let minR = Infinity;
        
        if (machine.mode === 'multi_chart') {
            const cwts = machine.hasCounterweights ? machine.counterweights : [null];
            cwts.forEach(c => {
                machine.boomLengths.forEach(b => {
                    const pts = machine.hasCounterweights ? machine.charts[c]?.[b]?.std : machine.charts[b]?.std;
                    if (pts && pts.length > 0 && pts[0].d < minR) minR = pts[0].d;
                });
            });
        } else {
            let activeZones = [];
            if (machine.mode === 'zone_multi_tool' && machine.tools && machine.charts[machine.tools[0]]) {
                activeZones = machine.charts[machine.tools[0]].zones;
            } else if (machine.zones) {
                activeZones = machine.zones;
            }
            activeZones.forEach(z => {
                z.points.forEach(p => {
                    if (p[0] < minR) minR = p[0];
                });
            });
        }
        return minR === Infinity ? 0 : minR;
    }, [machine]);

    const handleCategoryChange = (newCat) => {
        if (newCat !== category) {
            setCategory(newCat);
            
            // Si on clique sur "Engin Télescopique"
            if (newCat === 'telehandler') {
                setInputLoad(1000);  // Masse par défaut : 1 tonnes (1000 kg)
                setInputDist(2);     // Portée par défaut : 3 m
                setInputHeight(2);   // Hauteur par défaut : 2 m
            } 
            // Si on clique sur "Grue Mobile" ou "Grue Treillis"
            else {
                setInputLoad(1000);  // Masse par défaut : 1 tonne (1000 kg)
                setInputDist(5);    // Portée par défaut : 5 m
                setInputHeight(2);   // Hauteur par défaut : 2 m
            }
        }
    };

    useEffect(() => { 
        if (machine?.mode === 'multi_chart' && machine?.boomLengths) { 
            if(!isAutoConfig) setSelectedBoomLen(machine.boomLengths[0]); 
        } 
        if(machine?.hasCounterweights && machine?.counterweights) { 
            if (!isAutoConfig) { 
                const sorted = [...machine.counterweights].sort((a, b) => parseFloat(a) - parseFloat(b));
                setSelectedCwt(sorted[sorted.length - 1]); 
            }
        } else { setSelectedCwt(null); } 
        if (machine?.hasTools && machine?.tools) { setSelectedTool(machine.tools[0]); } else { setSelectedTool(null); }
        
        if (machine) {
            // NOUVEAU : On repousse le curseur si la nouvelle portée min est plus grande que la valeur actuelle
            if (inputDist > machine.maxReach) {
                setInputDist(machine.maxReach > 0 ? machine.maxReach : 5);
            } else if (inputDist < absoluteMinReach) {
                setInputDist(absoluteMinReach);
            }

            if (inputHeight > machine.maxHeight + 5) setInputHeight(machine.maxHeight > 0 ? machine.maxHeight : 2);
        }
    }, [machine, absoluteMinReach, isAutoConfig]);

    // --- LOGIQUE AUTO CONFIG TOTALE INTÉGRANT LA SÉCURITÉ < 80% ---
    useEffect(() => {
        if (isAutoConfig && machine && machine.mode === 'multi_chart') {
            const sortedCwts = machine.hasCounterweights ? [...machine.counterweights].sort((a, b) => parseFloat(a) - parseFloat(b)) : [null];
            const sortedBooms = [...machine.boomLengths].sort((a, b) => parseFloat(a) - parseFloat(b));

            let bestCwt = null; let bestBoom = null; let found = false;

            // PASSE 1 : L'IDÉAL -> Angle >= 45° ET Utilisation <= 80%
            for (const cwt of sortedCwts) {
                for (const boom of sortedBooms) {
                    if (boom <= inputDist) continue; 
                    const angleDeg = Math.acos(inputDist / boom) * (180 / Math.PI);
                    if (angleDeg < 45) continue;

                    const tipH = Math.sqrt(Math.pow(boom, 2) - Math.pow(inputDist, 2));
                    if (tipH < inputHeight) continue; 

                    const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, boom, cwt, selectedTool);
                    if (cap > 0 && (totalMass / cap) <= 0.80) { 
                        bestCwt = cwt; bestBoom = boom; found = true; break; 
                    }
                }
                if (found) break; 
            }

            // PASSE 2 : LE PLAN B -> Angle >= 45° ET Capacité suffisante (Déclenchera l'alerte > 80%)
            if (!found) {
                for (const cwt of sortedCwts) {
                    for (const boom of sortedBooms) {
                        if (boom <= inputDist) continue; 
                        const angleDeg = Math.acos(inputDist / boom) * (180 / Math.PI);
                        if (angleDeg < 45) continue;
                        
                        const tipH = Math.sqrt(Math.pow(boom, 2) - Math.pow(inputDist, 2));
                        if (tipH < inputHeight) continue; 

                        const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, boom, cwt, selectedTool);
                        if (cap >= totalMass - 1) { bestCwt = cwt; bestBoom = boom; found = true; break; }
                    }
                    if (found) break; 
                }
            }

            // PASSE 3 : TOLÉRANCE -> On lâche la contrainte de l'angle
            if (!found) {
                for (const cwt of sortedCwts) {
                    for (const boom of sortedBooms) {
                        if (boom <= inputDist) continue; 
                        const tipH = Math.sqrt(Math.pow(boom, 2) - Math.pow(inputDist, 2));
                        if (tipH < inputHeight) continue; 

                        const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, boom, cwt, selectedTool);
                        if (cap >= totalMass - 1) { bestCwt = cwt; bestBoom = boom; found = true; break; }
                    }
                    if (found) break; 
                }
            }

            // PASSE 4 : ROUE DE SECOURS -> Si surcharge absolue, on bloque sur la meilleure configuration possible (pour éviter le saut de flèche)
            if (!found) {
                let maxFallbackCap = 0;
                for (const cwt of sortedCwts) {
                    for (const boom of sortedBooms) {
                        if (boom <= inputDist) continue; 
                        const tipH = Math.sqrt(Math.pow(boom, 2) - Math.pow(inputDist, 2));
                        if (tipH < inputHeight) continue; 

                        const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, boom, cwt, selectedTool);
                        if (cap > maxFallbackCap) {
                            maxFallbackCap = cap;
                            bestCwt = cwt;
                            bestBoom = boom;
                        }
                    }
                }
            }

            if (bestCwt && bestCwt !== selectedCwt) { setSelectedCwt(bestCwt); }
            if (bestBoom && bestBoom !== selectedBoomLen) { setSelectedBoomLen(bestBoom); }
        }
    }, [isAutoConfig, inputLoad, totalMass, inputDist, inputHeight, machine, selectedTool]);

    // --- CAPACITÉ MAX ABSOLUE ---
    const absoluteMaxCapAtDist = useMemo(() => {
        if (!machine) return 0;
        let maxCap = 0;
        
        if (machine.mode === 'multi_chart') {
            const cwts = machine.hasCounterweights ? machine.counterweights : [null];
            
            // On cherche le VRAI MAX physique de la grue en ne bloquant PLUS sur l'angle de 45°
            // pour permettre au curseur Masse d'aller au bout de ce que la grue peut faire.
            cwts.forEach(c => {
                machine.boomLengths.forEach(b => {
                    if (b <= inputDist) return; 
                    
                    const tipH = Math.sqrt(Math.pow(b, 2) - Math.pow(inputDist, 2));
                    if (tipH < inputHeight) return; 
                    
                    const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, b, c, selectedTool);
                    if (cap > maxCap) maxCap = cap;
                });
            });

            if (maxCap === 0) {
                 cwts.forEach(c => { 
                     machine.boomLengths.forEach(b => { 
                         if (b <= inputDist) return;
                         const cap = CraneCalculator.getCapacity(machine, inputDist, 0, b, c, selectedTool); 
                         if (cap > maxCap) maxCap = cap; 
                     }); 
                 });
            }
        } else {
            let activeZones = [];
            if (machine.mode === 'zone_multi_tool' && selectedTool && machine.charts[selectedTool]) {
                activeZones = machine.charts[selectedTool].zones;
            } else if (machine.zones) { activeZones = machine.zones; }
            activeZones.forEach(z => {
                let minX = Infinity, maxX = -Infinity;
                z.points.forEach(p => { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; });
                if (inputDist >= minX && inputDist <= maxX) { if (z.load > maxCap) maxCap = z.load; }
            });
        }
        return Math.floor(maxCap);
    }, [machine, inputDist, inputHeight, selectedTool]);

    // --- 1. CALCUL SÉQUENTIEL DE LA MASSE TOTALE ET DES ACCESSOIRES ---
    // a) Masse des élingues (Grues uniquement)
    const slingsMassKg = useMemo(() => {
        if (!machine || machine.category === 'telehandler') return 0;
        const slingEntry = CRANE_SLINGS_TABLE.find(entry => inputLoad <= entry.upTo);
        return slingEntry ? slingEntry.mass : 0;
    }, [machine, inputLoad]);

    // b) Choix du moufle (Grues uniquement)
    const currentMoufle = useMemo(() => {
        if (!machine || machine.category === 'telehandler') return 0;
        // La fonction d'origine récupère le poids du moufle en tonnes.
        // Le crochet soulève la charge + les élingues
        return getMoufleForLoad(machine, inputLoad + slingsMassKg) || 0;
    }, [machine, inputLoad, slingsMassKg]);

    // c) Masse de l'accessoire (Télescopiques uniquement)
    const telehandlerToolMassKg = useMemo(() => {
        if (machine?.category === 'telehandler' && machine?.toolsMass && selectedTool && machine.toolsMass[selectedTool]) {
            return machine.toolsMass[selectedTool] * 1000;
        }
        return 0;
    }, [machine, selectedTool]);

    // d) Masse Totale
    const totalMass = useMemo(() => {
        if (machine?.category === 'telehandler') {
            return inputLoad + telehandlerToolMassKg;
        } else {
            return inputLoad + (currentMoufle * 1000) + slingsMassKg;
        }
    }, [machine, inputLoad, telehandlerToolMassKg, currentMoufle, slingsMassKg]);

    // e) Variable d'affichage pour la dernière bulle (Élingues ou Accessoire)
    const displayAccessoryMassT = machine?.category === 'telehandler' 
        ? (telehandlerToolMassKg / 1000) 
        : (slingsMassKg / 1000);

    // --- 2. CALCULS DE SÉCURITÉ ---
    const allowedLoad = CraneCalculator.getCapacity(machine, inputDist, inputHeight, selectedBoomLen, selectedCwt, selectedTool);
    const safeLoad = Math.floor(allowedLoad); 
    
    // Le slider de la charge s'arrête à (Capacité Max Absolue - Poids des accessoires)
    const sliderMaxMass = absoluteMaxCapAtDist > 0 ? Math.max(0, absoluteMaxCapAtDist - accessoryMassKg) : Math.max(inputLoad, 1000);

    const tipHeight = useMemo(() => {
        if (!machine) return 10;
        let b = 0;
        if (machine.mode === 'multi_chart') b = selectedBoomLen;
        else b = Math.sqrt(Math.pow(Math.max(inputDist, machine.maxReach), 2) + Math.pow(machine.maxHeight, 2));
        if (!b || b < inputDist) return 0;
        const h = Math.sqrt(Math.pow(b, 2) - Math.pow(inputDist, 2));
        return isNaN(h) ? 0 : h + 1.5;
    }, [machine, selectedBoomLen, inputDist]);

    const isHeightValid = machine?.mode === 'multi_chart' ? (inputHeight <= tipHeight) : (inputHeight <= machine?.maxHeight);
    
    const isLoadSafe = totalMass <= safeLoad && safeLoad > 0;
    const isSafe = isLoadSafe && isHeightValid;
    const usagePercent = safeLoad > 0 ? (totalMass / safeLoad) * 100 : (totalMass > 0 ? 110 : 0);

    const currentStepDist = machine?.category === 'telehandler' ? 0.25 : 0.5;

    const currentMinReach = useMemo(() => {
        if (machine?.mode === 'multi_chart') {
            const pts = machine.hasCounterweights ? machine?.charts[selectedCwt]?.[selectedBoomLen]?.std : machine?.charts[selectedBoomLen]?.std;
            if (pts && pts.length > 0) return pts[0].d;
        }
        return 0;
    }, [machine, selectedCwt, selectedBoomLen]);

    // --- ALERTE > 80% ---
    const is80PercentWarning = isSafe && usagePercent > 80;

    // --- GESTION DYNAMIQUE DES MESSAGES ET DES COULEURS ---
    let statusMessage = "Configuration conforme";
    let statusSubMessage = "Le levage peut être effectué en sécurité.";
    
    let bannerBg = 'bg-[#ecfdf5]'; let bannerBorder = 'bg-[#10b981]';
    let titleColor = 'text-[#065f46]'; let mainTextColor = 'text-[#047857]'; let subTextColor = 'text-[#065f46]';
    let mainTitle = 'AUTORISÉ'; let titleIcon = null; let badgeBg = 'bg-green-100 text-green-700 border-green-200'; let badgeText = 'ZONE SÉCURISÉE';
    let progressColor = 'bg-[#10b981]';

    if (!isSafe) {
        bannerBg = 'bg-red-50'; bannerBorder = 'bg-red-500';
        titleColor = 'text-red-800'; mainTextColor = 'text-red-700'; subTextColor = 'text-red-600';
        mainTitle = 'INTERDIT'; badgeBg = 'bg-red-100 text-red-700 border-red-200'; progressColor = 'bg-red-500';
        badgeText = isHeightValid ? 'SURCHARGE' : 'HAUTEUR IMPOSSIBLE';
        
        if (!isHeightValid) {
            statusMessage = "Hauteur hors abaque";
            if (machine?.mode === 'multi_chart') { statusSubMessage = "La flèche est trop courte. Veuillez réduire la portée ou la hauteur."; } 
            else { statusSubMessage = `La hauteur dépasse la limite absolue de l'engin (${machine?.maxHeight} m).`; }
        } else if (safeLoad === 0) {
            statusMessage = "Portée hors abaque";
            if (machine?.mode === 'multi_chart' && inputDist < currentMinReach) {
                const targetReach = (isAutoConfig && inputDist < absoluteMinReach) ? absoluteMinReach : currentMinReach;
                statusSubMessage = `Aucune capacité définie à cette portée. Veuillez augmenter la portée à ${targetReach} m.`;
            } else { statusSubMessage = "Aucune capacité définie à cette portée. Veuillez réduire la portée."; }
        } else if (totalMass > safeLoad) {
            statusMessage = "Surcharge détectée";
            statusSubMessage = `La masse totale (${(totalMass/1000).toFixed(2)} t) dépasse la capacité de la grue (${(safeLoad/1000).toFixed(2)} t). Avez-vous déduit les accessoires de la charge ?`;
        }
    } else if (is80PercentWarning) {
        // NOUVEAU THÈME ALERTE > 80% (Remplace l'angle)
        bannerBg = 'bg-amber-50'; bannerBorder = 'bg-amber-500';
        titleColor = 'text-amber-800'; mainTextColor = 'text-amber-700'; subTextColor = 'text-amber-600';
        mainTitle = 'AUTORISÉ'; titleIcon = '⚠️'; badgeBg = 'bg-amber-100 text-amber-700 border-amber-200'; progressColor = 'bg-amber-500';
        badgeText = 'UTILISATION ÉLEVÉE';
        
        statusMessage = `Taux d'utilisation critique (${Math.round(usagePercent)}%)`;
        statusSubMessage = `Le levage est couvert par l'abaque (Max: ${(safeLoad/1000).toFixed(2)} t), mais nécessite une attention particulière.`;
    }
    
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
            {/* On peut garder le DbManagerModal caché dans le code au cas où, 
                mais l'appel se fera via l'admin HTML désormais */}
            {showDbManager && <DbManagerModal machines={localMachinesOnly} onClose={() => setShowDbManager(false)} onDelete={onDeleteLocal} onReset={onResetLocal} onImport={onImportLocal}/>}
            
            {isPredimModalOpen && (
                <PredimModal 
                    machine={machine}
                    inputLoad={inputLoad}
                    inputDist={inputDist}
                    inputHeight={inputHeight}
                    isSafe={isSafe}
                    safeLoad={safeLoad}
                    currentCwt={selectedCwt}
                    selectedBoomLen={selectedBoomLen}
                    currentMoufle={currentMoufle}
                    onClose={() => setIsPredimModalOpen(false)}
                />
            )}

            <div id="tour-category-select" className="flex flex-wrap justify-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                {[{id: 'telehandler', label: 'Engin Télescopique', icon: Truck}, {id: 'mobile_crane', label: 'Grue Mobile', icon: Move}, {id: 'crawler_crane', label: 'Grue Treillis', icon: Anchor}].map(cat => ( 
                    <button 
                        key={cat.id} 
                        onClick={() => handleCategoryChange(cat.id)} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${category === cat.id ? 'bg-[#004e98] text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                    > 
                        <cat.icon size={18} /> {cat.label} 
                    </button> 
                ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- COLONNE DE GAUCHE --- */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#004e98]"></div>
                        
                        {/* CORRECTION : Suppression du bouton "Gérer Locale" pour protéger la BDD */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Truck size={18} className="text-[#004e98]"/> Choix de l'engin</h3>
                        </div>
                        
                        <div id="tour-BDD" className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Sélectionner dans la BDD</label>
                            <select value={selectedMachineId || ''} onChange={(e) => setSelectedMachineId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-[#004e98] outline-none">
                                    {filteredMachines.map(m => ( 
                                        <option key={m.id} value={m.id}> 
                                            {m.name} {m.source === 'local' ? ` [Local - ${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Ancien'}]` : ""} 
                                        </option> 
                                    ))}
                            </select>
                        </div>
                        
                        {machine && (
                            <div className="flex gap-2 mb-4">
                                <button id="tour-Abaque-Excel" onClick={() => exportCraneExcel(machine)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-2 rounded border border-slate-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Abaque.xlsx</button>
                                <button id="tour-pdf-btn" onClick={() => setIsPredimModalOpen(true)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2 px-2 rounded border border-red-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Prédimensionnement</button>
                            </div>
                        )}
                        
                        {/* CORRECTION : Placement du NOUVEAU BOUTON FICHE TECHNIQUE ici ! */}
                        {machine && (
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col items-center justify-center gap-3">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <FileText size={18} className="text-[#004e98]"/>
                                    <span className="text-sm font-bold">Documentation Constructeur</span>
                                </div>
                                <button 
                                    onClick={() => alert("La fiche PDF de " + machine.name + " s'ouvrira ici. (Sera connecté au Sprint 4)")}
                                    className="w-full bg-white hover:bg-slate-100 text-[#004e98] font-bold py-2 px-4 rounded-lg border border-slate-300 shadow-sm transition flex items-center justify-center gap-2"
                                >
                                    <Download size={16} /> Fiche Technique (PDF)
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div id="tour-sliders" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Calculator size={18} className="text-[#004e98]"/> Calcul d'Adéquation</h3>
                        <div className="space-y-6">
                            
                            <CustomRange label="Portée (m)" value={inputDist} min={absoluteMinReach} max={machine?.maxReach > 0 ? machine.maxReach : 50} step={currentStepDist} unit="m" onChange={(e) => setInputDist(parseFloat(e.target.value))} />
                            <CustomRange label="Masse de la Charge (t)" value={inputLoad/1000} min={0} max={sliderMaxMass/1000} step={machine?.category === 'telehandler' ? 0.01 : 0.05} unit="t" maxLabel={`Capacité Grue (Accessoires inclus): ${(absoluteMaxCapAtDist/1000).toFixed(3)}t`} onChange={(e) => setInputLoad(Math.round(parseFloat(e.target.value)*1000))} />
                            <CustomRange label="Hauteur Levage" value={inputHeight} min={0} max={(machine?.maxHeight ?? 0) + 5} step={0.5} unit="m" onChange={(e) => setInputHeight(parseFloat(e.target.value))} />

                            {machine && (machine.mode === 'multi_chart' || (machine.hasTools && machine.tools && machine.tools.length > 0)) && (
                                <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                                    
                                    {/* TITRE ET BOUTON AUTO */}
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Configuration de l'engin</h4>
                                        {machine.mode === 'multi_chart' && (
                                            <button onClick={() => setIsAutoConfig(!isAutoConfig)} className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors flex items-center gap-1 ${isAutoConfig ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                                                {isAutoConfig ? <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> AUTO (ON)</span> : "MANUEL"}
                                            </button>
                                        )}
                                    </div>

                                    {/* 1. BLOC STABILISATEURS (UNIQUEMENT GRUES) */}
                                    {machine.category !== 'telehandler' && (
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <label className="text-[11px] font-black uppercase text-[#004e98] mb-2 flex items-center gap-2">
                                                STABILISATEURS : DÉPLOIEMENT MAXIMAL REQUIS
                                            </label>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-xs text-[#004e98] font-bold">Surface minimale :</span>
                                                <span className="text-2xl font-black text-[#004e98]">
                                                    {machine?.stabilizerSurface || "---"} <span className="text-sm font-bold">m²</span>
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-blue-600 italic leading-tight mt-2">
                                                ⚠️ Si déploiement maximal impossible (calage intermédiaire), réaliser l’adéquation de levage à la main.
                                            </p>
                                        </div>
                                    )}

                                    {/* 2. BLOC MASSE TOTALE */}
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                                            <Anchor size={14} className="text-[#004e98]"/> 
                                            {machine?.category === 'telehandler' 
                                                ? "Masse Totale (Charge + Accessoire)" 
                                                : "Masse Totale (Charge + Moufle + Élingues)"}
                                        </label>
                                        <div className="text-1xl font-black text-[#004e98]">
                                            {(totalMass / 1000).toFixed(2)} <span className="text-sm font-bold text-slate-500">t</span>
                                        </div>
                                    </div>

                                    {machine.mode === 'multi_chart' && (
                                        <>
                                            {/* 3. BLOC LONGUEUR FLÈCHE */}
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Longueur Flèche (m)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {machine.boomLengths.map(len => ( 
                                                        <button key={len} onClick={() => { setSelectedBoomLen(len); setIsAutoConfig(false); }} className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedBoomLen === len ? 'bg-slate-800 text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'} ${isAutoConfig && selectedBoomLen === len ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}> {len} </button> 
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 4. BLOC CONTREPOIDS */}
                                            {machine.hasCounterweights && (
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Contrepoids (t)</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {machine.counterweights.map(cwt => ( 
                                                            <button key={cwt} onClick={() => { setSelectedCwt(cwt); setIsAutoConfig(false); }} className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedCwt === cwt ? 'bg-brand-red text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'} ${isAutoConfig && selectedCwt === cwt ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}> {cwt} </button> 
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* 5. BLOC ACCESSOIRE / OUTIL */}
                                    {machine.hasTools && machine.tools && machine.tools.length > 0 && (
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block flex items-center gap-2"><Anchor size={12}/> Accessoire / Outil</label>
                                            <div className="flex flex-wrap gap-2">
                                                {machine.tools.map(tool => ( <button key={tool} onClick={() => setSelectedTool(tool)} className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedTool === tool ? 'bg-[#004e98] text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'}`}> {tool} </button> ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* --- COLONNE DE DROITE (Graphique et Statut) --- */}
                <div className="lg:col-span-8 space-y-6">
                    <div className={`relative rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row ${bannerBg}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-3 ${bannerBorder}`}></div>
                        <div id="tour-status-card" className="p-6 pl-9 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className={`text-2xl font-bold uppercase mb-1 flex items-center gap-2 ${titleColor}`}>
                                        {mainTitle} {titleIcon}
                                    </h2>
                                    <p className={`font-bold text-sm ${mainTextColor}`}>{statusMessage}</p>
                                    <p className={`text-xs font-medium mt-1 pr-4 max-w-sm ${subTextColor}`}>{statusSubMessage}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-slate-800">{safeLoad/1000} <span className="text-xl font-semibold">t</span></div>
                                    <div className="text-xs text-slate-500 mt-1">Max de cette configuration à {inputDist}m</div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="flex gap-2 items-end mb-2"><span className="text-sm font-bold text-black">Utilisation {Math.round(usagePercent)}%</span></div>
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden"><div style={{width: `${Math.min(100, usagePercent)}%`}} className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}></div></div>
                            </div>
                        </div>
                    </div>

                    {machine && machine.mode === 'multi_chart' && (
                        <div id="tour-Configuration" className={`flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-6 bg-slate-50 border-l-4 p-3 lg:p-4 rounded-r-xl shadow-sm mb-6 transition-colors ${isAutoConfig ? 'border-[#004e98]' : 'border-slate-400'}`}>
                            
                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <div className={`bg-white p-2 rounded-full shadow-sm transition-colors ${isAutoConfig ? 'text-[#004e98]' : 'text-slate-500'}`}>
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm lg:text-base">
                                        {isAutoConfig ? "Configuration Recommandée" : "Configuration Manuelle"}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        {isAutoConfig 
                                            ? "L'algorithme a ajusté la grue pour ce levage." 
                                            : "Vous avez forcé les paramètres de la grue."}
                                    </p>
                                </div>
                            </div>
                    
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:flex gap-2 w-full lg:w-auto lg:ml-auto">
                                
                                {machine?.mode === 'multi_chart' && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-0.5 text-center">Flèche</span>
                                        <span className={`font-black text-sm md:text-base text-center whitespace-nowrap ${isAutoConfig ? 'text-[#004e98]' : 'text-slate-700'}`}>
                                            {selectedBoomLen || '0'} m
                                        </span>
                                    </div>
                                )}
                    
                                {machine?.hasCounterweights && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-0.5 text-center">Contrepoids</span>
                                        <span className={`font-black text-sm md:text-base text-center whitespace-nowrap ${isAutoConfig ? 'text-[#004e98]' : 'text-slate-700'}`}>
                                            {selectedCwt || '0'} t
                                        </span>
                                    </div>
                                )}
                    
                                {machine?.category !== 'telehandler' && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-0.5 text-center">Moufle</span>
                                        <span className={`font-black text-sm md:text-base text-center whitespace-nowrap ${isAutoConfig ? 'text-[#004e98]' : 'text-slate-700'}`}>
                                            {currentMoufle > 0 ? currentMoufle.toFixed(2) + ' t' : '---'}
                                        </span>
                                    </div>
                                )}

                                <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center shadow-sm">
                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mb-0.5 text-center">
                                        {machine?.category === 'telehandler' ? 'Accessoire' : 'Élingues'}
                                    </span>
                                    <span className={`font-black text-sm md:text-base text-center whitespace-nowrap ${isAutoConfig ? 'text-[#004e98]' : 'text-slate-700'}`}>
                                        {displayAccessoryMassT > 0 ? displayAccessoryMassT.toFixed(2) + ' t' : '---'}
                                    </span>
                                </div>
                    
                            </div>
                        </div>
                    )}
                    <GraphChart2D 
                        machine={machine}
                        inputDist={inputDist}
                        inputHeight={inputHeight}
                        selectedBoomLen={selectedBoomLen}
                        selectedTool={selectedTool}
                        isSafe={isSafe}
                        isAngleWarning={is80PercentWarning}
                        badgeText={badgeText}
                        badgeBg={badgeBg}
                    />
                </div>
            </div>
        </div>
    );
};
