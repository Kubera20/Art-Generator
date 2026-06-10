<!-- <template> -->
  <div class="p5-container">
    <h1>P5.js Art Editor</h1>
    
    <div v-if="!capturedImage" class="no-image">
      <p>No image loaded. Please capture an image first.</p>
      <button @click="goToCapture">Go to Capture</button>
    </div>
    
    <div v-else>
      <div ref="p5Canvas"></div>
      
      <div class="controls">
        <div>
          <label>Background Color:</label>
          <input type="color" v-model="backgroundColor" @change="generateArt" />
        </div>
        <div>
          <label>Object Type:</label>
          <select v-model="objectType" @change="generateArt">
            <option value="circle">Circle</option>
            <option value="star">Star</option>
            <option value="heart">Heart</option>
          </select>
        </div>
        
        <!-- New Effect Controls -->
        <div class="effect-controls">
          <h3>Effect Controls</h3>
          <div>
            <label>Color Intensity:</label>
            <input type="range" min="0" max="100" v-model="colorIntensity" @change="applyCurrentEffect" />
          </div>
          <div>
            <label>Shade Contrast:</label>
            <input type="range" min="0" max="200" v-model="shadeContrast" @change="applyCurrentEffect" />
          </div>
          <div>
            <label>Shade Density:</label>
            <input type="range" min="0" max="100" v-model="shadeDensity" @change="applyCurrentEffect" />
          </div>
        <button @click="generateArt">Generate New Art</button>
        <button @click="applyPencilEffect">Apply Pencil Effect</button>
        <button @click="applyShadesEffect">Apply Shades Effect</button>
        <button @click="resetImage">Reset Image</button>
        <button @click="downloadArt">Download Art</button>

     
<!-- </template> -->

