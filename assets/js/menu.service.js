/**
 * Serviço de Menu Hambúrguer
 * Gerencia abertura/fechamento do menu mobile e desktop
 */

const MenuService = {
  isOpen: false,

  /**
   * Inicializa o serviço de menu
   */
  init() {
    this.setupMenuButton();
    this.setupOverlay();
    this.setupCloseButtons();
    this.setupKeyboard();
    
    console.info('✅ MenuService inicializado');
  },

  /**
   * Configura botão do menu
   */
  setupMenuButton() {
    const menuBtn = document.getElementById('menuToggle');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.toggle());
    }
  },

  /**
   * Configura overlay
   */
  setupOverlay() {
    const overlay = document.getElementById('menuOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }
  },

  /**
   * Configura botões de fechar
   */
  setupCloseButtons() {
    const closeBtns = document.querySelectorAll('.btn-close-menu, .menu-close');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  },

  /**
   * Configura teclado (ESC para fechar)
   */
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  },

  /**
   * Abre o menu
   */
  open() {
    this.isOpen = true;
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('menuOverlay');
    const body = document.body;
    
    if (menu) {
      menu.classList.add('active');
      body.style.overflow = 'hidden';
    }
    
    if (overlay) {
      overlay.classList.add('active');
    }

    // Atualizar aria
    const menuBtn = document.getElementById('menuToggle');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'true');
    }
  },

  /**
   * Fecha o menu
   */
  close() {
    this.isOpen = false;
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('menuOverlay');
    const body = document.body;
    
    if (menu) {
      menu.classList.remove('active');
    }
    
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    body.style.overflow = '';

    // Atualizar aria
    const menuBtn = document.getElementById('menuToggle');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  },

  /**
   * Alterna o menu
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
};

// Exportar
window.MenuService = MenuService;
