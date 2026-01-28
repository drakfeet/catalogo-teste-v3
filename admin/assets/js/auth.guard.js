/**
 * Auth Guard - Proteção de Rotas
 * Verifica autenticação antes de permitir acesso às páginas admin
 */

const AuthGuard = {

  /**
   * Páginas que não precisam de autenticação
   */
  publicPages: ['/admin/login.html'],

  /**
   * Inicializa a proteção
   */
  async init() {
    // 🔐 Garante que o AuthService existe
    if (typeof AuthService === 'undefined') {
      console.error('❌ AuthService não está disponível');
      return;
    }

    const currentPath = window.location.pathname;
    const isPublicPage = this.publicPages.some(page =>
      currentPath.includes('login.html')
    );

    console.info('🛡️ Auth Guard ativado');

    // Página pública (login)
    if (isPublicPage) {
      await this.checkIfAlreadyLoggedIn();
      return;
    }

    // Aguarda autenticação
    const user = await AuthService.getCurrentUser();

    if (!user) {
      console.warn('⚠️ Acesso negado - Usuário não autenticado');
      this.redirectToLogin();
    } else {
      console.info('✅ Usuário autenticado:', user.email);
      this.setupLogoutButton();
    }
  },

  /**
   * Se já está logado, redireciona para dashboard
   */
  async checkIfAlreadyLoggedIn() {
    const user = await AuthService.getCurrentUser();
    if (user) {
      console.info('✅ Usuário já autenticado, redirecionando...');
      window.location.href = '/admin/index.html';
    }
  },

  /**
   * Redireciona para página de login
   */
  redirectToLogin() {
    const currentPath = window.location.pathname;
    window.location.href =
      `/admin/login.html?redirect=${encodeURIComponent(currentPath)}`;
  },

  /**
   * Configura botão de logout
   */
  setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      AuthService.logout();
    });
  }
};

/* =========================
   EXECUÇÃO SEGURA
========================= */
document.addEventListener('DOMContentLoaded', () => {
  AuthGuard.init().catch(error => {
    console.error('❌ Erro no AuthGuard:', error);
  });
});
