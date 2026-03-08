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
