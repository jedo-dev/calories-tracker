import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { IconMic } from '../../ui/navIcons';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';
import { AiFoodConfirm, RecognizedItem } from './AiFoodConfirm';

interface Props {
  date: string;
  time: string;
  mealType: string;
  /** Диплинк /entry/new?mode=voice: сразу начать запись. */
  autoStart?: boolean;
}

// Речь распознаёт браузер (Web Speech API, бесплатно и без загрузки аудио на
// сервер), а текст в КБЖУ превращает нейросеть через /ai/food-text. Аудио
// как файл не отправляем: наш AI-провайдер принимает только текст и картинки.
function getSpeechRecognition(): any {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Кнопка «Надиктовать блюдо»: запись голоса → редактируемый текст →
// распознавание нейросетью → карточки подтверждения (AiFoodConfirm).
// Если браузер не умеет распознавать речь, остаётся ручной ввод текста.
export function VoiceFoodSection({ date, time, mealType, autoStart = false }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<RecognizedItem[] | null>(null);
  // null = квота ещё грузится (кнопку не блокируем, бэк всё равно проверит)
  const [remaining, setRemaining] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  // Финализированные куски речи копим отдельно: в event.results interim-часть
  // постоянно перезаписывается, и без этого текст бы «прыгал» и терялся
  const finalTextRef = useRef('');

  const speechSupported = getSpeechRecognition() !== null;

  useEffect(() => {
    apiClient
      .get('/ai/quota')
      .then((res) => setRemaining(res.data?.remaining ?? null))
      .catch(() => setRemaining(null));
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  const quotaExhausted = remaining !== null && remaining <= 0;

  const stopRecording = () => {
    recognitionRef.current?.stop?.();
    setRecording(false);
  };

  const startRecording = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setInputOpen(true);
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTextRef.current = text ? text.trim() + ' ' : '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript ?? '';
        if (event.results[i].isFinal) {
          finalTextRef.current += chunk + ' ';
        } else {
          interim += chunk;
        }
      }
      setText((finalTextRef.current + interim).trimStart());
    };
    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        showToast(t('aiVoice.micDenied'));
      } else if (event?.error !== 'no-speech' && event?.error !== 'aborted') {
        showToast(t('aiVoice.speechFailed'));
      }
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setInputOpen(true);
      setItems(null);
      setRecording(true);
    } catch {
      // start() бросает, если запись уже идёт — просто игнорируем
    }
  };

  // Диплинк из листа быстрых действий: пробуем начать запись сразу. Если
  // браузер без жеста не даст доступ к микрофону — пользователь нажмёт кнопку.
  useEffect(() => {
    if (autoStart && !quotaExhausted) startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const handleAnalyze = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      showToast(t('aiVoice.emptyText'));
      return;
    }
    if (recording) stopRecording();

    setAnalyzing(true);
    setItems(null);
    try {
      const res = await apiClient.post('/ai/food-text', { text: trimmed.slice(0, 1000) });
      const recognized: RecognizedItem[] = res.data?.items || [];
      if (recognized.length === 0) {
        showToast(t('aiVoice.nothingFound'));
        return;
      }
      setItems(recognized);
      setRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : prev));
    } catch (err: any) {
      if (err.response?.status === 403) {
        setRemaining(0);
        showToast(t('aiPhoto.limitExhausted'));
      } else {
        showToast(err.response?.data?.message || t('aiVoice.failed'));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMainButton = () => {
    if (quotaExhausted) {
      navigate('/ai-limits');
      return;
    }
    if (recording) {
      stopRecording();
      return;
    }
    startRecording();
  };

  const reset = () => {
    setItems(null);
    setText('');
    setInputOpen(false);
    finalTextRef.current = '';
  };

  return (
    <>
      <button
        type="button"
        onClick={handleMainButton}
        disabled={analyzing}
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '16px',
          border: recording
            ? '1px solid rgba(255, 120, 120, 0.5)'
            : '1px solid rgba(160, 200, 220, 0.22)',
          background: recording ? 'rgba(255, 90, 90, 0.12)' : 'rgba(255,255,255,0.06)',
          color: quotaExhausted ? theme.palette.textMuted : recording ? '#ff8a8a' : theme.palette.text,
          fontSize: '15px',
          fontWeight: 700,
          cursor: analyzing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '10px',
          opacity: analyzing ? 0.7 : 1,
        }}
      >
        <IconMic size={20} />
        {recording
          ? t('aiVoice.recording')
          : quotaExhausted
            ? t('aiPhoto.limitButton')
            : speechSupported
              ? t('aiVoice.button')
              : t('aiVoice.buttonNoSpeech')}
        {!recording && !quotaExhausted && remaining !== null && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: theme.palette.textMuted }}>
            · {remaining}
          </span>
        )}
        {recording && (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ff5a5a',
              animation: 'pulse-text 1.2s ease-in-out infinite',
            }}
          />
        )}
      </button>

      {inputOpen && !items && (
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={speechSupported ? t('aiVoice.placeholder') : t('aiVoice.placeholderNoSpeech')}
            rows={3}
            maxLength={1000}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: '14px',
              border: '1px solid rgba(160, 200, 220, 0.18)',
              background: 'rgba(3, 18, 28, 0.5)',
              color: theme.palette.text,
              fontSize: '15px',
              fontFamily: 'inherit',
              lineHeight: 1.4,
              outline: 'none',
              resize: 'vertical',
            }}
          />
          <Text variant="small" muted style={{ display: 'block', margin: '4px 0 8px' }}>
            {t('aiVoice.editHint')}
          </Text>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={reset}
              disabled={analyzing}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '16px',
                border: '1px solid rgba(160, 200, 220, 0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: theme.palette.text,
                fontSize: '15px',
                fontWeight: 700,
                cursor: analyzing ? 'not-allowed' : 'pointer',
                opacity: analyzing ? 0.6 : 1,
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || recording}
              style={{
                flex: 2,
                height: '48px',
                borderRadius: '16px',
                border: `1px solid ${theme.palette.primary}55`,
                background: theme.palette.primary + '1f',
                color: theme.palette.primary,
                fontSize: '15px',
                fontWeight: 700,
                cursor: analyzing ? 'wait' : recording ? 'not-allowed' : 'pointer',
                opacity: analyzing || recording ? 0.6 : 1,
              }}
            >
              {analyzing ? t('aiVoice.analyzing') : t('aiVoice.analyze')}
            </button>
          </div>
        </div>
      )}

      {items && (
        <AiFoodConfirm
          items={items}
          date={date}
          time={time}
          mealType={mealType}
          tagLabel={t('aiVoice.tag')}
          tagIcon={<IconMic size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />}
          onClose={reset}
        />
      )}
    </>
  );
}
