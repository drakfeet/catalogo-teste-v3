/**
 * Serviço de Tema Claro/Escuro
 * Gerencia a alternância entre temas e persistência
 */

const ThemeService = {
  currentTheme: 'dark', // 'light' ou 'dark'

  /**
   * Inicializa o serviço de tema
   */
  init() {
    // Verificar preferência salva ou usar preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);
    
    // Listener para mudanças na preferência do sistema (se não houver tema salvo)
    if (!savedTheme) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.currentTheme);
        }
      });
    }

    console.info('✅ ThemeService inicializado:', this.currentTheme);
  },

  /**
   * Aplica o tema
   * @param {string} theme - 'light' ou 'dark'
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    
    // Salvar preferência
    localStorage.setItem('theme', theme);
    
    // Atualizar ícone do toggle se existir
    this.updateToggleIcon();
  },

  /**
   * Alterna entre temas
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  },

  /**
   * Atualiza ícone do botão toggle
   */
  updateToggleIcon() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('.theme-icon') || toggleBtn;
      if (this.currentTheme === 'dark') {
        icon.textContent = '☀️';
        icon.setAttribute('aria-label', 'Alternar para tema claro');
      } else {
        icon.textContent = '🌙';
        icon.setAttribute('aria-label', 'Alternar para tema escuro');
      }
    }
  },

  /**
   * Retorna o tema atual
   * @returns {string}
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
};

// Exportar
window.ThemeService = ThemeService;
