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

// --- MOTEUR DE CALCUL (Remplacement de calculateMachineCapacity) ---
const CraneCalculator = {
    getCapacity: (machine, dist, height, boom, cwt, tool) => {
        if (!machine) return 0;
        
        // 1. Limites physiques
        if (dist > machine.maxReach + 2) return 0;

        // 2. Mode GRUES MOBILES (Abaques courbes)
        if (machine.mode === 'multi_chart') {
            const reqReachSq = (dist * dist) + (height * height);
            if (reqReachSq > (boom * boom) + 0.1) return 0; 

            let points = [];
            if (machine.hasCounterweights && cwt) {
                points = machine.charts[cwt]?.[boom]?.std;
            } else {
                points = machine.charts[boom]?.std;
            }

            if (!points || points.length === 0) return 0;

            // --- CORRECTION : Tolérance augmentée à 0.1 (10cm) pour capter le 60m pile ---
            const exactPoint = points.find(p => Math.abs(p.d - dist) <= 0.1);
            if (exactPoint) return Math.floor(exactPoint.l * 1000);

            // Interpolation
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];

                if (dist > p1.d && dist < p2.d) {
                    // Sécurité "Trou" (>10m d'écart = vide)
                    if ((p2.d - p1.d) > 10) return 0;

                    const slope = (p2.l - p1.l) / (p2.d - p1.d);
                    const interpolated = p1.l + slope * (dist - p1.d);
                    return Math.floor(interpolated * 1000);
                }
            }
            return 0; 
        }

        // 3. Mode TÉLESCOPIQUES (Zones)
        if (machine.mode === 'zone' || machine.mode === 'zone_multi_tool') {
            let activeZones = [];
            if (machine.mode === 'zone_multi_tool') {
                if (tool && machine.charts[tool]) activeZones = machine.charts[tool].zones;
                else if (machine.tools?.length > 0 && machine.charts[machine.tools[0]]) {
                    activeZones = machine.charts[machine.tools[0]].zones;
                }
            } else {
                activeZones = machine.zones;
            }

            let foundLoad = 0;
            if (activeZones) {
                for (let zone of activeZones) {
                    if (typeof isPointInPolygon === 'function' && isPointInPolygon(dist, height, zone.points)) {
                        if (zone.load > foundLoad) foundLoad = zone.load;
                    }
                }
            }
            return foundLoad;
        }
        return 0;
    }
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
         
         // 1. Ajout du Titre (Nom de la machine)
         ws_data.push([`Abaque : ${machine.name}`, "", ""]);
         // 2. Ajout d'une ligne vide pour aérer la présentation
         ws_data.push([]); 

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

         // 3. Fusion des cellules A1, B1 et C1
         // s = start (début), e = end (fin), r = row (ligne), c = col (colonne). (L'index commence à 0)
         if(!ws['!merges']) ws['!merges'] = [];
         ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });

         XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    if (machine.mode === 'multi_chart') {
        if(machine.hasCounterweights) { machine.counterweights.forEach(cwt => { createSheetForData(machine.charts[cwt], cwt); }); } 
        else { createSheetForData(machine.charts, "Abaque"); }
    } else if (machine.mode === 'zone' || machine.mode === 'zone_multi_tool') {
        let ws_data = [
            [`Abaque : ${machine.name}`, "", ""], // Ligne 1 (Titre)
            [], // Ligne 2 (Vide)
            ["Zone ID", "Charge Max (kg)"] // Ligne 3 (Entêtes)
        ];
        
        let zonesToExport = machine.zones || [];
        if (machine.mode === 'zone_multi_tool' && machine.tools?.length > 0) {
            zonesToExport = machine.charts[machine.tools[0]].zones; 
        }

        zonesToExport.forEach(z => { ws_data.push([z.id, z.load]); });
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Fusion des cellules A1:C1 pour le mode zone
        if(!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });

        XLSX.utils.book_append_sheet(wb, ws, "Zones");
    }
    
    // Nettoyage du nom de fichier pour éviter les caractères spéciaux
    const safeName = machine.name.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `${safeName}_abaque_${formatDateTime()}.xlsx`);
};

