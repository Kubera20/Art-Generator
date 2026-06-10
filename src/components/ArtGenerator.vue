<template>
  <div class="art-generator">
    <h1>MOMENT-ART-GENERATOR</h1>
    
    <video ref="video" autoplay></video>
    <div class="button-group">
      <button @click="captureImage" :disabled="!stream">Capture Image</button>
      <button @click="downloadImage" :disabled="!processedImage">Download Art</button>
    </div>

    <div v-if="processedImage" class="processed-image">
      <h2>Processed ART</h2>
      <img :src="processedImage" alt="Captured image" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      processedImage: null,
      originalImage: null,
      stream: null
    };
  },
  methods: {
    async startCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (this.$refs.video) {
          this.$refs.video.srcObject = this.stream;
          console.log("Camera started successfully");
        }
      } catch (err) {
        console.error("Camera access denied: ", err);
      }
    },

    captureImage() {
      const video = this.$refs.video;
      if (!video) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth || 500;
      canvas.height = video.videoHeight || 500;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      this.originalImage = canvas.toDataURL("image/png");
      this.applyPortraitSketchEffect();
    },

    applyPortraitSketchEffect() {
      if (!this.originalImage) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = this.originalImage;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Step 1: Convert to high-contrast grayscale with facial tones
        this.convertToPortraitGrayscale(canvas);
        
        // Step 2: Apply refined edge detection for portrait features
        this.applyPortraitEdgeDetection(canvas);
        
        // Step 3: Apply refined shading techniques
        this.applyPortraitShading(canvas);
        
        // Step 4: Enhance facial features and details
        this.enhancePortraitDetails(canvas);
        
        // Step 5: Finalize with portrait-specific pencil texture
        this.applyPortraitFinishing(canvas);
        
        this.processedImage = canvas.toDataURL();
      };
    },

    convertToPortraitGrayscale(canvas) {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale with portrait-optimized weights
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // Adjust weights for better skin tone rendering
        let gray = 0.3 * r + 0.59 * g + 0.11 * b;
        
        // Improve midtones for facial features
        if (gray > 100 && gray < 180) {
          // Enhance midtones for better facial detail
          gray = gray + (gray - 100) * 0.15;
        } else if (gray <= 100) {
          // Enhance shadows for better definition
          gray = gray - (100 - gray) * 0.1;
        } else {
          // Soften highlights
          gray = gray + (255 - gray) * 0.05;
        }
        
        data[i] = gray;
        data[i+1] = gray;
        data[i+2] = gray;
      }
      
      ctx.putImageData(imageData, 0, 0);
    },

    applyPortraitEdgeDetection(canvas) {
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Create a copy of original data
      const original = new Uint8ClampedArray(data);
      const result = new Uint8ClampedArray(data.length);
      
      // Apply portrait-focused edge detection
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const pos = (y * width + x) * 4;
          
          // Calculate gradient with portrait-optimized Sobel
          const gx = (
            -1 * original[((y-1) * width + (x-1)) * 4] +
            -2 * original[((y) * width + (x-1)) * 4] +
            -1 * original[((y+1) * width + (x-1)) * 4] +
            1 * original[((y-1) * width + (x+1)) * 4] +
            2 * original[((y) * width + (x+1)) * 4] +
            1 * original[((y+1) * width + (x+1)) * 4]
          );
          
          const gy = (
            -1 * original[((y-1) * width + (x-1)) * 4] +
            -2 * original[((y-1) * width + (x)) * 4] +
            -1 * original[((y-1) * width + (x+1)) * 4] +
            1 * original[((y+1) * width + (x-1)) * 4] +
            2 * original[((y+1) * width + (x)) * 4] +
            1 * original[((y+1) * width + (x+1)) * 4]
          );
          
          // Calculate magnitude
          let magnitude = Math.sqrt(gx * gx + gy * gy);
          
          // Portrait-optimized thresholding - softer on faces
          if (magnitude > 30) {
            // Stronger lines for key features
            magnitude = Math.max(0, 255 - magnitude * 1.5);
          } else if (magnitude > 15) {
            // Medium lines for facial features
            magnitude = Math.max(0, 255 - magnitude * 1.0);
          } else {
            // Subtle lines for skin texture
            magnitude = Math.max(0, 255 - magnitude * 0.5);
          }
          
          // Store result
          result[pos] = magnitude;
          result[pos + 1] = magnitude;
          result[pos + 2] = magnitude;
          result[pos + 3] = 255;
        }
      }
      
      // Apply the result
      for (let i = 0; i < data.length; i++) {
        data[i] = result[i];
      }
      
      ctx.putImageData(imageData, 0, 0);
    },

    applyPortraitShading(canvas) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Create a temporary canvas for analyzing tone values
      const analyzeCanvas = document.createElement('canvas');
      analyzeCanvas.width = width;
      analyzeCanvas.height = height;
      const analyzeCtx = analyzeCanvas.getContext('2d');
      analyzeCtx.drawImage(canvas, 0, 0);
      const toneData = analyzeCtx.getImageData(0, 0, width, height).data;
      
      // Create a temporary canvas for shading effects
      const shadeCanvas = document.createElement('canvas');
      shadeCanvas.width = width;
      shadeCanvas.height = height;
      const shadeCtx = shadeCanvas.getContext('2d');
      
      // Draw the base image
      shadeCtx.drawImage(canvas, 0, 0);
      
      // Apply cross-hatching patterns optimized for portraits
      shadeCtx.globalCompositeOperation = 'multiply';
      
      // Create portrait-optimized shading regions
      const regions = [
        { threshold: 50, spacing: 4, opacity: 0.15, width: 0.5 },   // Dark shadows
        { threshold: 100, spacing: 7, opacity: 0.1, width: 0.4 },   // Mid-shadows
        { threshold: 150, spacing: 10, opacity: 0.08, width: 0.3 }, // Midtones
        { threshold: 200, spacing: 16, opacity: 0.05, width: 0.2 }  // Highlights
      ];
      
      // Calculate average tone values in grid cells
      const gridSize = 8; // Smaller grid for more detail
      const toneMap = [];
      
      for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
          let sum = 0;
          let count = 0;
          
          // Sample pixels in grid cell
          for (let gy = 0; gy < gridSize && y + gy < height; gy++) {
            for (let gx = 0; gx < gridSize && x + gx < width; gx++) {
              const pos = ((y + gy) * width + (x + gx)) * 4;
              sum += toneData[pos];
              count++;
            }
          }
          
          const avgTone = sum / count;
          toneMap.push({ x, y, tone: avgTone });
        }
      }
      
      // Apply horizontal contour lines for facial features
      for (let region of regions) {
        shadeCtx.strokeStyle = `rgba(30, 30, 30, ${region.opacity})`;
        
        for (let y = 2; y < height; y += 2) {
          let drawLine = false;
          let lineWidth = region.width;
          
          // Check if this row should have a line based on local tone
          for (let x = 0; x < width; x += gridSize) {
            const localTone = toneMap.find(t => 
              t.x <= x && t.x + gridSize > x && 
              t.y <= y && t.y + gridSize > y
            )?.tone || 128;
            
            if (localTone < region.threshold) {
              drawLine = true;
              // Modulate line width by tone
              lineWidth = region.width * (1 + (region.threshold - localTone) / region.threshold * 0.3);
              break;
            }
          }
          
          if (drawLine && y % region.spacing === 0) {
            shadeCtx.lineWidth = lineWidth;
            shadeCtx.beginPath();
            
            // Use contour-following lines for natural look
            shadeCtx.moveTo(0, y);
            
            for (let x = 0; x < width; x += width/30) { // More points for smoother curves
              // Get local tone to adjust line position
              const localTone = toneMap.find(t => 
                t.x <= x && t.x + gridSize > x && 
                t.y <= y && t.y + gridSize > y
              )?.tone || 128;
              
              // Adjust vertical position based on tone
              const jitter = Math.sin(x/30) * 1.0 + Math.random() * 0.5 - 0.25;
              const toneAdjust = (localTone < region.threshold) ? 
                (region.threshold - localTone) / region.threshold * 0.8 : 0;
              
              shadeCtx.lineTo(x, y + jitter + toneAdjust);
            }
            
            shadeCtx.stroke();
          }
        }
      }
      
      // Apply directional shading for hair
      shadeCtx.strokeStyle = 'rgba(20, 20, 20, 0.07)';
      shadeCtx.lineWidth = 0.5;
      
      // Hair direction patterns
      const centerX = width / 2;
      const hairRegionTop = height * 0.05;
      const hairRegionBottom = height * 0.45;
      
      for (let y = hairRegionTop; y < hairRegionBottom; y += 2) {
        for (let x = 0; x < width; x += 12) {
          // Check if this is a hair region based on tone
          const localTone = toneMap.find(t => 
            t.x <= x && t.x + gridSize > x && 
            t.y <= y && t.y + gridSize > y
          )?.tone || 128;
          
          if (localTone < 170) { // Likely hair region
            const strokeLength = 15 + Math.random() * 15;
            
            // Determine direction based on position relative to center
            let angle;
            if (x < centerX) {
              // Left side - hair flows right and down
              angle = Math.PI / 4 + (Math.random() * 0.4 - 0.2);
            } else {
              // Right side - hair flows left and down
              angle = Math.PI * 3/4 + (Math.random() * 0.4 - 0.2);
            }
            
            // Draw hair strand
            shadeCtx.beginPath();
            shadeCtx.moveTo(x, y);
            
            // Create slightly curved hair strand
            const ctrl1X = x + Math.cos(angle) * strokeLength * 0.33;
            const ctrl1Y = y + Math.sin(angle) * strokeLength * 0.33;
            const ctrl2X = x + Math.cos(angle) * strokeLength * 0.66;
            const ctrl2Y = y + Math.sin(angle) * strokeLength * 0.66;
            const endX = x + Math.cos(angle) * strokeLength;
            const endY = y + Math.sin(angle) * strokeLength;
            
            shadeCtx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
            shadeCtx.stroke();
          }
        }
      }
      
      // Apply the shading effect
      const shadeData = shadeCtx.getImageData(0, 0, width, height).data;
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = data[i]; // Grayscale value
        
        // Apply shading intensity with portrait-optimized curve
        if (brightness < 70) {
          // Dark areas
          const intensity = Math.pow((70 - brightness) / 70, 1.2) * 0.9;
          data[i] = Math.max(0, data[i] - shadeData[i] * intensity);
          data[i+1] = Math.max(0, data[i+1] - shadeData[i+1] * intensity);
          data[i+2] = Math.max(0, data[i+2] - shadeData[i+2] * intensity);
        } else if (brightness < 140) {
          // Mid-tones
          const intensity = Math.pow((140 - brightness) / 140, 1.1) * 0.6;
          data[i] = Math.max(0, data[i] - shadeData[i] * intensity);
          data[i+1] = Math.max(0, data[i+1] - shadeData[i+1] * intensity);
          data[i+2] = Math.max(0, data[i+2] - shadeData[i+2] * intensity);
        } else if (brightness < 210) {
          // Light areas
          const intensity = Math.pow((210 - brightness) / 210, 1.0) * 0.3;
          data[i] = Math.max(0, data[i] - shadeData[i] * intensity);
          data[i+1] = Math.max(0, data[i+1] - shadeData[i+1] * intensity);
          data[i+2] = Math.max(0, data[i+2] - shadeData[i+2] * intensity);
        } else {
          // Highlights
          const intensity = 0.05;
          data[i] = Math.max(0, data[i] - shadeData[i] * intensity);
          data[i+1] = Math.max(0, data[i+1] - shadeData[i+1] * intensity);
          data[i+2] = Math.max(0, data[i+2] - shadeData[i+2] * intensity);
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    },

    enhancePortraitDetails(canvas) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Create a copy for feature detection
      const featureCanvas = document.createElement('canvas');
      featureCanvas.width = width;
      featureCanvas.height = height;
      const featureCtx = featureCanvas.getContext('2d');
      featureCtx.drawImage(canvas, 0, 0);
      
      // Face regions - approximate locations
      const faceRegions = {
        eyes: {
          top: height * 0.25,
          bottom: height * 0.38,
          left: width * 0.15,
          right: width * 0.85
        },
        nose: {
          top: height * 0.38,
          bottom: height * 0.5,
          left: width * 0.35,
          right: width * 0.65
        },
        mouth: {
          top: height * 0.5,
          bottom: height * 0.63,
          left: width * 0.25,
          right: width * 0.75
        },
        hair: {
          top: 0,
          bottom: height * 0.4,
          left: 0,
          right: width
        }
      };
      
      // Feature-specific enhancements
      // eslint-disable-next-line no-unused-vars
      const featureData = featureCtx.getImageData(0, 0, width, height);
      const tempData = new Uint8ClampedArray(data);
      
      // Function to check if a pixel is in a region
      const inRegion = (x, y, region) => {
        return x >= region.left && x <= region.right && 
               y >= region.top && y <= region.bottom;
      };
      
      // Enhance eyes - add more contrast and definition
      for (let y = faceRegions.eyes.top; y < faceRegions.eyes.bottom; y++) {
        for (let x = faceRegions.eyes.left; x < faceRegions.eyes.right; x++) {
          const pos = (y * width + x) * 4;
          const brightness = tempData[pos];
          
          // Enhance contrast in eyes
          if (brightness < 100) {
            // Darken dark areas
            data[pos] = Math.max(0, brightness - 20);
            data[pos + 1] = Math.max(0, brightness - 20);
            data[pos + 2] = Math.max(0, brightness - 20);
          } else if (brightness > 180) {
            // Lighten eye highlights
            data[pos] = Math.min(255, brightness + 15);
            data[pos + 1] = Math.min(255, brightness + 15);
            data[pos + 2] = Math.min(255, brightness + 15);
          }
        }
      }
      
      // Enhance mouth - add definition to lips
      for (let y = faceRegions.mouth.top; y < faceRegions.mouth.bottom; y++) {
        for (let x = faceRegions.mouth.left; x < faceRegions.mouth.right; x++) {
          const pos = (y * width + x) * 4;
          const brightness = tempData[pos];
          
          // Subtle enhancement of lip contours
          if (brightness < 160 && brightness > 60) {
            // Slightly darken mid-tones in lip area
            data[pos] = Math.max(0, brightness - 10);
            data[pos + 1] = Math.max(0, brightness - 10);
            data[pos + 2] = Math.max(0, brightness - 10);
          }
        }
      }
      
      // Enhance hair texture
      for (let y = faceRegions.hair.top; y < faceRegions.hair.bottom; y++) {
        for (let x = faceRegions.hair.left; x < faceRegions.hair.right; x++) {
          const pos = (y * width + x) * 4;
          const brightness = tempData[pos];
          
          // Only enhance hair areas - approximate by brightness
          if (brightness < 150) {
            // Add hair strand effect
            if (Math.random() < 0.02) {
              // Create random hair strand
              const strandLength = Math.floor(Math.random() * 7) + 3;
              const direction = Math.random() > 0.5 ? 1 : -1;
              
              for (let i = 0; i < strandLength; i++) {
                const strandPos = (y * width + (x + i * direction)) * 4;
                if (strandPos >= 0 && strandPos < data.length) {
                  // Darken the strand slightly
                  data[strandPos] = Math.max(0, data[strandPos] - 10);
                  data[strandPos + 1] = Math.max(0, data[strandPos + 1] - 10);
                  data[strandPos + 2] = Math.max(0, data[strandPos + 2] - 10);
                }
              }
            }
          }
        }
      }
      
      // Apply enhanced local contrast for facial features
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const pos = (y * width + x) * 4;
          const brightness = tempData[pos];
          
          // Determine if this is a facial feature area
          let isFeature = false;
          let kernelSize = 2;
          
          if (inRegion(x, y, faceRegions.eyes)) {
            isFeature = true;
            kernelSize = 1; // Smaller kernel for eyes
          } else if (inRegion(x, y, faceRegions.nose) || inRegion(x, y, faceRegions.mouth)) {
            isFeature = true;
            kernelSize = 2; // Medium kernel for nose and mouth
          }
          
          // Skip very dark or very bright areas
          if (brightness > 20 && brightness < 235) {
            // Calculate local contrast
            let sum = 0;
            let count = 0;
            
            // Sample neighborhood
            for (let dy = -kernelSize; dy <= kernelSize; dy++) {
              for (let dx = -kernelSize; dx <= kernelSize; dx++) {
                const samplePos = ((y + dy) * width + (x + dx)) * 4;
                if (samplePos >= 0 && samplePos < tempData.length) {
                  sum += tempData[samplePos];
                  count++;
                }
              }
            }
            
            const avg = sum / count;
            const diff = brightness - avg;
            
            // Enhance local contrast
            if (Math.abs(diff) > 3) {
              // Stronger enhancement in feature areas
              const enhancementFactor = isFeature ? 0.5 : 0.3;
              const enhancement = diff * enhancementFactor;
              
              // Apply enhancement
              data[pos] = Math.max(0, Math.min(255, brightness + enhancement));
              data[pos + 1] = Math.max(0, Math.min(255, brightness + enhancement));
              data[pos + 2] = Math.max(0, Math.min(255, brightness + enhancement));
            }
          }
        }
      }
      
      // Add realistic graphite stippling
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pos = (y * width + x) * 4;
          const brightness = data[pos];
          
          // Calculate stipple probability based on brightness
          let stippleProbability = 0;
          
          if (brightness > 40 && brightness < 230) {
            // Base probability curve - highest in midtones
            const brightnessFactor = brightness < 130 
              ? (brightness - 40) / 90  // Increasing from dark to midtone
              : (230 - brightness) / 100;  // Decreasing from midtone to light
            
            stippleProbability = 0.008 * brightnessFactor;
          }
          
          // Apply stippling
          if (Math.random() < stippleProbability) {
            // Determine stipple characteristics
            let dotSize, dotIntensity;
            
            if (brightness < 90) {
              // Darker dots in shadow areas
              dotSize = 1;
              dotIntensity = Math.floor(Math.random() * 30) + 20;
            } else if (brightness < 160) {
              // Medium dots in midtones
              dotSize = 1;
              dotIntensity = Math.floor(Math.random() * 20) + 10;
            } else {
              // Small, light dots in highlights
              dotSize = 1;
              dotIntensity = Math.floor(Math.random() * 10) + 5;
            }
            
            // Apply stipple
            for (let dy = 0; dy < dotSize; dy++) {
              for (let dx = 0; dx < dotSize; dx++) {
                const dotPos = ((y + dy) * width + (x + dx)) * 4;
                if (dotPos < data.length - 4) {
                  data[dotPos] = Math.max(0, data[dotPos] - dotIntensity);
                  data[dotPos + 1] = Math.max(0, data[dotPos + 1] - dotIntensity);
                  data[dotPos + 2] = Math.max(0, data[dotPos + 2] - dotIntensity);
                }
              }
            }
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    },

    applyPortraitFinishing(canvas) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Create temporary canvas for paper texture
      const paperCanvas = document.createElement('canvas');
      paperCanvas.width = width;
      paperCanvas.height = height;
      const paperCtx = paperCanvas.getContext('2d');
      
      // Generate realistic paper texture
      paperCtx.fillStyle = 'rgb(250, 250, 250)';
      paperCtx.fillRect(0, 0, width, height);
      
      // Add subtle paper grain
      for (let i = 0; i < width * height / 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.03 + 0.01;
        
        paperCtx.fillStyle = `rgba(240, 240, 240, ${opacity})`;
        paperCtx.fillRect(x, y, size, size);
      }
      
      // Add paper texture to main canvas
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(paperCanvas, 0, 0);
      
      // Restore normal drawing mode
      ctx.globalCompositeOperation = 'source-over';
      
      // Add subtle portrait vignette
      const gradient = ctx.createRadialGradient(
        width/2, height/2, Math.min(width, height) * 0.35,
        width/2, height/2, Math.min(width, height) * 0.8
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(230, 230, 230, 0.18)');
      
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Final tonal adjustments for portrait
      const finalData = ctx.getImageData(0, 0, width, height);
      const finalPixels = finalData.data;
      
      // Apply artistic curve for pencil portrait look
      for (let i = 0; i < finalPixels.length; i += 4) {
        const val = finalPixels[i];
        let adjusted;
        
        // Apply curve for portrait-like tones
        if (val > 240) {
          // Paper white
          adjusted = val + (255 - val) * 0.8;
        } else if (val > 180) {
          // Light tones - gentle transition
          adjusted = val + (val - 180) * 0.4;
        } else if (val > 100) {
          // Mid-tones - enhanced contrast
          const factor = (val - 100) / 80;
          adjusted = val + (val - 100) * (0.35 - factor * 0.25);
        } else if (val > 30) {
          // Dark mid-tones
          const factor = (val - 30) / 70;
          adjusted = val - (100 - val) * (0.3 - factor * 0.25);
        } else {
          // Shadow tones - rich blacks
          adjusted = val * 0.8;
        }
        
        adjusted = Math.max(0, Math.min(255, adjusted));
        
        finalPixels[i] = adjusted;
        finalPixels[i+1] = adjusted;
        finalPixels[i+2] = adjusted;
      }
      
      ctx.putImageData(finalData, 0, 0);
    },

    downloadImage() {
      if (!this.processedImage) return;

      const link = document.createElement("a");
      link.href = this.processedImage;
      link.download = "portrait_pencil_sketch.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  mounted() {
    this.startCamera();
  }
};
</script>

<style scoped>
.art-generator {
  text-align: center;
  margin-top: 20px;
}

video {
  width: 500px;
  height: 375px;
  border: 1px solid #000;
  margin-top: 10px;
  transform: scaleX(-1);
}

.button-group {
  margin: 15px 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  margin: 5px;
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

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.processed-image {
  margin: 20px auto;
  max-width: 500px;
}

.processed-image img {
  max-width: 100%;
  border: 1px solid #ddd;
}
</style>