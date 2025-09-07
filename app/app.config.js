/**
 * @fileoverview Nuxt app configuration with UI theme and layout settings
 * Defines colors, header, footer, and table of contents configuration
 */

/**
 * @typedef {Object} UIColors
 * @property {string} primary - Primary color theme
 * @property {string} neutral - Neutral color theme
 */

/**
 * @typedef {Object} UIFooterSlots
 * @property {string} root - Root footer styling classes
 * @property {string} left - Left section styling classes
 */

/**
 * @typedef {Object} UIFooter
 * @property {UIFooterSlots} slots - Footer slot configurations
 */

/**
 * @typedef {Object} UIConfig
 * @property {UIColors} colors - Color configuration
 * @property {UIFooter} footer - Footer configuration
 */

/**
 * @typedef {Object} SEOConfig
 * @property {string} siteName - Site name for SEO
 */

/**
 * @typedef {Object} HeaderLogo
 * @property {string} alt - Logo alt text
 * @property {string} light - Light theme logo URL
 * @property {string} dark - Dark theme logo URL
 */

/**
 * @typedef {Object} HeaderLink
 * @property {string} icon - Icon class name
 * @property {string} to - Link URL
 * @property {string} target - Link target
 * @property {string} aria-label - Accessibility label
 */

/**
 * @typedef {Object} HeaderConfig
 * @property {string} title - Header title
 * @property {string} to - Header link destination
 * @property {HeaderLogo} logo - Logo configuration
 * @property {boolean} search - Enable search functionality
 * @property {boolean} colorMode - Enable color mode toggle
 * @property {HeaderLink[]} links - Header navigation links
 */

/**
 * @typedef {Object} FooterLink
 * @property {string} icon - Icon class name
 * @property {string} to - Link URL
 * @property {string} target - Link target
 * @property {string} aria-label - Accessibility label
 */

/**
 * @typedef {Object} FooterConfig
 * @property {string} credits - Footer credits text
 * @property {boolean} colorMode - Enable color mode toggle in footer
 * @property {FooterLink[]} links - Footer links
 */

/**
 * @typedef {Object} TocLink
 * @property {string} icon - Icon class name
 * @property {string} label - Link label
 * @property {string} to - Link URL
 * @property {string} target - Link target
 */

/**
 * @typedef {Object} TocBottom
 * @property {string} title - Bottom section title
 * @property {string} edit - Edit URL template
 * @property {TocLink[]} links - Bottom section links
 */

/**
 * @typedef {Object} TocConfig
 * @property {string} title - Table of contents title
 * @property {TocBottom} bottom - Bottom section configuration
 */

/**
 * @typedef {Object} AppConfig
 * @property {UIConfig} ui - UI configuration
 * @property {SEOConfig} seo - SEO configuration
 * @property {HeaderConfig} header - Header configuration
 * @property {FooterConfig} footer - Footer configuration
 * @property {TocConfig} toc - Table of contents configuration
 */

/**
 * Nuxt App Configuration
 * @type {AppConfig}
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'Nuxt Docs Template'
  },
  header: {
    title: '',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/nuxt-ui-templates/docs',
      'target': '_blank',
      'aria-label': 'GitHub'
    }]
  },
  footer: {
    credits: `Built with Nuxt UI • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-discord',
      'to': 'https://go.nuxt.com/discord',
      'target': '_blank',
      'aria-label': 'Nuxt on Discord'
    }, {
      'icon': 'i-simple-icons-x',
      'to': 'https://go.nuxt.com/x',
      'target': '_blank',
      'aria-label': 'Nuxt on X'
    }, {
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/nuxt/ui',
      'target': '_blank',
      'aria-label': 'Nuxt UI on GitHub'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/nuxt-ui-templates/docs/edit/main/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/nuxt/ui',
        target: '_blank'
      }, {
        icon: 'i-lucide-book-open',
        label: 'Nuxt UI docs',
        to: 'https://ui4.nuxt.com/docs/getting-started/installation/nuxt',
        target: '_blank'
      }]
    }
  }
})