/**
 * Serviço de Banners
 * Gerencia banners do slider do catálogo
 */

const BannersService = {
  collection: 'banners',

  /**
   * Lista todos os banners
   * @returns {Promise<Array>}
   */
  async listar() {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('ordem')
        .get();

      const banners = [];
      snapshot.forEach(doc => {
        banners.push({ id: doc.id, ...doc.data() });
      });

      console.info(`✅ ${banners.length} banners encontrados`);
      return banners;
    } catch (error) {
      console.error('❌ Erro ao listar banners:', error);
      return [];
    }
  },

  /**
   * Busca banner por ID
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id) {
    try {
      const doc = await firebaseDb.collection(this.collection).doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erro ao buscar banner:', error);
      return null;
    }
  },

  /**
   * Cria novo banner
   * @param {Object} banner 
   * @returns {Promise<Object>}
   */
  async criar(banner) {
    try {
      console.info('➕ Criando banner...');

      const novoBanner = {
        imagemUrl: banner.imagemUrl,
        titulo: CryptoService.sanitizeInput(banner.titulo || ''),
        texto: CryptoService.sanitizeInput(banner.texto || ''),
        linkUrl: CryptoService.sanitizeInput(banner.linkUrl || ''),
        ordem: parseInt(banner.ordem) || 1,
        ativo: banner.ativo !== false,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firebaseDb.collection(this.collection).add(novoBanner);
      console.info('✅ Banner criado:', docRef.id);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Erro ao criar banner:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Atualiza banner
   * @param {string} id 
   * @param {Object} dados 
   * @returns {Promise<Object>}
   */
  async atualizar(id, dados) {
    try {
      console.info('✏️ Atualizando banner:', id);

      const dadosAtualizados = {
        imagemUrl: dados.imagemUrl,
        titulo: CryptoService.sanitizeInput(dados.titulo || ''),
        texto: CryptoService.sanitizeInput(dados.texto || ''),
        linkUrl: CryptoService.sanitizeInput(dados.linkUrl || ''),
        ordem: parseInt(dados.ordem) || 1,
        ativo: dados.ativo !== false,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      };

      await firebaseDb.collection(this.collection).doc(id).update(dadosAtualizados);
      console.info('✅ Banner atualizado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar banner:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Deleta banner
   * @param {string} id 
   * @returns {Promise<Object>}
   */
  async deletar(id) {
    try {
      console.info('🗑️ Deletando banner:', id);
      await firebaseDb.collection(this.collection).doc(id).delete();
      console.info('✅ Banner deletado');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar banner:', error);
      return { success: false, error: error.message };
    }
  }
};

// Exportar
window.BannersService = BannersService;