// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Pour des raisons de performance ou de déverrouillage de certaines fonctionnalités,
    // vous pourriez vouloir activer le mode strict de React.
    // reactStrictMode: true,
  
    webpack: (config, { isServer }) => {
      // Appliquer cette configuration uniquement pour le build côté serveur
      if (isServer) {
        // Règle pour s'assurer que pdfkit trouve ses fichiers de polices (.afm)
        config.module.rules.push({
          test: /\.afm$/, // Cible tous les fichiers se terminant par .afm
          type: 'asset/resource', // Indique à Webpack de les traiter comme des ressources à copier
          generator: {
            // Spécifie où les copier dans le dossier de build de Next.js
            filename: 'static/media/[name][ext]',
          },
        });
      }
      // Retourne la configuration Webpack modifiée
      return config;
    },
  };
  
  // Exporte la configuration Next.js
  module.exports = nextConfig;