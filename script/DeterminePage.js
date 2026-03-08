const DeterminePage = ({ allMachines }) => {
    const [mass, setMass] = useState(0); const [unit, setUnit] = useState('kg');
    const [distance, setDistance] = useState(0); const [height, setHeight] = useState(5);
    const [maxUsagePercent, setMaxUsagePercent] = useState(80);
    const [progress, setProgress] = useState(0); const [result, setResult] = useState(null); const [suggestedCrane, setSuggestedCrane] = useState(null);
    
    // NOUVEAU : État pour gérer la modale de Prédimensionnement
    const [modalData, setModalData] = useState(null);

    const performAutoSelect = (targetMassKg, targetDist, targetHeight) => {
        const candidates = [];

        const categoryPriority = {
            'telehandler': 1,     
            'mobile_crane': 2,    
            'crawler_crane': 3    
        };

        allMachines.forEach(m => {
            let maxCapMachine = 0;
            
            if (m.mode === 'multi_chart') {
                const booms = m.boomLengths || [];
                const cwts = m.hasCounterweights ? m.counterweights : [null];
                cwts.forEach(c => {
                    booms.forEach(b => {
                        const val = CraneCalculator.getCapacity(m, targetDist, targetHeight, b, c, null);
                        if(val > maxCapMachine) maxCapMachine = val;
                    });
                });
            } else {
                maxCapMachine = CraneCalculator.getCapacity(m, targetDist, targetHeight, null, null, null);
            }

            const usage = maxCapMachine > 0 ? (targetMassKg / maxCapMachine) * 100 : 999;
            
            if (maxCapMachine >= targetMassKg && usage <= maxUsagePercent) { 
                candidates.push({ 
                    machine: m, 
                    capacity: maxCapMachine, 
                    usage: usage,
                    priority: categoryPriority[m.category] || 99
                }); 
            }
        });

        candidates.sort((a, b) => {
            if (a.priority !== b.priority) { return a.priority - b.priority; }
            return a.capacity - b.capacity;
        });

        if (candidates.length > 0) { 
            const best = candidates[0].machine; 
            setSuggestedCrane(best); 
            localStorage.setItem(SELECTED_CRANE_KEY, JSON.stringify(best)); 
        } 
        else { 
            setSuggestedCrane(null); 
            localStorage.removeItem(SELECTED_CRANE_KEY); 
        }
    };

    useEffect(() => {
        if (mass > 0 && distance > 0) {
            setProgress(0); setResult(null); setSuggestedCrane(null);
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) { 
                        clearInterval(interval); 
                        const massInTons = unit === 'kg' ? mass / 1000 : mass; 
                        const massKg = unit === 'kg' ? mass : mass * 1000; 
                        const moment = massInTons * distance; 
                        setResult({ tons: massInTons, moment: moment.toFixed(1) }); 
                        performAutoSelect(massKg, distance, height); 
                        return 100; 
                    } 
                    return p + 4;
                });
            }, 20); return () => clearInterval(interval);
        } else { setResult(null); setProgress(0); setSuggestedCrane(null); }
    }, [mass, unit, distance, height, maxUsagePercent, allMachines]); 

    // NOUVEAU : Fonction pour ouvrir le prédimensionnement avec la meilleure config
    const openPredimModal = () => {
        if (!suggestedCrane) return;
        
        const targetMassKg = unit === 'kg' ? mass : mass * 1000;
        let bestCwt = null;
        let bestBoom = null;
        let finalCap = 0;
        let found = false;

        if (suggestedCrane.mode === 'multi_chart') {
            const sortedCwts = suggestedCrane.hasCounterweights ? [...suggestedCrane.counterweights].sort((a, b) => parseFloat(a) - parseFloat(b)) : [null];
            const sortedBooms = [...suggestedCrane.boomLengths].sort((a, b) => parseFloat(a) - parseFloat(b));

            for (const cwt of sortedCwts) {
                for (const boom of sortedBooms) {
                    if (boom <= distance) continue;
                    
                    const angleRad = Math.acos(distance / boom);
                    const angleDeg = angleRad * (180 / Math.PI);
                    if (angleDeg < 35) continue;

                    const tipH = Math.sqrt(Math.pow(boom, 2) - Math.pow(distance, 2));
                    if (tipH < height) continue;

                    const cap = CraneCalculator.getCapacity(suggestedCrane, distance, height, boom, cwt, null);
                    
                    if (cap >= targetMassKg) {
                        bestCwt = cwt;
                        bestBoom = boom;
                        finalCap = cap;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }

            if (!found && sortedCwts.length > 0 && sortedBooms.length > 0) {
                bestCwt = sortedCwts[sortedCwts.length - 1];
                bestBoom = sortedBooms[sortedBooms.length - 1];
                finalCap = CraneCalculator.getCapacity(suggestedCrane, distance, height, bestBoom, bestCwt, null);
            }
        } else {
            finalCap = CraneCalculator.getCapacity(suggestedCrane, distance, height, null, null, null);
        }

        setModalData({
            machine: suggestedCrane,
            inputLoad: targetMassKg,
            inputDist: distance,
            inputHeight: height,
            isSafe: true, 
            safeLoad: finalCap,
            currentCwt: bestCwt,
            selectedBoomLen: bestBoom,
            currentMoufle: currentMoufle
        });
    };

    return (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start min-h-[60vh] animate-fade-in relative">
            
            {/* NOUVEAU : Affichage de la modale si les données sont prêtes */}
            {modalData && (
                <PredimModal 
                    machine={modalData.machine}
                    inputLoad={modalData.inputLoad}
                    inputDist={modalData.inputDist}
                    inputHeight={modalData.inputHeight}
                    isSafe={modalData.isSafe}
                    safeLoad={modalData.safeLoad}
                    currentCwt={modalData.currentCwt}
                    selectedBoomLen={modalData.selectedBoomLen}
                    currentMoufle={modalData.currentMoufle}
                    onClose={() => setModalData(null)}
                />
            )}

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
                                <h4 className="text-lg font-bold text-slate-800 mb-1">{suggestedCrane.name}</h4>
                                <p className="text-sm text-slate-500 mb-4">{suggestedCrane.category} • Max {suggestedCrane.maxLoad}kg</p>
                                <div className="flex gap-2">
                                    <button onClick={() => exportCraneExcel(suggestedCrane)} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold py-2 px-3 rounded border border-green-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Abaque Excel</button>
                                    
                                    {/* NOUVEAU BOUTON : Ouvre la modale de prédimensionnement */}
                                    <button onClick={openPredimModal} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2 px-3 rounded border border-red-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Prédimensionnement</button>
                                </div>
                            </div>
                        ) : ( <div className="text-center p-4 text-slate-500 italic text-sm">Aucun engin trouvé pour cette configuration (limite {maxUsagePercent}%).</div> )}
                    </div>
                )}
            </div>
        </div>
    );
};
