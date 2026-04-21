/**
 * Mosque Shoe Collection - Instruction Slider
 * Premium carousel with auto-slide, navigation, and touch support
 * Digital Clock with +10 minute offset
 */

// Global settings state
window.APP_SETTINGS = {};

/**
 * Digital Clock - 12-hour format with +10 min adjustment
 */
class DigitalClock {
    constructor() {
        this.hoursEl = document.getElementById('clockHours');
        this.minutesEl = document.getElementById('clockMinutes');
        this.secondsEl = document.getElementById('clockSeconds');
        this.ampmEl = document.getElementById('clockAmPm');
        this.offsetMinutes = 10; // +10 minutes offset
        
        this.update();
        setInterval(() => this.update(), 1000);
    }
    
    update() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + this.offsetMinutes);
        
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Use global setting for format
        const format = window.APP_SETTINGS.clock_format || '12';
        let ampm = '';

        if (format === '12') {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 becomes 12
            this.ampmEl.style.display = 'block';
            this.ampmEl.textContent = ampm;
        } else {
            this.ampmEl.style.display = 'none'; // hide AM/PM for 24 hour
        }
        
        this.hoursEl.textContent = hours.toString().padStart(2, '0');
        this.minutesEl.textContent = minutes.toString().padStart(2, '0');
        this.secondsEl.textContent = seconds.toString().padStart(2, '0');
    }
}

class InstructionSlider {
    constructor() {
        this.track = document.getElementById('carouselTrack');
        this.slides = document.querySelectorAll('.slide');
        this.dots = document.querySelectorAll('.nav-dot');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.wrapper = document.querySelector('.carousel-wrapper');
        
        this.currentSlide = 0;
        this.totalSlides = this.slides.length;
        this.autoSlideInterval = null;
        this.autoSlideDelay = 15000; // 15 seconds
        this.progressInterval = null;
        this.progressStart = 0;
        this.isPaused = false;
        this.isTransitioning = false;
        
        // Touch support
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.isDragging = false;
        
        this.init();
    }
    
    init() {
        if(this.totalSlides === 0) return;
        this.bindEvents();
        this.startAutoSlide();
        this.updateSlide();
        this.hideLoadingOverlay();
    }
    
