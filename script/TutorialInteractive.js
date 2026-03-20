// Fonction pour lancer le tutoriel interactif
window.startInteractiveTutorial = () => {
    // On ferme la modale d'info si elle est ouverte
    if (typeof window.closeInfoModal === 'function') {
        window.closeInfoModal();
    }

    // Configuration de Driver.js
    const driverObj = window.driver.js.driver({
        showProgress: true, // Barre de progression
        nextBtnText: 'Compris, suivant ➜',
        prevBtnText: '⬅ Retour',
        doneBtnText: 'Terminer',
        allowClose: true, // Permet de quitter en cliquant à côté
        overlayColor: 'rgba(0, 0, 0, 0.7)', // Fond sombre élégant
        
        // Liste des étapes (à adapter selon les IDs de vos éléments)
        steps: [
            { 
                popover: { 
                    title: 'Bienvenue dans SafeHoist 👋', 
                    description: 'Découvrons ensemble comment utiliser l\'application pas à pas.' 
                } 
            },
            { 
                element: '#tour-category-select', 
                popover: { 
                    title: '1. Choix de l\'engin', 
                    description: 'Commencez par sélectionner la famille de la machine (Télescopique, Grue Mobile...).', 
                    side: "bottom", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-sliders', 
                popover: { 
                    title: '2. Paramètres du levage', 
                    description: 'Ajustez la masse, la portée et la hauteur requises pour votre opération.', 
                    side: "right", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-graph', 
                popover: { 
                    title: '3. Vérification visuelle', 
                    description: 'Le graphique se met à jour en temps réel. Le point vert indique que vous êtes en sécurité. S\'il devient rouge, l\'opération est interdite !', 
                    side: "left", 
                    align: 'start' 
                } 
            },
            { 
                element: '#tour-pdf-btn', 
                popover: { 
                    title: '4. Rapport officiel', 
                    description: 'Une fois la configuration validée, cliquez ici pour générer un rapport PDF de pré-dimensionnement pour le bureau des Méthodes.', 
                    side: "top", 
                    align: 'start' 
                } 
            }
        ]
    });

    // On lance le tutoriel !
    driverObj.drive();
};