<!-- <script> -->
export default {
  props: {
    capturedImage: {
      type: String,
      default: null
    }
  },
  inject: ['$p5'], // Inject p5 from the parent
  data() {
    return {
      p5Instance: null,
      backgroundColor: '#ffffff',
      objectType: 'circle',
      objects: [],
      sketchEffectApplied: false,
      originalImage: null,
      processedImage: null,
      colorIntensity: 50,
      shadeContrast: 100,
      shadeDensity: 50,
      currentEffectMode: null
    };
  },
  watch: {
    capturedImage: {
      handler(newImage) {
        if (newImage) {
          this.originalImage = newImage;
          this.generateArt();
        }
      },
      immediate: true
    }
  },
  methods: {
    generateArt() {
      if (this.p5Instance) {
        this.p5Instance.remove();
      }

      if (!this.capturedImage) return;

      const sketch = (p) => {
        let bgImg;

        p.preload = () => {
          if (this.capturedImage) {
            bgImg = p.loadImage(this.capturedImage);
          }
        };

        p.setup = () => {
          p.createCanvas(500, 500);
          if (bgImg) {
            p.image(bgImg, 0, 0, p.width, p.height);
          } else {
            p.background(this.backgroundColor);
          }
          this.objects = [];
        };

        p.draw = () => {
          if (bgImg) {
            p.image(bgImg, 0, 0, p.width, p.height);
          } else {
            p.background(this.backgroundColor);
          }

          this.objects.forEach((obj) => {
            obj.move();
            obj.display(p);
          });
        };

        p.mousePressed = () => {
          // Only add objects if the mouse is within the canvas
          const canvasElement = this.$refs.p5Canvas.querySelector('canvas');
          if (canvasElement) {
            // eslint-disable-next-line no-unused-vars
            const rect = canvasElement.getBoundingClientRect();
            const mouseX = p.mouseX;
            const mouseY = p.mouseY;
            
            if (mouseX >= 0 && mouseX <= p.width && mouseY >= 0 && mouseY <= p.height) {
              const newObj = new LiveObject(mouseX, mouseY, this.objectType);
              this.objects.push(newObj);
            }
          }
        };
      };

      // Use the injected p5 instance
      this.p5Instance = new this.$p5(sketch, this.$refs.p5Canvas);
    },

    applySketchEffect() {
      if (this.p5Instance) {
        this.p5Instance.remove();
      }

      const sketch = (p) => {
        let bgImg;

        p.preload = () => {
          if (this.capturedImage) {
            bgImg = p.loadImage(this.capturedImage);
          }
        };

        p.setup = () => {
          p.createCanvas(500, 500);
          if (bgImg) {
            p.image(bgImg, 0, 0, p.width, p.height);
            bgImg.loadPixels();
            for (let i = 0; i < bgImg.pixels.length; i += 4) {
              let r = bgImg.pixels[i];
              let g = bgImg.pixels[i + 1];
              let b = bgImg.pixels[i + 2];
              let avg = (r + g + b) / 3;
              bgImg.pixels[i] = avg;
              bgImg.pixels[i + 1] = avg;
              bgImg.pixels[i + 2] = avg;
            }
            bgImg.updatePixels();
            p.filter(p.THRESHOLD, 0.5);
          } else {
            p.background(this.backgroundColor);
          }
        };
      };

      this.p5Instance = new this.$p5(sketch, this.$refs.p5Canvas);
      this.sketchEffectApplied = true;
      this.currentEffectMode = 'sketch';
      
      // Capture the current canvas as the processed image
      this.captureProcessedImage();
    },
    
    resetImage() {
      if (this.originalImage) {
      /* eslint-disable vue/no-mutating-props */
        this.capturedImage = this.originalImage;
        this.currentEffectMode = null;
        this.generateArt();
      }
    },
    
    captureProcessedImage() {
      const canvas = this.$refs.p5Canvas.querySelector('canvas');
      if (canvas) {
        // eslint-disable-next-line no-unused-vars
        this.processedImage = canvas.toDataURL("image/png");
        /* eslint-disable vue/no-mutating-props */
        this.capturedImage = this.processedImage;
      }
    },
    
    applyCurrentEffect() {
      if (this.currentEffectMode === 'pencil') {
        this.applyPencilEffect();
      } else if (this.currentEffectMode === 'shades') {
        this.applyShadesEffect();
      }
    },
    
    applyPencilEffect() {
      if (!this.originalImage) return;
      this.currentEffectMode = 'pencil';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = this.originalImage;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Apply edge detection with improved contrast
        this.detectEdges(canvas);
        
        // Apply color adjustment based on colorIntensity
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const intensity = this.colorIntensity / 100;
        
        // Make pencil lines darker and more visible
        for (let i = 0; i < data.length; i += 4) {
          // Enhance dark areas for better visibility
          if (data[i] < 180) {
            // Make dark areas even darker based on intensity
            data[i] = data[i] * (0.5 - intensity * 0.3);
            data[i + 1] = data[i + 1] * (0.5 - intensity * 0.3);
            data[i + 2] = data[i + 2] * (0.5 - intensity * 0.3);
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add paper texture for better pencil drawing look
        // eslint-disable-next-line no-unused-vars
        this.addPaperTexture(ctx, canvas.width, canvas.height);
        /* eslint-disable vue/no-mutating-props */
        this.capturedImage = canvas.toDataURL();
        this.generateArt();
      };
    },

    // Improved edge detection for darker, more visible lines
    detectEdges(canvas) {
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Create a copy of the original data
      const original = new Uint8ClampedArray(data);
      
      // Increased contrast factor for darker edges
      const contrastFactor = 3.5; // Increased from 2.5 for darker lines
      const contrast = (this.shadeContrast / 100) * contrastFactor;

      // Enhanced edge detection
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const pos = (y * width + x) * 4;

          const leftPos = (y * width + (x - 1)) * 4;
          const rightPos = (y * width + (x + 1)) * 4;
          const upPos = ((y - 1) * width + x) * 4;
          const downPos = ((y + 1) * width + x) * 4;

          // Add diagonal positions for better edge detection
          const upLeftPos = ((y - 1) * width + (x - 1)) * 4;
          const upRightPos = ((y - 1) * width + (x + 1)) * 4;
          const downLeftPos = ((y + 1) * width + (x - 1)) * 4;
          const downRightPos = ((y + 1) * width + (x + 1)) * 4;

          // Enhanced Sobel operator
          const dx = (original[rightPos] - original[leftPos]) / 2;
          const dy = (original[downPos] - original[upPos]) / 2;
          
          // Add diagonal components
          const dxy1 = (original[upRightPos] - original[downLeftPos]) / 2.8;
          const dxy2 = (original[upLeftPos] - original[downRightPos]) / 2.8;
          
          // Calculate magnitude with additional components
          let magnitude = Math.sqrt(dx * dx + dy * dy + dxy1 * dxy1 + dxy2 * dxy2);
          
          // Apply stronger contrast adjustment and inversion (255 - magnitude)
          magnitude = 255 - magnitude * contrast;
          
          // Improved thresholding for darker, more defined lines
          if (magnitude > 160) magnitude = 255; // Reduced from 180
          if (magnitude < 90) magnitude = 0;    // Reduced from 100

          data[pos] = magnitude;
          data[pos + 1] = magnitude;
          data[pos + 2] = magnitude;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Add darker texture
      const textureOpacity = 0.7 + (this.shadeDensity / 100) * 0.2; // Increased opacity
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(210, 210, 210, ${textureOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      // Add pencil-like hatching texture with darker lines
      this.addPencilTexture(ctx, canvas.width, canvas.height);
    },

    // Improved pencil texture with darker lines
    addPencilTexture(ctx, width, height) {
      ctx.globalCompositeOperation = 'multiply';
      
      // Darker horizontal hatching
      ctx.strokeStyle = 'rgba(60, 60, 60, 0.15)'; // Darker color and higher opacity
      ctx.lineWidth = 0.7; // Slightly thicker lines
      
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Darker diagonal hatching
      ctx.strokeStyle = 'rgba(40, 40, 40, 0.1)'; // Even darker
      for (let i = -height; i < width; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
      
      // Add cross-hatching for deeper shadows
      ctx.strokeStyle = 'rgba(30, 30, 30, 0.08)';
      for (let i = -height; i < width; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i + height, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      ctx.globalCompositeOperation = 'source-over';
    },

    // New method to add paper texture
    addPaperTexture(ctx, width, height) {
      ctx.globalCompositeOperation = 'overlay';
      
      // Create noise pattern for paper texture
      for (let i = 0; i < width * height / 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 1;
        
        ctx.fillStyle = `rgba(200, 200, 200, ${Math.random() * 0.1})`;
        ctx.fillRect(x, y, size, size);
      }
      
      ctx.globalCompositeOperation = 'source-over';
    },

    applyShadesEffect() {
      if (!this.originalImage) return;
      this.currentEffectMode = 'shades';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = this.originalImage;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Increase these values for better contrast
        const contrast = (this.shadeContrast / 100) * 2.2; // Increased for more dramatic effect
        const density = (this.shadeDensity / 100) * 1.5;   // Increased for deeper shadows
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Improved grayscale conversion (perceptual luminance)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Enhanced contrast with stronger effect
          const adjustedGray = 128 + (gray - 128) * contrast;
          
          // Create shade effect with increased density for darker areas
          let shadeValue;
          if (gray < 110) { // Darker threshold for more dramatic shadows
            shadeValue = adjustedGray * (0.6 - (density * 0.4)); // Increased effect
          } else { // Light areas less affected
            shadeValue = adjustedGray * (1 - (density * 0.15));
          }
          
          // Clamp values
          shadeValue = Math.max(0, Math.min(255, shadeValue));
          
          data[i] = shadeValue;
          data[i + 1] = shadeValue;
          data[i + 2] = shadeValue;
        }

        ctx.putImageData(imageData, 0, 0);
        
        // Add multiple texture layers for depth
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(190, 190, 190, ${0.7 - density * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add second texture layer for darker shadows
        ctx.fillStyle = `rgba(80, 80, 80, ${0.25 - density * 0.1})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // eslint-disable-next-line no-unused-vars
        ctx.globalCompositeOperation = 'source-over';
    /* eslint-disable vue/no-mutating-props */
        this.capturedImage = canvas.toDataURL();
        this.generateArt();
      };
    },

    downloadArt() {
      const canvas = this.$refs.p5Canvas.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'moment-art.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    },
    
    goToCapture() {
      this.$router.push({ name: 'home' });
    }
  },
  beforeUnmount() {
    if (this.p5Instance) {
      this.p5Instance.remove();
    }
  }
};

class LiveObject {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 50;
    this.color = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
  }

  move() {
    this.x += Math.random() * 4 - 2;
    this.y += Math.random() * 4 - 2;
  }

  display(p) {
    p.fill(this.color);
    p.noStroke();
    if (this.type === 'circle') {
      p.ellipse(this.x, this.y, this.size);
    } else if (this.type === 'star') {
      p.textSize(this.size);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('⭐', this.x, this.y);
    } else if (this.type === 'heart') {
      p.textSize(this.size);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('❤️', this.x, this.y);
    }
  }
}
<!-- </script> -->

<!-- <style scoped> -->
.p5-container {
  margin: 20px auto;
  max-width: 500px;
  text-align: center;
}

h1 {
  margin-bottom: 20px;
}

.no-image {
  padding: 30px;
  border: 1px dashed #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
}

.controls {
  margin-top: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.controls > div {
  margin: 10px 0;
}

button {
  margin: 10px 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}

label {
  margin-right: 10px;
  font-weight: bold;
}

select, input {
  padding: 5px;
  border-radius: 3px;
  border: 1px solid #ccc;
}

.effect-controls {
  background-color: #f0f0f0;
  padding: 10px;
  margin: 15px 0;
  border-radius: 5px;
  border: 1px solid #ddd;
}

.effect-controls h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

input[type="range"] {
  width: 100%;
}
<!-- </style> -->