    bindEvents() {
        // Navigation arrows
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Dot navigation
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Pause on hover (desktop)
        this.wrapper.addEventListener('mouseenter', () => this.pause());
        this.wrapper.addEventListener('mouseleave', () => this.resume());
        
        // Touch events (mobile swipe)
        this.wrapper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.wrapper.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.wrapper.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.nextSlide(); // RTL: left = next
            if (e.key === 'ArrowRight') this.prevSlide(); // RTL: right = prev
            if (e.key === ' ') {
                e.preventDefault();
                this.isPaused ? this.resume() : this.pause();
            }
        });
        
        // Visibility change - pause when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    goToSlide(index) {
        if (this.isTransitioning || index === this.currentSlide) return;
        
        this.isTransitioning = true;
        this.currentSlide = index;
        this.updateSlide();
        this.resetAutoSlide();
        
        setTimeout(() => {
            this.isTransitioning = false;
        }, 700);
    }
    
    nextSlide() {
        const next = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(next);
    }
    
    prevSlide() {
        const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.goToSlide(prev);
    }
    
    updateSlide() {
        if (!this.track || this.totalSlides === 0) return;
        // Move track
        const offset = -this.currentSlide * 100;
        this.track.style.transform = `translateX(${offset}%)`;
        
        // Update dots
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentSlide);
        });
        
        // Update slide badge
        const badge = document.querySelector('.slide-badge');
        if (badge) {
            badge.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;
        }
        
        // Re-animate cards in current slide
        this.animateCards();
        
        // Reset progress bar
        this.resetProgress();
    }
    
    animateCards() {
        // Remove visible class from all cards
        this.slides.forEach(slide => {
            slide.querySelectorAll('.instruction-card').forEach(card => {
                card.classList.remove('card-visible');
            });
        });
        
        // Add visible class to current slide cards (CSS handles staggered transitions)
        if(this.slides[this.currentSlide]) {
            const currentSlideEl = this.slides[this.currentSlide];
            const cards = currentSlideEl.querySelectorAll('.instruction-card');
            
            // Force a browser reflow so CSS resets the opacity/transform completely
            void currentSlideEl.offsetHeight;
            
            // Small delay to allow the DOM transition reset to catch
            setTimeout(() => {
                cards.forEach(card => {
                    card.classList.add('card-visible');
                });
            }, 30);
        }
    }
    
    startAutoSlide() {
        this.stopAutoSlide();
        this.progressStart = Date.now();
        
        this.autoSlideInterval = setTimeout(() => {
            this.nextSlide();
            this.startAutoSlide();
        }, this.autoSlideDelay);
        
        // Progress bar animation
        this.startProgress();
    }
    
    stopAutoSlide() {
        if (this.autoSlideInterval) {
            clearTimeout(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
        this.stopProgress();
    }
    
    resetAutoSlide() {
        this.stopAutoSlide();
        if (!this.isPaused) {
            this.startAutoSlide();
        }
    }
    
    pause() {
        this.isPaused = true;
        this.stopAutoSlide();
        if (this.progressBar) this.progressBar.style.transition = 'none';
    }
    
    resume() {
        this.isPaused = false;
        this.startAutoSlide();
    }
    
    startProgress() {
        if (this.progressBar) {
            this.progressBar.style.transition = 'none';
            this.progressBar.style.width = '0%';
            
            // Force reflow
            this.progressBar.offsetHeight;
            
            this.progressBar.style.transition = `width ${this.autoSlideDelay}ms linear`;
            this.progressBar.style.width = '100%';
        }
    }
    
    stopProgress() {
        if (this.progressBar) {
            const computed = getComputedStyle(this.progressBar);
            const currentWidth = computed.width;
            this.progressBar.style.transition = 'none';
            this.progressBar.style.width = currentWidth;
        }
    }
    
    resetProgress() {
        if (this.progressBar) {
            this.progressBar.style.transition = 'none';
            this.progressBar.style.width = '0%';
        }
    }
    
    // Touch handling for swipe support
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = true;
        this.pause();
    }
    
    handleTouchMove(e) {
        if (!this.isDragging) return;
        const diffX = e.touches[0].clientX - this.touchStartX;
        const diffY = e.touches[0].clientY - this.touchStartY;
        // If horizontal swipe is dominant, prevent vertical scroll
        if (Math.abs(diffX) > Math.abs(diffY)) e.preventDefault();
    }
    
    handleTouchEnd(e) {
        if (!this.isDragging) return;
        this.touchEndX = e.changedTouches[0].clientX;
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;
        if (Math.abs(diff) > threshold) {
            // RTL: swipe left = next, swipe right = prev
            if (diff > 0) this.nextSlide();
            else this.prevSlide();
        }
        this.isDragging = false;
        this.resume();
    }
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('hidden');
                setTimeout(() => overlay.remove(), 600);
            }, 800);
        }
    }
}

/**
 * Image Auto-Refresher
 */
class ImageRefresher {
    constructor(intervalSeconds = 10) {
        this.interval = intervalSeconds * 1000;
        this.refreshAll();
        setInterval(() => this.refreshAll(), this.interval);
    }
    
    refreshAll() {
        const timestamp = Date.now();
        document.querySelectorAll('.instruction-icon img').forEach(img => {
            const baseSrc = img.src.split('?')[0];
            img.src = `${baseSrc}?v=${timestamp}`;
        });
    }
}

class APIFetcher {
    static get BASE_URL() {
        // Return empty string for production (relative paths) 
        // Only return localhost if specifically on a dev port that isn't the backend
        return (window.location.port === '3000') ? 'http://localhost:3001' : '';
    }

