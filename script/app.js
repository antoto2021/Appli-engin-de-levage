const { useState, useMemo, useEffect, useRef } = React;

const { jsPDF } = window.jspdf;

const DB_KEY = "cmc_levage_machines"; 

const SELECTED_CRANE_KEY = "selectedCrane"; 

const EXTERNAL_DB_URL = "engines.json";

const Header = ({ goHome }) => (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div onClick={goHome} className="hover:opacity-80 transition-opacity cursor-pointer"><CMCLogo /></div>
            <div className="flex items-center gap-4">
                <button onClick={() => window.openInfoModal()} className="text-[#004e98] text-2xl font-bold hover:opacity-80 transition p-2">
                    <Info size={28} />
                </button>
                {/*<div className="hidden md:flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <Layers size={14} /> V10.3
                </div>*/}
            </div>
        </div>
    </header>
);

const HomePage = ({ navigate }) => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 p-6 animate-fade-in">
        <div className="max-w-4xl w-full text-center space-y-12">
            <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 leading-tight">Bienvenue sur le portail <br/><span className="text-[#004e98]">Assistant de levage sécurisé</span></h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 max-w-4xl mx-auto">
                <button id="tour-nav-determine" onClick={() => navigate('determine')} className="animate-slide-up group relative h-64 rounded-xl bg-[#004e98] text-white p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-6" style={{animationDelay: '0.2s'}}>
                    <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm"><Calculator size={48} /></div>
                    <div><span className="block text-2xl font-bold mb-2">Déterminer</span><span className="text-blue-100 text-lg font-light">le bon engin de levage</span></div>
                </button>
                <button id="tour-nav-verify" onClick={() => navigate('verify')} className="animate-slide-up group relative h-64 rounded-xl bg-[#004e98] text-white p-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-6" style={{animationDelay: '0.3s'}}>
                    <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm"><CheckCircle size={48} /></div>
                    <div><span className="block text-2xl font-bold mb-2">Vérifier</span><span className="text-blue-100 text-lg font-light">mon engin de levage</span></div>
                </button>
            </div>
        </div>
    </div>
);

