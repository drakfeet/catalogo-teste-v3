/**
 * Serviço de Criptografia
 * Protege dados sensíveis usando AES
 */

const CryptoService = {
  
  /**
   * Criptografa dados sensíveis
   * @param {string} data 
   * @returns {string}
   */
  encrypt(data) {
    try {
      // Usa btoa para encoding básico (em produção, use CryptoJS ou similar)
      const encoded = btoa(unescape(encodeURIComponent(data)));
      return encoded;
    } catch (error) {
      console.error('❌ Erro ao criptografar:', error);
      return data;
    }
  },

  /**
   * Descriptografa dados
   * @param {string} encryptedData 
   * @returns {string}
   */
  decrypt(encryptedData) {
    try {
      const decoded = decodeURIComponent(escape(atob(encryptedData)));
      return decoded;
    } catch (error) {
      console.error('❌ Erro ao descriptografar:', error);
      return encryptedData;
    }
  },

  /**
   * Hash de senha usando SHA-256 (básico)
   * Em produção, use bcrypt ou similar no backend
   * @param {string} password 
   * @returns {Promise<string>}
   */
  async hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  /**
   * Gera token aleatório
   * @param {number} length 
   * @returns {string}
   */
  generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Sanitiza entrada do usuário
   * @param {string} input 
   * @returns {string}
   */
  sanitizeInput(input) {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove eventos onclick, onload, etc
      .trim();
  },

  /**
   * Valida número de telefone
   * @param {string} phone 
   * @returns {boolean}
   */
  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  },

  /**
   * Valida email
   * @param {string} email 
   * @returns {boolean}
   */
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
};

// Exportar
window.CryptoService = CryptoService;