    static async loadSettings() {
        try {
            const res = await fetch(`${APIFetcher.BASE_URL}/api/settings`);
            const settings = await res.json();
            window.APP_SETTINGS = settings;
            
            // Global Theme Colors (Override CSS Variables)
            const root = document.documentElement;
            if(settings.global_bg_color) {
                document.body.style.backgroundColor = settings.global_bg_color;
                root.style.setProperty('--bg-cream', settings.global_bg_color);
                root.style.setProperty('--bg-slide', settings.global_bg_color + 'e6'); // 90% opacity
            }
            
            if(settings.global_button_bg) {
                root.style.setProperty('--gold', settings.global_button_bg);
                root.style.setProperty('--gold-dark', settings.global_button_bg);
                root.style.setProperty('--gold-light', settings.global_button_bg);
            }
            
            if(settings.global_footer_bg) {
                root.style.setProperty('--green', settings.global_footer_bg);
                root.style.setProperty('--green-dark', settings.global_footer_bg);
            }

            // Header Background
            if(settings.global_header_bg) {
                document.querySelector('.clock-header').style.background = settings.global_header_bg;
            } else {
                // Fallback backward compatibility for older presets
                let headerBg = '#064a2b';
                if(settings.header_color === 'blue') headerBg = '#1e3a8a';
                else if(settings.header_color === 'yellow') headerBg = '#eab308';
                else if(settings.header_color === 'gold') headerBg = '#ca8a04';
                document.querySelector('.clock-header').style.backgroundColor = headerBg;
            }

            // Header Text customizations
            const subtitleEl = document.getElementById('headerSubtitle');
            if(subtitleEl) {
                if(settings.header_text) subtitleEl.textContent = settings.header_text;
                if(settings.header_text_color) subtitleEl.style.color = settings.header_text_color;
                if(settings.header_font) subtitleEl.style.fontFamily = settings.header_font;
                if(settings.header_size) subtitleEl.style.fontSize = settings.header_size + 'px';
            }

            // Clock Customizations (Format is handled inside DigitalClock)
            const clockEl = document.querySelector('.clock-container');
            if(clockEl) {
                if(settings.clock_font) clockEl.style.fontFamily = settings.clock_font;
                if(settings.clock_color) {
                    document.querySelectorAll('.clock-value').forEach(el => el.style.color = settings.clock_color);
                    document.querySelectorAll('.clock-separator').forEach(el => el.style.color = settings.clock_color);
                    document.getElementById('clockAmPm').style.color = settings.clock_color;
                }
                if(settings.clock_size) {
                    const size = parseInt(settings.clock_size);
                    const scale = size / 64; // Default was approx 64px
                    clockEl.style.transform = `scale(${scale})`; // Cheap way to scale the whole clock block without breaking flex
                }
            }
        } catch(e) {
            console.log('API settings error', e);
        }
    }

