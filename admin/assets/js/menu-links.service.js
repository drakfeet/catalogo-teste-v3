/**
 * Serviço de Menu Links
 * Gerencia links personalizados do menu estilo e-commerce
 */

const MenuLinksService = {
  collection: 'menu_links',

  /**
   * Listar todos os links do menu
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const links = [];
      snapshot.forEach(doc => {
        links.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${links.length} links do menu encontrados`);
      return links;
    } catch (error) {
      console.error('❌ Erro ao listar links:', error);
      return [];
    }
  },

  /**
   * Buscar link por ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar link:', error);
      return null;
    }
  },

  /**
   * Criar novo link
   * @param {Object} link 
   * @returns {Promise<Object>}
   */
  async criar(link) {
    try {
      const novoLink = {
        texto: CryptoService.sanitizeInput(link.texto),
        url: CryptoService.sanitizeInput(link.url),
        icone: link.icone || '',
        ordem: parseInt(link.ordem) || 0,
        abrirNovaAba: link.abrirNovaAba !== false,
        destacado: link.destacado === true,
        ativo: link.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoLink);
      console.info('✅ Link criado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar link:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualizar link
   * @param {string} id 
   * @param {Object} dados 
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados) {
    try {
      const dadosAtualizados = {
        texto: CryptoService.sanitizeInput(dados.texto),
        url: CryptoService.sanitizeInput(dados.url),
        icone: dados.icone || '',
        ordem: parseInt(dados.ordem) || 0,
        abrirNovaAba: dados.abrirNovaAba !== false,
        destacado: dados.destacado === true,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Link atualizado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar link:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deletar link
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async deletar(id) {
    try {
      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Link deletado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar link:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Reordenar links
   * @param {Array} links - Array de objetos {id, ordem}
   * @returns {Promise<Object>}
   */
  async reordenar(links) {
    try {
      const batch = firebaseDb.batch();

      links.forEach(({ id, ordem }) => {
        const ref = firebaseDb.collection(this.collection).doc(id);
        batch.update(ref, { ordem: parseInt(ordem) });
      });

      await batch.commit();
      console.info('✅ Links reordenados');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao reordenar links:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Validar link
   * @param {Object} link 
   * @returns {Object}
   */
  validar(link) {
    const erros = [];

    if (!link.texto || link.texto.trim() === '') {
      erros.push('Texto do link é obrigatório');
    }

    if (!link.url || link.url.trim() === '') {
      erros.push('URL é obrigatória');
    }

    if (link.url && !this.validarUrl(link.url)) {
      erros.push('URL inválida');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  },

  /**
   * Validar formato de URL
   * @param {string} url 
   * @returns {boolean}
   */
  validarUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      // Se não for URL absoluta, aceitar URLs relativas
      return url.startsWith('/') || url.startsWith('#');
    }
  }
};

// Exportar
window.MenuLinksService = MenuLinksService;