const App = () => {
    const [page, setPage] = useState('home');
    const [localMachines, setLocalMachines] = useState([]); 
    const [externalMachines, setExternalMachines] = useState([]);

    // --- AJOUT POUR LE TUTORIEL INTERACTIF (POINT 2) ---
    useEffect(() => {
        // On attache la fonction au window pour que Driver.js puisse l'appeler
        window.navigateToPage = (pageName) => {
            setPage(pageName);
        };
        
        // Sécurité React : on nettoie si le composant est détruit
        return () => {
            delete window.navigateToPage;
        };
    }, []); 
   
    useEffect(() => { 
        const saved = localStorage.getItem(DB_KEY); 
        if (saved) { 
            try { 
                const parsed = JSON.parse(saved); 
                setLocalMachines(parsed.map(m => ({...m, source: 'local'}))); 
            } catch (e) { 
                console.error("Err LocalStorage", e); 
            } 
        } 
    }, []);

    useEffect(() => { 
        const fetchExternal = async () => { 
            try { 
                const response = await fetch(EXTERNAL_DB_URL); 
                if (!response.ok) throw new Error("Fichier non trouvé"); 
                const data = await response.json(); 
                setExternalMachines(data.map(m => ({...m, source: 'external'}))); 
            } catch (err) { 
                console.warn("Mode dégradé"); 
            } 
        }; 
        fetchExternal(); 
    }, []);

    const allMachines = useMemo(() => { 
        return [...externalMachines, ...localMachines]; 
    }, [externalMachines, localMachines]);

    const saveLocal = (newMachines) => { 
        const updated = [...localMachines, ...newMachines.map(m => ({...m, source: 'local'}))]; 
        setLocalMachines(updated); 
        localStorage.setItem(DB_KEY, JSON.stringify(updated)); 
    };

    // PONT POUR L'ESPACE ADMIN (VANILLA JS <-> REACT)
    useEffect(() => {
        window.addGlobalMachine = (newMachines) => { saveLocal(newMachines); };
        window.deleteGlobalMachine = (id) => { deleteLocal(id); }; // Permet la suppression
        window.getGlobalMachines = () => { return allMachines; };  // Permet de lire toute la BDD

        return () => {
            delete window.addGlobalMachine;
            delete window.deleteGlobalMachine;
            delete window.getGlobalMachines;
        };
    }, [allMachines, localMachines]); // On met à jour le pont si la BDD change

    const deleteLocal = (id) => { 
        if(confirm("Supprimer cette machine locale ?")) { 
            const updated = localMachines.filter(m => m.id !== id); 
            setLocalMachines(updated); 
            localStorage.setItem(DB_KEY, JSON.stringify(updated)); 
        } 
    };

    const resetLocal = () => { 
        if(confirm("Effacer TOUTES les machines locales ?")) { 
            setLocalMachines([]); 
            localStorage.setItem(DB_KEY, JSON.stringify([])); 
        } 
    };

    const importLocal = (imported) => { 
        if(confirm(`Importer ${imported.length} machines ? Cela REMPLACE la base locale.`)) { 
            const marked = imported.map(m => ({...m, source: 'local'})); 
            setLocalMachines(marked); 
            localStorage.setItem(DB_KEY, JSON.stringify(marked)); 
        } 
    }

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
    { icon: "👋", title: "Bienvenue !", desc: "Assistant de levage : Votre assistant digital pour prédimensionner vos levages sur chantier." },
    { icon: "🏗️", title: "Choix de l'engin", desc: "Sélectionnez votre grue parmi la base de données système ou importez vos propres modèles via Excel." },
    { icon: "📐", title: "Configuration", desc: "Définissez les paramètres du levage (Masse, Portée). L'appli vous donneras automatiquement la flèche et le contrepoids adapté" },
    { icon: "✅", title: "Vérification", desc: "Visualisez instantanément si le levage est autorisé (Vert), autorisé mais risqué (Orange) ou interdit (Rouge) grâce aux abaques intégrés." },
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

// --- GESTION DU TABLEAU DE BORD (ANALYTICS & HISTORIQUE) ---

function openDataModal() {
    // Ferme la modale "Infos Application" si elle est ouverte
    if (typeof window.closeInfoModal === 'function') {
        window.closeInfoModal();
    }
    
    // Affiche la modale des données
    document.getElementById('data-modal-overlay').classList.remove('hidden');
    
    // On ne recharge l'historique que s'il est vide ET que nous ne sommes pas en erreur
    const tbody = document.getElementById('history-tbody');
    const isOffline = document.getElementById('info-remote-version').innerText === "Hors ligne";

    if (tbody.innerHTML.trim() === '' && !isOffline) {
        loadGitHubHistory();
    }
}

function closeDataModal() {
    document.getElementById('data-modal-overlay').classList.add('hidden');
}

async function loadGitHubHistory() {
    const CACHE_KEY = 'safehoist_github_history';
    const tbody = document.getElementById('history-tbody');
    const loading = document.getElementById('history-loading');
    
    // 1. Vérifier si nous avons déjà les données en cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        renderHistoryTable(JSON.parse(cachedData));
        loading.classList.add('hidden');
        return; // On s'arrête là, pas besoin d'appeler l'API
    }

    const FILES_TO_TRACK = [
        { path: 'index.html', name: 'Interface Racine (index.html)' },
        { path: 'style.css', name: 'Styles Globaux (style.css)' },
        { path: 'engines.json', name: 'Base de Données (engines.json)' },
        { path: 'script/app.js', name: 'Moteur Logiciel (app.js)' },
        { path: 'script/utils.js', name: 'Algorithmes de Calcul (utils.js)' },
        { path: 'script/VerifyPage.js', name: 'Module de Vérification (VerifyPage.js)' },
        { path: 'script/DeterminePage.js', name: 'Module de Détermination (DeterminePage.js)' },
        { path: 'script/pdfGenerator.js', name: 'Générateur de Rapports (pdfGenerator.js)' },
        { path: 'script/TutorialInteractive.js', name: 'Guide Interactif (TutorialInteractive.js)' },
        { path: 'script/icons.js', name: 'Composants Graphiques (icons.js)' },
        { path: 'script/lib/driver.js', name: 'Librairie Tutoriel (driver.js)' },
        { path: 'script/lib/driver.css', name: 'Styles Tutoriel (driver.css)' },
        { path: 'script/lib/driver-custom.css', name: 'Customisation Tutoriel (driver-custom.css)' }
    ];

    let historyResults = [];
    tbody.innerHTML = '';

    for (const file of FILES_TO_TRACK) {
        try {
            const baseUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/commits?path=${file.path}&per_page=1`;
            const lastRes = await fetch(baseUrl);

            // GESTION DE L'ERREUR 403 (RATE LIMIT)
            if (lastRes.status === 403) {
                loading.innerText = "⚠️ Limite API GitHub atteinte (réessayez dans 1h)";
                loading.classList.remove('animate-pulse');
                return;
            }

            const lastData = await lastRes.json();
            const lastDate = lastData[0]?.commit.author.date;

            const linkHeader = lastRes.headers.get('Link');
            let firstDate = lastDate;

            if (linkHeader && linkHeader.includes('rel="last"')) {
                const lastPageUrl = linkHeader.split(',').find(s => s.includes('rel="last"')).match(/<(.*)>/)[1];
                const firstCommitRes = await fetch(lastPageUrl);
                const firstCommitData = await firstCommitRes.json();
                firstDate = firstCommitData[0]?.commit.author.date;
            }

            historyResults.push({
                name: file.name,
                first: firstDate,
                last: lastDate
            });

        } catch (e) {
            console.error(`Erreur pour ${file.path}`, e);
        }
    }

    // 2. Sauvegarder les résultats pour la prochaine fois
    localStorage.setItem(CACHE_KEY, JSON.stringify(historyResults));
    
    // 3. Afficher le tableau
    renderHistoryTable(historyResults);
    loading.classList.add('hidden');
}

// Fonction utilitaire pour dessiner le tableau
function renderHistoryTable(data) {
    const tbody = document.getElementById('history-tbody');
    const formatStr = (dStr) => dStr ? new Date(dStr).toLocaleDateString('fr-FR') : '---';
    
    tbody.innerHTML = data.map(item => `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50">
            <td class="p-3 font-bold text-slate-700">${item.name}</td>
            <td class="p-3 text-emerald-600 font-medium">${formatStr(item.first)}</td>
            <td class="p-3 text-blue-600 font-medium">${formatStr(item.last)}</td>
        </tr>
    `).join('');
}

// ============================================================
//      ESPACE ADMINISTRATEUR (CODE PIN ET IMPORT EXCEL)
// ============================================================

window.checkAdminPin = () => {
    const pin = document.getElementById('admin-pin').value;
    if (pin === '1234') {
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        document.getElementById('admin-pin').value = ''; // On vide par sécurité
    } else {
        const err = document.getElementById('admin-error');
        err.classList.remove('hidden');
        setTimeout(() => err.classList.add('hidden'), 3000);
    }
    if(window.refreshAdminPanel) window.refreshAdminPanel();
};

// --- ACTUALISATION DU PANNEAU ADMIN ---
window.refreshAdminPanel = () => {
    if (!window.getGlobalMachines) return; // Sécurité

    const allMachines = window.getGlobalMachines();
    
    // 1. Mise à jour des compteurs (Statistiques)
    let countGM = 0, countMT = 0, countGT = 0;
    allMachines.forEach(m => {
        if (m.category === 'mobile_crane') countGM++;
        else if (m.category === 'telehandler') countMT++;
        else if (m.category === 'crawler_crane') countGT++;
    });

    document.getElementById('stat-gm').innerText = countGM;
    document.getElementById('stat-mt').innerText = countMT;
    document.getElementById('stat-gt').innerText = countGT;

    // 2. Mise à jour du tableau des machines locales (pour suppression)
    const localMachines = allMachines.filter(m => m.source === 'local');
    const tbody = document.getElementById('admin-local-machines');
    
    if (localMachines.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="p-4 text-center text-slate-400 italic">Aucune machine locale importée.</td></tr>';
    } else {
        tbody.innerHTML = localMachines.map(m => `
            <tr class="hover:bg-slate-50">
                <td class="p-2 font-bold text-slate-700">
                    ${m.name} 
                    <span class="text-[9px] font-normal text-slate-400 block">
                        ${m.category === 'telehandler' ? 'Télescopique' : m.category === 'mobile_crane' ? 'Grue Mobile' : 'Treillis'}
                    </span>
                </td>
                <td class="p-2 text-right align-middle">
                    <button onclick="deleteMachineFromAdmin('${m.id}')" class="text-red-500 hover:bg-red-50 px-2 py-1 rounded transition font-bold border border-red-100">Supprimer</button>
                </td>
            </tr>
        `).join('');
    }
};

// --- FONCTION DE SUPPRESSION ---
window.deleteMachineFromAdmin = (id) => {
    if (window.deleteGlobalMachine) {
        // La fonction React gère déjà la demande de confirmation (confirm())
        window.deleteGlobalMachine(id);
        
        // On laisse à React 100ms pour mettre à jour son State, puis on rafraîchit le panneau Admin
        setTimeout(() => window.refreshAdminPanel(), 100);
    }
};

window.downloadAdminTemplate = () => {
    const wb = XLSX.utils.book_new(); 
    const sheets = [ { name: "0t", multiplier: 0.5 }, { name: "12t", multiplier: 0.8 }, { name: "24t", multiplier: 1.0 } ]; 
    const baseData = [ ["Portée(m) \\ Flèche(m)", 10, 20, 30, 40], [3, 50, 40, null, null], [10, 20, 18, 15, 12], [30, null, null, 4, 3] ];
    sheets.forEach(sheet => { 
        const data = baseData.map((row, i) => { 
            if (i === 0) return row; 
            return row.map((cell, j) => { if (j === 0 || cell === null) return cell; return Number((cell * sheet.multiplier).toFixed(1)); }); 
        }); 
        const ws = XLSX.utils.aoa_to_sheet(data); 
        XLSX.utils.book_append_sheet(wb, ws, sheet.name); 
    }); 
    XLSX.writeFile(wb, "Modele_Import_MultiCwt.xlsx");
};

window.handleAdminExcelUpload = (e) => {
    const file = e.target.files[0]; 
    if (!file) return; 
    
    const category = document.getElementById('admin-category').value;
    const statusEl = document.getElementById('admin-upload-status');
    statusEl.innerText = "⏳ Traitement en cours...";
    statusEl.className = "mt-4 text-sm font-bold text-center text-blue-600 animate-pulse";

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target.result; 
            const wb = XLSX.read(bstr, { type: 'binary' });
            let isMultiSheet = wb.SheetNames.length > 1; 
            let useCwtMode = isMultiSheet;
            
            if (!useCwtMode) {
                const firstSheet = wb.SheetNames[0].trim();
                const isGenericName = /^(sheet|feuille)\d+$/i.test(firstSheet);
                const looksLikeCwt = /^(\d+(\.\d+)?)[tT]?$/.test(firstSheet);
                if (!isGenericName && looksLikeCwt) { useCwtMode = true; }
            }

            let counterweights = []; let charts = {}; let boomLengthsGlobal = new Set(); 
            let maxLoadFound = 0; let maxReachFound = 0;

            const parseSheet = (sheetName) => {
                 const ws = wb.Sheets[sheetName]; const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); if(data.length < 2) return null;
                 const headerRow = data[0]; const colToBoom = {}; const sheetCharts = {};
                 for (let c = 1; c < headerRow.length; c++) { const val = parseFloat(headerRow[c]); if (!isNaN(val)) { boomLengthsGlobal.add(val); colToBoom[c] = val; sheetCharts[val] = { std: [] }; } }
                 for (let r = 1; r < data.length; r++) {
                     const row = data[r]; const radius = parseFloat(row[0]);
                     if (!isNaN(radius)) {
                         let hasValidLoad = false;
                         for (let c = 1; c < row.length; c++) { 
                             const loadVal = parseFloat(row[c]); 
                             const boomLen = colToBoom[c]; 
                             if (boomLen && !isNaN(loadVal)) { 
                                 sheetCharts[boomLen].std.push({ d: radius, l: loadVal }); 
                                 if (loadVal > maxLoadFound) maxLoadFound = loadVal; 
                                 hasValidLoad = true;
                             } 
                         }
                         if (hasValidLoad && radius > maxReachFound) maxReachFound = radius;
                     }
                 }
                 return sheetCharts;
            };

            if (useCwtMode) { wb.SheetNames.forEach(sheetName => { const cwtData = parseSheet(sheetName); if(cwtData && sheetName.toLowerCase() !== 'moufles') { counterweights.push(sheetName); charts[sheetName] = cwtData; } }); } else { charts = parseSheet(wb.SheetNames[0]); }
            const boomLengths = Array.from(boomLengthsGlobal).sort((a,b)=>a-b);
            if (boomLengths.length === 0) throw new Error("Aucune colonne de flèche valide trouvée.");
            
            let moufles = null;
            const mouflesSheetName = wb.SheetNames.find(n => n.toLowerCase() === 'moufles');
            if (mouflesSheetName) {
                const wsMoufles = wb.Sheets[mouflesSheetName];
                const dataMoufles = XLSX.utils.sheet_to_json(wsMoufles, { header: 1 });
                moufles = [];
                for (let r = 1; r < dataMoufles.length; r++) {
                    const maxL = parseFloat(dataMoufles[r][0]); const massM = parseFloat(dataMoufles[r][1]);
                    if (!isNaN(maxL) && !isNaN(massM)) { moufles.push({ maxLoad: maxL, mass: massM }); }
                }
                moufles.sort((a, b) => a.maxLoad - b.maxLoad);
            }

            const newMachine = { id: "custom_" + Date.now(), source: "local", category: category, name: `${file.name.replace(/\.[^/.]+$/, "")}`, type: "crane", mode: "multi_chart", maxLoad: maxLoadFound * 1000, maxReach: maxReachFound, maxHeight: Math.max(...boomLengths) + 2, hasTelescoping: false, hasCounterweights: useCwtMode, counterweights: useCwtMode ? counterweights : null, boomLengths: boomLengths, charts: charts, moufles: moufles, createdAt: new Date().toISOString(), isCustom: true };
            
            // Appel de la fonction React via le pont créé
            if(window.addGlobalMachine) {
                window.addGlobalMachine([newMachine]);
                setTimeout(() => window.refreshAdminPanel(), 100);
                statusEl.innerText = "✅ Engin importé et sauvegardé avec succès !";
                statusEl.className = "mt-4 text-sm font-bold text-center text-emerald-600";
            }
        } catch (error) { 
            statusEl.innerText = "❌ Erreur : " + error.message;
            statusEl.className = "mt-4 text-sm font-bold text-center text-red-600";
        } finally { 
            e.target.value = null; 
        }
    }; 
    reader.readAsBinaryString(file);
};
    
// Attachement global pour les appels onclick HTML
window.forceUpdate = forceUpdate;
window.checkGitHubUpdates = checkGitHubUpdates;
window.closeInfoModal = closeInfoModal;
window.toggleAccordion = toggleAccordion;
window.openTutorial = openTutorial;
window.closePopup = closePopup;
window.nextSlide = nextSlide;
window.openInfoModal = openInfoModal;
window.openDataModal = openDataModal;
window.closeDataModal = closeDataModal;
