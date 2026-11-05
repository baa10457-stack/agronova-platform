export type Language = 'en' | 'fr';

export type ModuleId = 'farm' | 'ai' | 'livestock' | 'commerce' | 'finance' | 'education';

export type Dictionary = {
  nav: {
    technology: string;
    modules: string;
    benefits: string;
    impact: string;
    cta: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    home: string;
  };
  hero: {
    badge: string;
    titleLead: string;
    titleHighlight: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    imageAlt: string;
  };
  technology: {
    eyebrow: string;
    title: string;
    subtitle: string;
    pillars: { title: string; description: string }[];
  };
  modules: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { id: ModuleId; title: string; description: string; highlights: string[] }[];
  };
  benefits: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    items: { title: string; description: string }[];
  };
  impact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    badge: string;
    disclaimer: string;
    items: { value: number; suffix: string; label: string }[];
  };
  footer: {
    tagline: string;
    backToTop: string;
    rights: string;
  };
};

export const dictionaries: Record<Language, Dictionary> = {
  en: {
    nav: {
      technology: 'Technology',
      modules: 'Ecosystem',
      benefits: 'Benefits',
      impact: 'Impact',
      cta: 'Explore modules',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      language: 'Language',
      home: 'AGRONOVA home',
    },
    hero: {
      badge: 'AI-powered agriculture platform',
      titleLead: 'The operating system for',
      titleHighlight: 'modern agriculture',
      subtitle:
        'AGRONOVA unites farm management, artificial intelligence, livestock, commerce, finance and education in one connected ecosystem built for producers worldwide.',
      primaryCta: 'Explore the ecosystem',
      secondaryCta: 'Discover the technology',
      imageAlt: 'Aerial view of structured green farmland',
    },
    technology: {
      eyebrow: 'Agricultural technology',
      title: 'Data, intelligence and connectivity, working for every field',
      subtitle:
        'AGRONOVA turns field data into clear, timely decisions, from a single hectare to a multinational operation.',
      pillars: [
        {
          title: 'Field intelligence',
          description:
            'Sensors, drones and satellite imagery combine into a live picture of soil, water and crop health.',
        },
        {
          title: 'Predictive AI',
          description:
            'Models trained on agronomic data anticipate yields, pests and weather risks, and recommend actions.',
        },
        {
          title: 'Connected operations',
          description:
            'Planning, equipment, livestock and sales share one data layer, so every team works from the same facts.',
        },
      ],
    },
    modules: {
      eyebrow: 'Six modules, one ecosystem',
      title: 'Everything an agricultural business needs, connected',
      subtitle:
        'Use a single module or combine them all. Each one shares data with the rest of the platform.',
      items: [
        {
          id: 'farm',
          title: 'Farm Management',
          description:
            'Plan seasons, fields, inputs and labour, and track every operation from sowing to harvest.',
          highlights: ['Crop planning', 'Field records', 'Task scheduling'],
        },
        {
          id: 'ai',
          title: 'AI Crop Intelligence',
          description:
            'Detect disease early, forecast yields and optimise irrigation and fertilisation with AI models.',
          highlights: ['Disease detection', 'Yield forecasting', 'Irrigation advice'],
        },
        {
          id: 'livestock',
          title: 'Livestock Management',
          description:
            'Follow herd health, breeding, feeding and traceability within a single record per animal.',
          highlights: ['Herd health', 'Breeding cycles', 'Full traceability'],
        },
        {
          id: 'commerce',
          title: 'Agricultural Commerce',
          description:
            'Connect producers with buyers and suppliers through transparent marketplaces and digital contracts.',
          highlights: ['Input procurement', 'Produce sales', 'Digital contracts'],
        },
        {
          id: 'finance',
          title: 'Agricultural Finance',
          description:
            'Access credit, insurance and cash-flow tools built on real farm data rather than paperwork alone.',
          highlights: ['Farm credit', 'Crop insurance', 'Cash-flow tracking'],
        },
        {
          id: 'education',
          title: 'AGRONOVA Academy',
          description:
            'Train teams and farmers with practical courses on modern techniques, digital tools and sustainability.',
          highlights: ['Practical courses', 'Certifications', 'Expert webinars'],
        },
      ],
    },
    benefits: {
      eyebrow: 'Benefits and innovation',
      title: 'Built to raise yields, margins and resilience',
      subtitle:
        'AGRONOVA is designed around the decisions producers make every day, turning information into measurable results.',
      cta: 'Explore the modules',
      items: [
        {
          title: 'Higher yields, less waste',
          description:
            'Precise recommendations reduce input waste and protect harvests against losses that could have been prevented.',
        },
        {
          title: 'Decisions based on evidence',
          description:
            'Every recommendation traces back to field data, so producers understand the advice and trust it.',
        },
        {
          title: 'Access to finance',
          description:
            'A verified operating history helps producers qualify for credit and insurance more quickly.',
        },
        {
          title: 'Built for every scale',
          description:
            'A responsive platform that works on desktop, tablet and mobile, from smallholders to agribusiness groups.',
        },
      ],
    },
    impact: {
      eyebrow: 'Impact',
      title: 'A growing ecosystem, illustrated',
      subtitle: 'Figures shown on this page are demonstration values for presentation purposes.',
      badge: 'Demonstration data',
      disclaimer:
        'Illustrative figures only. These values are placeholders and do not represent verified results.',
      items: [
        { value: 48, suffix: '+', label: 'Partner farms (demo)' },
        { value: 12, suffix: '', label: 'Countries (demo)' },
        { value: 250, suffix: 'K+', label: 'Hectares monitored (demo)' },
        { value: 35, suffix: '%', label: 'Average input savings (demo)' },
      ],
    },
    footer: {
      tagline: 'The future of global agriculture, connected from the field to the market.',
      backToTop: 'Back to top',
      rights: 'All rights reserved.',
    },
  },
  fr: {
    nav: {
      technology: 'Technologie',
      modules: 'Écosystème',
      benefits: 'Avantages',
      impact: 'Impact',
      cta: 'Découvrir les modules',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      language: 'Langue',
      home: 'Accueil AGRONOVA',
    },
    hero: {
      badge: 'Plateforme agricole propulsée par l’IA',
      titleLead: 'Le système d’exploitation de',
      titleHighlight: 'l’agriculture moderne',
      subtitle:
        'AGRONOVA réunit gestion agricole, intelligence artificielle, élevage, commerce, finance et formation dans un écosystème connecté, conçu pour les producteurs du monde entier.',
      primaryCta: 'Explorer l’écosystème',
      secondaryCta: 'Découvrir la technologie',
      imageAlt: 'Vue aérienne de champs verts et structurés',
    },
    technology: {
      eyebrow: 'Technologie agricole',
      title: 'Données, intelligence et connectivité au service de chaque parcelle',
      subtitle:
        'AGRONOVA transforme les données du terrain en décisions claires et rapides, de la petite exploitation à la grande entreprise agricole.',
      pillars: [
        {
          title: 'Intelligence du terrain',
          description:
            'Capteurs, drones et imagerie satellite se combinent en une vision en temps réel des sols, de l’eau et des cultures.',
        },
        {
          title: 'IA prédictive',
          description:
            'Des modèles entraînés sur des données agronomiques anticipent rendements, ravageurs et risques climatiques, et recommandent des actions.',
        },
        {
          title: 'Opérations connectées',
          description:
            'Planification, équipements, élevage et ventes partagent une même couche de données : toutes les équipes travaillent sur les mêmes faits.',
        },
      ],
    },
    modules: {
      eyebrow: 'Six modules, un seul écosystème',
      title: 'Tout ce dont une entreprise agricole a besoin, connecté',
      subtitle:
        'Utilisez un seul module ou combinez-les tous. Chacun partage ses données avec le reste de la plateforme.',
      items: [
        {
          id: 'farm',
          title: 'Gestion agricole',
          description:
            'Planifiez saisons, parcelles, intrants et main-d’œuvre, et suivez chaque opération, du semis à la récolte.',
          highlights: ['Planification des cultures', 'Registres parcellaires', 'Planification des tâches'],
        },
        {
          id: 'ai',
          title: 'Intelligence artificielle des cultures',
          description:
            'Détectez les maladies tôt, prévoyez les rendements et optimisez irrigation et fertilisation grâce à l’IA.',
          highlights: ['Détection des maladies', 'Prévision des rendements', 'Conseils d’irrigation'],
        },
        {
          id: 'livestock',
          title: 'Gestion de l’élevage',
          description:
            'Suivez la santé du troupeau, la reproduction, l’alimentation et la traçabilité dans une fiche unique par animal.',
          highlights: ['Santé du troupeau', 'Cycles de reproduction', 'Traçabilité complète'],
        },
        {
          id: 'commerce',
          title: 'Commerce agricole',
          description:
            'Reliez producteurs, acheteurs et fournisseurs grâce à des marchés transparents et des contrats numériques.',
          highlights: ['Achat d’intrants', 'Vente de production', 'Contrats numériques'],
        },
        {
          id: 'finance',
          title: 'Financement agricole',
          description:
            'Accédez au crédit, à l’assurance et aux outils de trésorerie, fondés sur les données réelles de l’exploitation.',
          highlights: ['Crédit agricole', 'Assurance récolte', 'Suivi de trésorerie'],
        },
        {
          id: 'education',
          title: 'AGRONOVA Academy',
          description:
            'Formez équipes et agriculteurs avec des cours pratiques sur les techniques modernes, les outils numériques et la durabilité.',
          highlights: ['Cours pratiques', 'Certifications', 'Webinaires d’experts'],
        },
      ],
    },
    benefits: {
      eyebrow: 'Avantages et innovation',
      title: 'Conçu pour accroître rendements, marges et résilience',
      subtitle:
        'AGRONOVA est pensé autour des décisions que prennent les producteurs chaque jour, pour transformer l’information en résultats mesurables.',
      cta: 'Explorer les modules',
      items: [
        {
          title: 'Rendements accrus, moins de pertes',
          description:
            'Des recommandations précises réduisent le gaspillage d’intrants et protègent les récoltes des pertes évitables.',
        },
        {
          title: 'Des décisions fondées sur des preuves',
          description:
            'Chaque recommandation repose sur des données de terrain traçables, pour que les producteurs comprennent les conseils et leur fassent confiance.',
        },
        {
          title: 'Accès au financement',
          description:
            'Un historique opérationnel vérifié aide les producteurs à obtenir plus rapidement un crédit ou une assurance.',
        },
        {
          title: 'Conçu pour toutes les échelles',
          description:
            'Une plateforme adaptative, utilisable sur ordinateur, tablette et mobile, des petits exploitants aux groupes agro-industriels.',
        },
      ],
    },
    impact: {
      eyebrow: 'Impact',
      title: 'Un écosystème en croissance, illustré',
      subtitle: 'Les chiffres affichés sur cette page sont des valeurs de démonstration à titre de présentation.',
      badge: 'Données de démonstration',
      disclaimer:
        'Chiffres à titre illustratif uniquement. Ces valeurs sont fictives et ne représentent pas des résultats vérifiés.',
      items: [
        { value: 48, suffix: '+', label: 'Exploitations partenaires (démo)' },
        { value: 12, suffix: '', label: 'Pays (démo)' },
        { value: 250, suffix: 'K+', label: 'Hectares suivis (démo)' },
        { value: 35, suffix: '%', label: 'Économies moyennes d’intrants (démo)' },
      ],
    },
    footer: {
      tagline: 'L’avenir de l’agriculture mondiale, connecté du champ au marché.',
      backToTop: 'Retour en haut',
      rights: 'Tous droits réservés.',
    },
  },
};
