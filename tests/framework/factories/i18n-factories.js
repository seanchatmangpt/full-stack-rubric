import { faker } from '@faker-js/faker'

/**
 * Internationalization (i18n) data factory for multi-language testing
 * Generates realistic localization data for various languages and regions
 */
export class I18nFactory {
  /**
   * Base i18n data generator
   * @param {Object} overrides - Properties to override
   * @returns {Object} I18n data object
   */
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      version: faker.system.semver(),
      lastUpdated: faker.date.recent(),
      ...overrides
    }
  }

  /**
   * Create translation dictionary for a specific language
   * @param {string} locale - Language/locale code (e.g., 'en', 'es', 'fr')
   * @param {Object} overrides - Properties to override
   * @returns {Object} Translation dictionary
   */
  static createTranslations(locale = 'en', overrides = {}) {
    // Set faker locale for realistic data
    const originalLocale = faker.locale
    if (['es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'].includes(locale)) {
      faker.setLocale(locale)
    }

    const translations = {
      locale,
      direction: this.getTextDirection(locale),
      common: {
        // Navigation
        home: this.getTranslation(locale, 'Home', { es: 'Inicio', fr: 'Accueil', de: 'Startseite' }),
        about: this.getTranslation(locale, 'About', { es: 'Acerca de', fr: 'À propos', de: 'Über uns' }),
        contact: this.getTranslation(locale, 'Contact', { es: 'Contacto', fr: 'Contact', de: 'Kontakt' }),
        services: this.getTranslation(locale, 'Services', { es: 'Servicios', fr: 'Services', de: 'Dienstleistungen' }),
        blog: this.getTranslation(locale, 'Blog', { es: 'Blog', fr: 'Blog', de: 'Blog' }),
        
        // Actions
        save: this.getTranslation(locale, 'Save', { es: 'Guardar', fr: 'Enregistrer', de: 'Speichern' }),
        cancel: this.getTranslation(locale, 'Cancel', { es: 'Cancelar', fr: 'Annuler', de: 'Abbrechen' }),
        delete: this.getTranslation(locale, 'Delete', { es: 'Eliminar', fr: 'Supprimer', de: 'Löschen' }),
        edit: this.getTranslation(locale, 'Edit', { es: 'Editar', fr: 'Modifier', de: 'Bearbeiten' }),
        create: this.getTranslation(locale, 'Create', { es: 'Crear', fr: 'Créer', de: 'Erstellen' }),
        update: this.getTranslation(locale, 'Update', { es: 'Actualizar', fr: 'Mettre à jour', de: 'Aktualisieren' }),
        submit: this.getTranslation(locale, 'Submit', { es: 'Enviar', fr: 'Soumettre', de: 'Übermitteln' }),
        search: this.getTranslation(locale, 'Search', { es: 'Buscar', fr: 'Rechercher', de: 'Suchen' }),
        filter: this.getTranslation(locale, 'Filter', { es: 'Filtrar', fr: 'Filtrer', de: 'Filtern' }),
        sort: this.getTranslation(locale, 'Sort', { es: 'Ordenar', fr: 'Trier', de: 'Sortieren' }),
        
        // Status
        loading: this.getTranslation(locale, 'Loading...', { es: 'Cargando...', fr: 'Chargement...', de: 'Laden...' }),
        success: this.getTranslation(locale, 'Success', { es: 'Éxito', fr: 'Succès', de: 'Erfolg' }),
        error: this.getTranslation(locale, 'Error', { es: 'Error', fr: 'Erreur', de: 'Fehler' }),
        warning: this.getTranslation(locale, 'Warning', { es: 'Advertencia', fr: 'Avertissement', de: 'Warnung' }),
        info: this.getTranslation(locale, 'Information', { es: 'Información', fr: 'Information', de: 'Information' }),
        
        // Time and dates
        today: this.getTranslation(locale, 'Today', { es: 'Hoy', fr: 'Aujourd\'hui', de: 'Heute' }),
        yesterday: this.getTranslation(locale, 'Yesterday', { es: 'Ayer', fr: 'Hier', de: 'Gestern' }),
        tomorrow: this.getTranslation(locale, 'Tomorrow', { es: 'Mañana', fr: 'Demain', de: 'Morgen' }),
        
        // Quantities
        all: this.getTranslation(locale, 'All', { es: 'Todos', fr: 'Tous', de: 'Alle' }),
        none: this.getTranslation(locale, 'None', { es: 'Ninguno', fr: 'Aucun', de: 'Keine' }),
        more: this.getTranslation(locale, 'More', { es: 'Más', fr: 'Plus', de: 'Mehr' }),
        less: this.getTranslation(locale, 'Less', { es: 'Menos', fr: 'Moins', de: 'Weniger' }),
        
        // Confirmation
        yes: this.getTranslation(locale, 'Yes', { es: 'Sí', fr: 'Oui', de: 'Ja' }),
        no: this.getTranslation(locale, 'No', { es: 'No', fr: 'Non', de: 'Nein' }),
        ok: this.getTranslation(locale, 'OK', { es: 'OK', fr: 'OK', de: 'OK' }),
        confirm: this.getTranslation(locale, 'Confirm', { es: 'Confirmar', fr: 'Confirmer', de: 'Bestätigen' })
      },
      
      auth: {
        login: this.getTranslation(locale, 'Log In', { es: 'Iniciar Sesión', fr: 'Se connecter', de: 'Anmelden' }),
        logout: this.getTranslation(locale, 'Log Out', { es: 'Cerrar Sesión', fr: 'Se déconnecter', de: 'Abmelden' }),
        register: this.getTranslation(locale, 'Register', { es: 'Registrarse', fr: 'S\'inscrire', de: 'Registrieren' }),
        forgotPassword: this.getTranslation(locale, 'Forgot Password?', { es: '¿Olvidaste tu contraseña?', fr: 'Mot de passe oublié?', de: 'Passwort vergessen?' }),
        resetPassword: this.getTranslation(locale, 'Reset Password', { es: 'Restablecer Contraseña', fr: 'Réinitialiser le mot de passe', de: 'Passwort zurücksetzen' }),
        email: this.getTranslation(locale, 'Email', { es: 'Correo electrónico', fr: 'E-mail', de: 'E-Mail' }),
        password: this.getTranslation(locale, 'Password', { es: 'Contraseña', fr: 'Mot de passe', de: 'Passwort' }),
        confirmPassword: this.getTranslation(locale, 'Confirm Password', { es: 'Confirmar Contraseña', fr: 'Confirmer le mot de passe', de: 'Passwort bestätigen' }),
        rememberMe: this.getTranslation(locale, 'Remember Me', { es: 'Recordarme', fr: 'Se souvenir de moi', de: 'Angemeldet bleiben' }),
        welcomeBack: this.getTranslation(locale, 'Welcome back!', { es: '¡Bienvenido de vuelta!', fr: 'Bon retour!', de: 'Willkommen zurück!' }),
        createAccount: this.getTranslation(locale, 'Create Account', { es: 'Crear Cuenta', fr: 'Créer un compte', de: 'Konto erstellen' })
      },
      
      forms: {
        firstName: this.getTranslation(locale, 'First Name', { es: 'Nombre', fr: 'Prénom', de: 'Vorname' }),
        lastName: this.getTranslation(locale, 'Last Name', { es: 'Apellido', fr: 'Nom', de: 'Nachname' }),
        fullName: this.getTranslation(locale, 'Full Name', { es: 'Nombre Completo', fr: 'Nom complet', de: 'Vollständiger Name' }),
        phone: this.getTranslation(locale, 'Phone', { es: 'Teléfono', fr: 'Téléphone', de: 'Telefon' }),
        address: this.getTranslation(locale, 'Address', { es: 'Dirección', fr: 'Adresse', de: 'Adresse' }),
        city: this.getTranslation(locale, 'City', { es: 'Ciudad', fr: 'Ville', de: 'Stadt' }),
        country: this.getTranslation(locale, 'Country', { es: 'País', fr: 'Pays', de: 'Land' }),
        zipCode: this.getTranslation(locale, 'ZIP Code', { es: 'Código Postal', fr: 'Code postal', de: 'Postleitzahl' }),
        birthDate: this.getTranslation(locale, 'Birth Date', { es: 'Fecha de Nacimiento', fr: 'Date de naissance', de: 'Geburtsdatum' }),
        gender: this.getTranslation(locale, 'Gender', { es: 'Género', fr: 'Genre', de: 'Geschlecht' }),
        occupation: this.getTranslation(locale, 'Occupation', { es: 'Ocupación', fr: 'Profession', de: 'Beruf' }),
        company: this.getTranslation(locale, 'Company', { es: 'Empresa', fr: 'Entreprise', de: 'Unternehmen' }),
        website: this.getTranslation(locale, 'Website', { es: 'Sitio Web', fr: 'Site web', de: 'Website' }),
        message: this.getTranslation(locale, 'Message', { es: 'Mensaje', fr: 'Message', de: 'Nachricht' }),
        subject: this.getTranslation(locale, 'Subject', { es: 'Asunto', fr: 'Sujet', de: 'Betreff' })
      },
      
      validation: {
        required: this.getTranslation(locale, 'This field is required', { es: 'Este campo es obligatorio', fr: 'Ce champ est requis', de: 'Dieses Feld ist erforderlich' }),
        email: this.getTranslation(locale, 'Please enter a valid email', { es: 'Por favor ingresa un email válido', fr: 'Veuillez entrer un email valide', de: 'Bitte geben Sie eine gültige E-Mail ein' }),
        minLength: this.getTranslation(locale, 'Minimum length is {count} characters', { es: 'La longitud mínima es {count} caracteres', fr: 'La longueur minimale est de {count} caractères', de: 'Mindestlänge ist {count} Zeichen' }),
        maxLength: this.getTranslation(locale, 'Maximum length is {count} characters', { es: 'La longitud máxima es {count} caracteres', fr: 'La longueur maximale est de {count} caractères', de: 'Maximale Länge ist {count} Zeichen' }),
        passwordMismatch: this.getTranslation(locale, 'Passwords do not match', { es: 'Las contraseñas no coinciden', fr: 'Les mots de passe ne correspondent pas', de: 'Passwörter stimmen nicht überein' }),
        invalidPhone: this.getTranslation(locale, 'Please enter a valid phone number', { es: 'Por favor ingresa un número de teléfono válido', fr: 'Veuillez entrer un numéro de téléphone valide', de: 'Bitte geben Sie eine gültige Telefonnummer ein' }),
        invalidUrl: this.getTranslation(locale, 'Please enter a valid URL', { es: 'Por favor ingresa una URL válida', fr: 'Veuillez entrer une URL valide', de: 'Bitte geben Sie eine gültige URL ein' }),
        tooYoung: this.getTranslation(locale, 'You must be at least 18 years old', { es: 'Debes tener al menos 18 años', fr: 'Vous devez avoir au moins 18 ans', de: 'Sie müssen mindestens 18 Jahre alt sein' })
      },
      
      messages: {
        welcomeUser: this.getTranslation(locale, 'Welcome, {name}!', { es: '¡Bienvenido, {name}!', fr: 'Bienvenue, {name}!', de: 'Willkommen, {name}!' }),
        itemsFound: this.getTranslation(locale, '{count} {count, plural, one {item} other {items}} found', { es: '{count} {count, plural, one {elemento} other {elementos}} encontrado(s)', fr: '{count} {count, plural, one {élément} other {éléments}} trouvé(s)', de: '{count} {count, plural, one {Element} other {Elemente}} gefunden' }),
        confirmDelete: this.getTranslation(locale, 'Are you sure you want to delete this item?', { es: '¿Estás seguro de que quieres eliminar este elemento?', fr: 'Êtes-vous sûr de vouloir supprimer cet élément?', de: 'Sind Sie sicher, dass Sie dieses Element löschen möchten?' }),
        saveSuccess: this.getTranslation(locale, 'Your changes have been saved successfully', { es: 'Tus cambios se han guardado exitosamente', fr: 'Vos modifications ont été enregistrées avec succès', de: 'Ihre Änderungen wurden erfolgreich gespeichert' }),
        networkError: this.getTranslation(locale, 'Network error. Please check your connection.', { es: 'Error de red. Por favor verifica tu conexión.', fr: 'Erreur réseau. Veuillez vérifier votre connexion.', de: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.' }),
        sessionExpired: this.getTranslation(locale, 'Your session has expired. Please log in again.', { es: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.', fr: 'Votre session a expiré. Veuillez vous reconnecter.', de: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' }),
        accessDenied: this.getTranslation(locale, 'Access denied. You do not have permission to view this page.', { es: 'Acceso denegado. No tienes permiso para ver esta página.', fr: 'Accès refusé. Vous n\'avez pas la permission de voir cette page.', de: 'Zugriff verweigert. Sie haben keine Berechtigung, diese Seite zu betrachten.' })
      },
      
      navigation: {
        dashboard: this.getTranslation(locale, 'Dashboard', { es: 'Panel de Control', fr: 'Tableau de bord', de: 'Dashboard' }),
        profile: this.getTranslation(locale, 'Profile', { es: 'Perfil', fr: 'Profil', de: 'Profil' }),
        settings: this.getTranslation(locale, 'Settings', { es: 'Configuración', fr: 'Paramètres', de: 'Einstellungen' }),
        users: this.getTranslation(locale, 'Users', { es: 'Usuarios', fr: 'Utilisateurs', de: 'Benutzer' }),
        reports: this.getTranslation(locale, 'Reports', { es: 'Reportes', fr: 'Rapports', de: 'Berichte' }),
        help: this.getTranslation(locale, 'Help', { es: 'Ayuda', fr: 'Aide', de: 'Hilfe' }),
        documentation: this.getTranslation(locale, 'Documentation', { es: 'Documentación', fr: 'Documentation', de: 'Dokumentation' }),
        support: this.getTranslation(locale, 'Support', { es: 'Soporte', fr: 'Support', de: 'Support' }),
        privacy: this.getTranslation(locale, 'Privacy', { es: 'Privacidad', fr: 'Confidentialité', de: 'Datenschutz' }),
        terms: this.getTranslation(locale, 'Terms of Service', { es: 'Términos de Servicio', fr: 'Conditions d\'utilisation', de: 'Nutzungsbedingungen' })
      },
      
      time: {
        now: this.getTranslation(locale, 'now', { es: 'ahora', fr: 'maintenant', de: 'jetzt' }),
        minuteAgo: this.getTranslation(locale, 'a minute ago', { es: 'hace un minuto', fr: 'il y a une minute', de: 'vor einer Minute' }),
        minutesAgo: this.getTranslation(locale, '{count} minutes ago', { es: 'hace {count} minutos', fr: 'il y a {count} minutes', de: 'vor {count} Minuten' }),
        hourAgo: this.getTranslation(locale, 'an hour ago', { es: 'hace una hora', fr: 'il y a une heure', de: 'vor einer Stunde' }),
        hoursAgo: this.getTranslation(locale, '{count} hours ago', { es: 'hace {count} horas', fr: 'il y a {count} heures', de: 'vor {count} Stunden' }),
        dayAgo: this.getTranslation(locale, 'a day ago', { es: 'hace un día', fr: 'il y a un jour', de: 'vor einem Tag' }),
        daysAgo: this.getTranslation(locale, '{count} days ago', { es: 'hace {count} días', fr: 'il y a {count} jours', de: 'vor {count} Tagen' }),
        weekAgo: this.getTranslation(locale, 'a week ago', { es: 'hace una semana', fr: 'il y a une semaine', de: 'vor einer Woche' }),
        weeksAgo: this.getTranslation(locale, '{count} weeks ago', { es: 'hace {count} semanas', fr: 'il y a {count} semaines', de: 'vor {count} Wochen' }),
        monthAgo: this.getTranslation(locale, 'a month ago', { es: 'hace un mes', fr: 'il y a un mois', de: 'vor einem Monat' }),
        monthsAgo: this.getTranslation(locale, '{count} months ago', { es: 'hace {count} meses', fr: 'il y a {count} mois', de: 'vor {count} Monaten' }),
        yearAgo: this.getTranslation(locale, 'a year ago', { es: 'hace un año', fr: 'il y a un an', de: 'vor einem Jahr' }),
        yearsAgo: this.getTranslation(locale, '{count} years ago', { es: 'hace {count} años', fr: 'il y a {count} ans', de: 'vor {count} Jahren' })
      },
      
      currency: {
        format: this.getCurrencyFormat(locale),
        symbol: this.getCurrencySymbol(locale),
        code: this.getCurrencyCode(locale)
      },
      
      numbers: {
        decimal: this.getDecimalSeparator(locale),
        thousands: this.getThousandsSeparator(locale)
      },
      
      dateTime: {
        formats: this.getDateTimeFormats(locale),
        firstDayOfWeek: this.getFirstDayOfWeek(locale),
        weekdays: this.getWeekdays(locale),
        months: this.getMonths(locale),
        meridiem: this.getMeridiem(locale)
      },
      
      ...overrides
    }

    // Reset faker locale
    faker.setLocale(originalLocale)
    
    return translations
  }

  /**
   * Create multiple translation dictionaries for different locales
   * @param {Array} locales - Array of locale codes
   * @returns {Object} Object with translations for each locale
   */
  static createMultipleTranslations(locales = ['en', 'es', 'fr', 'de']) {
    const translations = {}
    
    locales.forEach(locale => {
      translations[locale] = this.createTranslations(locale)
    })
    
    return translations
  }

  /**
   * Create locale configuration data
   * @param {string} locale - Locale code
   * @returns {Object} Locale configuration
   */
  static createLocaleConfig(locale = 'en') {
    return {
      code: locale,
      name: this.getLocaleName(locale),
      nativeName: this.getNativeLocaleName(locale),
      direction: this.getTextDirection(locale),
      region: this.getRegion(locale),
      currency: this.getCurrencyCode(locale),
      dateFormat: this.getDateFormat(locale),
      timeFormat: this.getTimeFormat(locale),
      firstDayOfWeek: this.getFirstDayOfWeek(locale),
      pluralRules: this.getPluralRules(locale),
      enabled: faker.datatype.boolean(0.8),
      fallback: locale === 'en' ? null : 'en',
      completeness: faker.number.float({ min: 0.6, max: 1.0, fractionDigits: 2 }),
      lastUpdated: faker.date.recent()
    }
  }

  /**
   * Create pluralization test data
   * @param {string} locale - Locale code
   * @returns {Object} Pluralization test cases
   */
  static createPluralTestData(locale = 'en') {
    return {
      locale,
      rules: this.getPluralRules(locale),
      testCases: [
        { count: 0, expected: 'zero' },
        { count: 1, expected: 'one' },
        { count: 2, expected: locale === 'en' ? 'other' : 'few' },
        { count: 5, expected: 'other' },
        { count: 10, expected: 'other' },
        { count: 21, expected: locale === 'ru' ? 'one' : 'other' },
        { count: 100, expected: 'other' }
      ],
      examples: {
        item: this.getTranslation(locale, '{count} {count, plural, zero {items} one {item} few {items} other {items}}', {
          es: '{count} {count, plural, zero {elementos} one {elemento} few {elementos} other {elementos}}',
          fr: '{count} {count, plural, zero {éléments} one {élément} few {éléments} other {éléments}}',
          de: '{count} {count, plural, zero {Elemente} one {Element} few {Elemente} other {Elemente}}'
        }),
        person: this.getTranslation(locale, '{count} {count, plural, zero {people} one {person} few {people} other {people}}', {
          es: '{count} {count, plural, zero {personas} one {persona} few {personas} other {personas}}',
          fr: '{count} {count, plural, zero {personnes} one {personne} few {personnes} other {personnes}}',
          de: '{count} {count, plural, zero {Personen} one {Person} few {Personen} other {Personen}}'
        })
      }
    }
  }

  /**
   * Create context-aware translation data
   * @param {string} locale - Locale code
   * @returns {Object} Context-aware translations
   */
  static createContextualTranslations(locale = 'en') {
    return {
      locale,
      contexts: {
        formal: {
          greeting: this.getTranslation(locale, 'Good day', { es: 'Buenos días', fr: 'Bonjour', de: 'Guten Tag' }),
          farewell: this.getTranslation(locale, 'Have a good day', { es: 'Que tenga un buen día', fr: 'Bonne journée', de: 'Schönen Tag noch' })
        },
        informal: {
          greeting: this.getTranslation(locale, 'Hey!', { es: '¡Hola!', fr: 'Salut!', de: 'Hallo!' }),
          farewell: this.getTranslation(locale, 'See you later!', { es: '¡Hasta luego!', fr: 'À plus tard!', de: 'Bis später!' })
        },
        professional: {
          greeting: this.getTranslation(locale, 'Welcome to our platform', { es: 'Bienvenido a nuestra plataforma', fr: 'Bienvenue sur notre plateforme', de: 'Willkommen auf unserer Plattform' }),
          farewell: this.getTranslation(locale, 'Thank you for using our service', { es: 'Gracias por usar nuestro servicio', fr: 'Merci d\'utiliser notre service', de: 'Vielen Dank für die Nutzung unseres Services' })
        }
      }
    }
  }

  /**
   * Create RTL (Right-to-Left) language test data
   * @returns {Object} RTL language data
   */
  static createRTLTestData() {
    const rtlLocales = ['ar', 'he', 'fa', 'ur']
    const locale = faker.helpers.arrayElement(rtlLocales)
    
    return {
      locale,
      direction: 'rtl',
      name: this.getLocaleName(locale),
      testStrings: {
        mixed: 'Hello العالم World', // Mixed LTR/RTL
        numbers: '123 عدد 456',
        email: 'user@example.com مع نص',
        url: 'https://example.com في الرابط'
      },
      layout: {
        textAlign: 'right',
        flexDirection: 'row-reverse',
        marginLeft: 'auto',
        marginRight: '0'
      },
      translations: {
        welcome: locale === 'ar' ? 'مرحبا' : locale === 'he' ? 'ברוך הבא' : 'خوش آمدید',
        goodbye: locale === 'ar' ? 'وداعا' : locale === 'he' ? 'להתראות' : 'خداحافظ',
        yes: locale === 'ar' ? 'نعم' : locale === 'he' ? 'כן' : 'بله',
        no: locale === 'ar' ? 'لا' : locale === 'he' ? 'לא' : 'نه'
      }
    }
  }

  /**
   * Create number formatting test data for different locales
   * @param {string} locale - Locale code
   * @returns {Object} Number formatting test data
   */
  static createNumberFormattingData(locale = 'en') {
    const testNumbers = [
      1234.56,
      1000000,
      0.123456,
      -1234.56,
      1234567890.123
    ]

    return {
      locale,
      formats: {
        decimal: this.getDecimalSeparator(locale),
        thousands: this.getThousandsSeparator(locale),
        currency: this.getCurrencyFormat(locale)
      },
      testCases: testNumbers.map(number => ({
        input: number,
        formatted: this.formatNumber(number, locale),
        currency: this.formatCurrency(number, locale),
        percent: this.formatPercent(number / 100, locale)
      }))
    }
  }

  /**
   * Create date/time formatting test data
   * @param {string} locale - Locale code
   * @returns {Object} Date/time formatting test data
   */
  static createDateTimeFormattingData(locale = 'en') {
    const testDate = faker.date.recent()
    
    return {
      locale,
      testDate: testDate.toISOString(),
      formats: this.getDateTimeFormats(locale),
      examples: {
        short: this.formatDate(testDate, locale, 'short'),
        medium: this.formatDate(testDate, locale, 'medium'),
        long: this.formatDate(testDate, locale, 'long'),
        time: this.formatTime(testDate, locale),
        relative: this.formatRelativeTime(testDate, locale)
      },
      weekdays: this.getWeekdays(locale),
      months: this.getMonths(locale),
      meridiem: this.getMeridiem(locale)
    }
  }

  /**
   * Get translation with fallback
   * @param {string} locale - Target locale
   * @param {string} defaultText - Default English text
   * @param {Object} translations - Translation map
   * @returns {string} Translated text
   */
  static getTranslation(locale, defaultText, translations = {}) {
    return translations[locale] || defaultText
  }

  /**
   * Get text direction for locale
   * @param {string} locale - Locale code
   * @returns {string} Text direction (ltr or rtl)
   */
  static getTextDirection(locale) {
    const rtlLocales = ['ar', 'he', 'fa', 'ur', 'ku', 'dv']
    return rtlLocales.includes(locale) ? 'rtl' : 'ltr'
  }

  /**
   * Get locale display name in English
   * @param {string} locale - Locale code
   * @returns {string} Locale name
   */
  static getLocaleName(locale) {
    const names = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ar: 'Arabic',
      he: 'Hebrew',
      fa: 'Persian',
      ur: 'Urdu'
    }
    return names[locale] || 'Unknown'
  }

  /**
   * Get locale native name
   * @param {string} locale - Locale code
   * @returns {string} Native locale name
   */
  static getNativeLocaleName(locale) {
    const names = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      ko: '한국어',
      zh: '中文',
      ar: 'العربية',
      he: 'עברית',
      fa: 'فارسی',
      ur: 'اردو'
    }
    return names[locale] || locale
  }

  /**
   * Get region for locale
   * @param {string} locale - Locale code
   * @returns {string} Region
   */
  static getRegion(locale) {
    const regions = {
      en: 'US',
      es: 'ES',
      fr: 'FR',
      de: 'DE',
      it: 'IT',
      pt: 'BR',
      ru: 'RU',
      ja: 'JP',
      ko: 'KR',
      zh: 'CN',
      ar: 'SA',
      he: 'IL',
      fa: 'IR',
      ur: 'PK'
    }
    return regions[locale] || 'US'
  }

  /**
   * Get currency code for locale
   * @param {string} locale - Locale code
   * @returns {string} Currency code
   */
  static getCurrencyCode(locale) {
    const currencies = {
      en: 'USD',
      es: 'EUR',
      fr: 'EUR',
      de: 'EUR',
      it: 'EUR',
      pt: 'BRL',
      ru: 'RUB',
      ja: 'JPY',
      ko: 'KRW',
      zh: 'CNY',
      ar: 'SAR',
      he: 'ILS',
      fa: 'IRR',
      ur: 'PKR'
    }
    return currencies[locale] || 'USD'
  }

  /**
   * Get currency symbol for locale
   * @param {string} locale - Locale code
   * @returns {string} Currency symbol
   */
  static getCurrencySymbol(locale) {
    const symbols = {
      en: '$',
      es: '€',
      fr: '€',
      de: '€',
      it: '€',
      pt: 'R$',
      ru: '₽',
      ja: '¥',
      ko: '₩',
      zh: '¥',
      ar: 'ر.س',
      he: '₪',
      fa: '﷼',
      ur: '₨'
    }
    return symbols[locale] || '$'
  }

  /**
   * Get decimal separator for locale
   * @param {string} locale - Locale code
   * @returns {string} Decimal separator
   */
  static getDecimalSeparator(locale) {
    const separators = {
      en: '.',
      es: ',',
      fr: ',',
      de: ',',
      it: ',',
      pt: ',',
      ru: ',',
      ja: '.',
      ko: '.',
      zh: '.',
      ar: '.',
      he: '.',
      fa: '.',
      ur: '.'
    }
    return separators[locale] || '.'
  }

  /**
   * Get thousands separator for locale
   * @param {string} locale - Locale code
   * @returns {string} Thousands separator
   */
  static getThousandsSeparator(locale) {
    const separators = {
      en: ',',
      es: '.',
      fr: ' ',
      de: '.',
      it: '.',
      pt: '.',
      ru: ' ',
      ja: ',',
      ko: ',',
      zh: ',',
      ar: ',',
      he: ',',
      fa: ',',
      ur: ','
    }
    return separators[locale] || ','
  }

  /**
   * Get date/time formats for locale
   * @param {string} locale - Locale code
   * @returns {Object} Date/time formats
   */
  static getDateTimeFormats(locale) {
    const formats = {
      en: { short: 'MM/DD/YYYY', medium: 'MMM DD, YYYY', long: 'MMMM DD, YYYY', time: 'h:mm A' },
      es: { short: 'DD/MM/YYYY', medium: 'DD MMM YYYY', long: 'DD [de] MMMM [de] YYYY', time: 'H:mm' },
      fr: { short: 'DD/MM/YYYY', medium: 'DD MMM YYYY', long: 'DD MMMM YYYY', time: 'H:mm' },
      de: { short: 'DD.MM.YYYY', medium: 'DD. MMM YYYY', long: 'DD. MMMM YYYY', time: 'H:mm' }
    }
    return formats[locale] || formats.en
  }

  /**
   * Get first day of week for locale
   * @param {string} locale - Locale code
   * @returns {number} Day index (0 = Sunday, 1 = Monday)
   */
  static getFirstDayOfWeek(locale) {
    const firstDays = {
      en: 0, // Sunday
      es: 1, // Monday
      fr: 1, // Monday
      de: 1, // Monday
      it: 1, // Monday
      pt: 1, // Monday
      ru: 1, // Monday
      ja: 0, // Sunday
      ko: 0, // Sunday
      zh: 1, // Monday
      ar: 6, // Saturday
      he: 0, // Sunday
      fa: 6, // Saturday
      ur: 1  // Monday
    }
    return firstDays[locale] || 0
  }

  /**
   * Get weekday names for locale
   * @param {string} locale - Locale code
   * @returns {Array} Weekday names
   */
  static getWeekdays(locale) {
    const weekdays = {
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    }
    return weekdays[locale] || weekdays.en
  }

  /**
   * Get month names for locale
   * @param {string} locale - Locale code
   * @returns {Array} Month names
   */
  static getMonths(locale) {
    const months = {
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    }
    return months[locale] || months.en
  }

  /**
   * Get AM/PM labels for locale
   * @param {string} locale - Locale code
   * @returns {Object} AM/PM labels
   */
  static getMeridiem(locale) {
    const meridiem = {
      en: { am: 'AM', pm: 'PM' },
      es: { am: 'a. m.', pm: 'p. m.' },
      fr: { am: 'AM', pm: 'PM' },
      de: { am: 'AM', pm: 'PM' }
    }
    return meridiem[locale] || meridiem.en
  }

  /**
   * Get plural rules for locale
   * @param {string} locale - Locale code
   * @returns {Array} Plural rule categories
   */
  static getPluralRules(locale) {
    const rules = {
      en: ['one', 'other'],
      es: ['one', 'other'],
      fr: ['one', 'other'],
      de: ['one', 'other'],
      ru: ['one', 'few', 'many', 'other'],
      ar: ['zero', 'one', 'two', 'few', 'many', 'other'],
      he: ['one', 'two', 'many', 'other']
    }
    return rules[locale] || rules.en
  }

  // Helper methods for formatting (simplified implementations)
  static formatNumber(number, locale) {
    return number.toLocaleString(locale)
  }

  static formatCurrency(number, locale) {
    const currency = this.getCurrencyCode(locale)
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(number)
  }

  static formatPercent(number, locale) {
    return new Intl.NumberFormat(locale, { style: 'percent' }).format(number)
  }

  static formatDate(date, locale, style = 'short') {
    const options = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' }
    }
    return new Intl.DateTimeFormat(locale, options[style]).format(date)
  }

  static formatTime(date, locale) {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric' }).format(date)
  }

  static formatRelativeTime(date, locale) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const diff = Math.round((date - new Date()) / (1000 * 60 * 60 * 24))
    return rtf.format(diff, 'day')
  }

  static getCurrencyFormat(locale) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: this.getCurrencyCode(locale) })
  }

  static getDateFormat(locale) {
    return this.getDateTimeFormats(locale).short
  }

  static getTimeFormat(locale) {
    return this.getDateTimeFormats(locale).time
  }

  /**
   * Create test data for missing translations
   * @param {Array} locales - Available locales
   * @returns {Object} Missing translations report
   */
  static createMissingTranslationsData(locales = ['en', 'es', 'fr']) {
    const baseKeys = [
      'common.save', 'common.cancel', 'common.delete',
      'auth.login', 'auth.logout', 'auth.register',
      'forms.firstName', 'forms.lastName', 'forms.email',
      'validation.required', 'validation.email',
      'messages.welcomeUser', 'messages.saveSuccess'
    ]

    return {
      locales,
      totalKeys: baseKeys.length,
      missing: locales.map(locale => {
        const missingCount = faker.number.int({ min: 0, max: Math.floor(baseKeys.length * 0.3) })
        const missingKeys = faker.helpers.arrayElements(baseKeys, missingCount)
        
        return {
          locale,
          missing: missingKeys,
          count: missingCount,
          completeness: ((baseKeys.length - missingCount) / baseKeys.length * 100).toFixed(1)
        }
      }),
      lastCheck: faker.date.recent()
    }
  }

  /**
   * Reset faker seed for consistent test data
   * @param {number} seed - Seed value
   */
  static setSeed(seed = 42) {
    faker.seed(seed)
  }
}

export default I18nFactory