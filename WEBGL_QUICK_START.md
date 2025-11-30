# WebGL Hero Visualization - Quick Start

## 🎉 What You Have Now

A high-performance WebGL 2.0 particle system displaying **10,000 particles** at 60fps, inspired by [nothing-to-watch](https://github.com/gnovotny/nothing-to-watch).

## ⚡ Key Features

- **10,000 particles** rendered in a single GPU draw call
- **WebGL 2.0** with instanced rendering
- **Real-time mouse interaction** with repulsion effects
- **Smooth 60fps** performance on modern hardware
- **Minimal design** - clean and focused

## 🎨 Current Configuration

```javascript
Particle Count: 10,000
Particle Size: 20-60px (random)
Mouse Repulsion: 150px radius
Opacity: 0.2-0.5 (random)
Rotation: Enabled
Drift Speed: Gentle
Image: Memor logo (reused for all particles)
```

## 🔧 Quick Customizations

### Change Particle Count

Open `script.js` and find:

```javascript
this.particleCount = 10000;
```

**Recommendations:**
- **Dense**: 15000-20000 (may impact older devices)
- **Balanced**: 10000 (current)
- **Performance**: 5000
- **Mobile**: 2000-3000

### Change the Image

Find this line in `loadTexture()`:

```javascript
img.src = 'Asserts/logo/memor-high-resolution-logo-transparent.png';
```

Replace with any image path:
```javascript
img.src = 'Asserts/Prototype/Network.jpeg';
```

### Adjust Mouse Interaction

Find in `update()`:

```javascript
const maxDistance = 150; // Interaction radius
particle.x -= dx * force * 0.5; // Repulsion strength
```

**Try these:**
- Stronger: `particle.x -= dx * force * 1.0;`
- Weaker: `particle.x -= dx * force * 0.2;`
- Attraction: `particle.x += dx * force * 0.5;` (change - to +)
- Larger radius: `const maxDistance = 250;`

### Change Particle Size

Find in `createParticles()`:

```javascript
const size = Math.random() * 40 + 20; // 20-60px
```

**Options:**
- Larger: `Math.random() * 80 + 40` (40-120px)
- Smaller: `Math.random() * 20 + 10` (10-30px)
- Uniform: `30` (all same size)

### Adjust Opacity

Find in `createParticles()`:

```javascript
opacity: Math.random() * 0.3 + 0.2 // 0.2-0.5
```

**Options:**
- More visible: `Math.random() * 0.4 + 0.4` (0.4-0.8)
- More subtle: `Math.random() * 0.2 + 0.1` (0.1-0.3)

Or in `styles.css`:
```css
#hero-canvas {
    opacity: 0.6; /* Change 0-1 */
}
```

### Change Animation Speed

**Drift:**
```javascript
vx: (Math.random() - 0.5) * 0.3, // Current
vx: (Math.random() - 0.5) * 0.8, // Faster
vx: (Math.random() - 0.5) * 0.1, // Slower
```

**Rotation:**
```javascript
rotationSpeed: (Math.random() - 0.5) * 0.008, // Current  
rotationSpeed: (Math.random() - 0.5) * 0.02,  // Faster
rotationSpeed: 0,                              // Disabled
```

**Return Speed:**
```javascript
particle.x += (particle.baseX - particle.x) * 0.03; // Current
particle.x += (particle.baseX - particle.x) * 0.08; // Snappy
particle.x += (particle.baseX - particle.x) * 0.01; // Floaty
```

## 📊 Performance Optimization

### If You Experience Low FPS:

1. **Reduce particle count:**
   ```javascript
   this.particleCount = 5000;
   ```

2. **Use smaller texture:**
   - Resize your image to 128x128 or 256x256
   - Compress the image

3. **Disable rotation:**
   ```javascript
   // Comment out in update():
   // particle.rotation += particle.rotationSpeed;
   ```

4. **Smaller particle sizes:**
   ```javascript
   const size = Math.random() * 20 + 10;
   ```

### Mobile Detection

Add this at the top of the class:

```javascript
constructor(canvas) {
    // ... existing code ...
    
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    this.particleCount = isMobile ? 2000 : 10000;
    
    // ... rest of code ...
}
```

## 🎯 Common Tweaks

### More Chaotic Movement

```javascript
vx: (Math.random() - 0.5) * 1.5,
vy: (Math.random() - 0.5) * 1.5,
rotationSpeed: (Math.random() - 0.5) * 0.03,
```

### Calm and Subtle

```javascript
vx: (Math.random() - 0.5) * 0.1,
vy: (Math.random() - 0.5) * 0.1,
rotationSpeed: (Math.random() - 0.5) * 0.002,
opacity: Math.random() * 0.2 + 0.1,
```

### Dense Cloud

```javascript
this.particleCount = 20000;
const size = Math.random() * 30 + 15;
opacity: Math.random() * 0.3 + 0.15,
```

### Minimal Aesthetic

```javascript
this.particleCount = 3000;
const size = Math.random() * 20 + 20;
opacity: Math.random() * 0.2 + 0.2,
rotationSpeed: 0, // No rotation
```

## 🐛 Troubleshooting

### Black Screen?
1. Open browser console (F12)
2. Look for WebGL errors
3. Check image is loading (Network tab)
4. Try: `chrome://gpu` to verify WebGL is enabled

### Poor Performance?
1. Lower particle count to 5000
2. Close other applications
3. Update graphics drivers
4. Try different browser (Chrome recommended)

### Particles Not Moving?
1. Check mouse event listeners are working
2. Console.log `this.mouse` values
3. Verify `update()` is being called

## 📚 Full Documentation

See `HERO_VISUALIZATION.md` for complete technical details, shader code explanation, and advanced customization options.

## 🎨 Inspiration

This implementation is inspired by:
- [nothing-to-watch](https://github.com/gnovotny/nothing-to-watch) by @gnovotny
- WebGL instanced rendering techniques
- GPU particle systems

## 💡 Next Steps

1. Try different images
2. Adjust particle count to your preference
3. Tweak interaction strength
4. Customize colors and opacity
5. Add your own effects in the shaders!

Enjoy your high-performance particle system! 🚀