const generatePredimPDF = (machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt, selectedBoomLen, chantierName) => {
    if (!machine) return;
    const doc = new jsPDF('landscape'); // Format Paysage pour coller à la maquette
    
    // --- EN-TÊTE ---
    // Ajout du vrai logo
    doc.addImage('logo.png', 'PNG', 14, 10, 105, 32);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Pré dimensionnement\npour le chantier ${chantierName || "Non renseigné"}`, 140, 18, { align: "center" });
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Généré le : ${new Date().toLocaleDateString()}`, 270, 18, { align: "right" });
    doc.line(14, 35, 280, 35); // Ligne de séparation

    // --- COLONNE GAUCHE (Besoin de levage) ---
    let yLeft = 45;
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Besoin de levage identifié", 14, yLeft); yLeft += 8;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    const loadTons = (inputLoad / 1000).toFixed(2);
    doc.text(`Masse à lever : ${loadTons} tonnes`, 14, yLeft); yLeft += 6;
    doc.text(`Portée : ${inputDist} m`, 14, yLeft); yLeft += 6;
    if (machine.category === 'telehandler') {
        doc.text(`Hauteur (Télescopique) : ${inputHeight} m`, 14, yLeft);
    }

    // --- COLONNE DROITE (Engin) ---
    let yRight = 45;
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Engin pré dimensionné", 140, yRight); yRight += 8;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(`Nom engin : ${machine.name}`, 140, yRight); yRight += 6;
    doc.text(`Famille d'engin : ${machine.category}`, 140, yRight); yRight += 6;
    doc.text(`Capacité max : ${machine.maxLoad / 1000} tonnes`, 140, yRight); yRight += 6;
    doc.text(`Portée max : ${machine.maxReach} m`, 140, yRight); yRight += 6;
    doc.text(`Hauteur max : ${machine.maxHeight} m`, 140, yRight); yRight += 6;
    if (machine.hasCounterweights && currentCwt) {
        doc.text(`Masse contre-poids : ${currentCwt} t`, 140, yRight);
    }

    // --- SECTION RÉSULTAT (Bas de page gauche) ---
    let yRes = 130;
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Résultat du prédimensionnement", 14, yRes); yRes += 8;
    doc.setFontSize(12); doc.setFont("helvetica", "normal");
    
    if (machine.mode === 'multi_chart' && selectedBoomLen) {
        doc.text(`Longueur de flèche : ${selectedBoomLen} m`, 14, yRes); yRes += 7;
    }
    doc.text(`Capacité à cette portée : ${(safeLoad / 1000).toFixed(2)} tonnes`, 14, yRes); yRes += 7;
    doc.text(`Taux d'utilisation : ${Math.round((inputLoad / safeLoad) * 100)} %`, 14, yRes); yRes += 7;
    
    doc.setFont("helvetica", "bold");
    if (isSafe) {
        doc.setTextColor(22, 163, 74); // Vert
        doc.text("Levage autorisé : OUI", 14, yRes);
    } else {
        doc.setTextColor(220, 38, 38); // Rouge
        doc.text("Levage autorisé : NON", 14, yRes);
    }
    doc.setTextColor(0,0,0); // Reset

    // --- ABAQUE COMPLET EN TABLEAU (A droite) ---
    if (machine.mode === 'multi_chart' && selectedBoomLen) {
        const boomLengths = machine.boomLengths;
        const cwtData = machine.hasCounterweights ? machine.charts[currentCwt] : machine.charts;

        if (cwtData) {
            // 1. Collecter et trier toutes les portées (rayons) existantes pour ce contrepoids
            let allRadii = new Set();
            boomLengths.forEach(len => {
                if (cwtData[len] && cwtData[len].std) {
                    cwtData[len].std.forEach(p => allRadii.add(p.d));
                }
            });
            const sortedRadii = Array.from(allRadii).sort((a,b) => a - b);

            // 2. Trouver la portée la plus proche (ou immédiatement supérieure) pour la mettre en évidence
            let targetRadius = sortedRadii.find(r => r >= inputDist);
            if (targetRadius === undefined && sortedRadii.length > 0) targetRadius = sortedRadii[sortedRadii.length - 1];

            // 3. Construction des entêtes et des lignes du tableau
            const tableHead = [["Portée", ...boomLengths.map(b => `${b}m`)]];
            const tableBody = sortedRadii.map(r => {
                let row = [r];
                boomLengths.forEach(len => {
                    const pts = cwtData[len]?.std || [];
                    const pt = pts.find(p => p.d === r);
                    row.push(pt ? pt.l : "-");
                });
                return row;
            });

            // 4. Index de la colonne cible (+1 car la colonne 0 est la portée)
            const targetBoomIndex = boomLengths.indexOf(selectedBoomLen) + 1;

            doc.setFontSize(10); doc.setFont("helvetica", "bold");
            doc.text(`Extrait de l'abaque (CWT: ${currentCwt ? currentCwt+'t' : 'N/A'})`, 140, 95);

            // 5. Génération du tableau avec coloration dynamique de la cellule
            doc.autoTable({
                startY: 100,
                margin: { left: 140, bottom: 10 },
                tableWidth: 140, // Occupe la moitié droite du document PDF (Paysage)
                head: tableHead,
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [0, 78, 152], fontSize: 6, halign: 'center', textColor: 255 },
                styles: { fontSize: 6, cellPadding: 1, halign: 'center', textColor: 40 },
                didParseCell: function (data) {
                    if (data.section === 'body') {
                        const isTargetCol = data.column.index === targetBoomIndex;
                        const isTargetRow = data.row.raw[0] === targetRadius;

                        // Croisement exact (Cellule Cible) => Fond ROUGE, Texte BLANC
                        if (isTargetCol && isTargetRow) {
                            data.cell.styles.fillColor = [220, 38, 38]; 
                            data.cell.styles.textColor = [255, 255, 255];
                            data.cell.styles.fontStyle = 'bold';
                        }
                        // Colonne de la flèche sélectionnée => Gris très clair
                        else if (isTargetCol) {
                            data.cell.styles.fillColor = [241, 245, 249]; 
                        }
                        // Ligne de la portée actuelle => Gris très clair
                        else if (isTargetRow) {
                            data.cell.styles.fillColor = [241, 245, 249]; 
                        }
                    }
                }
            });
        }
    } else if (machine.mode === 'zone') {
         doc.setFontSize(10); doc.setFont("helvetica", "italic");
         doc.text("[Abaque par zones couleur - Voir application pour le détail visuel]", 140, 100);
    }

    // Nom propre pour l'export
    const safeChantier = (chantierName || "Chantier").replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Predim_${safeChantier}_${formatDateTime()}.pdf`);
};

const CMCLogo = () => (
    <img 
        src="logo.png" 
        alt="Chantiers Modernes Construction" 
        className="h-18 object-contain cursor-pointer hover:opacity-80 transition-opacity" 
    />
);

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
            selectedBoomLen: bestBoom
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
                                <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 px-2 py-1 bg-slate-100 rounded">Source: {suggestedCrane.source === 'external' ? 'BDD Externe' : (suggestedCrane.source === 'system' ? 'Système' : 'Locale')}</div>
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

const PredimModal = ({ machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt, selectedBoomLen, onClose }) => {
    const [chantierName, setChantierName] = useState("");

    const handleDownload = () => {
        if (!chantierName.trim()) { alert("Veuillez indiquer un nom de chantier."); return; }
        generatePredimPDF(machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt, selectedBoomLen, chantierName);
    };

    const handleSendMail = () => {
        if (!chantierName.trim()) { alert("Veuillez indiquer un nom de chantier."); return; }
        
        const subject = encodeURIComponent(`[${chantierName}] Prédimensionnement ${machine.category === 'telehandler' ? 'Télescopique' : 'Grue'} - ${new Date().toLocaleDateString()}`);
        const body = encodeURIComponent(
            `Bonjour l'équipe,\n\nVeuillez trouver ci-joint le prédimensionnement de levage pour le chantier : ${chantierName}.\n\n` +
            `Détails rapides :\n` +
            `- Engin : ${machine.name}\n` +
            `- Masse : ${inputLoad / 1000} t\n` +
            `- Portée : ${inputDist} m\n` +
            `- Statut : ${isSafe ? 'CONFORME' : 'NON CONFORME'}\n\n` +
            `⚠️ N'oubliez pas d'insérer le PDF téléchargé en pièce jointe de cet e-mail !\n\nCordialement.`
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
    const [isUploading, setIsUploading] = useState(false);

    // Initialisation
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
        if (machine.mode === 'multi_chart') {
            let minR = Infinity;
            const cwts = machine.hasCounterweights ? machine.counterweights : [null];
            cwts.forEach(c => {
                machine.boomLengths.forEach(b => {
                    const pts = machine.hasCounterweights ? machine.charts[c]?.[b]?.std : machine.charts[b]?.std;
                    if (pts && pts.length > 0 && pts[0].d < minR) minR = pts[0].d;
                });
            });
            return minR === Infinity ? 0 : minR;
        }
        return 0;
    }, [machine]);

    const handleCategoryChange = (newCat) => {
        if (newCat !== category) {
            setCategory(newCat);
            
            // Si on clique sur "Engin Télescopique"
            if (newCat === 'telehandler') {
                setInputLoad(1000);  // Masse par défaut : 2 tonnes (2000 kg)
                setInputDist(3);     // Portée par défaut : 3 m
                setInputHeight(2);   // Hauteur par défaut : 4 m
            } 
            // Si on clique sur "Grue Mobile" ou "Grue Treillis"
            else {
                setInputLoad(5000);  // Masse par défaut : 1 tonne (1000 kg)
                setInputDist(5);    // Portée par défaut : 10 m
                setInputHeight(2);   // Hauteur par défaut : 2 m
            }
        }
    };

    // Params initiaux et Clamp par défaut
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
            if (inputDist > machine.maxReach + 2) setInputDist(machine.maxReach > 0 ? machine.maxReach : 5);
            // NOUVEAU : On force le curseur sur le min de l'abaque par défaut
            else if (inputDist < absoluteMinReach) setInputDist(absoluteMinReach);

            if (inputHeight > machine.maxHeight + 5) setInputHeight(machine.maxHeight > 0 ? machine.maxHeight : 2);
        }
    }, [machine, absoluteMinReach]);

    // --- LOGIQUE AUTO CONFIG TOTALE (Flèche + CWT + Angle 35°) ---
    useEffect(() => {
        if (isAutoConfig && machine && machine.mode === 'multi_chart') {
            const sortedCwts = machine.hasCounterweights ? [...machine.counterweights].sort((a, b) => parseFloat(a) - parseFloat(b)) : [null];
            const sortedBooms = [...machine.boomLengths].sort((a, b) => parseFloat(a) - parseFloat(b));

            let bestCwt = null; 
            let bestBoom = null;
            let found = false;

            for (const cwt of sortedCwts) {
                for (const boom of sortedBooms) {
                    if (boom <= inputDist) continue; 

                    // NOUVEAU : Calcul Trigonométrique de l'angle (Arccos(Adjacent/Hypoténuse))
                    const angleRad = Math.acos(inputDist / boom);
                    const angleDeg = angleRad * (180 / Math.PI);
                    
                    // Contrainte stricte : on ignore cette flèche si elle est à moins de 35°
                    if (angleDeg < 45) continue;

                    const tipH = Math.sqrt(Math.pow(boom, 2) - Math.pow(inputDist, 2));
                    if (tipH < inputHeight) continue; 

                    const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, boom, cwt, selectedTool);
                    
                    if (cap >= inputLoad - 1) { 
                        bestCwt = cwt; 
                        bestBoom = boom;
                        found = true; 
                        break; 
                    }
                }
                if (found) break; 
            }

            if (!found && sortedCwts.length > 0 && sortedBooms.length > 0) { 
                bestCwt = sortedCwts[sortedCwts.length - 1];
                bestBoom = sortedBooms[sortedBooms.length - 1]; 
            }
            if (bestCwt && bestCwt !== selectedCwt) { setSelectedCwt(bestCwt); }
            if (bestBoom && bestBoom !== selectedBoomLen) { setSelectedBoomLen(bestBoom); }
        }
    }, [isAutoConfig, inputLoad, inputDist, inputHeight, machine]);

    // --- CAPACITÉ MAX ABSOLUE (Purement liée à la portée, ignore la hauteur) ---
    // --- CAPACITÉ MAX ABSOLUE (Fidèle aux contraintes de l'algorithme : Angle 45° et Hauteur) ---
    const absoluteMaxCapAtDist = useMemo(() => {
        if (!machine) return 0;
        let maxCap = 0;
        
        if (machine.mode === 'multi_chart') {
            const cwts = machine.hasCounterweights ? machine.counterweights : [null];
            
            // PASSE 1 : On cherche la capacité max en respectant l'angle de 45° ET la hauteur
            cwts.forEach(c => {
                machine.boomLengths.forEach(b => {
                    if (b <= inputDist) return; // Impossible géométriquement
                    
                    // Vérification de l'angle (45°)
                    const angleDeg = Math.acos(inputDist / b) * (180 / Math.PI);
                    if (angleDeg < 45) return; // On ignore les flèches trop couchées
                    
                    // Vérification de la hauteur
                    const tipH = Math.sqrt(Math.pow(b, 2) - Math.pow(inputDist, 2));
                    if (tipH < inputHeight) return; // On ignore les flèches trop courtes
                    
                    const cap = CraneCalculator.getCapacity(machine, inputDist, inputHeight, b, c, selectedTool);
                    if (cap > maxCap) maxCap = cap;
                });
            });

            // PASSE 2 (Sécurité) : Si aucune flèche ne valide la hauteur, on cherche quand même un max 
            // en respectant au moins l'angle de 45° pour ne pas bloquer le curseur à 0.
            if (maxCap === 0) {
                 cwts.forEach(c => { 
                     machine.boomLengths.forEach(b => { 
                         if (b <= inputDist) return;
                         const angleDeg = Math.acos(inputDist / b) * (180 / Math.PI);
                         if (angleDeg < 45) return;
                         
                         const cap = CraneCalculator.getCapacity(machine, inputDist, 0, b, c, selectedTool); 
                         if (cap > maxCap) maxCap = cap; 
                     }); 
                 });
            }
        } else {
            let activeZones = [];
            if (machine.mode === 'zone_multi_tool' && selectedTool && machine.charts[selectedTool]) {
                activeZones = machine.charts[selectedTool].zones;
            } else if (machine.zones) {
                activeZones = machine.zones;
            }
            activeZones.forEach(z => {
                let minX = Infinity, maxX = -Infinity;
                z.points.forEach(p => {
                    if (p[0] < minX) minX = p[0];
                    if (p[0] > maxX) maxX = p[0];
                });
                if (inputDist >= minX && inputDist <= maxX) {
                    if (z.load > maxCap) maxCap = z.load;
                }
            });
        }
        return Math.floor(maxCap);
    }, [machine, inputDist, inputHeight, selectedTool]);

    // Calcul Final de la config actuelle (lui prend bien en compte la hauteur !)
    const allowedLoad = CraneCalculator.getCapacity(machine, inputDist, inputHeight, selectedBoomLen, selectedCwt, selectedTool);
    const safeLoad = Math.floor(allowedLoad); 
    
    // NOUVEAU : On applique strictement la capacité max trouvée au curseur (finis les sauts étranges)
    const sliderMaxMass = absoluteMaxCapAtDist > 0 ? absoluteMaxCapAtDist : (machine?.maxLoad || 1000);

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
    const isLoadSafe = inputLoad <= safeLoad && safeLoad > 0;
    const isSafe = isLoadSafe && isHeightValid;
    const usagePercent = safeLoad > 0 ? (inputLoad / safeLoad) * 100 : (inputLoad > 0 ? 110 : 0);

    const currentStepDist = machine?.category === 'telehandler' ? 0.25 : 0.5;

    // --- PORTÉE MINIMALE DE LA CONFIG ACTUELLE ---
    const currentMinReach = useMemo(() => {
        if (machine?.mode === 'multi_chart') {
            const pts = machine.hasCounterweights ? machine?.charts[selectedCwt]?.[selectedBoomLen]?.std : machine?.charts[selectedBoomLen]?.std;
            if (pts && pts.length > 0) return pts[0].d;
        }
        return 0;
    }, [machine, selectedCwt, selectedBoomLen]);

    // --- GESTION DES MESSAGES SIMPLIFIÉS ---
    let statusMessage = "Configuration conforme";
    let statusSubMessage = "Le levage peut être effectué en sécurité.";
    if (!isSafe) {
        if (!isHeightValid) {
            statusMessage = "Hauteur hors abaque";
            if (machine?.mode === 'multi_chart') { statusSubMessage = "La flèche est trop courte. Veuillez réduire la portée ou la hauteur."; } 
            else { statusSubMessage = `La hauteur dépasse la limite absolue de l'engin (${machine?.maxHeight} m).`; }
        } else if (safeLoad === 0) {
            statusMessage = "Portée hors abaque";
            if (machine?.mode === 'multi_chart' && inputDist < currentMinReach) {
                // Si on est en "Auto" et que l'utilisateur force une valeur en dessous du min absolu, on suggère l'absolu. Sinon le min de la flèche.
                const targetReach = (isAutoConfig && inputDist < absoluteMinReach) ? absoluteMinReach : currentMinReach;
                statusSubMessage = `Aucune capacité définie à cette portée. Veuillez augmenter la portée à ${targetReach} m.`;
            } else {
                statusSubMessage = "Aucune capacité définie à cette portée. Veuillez réduire la portée.";
            }
        } else if (inputLoad > safeLoad) {
            statusMessage = "Capacité dépassée";
            statusSubMessage = `Réduisez la masse (Max autorisé : ${(safeLoad/1000).toFixed(2)} t).`;
        }
    }

    const handleExcelUpload = (e) => { 
        const file = e.target.files[0]; if (!file) return; setIsUploading(true); const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result; const wb = XLSX.read(bstr, { type: 'binary' });
                let isMultiSheet = wb.SheetNames.length > 1; let useCwtMode = isMultiSheet;
                if (!useCwtMode) {
                    const firstSheet = wb.SheetNames[0].trim();
                    const isGenericName = /^(sheet|feuille)\d+$/i.test(firstSheet);
                    const looksLikeCwt = /^(\d+(\.\d+)?)[tT]?$/.test(firstSheet);
                    if (!isGenericName && looksLikeCwt) { useCwtMode = true; }
                }
                let counterweights = []; let charts = {}; let boomLengthsGlobal = new Set(); let maxLoadFound = 0; let maxReachFound = 0;
                const parseSheet = (sheetName) => {
                     const ws = wb.Sheets[sheetName]; const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); if(data.length < 2) return null;
                     const headerRow = data[0]; const colToBoom = {}; const sheetCharts = {};
                     for (let c = 1; c < headerRow.length; c++) { const val = parseFloat(headerRow[c]); if (!isNaN(val)) { boomLengthsGlobal.add(val); colToBoom[c] = val; sheetCharts[val] = { std: [] }; } }
                     for (let r = 1; r < data.length; r++) {
                         const row = data[r]; const radius = parseFloat(row[0]);
                         if (!isNaN(radius)) {
                             if (radius > maxReachFound) maxReachFound = radius;
                             for (let c = 1; c < row.length; c++) { const loadVal = parseFloat(row[c]); const boomLen = colToBoom[c]; if (boomLen && !isNaN(loadVal)) { sheetCharts[boomLen].std.push({ d: radius, l: loadVal }); if (loadVal > maxLoadFound) maxLoadFound = loadVal; } }
                         }
                     }
                     return sheetCharts;
                };
                if (useCwtMode) { wb.SheetNames.forEach(sheetName => { const cwtData = parseSheet(sheetName); if(cwtData) { counterweights.push(sheetName); charts[sheetName] = cwtData; } }); } else { charts = parseSheet(wb.SheetNames[0]); }
                const boomLengths = Array.from(boomLengthsGlobal).sort((a,b)=>a-b);
                if (boomLengths.length === 0) throw new Error("Aucune colonne de flèche valide trouvée.");
                const newMachine = { id: "custom_" + Date.now(), source: "local", category: category, name: `${file.name.replace(/\.[^/.]+$/, "")}`, type: "crane", mode: "multi_chart", maxLoad: maxLoadFound * 1000, maxReach: maxReachFound, maxHeight: Math.max(...boomLengths) + 2, hasTelescoping: false, hasCounterweights: useCwtMode, counterweights: useCwtMode ? counterweights : null, boomLengths: boomLengths, charts: charts, createdAt: new Date().toISOString(), isCustom: true };
                onSaveLocal([newMachine]); setSelectedMachineId(newMachine.id); alert("Machine importée !");
            } catch (error) { alert("Erreur import: " + error.message); } finally { setIsUploading(false); e.target.value = null; }
        }; reader.readAsBinaryString(file);
    };
    
    const downloadTemplate = () => { 
        const wb = XLSX.utils.book_new(); const sheets = [ { name: "0t", multiplier: 0.5 }, { name: "12t", multiplier: 0.8 }, { name: "24t", multiplier: 1.0 } ]; const baseData = [ ["Portée(m) \\ Flèche(m)", 10, 20, 30, 40], [3, 50, 40, null, null], [10, 20, 18, 15, 12], [30, null, null, 4, 3] ];
        sheets.forEach(sheet => { const data = baseData.map((row, i) => { if (i === 0) return row; return row.map((cell, j) => { if (j === 0 || cell === null) return cell; return Number((cell * sheet.multiplier).toFixed(1)); }); }); const ws = XLSX.utils.aoa_to_sheet(data); XLSX.utils.book_append_sheet(wb, ws, sheet.name); }); XLSX.writeFile(wb, "Modele_Import_MultiCwt.xlsx");
    };

    const GraphChart2D = () => {
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
        } else { 
            tipY = hookY; 
        }

        const gridStep = isTelehandler ? 1 : (maxX > 60 ? 10 : 5);
        let zonesToDraw = [];
        if (machine.mode === 'zone') zonesToDraw = machine.zones;
        else if (machine.mode === 'zone_multi_tool' && selectedTool && machine.charts[selectedTool]) zonesToDraw = machine.charts[selectedTool].zones;
        
        const statusColor = isSafe ? "#16a34a" : "#dc2626"; 
        const statusFill = isSafe ? "#22c55e" : "#ef4444";

        return (
        <div className="w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm relative">
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
                    let centerX = z.points.reduce((sum, p) => sum + p[0], 0) / z.points.length;
                    let centerY = z.points.reduce((sum, p) => sum + p[1], 0) / z.points.length;
                    return ( 
                        <g key={z.id}>
                            <path d={`M ${scaleX(z.points[0][0])} ${scaleY(z.points[0][1])}` + z.points.slice(1).map(p => ` L ${scaleX(p[0])} ${scaleY(p[1])}`).join("") + " Z"} fill={z.color} stroke={z.borderColor || '#ffffff'} strokeWidth="1.5" strokeLinejoin="round" />
                            {z.points.length > 2 && (<text x={scaleX(centerX)} y={scaleY(centerY)} fontSize="11" fontWeight="bold" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" style={{textShadow: '0px 0px 3px rgba(0,0,0,0.5)'}}>{z.load/1000}t</text>)}
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

                <circle cx={hookX} cy={hookY} r="6" fill={statusFill} stroke="#0f172a" strokeWidth="3" className="transition-all duration-300 ease-out" />
                
                <text x={width/2} y={height-10} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">Portée (m)</text>
                <text x={15} y={height/2} textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`} fontSize="12" fontWeight="600" fill="#334155">Hauteur (m)</text>
            </svg>
            
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${isSafe ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}> 
                {isSafe ? 'ZONE SÉCURISÉE' : (isHeightValid ? 'SURCHARGE' : 'HAUTEUR IMPOSSIBLE')} 
            </div>
        </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
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
                    onClose={() => setIsPredimModalOpen(false)}
                />
            )}

            <div className="flex flex-wrap justify-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
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
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#004e98]"></div>
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Truck size={18} className="text-[#004e98]"/> Choix de l'engin</h3><button onClick={() => setShowDbManager(true)} className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center gap-1"><Database size={12}/> Gérer Locale</button></div>
                        <div className="mb-4">
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
                                <button onClick={() => exportCraneExcel(machine)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-2 rounded border border-slate-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Abaque.xlsx</button>
                                <button onClick={() => setIsPredimModalOpen(true)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold py-2 px-2 rounded border border-red-200 flex items-center justify-center gap-1 transition-colors"><FileText size={14}/> Prédimensionnement</button>
                            </div>
                        )}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-blue-800 flex items-center gap-1"><Database size={12}/> Import Fichier Spécifique</span><button onClick={downloadTemplate} className="text-[10px] text-blue-600 underline flex items-center gap-1 hover:text-blue-800"><Download size={10}/> Modèle Multi-Onglet</button></div>
                            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-blue-200 border-dashed rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                                {isUploading ? <span className="text-xs font-bold text-blue-600 animate-pulse">Traitement...</span> : ( <> <Upload size={20} className="text-blue-400 mb-1" /> <span className="text-[10px] text-blue-500 font-semibold">Glisser fichier Excel</span> </> )}
                                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} disabled={isUploading} />
                            </label>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Calculator size={18} className="text-[#004e98]"/> Calcul d'Adéquation</h3>
                        <div className="space-y-6">
                            
                            <CustomRange 
                                label="Masse de la Charge (t)" 
                                value={inputLoad/1000} 
                                min={0} 
                                max={sliderMaxMass/1000} 
                                step={0.05} 
                                unit="t" 
                                maxLabel={`Max engin: ${sliderMaxMass/1000}t`} 
                                onChange={(e) => setInputLoad(Math.round(parseFloat(e.target.value)*1000))} 
                            />
                            <CustomRange label="Portée (m)" value={inputDist} min={0} max={machine?.maxReach || 50} step={currentStepDist} unit="m" onChange={(e) => setInputDist(parseFloat(e.target.value))} />
                            
                            <div className="w-full">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-lg font-bold text-slate-700">Hauteur de levage</label>
                                    <span className="text-xl font-bold text-[#004e98]">{inputHeight} <span className="text-sm">m</span></span>
                                </div>
                                <div className="relative w-full h-8">
                                    <input type="range" min={0} max={machine?.maxHeight + 5} step={0.5} value={inputHeight} onChange={(e) => setInputHeight(parseFloat(e.target.value))} className="absolute w-full h-full z-20 opacity-0 cursor-pointer" />
                                    <div className="absolute top-1/2 left-0 w-full h-3 bg-slate-200 rounded-full -translate-y-1/2 overflow-hidden z-10 pointer-events-none">
                                        <div style={{ width: `${((inputHeight - 0) / (machine?.maxHeight + 5 - 0)) * 100}%` }} className="h-full bg-[#004e98] transition-all duration-100 ease-out"></div>
                                    </div>
                                    <div style={{ left: `calc(${((inputHeight - 0) / (machine?.maxHeight + 5 - 0)) * 100}% - 12px)` }} className="absolute top-1/2 w-6 h-6 bg-[#004e98] border-2 border-white rounded-full shadow-md -translate-y-1/2 z-10 pointer-events-none transition-all duration-100 ease-out"></div>
                                </div>
                            </div>

                            {machine && (machine.mode === 'multi_chart' || machine.hasTools) && (
                                <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-700 uppercase tracking-wide text-xs">Configuration de l'engin</h4>
                                        {machine.mode === 'multi_chart' && (
                                            <button onClick={() => setIsAutoConfig(!isAutoConfig)} className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors flex items-center gap-1 ${isAutoConfig ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}>
                                                {isAutoConfig ? <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> AUTO (ON)</span> : "MANUEL"}
                                            </button>
                                        )}
                                    </div>

                                    {machine.mode === 'multi_chart' && (
                                        <>
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Longueur Flèche (m)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {machine.boomLengths.map(len => ( 
                                                        <button key={len} onClick={() => { setSelectedBoomLen(len); setIsAutoConfig(false); }} className={`px-3 py-1 text-xs font-bold rounded shadow-sm transition-all ${selectedBoomLen === len ? 'bg-slate-800 text-white transform scale-105' : 'bg-white text-slate-600 hover:bg-slate-200'} ${isAutoConfig && selectedBoomLen === len ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}> {len} </button> 
                                                    ))}
                                                </div>
                                            </div>
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
                                    {machine.hasTools && machine.tools && (
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
                
                <div className="lg:col-span-8 space-y-6">
                    <div className={`relative rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row ${isSafe ? 'bg-[#ecfdf5]' : 'bg-red-50'}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-3 ${isSafe ? 'bg-[#10b981]' : 'bg-red-500'}`}></div>
                        <div className="p-6 pl-9 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className={`text-2xl font-bold uppercase mb-1 ${isSafe ? 'text-[#065f46]' : 'text-red-800'}`}>
                                        {isSafe ? 'AUTORISÉ' : 'INTERDIT'}
                                    </h2>
                                    <p className={`font-bold text-sm ${isSafe ? 'text-[#047857]' : 'text-red-700'}`}>{statusMessage}</p>
                                    <p className={`text-xs font-medium mt-1 pr-4 max-w-sm ${isSafe ? 'text-[#065f46]' : 'text-red-600'}`}>{statusSubMessage}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-slate-800">{safeLoad/1000} <span className="text-xl font-semibold">t</span></div>
                                    <div className="text-xs text-slate-500 mt-1">Max de cette configuration à {inputDist}m</div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="flex gap-2 items-end mb-2"><span className="text-sm font-bold text-black">Utilisation {Math.round(usagePercent)}%</span></div>
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden"><div style={{width: `${Math.min(100, usagePercent)}%`}} className={`h-full rounded-full transition-all duration-500 ease-out ${isSafe ? 'bg-[#10b981]' : 'bg-red-500'}`}></div></div>
                            </div>
                        </div>
                    </div>

                    {machine && machine.mode === 'multi_chart' && (
                        <div className="bg-white border-l-4 border-l-[#004e98] border-y border-r border-slate-200 rounded-r-xl p-4 flex items-center justify-between shadow-sm animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-full text-[#004e98]">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Configuration {isAutoConfig ? 'Recommandée' : 'Manuelle'}</h4>
                                    <p className="text-xs text-slate-500">
                                        {isAutoConfig ? "L'algorithme a ajusté la grue pour ce levage." : "Vous avez forcé ces paramètres."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Flèche</div>
                                    <div className="font-bold text-[#004e98]">{selectedBoomLen} m</div>
                                </div>
                                {machine.hasCounterweights && (
                                    <div className="text-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                                        <div className="text-[10px] uppercase font-bold text-slate-400">Contrepoids</div>
                                        <div className="font-bold text-[#004e98]">{selectedCwt} t</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
    { icon: "👋", title: "Bienvenue !", desc: "Levage Sécurisé : Votre assistant digital pour prédimensionner vos levages sur chantier." },
    { icon: "🏗️", title: "Choix de l'engin", desc: "Sélectionnez votre grue parmi la base de données système ou importez vos propres modèles via Excel." },
    { icon: "📐", title: "Configuration", desc: "Définissez les paramètres du levage (Masse, Portée). L'appli vous donneras automatiquement la flèche et le contrepoids adapté" },
    { icon: "✅", title: "Vérification", desc: "Visualisez instantanément si le levage est autorisé (Vert) ou interdit (Rouge) grâce aux abaques intégrés." },
    { icon: "📄", title: "Prédimensionnement", desc: "Générez des rapports de prédimensionnement PDF prêts à être envoyé pour une vérification." },
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
