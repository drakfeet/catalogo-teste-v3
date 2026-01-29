/**
 * AuthService - Serviço de Autenticação
 * Gerencia login, logout e estado de autenticação
 * IMPORTANTE: Este arquivo é o serviço principal de autenticação
 * Para implementações específicas, use auth.core.js
 */

const AuthService = {
  
  /**
   * Tentativas de login (controle de segurança)
   */
  loginAttempts: {},
  
  /**
   * Configuração de segurança
   */
  securityConfig: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutos
  },

  /**
   * Login com email e senha
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async login(email, password) {
    try {
      // Verificar tentativas de login
      if (this.isAccountLocked(email)) {
        const remainingTime = this.getRemainingLockTime(email);
        return {
          success: false,
          error: `Conta bloqueada temporariamente. Tente novamente em ${Math.ceil(remainingTime / 60000)} minutos.`
        };
      }

      console.info('🔐 Tentando autenticação...');
      
      // Autenticar com Firebase
      const result = await firebase
        .auth()
        .signInWithEmailAndPassword(email, password);

      // Limpar tentativas após login bem-sucedido
      this.clearLoginAttempts(email);
      
      console.info('✅ Login realizado com sucesso');
      
      // Registrar log de auditoria (opcional)
      await this.logAuditEvent('login', result.user.uid);

      return {
        success: true,
        user: result.user
      };

    } catch (error) {
      console.error('❌ Erro no login:', error);

      // Registrar tentativa falhada
      this.registerFailedAttempt(email);

      let message = 'Erro ao fazer login';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          message = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          message = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'auth/network-request-failed':
          message = 'Erro de conexão. Verifique sua internet';
          break;
        case 'auth/invalid-credential':
          message = 'Credenciais inválidas';
          break;
        default:
          message = error.message || 'Erro desconhecido';
      }

      return {
        success: false,
        error: message
      };
    }
  },

  /**
   * Retorna usuário atual autenticado
   * @returns {Promise<Object|null>}
   */
  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe();
        resolve(user || null);
      });
    });
  },

  /**
   * Verifica se usuário está autenticado
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  },

  /**
   * Logout do usuário
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      console.info('🚪 Realizando logout...');
      
      const user = await this.getCurrentUser();
      
      // Registrar log de auditoria (opcional)
      if (user) {
        await this.logAuditEvent('logout', user.uid);
      }

      await firebase.auth().signOut();
      
      console.info('✅ Logout realizado');
      
      // Limpar dados locais
      this.clearLocalData();
      
      // Redirecionar para login
      window.location.href = '/admin/login.html';
      
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      // Mesmo com erro, redirecionar para segurança
      window.location.href = '/admin/login.html';
    }
  },

  /**
   * Registra tentativa de login falhada
   * @param {string} email 
   */
  registerFailedAttempt(email) {
    if (!this.loginAttempts[email]) {
      this.loginAttempts[email] = {
        count: 0,
        lastAttempt: Date.now()
      };
    }

    this.loginAttempts[email].count++;
    this.loginAttempts[email].lastAttempt = Date.now();

    // Salvar em localStorage para persistência
    try {
      localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts));
    } catch (e) {
      console.warn('Não foi possível salvar tentativas de login');
    }
  },

  /**
   * Limpa tentativas de login após sucesso
   * @param {string} email 
   */
  clearLoginAttempts(email) {
    delete this.loginAttempts[email];
    try {
      localStorage.setItem('loginAttempts', JSON.stringify(this.loginAttempts));
    } catch (e) {
      console.warn('Não foi possível limpar tentativas de login');
    }
  },

  /**
   * Verifica se conta está bloqueada
   * @param {string} email 
   * @returns {boolean}
   */
  isAccountLocked(email) {
    const attempts = this.loginAttempts[email];
    
    if (!attempts) return false;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    
    // Se passou o tempo de lockout, limpar tentativas
    if (timeSinceLastAttempt > this.securityConfig.lockoutDuration) {
      this.clearLoginAttempts(email);
      return false;
    }
    
    return attempts.count >= this.securityConfig.maxAttempts;
  },

  /**
   * Retorna tempo restante de bloqueio em ms
   * @param {string} email 
   * @returns {number}
   */
  getRemainingLockTime(email) {
    const attempts = this.loginAttempts[email];
    if (!attempts) return 0;
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const remaining = this.securityConfig.lockoutDuration - timeSinceLastAttempt;
    
    return remaining > 0 ? remaining : 0;
  },

  /**
   * Limpa dados locais (localStorage, sessionStorage)
   */
  clearLocalData() {
    try {
      // Manter apenas loginAttempts e theme
      const loginAttempts = localStorage.getItem('loginAttempts');
      const theme = localStorage.getItem('theme');
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar dados que devem persistir
      if (loginAttempts) {
        localStorage.setItem('loginAttempts', loginAttempts);
      }
      if (theme) {
        localStorage.setItem('theme', theme);
      }
      
      console.info('🧹 Dados locais limpos');
    } catch (e) {
      console.warn('Erro ao limpar dados locais:', e);
    }
  },

  /**
   * Registra evento de auditoria (opcional)
   * @param {string} tipo 
   * @param {string} userId 
   */
  async logAuditEvent(tipo, userId) {
    try {
      await firebaseDb.collection('audit_logs').add({
        tipo,
        userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent,
        ip: null // Preenchido no backend se necessário
      });
    } catch (error) {
      console.warn('Não foi possível registrar log de auditoria:', error);
    }
  },

  /**
   * Recuperar senha
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async resetPassword(email) {
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      
      return {
        success: true,
        message: 'Email de recuperação enviado com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error);
      
      let message = 'Erro ao enviar email de recuperação';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Email não encontrado';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        default:
          message = error.message;
      }
      
      return {
        success: false,
        error: message
      };
    }
  },

  /**
   * Atualizar perfil do usuário
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async updateProfile(data) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await user.updateProfile(data);
      
      return {
        success: true,
        message: 'Perfil atualizado com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Atualizar email
   * @param {string} newEmail 
   * @returns {Promise<Object>}
   */
  async updateEmail(newEmail) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await user.updateEmail(newEmail);
      
      return {
        success: true,
        message: 'Email atualizado com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar email:', error);
      
      let message = 'Erro ao atualizar email';
      
      if (error.code === 'auth/requires-recent-login') {
        message = 'Faça login novamente para atualizar o email';
      }
      
      return {
        success: false,
        error: message
      };
    }
  },

  /**
   * Atualizar senha
   * @param {string} newPassword 
   * @returns {Promise<Object>}
   */
  async updatePassword(newPassword) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        return {
          success: false,
          error: 'Usuário não autenticado'
        };
      }

      await user.updatePassword(newPassword);
      
      return {
        success: true,
        message: 'Senha atualizada com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      
      let message = 'Erro ao atualizar senha';
      
      if (error.code === 'auth/requires-recent-login') {
        message = 'Faça login novamente para atualizar a senha';
      } else if (error.code === 'auth/weak-password') {
        message = 'Senha muito fraca. Use no mínimo 6 caracteres';
      }
      
      return {
        success: false,
        error: message
      };
    }
  },

  /**
   * Inicializar o serviço de autenticação
   */
  init() {
    // Carregar tentativas de login do localStorage
    try {
      const stored = localStorage.getItem('loginAttempts');
      if (stored) {
        this.loginAttempts = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Não foi possível carregar tentativas de login');
    }

    console.info('🔐 AuthService inicializado');
  }
};

// Inicializar automaticamente
AuthService.init();

// Exportar globalmente
window.AuthService = AuthService;