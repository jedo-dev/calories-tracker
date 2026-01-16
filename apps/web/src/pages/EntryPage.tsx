import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface OnboardingSlide {
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    title: 'Введите свои параметры и цели',
    description: 'Укажите вес, рост и желаемый результат — мы поможем отслеживать прогресс.',
  },
  {
    title: 'Вносите ежедневно свои потребленные калории',
    description: 'Добавляйте продукты и граммовку — калории и БЖУ посчитаются автоматически.',
  },
  {
    title: 'Контролируйте показатели интерактивно',
    description: 'Смотрите прогресс на графиках и соревнуйтесь с друзьями.',
  },
];

export function EntryPage() {

  const navigate = useNavigate();
  const theme = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsloading] = useState(true)

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.BackButton) {
      tg.BackButton.hide();
    }
  }, []);
  useEffect(() => {

    const load = async () => {

      try {
        const data = await apiClient.get('/social/me')
        await navigate('/today')
        setIsloading(false)
      } catch (err) {
        setIsloading(false)
      }
    }
    setTimeout(() => {
      load()
    }, 2000);
  }, []);

  // Синхронизация индекса с реальным скроллом
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
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSlide = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: index * slideWidth,
      behavior: 'smooth',
    });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToSlide(currentIndex + 1);
    } else {
      navigate('/today');
    }
  };

  const handleSkip = () => {
    navigate('/today');
  };

  const handleDotClick = (index: number) => {
    scrollToSlide(index);
  };


  if (isLoading) {
    return <Loader />
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.palette.bg,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Кнопка "Пропустить" */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: theme.spacing.md,
          right: theme.spacing.md,
          zIndex: 10,
          padding: `${theme.spacing.xs} ${theme.spacing.md}`,
          backgroundColor: 'transparent',
          border: 'none',
          color: theme.palette.textMuted,
          fontSize: theme.typography.small.fontSize,
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = theme.palette.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = theme.palette.textMuted;
        }}
      >
        Пропустить
      </button>

      {/* Слайдер */}
      <div
        ref={scrollContainerRef}
        className="onboarding-slider"
        style={{
          flex: 1,
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              minWidth: '100%',
              width: '100%',
              flexShrink: 0,
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.xl,
              paddingTop: '48px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                maxWidth: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: theme.spacing.lg,
              }}
            >
              <Text
                variant="h1"
                style={{
                  marginBottom: theme.spacing.sm,
                  padding: `0 ${theme.spacing.md}`,
                }}
              >
                {slide.title}
              </Text>
              <Text
                variant="body"
                muted
                style={{
                  maxWidth: '400px',
                  padding: `0 ${theme.spacing.md}`,
                  lineHeight: '1.6',
                }}
              >
                {slide.description}
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
        }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            aria-label={`Перейти на экран ${index + 1}`}
            style={{
              width: currentIndex === index ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: currentIndex === index ? theme.palette.primary : theme.palette.border,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Кнопка "Далее" / "Начать" */}
      <div
        style={{
          padding: theme.spacing.lg,
          paddingTop: 0,
          paddingBottom: theme.spacing.xl,
        }}
      >
        <Button onClick={handleNext} size="lg">
          {currentIndex === slides.length - 1 ? 'Начать' : 'Далее'}
        </Button>
      </div>
    </div>
  );
}
