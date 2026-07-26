'use client';
import React from 'react';
import {
  X, RotateCw, Sparkles, Pencil, Undo2, Send, Loader2, Plus, Paperclip,
} from 'lucide-react';
import styles from '../chat.module.css';
import type { PendingMediaItem } from '../../../hooks/useMediaEditor';

interface MediaPreviewModalProps {
  pendingMediaItems: PendingMediaItem[];
  activeMediaIndex: number;
  setActiveMediaIndex: (i: number) => void;
  mediaCaptions: Record<number, string>;
  setMediaCaptions: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  mediaFilters: Record<number, string>;
  setMediaFilters: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  mediaRotations: Record<number, number>;
  setMediaRotations: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  isDrawMode: boolean;
  setIsDrawMode: (v: boolean) => void;
  drawColor: string;
  setDrawColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  showFilterPicker: boolean;
  setShowFilterPicker: (v: boolean) => void;
  sendingMedia: boolean;
  qualityMode: 'standard' | 'hd';
  setQualityMode: React.Dispatch<React.SetStateAction<'standard' | 'hd'>>;
  drawCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  activeThemeColor: string;
  onClose: () => void;
  onSend: () => void;
  onRemoveThumbnail: (idx: number) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  clearDrawing: () => void;
}

export function MediaPreviewModal({
  pendingMediaItems, activeMediaIndex, setActiveMediaIndex,
  mediaCaptions, setMediaCaptions,
  mediaFilters, setMediaFilters,
  mediaRotations, setMediaRotations,
  isDrawMode, setIsDrawMode,
  drawColor, setDrawColor,
  brushSize, setBrushSize,
  showFilterPicker, setShowFilterPicker,
  sendingMedia, qualityMode, setQualityMode,
  drawCanvasRef, activeThemeColor,
  onClose, onSend, onRemoveThumbnail, onFileSelect,
  startDrawing, draw, stopDrawing, clearDrawing,
}: MediaPreviewModalProps) {
  return (
    <div className={styles.mediaPreviewOverlay}>
      {/* Top Bar (Close, Title, Editor Toolbar Tools) */}
      <div className={styles.mediaPreviewHeader}>
        <div className={styles.mediaPreviewHeaderLeft}>
          <button className={styles.mediaPreviewCloseBtn} onClick={onClose} title="Cancel">
            <X size={22} />
          </button>
          <span className={styles.mediaPreviewTitle}>
            {pendingMediaItems[activeMediaIndex]?.file.type.startsWith('image/')
              ? `Image ${activeMediaIndex + 1} of ${pendingMediaItems.length}`
              : 'Document Preview'}
          </span>
        </div>

        {/* Magic Toolbar Tools */}
        {pendingMediaItems[activeMediaIndex]?.file.type.startsWith('image/') && (
          <div className={styles.editorToolbarCenter}>
            <button
              type="button"
              className={styles.editorToolBtn}
              onClick={() => {
                setMediaRotations((prev) => ({
                  ...prev,
                  [activeMediaIndex]: ((prev[activeMediaIndex] || 0) + 90) % 360,
                }));
              }}
              title="Rotate Image 90°"
            >
              <RotateCw size={18} />
            </button>

            <button
              type="button"
              className={showFilterPicker ? styles.editorToolBtnActive : styles.editorToolBtn}
              onClick={() => {
                setShowFilterPicker(!showFilterPicker);
                setIsDrawMode(false);
              }}
              title="Image Filters"
            >
              <Sparkles size={18} />
            </button>

            <button
              type="button"
              className={isDrawMode ? styles.editorToolBtnActive : styles.editorToolBtn}
              onClick={() => {
                setIsDrawMode(!isDrawMode);
                setShowFilterPicker(false);
              }}
              title="Freehand Pencil Draw"
            >
              <Pencil size={18} />
            </button>

            {isDrawMode && (
              <button type="button" className={styles.editorToolBtn} onClick={clearDrawing} title="Clear Drawings">
                <Undo2 size={18} />
              </button>
            )}

            <button
              type="button"
              className={qualityMode === 'hd' ? styles.hdToggleActive : styles.hdToggle}
              onClick={() => setQualityMode((prev) => (prev === 'standard' ? 'hd' : 'standard'))}
              title={
                qualityMode === 'hd'
                  ? 'HD Quality (Original size)'
                  : 'Standard Quality (Compression)'
              }
            >
              <span className={styles.hdBadgeText}>HD</span>
              <span className={styles.hdStatusLabel}>{qualityMode === 'hd' ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Color Swatches Popover */}
      {isDrawMode && (
        <div className={styles.colorBarPopover}>
          {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff', '#000000'].map((col) => (
            <div
              key={col}
              className={drawColor === col ? styles.colorSwatchActive : styles.colorSwatch}
              style={{ backgroundColor: col }}
              onClick={() => setDrawColor(col)}
            />
          ))}
          <div className={styles.popoverDivider} />
          {[3, 6, 12, 20].map((size) => (
            <button
              key={size}
              type="button"
              className={brushSize === size ? styles.brushSizeBtnActive : styles.brushSizeBtn}
              onClick={() => setBrushSize(size)}
              title={`Brush Size: ${size}px`}
            >
              <span
                className={styles.brushSizeDot}
                style={{
                  width: `${Math.max(4, size * 0.7 + 2)}px`,
                  height: `${Math.max(4, size * 0.7 + 2)}px`,
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Filter Selector Popover */}
      {showFilterPicker && (
        <div className={styles.filterBarPopover}>
          {[
            { id: 'none', label: 'Normal' },
            { id: 'grayscale', label: 'B&W' },
            { id: 'sepia', label: 'Vintage' },
            { id: 'warm', label: 'Warm' },
            { id: 'cool', label: 'Cool' },
            { id: 'invert', label: 'Invert' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={
                (mediaFilters[activeMediaIndex] || 'none') === f.id
                  ? styles.filterCardActive
                  : styles.filterCard
              }
              onClick={() => {
                setMediaFilters((prev) => ({ ...prev, [activeMediaIndex]: f.id }));
              }}
            >
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Preview Area */}
      <div className={styles.mediaPreviewBody}>
        {pendingMediaItems[activeMediaIndex]?.file.type.startsWith('image/') ? (
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '90%', maxHeight: '65vh' }}>
            <img
              src={pendingMediaItems[activeMediaIndex]?.previewUrl}
              alt="Media Preview"
              className={styles.mediaPreviewImage}
              style={{
                transform: `rotate(${mediaRotations[activeMediaIndex] || 0}deg)`,
                filter:
                  (mediaFilters[activeMediaIndex] || 'none') === 'grayscale'
                    ? 'grayscale(100%)'
                    : (mediaFilters[activeMediaIndex] || 'none') === 'sepia'
                    ? 'sepia(100%)'
                    : (mediaFilters[activeMediaIndex] || 'none') === 'warm'
                    ? 'sepia(50%) contrast(110%) brightness(105%)'
                    : (mediaFilters[activeMediaIndex] || 'none') === 'cool'
                    ? 'hue-rotate(180deg) saturate(120%)'
                    : (mediaFilters[activeMediaIndex] || 'none') === 'invert'
                    ? 'invert(100%)'
                    : 'none',
                transition: 'transform 0.25s ease, filter 0.25s ease',
              }}
            />
            <canvas
              ref={drawCanvasRef}
              width={640}
              height={480}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                cursor: isDrawMode ? 'crosshair' : 'default',
                pointerEvents: isDrawMode ? 'auto' : 'none',
              }}
            />
          </div>
        ) : (
          <div className={styles.mediaPreviewDocBox}>
            <Paperclip size={48} className={styles.mediaPreviewDocIcon} />
            <span className={styles.mediaPreviewDocName}>{pendingMediaItems[activeMediaIndex]?.file.name}</span>
            <span className={styles.mediaPreviewDocSize}>
              {(pendingMediaItems[activeMediaIndex]?.file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      {/* Footer Column */}
      <div className={styles.mediaPreviewFooterColumn}>
        <div className={styles.mediaPreviewInputWrapper}>
          <input
            type="text"
            placeholder="Add a caption..."
            value={mediaCaptions[activeMediaIndex] || ''}
            onChange={(e) => {
              const val = e.target.value;
              setMediaCaptions((prev) => ({ ...prev, [activeMediaIndex]: val }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className={styles.mediaPreviewInput}
            autoFocus
          />
          <button
            className={styles.mediaPreviewSendBtn}
            onClick={onSend}
            disabled={sendingMedia}
            style={activeThemeColor ? { background: activeThemeColor } : undefined}
            title="Send message"
          >
            {sendingMedia ? <Loader2 className={styles.spinLoader} size={18} /> : <Send size={18} />}
          </button>
        </div>

        {/* Thumbnail Carousel Tray */}
        <div className={styles.thumbnailTray}>
          {pendingMediaItems.map((item, idx) => (
            <div
              key={idx}
              className={idx === activeMediaIndex ? styles.thumbnailItemActive : styles.thumbnailItem}
              onClick={() => {
                setActiveMediaIndex(idx);
                setIsDrawMode(false);
                setShowFilterPicker(false);
              }}
            >
              {item.file.type.startsWith('image/') ? (
                <img src={item.previewUrl} alt={`Thumb ${idx}`} className={styles.thumbnailImage} />
              ) : (
                <Paperclip size={24} style={{ margin: 'auto' }} />
              )}
              <button
                type="button"
                className={styles.thumbnailRemoveBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveThumbnail(idx);
                }}
                title="Remove media"
              >
                ✕
              </button>
            </div>
          ))}
          <label className={styles.thumbnailAddBtn} title="Add more photos or files">
            <Plus size={22} />
            <input
              type="file"
              multiple
              onChange={onFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
