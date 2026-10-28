/* BoxOverlay.jsx — Canvas drawing Deep CNN & CAM detected bounding boxes on the certificate image */
import { useEffect, useRef, useCallback } from 'react';

/**
 * Draws normalized bounding boxes on a canvas overlaid on the image.
 * boxes: [{ x, y, width, height, confidence, class }]  (coords 0–1 normalized)
 *
 * Fixed: uses naturalWidth/naturalHeight for accurate scale, then scales
 * to the displayed size via CSS object-fit.
 */
export default function BoxOverlay({ imageSrc, boxes = [], isFake }) {
  const imgRef    = useRef(null);
  const canvasRef = useRef(null);

  const drawBoxes = useCallback(() => {
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Use the rendered (layout) dimensions, not natural dimensions
    const displayW = img.clientWidth  || img.offsetWidth;
    const displayH = img.clientHeight || img.offsetHeight;

    if (!displayW || !displayH) return;

    canvas.width  = displayW;
    canvas.height = displayH;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, displayW, displayH);

    if (!boxes.length) return;

    boxes.forEach((box, i) => {
      const x = box.x * displayW;
      const y = box.y * displayH;
      const w = box.width  * displayW;
      const h = box.height * displayH;
      const conf = box.confidence ?? 0;

      // Glow shadow
      ctx.shadowBlur  = 14;
      ctx.shadowColor = '#ef4444';

      // Main border
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth   = 2;
      ctx.strokeRect(x, y, w, h);

      // Corner accents
      const cs = Math.min(12, w * 0.15, h * 0.15);
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 0;
      [
        [[x, y + cs],     [x, y],     [x + cs, y]],
        [[x + w - cs, y], [x + w, y], [x + w, y + cs]],
        [[x, y + h - cs], [x, y + h], [x + cs, y + h]],
        [[x + w - cs, y + h], [x + w, y + h], [x + w, y + h - cs]],
      ].forEach(([a, b, c]) => {
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.lineTo(...c);
        ctx.stroke();
      });

      // Filled label background
      const label = `Region ${i + 1}  ${conf.toFixed(0)}%`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const tw = ctx.measureText(label).width;
      const lh = 20;
      const lx = x;
      const ly = Math.max(0, y - lh - 4);

      ctx.shadowBlur  = 6;
      ctx.shadowColor = 'rgba(239,68,68,0.6)';
      ctx.fillStyle   = 'rgba(239,68,68,0.90)';
      ctx.beginPath();
      ctx.roundRect(lx, ly, tw + 14, lh, 4);
      ctx.fill();

      ctx.shadowBlur  = 0;
      ctx.fillStyle   = '#fff';
      ctx.fillText(label, lx + 7, ly + 14);
    });
  }, [boxes]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth) {
      // Image already loaded — slight delay for layout to settle
      const t = setTimeout(drawBoxes, 50);
      return () => clearTimeout(t);
    } else {
      img.addEventListener('load', drawBoxes);
      return () => img.removeEventListener('load', drawBoxes);
    }
  }, [imageSrc, drawBoxes]);

  // Redraw on window resize
  useEffect(() => {
    const onResize = () => drawBoxes();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [drawBoxes]);

  return (
    <div className="canvas-wrapper">
      <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0, maxWidth: '100%' }}>
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Uploaded certificate"
          id="cert-preview-img"
        />
        <canvas ref={canvasRef} className="box-canvas" id="box-overlay-canvas" />
      </div>
    </div>
  );
}
