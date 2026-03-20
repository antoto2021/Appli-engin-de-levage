// Fonction pour lancer le tutoriel interactif
window.startInteractiveTutorial = () => {
    // On ferme la modale d'info si elle est ouverte
    if (typeof window.closeInfoModal === 'function') {
        window.closeInfoModal();
    }

    // On force l'application à démarrer le tuto sur la page d'acceuil
    if (typeof window.navigateToPage === 'function') {
        window.navigateToPage('home');
    }

    // Configuration de Driver.js
    const driverObj = window.driver.js.driver({
        showProgress: true, // Barre de progression
        nextBtnText: 'Suivant ➜',
        prevBtnText: '⬅ Retour',
        doneBtnText: 'Terminer',
        allowClose: true, // Permet de quitter en cliquant à côté
        overlayColor: 'rgba(0, 0, 0, 0.7)', // Fond sombre élégant
        
        // Séquence exacte du tutoriel
        steps: [
            // --- INTRODUCTION ---
            { 
                popover: { 
                    title: "Bienvenue dans l'assistant de levage 👋", 
                    description: 'Découvrons ensemble comment utiliser l\'application pas à pas pour sécuriser vos opérations de levage.' 
                } 
            },
			
			// --- TRANSITION : ACCUEIL -> DÉTERMINER ---
            {
                element: '#tour-nav-determine', // Le gros bouton sur l'accueil
                popover: { 
                    title: '1. Module de Détermination', 
                    description: 'Nous allons commencer par le module Déterminer. <b>Cliquez sur Suivant pour y aller.</b>',
                    side: "bottom"
                },
                onNextClick: () => {
                    // On change d'onglet
                    window.navigateToPage('determine');
                    // On demande à Driver d'attendre 500ms (le temps de l'animation)
                    setTimeout(() => {
                        driverObj.moveNext();
                    }, 500);
                }
            },

            // --- ONGLET 1 : DÉTERMINER ---
            {
                element: '#tour-nav-determine', // À ajouter sur le bouton "Déterminer" dans le Header (app.js)
                popover: { 
                    title: '1. Module de Détermination', 
                    description: 'Nous commençons sur cet onglet. Il sert à trouver automatiquement la meilleure machine pour votre chantier.',
                    side: "bottom"
                }
            },
            { 
                element: '#tour-det-params', 
                popover: { 
                    title: '2. Vos contraintes de chantier', 
                    description: 'Entrez le poids à lever (la masse), la distance (portée) et la hauteur cible.', 
                    side: "right", 
                    align: 'start' 
                } 
            },
			{ 
                element: '#tour-slider-critere', 
                popover: { 
                    title: '3. Critère de sécurité', 
                    description: 'Réglez ici le taux d\'utilisation maximal autorisé. Par exemple, 80% signifie que vous gardez 20% de marge de sécurité.', 
                    side: "bottom", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-det-results', 
                popover: { 
                    title: '4. Les Recommandations', 
                    description: 'L\'algorithme affiche ici les machines capables de réaliser l\'opération, triées de la plus adaptée à la moins adaptée.', 
                    side: "top", 
                    align: 'center' 
                } 
            },

            // --- TRANSITION : DÉTERMINER -> VÉRIFIER ---
            {
                // On utilise une astuce : on cible un élément toujours présent (comme le body) 
                // pour faire la transition, au lieu de chercher le bouton du menu
                popover: { 
                    title: '5. Module de Vérification', 
                    description: 'Une fois la machine choisie, passons à l\'onglet Vérifier pour simuler la manœuvre en détail. <b>Cliquez sur Suivant.</b>',
                },
                onNextClick: () => {
                    // On change d'onglet
                    window.navigateToPage('verify');
                    // On attend 500ms que la page "Vérifier" soit bien affichée dans le DOM
                    setTimeout(() => {
                        driverObj.moveNext();
                    }, 500);
                }
            },

            // --- ONGLET 2 : VÉRIFIER (Grue Mobile) ---
            { 
                element: '#tour-category-select', 
                popover: { 
                    title: '6. Catégorie d\'engin', 
                    description: 'Dans cette onglet 3 familles de machines sont disponible. Pour ce tutoriel, assurez-vous que la catégorie <b>Grue Mobile</b> est sélectionnée.', 
                    side: "bottom", 
                    align: 'center' 
                } 
            },
            { 
                element: '#tour-BDD', 
                popover: { 
                    title: "7. Choix de l'engin", 
                    description: "Cherchez votre grue mobile dans la liste déroulante.",
                    side: "right",
                    align: 'start'
                } 
            },
            { 
                element: '#tour-sliders', 
                popover: { 
                    title: '8. Simulation du levage', 
                    description: 'Ajustez les curseurs. La portée et la hauteur vont faire bouger le bras de la grue en temps réel.', 
                    side: "right", 
                    align: 'start' 
                } 
            },
			{ 
                element: '#tour-graph', 
                popover: { 
                    title: '9. Validation géométrique', 
                    description: 'Surveillez le graphique. Il trace la courbe de capacité de la grue. Si le point rouge sort de la zone, c\'est un accident potentiel !', 
                    side: "left", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-Configuration', 
                popover: { 
                    title: '10. Configuration requise', 
                    description: "L'application calcule automatiquement la meilleure longueur de flèche et le contrepoids nécessaire pour cette manœuvre.",
                    side: "right",
                    align: 'start'
                } 
            },
            { 
                element: '#tour-status-card', 
                popover: { 
                    title: '11. Le Verdict', 
                    description: 'C\'est le résultat final. <b>AUTORISÉ</b> signifie que le levage est sûr et conforme aux abaques du constructeur.', 
                    side: "bottom", 
                    align: 'center' 
                } 
            },
            
            // --- LES EXPORTS ---
            { 
                element: '#tour-pdf-btn', 
                popover: { 
                    title: '12. Le rapport de pré-dimensionnement', 
                    description: 'Cliquer sur ce bouton pour générer en un clic le rapport PDF de pré-dimensionnement pour obtenir les détails du levage et envoyer le résultat aux équipes QPE/Méthodes.', 
                    side: "top", 
                    align: 'center' 
                } 
            },
            { 
                element: '#tour-Abaque-Excel', 
                popover: { 
                    title: '13. Abaque Excel', 
                    description: 'Si vous avez besoin de vérifier une donnée précise, vous pouvez télécharger l\'abaque complet au format Excel.', 
                    side: "top", 
                    align: 'center' 
                } 
            }
        ]
    });

    // On lance le tutoriel ! (Il commence obligatoirement par la page d'acceuil grâce au code au début de la fonction)
    // On attend 100ms pour être sûr que la page Déterminer est bien affichée
    setTimeout(() => {
        driverObj.drive();
    }, 100);
};
