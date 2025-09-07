/**
 * @fileoverview Visual difference detection and analysis tools
 * Advanced image comparison and diff generation utilities
 */

import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Diff analysis result
 * @typedef {Object} DiffResult
 * @property {number} totalPixels - Total pixels in image
 * @property {number} diffPixels - Number of different pixels
 * @property {number} diffPercentage - Percentage of different pixels
 * @property {boolean} passed - Whether comparison passed threshold
 * @property {string} [diffImagePath] - Path to generated diff image
 * @property {Object} [regions] - Different regions analysis
 */

/**
 * Region analysis result
 * @typedef {Object} RegionAnalysis
 * @property {number} x - X coordinate of region
 * @property {number} y - Y coordinate of region
 * @property {number} width - Width of region
 * @property {number} height - Height of region
 * @property {number} pixelCount - Pixels in this region
 * @property {number} severity - Severity score (0-1)
 */

/**
 * Comparison options
 * @typedef {Object} ComparisonOptions
 * @property {number} [threshold] - Pixel difference threshold (0-1)
 * @property {boolean} [includeAA] - Include anti-aliasing differences
 * @property {number} [alpha] - Alpha threshold for transparency
 * @property {boolean} [diffMask] - Generate diff mask
 * @property {string} [diffColor] - Color for diff pixels
 * @property {boolean} [analyzeRegions] - Perform region analysis
 * @property {number} [regionMinSize] - Minimum region size for analysis
 */

export class VisualDiffTool {
  constructor() {
    this.defaultOptions = {
      threshold: 0.1,
      includeAA: false,
      alpha: 0.1,
      diffMask: true,
      diffColor: '#ff0000',
      analyzeRegions: false,
      regionMinSize: 10
    }
  }

  /**
   * Compare two images and generate detailed diff analysis
   * @param {string|Buffer} image1Path - First image path or buffer
   * @param {string|Buffer} image2Path - Second image path or buffer
   * @param {ComparisonOptions} [options] - Comparison options
   * @returns {Promise<DiffResult>}
   */
  async compareImages(image1Path, image2Path, options = {}) {
    const opts = { ...this.defaultOptions, ...options }
    
    // Load images
    const img1Buffer = typeof image1Path === 'string' 
      ? await fs.readFile(image1Path) 
      : image1Path
    const img2Buffer = typeof image2Path === 'string' 
      ? await fs.readFile(image2Path) 
      : image2Path

    // Parse PNG data
    const img1 = PNG.sync.read(img1Buffer)
    const img2 = PNG.sync.read(img2Buffer)

    // Ensure images are same size
    if (img1.width !== img2.width || img1.height !== img2.height) {
      throw new Error(`Image dimensions don't match: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`)
    }

    const { width, height } = img1
    const totalPixels = width * height

    // Create diff image
    const diff = new PNG({ width, height })

    // Perform pixel comparison
    const diffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      width,
      height,
      {
        threshold: opts.threshold,
        includeAA: opts.includeAA,
        alpha: opts.alpha,
        diffColor: this.hexToRgb(opts.diffColor),
        diffColorAlt: [255, 255, 255] // White for similar pixels
      }
    )

    const diffPercentage = (diffPixels / totalPixels) * 100
    const passed = diffPercentage <= opts.threshold * 100

    const result = {
      totalPixels,
      diffPixels,
      diffPercentage,
      passed,
      dimensions: { width, height }
    }

    // Generate diff image if requested
    if (opts.diffMask) {
      result.diffImageBuffer = PNG.sync.write(diff)
    }

    // Perform region analysis if requested
    if (opts.analyzeRegions) {
      result.regions = await this.analyzeRegions(diff, opts.regionMinSize)
    }

