// ===== HERO WEBGL VISUALIZATION (Minimal, High Performance) =====
class WebGLHeroVisualization {
    constructor(canvas) {
        console.log('WebGL Hero Visualization constructor called');
        this.canvas = canvas;
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        
        this.gl = canvas.getContext('webgl2', { 
            alpha: true, 
            antialias: false,
            powerPreference: 'high-performance'
        });
        
        if (!this.gl) {
            console.error('WebGL 2 not supported - trying WebGL 1');
            this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!this.gl) {
                console.error('WebGL not supported at all');
                return;
            }
        }
        
        console.log('WebGL context created successfully');
        
        this.particles = [];
        this.particleCount = 10000;
        this.mouse = { x: 0, y: 0, normalized: { x: 0, y: 0 } };
        this.texture = null;
        this.frameCount = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        
        this.loadTexture();
    }
    
    loadTexture() {
        console.log('Loading texture...');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height);
            this.createTexture(img);
            this.setupWebGL();
            this.createParticles();
            console.log('Starting animation...');
            this.animate();
        };
        img.onerror = (e) => {
            console.warn('Image failed to load, using fallback', e);
            // Create a fallback colored square
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 64, 64);
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#ec4899');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            console.log('Fallback canvas created');
            this.createTexture(canvas);
            this.setupWebGL();
            this.createParticles();
            console.log('Starting animation with fallback...');
            this.animate();
        };
        const imagePath = 'Asserts/logo/memor-high-resolution-logo-transparent.png';
        console.log('Attempting to load image from:', imagePath);
        img.src = imagePath;
    }
    
    createTexture(img) {
        const gl = this.gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    setupWebGL() {
        const gl = this.gl;
        
        // Vertex shader with instancing
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            in vec2 a_texCoord;
            in vec3 a_particlePos; // x, y, size
            in float a_rotation;
            in float a_opacity;
            
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;
            uniform float u_time;
            
            out vec2 v_texCoord;
            out float v_opacity;
            
            mat2 rotate2d(float angle) {
                return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
            }
            
            void main() {
                vec2 position = a_position * a_particlePos.z;
                position = rotate2d(a_rotation) * position;
                position += a_particlePos.xy;
                
                vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
                clipSpace.y *= -1.0;
                
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                v_texCoord = a_texCoord;
                v_opacity = a_opacity;
            }
        `;
        
        // Fragment shader
        const fragmentShaderSource = `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            in float v_opacity;
            
            uniform sampler2D u_texture;
            
            out vec4 outColor;
            
            void main() {
                vec4 texColor = texture(u_texture, v_texCoord);
                outColor = vec4(texColor.rgb, texColor.a * v_opacity);
            }
        `;
        
        // Compile shaders
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }
        
        gl.useProgram(this.program);
        
        // Get attribute and uniform locations
        this.locations = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
            particlePos: gl.getAttribLocation(this.program, 'a_particlePos'),
            rotation: gl.getAttribLocation(this.program, 'a_rotation'),
            opacity: gl.getAttribLocation(this.program, 'a_opacity'),
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            mouse: gl.getUniformLocation(this.program, 'u_mouse'),
            time: gl.getUniformLocation(this.program, 'u_time'),
            texture: gl.getUniformLocation(this.program, 'u_texture')
        };
        
        // Create quad (two triangles)
        const positions = new Float32Array([
            -0.5, -0.5,
             0.5, -0.5,
            -0.5,  0.5,
             0.5, -0.5,
             0.5,  0.5,
            -0.5,  0.5
        ]);
        
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 0,
            1, 1,
            0, 1
        ]);
        
        // Position buffer
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        // TexCoord buffer
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
        
        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
        console.log(`Compiling ${shaderType} shader...`);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`${shaderType} Shader compile error:`, gl.getShaderInfoLog(shader));
            console.error('Shader source:', source);
            gl.deleteShader(shader);
            return null;
        }
        
        console.log(`${shaderType} shader compiled successfully`);
        return shader;
    }
    
    createParticles() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cols = Math.ceil(Math.sqrt(this.particleCount * (w / h)));
        const rows = Math.ceil(this.particleCount / cols);
        const cellW = w / cols;
        const cellH = h / rows;
        
        const particleData = [];
        const rotationData = [];
        const opacityData = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.8;
            const y = row * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.8;
            const size = Math.random() * 40 + 20;
            
            this.particles.push({
                x, y,
                baseX: x,
                baseY: y,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.008,
                opacity: Math.random() * 0.3 + 0.2
            });
            
            particleData.push(x, y, size);
            rotationData.push(this.particles[i].rotation);
            opacityData.push(this.particles[i].opacity);
        }
        
        const gl = this.gl;
        
        // Particle position buffer (instanced)
        this.particlePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleData), gl.DYNAMIC_DRAW);
        
        // Rotation buffer (instanced)
        this.rotationBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rotationData), gl.DYNAMIC_DRAW);
        
        // Opacity buffer (instanced)
        this.opacityBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.opacityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(opacityData), gl.STATIC_DRAW);
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        console.log('Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.normalized.x = this.mouse.x / this.canvas.width;
        this.mouse.normalized.y = this.mouse.y / this.canvas.height;
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.touches[0].clientX - rect.left;
            this.mouse.y = e.touches[0].clientY - rect.top;
            this.mouse.normalized.x = this.mouse.x / this.canvas.width;
            this.mouse.normalized.y = this.mouse.y / this.canvas.height;
        }
    }
    
    update() {
        const particleData = [];
        const rotationData = [];
        const maxDistance = 150;
        
        this.particles.forEach(particle => {
            // Mouse repulsion
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                particle.x -= dx * force * 0.5;
                particle.y -= dy * force * 0.5;
            }
            
            // Return to base
            particle.x += (particle.baseX - particle.x) * 0.03;
            particle.y += (particle.baseY - particle.y) * 0.03;
            
            // Drift
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Update rotation
            particle.rotation += particle.rotationSpeed;
            
            particleData.push(particle.x, particle.y, particle.size);
            rotationData.push(particle.rotation);
        });
        
        const gl = this.gl;
        
        // Update buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePosBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(particleData));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(rotationData));
    }
    
    render() {
        const gl = this.gl;
        
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        
        // Set uniforms
        gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.locations.mouse, this.mouse.x, this.mouse.y);
        gl.uniform1f(this.locations.time, performance.now() * 0.001);
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.locations.texture, 0);
        
        // Setup attributes
        // Position (per vertex)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        
        // TexCoord (per vertex)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.locations.texCoord);
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);
        
        // Particle position (per instance)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.particlePosBuffer);
        gl.enableVertexAttribArray(this.locations.particlePos);
        gl.vertexAttribPointer(this.locations.particlePos, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.locations.particlePos, 1);
        
        // Rotation (per instance)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.rotationBuffer);
        gl.enableVertexAttribArray(this.locations.rotation);
        gl.vertexAttribPointer(this.locations.rotation, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.locations.rotation, 1);
        
        // Opacity (per instance)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.opacityBuffer);
        gl.enableVertexAttribArray(this.locations.opacity);
        gl.vertexAttribPointer(this.locations.opacity, 1, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(this.locations.opacity, 1);
        
        // Draw instanced
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.particleCount);
    }
    
    animate() {
        this.frameCount++;
        if (this.frameCount === 1) {
            console.log('First frame - animation started!');
        }
        if (this.frameCount % 60 === 0) {
            console.log(`Frame ${this.frameCount} - Animation running at ~60fps`);
        }
        
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Simple Canvas 2D Hero Visualization (Fallback/Working Version)
class SimpleHeroVisualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.images = [];
        this.imagesLoaded = 0;
        this.imagesToLoad = [];
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.animationId = null;
        this.isVisible = true;
        this.isPaused = false;
        
        console.log('Simple Canvas 2D visualization starting...');
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        window.addEventListener('resize', () => this.resize());
        
        // Detect scrolling for performance optimization
        window.addEventListener('scroll', () => {
            this.isScrolling = true;
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
            }, 150);
        }, { passive: true });
        
        // Set up Intersection Observer to pause when out of view
        this.setupVisibilityObserver();
        
        // Define all image paths (web-compatible formats only)
        this.imagesToLoad = [
            'Asserts/Memor website images/0bbbddaa-3ee3-4472-8474-1b3fa07c416d.jpg',
            'Asserts/Memor website images/1fd74786-7dbc-4379-b72b-22f1d6217a8e.jpg',
            'Asserts/Memor website images/20240112_003705.jpg',
            'Asserts/Memor website images/3749A24D-B022-404B-A784-6E926E58362C.jpg',
            'Asserts/Memor website images/39552bd0-cf91-4657-988a-82b5b45b30bf.jpg',
            'Asserts/Memor website images/79a44c1c-894c-4292-994c-1af3015fc011.jpg',
            'Asserts/Memor website images/7e01c55b-a5dc-43d8-8442-47150b9bb32d.jpg',
            'Asserts/Memor website images/92e5fe9c-3149-48f3-9a7e-b76b6cc4530f.jpg',
            'Asserts/Memor website images/aeede821-f943-4dd0-8344-304f1dea7071.jpg',
            'Asserts/Memor website images/FullSizeRender.jpg',
            'Asserts/Memor website images/FullSizeRender(1).jpg',
            'Asserts/Memor website images/IMG_0016.JPG',
            'Asserts/Memor website images/IMG_0020.JPG',
            'Asserts/Memor website images/IMG_0124.JPG',
            'Asserts/Memor website images/IMG_0188.jpg',
            'Asserts/Memor website images/IMG_0221.jpg',
            'Asserts/Memor website images/IMG_0238.jpg',
            'Asserts/Memor website images/IMG_0290.JPG',
            'Asserts/Memor website images/IMG_0454.JPG',
            'Asserts/Memor website images/IMG_0472.JPG',
            'Asserts/Memor website images/IMG_0582.jpg',
            'Asserts/Memor website images/IMG_0863.JPG',
            'Asserts/Memor website images/IMG_1411.JPG',
            'Asserts/Memor website images/IMG_1414.JPG',
            'Asserts/Memor website images/IMG_5650.jpg',
            'Asserts/Memor website images/IMG_5821.jpg',
            'Asserts/Memor website images/IMG_6063.jpg',
            'Asserts/Memor website images/IMG_6241.JPG',
            'Asserts/Memor website images/IMG_6399.jpg',
            'Asserts/Memor website images/IMG_6502.jpg',
            'Asserts/Memor website images/IMG_6614.JPG',
            'Asserts/Memor website images/IMG_6622.JPG',
            'Asserts/Memor website images/IMG_6680.JPG',
            'Asserts/Memor website images/IMG_6717.JPG',
            'Asserts/Memor website images/IMG_6745.jpg',
            'Asserts/Memor website images/IMG_6757.PNG',
            'Asserts/Memor website images/IMG_6800.JPG',
            'Asserts/Memor website images/IMG_6821.JPG',
            'Asserts/Memor website images/IMG_6823.JPG',
            'Asserts/Memor website images/IMG_6898.JPG',
            'Asserts/Memor website images/IMG_7043.JPG',
            'Asserts/Memor website images/IMG_7047.jpg',
            'Asserts/Memor website images/IMG_7056.JPG',
            'Asserts/Memor website images/IMG_7098.jpg',
            'Asserts/Memor website images/IMG_7658.JPG',
            'Asserts/Memor website images/IMG_7685.JPG',
            'Asserts/Memor website images/IMG_7686.JPG',
            'Asserts/Memor website images/IMG_7690.JPG',
            'Asserts/Memor website images/IMG_8460.JPG',
            'Asserts/Memor website images/IMG_8461.JPG',
            'Asserts/Memor website images/IMG_8731.JPG',
            'Asserts/Memor website images/IMG_8774.JPG',
            'Asserts/Memor website images/IMG_8842.JPG',
            'Asserts/Memor website images/IMG_9183.JPG',
            'Asserts/Memor website images/IMG_9191.JPG',
            'Asserts/Memor website images/IMG_9360.JPG',
            'Asserts/Memor website images/IMG_9394.JPG',
            'Asserts/Memor website images/IMG_9510.JPG',
            'Asserts/Memor website images/IMG_9512.JPG',
            'Asserts/Memor website images/IMG_9534.JPG',
            'Asserts/Memor website images/IMG_9753.JPG',
            'Asserts/Memor website images/IMG_9759.JPG',
            'Asserts/Memor website images/IMG_9841.JPG',
            'Asserts/Memor website images/IMG_9848.JPG',
            'Asserts/Memor website images/IMG_9849.JPG',
            'Asserts/Memor website images/IMG_9888.JPG',
            'Asserts/Memor website images/IMG_9889.JPG',
            'Asserts/Memor website images/IMG_9894.JPG',
            'Asserts/Memor website images/IMG_9979.JPG',
            'Asserts/Memor website images/IMG-20240117-WA0025.jpeg'
        ];
        
        // Load images first, then create particles
        this.loadImages();
    }
    
    loadImages() {
        console.log(`🖼️ Loading ${this.imagesToLoad.length} images...`);
        const totalImages = this.imagesToLoad.length;
        
        this.imagesToLoad.forEach((imagePath, index) => {
            const img = new Image();
            
            img.onload = () => {
                this.images.push(img);
                this.imagesLoaded++;
                
                if (this.imagesLoaded % 10 === 0 || this.imagesLoaded === totalImages) {
                    console.log(`✅ Loaded ${this.imagesLoaded}/${totalImages} images`);
                }
                
                // Start animation once we have at least a few images
                if (this.imagesLoaded === 10 && this.particles.length === 0) {
                    console.log('🎨 Starting animation with first 10 images...');
                    this.createParticles();
                    this.animate();
                }
                
                // All images loaded
                if (this.imagesLoaded === totalImages) {
                    console.log('🎉 All images loaded successfully!');
                }
            };
            
            img.onerror = () => {
                console.warn(`⚠️ Failed to load: ${imagePath}`);
                this.imagesLoaded++;
                
                // Still start if we have enough images
                if (this.imagesLoaded >= 10 && this.particles.length === 0) {
                    this.createParticles();
                    this.animate();
                }
            };
            
            img.src = imagePath;
        });
        
        // Fallback: if no images load in 2 seconds, use gradient
        setTimeout(() => {
            if (this.images.length === 0) {
                console.log('⏱️ Timeout: Creating fallback gradient images...');
                this.createFallbackImages();
                if (this.particles.length === 0) {
                    this.createParticles();
                    this.animate();
                }
            }
        }, 2000);
    }
    
    createFallbackImages() {
        // Create multiple gradient variations
        const colors = [
            ['#8b5cf6', '#ec4899', '#d946ef'],
            ['#ec4899', '#f43f5e', '#fb923c'],
            ['#6366f1', '#8b5cf6', '#a855f7'],
            ['#14b8a6', '#06b6d4', '#3b82f6']
        ];
        
        colors.forEach(colorSet => {
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, colorSet[0]);
            gradient.addColorStop(0.5, colorSet[1]);
            gradient.addColorStop(1, colorSet[2]);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
            ctx.fill();
            
            this.images.push(canvas);
        });
        
        console.log(`Created ${this.images.length} fallback gradient images`);
    }
    
    createParticles() {
        // Reduce particle count for better performance
        const count = window.innerWidth < 768 ? 500 : 1000;
        console.log(`🎨 Creating ${count} particles with ${this.images.length} images`);
        
        for (let i = 0; i < count; i++) {
            // Randomly select an image from the loaded images
            const randomImage = this.images[Math.floor(Math.random() * this.images.length)];
            
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                baseX: 0,
                baseY: 0,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 50 + 30, // 30-80px for images
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                opacity: Math.random() * 0.5 + 0.3,
                image: randomImage, // Assign random image
                hue: Math.random() * 60 + 250 // For fallback
            });
            this.particles[i].baseX = this.particles[i].x;
            this.particles[i].baseY = this.particles[i].y;
        }
        console.log('✅ Particles created:', this.particles.length);
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        console.log('Canvas resized to:', this.canvas.width, 'x', this.canvas.height);
    }
    
    setupVisibilityObserver() {
        // Create Intersection Observer to detect when hero section is visible
        const options = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.1 // Trigger when 10% of hero is visible
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                
                if (this.isVisible) {
                    // Hero section is visible - resume animation
                    if (this.isPaused) {
                        console.log('🎬 Resuming animation - hero section visible');
                        this.isPaused = false;
                        this.animate();
                    }
                } else {
                    // Hero section is out of view - pause animation
                    if (!this.isPaused) {
                        console.log('⏸️ Pausing animation - hero section hidden (performance optimization)');
                        this.isPaused = true;
                        if (this.animationId) {
                            cancelAnimationFrame(this.animationId);
                            this.animationId = null;
                        }
                    }
                }
            });
        }, options);
        
        // Observe the hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            observer.observe(heroSection);
            console.log('👁️ Visibility observer set up for hero section');
        }
    }
    
    animate() {
        // Stop animation if paused (out of view)
        if (this.isPaused) {
            return;
        }
        
        // Clear canvas more efficiently during scroll
        if (this.isScrolling) {
            // Simplified rendering during scroll for performance
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.particles.forEach(p => {
            // Calculate distance to mouse (skip during scroll for performance)
            let scale = 1;
            if (!this.isScrolling) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Mouse enlargement effect
                const enlargeRadius = 200;
                if (dist < enlargeRadius) {
                    const proximity = 1 - (dist / enlargeRadius);
                    scale = 1 + (proximity * 2);
                }
            }
            
            // Drift
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap
            if (p.x < -50) p.x = this.canvas.width + 50;
            if (p.x > this.canvas.width + 50) p.x = -50;
            if (p.y < -50) p.y = this.canvas.height + 50;
            if (p.y > this.canvas.height + 50) p.y = -50;
            
            // Update rotation (slower during scroll)
            p.rotation += this.isScrolling ? p.rotationSpeed * 0.5 : p.rotationSpeed;
            
            // Calculate scaled size
            const scaledSize = p.size * scale;
            
            // Draw
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = this.isScrolling ? p.opacity * 0.7 : p.opacity;
            
            if (p.image) {
                // Draw the particle's assigned image with scaling
                this.ctx.drawImage(
                    p.image,
                    -scaledSize / 2,
                    -scaledSize / 2,
                    scaledSize,
                    scaledSize
                );
            } else {
                // Fallback: draw colored circle
                this.ctx.fillStyle = `hsl(${p.hue}, 70%, 60%)`;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, scaledSize / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Initialize hero visualization
let heroViz;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, looking for hero canvas...');
    const heroCanvas = document.getElementById('hero-canvas');
    console.log('Canvas element:', heroCanvas);
    console.log('Canvas offsetWidth:', heroCanvas?.offsetWidth);
    console.log('Canvas offsetHeight:', heroCanvas?.offsetHeight);
    
    if (heroCanvas) {
        console.log('Creating SIMPLE Canvas 2D visualization (working version)...');
        // Use simple version that definitely works
        heroViz = new SimpleHeroVisualization(heroCanvas);
        
        // Uncomment below to try WebGL version:
        // heroViz = new WebGLHeroVisualization(heroCanvas);
    } else {
        console.error('Hero canvas not found!');
    }
});

// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission with confetti
const form = document.getElementById('interestForm');
const successMessage = document.getElementById('successMessage');
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Confetti {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 10 + 5;
        this.speed = Math.random() * 3 + 2;
        this.color = this.randomColor();
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
    }

    randomColor() {
        const colors = ['#8b5cf6', '#ec4899', '#d2e823', '#5865f2', '#f59e0b'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        
        if (this.y > canvas.height) {
            return false;
        }
        return true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

let confettiArray = [];
let animationId;

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiArray = confettiArray.filter(confetti => {
        confetti.update();
        confetti.draw();
        return confetti.y < canvas.height;
    });

    if (confettiArray.length > 0) {
        animationId = requestAnimationFrame(animateConfetti);
    }
}

function createConfetti() {
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            confettiArray.push(new Confetti());
        }, i * 10);
    }
    animateConfetti();
}

// Initialize EmailJS
(function() {
    emailjs.init({
        publicKey: "zCa56oiSeEWI9Kv82",
    });
})();

// Handle form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value || 'No message provided'
    };
    
    // Disable submit button to prevent double submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Send email using EmailJS
    emailjs.send('service_1q8q6n8', 'template_kt8dxw6', {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: 'vs3128@nyu.edu, as20373@nyu.edu',
        reply_to: formData.email
    })
    .then(function(response) {
        console.log('Email sent successfully!', response.status, response.text);
        
        // Hide form and show success message
        form.style.display = 'none';
        successMessage.classList.add('show');
        
        // Trigger confetti
        createConfetti();
        
        // Reset form after 5 seconds
        setTimeout(() => {
            form.style.display = 'block';
            successMessage.classList.remove('show');
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }, 5000);
    }, function(error) {
        console.error('Failed to send email:', error);
        
        // Show error message
        alert('Oops! Something went wrong. Please try again or contact us directly at vs3128@nyu.edu');
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    });
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards, prototype cards, and scenario cards
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.feature-card, .prototype-card, .scenario-card');
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Parallax effect removed for better scroll performance

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }
});

// Add typing animation to hero title (optional enhancement)
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    let i = 0;
    
    function typeWriter() {
        if (i < text.length) {
            heroTitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }
    
    // Uncomment to enable typing animation
    // typeWriter();
}

// Add ripple effect to buttons
document.querySelectorAll('.btn-primary, .btn-nav').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .btn-primary, .btn-nav {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');

let currentImageIndex = 0;
const prototypeImages = [];

// Initialize prototype images
document.addEventListener('DOMContentLoaded', () => {
    const prototypeCards = document.querySelectorAll('.prototype-card');
    
    prototypeCards.forEach((card, index) => {
        const img = card.querySelector('.prototype-image img');
        const overlay = card.querySelector('.prototype-overlay');
        const title = overlay.querySelector('h3').textContent;
        const description = overlay.querySelector('p').textContent;
        
        prototypeImages.push({
            src: img.src,
            alt: img.alt,
            title: title,
            description: description
        });
        
        // Add click event to open lightbox
        card.addEventListener('click', () => {
            openLightbox(index);
        });
    });
});

function openLightbox(index) {
    currentImageIndex = index;
    updateLightboxImage();
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
    lightbox.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
}

function updateLightboxImage() {
    const image = prototypeImages[currentImageIndex];
    lightboxImg.src = image.src;
    lightboxImg.alt = image.alt;
    lightboxCaption.innerHTML = `<strong>${image.title}</strong> - ${image.description}`;
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + prototypeImages.length) % prototypeImages.length;
    updateLightboxImage();
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % prototypeImages.length;
    updateLightboxImage();
}

// Close lightbox event listeners
lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Navigation event listeners
lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    showPrevImage();
});

lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    showNextImage();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('show')) return;
    
    if (e.key === 'Escape') {
        closeLightbox();
    } else if (e.key === 'ArrowLeft') {
        showPrevImage();
    } else if (e.key === 'ArrowRight') {
        showNextImage();
    }
});

// Console easter egg
console.log('%c🎉 Welcome to Memor! 🎉', 'color: #8b5cf6; font-size: 24px; font-weight: bold;');
console.log('%cTurn every place into your story', 'color: #ec4899; font-size: 16px;');
console.log('%cInterested in joining our team or learning more? Reach out!', 'color: #5865f2; font-size: 14px;');
