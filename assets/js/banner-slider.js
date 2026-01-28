/**
 * Banner Slider Service
 * Gerencia o slider de banners configurável
 */

const BannerSlider = {
  slides: [],
  currentIndex: 0,
  intervalId: null,
  autoPlay: true,
  interval: 5000,

  /**
   * Inicializa o slider
   * @param {Array} banners 
   */
  init(banners) {
    if (!banners || banners.length === 0) {
      document.getElementById('bannerSlider').style.display = 'none';
      return;
    }

    this.slides = banners.filter(b => b.ativo !== false);
    
    if (this.slides.length === 0) {
      document.getElementById('bannerSlider').style.display = 'none';
      return;
    }

    this.render();
    this.setupControls();
    if (this.autoPlay && this.slides.length > 1) {
      this.startAutoPlay();
    }

    console.info('✅ BannerSlider inicializado:', this.slides.length, 'slides');
  },

  /**
   * Renderiza os slides
   */
  render() {
    const container = document.getElementById('sliderContainer');
    const dotsContainer = document.getElementById('sliderDots');
    
    if (!container) return;

    container.innerHTML = this.slides.map((slide, index) => `
      <div class="slider-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
        <a href="${slide.linkUrl || '#'}" ${slide.linkUrl ? 'target="_blank"' : ''} class="slide-link">
          <img src="${slide.imagemUrl}" alt="${slide.titulo || 'Banner'}" class="slide-image">
          ${slide.titulo || slide.texto ? `
            <div class="slide-content">
              ${slide.titulo ? `<h2 class="slide-title">${slide.titulo}</h2>` : ''}
              ${slide.texto ? `<p class="slide-text">${slide.texto}</p>` : ''}
            </div>
          ` : ''}
        </a>
      </div>
    `).join('');

    // Renderizar dots
    if (dotsContainer && this.slides.length > 1) {
      dotsContainer.innerHTML = this.slides.map((_, index) => `
        <button class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Slide ${index + 1}"></button>
      `).join('');
    }

    document.getElementById('bannerSlider').style.display = 'block';
  },

  /**
   * Configura controles
   */
  setupControls() {
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dots = document.querySelectorAll('.slider-dot');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goTo(index));
    });

    // Pausar no hover
    const slider = document.getElementById('bannerSlider');
    if (slider) {
      slider.addEventListener('mouseenter', () => this.stopAutoPlay());
      slider.addEventListener('mouseleave', () => {
        if (this.autoPlay && this.slides.length > 1) {
          this.startAutoPlay();
        }
      });
    }
  },

  /**
   * Vai para slide anterior
   */
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.updateSlide();
  },

  /**
   * Vai para próximo slide
   */
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.updateSlide();
  },

  /**
   * Vai para slide específico
   * @param {number} index 
   */
  goTo(index) {
    this.currentIndex = index;
    this.updateSlide();
  },

  /**
   * Atualiza slide atual
   */
  updateSlide() {
    const slides = document.querySelectorAll('.slider-slide');
    const dots = document.querySelectorAll('.slider-dot');

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentIndex);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  },

  /**
   * Inicia autoplay
   */
  startAutoPlay() {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => {
      this.next();
    }, this.interval);
  },

  /**
   * Para autoplay
   */
  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
};

// Exportar
window.BannerSlider = BannerSlider;