    static async loadSlides() {
        try {
            const res = await fetch(`${APIFetcher.BASE_URL}/api/slides`);
            const slides = await res.json();
            
            if(slides.length === 0) return; // fallback to hardcoded if no DB slides
            
            const track = document.getElementById('carouselTrack');
            track.innerHTML = '';
            
            const navDots = document.querySelector('.nav-dots');
            navDots.innerHTML = '';

            slides.forEach((slide, index) => {
                // Slide div
                const slideDiv = document.createElement('div');
                slideDiv.className = `slide ${index === 0 ? 'active' : ''}`;
                slideDiv.dataset.slide = index;
                
                // Slide defaults
                if (slide.bg_color) slideDiv.style.backgroundColor = slide.bg_color;
                if (slide.font_family) slideDiv.style.fontFamily = slide.font_family;
                if (slide.text_color) slideDiv.style.color = slide.text_color;

                // Instructions in slide
                slide.instructions.forEach(inst => {
                    const card = document.createElement('div');
                    card.className = 'instruction-card';
                    
                    // Master Style Variables
                    const mBg = window.APP_SETTINGS.master_point_bg;
                    const mColor = window.APP_SETTINGS.master_point_color;
                    const mAlign = window.APP_SETTINGS.master_point_align;
                    const mFont = window.APP_SETTINGS.master_point_font;
                    const mSize = window.APP_SETTINGS.master_point_size;
                    const mBold = window.APP_SETTINGS.master_point_bold;
                    const mItalic = window.APP_SETTINGS.master_point_italic;
                    const mUnderline = window.APP_SETTINGS.master_point_underline;

                    // Point-Level Background Apply
                    if (mBg && mBg !== 'transparent') {
                        card.style.backgroundColor = mBg;
                    } else {
                        card.style.backgroundColor = 'transparent';
                    }
                    
                    const pContainer = document.createElement('div');
                    pContainer.className = 'instruction-text';
                    pContainer.innerHTML = inst.text.replace(/\n/g, '<br>');
                    
                    // Master Typography Apply
                    pContainer.style.textAlign = mAlign || 'right';
                    if (mSize) pContainer.style.fontSize = mSize + 'px';
                    if (mFont) pContainer.style.fontFamily = mFont;
                    if (mColor) pContainer.style.color = mColor;
                    
                    if (mBold) pContainer.style.fontWeight = 'bold';
                    if (mItalic) pContainer.style.fontStyle = 'italic';
                    if (mUnderline) pContainer.style.textDecoration = 'underline';

                    const iconDiv = document.createElement('div');
                    iconDiv.className = 'instruction-icon';
                    const iconPath = inst.icon_path;
                    const finalIconSrc = (iconPath && (iconPath.startsWith('data:') || iconPath.startsWith('http'))) 
                        ? iconPath 
                        : (iconPath ? APIFetcher.BASE_URL + iconPath : 'images/shoe_styles.png');

                    iconDiv.innerHTML = `<img src="${finalIconSrc}" alt="Icon" loading="lazy">`;

                    card.appendChild(iconDiv);
                    card.appendChild(pContainer);
                    
                    slideDiv.appendChild(card);
                });

                track.appendChild(slideDiv);

                // Nav dot
                const dot = document.createElement('button');
                dot.className = `nav-dot ${index === 0 ? 'active' : ''}`;
                dot.dataset.slide = index;
                navDots.appendChild(dot);
            });
        } catch(e) {
            console.log('API slides error', e);
        }
    }

