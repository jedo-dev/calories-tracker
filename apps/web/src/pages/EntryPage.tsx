import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

const slides = [
  {
    emoji: '🎯',
    title: 'Ставь цели',
    description: 'Укажи вес, рост и желаемый результат — мы рассчитаем норму калорий.',
  },
  {
    emoji: '📊',
    title: 'Считай калории',
    description: 'Добавляй продукты — калории и БЖУ посчитаются автоматически.',
  },
  {
    emoji: '🏋️',
    title: 'Тренируйся',
    description: 'Выбирай программы тренировок — мы посчитаем сожжённые калории.',
  },
];

export function EntryPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, loading } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      navigate('/today');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const slideWidth = container.clientWidth;
      const index = Math.round(scrollLeft / slideWidth);
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.clientWidth, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToSlide(currentIndex + 1);
    } else {
      navigate('/login');
    }
  };

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.palette.bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Slides */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              minWidth: '100%',
              flexShrink: 0,
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.xl,
              gap: theme.spacing.lg,
            }}
          >
            <div style={{ fontSize: '72px', marginBottom: theme.spacing.md }}>
              {slide.emoji}
            </div>
            <Text variant="h1" style={{ textAlign: 'center', color: theme.palette.text }}>
              {slide.title}
            </Text>
            <Text
              variant="body"
              style={{
                textAlign: 'center',
                color: theme.palette.textMuted,
                maxWidth: '320px',
                lineHeight: '1.6',
              }}
            >
              {slide.description}
            </Text>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
        }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            style={{
              width: currentIndex === index ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: currentIndex === index ? theme.palette.primary : theme.palette.border,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: theme.spacing.lg, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
        <Button onClick={handleNext} size="lg">
          {currentIndex === slides.length - 1 ? 'Начать' : 'Далее'}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/login')} size="md">
          Уже есть аккаунт? Войти
        </Button>
      </div>
    </div>
  );
}
