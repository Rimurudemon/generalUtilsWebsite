import React, { useState, useRef } from 'react';

type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp';

const formatOptions: { value: ImageFormat; label: string; mime: string }[] = [
  { value: 'png', label: 'PNG', mime: 'image/png' },
  { value: 'jpeg', label: 'JPEG', mime: 'image/jpeg' },
  { value: 'webp', label: 'WebP', mime: 'image/webp' },
  { value: 'gif', label: 'GIF', mime: 'image/gif' },
  { value: 'bmp', label: 'BMP', mime: 'image/bmp' },
];

export const ImageConverter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(90);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const convertImage = async () => {
    if (!selectedFile) return;
    setIsConverting(true);

    try {
      const img = await createImageBitmap(selectedFile);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      
      // Fill background for formats that don't support transparency
      if (targetFormat === 'jpeg' || targetFormat === 'bmp') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      const format = formatOptions.find(f => f.value === targetFormat)!;
      const qualityValue = (targetFormat === 'jpeg' || targetFormat === 'webp') ? quality / 100 : undefined;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Conversion failed')),
          format.mime,
          qualityValue
        );
      });

      const originalName = selectedFile.name.replace(/\.[^.]+$/, '');
      setResult({
        blob,
        name: `${originalName}.${targetFormat}`
      });
    } catch (error) {
      console.error('Conversion failed:', error);
      alert('Failed to convert image');
    } finally {
      setIsConverting(false);
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

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'Unknown';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Image Converter</h1>
        <p className="page-description">Convert images between PNG, JPEG, WebP, GIF, and BMP formats</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Upload Image</h3>
          
          <div
            className="file-upload"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: 24 }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <>
                <div className="file-upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="file-upload-text">
                  <strong>Click to upload</strong> or drag and drop<br />
                  PNG, JPEG, WebP, GIF, BMP
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {selectedFile && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              <p><strong>Name:</strong> {selectedFile.name}</p>
              <p><strong>Format:</strong> {getFileExtension(selectedFile.name)}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Convert Options</h3>

          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Target Format</label>
            <select
              className="input"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}
            >
              {formatOptions.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
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
          )}

          <button
            className="btn btn-primary"
            onClick={convertImage}
            disabled={!selectedFile || isConverting}
            style={{ width: '100%' }}
          >
            {isConverting ? 'Converting...' : `Convert to ${targetFormat.toUpperCase()}`}
          </button>

          {result && (
            <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ marginBottom: 8, color: 'var(--success)' }}>✓ Conversion complete!</p>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
                New size: {(result.blob.size / 1024).toFixed(2)} KB
              </p>
              <button className="btn btn-primary" onClick={downloadResult} style={{ width: '100%' }}>
                Download {result.name}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Format Info Cards */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
          Supported Formats
        </h3>
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { name: 'PNG', desc: 'Lossless, supports transparency' },
            { name: 'JPEG', desc: 'Lossy compression, small size' },
            { name: 'WebP', desc: 'Modern format, best compression' },
            { name: 'GIF', desc: 'Limited colors, animation support' },
            { name: 'BMP', desc: 'Uncompressed, large file size' },
          ].map(format => (
            <div key={format.name} className="card" style={{ padding: 16 }}>
              <h4 style={{ marginBottom: 4, color: 'var(--accent-primary)' }}>{format.name}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{format.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
