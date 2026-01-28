/**
 * Serviço de Configurações
 * Gerencia configurações da loja
 */

const ConfigService = {
  collection: 'config',
  docId: 'loja',

  /**
   * Busca configurações
   * @returns {Promise<object>}
   */
  async buscar() {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(this.docId).get();
      
      if (doc.exists) {
        return doc.data();
      }
      
      // Retorna configuração padrão se não existir
      return this.getConfigPadrao();
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      return this.getConfigPadrao();
    }
  },

  /**
   * Salva configurações
   * @param {object} config 
   * @returns {Promise<object>}
   */
  async salvar(config) {
    try {
      await firebaseDb.collection(this.collection).doc(this.docId).set({
        ...config,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.info('✅ Configurações salvas');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Configuração padrão
   * @returns {object}
   */
  getConfigPadrao() {
    return {
      nomeLoja: 'Minha Loja',
      whatsapp: '5511999999999',
      mensagemPadrao: 'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Valor:* R$ {valor}',
      taxaMotoboy: 8.00,
      parcelasSemJuros: 3,
      descontoPix: 10,
      pixelFacebook: '',
      gtmGoogle: '',
      googleAnalytics: '',
      menuCategorias: [],
      marcasCadastradas: [],
      categoriasCadastradas: [],
      avisoTexto: 'Todos os produtos exibidos aqui são de pronta entrega na loja física em Leme-SP. Produtos sob encomenda você encontra em nossa loja online.',
      avisoBotaoTexto: 'Visitar Loja Online',
      avisoBotaoUrl: 'https://sualojaonline.com.br',
      logoUrl: '',
      whatsappFlutuante: true,
      whatsappMensagemFlutuante: 'Precisa de Ajuda?'
    };
  },

  /**
   * Valida número de WhatsApp
   * @param {string} numero 
   * @returns {boolean}
   */
  validarWhatsApp(numero) {
    // Remove caracteres não numéricos
    const apenasNumeros = numero.replace(/\D/g, '');
    
    // Valida se tem entre 10 e 15 dígitos
    return apenasNumeros.length >= 10 && apenasNumeros.length <= 15;
  },

  /**
   * Formata número de WhatsApp para display
   * @param {string} numero 
   * @returns {string}
   */
  formatarWhatsApp(numero) {
    const apenasNumeros = numero.replace(/\D/g, '');
    
    if (apenasNumeros.length === 13) {
      // +55 11 99999-9999
      return `+${apenasNumeros.slice(0, 2)} ${apenasNumeros.slice(2, 4)} ${apenasNumeros.slice(4, 9)}-${apenasNumeros.slice(9)}`;
    }
    
    return numero;
  }
};

// Exportar
window.ConfigService = ConfigService;