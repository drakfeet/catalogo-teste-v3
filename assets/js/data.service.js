/**
 * Serviço de Dados do Catálogo
 * Busca produtos e configurações do Firestore
 */

const DataService = {
  db: null,

  /**
   * Inicializa o serviço
   */
  init() {
    this.db = firebase.firestore();
    console.info('✅ DataService inicializado');
  },

  /**
   * Busca todos os produtos ativos
   * @returns {Promise<Array>}
   */
  async buscarProdutos() {
    try {
      console.info('📦 Buscando produtos...');
      
      const snapshot = await this.db.collection('produtos')
        .where('ativo', '==', true)
        .orderBy('nome')
        .get();

      const produtos = [];
      snapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${produtos.length} produtos encontrados`);
      return produtos;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return [];
    }
  },

  /**
   * Busca configurações da loja
   * @returns {Promise<object>}
   */
  async buscarConfig() {
    try {
      const doc = await this.db.collection('config').doc('loja').get();
      
      if (doc.exists) {
        const config = doc.data();
        
        // Buscar banners se não estiverem no config
        if (!config.banners) {
          try {
            const bannersSnapshot = await this.db.collection('banners')
              .where('ativo', '==', true)
              .orderBy('ordem', 'asc')
              .get();
            
            config.banners = [];
            bannersSnapshot.forEach(doc => {
              config.banners.push({ id: doc.id, ...doc.data() });
            });
          } catch (error) {
            console.warn('⚠️ Erro ao buscar banners:', error);
            config.banners = [];
          }
        }
        
        return config;
      }

      // Config padrão
      return {
        nomeLoja: 'Catálogo',
        whatsapp: '5511999999999',
        mensagemPadrao: 'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Valor:* R$ {valor}',
        taxaMotoboy: 0,
        parcelasSemJuros: 1,
        pixelFacebook: '',
        gtmGoogle: '',
        menuCategorias: [],
        banners: []
      };
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      return {
        nomeLoja: 'Catálogo',
        whatsapp: '5511999999999',
        mensagemPadrao: 'Olá! Gostaria de fazer um pedido:\n\n*Produto:* {produto}\n*Marca:* {marca}\n*Tamanho:* {tamanho}\n*Pagamento:* {pagamento}\n*Valor:* R$ {valor}',
        taxaMotoboy: 0,
        parcelasSemJuros: 1,
        pixelFacebook: '',
        gtmGoogle: '',
        menuCategorias: [],
        banners: []
      };
    }
  },

  /**
   * Registra clique no WhatsApp
   * @param {object} dados 
   */
  async registrarCliqueWhatsApp(dados) {
    try {
      await this.db.collection('metricas').add({
        tipo: 'whatsapp_click',
        produtoId: dados.produtoId || null,
        produtoNome: dados.produtoNome || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });
      console.info('✅ Clique registrado');
    } catch (error) {
      console.warn('⚠️ Erro ao registrar métrica:', error);
    }
  },

  /**
   * Registra visualização de página
   */
  async registrarVisualizacao() {
    try {
      await this.db.collection('metricas').add({
        tipo: 'page_view',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      console.info('✅ Visualização registrada');
    } catch (error) {
      console.warn('⚠️ Erro ao registrar visualização:', error);
    }
  },

  /**
   * Extrai marcas únicas dos produtos
   * @param {Array} produtos 
   * @returns {Array}
   */
  extrairMarcas(produtos) {
    const marcas = [...new Set(produtos.map(p => p.marca))];
    return marcas.sort();
  },

  /**
   * Extrai tamanhos únicos dos produtos
   * @param {Array} produtos 
   * @returns {Array}
   */
  extrairTamanhos(produtos) {
    const tamanhos = new Set();
    produtos.forEach(p => {
      if (p.tamanhos) {
        p.tamanhos.forEach(t => tamanhos.add(t));
      }
    });
    
    // Ordenar na ordem: PP, P, M, G, GG, XG
    const ordem = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
    return Array.from(tamanhos).sort((a, b) => {
      return ordem.indexOf(a) - ordem.indexOf(b);
    });
  }
};

// Exportar
window.DataService = DataService;