    return result
  }

  /**
   * Analyze different regions in diff image
   * @param {PNG} diffImage - Diff image data
   * @param {number} minSize - Minimum region size
   * @returns {Promise<RegionAnalysis[]>}
   * @private
   */
  async analyzeRegions(diffImage, minSize = 10) {
    const { width, height, data } = diffImage
    const visited = new Set()
    const regions = []

    // Find connected components of different pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const key = `${x},${y}`

        if (visited.has(key)) continue

        // Check if pixel is different (red channel indicates difference)
        if (data[idx] > 200) { // Red pixel indicates difference
          const region = this.floodFill(diffImage, x, y, visited)
          
          if (region.pixelCount >= minSize) {
            regions.push({
              ...region,
              severity: Math.min(region.pixelCount / (width * height), 1)
            })
          }
        }
      }
    }

    return regions.sort((a, b) => b.severity - a.severity)
  }

  /**
   * Flood fill algorithm to find connected regions
   * @param {PNG} image - Image data
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {Set} visited - Visited pixels set
   * @returns {RegionAnalysis}
   * @private
   */
  floodFill(image, startX, startY, visited) {
    const { width, height, data } = image
    const stack = [[startX, startY]]
    const regionPixels = []
    
    let minX = startX, maxX = startX
    let minY = startY, maxY = startY

    while (stack.length > 0) {
      const [x, y] = stack.pop()
      const key = `${x},${y}`

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
        continue
      }

      const idx = (y * width + x) * 4
      
      // Check if pixel is different
      if (data[idx] <= 200) continue

      visited.add(key)
      regionPixels.push([x, y])
      
      // Update bounds
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)

      // Add neighbors
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixelCount: regionPixels.length,
      pixels: regionPixels
    }
  }

  /**
   * Create side-by-side comparison image
   * @param {string|Buffer} image1 - First image
   * @param {string|Buffer} image2 - Second image
   * @param {string|Buffer} [diffImage] - Diff image
   * @returns {Promise<Buffer>}
   */
  async createComparisonImage(image1, image2, diffImage) {
    const img1Buffer = typeof image1 === 'string' ? await fs.readFile(image1) : image1
    const img2Buffer = typeof image2 === 'string' ? await fs.readFile(image2) : image2
    
    const img1Sharp = sharp(img1Buffer)
    const img2Sharp = sharp(img2Buffer)
    
    const img1Meta = await img1Sharp.metadata()
    const img2Meta = await img2Sharp.metadata()
    
    const width = Math.max(img1Meta.width, img2Meta.width)
    const height = Math.max(img1Meta.height, img2Meta.height)
    
    // Create labels
    const labelHeight = 30
    const totalHeight = height + labelHeight
    
    const images = [
      {
        input: await this.addLabel(img1Sharp, 'Expected', width, height),
        left: 0,
        top: 0
      },
      {
        input: await this.addLabel(img2Sharp, 'Actual', width, height),
        left: width,
        top: 0
      }
    ]
    
    let totalWidth = width * 2
    
    // Add diff image if provided
    if (diffImage) {
      const diffBuffer = typeof diffImage === 'string' ? await fs.readFile(diffImage) : diffImage
      const diffSharp = sharp(diffBuffer)
      
      images.push({
        input: await this.addLabel(diffSharp, 'Difference', width, height),
        left: width * 2,
        top: 0
      })
      
      totalWidth = width * 3
    }
    
    // Create composite image
    return await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite(images)
    .png()
    .toBuffer()
  }

  /**
   * Add label to image
   * @param {sharp.Sharp} image - Sharp image instance
   * @param {string} label - Label text
   * @param {number} targetWidth - Target width
   * @param {number} targetHeight - Target height
   * @returns {Promise<Buffer>}
   * @private
   */
  async addLabel(image, label, targetWidth, targetHeight) {
    const labelHeight = 30
    
    // Create label
    const labelSvg = `
      <svg width="${targetWidth}" height="${labelHeight}">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif" font-size="14" fill="#333">
          ${label}
        </text>
      </svg>
    `
    
    const labelBuffer = Buffer.from(labelSvg)
    const resizedImage = await image.resize(targetWidth, targetHeight).toBuffer()
    
    // Composite label with image
    return await sharp({
      create: {
        width: targetWidth,
        height: targetHeight + labelHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: labelBuffer, left: 0, top: 0 },
      { input: resizedImage, left: 0, top: labelHeight }
    ])
    .png()
    .toBuffer()
  }

  /**
   * Generate diff report HTML
   * @param {DiffResult} diffResult - Diff analysis result
   * @param {Object} [metadata] - Additional metadata
   * @returns {string}
   */
  generateHTMLReport(diffResult, metadata = {}) {
    const { 
      totalPixels, 
      diffPixels, 
      diffPercentage, 
      passed, 
      regions = [],
      dimensions 
    } = diffResult

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visual Diff Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: ${passed ? '#d4edda' : '#f8d7da'}; 
                   padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .status { font-size: 18px; font-weight: bold; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 15px; margin: 20px 0; }
          .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .regions { margin-top: 20px; }
          .region { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }
          .images { display: flex; gap: 20px; margin-top: 20px; }
          .image-container { text-align: center; }
          .image-container img { max-width: 400px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="status">${passed ? '✅ PASSED' : '❌ FAILED'}</div>
          <div>Visual comparison ${passed ? 'passed' : 'failed'} with ${diffPercentage.toFixed(2)}% difference</div>
        </div>

        <div class="metrics">
          <div class="metric">
            <div>Total Pixels</div>
            <div class="metric-value">${totalPixels.toLocaleString()}</div>
          </div>
          <div class="metric">
            <div>Different Pixels</div>
            <div class="metric-value">${diffPixels.toLocaleString()}</div>
          </div>
          <div class="metric">
            <div>Difference %</div>
            <div class="metric-value">${diffPercentage.toFixed(2)}%</div>
          </div>
          <div class="metric">
            <div>Dimensions</div>
            <div class="metric-value">${dimensions.width}×${dimensions.height}</div>
          </div>
        </div>

        ${regions.length > 0 ? `
          <div class="regions">
            <h3>Different Regions (${regions.length})</h3>
            ${regions.map((region, i) => `
              <div class="region">
                <strong>Region ${i + 1}:</strong> 
                (${region.x}, ${region.y}) ${region.width}×${region.height} 
                - ${region.pixelCount} pixels 
                - Severity: ${(region.severity * 100).toFixed(1)}%
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${metadata.testName ? `<div><strong>Test:</strong> ${metadata.testName}</div>` : ''}
        ${metadata.timestamp ? `<div><strong>Timestamp:</strong> ${metadata.timestamp}</div>` : ''}
      </body>
      </html>
    `
  }

  /**
   * Convert hex color to RGB array
   * @param {string} hex - Hex color string
   * @returns {number[]}
   * @private
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 0, 0]
  }

  /**
   * Save diff result to files
   * @param {DiffResult} result - Diff result
   * @param {string} baseName - Base filename
   * @param {string} outputDir - Output directory
   * @returns {Promise<Object>}
   */
  async saveDiffResult(result, baseName, outputDir) {
    await fs.mkdir(outputDir, { recursive: true })
    
    const files = {}
    
    // Save diff image if available
    if (result.diffImageBuffer) {
      const diffPath = path.join(outputDir, `${baseName}-diff.png`)
      await fs.writeFile(diffPath, result.diffImageBuffer)
      files.diffImage = diffPath
    }
    
    // Save HTML report
    const reportPath = path.join(outputDir, `${baseName}-report.html`)
    const htmlReport = this.generateHTMLReport(result, {
      testName: baseName,
      timestamp: new Date().toISOString()
    })
    await fs.writeFile(reportPath, htmlReport)
    files.report = reportPath
    
    // Save JSON data
    const jsonPath = path.join(outputDir, `${baseName}-result.json`)
    const jsonData = {
      ...result,
      diffImageBuffer: undefined, // Don't include buffer in JSON
      timestamp: new Date().toISOString()
    }
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2))
    files.json = jsonPath
    
    return files
  }
}

/**
 * Quick diff comparison function
 * @param {string|Buffer} image1 - First image
 * @param {string|Buffer} image2 - Second image
 * @param {number} [threshold=0.1] - Difference threshold
 * @returns {Promise<DiffResult>}
 */
export async function quickDiff(image1, image2, threshold = 0.1) {
  const diffTool = new VisualDiffTool()
  return await diffTool.compareImages(image1, image2, { threshold })
}

/**
 * Create detailed comparison with report
 * @param {string|Buffer} image1 - First image
 * @param {string|Buffer} image2 - Second image
 * @param {string} outputDir - Output directory for results
 * @param {string} testName - Test name
 * @param {ComparisonOptions} [options] - Comparison options
 * @returns {Promise<Object>}
 */
export async function createDetailedComparison(image1, image2, outputDir, testName, options = {}) {
  const diffTool = new VisualDiffTool()
  
  const result = await diffTool.compareImages(image1, image2, {
    analyzeRegions: true,
    diffMask: true,
    ...options
  })
  
  const files = await diffTool.saveDiffResult(result, testName, outputDir)
  
  // Create side-by-side comparison
  const comparisonBuffer = await diffTool.createComparisonImage(
    image1, 
    image2, 
    result.diffImageBuffer
  )
  
  const comparisonPath = path.join(outputDir, `${testName}-comparison.png`)
  await fs.writeFile(comparisonPath, comparisonBuffer)
  files.comparison = comparisonPath
  
  return { result, files }
}

export default VisualDiffTool