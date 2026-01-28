/**
 * Serviço de Métricas
 * Gerencia analytics e eventos
 */

const MetricasService = {
  collection: 'metricas',

  /**
   * Registra clique no WhatsApp
   * @param {object} dados
   */
  async registrarCliqueWhatsApp(dados) {
    try {
      await firebaseDb.collection(this.collection).add({
        tipo: 'whatsapp_click',
        produtoId: dados.produtoId || null,
        produtoNome: dados.produtoNome || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.info('✅ Clique no WhatsApp registrado');
    } catch (error) {
      console.error('❌ Erro ao registrar métrica:', error);
    }
  },

  /**
   * Busca métricas de dashboard
   * @returns {Promise<object>}
   */
  async buscarMetricasDashboard() {
    try {
      // 🔐 Garante que o ProdutosService existe
      if (typeof ProdutosService === 'undefined') {
        console.error('❌ ProdutosService não está disponível');
        return this.metricasVazias();
      }

      const produtos = await ProdutosService.listar();

      const totalProdutos = produtos.length;
      const produtosAtivos = produtos.filter(p => p.ativo).length;
      const produtosInativos = totalProdutos - produtosAtivos;

      // Cliques no WhatsApp (últimos 30 dias)
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const snapshotCliques = await firebaseDb
        .collection(this.collection)
        .where('tipo', '==', 'whatsapp_click')
        .where('timestamp', '>=', trintaDiasAtras)
        .get();

      return {
        totalProdutos,
        produtosAtivos,
        produtosInativos,
        totalCliques: snapshotCliques.size
      };
    } catch (error) {
      console.error('❌ Erro ao buscar métricas:', error);
      return this.metricasVazias();
    }
  },

  /**
   * Busca eventos recentes
   * @param {number} limite
   * @returns {Promise<Array>}
   */
  async buscarEventosRecentes(limite = 20) {
    try {
      const snapshot = await firebaseDb
        .collection(this.collection)
        .orderBy('timestamp', 'desc')
        .limit(limite)
        .get();

      const eventos = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        eventos.push({
          id: doc.id,
          tipo: data.tipo,
          produtoNome: data.produtoNome || 'N/A',
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      return eventos;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      return [];
    }
  },

  /**
   * Retorno padrão para falhas
   */
  metricasVazias() {
    return {
      totalProdutos: 0,
      produtosAtivos: 0,
      produtosInativos: 0,
      totalCliques: 0
    };
  },

  /**
   * Formata timestamp para exibição
   * @param {Date} date
   * @returns {string}
   */
  formatarDataHora(date) {
    const opcoes = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('pt-BR', opcoes);
  }
};

// 🌍 Disponibiliza globalmente
window.MetricasService = MetricasService;
