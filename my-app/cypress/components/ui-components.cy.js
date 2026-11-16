import { defineComponent } from 'vue'

// Test components for the UI pattern library
const TestButton = defineComponent({
  name: 'TestButton',
  props: {
    variant: { type: String, default: 'primary' },
    size: { type: String, default: 'medium' },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
  },
  emits: ['click'],
  template: `
    <button 
      :class="[
        'btn', 
        'btn-' + variant, 
        'btn-' + size,
        { 'btn-disabled': disabled, 'btn-loading': loading }
      ]"
      :disabled="disabled || loading"
      @click="$emit('click')"
      :data-testid="'button-' + variant + '-' + size"
    >
      <span v-if="loading" class="loading-spinner">⟳</span>
      <slot>{{ loading ? 'Loading...' : 'Button' }}</slot>
    </button>
  `,
  style: `
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-primary { background: #007bff; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-small { padding: 4px 8px; font-size: 12px; }
    .btn-medium { padding: 8px 16px; font-size: 14px; }
    .btn-large { padding: 12px 24px; font-size: 16px; }
    .btn-disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-loading { position: relative; }
    .loading-spinner { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `
})

const TestCard = defineComponent({
  name: 'TestCard',
  props: {
    title: String,
    subtitle: String,
    image: String,
    elevated: { type: Boolean, default: false }
  },
  template: `
    <div :class="['card', { 'card-elevated': elevated }]" data-testid="test-card">
      <img v-if="image" :src="image" :alt="title" class="card-image">
      <div class="card-content">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
        <slot></slot>
      </div>
    </div>
  `,
  style: `
    .card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
    }
    .card-elevated {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .card-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .card-content {
      padding: 16px;
    }
    .card-title {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }
    .card-subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  `
})

const TestModal = defineComponent({
  name: 'TestModal',
  props: {
    open: { type: Boolean, default: false },
    title: String,
    size: { type: String, default: 'medium' }
  },
  emits: ['close'],
  template: `
    <div v-if="open" class="modal-overlay" @click="$emit('close')" data-testid="modal-overlay">
      <div :class="['modal', 'modal-' + size]" @click.stop data-testid="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">{{ title || 'Modal Title' }}</h2>
          <button @click="$emit('close')" class="modal-close" data-testid="modal-close">×</button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  `,
  style: `
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-height: 90vh;
      overflow: auto;
    }
    .modal-small { width: 400px; }
    .modal-medium { width: 600px; }
    .modal-large { width: 800px; }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #eee;
    }
    .modal-title {
      margin: 0;
      font-size: 20px;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-body {
      padding: 16px;
    }
  `
})

