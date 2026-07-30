/* BoxOverlay.jsx — Canvas drawing YOLO bounding boxes on the certificate image */
import { useEffect, useRef } from 'react';

/**
 * Draws normalized bounding boxes on a canvas overlaid on the image.
 * boxes: [{ x, y, width, height, confidence, class }]  (coords 0–1 normalized)
 */
export default function BoxOverlay({ imageSrc, boxes = [], isFake }) {
  const imgRef  = useRef(null);
  const canvasRef = useRef(null);

  const drawBoxes = () => {
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !boxes.length) return;

    const rect = img.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    boxes.forEach((box, i) => {
      const x = box.x * canvas.width;
      const y = box.y * canvas.height;
      const w = box.width  * canvas.width;
      const h = box.height * canvas.height;
      const conf = box.confidence ?? 0;

      // Glow shadow
      ctx.shadowBlur   = 12;
      ctx.shadowColor  = '#ef4444';

      // Box border
      ctx.strokeStyle  = '#ef4444';
      ctx.lineWidth    = 2;
      ctx.strokeRect(x, y, w, h);

      // Corner accents
      const cs = 10;
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 0;
      [
        [[x, y + cs], [x, y], [x + cs, y]],
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

      // Label background
      const label = `Region ${i + 1}  ${conf.toFixed(0)}%`;
      ctx.font     = 'bold 11px Inter, sans-serif';
      const tw     = ctx.measureText(label).width;
      const lh     = 20;
      const lx     = x;
      const ly     = Math.max(0, y - lh - 4);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.beginPath();
      ctx.roundRect(lx, ly, tw + 14, lh, 4);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.fillText(label, lx + 7, ly + 14);
    });
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      drawBoxes();
    } else {
      img.addEventListener('load', drawBoxes);
      return () => img.removeEventListener('load', drawBoxes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, boxes]);

  // Redraw on resize
  useEffect(() => {
    window.addEventListener('resize', drawBoxes);
    return () => window.removeEventListener('resize', drawBoxes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes]);

  return (
    <div className="canvas-wrapper">
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Uploaded certificate"
        id="cert-preview-img"
      />
      <canvas ref={canvasRef} className="box-canvas" id="box-overlay-canvas" />
    </div>
  );
}
