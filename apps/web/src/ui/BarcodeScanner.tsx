import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

// Камере после запуска нужно время на автофокус/экспозицию: первые кадры
// смазаны, и один «удачный» мусорный кадр раньше сразу завершал сканирование.
const WARMUP_MS = 700; // игнорируем детекции, пока картинка стабилизируется
const CONFIRMATIONS = 3; // код принимается после N одинаковых детекций подряд

// Chrome on Android (and thus the Telegram webview) ships a native detector;
// everything else falls back to ZXing. Camera needs HTTPS or localhost.
export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId = 0;
    let zxingControls: { stop: () => void } | null = null;
    let readyAt = Infinity;
    let candidate: { code: string; hits: number } | null = null;

    // Детекция засчитывается только после прогрева камеры и CONFIRMATIONS
    // одинаковых чтений подряд — расфокусированный кадр даёт другой код и
    // сбрасывает счётчик, поэтому мусор не проходит.
    const handleDetection = (code: string) => {
      if (doneRef.current || Date.now() < readyAt) return;
      if (candidate?.code === code) {
        candidate.hits += 1;
      } else {
        candidate = { code, hits: 1 };
      }
      setConfirmingCode(true);
      if (candidate.hits >= CONFIRMATIONS) {
        doneRef.current = true;
        onDetected(code);
      }
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        readyAt = Date.now() + WARMUP_MS;

        const NativeDetector = (window as any).BarcodeDetector;
        if (NativeDetector) {
          const detector = new NativeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
          });
          const tick = async () => {
            if (doneRef.current || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0 && codes[0].rawValue) {
                handleDetection(codes[0].rawValue);
                if (doneRef.current) return;
              }
            } catch {
              // a frame can fail to decode — just try the next one
            }
            rafId = requestAnimationFrame(tick);
          };
          rafId = requestAnimationFrame(tick);
          return;
        }

        // ZXing is only needed where the native detector is missing (iOS/Safari,
        // desktop Firefox) — load it on demand to keep it out of the main bundle
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ]);
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);
        const reader = new BrowserMultiFormatReader(hints);
        zxingControls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result) handleDetection(result.getText());
        });
      } catch (err) {
        const name = (err as Error).name;
        setError(
          name === 'NotAllowedError'
            ? t('barcode.cameraDenied')
            : name === 'NotFoundError'
              ? t('barcode.cameraMissing')
              : t('barcode.cameraFailed'),
        );
      }
    };

    start();

    return () => {
      doneRef.current = true;
      cancelAnimationFrame(rafId);
      zxingControls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onDetected]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(3, 12, 20, 0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            borderRadius: '22px',
            background: '#000',
            display: error ? 'none' : 'block',
            aspectRatio: '3 / 4',
            objectFit: 'cover',
          }}
        />
        {/* aiming frame */}
        {!error && (
          <div
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: '38%',
              height: '24%',
              border: `2px solid ${theme.palette.primary}`,
              borderRadius: '16px',
              boxShadow: '0 0 0 9999px rgba(3, 12, 20, 0.45)',
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {/* бегущий градиент — показывает, что сканер работает и ждёт стабилизации */}
            <style>{`@keyframes barcode-scanline { 0% { top: -12%; } 100% { top: 104%; } }`}</style>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '10%',
                minHeight: '8px',
                background: `linear-gradient(180deg, transparent, ${theme.palette.primary}, transparent)`,
                opacity: 0.75,
                animation: 'barcode-scanline 1.6s ease-in-out infinite alternate',
              }}
            />
          </div>
        )}
        {error && (
          <div
            style={{
              padding: '24px',
              borderRadius: '22px',
              background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
              border: '1px solid rgba(255,120,120,0.35)',
              textAlign: 'center',
              color: '#ff8a8a',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          color: confirmingCode && !error ? theme.palette.primary : theme.palette.textMuted,
          fontSize: '13px',
          marginTop: '14px',
          textAlign: 'center',
        }}
      >
        {error
          ? t('barcode.enterManually')
          : confirmingCode
            ? t('barcode.confirming')
            : `${t('barcode.hint')}. ${t('barcode.stabilizing')}`}
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: '16px',
          height: '48px',
          minWidth: '200px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.08)',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {t('common.cancel')}
      </button>
    </div>
  );
}
