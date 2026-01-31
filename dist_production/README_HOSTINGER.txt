INSTRUCTIONS DE DÉPLOIEMENT SUR HOSTINGER
========================================

1. PRÉPARATION
   - Assurez-vous d'avoir créé la base de données MySQL sur Hostinger avec :
     * Nom de la base: u548879916_jotform
     * Utilisateur: u548879916_stratygo
     * Mot de passe: STRAT-jotform59

2. IMPORTATION DE LA BASE DE DONNÉES
   - Allez dans PHPMyAdmin sur Hostinger.
   - Sélectionnez votre base de données.
   - Cliquez sur "Importer".
   - Choisissez le fichier `schema.sql` présent dans ce dossier.
   - Exécutez l'importation.

3. UPLOAD DES FICHIERS
   - Allez dans le "File Manager" (Gestionnaire de fichiers) de Hostinger.
   - Naviguez vers le dossier `public_html`.
   - Supprimez le fichier `default.php` s'il existe.
   - Uploadez TOUS les fichiers et dossiers contenus dans ce dossier (dist_production).
     Note : Vous pouvez uploader le fichier ZIP `hostinger_deploy.zip` et l'extraire directement dans `public_html`.

4. CONFIGURATION NODE.JS (IMPORTANT)
   - Dans le panneau Hostinger, cherchez "Setup Node.js App".
   - Créez une nouvelle application :
     * Node.js version : 18 ou supérieur (recommandé 20)
     * Application mode : Production
     * Application root : public_html (ou laissez vide si c'est la racine)
     * Application URL : votre domaine
     * Application startup file : server/server.js
   - Cliquez sur "Create".

5. INSTALLATION DES DÉPENDANCES
   - Une fois l'app créée, cliquez sur le bouton "Install NPM" (ou entrez dans la console et tapez `npm install`).
   - Assurez-vous que le dossier `node_modules` est créé.

6. FINALISATION
   - Redémarrez l'application Node.js depuis le panneau Hostinger.
   - Accédez à votre site web.

DÉPANNAGE :
- Si vous avez une erreur 404 ou 500, vérifiez les logs dans le dossier `public_html` (souvent error_log).
- Vérifiez que le fichier .env contient les bonnes informations.
