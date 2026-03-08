const formatDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0,10).replace(/-/g,'') + '_' + now.toTimeString().slice(0,5).replace(':','');
}

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

const getMoufleForLoad = (machine, loadKg) => {
    if (!machine || !machine.moufles || machine.moufles.length === 0) return null;
    const loadT = loadKg / 1000;
    // On cherche le premier moufle capable de lever la charge (le tableau sera trié)
    const found = machine.moufles.find(m => m.maxLoad >= loadT);
    return found ? found.mass : machine.moufles[machine.moufles.length - 1].mass;
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