describe('UI Components Testing Suite', () => {
  describe('Button Component', () => {
    it('renders with default props', () => {
      cy.mount(TestButton)
      cy.get('[data-testid="button-primary-medium"]')
        .should('be.visible')
        .and('contain', 'Button')
        .and('have.class', 'btn-primary')
        .and('have.class', 'btn-medium')
    })

    it('renders different variants', () => {
      const variants = ['primary', 'secondary', 'danger']
      
      variants.forEach(variant => {
        cy.mount(TestButton, { props: { variant } })
        cy.get(`[data-testid="button-${variant}-medium"]`)
          .should('have.class', `btn-${variant}`)
      })
    })

    it('renders different sizes', () => {
      const sizes = ['small', 'medium', 'large']
      
      sizes.forEach(size => {
        cy.mount(TestButton, { props: { size } })
        cy.get(`[data-testid="button-primary-${size}"]`)
          .should('have.class', `btn-${size}`)
      })
    })

    it('handles disabled state', () => {
      cy.mount(TestButton, { props: { disabled: true } })
      cy.get('[data-testid="button-primary-medium"]')
        .should('be.disabled')
        .and('have.class', 'btn-disabled')
    })

    it('handles loading state', () => {
      cy.mount(TestButton, { props: { loading: true } })
      cy.get('[data-testid="button-primary-medium"]')
        .should('be.disabled')
        .and('have.class', 'btn-loading')
        .and('contain', 'Loading...')
      
      cy.get('.loading-spinner').should('be.visible')
    })

    it('emits click events', () => {
      const onClickSpy = cy.spy().as('clickSpy')
      cy.mount(TestButton, { props: { onClick: onClickSpy } })
      
      cy.get('[data-testid="button-primary-medium"]').click()
      cy.get('@clickSpy').should('have.been.called')
    })

    it('is accessible', () => {
      cy.mount(TestButton)
      cy.testAccessibility()
    })

    it('is responsive', () => {
      cy.mount(TestButton)
      cy.testResponsive('[data-testid="button-primary-medium"]')
    })
  })

  describe('Card Component', () => {
    it('renders with basic props', () => {
      cy.mount(TestCard, {
        props: {
          title: 'Test Title',
          subtitle: 'Test Subtitle'
        }
      })
      
      cy.get('[data-testid="test-card"]').should('be.visible')
      cy.get('.card-title').should('contain', 'Test Title')
      cy.get('.card-subtitle').should('contain', 'Test Subtitle')
    })

    it('renders with image', () => {
      cy.mount(TestCard, {
        props: {
          title: 'Card with Image',
          image: 'https://via.placeholder.com/300x200'
        }
      })
      
      cy.get('.card-image')
        .should('have.attr', 'src', 'https://via.placeholder.com/300x200')
        .and('have.attr', 'alt', 'Card with Image')
    })

    it('handles elevated state', () => {
      cy.mount(TestCard, { props: { elevated: true } })
      cy.get('[data-testid="test-card"]')
        .should('have.class', 'card-elevated')
    })

    it('renders slot content', () => {
      cy.mount(TestCard, {
        props: { title: 'Slot Test' },
        slots: {
          default: '<p data-testid="slot-content">Custom slot content</p>'
        }
      })
      
      cy.get('[data-testid="slot-content"]')
        .should('contain', 'Custom slot content')
    })

    it('is accessible', () => {
      cy.mount(TestCard, {
        props: {
          title: 'Accessible Card',
          subtitle: 'With proper structure'
        }
      })
      cy.testAccessibility()
    })
  })

  describe('Modal Component', () => {
    it('renders when open', () => {
      cy.mount(TestModal, {
        props: {
          open: true,
          title: 'Test Modal'
        }
      })
      
      cy.get('[data-testid="modal-overlay"]').should('be.visible')
      cy.get('[data-testid="modal-content"]').should('be.visible')
      cy.get('.modal-title').should('contain', 'Test Modal')
    })

    it('does not render when closed', () => {
      cy.mount(TestModal, { props: { open: false } })
      cy.get('[data-testid="modal-overlay"]').should('not.exist')
    })

    it('handles different sizes', () => {
      const sizes = ['small', 'medium', 'large']
      
      sizes.forEach(size => {
        cy.mount(TestModal, {
          props: {
            open: true,
            size
          }
        })
        
        cy.get('[data-testid="modal-content"]')
          .should('have.class', `modal-${size}`)
      })
    })

    it('emits close event on overlay click', () => {
      const onCloseSpy = cy.spy().as('closeSpy')
      cy.mount(TestModal, {
        props: {
          open: true,
          onClose: onCloseSpy
        }
      })
      
      cy.get('[data-testid="modal-overlay"]').click()
      cy.get('@closeSpy').should('have.been.called')
    })

    it('emits close event on close button click', () => {
      const onCloseSpy = cy.spy().as('closeSpy')
      cy.mount(TestModal, {
        props: {
          open: true,
          onClose: onCloseSpy
        }
      })
      
      cy.get('[data-testid="modal-close"]').click()
      cy.get('@closeSpy').should('have.been.called')
    })

    it('prevents close on content click', () => {
      const onCloseSpy = cy.spy().as('closeSpy')
      cy.mount(TestModal, {
        props: {
          open: true,
          onClose: onCloseSpy
        }
      })
      
      cy.get('[data-testid="modal-content"]').click()
      cy.get('@closeSpy').should('not.have.been.called')
    })

    it('handles keyboard navigation', () => {
      cy.mount(TestModal, {
        props: {
          open: true,
          title: 'Keyboard Test'
        }
      })
      
      cy.get('[data-testid="modal-close"]').focus()
      cy.focused().should('match', '[data-testid="modal-close"]')
      
      // Test escape key (would need additional implementation)
      cy.get('body').type('{esc}')
    })

    it('is accessible', () => {
      cy.mount(TestModal, {
        props: {
          open: true,
          title: 'Accessible Modal'
        },
        slots: {
          default: '<p>Modal content for accessibility testing</p>'
        }
      })
      
      cy.testAccessibility()
    })
  })
})