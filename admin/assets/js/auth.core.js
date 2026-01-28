/**
 * AuthService - Autenticação
 */

const AuthService = {

  /**
   * Login com email e senha
   */
  async login(email, password) {
    try {
      const result = await firebase
        .auth()
        .signInWithEmailAndPassword(email, password);

      return {
        success: true,
        user: result.user
      };

    } catch (error) {
      console.error('❌ Erro no login:', error);

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
      }

      return {
        success: false,
        error: message
      };
    }
  },

  /**
   * Retorna usuário atual
   */
  getCurrentUser() {
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged(user => {
        resolve(user || null);
      });
    });
  },

  /**
   * Logout
   */
  async logout() {
    await firebase.auth().signOut();
    window.location.href = '/admin/login.html';
  }
};

window.AuthService = AuthService;
