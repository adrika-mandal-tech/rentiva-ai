/* majestic-theme.js - The Universe Background */
(function () {
    // 1. Create Canvas Layer
    const canvas = document.createElement('canvas');
    canvas.id = 'majestic-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-9999'; // Far behind
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    // Theme Detection
    const getTheme = () => {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    };

    // 2. Stars & Elements
    class Star {
        constructor() {
            this.reset();
            this.y = Math.random() * height; // Start spread out
        }
        reset() {
            this.x = Math.random() * width;
            this.y = -10;
            this.size = Math.random() * 2 + 0.5;
            this.speed = Math.random() * 0.5 + 0.2;
            this.opacity = Math.random() * 0.8 + 0.2;
        }
        update() {
            this.y += this.speed;
            if (this.y > height) this.reset();
        }
        draw(theme) {
            // Dark mode: white stars. Light mode: soft gray stars.
            ctx.fillStyle = theme === 'dark'
                ? `rgba(255, 255, 255, ${this.opacity})`
                : `rgba(100, 116, 139, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

    }

    class FloatingIcon {
        constructor(iconChar) {
            this.icon = iconChar;
            this.reset();
            this.y = Math.random() * height;
        }
        reset() {
            this.x = Math.random() * width;
            this.y = height + 50;
            this.size = Math.random() * 20 + 10;
            this.speed = Math.random() * 0.5 + 0.2;
            this.opacity = Math.random() * 0.3 + 0.1;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 0.02;
        }
        update() {
            this.y -= this.speed; // Float UP
            this.rotation += this.rotSpeed;
            if (this.y < -50) this.reset();
        }
        draw(theme) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.font = `${this.size}px "FontAwesome"`;
            // Dark: Gold/Yellow. Light: Purple/Pink
            ctx.fillStyle = theme === 'dark'
                ? `rgba(255, 215, 0, ${this.opacity})`
                : `rgba(139, 92, 246, ${this.opacity})`;
            ctx.fillText(this.icon, -this.size / 2, -this.size / 2);
            ctx.restore();
        }

    }

    // FontAwesome Unicodes:
    // Money: \uf0d6 (bill-alt), Home: \uf015, Robot: \uf544, Heart: \uf004
    const icons = ['\uf0d6', '\uf015', '\uf544', '\uf004'];
    const particles = [];
    const iconParticles = [];

    function init() {
        resize();
        // Create Stars
        for (let i = 0; i < 150; i++) particles.push(new Star());
        // Create Icons
        for (let i = 0; i < 20; i++) {
            iconParticles.push(new FloatingIcon(icons[Math.floor(Math.random() * icons.length)]));
        }
        animate();
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);

    function animate() {
        ctx.clearRect(0, 0, width, height);

        const theme = getTheme();

        // Background Gradient
        if (theme === 'dark') {
            // Deep Space
            const grd = ctx.createLinearGradient(0, 0, 0, height);
            grd.addColorStop(0, "#0f172a"); // Slate 900
            grd.addColorStop(1, "#1e1b4b"); // Indigo 950
            ctx.fillStyle = grd;
        } else {
            // Light Theme - Sky/Cloud
            const grd = ctx.createLinearGradient(0, 0, 0, height);
            grd.addColorStop(0, "#f8fafc"); // Slate 50
            grd.addColorStop(1, "#e2e8f0"); // Slate 200
            ctx.fillStyle = grd;
        }
        ctx.fillRect(0, 0, width, height);


        particles.forEach(p => { p.update(); p.draw(theme); });
        iconParticles.forEach(p => { p.update(); p.draw(theme); });

        requestAnimationFrame(animate);
    }

    // Font loading check (crude)
    document.fonts.ready.then(init);

    // CSS Injection for Glow Effects AND TRANSPARENT BODY
    const style = document.createElement('style');
    style.innerHTML = `
        /* CRITICAL: Make Body Transparent so Canvas Shows */
        html, body {
            background: transparent !important;
            background-image: none !important;
            min-height: 100vh;
        }

        /* Majestic Glow Utilities */
        :root {
            --majestic-purple: #8b5cf6;
            --majestic-blue: #3b82f6;
            --glass-bg: rgba(17, 24, 39, 0.7);
            --glass-border: rgba(255, 255, 255, 0.1);
        }
        [data-theme="dark"] {
            --glass-bg: rgba(15, 23, 42, 0.6);
            --glass-border: rgba(255, 255, 255, 0.1);
        }
        
        /* Vibrant Logo Gradient */
        .logo, .brand-title strong {
            background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%) !important;
            -webkit-background-clip: text !important;
            background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            color: transparent !important;
        }
        .logo i {
            -webkit-text-fill-color: #8b5cf6 !important;
            color: #8b5cf6 !important;
        }


        /* Enhanced Glass Cards */
        .card, .glass-panel, .nav-container, .features, .hero-card, .sidebar {
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            background: var(--glass-bg) !important;
            border: 1px solid var(--glass-border) !important;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15) !important;
        }
        
        /* Exception for High Contrast Cards (Terms/Templates) */
        .terms-card, .template-card {
            background: #ffffff !important; /* Force solid */
            opacity: 0.98 !important; 
        }
        /* Navbar transparent wrapper */
        nav {
            background: rgba(255,255,255,0.2) !important;
            backdrop-filter: blur(5px) !important;
            box-shadow: none !important;
        }
    `;
    document.head.appendChild(style);

})();
