import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export const PdfTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compress' | 'imageToPdf'>('compress');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
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
    setImages(prev => [...prev, ...imageFiles]);
    setResult(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const compressPdf = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Note: pdf-lib doesn't fully support compression, but we can remove unused objects
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      setResult({
        blob,
        name: `compressed_${pdfFile.name}`
      });
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Failed to compress PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const imagesToPdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imageFile of images) {
        const imageBytes = await imageFile.arrayBuffer();
        let image;
        
        if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // Convert other formats to PNG via canvas
          const img = await createImageBitmap(imageFile);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const pngBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(blob => resolve(blob!), 'image/png');
          });
          const pngBytes = await pngBlob.arrayBuffer();
          image = await pdfDoc.embedPng(pngBytes);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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

          {result && (
            <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ marginBottom: 12, color: 'var(--success)' }}>✓ Compression complete!</p>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                Size: {(result.blob.size / 1024 / 1024).toFixed(2)} MB
              </p>
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
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                {images.length} image(s) selected
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                {images.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <img
                      src={URL.createObjectURL(img)}
                      alt={img.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => removeImage(index)}
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
