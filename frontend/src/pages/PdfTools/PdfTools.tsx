import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

type PageSize = 'fit' | 'a4' | 'letter' | 'legal';
type Rotation = 0 | 90 | 180 | 270;

interface ImageItem {
  file: File;
  rotation: Rotation;
  pageSize: PageSize;
  url: string;
}

export const PdfTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compress' | 'imageToPdf'>('compress');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setResult(null);
    }
  };

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const newImages: ImageItem[] = imageFiles.map(file => ({
      file,
      rotation: 0,
      pageSize: 'fit' as PageSize,
      url: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
    setResult(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
    if (selectedImageIndex === index) {
      setSelectedImageIndex(null);
    }
  };

  const updateImageSettings = (index: number, updates: Partial<Pick<ImageItem, 'rotation' | 'pageSize'>>) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, ...updates } : img
    ));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveImage(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const compressPdf = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load the PDF using pdf.js for rendering
      const pdfjsLib = await import('pdfjs-dist');
      // Import worker using Vite's ?url query
      // @ts-ignore
      const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc.default;
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      
      // Create a new PDF document
      const newPdfDoc = await PDFDocument.create();
      
      // Calculate scale based on quality (lower quality = lower resolution = smaller file)
      // Quality 100 = scale 2.0 (high res), Quality 10 = scale 0.5 (low res)
      const scale = 0.5 + (quality / 100) * 1.5;
      
      // JPEG quality for image compression (0.0 to 1.0)
      const jpegQuality = quality / 100;
      
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert canvas to JPEG blob with specified quality
        const jpegBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => resolve(blob!),
            'image/jpeg',
            jpegQuality
          );
        });
        
        // Embed the compressed image in the new PDF
        const jpegBytes = await jpegBlob.arrayBuffer();
        const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
        
        // Add page with original dimensions (from the original PDF)
        const originalViewport = page.getViewport({ scale: 1 });
        const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);
        
        // Draw the compressed image to fill the page
        newPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });
      }
      
      // Save the new PDF
      const compressedBytes = await newPdfDoc.save({
        useObjectStreams: true,
      });

      const blob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResult({
        blob,
        name: `compressed_${pdfFile.name}`
      });
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Failed to compress PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const imagesToPdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      // Page size definitions in points (72 points = 1 inch)
      const pageSizes = {
        a4: { width: 595, height: 842 },
        letter: { width: 612, height: 792 },
        legal: { width: 612, height: 1008 }
      };

      for (const imageItem of images) {
        // Create image from file with rotation applied
        const img = await createImageBitmap(imageItem.file);
        
        // Calculate dimensions after rotation
        const isRotated90or270 = imageItem.rotation === 90 || imageItem.rotation === 270;
        const rotatedWidth = isRotated90or270 ? img.height : img.width;
        const rotatedHeight = isRotated90or270 ? img.width : img.height;
        
        // Create canvas with rotation applied
        const canvas = document.createElement('canvas');
        canvas.width = rotatedWidth;
        canvas.height = rotatedHeight;
        const ctx = canvas.getContext('2d')!;
        
        // Apply rotation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((imageItem.rotation * Math.PI) / 180);
        ctx.translate(-img.width / 2, -img.height / 2);
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG for better file size
        const jpegBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9);
        });
        const jpegBytes = await jpegBlob.arrayBuffer();
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

        // Calculate page dimensions based on page size setting
        let pageWidth: number;
        let pageHeight: number;
        let drawX = 0;
        let drawY = 0;
        let drawWidth = embeddedImage.width;
        let drawHeight = embeddedImage.height;

        if (imageItem.pageSize === 'fit') {
          // Use image dimensions as page size
          pageWidth = embeddedImage.width;
          pageHeight = embeddedImage.height;
        } else {
          // Use predefined page size and fit image within
          const targetSize = pageSizes[imageItem.pageSize];
          pageWidth = targetSize.width;
          pageHeight = targetSize.height;
          
          // Scale image to fit within page while maintaining aspect ratio
          const scaleX = pageWidth / embeddedImage.width;
          const scaleY = pageHeight / embeddedImage.height;
          const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
          
          drawWidth = embeddedImage.width * scale;
          drawHeight = embeddedImage.height * scale;
          
          // Center the image on the page
          drawX = (pageWidth - drawWidth) / 2;
          drawY = (pageHeight - drawHeight) / 2;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      setResult({
        blob,
        name: 'images_combined.pdf'
      });
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert images to PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">PDF Tools</h1>
        <p className="page-description">Compress PDFs and convert images to PDF format</p>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button
          className={`tab ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => { setActiveTab('compress'); setResult(null); }}
        >
          PDF Compressor
        </button>
        <button
          className={`tab ${activeTab === 'imageToPdf' ? 'active' : ''}`}
          onClick={() => { setActiveTab('imageToPdf'); setResult(null); }}
        >
          Image to PDF
        </button>
      </div>

      {activeTab === 'compress' && (
        <div className="card">
          <div
            className="file-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="file-upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="file-upload-text">
              <strong>Click to upload</strong> or drag and drop<br />
              PDF files only
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfSelect}
              style={{ display: 'none' }}
            />
          </div>

          {pdfFile && (
            <div style={{ marginTop: 24 }}>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                Selected: <strong style={{ color: 'var(--text-primary)' }}>{pdfFile.name}</strong>
                <span style={{ marginLeft: 8 }}>({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </p>

              <div className="input-group" style={{ marginBottom: 24 }}>
                <label className="input-label">Quality: {quality}%</label>
                <input
                  type="range"
                  className="slider"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={compressPdf}
                disabled={isProcessing}
              >
                {isProcessing ? 'Compressing...' : 'Compress PDF'}
              </button>
            </div>
          )}

          {result && pdfFile && (
            <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ marginBottom: 12, color: 'var(--success)' }}>✓ Compression complete!</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Original</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Compressed</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {(result.blob.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Savings</p>
                  <p style={{ fontSize: 18, fontWeight: 600, color: result.blob.size < pdfFile.size ? 'var(--success)' : 'var(--warning)' }}>
                    {result.blob.size < pdfFile.size 
                      ? `-${(((pdfFile.size - result.blob.size) / pdfFile.size) * 100).toFixed(1)}%`
                      : `+${(((result.blob.size - pdfFile.size) / pdfFile.size) * 100).toFixed(1)}%`
                    }
                  </p>
                </div>
              </div>
              <button className="btn btn-primary" onClick={downloadResult}>
                Download Compressed PDF
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'imageToPdf' && (
        <div className="card">
          <div
            className="file-upload"
            onClick={() => imageInputRef.current?.click()}
          >
            <div className="file-upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="file-upload-text">
              <strong>Click to upload</strong> or drag and drop<br />
              PNG, JPG, WEBP, GIF images
            </p>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesSelect}
              style={{ display: 'none' }}
            />
          </div>

          {images.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {images.length} image(s) selected — <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Drag to reorder, click to edit settings</span>
                </p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { images.forEach(img => URL.revokeObjectURL(img.url)); setImages([]); setSelectedImageIndex(null); }}
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Clear All
                </button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                {images.map((imageItem, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
                    style={{
                      position: 'relative',
                      width: 120,
                      height: 120,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: selectedImageIndex === index 
                        ? '3px solid var(--accent-primary)' 
                        : draggedIndex === index 
                          ? '2px dashed var(--accent-secondary)' 
                          : '1px solid var(--border-subtle)',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transform: selectedImageIndex === index ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: selectedImageIndex === index ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                    }}
                  >
                    <img
                      src={imageItem.url}
                      alt={imageItem.file.name}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transform: `rotate(${imageItem.rotation}deg)`,
                        transition: 'transform 0.3s ease'
                      }}
                      draggable={false}
                    />
                    {/* Page number badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      fontWeight: 600
                    }}>
                      Page {index + 1}
                    </div>
                    {/* Settings indicator */}
                    {(imageItem.rotation !== 0 || imageItem.pageSize !== 'fit') && (
                      <div style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'var(--accent-primary)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 10
                      }}>
                        ⚙
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--error)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Settings Panel for Selected Image */}
              {selectedImageIndex !== null && images[selectedImageIndex] && (
                <div style={{ 
                  padding: 20, 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                  border: '1px solid var(--accent-primary)'
                }}>
                  <h4 style={{ marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      background: 'var(--accent-primary)', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12
                    }}>
                      Page {selectedImageIndex + 1}
                    </span>
                    Settings for: {images[selectedImageIndex].file.name}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Rotation */}
                    <div>
                      <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Rotation</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {([0, 90, 180, 270] as Rotation[]).map((rot) => (
                          <button
                            key={rot}
                            onClick={() => updateImageSettings(selectedImageIndex, { rotation: rot })}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-sm)',
                              border: images[selectedImageIndex].rotation === rot 
                                ? '2px solid var(--accent-primary)' 
                                : '1px solid var(--border-subtle)',
                              background: images[selectedImageIndex].rotation === rot 
                                ? 'var(--accent-primary)' 
                                : 'var(--bg-card)',
                              color: images[selectedImageIndex].rotation === rot 
                                ? 'white' 
                                : 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 500,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {rot}°
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page Size */}
                    <div>
                      <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Page Size</label>
                      <select
                        className="input"
                        value={images[selectedImageIndex].pageSize}
                        onChange={(e) => updateImageSettings(selectedImageIndex, { pageSize: e.target.value as PageSize })}
                        style={{ width: '100%' }}
                      >
                        <option value="fit">Fit to Image</option>
                        <option value="a4">A4 (210 × 297 mm)</option>
                        <option value="letter">Letter (8.5 × 11 in)</option>
                        <option value="legal">Legal (8.5 × 14 in)</option>
                      </select>
                    </div>
                  </div>

                  {/* Apply to all button */}
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const settings = {
                          rotation: images[selectedImageIndex].rotation,
                          pageSize: images[selectedImageIndex].pageSize
                        };
                        setImages(prev => prev.map(img => ({ ...img, ...settings })));
                      }}
                      style={{ fontSize: 13 }}
                    >
                      Apply these settings to all images
                    </button>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={imagesToPdf}
                disabled={isProcessing}
              >
                {isProcessing ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>
          )}

          {result && (
            <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ marginBottom: 12, color: 'var(--success)' }}>✓ Conversion complete!</p>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                Size: {(result.blob.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button className="btn btn-primary" onClick={downloadResult}>
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
