/**
 * Gerenciador de Sessão
 * Controla timeout, inatividade e logout automático
 */

const SessionManager = {
  lastActivity: Date.now(),
  checkInterval: null,
  warningShown: false,
  config: null,

  /**
   * Inicializa o gerenciador de sessão
   */
  init() {
    this.config = AppConfig.session;
    this.setupActivityListeners();
    this.startSessionCheck();
    console.info('✅ SessionManager inicializado');
  },

  /**
   * Configura listeners de atividade
   */
  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });
  },

  /**
   * Atualiza última atividade
   */
  updateActivity() {
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.removeWarning();
  },

  /**
   * Inicia verificação periódica de sessão
   */
  startSessionCheck() {
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.config.checkInterval);
  },

  /**
   * Verifica estado da sessão
   */
  async checkSession() {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    const timeUntilLogout = this.config.timeout - inactiveTime;

    // Mostrar aviso
    if (timeUntilLogout <= this.config.warningTime && !this.warningShown) {
      this.showWarning(Math.floor(timeUntilLogout / 1000 / 60));
      this.warningShown = true;
    }

    // Logout automático
    if (inactiveTime >= this.config.timeout) {
      await this.autoLogout();
    }

    // Verificar se usuário ainda está autenticado
    const user = await AuthService.getCurrentUser();
    if (!user) {
      this.redirectToLogin();
    }
  },

  /**
   * Mostra aviso de inatividade
   * @param {number} minutes 
   */
  showWarning(minutes) {
    const warning = document.createElement('div');
    warning.id = 'sessionWarning';
    warning.className = 'session-warning';
    warning.innerHTML = `
      <div class="session-warning-content">
        <h3>⏰ Sessão Expirando</h3>
        <p>Você será desconectado em ${minutes} minuto(s) por inatividade.</p>
        <button onclick="SessionManager.updateActivity()">Continuar Conectado</button>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    // CSS inline (ou adicione ao admin.css)
    const style = document.createElement('style');
    style.textContent = `
      .session-warning {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }
      .session-warning-content {
        background: var(--bg-card);
        padding: 32px;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        border: 2px solid var(--warning);
      }
      .session-warning-content h3 {
        color: var(--warning);
        margin-bottom: 16px;
      }
      .session-warning-content button {
        margin-top: 20px;
        padding: 12px 24px;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      .session-warning-content button:hover {
        background: var(--primary-dark);
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Remove aviso
   */
  removeWarning() {
    const warning = document.getElementById('sessionWarning');
    if (warning) {
      warning.remove();
    }
  },

  /**
   * Executa logout automático
   */
  async autoLogout() {
    console.info('⏱️ Sessão expirada por inatividade');
    
    // Limpar intervalo
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Fazer logout
    await AuthService.logout();
  },

  /**
   * Redireciona para login
   */
  redirectToLogin() {
    window.location.href = '/admin/login.html?reason=session_expired';
  },

  /**
   * Destrói o gerenciador
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
};

// Inicializar automaticamente se estiver em página protegida
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.includes('login.html');
    if (!isLoginPage && typeof AppConfig !== 'undefined') {
      SessionManager.init();
    }
  });
} else {
  const isLoginPage = window.location.pathname.includes('login.html');
  if (!isLoginPage && typeof AppConfig !== 'undefined') {
    SessionManager.init();
  }
}

// Exportar
window.SessionManager = SessionManager;