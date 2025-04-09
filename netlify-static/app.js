// app.js - Script simple pour la page statique de déploiement
document.addEventListener('DOMContentLoaded', function() {
    // Afficher la date de mise à jour
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Ajouter la date au pied de page s'il existe
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.innerHTML += ` | Dernière mise à jour: ${formattedDate}`;
    }
    
    // Animation pour les cartes de fonctionnalités
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        setTimeout(() => {
            feature.style.opacity = '1';
        }, 300 * (index + 1));
    });
    
    // Simuler un chargement
    let progress = 0;
    const statusText = document.querySelector('.status-card h2');
    
    const interval = setInterval(() => {
        progress += 5;
        if (progress > 100) {
            clearInterval(interval);
            if (statusText) {
                statusText.textContent = 'Prêt pour le lancement!';
            }
            
            // Ajouter un bouton pour rediriger vers la future application complète
            const statusCard = document.querySelector('.status-card');
            if (statusCard) {
                const button = document.createElement('button');
                button.textContent = 'Voir les mises à jour de développement';
                button.classList.add('cta-button');
                button.addEventListener('click', () => {
                    alert('Le déploiement complet de l\'application est en cours. Revenez bientôt pour découvrir toutes les fonctionnalités!');
                });
                statusCard.appendChild(button);
            }
        }
    }, 500);
    
    // Afficher des messages de développement dans la console
    console.log('🚀 Velo-Altitude - Déploiement statique temporaire');
    console.log('📋 Version 2.1 - Avril 2025');
    console.log('📌 Cette page est une solution temporaire pendant que nous finalisons le déploiement complet de l\'application.');
});
