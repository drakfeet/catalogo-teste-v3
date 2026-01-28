/**
 * Serviço de Dashboard
 * Gerencia métricas avançadas e gráficos
 */

const DashboardService = {
  /**
   * Busca métricas completas para o dashboard
   * @returns {Promise<object>}
   */
  async buscarMetricasCompletas() {
    try {
      const produtos = await ProdutosService.listar();
      const totalProdutos = produtos.length;
      const produtosAtivos = produtos.filter(p => p.ativo).length;
      const produtosInativos = totalProdutos - produtosAtivos;

      // Buscar todas as métricas
      const snapshot = await firebaseDb.collection('metricas')
        .orderBy('timestamp', 'desc')
        .get();

      const metricas = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
          metricas.push({
            id: doc.id,
            tipo: data.tipo,
            produtoId: data.produtoId,
            produtoNome: data.produtoNome,
            timestamp: data.timestamp.toDate(),
            userAgent: data.userAgent || null,
            ip: data.ip || null
          });
        }
      });

      // Análises
      const totalCliques = metricas.filter(m => m.tipo === 'whatsapp_click').length;
      const totalAcessos = metricas.filter(m => m.tipo === 'page_view').length;
      
      return {
        totalProdutos,
        produtosAtivos,
        produtosInativos,
        totalCliques,
        totalAcessos,
        metricas
      };
    } catch (error) {
      console.error('❌ Erro ao buscar métricas:', error);
      return {
        totalProdutos: 0,
        produtosAtivos: 0,
        produtosInativos: 0,
        totalCliques: 0,
        totalAcessos: 0,
        metricas: []
      };
    }
  },

  /**
   * Agrupa cliques por dia da semana
   * @param {Array} metricas 
   * @returns {object}
   */
  agruparPorDiaSemana(metricas) {
    const cliques = metricas.filter(m => m.tipo === 'whatsapp_click');
    
    const diasSemana = {
      0: { nome: 'Dom', total: 0 },
      1: { nome: 'Seg', total: 0 },
      2: { nome: 'Ter', total: 0 },
      3: { nome: 'Qua', total: 0 },
      4: { nome: 'Qui', total: 0 },
      5: { nome: 'Sex', total: 0 },
      6: { nome: 'Sáb', total: 0 }
    };

    cliques.forEach(clique => {
      const dia = clique.timestamp.getDay();
      diasSemana[dia].total++;
    });

    return diasSemana;
  },

  /**
   * Agrupa acessos por hora do dia
   * @param {Array} metricas 
   * @returns {object}
   */
  agruparPorHora(metricas) {
    const acessos = metricas.filter(m => m.tipo === 'page_view' || m.tipo === 'whatsapp_click');
    
    const horas = {};
    for (let i = 0; i < 24; i++) {
      horas[i] = { hora: `${i}h`, total: 0 };
    }

    acessos.forEach(acesso => {
      const hora = acesso.timestamp.getHours();
      horas[hora].total++;
    });

    return horas;
  },

  /**
   * Busca produtos mais clicados
   * @param {Array} metricas 
   * @returns {Array}
   */
  produtosMaisClicados(metricas) {
    const cliques = metricas.filter(m => m.tipo === 'whatsapp_click' && m.produtoNome);
    
    const contagem = {};
    cliques.forEach(clique => {
      const nome = clique.produtoNome;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  },

  /**
   * Análise dos últimos 7 dias
   * @param {Array} metricas 
   * @returns {object}
   */
  ultimos7Dias(metricas) {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const metricasRecentes = metricas.filter(m => m.timestamp >= seteDiasAtras);
    
    const dias = {};
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      const chave = this.formatarDataChave(data);
      dias[chave] = {
        data: this.formatarDataLabel(data),
        acessos: 0,
        cliques: 0
      };
    }

    metricasRecentes.forEach(metrica => {
      const chave = this.formatarDataChave(metrica.timestamp);
      if (dias[chave]) {
        if (metrica.tipo === 'page_view') {
          dias[chave].acessos++;
        } else if (metrica.tipo === 'whatsapp_click') {
          dias[chave].cliques++;
        }
      }
    });

    return Object.values(dias);
  },

  /**
   * Formata data como chave (YYYY-MM-DD)
   * @param {Date} data 
   * @returns {string}
   */
  formatarDataChave(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  /**
   * Formata data como label (DD/MM)
   * @param {Date} data 
   * @returns {string}
   */
  formatarDataLabel(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
  },

  /**
   * Estatísticas resumidas
   * @param {Array} metricas 
   * @returns {object}
   */
  estatisticasResumo(metricas) {
    const hoje = new Date();
    const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metricasHoje = metricas.filter(m => 
      m.timestamp.toDateString() === hoje.toDateString()
    );
    const metricasOntem = metricas.filter(m => 
      m.timestamp.toDateString() === ontem.toDateString()
    );
    const metricas7Dias = metricas.filter(m => m.timestamp >= seteDiasAtras);
    const metricas30Dias = metricas.filter(m => m.timestamp >= trintaDiasAtras);

    return {
      hoje: {
        acessos: metricasHoje.filter(m => m.tipo === 'page_view').length,
        cliques: metricasHoje.filter(m => m.tipo === 'whatsapp_click').length
      },
      ontem: {
        acessos: metricasOntem.filter(m => m.tipo === 'page_view').length,
        cliques: metricasOntem.filter(m => m.tipo === 'whatsapp_click').length
      },
      ultimos7Dias: {
        acessos: metricas7Dias.filter(m => m.tipo === 'page_view').length,
        cliques: metricas7Dias.filter(m => m.tipo === 'whatsapp_click').length
      },
      ultimos30Dias: {
        acessos: metricas30Dias.filter(m => m.tipo === 'page_view').length,
        cliques: metricas30Dias.filter(m => m.tipo === 'whatsapp_click').length
      }
    };
  }
};

// Exportar
window.DashboardService = DashboardService;