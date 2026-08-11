import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import onboardingGoals from '../assets/09_onboarding/onboarding_1_goals.png';
import onboardingTracking from '../assets/09_onboarding/onboarding_2_tracking.png';
import onboardingWorkouts from '../assets/09_onboarding/onboarding_3_workouts.png';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

const slides = [
  {
    image: onboardingGoals,

    title: t('onboarding.slide1Title'),
    description: t('onboarding.slide1Desc'),
  },
  {
    image: onboardingTracking,

    title: t('onboarding.slide2Title'),
    description: t('onboarding.slide2Desc'),
  },
  {
    image: onboardingWorkouts,

    title: t('onboarding.slide3Title'),
    description: t('onboarding.slide3Desc'),
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
  }, [loading]);

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
        minHeight: '100dvh',
        backgroundColor: theme.palette.bg,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: `calc(${theme.spacing.lg} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      {/* Slides */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
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
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
            }}
          >
            <img 
              src={slide.image} 
              alt={slide.title} 
              style={{ 
                width: 'clamp(140px, 42vw, 200px)', 
                height: 'clamp(140px, 42vw, 200px)', 
                objectFit: 'contain', 
                marginBottom: theme.spacing.sm,
                flexShrink: 0,
              }} 
            />
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
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          flexShrink: 0,
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
      <div
        style={{
          padding: `0 ${theme.spacing.lg} ${theme.spacing.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
          flexShrink: 0,
        }}
      >
        <Button onClick={handleNext} size="lg">
          {currentIndex === slides.length - 1 ? t('onboarding.start') : t('onboarding.next')}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/login')} size="md">
          {t('onboarding.haveAccount')}
        </Button>
      </div>
    </div>
  );
}
