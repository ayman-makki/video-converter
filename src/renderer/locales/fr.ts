export const fr = {
  // Application
  app: {
    title: "Convertisseur Vidéo",
    loading: "Chargement du Convertisseur Vidéo...",
    initializing: "Initialisation du Convertisseur Vidéo...",
    ready: "Convertisseur vidéo prêt !",
    initializationFailed: "Échec de l'initialisation de l'application",
  },

  // File Drop Zone
  fileDropZone: {
    dragAndDrop: "Glissez-déposez vos fichiers vidéo ici",
    orClickBelow: "ou cliquez ci-dessous pour parcourir les fichiers",
    browseFiles: "Parcourir les Fichiers",
    notReady: "Le convertisseur vidéo n'est pas prêt",
    supportedFormats: "Formats supportés : MP4, AVI, MKV, MOV, WMV, FLV, WebM, MP3, WAV, FLAC, AAC",
    validationError: "Erreur de Validation de Fichier",
    unsupportedFormat: "Format(s) de fichier non supporté(s)",
    failedToSelect: "Échec de la sélection des fichiers",
  },

  // Conversion Controls
  controls: {
    title: "Contrôles de Conversion",
    startConversion: "Démarrer la Conversion",
    pauseConversion: "Suspendre la Conversion",
    cancelConversion: "Annuler la Conversion",
    resumeConversion: "Reprendre la Conversion",
    cancelAll: "Annuler Tout",
    clearQueue: "Vider la File",
    total: "Total",
    pending: "En attente",
    completed: "Terminé",
    errors: "Erreurs",
    notReady: "Le convertisseur vidéo n'est pas prêt. Veuillez attendre l'initialisation des services.",
  },

  // Conversion Queue
  queue: {
    title: "File d'Attente de Conversion",
    empty: "Aucun fichier dans la file d'attente",
    status: {
      pending: "En attente",
      converting: "Conversion en cours",
      completed: "Terminé",
      failed: "Échec",
      cancelled: "Annulé",
    },
    actions: {
      remove: "Supprimer",
      openLocation: "Ouvrir l'Emplacement",
      retry: "Réessayer",
    },
    fileSize: "Taille",
    duration: "Durée",
    outputFormat: "Format de sortie",
    quality: "Qualité",
  },

  // Progress Display
  progress: {
    title: "Progression",
    overall: "Progression Globale",
    idle: "En attente",
    converting: "Conversion en cours...",
    completed: "Conversion terminée !",
    speed: "Vitesse",
    timeRemaining: "Temps restant",
    fps: "IPS", // Images par seconde
  },

  // Settings Panel
  settings: {
    title: "Paramètres",
    button: "Paramètres",
    close: "Fermer",
    saveSettings: "Sauvegarder les Paramètres",
    output: {
      title: "Paramètres de Sortie",
      directory: "Répertoire de Sortie",
      directoryDescription: "Répertoire où les fichiers convertis seront sauvegardés",
      directoryPlaceholder: "Même emplacement que le fichier d'entrée",
      browse: "Parcourir",
      defaultFormat: "Format par Défaut",
      defaultFormatDescription: "Format de sortie par défaut pour les nouveaux fichiers",
      defaultQuality: "Qualité par Défaut",
      defaultQualityDescription: "Paramètre de qualité par défaut"
    },
    performance: {
      title: "Paramètres de Performance",
      concurrentJobs: "Tâches Simultanées",
      concurrentJobsTooltip: "Nombre de fichiers à convertir simultanément",
      concurrentJobsDescription: "Des valeurs plus élevées peuvent utiliser plus de ressources système",
      gpuAcceleration: "Accélération GPU",
      gpuAccelerationDescription: "Utiliser le GPU pour un traitement vidéo plus rapide si disponible",
      autoDetectHardware: "Détection Automatique du Matériel",
      autoDetectHardwareDescription: "Optimiser automatiquement les paramètres selon les capacités du système"
    },
    general: {
      title: "Paramètres Généraux",
      preserveMetadata: "Préserver les Métadonnées",
      preserveMetadataDescription: "Conserver les métadonnées du fichier original (titre, artiste, etc.)",
      autoStartConversion: "Démarrage Automatique de la Conversion",
      autoStartConversionDescription: "Démarrer automatiquement la conversion lors de l'ajout de fichiers",
      notifications: "Notifications",
      notificationsDescription: "Afficher des notifications système à la fin des conversions"
    },
    system: {
      title: "Informations Système",
      hardwareNotAvailable: "Informations matérielles non disponibles",
      systemInformation: "Informations Système",
      cpu: "CPU",
      cores: "cœurs",
      threads: "threads",
      gpuAcceleration: "Accélération GPU",
      noGpuAvailable: "Aucune accélération GPU disponible",
      memory: "Mémoire",
      total: "Total",
      available: "Disponible"
    },
    quality: {
      low: "Faible",
      medium: "Moyenne",
      high: "Élevée",
      ultra: "Ultra"
    },
    save: "Enregistrer les Paramètres",
    saved: "Paramètres enregistrés",
    failedToSave: "Échec de l'enregistrement des paramètres",
  },

  // Header Bar
  header: {
    title: "Convertisseur Vidéo",
    services: {
      ready: "Services prêts",
      notReady: "Services non prêts",
      ffmpegNotAvailable: "FFmpeg non disponible",
    },
    hardware: {
      cpu: "CPU",
      gpu: "GPU",
      memory: "Mémoire",
    },
  },

  // Menu
  menu: {
    file: {
      label: "Fichier",
      addFiles: "Ajouter des Fichiers",
      clearQueue: "Vider la File",
      exit: "Quitter",
    },
    convert: {
      label: "Conversion",
      start: "Démarrer la Conversion",
      pauseAll: "Suspendre Tout",
      cancelAll: "Annuler Tout",
    },
    view: {
      label: "Affichage",
      reload: "Actualiser",
      forceReload: "Forcer l'Actualisation",
      toggleDevTools: "Basculer les Outils de Développement",
      resetZoom: "Réinitialiser le Zoom",
      zoomIn: "Zoom Avant",
      zoomOut: "Zoom Arrière",
      toggleFullscreen: "Basculer le Plein Écran",
    },
    help: {
      label: "Aide",
      about: "À Propos du Convertisseur Vidéo",
      supportedFormats: "Formats Supportés",
      reportIssue: "Signaler un Problème",
    },
  },

  // Messages
  messages: {
    ffmpegNotFound: "FFmpeg non trouvé. Certaines fonctionnalités peuvent ne pas fonctionner correctement.",
    ffmpegNotAvailable: "FFmpeg non disponible. Veuillez vérifier l'installation.",
    servicesInitializationFailed: "Échec de l'initialisation des services de traitement vidéo",
    filesAdded: "fichier(s) ajouté(s) à la file d'attente",
    noFilesToConvert: "Aucun fichier à convertir",
    noPendingTasks: "Aucune tâche en attente à convertir",
    conversionStarted: "Conversion démarrée",
    conversionPaused: "Conversion suspendue",
    conversionCancelled: "Conversion annulée",
    conversionFailed: "Échec de la conversion",
    queueCleared: "File d'attente vidée",
    noFilesInQueue: "Aucun fichier dans la file d'attente à convertir",
    taskRemovalFailed: "Échec de la suppression de la tâche",
    fileProcessingFailed: "Échec du traitement du fichier",
    selectedFilesProcessingFailed: "Échec du traitement des fichiers sélectionnés",
  },

  // About Dialog
  about: {
    title: "À Propos du Convertisseur Vidéo",
    version: "Convertisseur Vidéo v1.0.0",
    description: "Convertisseur vidéo multiplateforme alimenté par FFmpeg\n\nCréé avec Electron, React et TypeScript",
  },

  // Supported Formats Dialog
  supportedFormats: {
    title: "Formats de Fichiers Supportés",
    input: "Formats d'Entrée",
    output: "Formats de Sortie",
    video: "Vidéo",
    audio: "Audio",
    inputFormats: {
      video: "MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP, TS, MTS, M2TS",
      audio: "MP3, WAV, FLAC, AAC, OGG, M4A, WMA",
    },
    outputFormats: {
      video: "MP4 (H.264, H.265)",
      audio: "MP3, AAC, WAV",
    },
  },

  // Error Messages
  errors: {
    electronApiNotAvailable: "API Electron non disponible. Veuillez vérifier le script de préchargement.",
    initializationFailed: "Échec de l'initialisation de l'application",
    fileSelectionFailed: "Échec de la sélection des fichiers",
    conversionStartFailed: "Échec du démarrage de la conversion",
    conversionPauseFailed: "Échec de la suspension de la conversion",
    conversionCancelFailed: "Échec de l'annulation de la conversion",
    settingsSaveFailed: "Échec de l'enregistrement des paramètres",
  },
};

export type TranslationKeys = typeof fr;