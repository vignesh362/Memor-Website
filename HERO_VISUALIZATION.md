# Hero Section WebGL Visualization

Inspired by [nothing-to-watch](https://github.com/gnovotny/nothing-to-watch), this creates a high-performance particle system using **WebGL 2.0 with instanced rendering** to display **10,000 particles** at 60fps.

## Features

⚡ **10,000 Particles** - Handles massive particle counts efficiently
🎮 **WebGL 2.0** - GPU-accelerated rendering with instanced drawing
🖱️ **Mouse Interaction** - Real-time particle repulsion
🎭 **Smooth Animations** - 60fps performance with shader-based effects
📱 **Responsive** - Optimized for desktop and mobile
🚀 **Minimal** - Clean, performant code inspired by nothing-to-watch

## How It Works

### Architecture

1. **WebGL Context** - WebGL 2.0 for modern GPU features
2. **Instanced Rendering** - Draw 10,000 quads in a single draw call
3. **GLSL Shaders** - Vertex and fragment shaders for effects
4. **Efficient Updates** - Only update particle positions, not rebuild buffers
5. **GPU Textures** - Image loaded once to GPU memory

### Technical Details

**Instanced Rendering:**
- Single draw call for all 10,000 particles
- Per-instance attributes: position, rotation, opacity
- Per-vertex attributes: quad geometry, texture coordinates

**Shaders:**
- **Vertex Shader**: Transforms each instance, applies rotation
- **Fragment Shader**: Samples texture, applies opacity

**Performance:**
- 10,000 particles @ 60fps
- Minimal CPU overhead
- GPU handles all transformations
- Efficient buffer updates

### Particle Data

Each particle stores:
- **Base Position** (x, y): Original grid position
- **Current Position** (x, y): Animated position  
- **Velocity** (vx, vy): Drift speed
- **Size**: Particle diameter
- **Rotation**: Current angle
- **Rotation Speed**: Angular velocity
- **Opacity**: Transparency (0-1)

## Customization

### Changing Particle Count

In the constructor:

```javascript
this.particleCount = 10000; // Change to any number

// Examples:
this.particleCount = 5000;  // Less dense
this.particleCount = 20000; // More dense (may impact performance)
```

### Using Different Images

Change the image path in `loadTexture()`:

```javascript
img.src = 'Asserts/Prototype/Network.jpeg'; // Your image
```

For multiple random images, you'll need to create a texture atlas or array textures.

### Adjusting Particle Size

In `createParticles()`:

```javascript
// Current:
const size = Math.random() * 40 + 20; // 20-60px

// Larger:
const size = Math.random() * 60 + 40; // 40-100px

// Smaller (for more particles):
const size = Math.random() * 20 + 10; // 10-30px
```

### Mouse Interaction Strength

In `update()`:

```javascript
// Current:
const maxDistance = 150;
const force = (maxDistance - distance) / maxDistance;
particle.x -= dx * force * 0.5;

// Stronger repulsion:
particle.x -= dx * force * 1.0;

// Weaker repulsion:
particle.x -= dx * force * 0.2;

// Larger interaction radius:
const maxDistance = 250;

// Attraction instead:
particle.x += dx * force * 0.5;
```

### Animation Speed

```javascript
// Drift speed (in createParticles):
vx: (Math.random() - 0.5) * 0.3, // Current
vx: (Math.random() - 0.5) * 0.8, // Faster
vx: (Math.random() - 0.5) * 0.1, // Slower

// Rotation speed:
rotationSpeed: (Math.random() - 0.5) * 0.008, // Current
rotationSpeed: (Math.random() - 0.5) * 0.02,  // Faster
rotationSpeed: (Math.random() - 0.5) * 0.003, // Slower

// Return to base speed (in update):
particle.x += (particle.baseX - particle.x) * 0.03; // Current
particle.x += (particle.baseX - particle.x) * 0.08; // Faster
particle.x += (particle.baseX - particle.x) * 0.01; // Slower
```

### Adjusting Canvas Opacity

In `styles.css`:

```css
#hero-canvas {
    opacity: 0.6; /* Change 0-1 */
}

/* Mobile */
@media (max-width: 640px) {
    #hero-canvas {
        opacity: 0.4; /* Change 0-1 */
    }
}
```

## Performance Tips

### For Lower-End Devices

1. **Reduce particle count**:
```javascript
this.particleCount = 5000; // Instead of 10000
```

2. **Disable rotation updates**:
```javascript
// In update(), comment out:
// particle.rotation += particle.rotationSpeed;
```

3. **Reduce particle size**:
```javascript
const size = Math.random() * 20 + 10; // Smaller = faster
```

4. **Simplify interaction**:
```javascript
// Skip mouse repulsion for some particles
if (i % 2 === 0) continue; // Only process every other particle
```

### For Maximum Performance

1. **Use power-of-2 texture dimensions** (already handled)
2. **Reduce buffer updates** - Only update changed particles
3. **Use smaller textures** - 128x128 or 64x64
4. **Disable blending** if not needed (loses transparency)

## Browser Support

### Required Features

- **WebGL 2.0**: Chrome 56+, Firefox 51+, Safari 15+, Edge 79+
- **Instanced Rendering**: `drawArraysInstanced` support
- **GLSL 3.00 ES**: Modern shader language

### Fallback

If WebGL 2 is not supported, the code logs an error. Consider adding a Canvas 2D fallback or showing a static image.

### Testing

Check WebGL 2 support:
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
    console.warn('WebGL 2 not supported');
}
```

## Troubleshooting

### WebGL Not Working

**Error: "WebGL 2 not supported"**
- Update your browser to the latest version
- Check if hardware acceleration is enabled
- Try a different browser (Chrome/Firefox recommended)
- Check: `chrome://gpu` (Chrome) or `about:support` (Firefox)

**Black Screen / No Particles**
1. Check browser console for shader compilation errors
2. Verify texture is loading (check Network tab)
3. Test with the fallback code that creates a gradient
4. Check if WebGL context was successfully created

### Performance Issues

**Low FPS / Lag**
1. Reduce particle count to 5000 or less
2. Use smaller texture (resize image to 128x128)
3. Disable anti-aliasing in WebGL context
4. Check GPU utilization in task manager
5. Close other GPU-intensive applications

**Mobile Performance**
1. Reduce to 2000-3000 particles on mobile
2. Detect mobile and adjust:
```javascript
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
this.particleCount = isMobile ? 2000 : 10000;
```

### Visual Issues

**Particles Not Responding to Mouse**
- Check mouse event listeners are attached
- Verify mouse coordinates are being updated
- Console.log mouse position to debug

**Particles Clipping/Disappearing**
- Particles moving outside canvas bounds
- Adjust boundary wrapping logic
- Check viewport transformation in shader

## Future Enhancements

Based on [nothing-to-watch](https://github.com/gnovotny/nothing-to-watch):

- [ ] **Voronoi Diagram**: Add force-directed layout
- [ ] **Multiple Textures**: Support texture atlas for variety
- [ ] **Camera Controls**: Zoom and pan functionality
- [ ] **Particle Clustering**: Group similar items
- [ ] **Color Grading**: Post-processing effects
- [ ] **Selection Mode**: Click to select particles
- [ ] **Physics Engine**: More complex particle interactions
- [ ] **Web Workers**: Multi-threaded particle updates
- [ ] **Dynamic LOD**: Adjust quality based on FPS

## Credits

Inspired by the excellent [nothing-to-watch](https://github.com/gnovotny/nothing-to-watch) project by [@gnovotny](https://github.com/gnovotny).

## License

Part of the Memor Website project.