    /**
     * Notes Board Mode — replaces the entire carousel with notes content.
    /**
     * Notes Board Mode — Simplified vertical layout (as requested).
     * Cards are 100% width. Long text auto-scrolls smoothly.
     */
    static async loadNotesBoard() {
        try {
            const res = await fetch(`${APIFetcher.BASE_URL}/api/notes`);
            const notes = await res.json();
            
            const wrapper = document.querySelector('.carousel-wrapper');
            if (!wrapper) return;
            wrapper.innerHTML = '';
            
            if (notes.length === 0) {
                wrapper.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;';
                wrapper.innerHTML = '<div style="opacity:0.4;font-size:2rem;font-family:var(--font-urdu);direction:rtl;">کوئی نوٹ نہیں ہے</div>';
                return;
            }

            wrapper.style.cssText = `
                display: flex; flex-direction: column; gap: 30px;
                padding: 40px; height: 100%; overflow-y: auto; direction: rtl;
            `;
            
            const scrollers = [];
            
            notes.forEach((note, idx) => {
                const noteCard = document.createElement('div');
                noteCard.className = 'note-card-frontend';
                // Prioritize saved height, but default to a large legible height for signage
                const finalHeight = note.height && note.height > 0 ? `${note.height}px` : '75vh';
                
                noteCard.style.cssText = `
                    width: 100%;
                    height: ${finalHeight};
                    background: ${note.bg_color || 'rgba(255,254,245,0.95)'};
                    color: ${note.text_color || '#2d2a1e'};
                    font-family: ${note.font_family || 'var(--font-urdu)'};
                    font-size: ${note.font_size ? note.font_size + 'px' : 'clamp(1.5rem, 4.5vw, 60px)'};
                    line-height: 1.8; text-align: right; direction: rtl;
                    animation-delay: ${idx * 0.15}s;
                `;
                
                let titleBarH = 0;
                if (note.title) {
                    const titleBar = document.createElement('div');
                    titleBar.style.cssText = `
                        padding: 20px 5vw; font-size: 1.3em; font-weight: 700;
                        border-bottom: 2px solid rgba(212,168,67,0.3);
                        background: inherit; position: relative; z-index: 2;
                    `;
                    titleBar.textContent = note.title;
                    noteCard.appendChild(titleBar);
                    titleBarH = 70;
                }
                
                const viewport = document.createElement('div');
                viewport.className = 'note-viewport';
                viewport.style.cssText = `
                    height: calc(100% - ${titleBarH}px);
                    overflow: hidden; position: relative;
                    padding: 3vh 6vw;
                `;

                const scroller = document.createElement('div');
                scroller.className = 'note-scroller';

                if (note.type === 'image' && note.image_path) {
                    const imgEl = document.createElement('img');
                    imgEl.src = APIFetcher.BASE_URL + note.image_path;
                    imgEl.style.cssText = 'width: 100%; max-height: 50vh; object-fit: contain; border-radius: 15px; margin-bottom: 20px;';
                    scroller.appendChild(imgEl);
                }

                if (note.content) {
                    const contentEl = document.createElement('div');
                    contentEl.innerHTML = note.content.replace(/\n/g, '<br>');
                    scroller.appendChild(contentEl);
                }

                viewport.appendChild(scroller);
                noteCard.appendChild(viewport);
                wrapper.appendChild(noteCard);
                scrollers.push({ viewport, scroller, noteCard });
            });
            
            // Auto-scroll setup
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollers.forEach(({ viewport, scroller }) => {
                        const setupScroll = () => {
                            const viewH = viewport.clientHeight;
                            const contentH = scroller.scrollHeight;
                            if (contentH > viewH + 20) {
                                const overflowPx = contentH - viewH;
                                scroller.style.setProperty('--scroll-distance', `-${overflowPx}px`);
                                scroller.style.setProperty('--scroll-speed', `${Math.max(10, overflowPx / 35)}s`);
                                scroller.style.animationName = 'noteAutoScroll';
                            } else {
                                scroller.style.animationName = 'none';
                            }
                        };
                        setupScroll();
                    });
                }, 400);
            });
        } catch(e) { console.log('Notes Board error', e); }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await APIFetcher.loadSettings(); 
    } catch(e) { console.error(e); }
    
    try {
        new DigitalClock();
    } catch(e) { console.error(e); }
    
    // Check toggle: Notes Board vs Slider
    const isNotesMode = window.APP_SETTINGS.notes_board_active === 1;
    
    if (isNotesMode) {
        // === NOTES BOARD MODE ===
        try {
            await APIFetcher.loadNotesBoard();
        } catch(e) { console.error('Notes Board Error:', e); }
        
        // Hide loader
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    } else {
        // === DYNAMIC SLIDER MODE ===
        try {
            await APIFetcher.loadSlides();
        } catch(e) { console.error(e); }
        
        setTimeout(() => {
            try {
                if(document.querySelectorAll('.slide').length > 0) {
                    window.sliderInstance = new InstructionSlider();
                }
            } catch(e) { console.error('Slider Error:', e); }
            
            try {
                new ImageRefresher(10);
            } catch(e) { console.error(e); }
            
            // Fallback hide loader if slider init fails or array is empty
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.style.display = 'none';
            
        }, 600);
    }
});

