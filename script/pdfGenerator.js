const exportCraneExcel = (machine) => {
    if (!machine) return;
    const wb = XLSX.utils.book_new();

    // Nettoyeur de nom d'onglet (max 31 chars, pas de caractères interdits : \ / ? * [ ])
    const cleanSheetName = (name) => {
        return name.toString()
            .replace(/[\\/:\?\*\[\]]/g, "_")
            .substring(0, 31);
    };

    const createSheetForData = (chartData, sheetName) => {
         let ws_data = [];
         ws_data.push([`Abaque : ${machine.name}`]);
         const boomLengths = machine.boomLengths || [];
         const header = ["Portée(m) \\ Flèche(m)", ...boomLengths];
         ws_data.push(header);
         
         let allRadii = new Set();
         boomLengths.forEach(len => { 
             if (chartData && chartData[len]?.std) { 
                 chartData[len].std.forEach(p => allRadii.add(p.d)); 
             } 
         });
         const sortedRadii = Array.from(allRadii).sort((a,b) => a - b);
         
         sortedRadii.forEach(r => {
             let row = [r];
             boomLengths.forEach(len => {
                 const points = chartData ? (chartData[len]?.std || []) : [];
                 const p = points.find(pt => Math.abs(pt.d - r) < 0.1);
                 // Correction format : on utilise p.l brut pour éviter le 0.134
                 row.push(p ? p.l : null); 
             });
             ws_data.push(row);
         });
         
         const ws = XLSX.utils.aoa_to_sheet(ws_data);
         XLSX.utils.book_append_sheet(wb, ws, cleanSheetName(sheetName));
    };

    // 1. ABAQUES
    if (machine.mode === 'multi_chart') {
        if(machine.hasCounterweights && machine.counterweights) { 
            machine.counterweights.forEach(cwt => { 
                createSheetForData(machine.charts[cwt], `${cwt}t`); 
            }); 
        } else { 
            createSheetForData(machine.charts, "Abaque"); 
        }
    } else if (machine.mode === 'zone' || machine.mode === 'zone_multi_tool') {
        let ws_data = [[`Abaque : ${machine.name}`], ["Zone / Outil", "Capacité (t)"]];
        let zones = machine.zones || [];
        if (machine.mode === 'zone_multi_tool' && machine.tools?.length > 0) {
            const firstTool = machine.tools[0];
            if (machine.charts[firstTool]) zones = machine.charts[firstTool].zones;
        }
        zones.forEach(z => { ws_data.push([z.id, z.load]); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws_data), "Abaque");
    }

    // 2. MOUFLES (GRUES UNIQUEMENT)
    if (machine.category !== 'telehandler') {
        const wsMouflesData = [["Capacité Max (t)", "Masse du moufle (t)"]];
        if (machine.moufles && machine.moufles.length > 0) {
            machine.moufles.forEach(m => wsMouflesData.push([m.maxLoad, m.mass]));
        } else {
            wsMouflesData.push([10, 0.35], [32, 0.65], [60, 1.00]); 
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsMouflesData), "Moufles");
    }

    // 3. ONGLET CONFIGURATION DE L'ENGIN
    let surfaceToExport = machine.stabilizerSurface || "";
    if (typeof surfaceToExport === 'number') {
        surfaceToExport = parseFloat(surfaceToExport.toFixed(1)); // Arrondi garanti
    }

    const wsConfigData = [
        ["Surface de calage (m²)", surfaceToExport],
        ["Masse de l'engin à vide (t)", machine.machineMass || ""],
        ["URL Fiche Technique (Lien Web)", machine.techSheetUrl || ""]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsConfigData), "Configuration de l'engin");

    // 4. ELINGUES OU ACCESSOIRES
    if (machine.category === 'telehandler') {
        const wsAccData = [["Nom de l'accessoire", "Masse (t)"]];
        if (machine.toolsMass) {
            Object.entries(machine.toolsMass).forEach(([name, mass]) => wsAccData.push([name, mass]));
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsAccData), "Accessoires");
    } else {
        const wsSlingData = [["Jusqu'à (kg)", "Masse des élingues (kg)"]];
        if (typeof CRANE_SLINGS_TABLE !== 'undefined') {
            CRANE_SLINGS_TABLE.forEach(s => {
                // FIX CORRUPTION : Remplacement de Infinity par une chaîne "Max"
                const limit = s.upTo === Infinity ? "Max" : s.upTo;
                wsSlingData.push([limit, s.mass]);
            });
        }
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsSlingData), "Elingues");
    }

    const safeName = machine.name.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Abaque_${safeName}.xlsx`);
};

const generatePredimPDF = (machine, inputLoad, inputDist, inputHeight, isSafe, safeLoad, currentCwt, selectedBoomLen, currentMoufle, chantierName) => {
    if (!machine) return;
    const doc = new jsPDF('landscape'); // Format Paysage pour coller à la maquette
    
    // --- EN-TÊTE ---
    // Ajout du logo
    doc.addImage('logo.png', 'PNG', 14, 10, 75, 22);
    
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
        doc.text(`Masse contre-poids : ${currentCwt} t`, 140, yRight); yRight += 6;
    }
    if (currentMoufle !== null && currentMoufle !== undefined) {
        doc.text(`Masse du moufle : ${currentMoufle} t`, 140, yRight); yRight += 6;
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
