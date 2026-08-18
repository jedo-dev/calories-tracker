import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import mascotCelebrate from '../assets/08_mascot/mascot_fox_celebrate_sm.png';
// Машущий маскот: тело и лапа — отдельные слои (нарезаны из mascot_fox_main
// скриптом PIL), лапа вращается CSS-ом вокруг плеча
import foxWaveBody from '../assets/08_mascot/wave/fox_wave_body.png';
import foxWaveArm from '../assets/08_mascot/wave/fox_wave_arm.png';
// Анимированный маскот героя (image-to-video из сгенерированной иллюстрации).
// webm — с настоящим альфа-каналом (фон выбит хромакей-скриптом), mp4 —
// фолбэк с запечённым фоном для Safari, прячется виньеткой
import foxHeroVideo from '../assets/08_mascot/wave/fox_hero.mp4';
import foxHeroAlpha from '../assets/08_mascot/wave/fox_hero_alpha.webm';

// Продажный лендинг на корне сайта. Тексты сознательно не в i18n — это
// маркетинговая страница одной локали, правится целиком (как PrivacyPage).
// Секция отзывов намеренно отсутствует: выдуманные истории убивают доверие —
// добавить её, когда появятся реальные отзывы первых пользователей.

const MARQUEE = [
  '⚖️ Похудеть',
  '💪 Набрать мышцы',
  '📸 Считать калории по фото',
  '🔥 Держать серию',
  '💧 Пить больше воды',
  '⏱ Интервальное голодание',
  '🏃 Бегать с шагомером',
  '🏆 Соревноваться с друзьями',
  '📊 Видеть честный прогресс',
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const heroRef = useRef<HTMLElement | null>(null);
  // Видео-маскот: при reduced-motion или ошибке загрузки — статичный
  // послойный лис (тело + машущая лапа)
  const [useVideo, setUseVideo] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Прозрачный VP9-webm умеют Chromium и Firefox; Safari декодирует VP9 без
  // альфы (получил бы синий прямоугольник) — ему отдаём mp4 с виньеткой
  const [alphaOk] = useState(() => {
    const probe = document.createElement('video');
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    return !isSafari && probe.canPlayType('video/webm; codecs="vp9"') !== '';
  });

  useEffect(() => {
    if (!loading && user) navigate('/today');
  }, [user, loading, navigate]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Reveal при скролле ──
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('lp-in');
            observer.unobserve(e.target);
            // Инлайновые задержки каскада надо снять после проигрыша —
            // иначе они навсегда тормозят hover-переходы карточек
            if (e.target.classList.contains('lp-stagger')) {
              window.setTimeout(() => {
                [...e.target.children].forEach((c) => {
                  (c as HTMLElement).style.transitionDelay = '';
                });
              }, 1300);
            }
          }
        }
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll('.lp-reveal, .lp-stagger').forEach((el) => observer.observe(el));
    document.querySelectorAll<HTMLElement>('.lp-stagger').forEach((parent) => {
      [...parent.children].forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
      });
    });

    // ── Счётчики: в разметке сразу финальные значения (скринридеры и
    // краулеры видят правду), «добегание» — только прогрессив-энхансмент ──
    const counterObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          counterObserver.unobserve(e.target);
          const el = e.target as HTMLElement;
          const target = Number(el.dataset.count || 0);
          const suffix = el.dataset.suffix || '';
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / 1200);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.6 },
    );
    if (!reducedMotion) {
      document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));
    }

    // ── Параллакс героя за курсором: только устройства с мышью,
    // запись переменных не чаще кадра (rAF-троттлинг) ──
    const hero = heroRef.current;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    let rafId = 0;
    let lastX = 0;
    let lastY = 0;
    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        hero?.style.setProperty('--px', String(lastX / window.innerWidth - 0.5));
        hero?.style.setProperty('--py', String(lastY / window.innerHeight - 0.5));
      });
    };
    if (finePointer && !reducedMotion) {
      window.addEventListener('mousemove', onMove, { passive: true });
    }

    // ── Свечение карточек за курсором ──
    const onCardMove = (e: Event) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const me = e as MouseEvent;
      card.style.setProperty('--mx', `${me.clientX - rect.left}px`);
      card.style.setProperty('--my', `${me.clientY - rect.top}px`);
    };
    const cards = document.querySelectorAll<HTMLElement>('.lp-glow');
    cards.forEach((c) => c.addEventListener('mousemove', onCardMove));

    return () => {
      observer.disconnect();
      counterObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      cards.forEach((c) => c.removeEventListener('mousemove', onCardMove));
    };
  }, []);

  return (
    <div className="lp">
      <style>{LP_STYLES}</style>

      {/* ── Шапка-таблетка ── */}
      <header className="lp-header">
        <div className="lp-pill">
          <span className="lp-logo">
            Flareon<span>Fit</span>
          </span>
          <nav className="lp-nav">
            <a href="#features">Функции</a>
            <a href="#app">Приложение</a>
            <div className="lp-dd">
              {/* Кнопка, а не ссылка: тап/Enter не должны уводить со страницы,
                  меню открывается и по фокусу (клавиатура, тач) */}
              <button type="button" aria-haspopup="true">
                Калькуляторы <span className="lp-dd-caret">▾</span>
              </button>
              <div className="lp-dd-menu">
                <Link to="/register">🔥 Норма калорий</Link>
                <Link to="/register">⚖️ Индекс массы тела</Link>
                <Link to="/register">💧 Норма воды</Link>
                <span className="lp-dd-note">Считаются в приложении — бесплатно</span>
              </div>
            </div>
          </nav>
          <div className="lp-header-cta">
            <Link to="/login" className="lp-btn-ghost">
              Войти
            </Link>
            <Link to="/register" className="lp-btn lp-btn-sm">
              Попробовать
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero: аврора, гигантский градиентный заголовок, маскот и парящие карточки ── */}
      <section className="lp-hero" ref={heroRef}>
        <div className="lp-aurora" aria-hidden>
          <span className="lp-blob lp-blob-1" />
          <span className="lp-blob lp-blob-2" />
          <span className="lp-blob lp-blob-3" />
        </div>

        <div className="lp-container lp-hero-center">
          <div className="lp-badge">🦊 Бесплатный AI-трекер питания</div>
          <h1>
            Ешь. Фоткай.
            <br />
            <span className="lp-grad">Становись лучше.</span>
          </h1>
          <p className="lp-hero-sub">
            Сфотографируй тарелку — ИИ посчитает калории за 5 секунд. Стрики, лига друзей
            и лис, который не даст бросить.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register" className="lp-btn lp-btn-lg lp-btn-pulse">
              Начать бесплатно
            </Link>
            <a href="#app" className="lp-btn-outline">
              Как это работает ↓
            </a>
          </div>
          <div className="lp-hero-note">Без карты · Регистрация за минуту</div>
        </div>

        <div className="lp-scene">
          <div className="lp-scene-ring" aria-hidden />
          {useVideo ? (
            <div className="lp-mascot lp-mascot--video lp-float">
              <video
                className={alphaOk ? 'lp-hero-video lp-hero-video--alpha' : 'lp-hero-video'}
                src={alphaOk ? foxHeroAlpha : foxHeroVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Лис FlareonFit фотографирует салат на телефон"
                onError={() => setUseVideo(false)}
              />
            </div>
          ) : (
            <div className="lp-mascot lp-float">
              <img src={foxWaveBody} alt="Лис FlareonFit приветственно машет лапой" width={680} height={680} decoding="async" />
              <img className="lp-wave-arm" src={foxWaveArm} alt="" width={680} height={680} decoding="async" />
            </div>
          )}

          {/* Парящие карточки с параллаксом за курсором */}
          <div className="lp-chip lp-chip-1 lp-float-a" aria-hidden>
            <b>🔥 21 день</b>
            <i>серия не прерывалась</i>
          </div>
          <div className="lp-chip lp-chip-2 lp-float-b" aria-hidden>
            <b>📸 Салат Цезарь</b>
            <i>420 ккал · распознано ИИ</i>
          </div>
          <div className="lp-chip lp-chip-3 lp-float-c" aria-hidden>
            <b>⚡ +10 XP</b>
            <i>дневник заполнен</i>
          </div>
          <div className="lp-chip lp-chip-4 lp-float-b" aria-hidden>
            <b>🥇 #1 в лиге</b>
            <i>среди друзей</i>
          </div>
        </div>
      </section>

      {/* ── Бегущая строка целей ── */}
      <div className="lp-marquee" aria-hidden>
        <div className="lp-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="lp-marquee-chip">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Приложение: 3D-телефон + тезисы ── */}
      <section className="lp-app" id="app">
        <div className="lp-container lp-app-in">
          <div className="lp-phone-wrap lp-reveal">
            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lp-phone-screen">
                <div className="lp-ps-header">
                  <span>Сегодня</span>
                  <span className="lp-ps-streak">🔥 21</span>
                </div>
                <div className="lp-ring">
                  <span>75%</span>
                </div>
                <div className="lp-ps-kcal">1 802 / 2 402 ккал</div>
                <div className="lp-macro">
                  <div className="lp-macro-row">
                    <span>Белки</span>
                    <div className="lp-macro-bar">
                      <i style={{ width: '72%', background: '#6FB5FF' }} />
                    </div>
                  </div>
                  <div className="lp-macro-row">
                    <span>Жиры</span>
                    <div className="lp-macro-bar">
                      <i style={{ width: '54%', background: '#FFD666' }} />
                    </div>
                  </div>
                  <div className="lp-macro-row">
                    <span>Углеводы</span>
                    <div className="lp-macro-bar">
                      <i style={{ width: '63%', background: '#7BD98A' }} />
                    </div>
                  </div>
                </div>
                <div className="lp-ps-meal">
                  <span>🥗 Салат Цезарь</span>
                  <b>420</b>
                </div>
                <div className="lp-ps-meal">
                  <span>🍎 Яблоко</span>
                  <b>77</b>
                </div>
                <div className="lp-ps-meal lp-ps-scan">
                  <span>📸 Распознать фото…</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-app-text">
            <h2 className="lp-reveal">
              Дневник, который <span className="lp-grad">ведёт себя сам</span>
            </h2>
            <div className="lp-app-points lp-stagger">
              <div className="lp-point">
                <span className="lp-point-icon">📸</span>
                <div>
                  <b>Фото вместо поиска</b>
                  <p>ИИ распознаёт блюдо и считает КБЖУ. Штрихкод и ручной поиск — тоже на месте.</p>
                </div>
              </div>
              <div className="lp-point">
                <span className="lp-point-icon">🔥</span>
                <div>
                  <b>Стрики с фризами</b>
                  <p>Пропустил день — фриз спасёт серию автоматически. Сгоревший стрик можно вернуть.</p>
                </div>
              </div>
              <div className="lp-point">
                <span className="lp-point-icon">🏆</span>
                <div>
                  <b>Лига друзей</b>
                  <p>XP за каждую запись, недельный лидерборд и достижения — худеть веселее вместе.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Бенто-сетка функций ── */}
      <section className="lp-bento-sec" id="features">
        <div className="lp-container">
          <h2 className="lp-reveal">
            Всё для цели — <span className="lp-grad">в одном месте</span>
          </h2>
          <div className="lp-bento lp-stagger">
            <div className="lp-card lp-glow lp-card-wide">
              <div className="lp-scan">
                <span className="lp-scan-corner tl" />
                <span className="lp-scan-corner tr" />
                <span className="lp-scan-corner bl" />
                <span className="lp-scan-corner br" />
                <span className="lp-scan-emoji">🍝</span>
                <span className="lp-scan-line" />
              </div>
              <h3>AI-распознавание еды</h3>
              <p>
                Паста карбонара? 540 ккал, Б 21 / Ж 24 / У 52. Фотография — и запись в дневнике.
                10 распознаваний в месяц бесплатно, с Plus — 300 в месяц.
              </p>
            </div>
            <div className="lp-card lp-glow">
              <div className="lp-card-icon">⏱</div>
              <h3>Голодание</h3>
              <p>Таймер и протоколы 12/12 – 20/4. XP за завершённый фаст.</p>
            </div>
            <div className="lp-card lp-glow">
              <div className="lp-card-icon">🏃</div>
              <h3>Беговой режим</h3>
              <p>Шагомер прямо в телефоне: шаги, дистанция, каденс, калории.</p>
            </div>
            <div className="lp-card lp-glow">
              <div className="lp-card-icon">🍲</div>
              <h3>Рецепты и планы</h3>
              <p>Свои рецепты, рецепты сообщества и план питания под калораж.</p>
            </div>
            <div className="lp-card lp-glow">
              <div className="lp-card-icon">💧</div>
              <h3>Вода и вес</h3>
              <p>Норма воды от веса, графики динамики и «дни в цели».</p>
            </div>
            <div className="lp-card lp-glow lp-card-wide">
              <div className="lp-card-icon">📊</div>
              <h3>Честная статистика</h3>
              <p>
                Вес со сглаживанием, БЖУ по дням, вода, «дни в цели» — видно не только среднее,
                но и качество каждой недели. Без платной стены перед твоими же данными.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Полоса счётчиков ── */}
      <section className="lp-band">
        <div className="lp-container lp-band-in">
          <div>
            <div className="lp-band-num" data-count="10" data-suffix="+">
              10+
            </div>
            <div className="lp-band-cap">модулей — от воды до фастинга</div>
          </div>
          <div>
            <div className="lp-band-num" data-count="5" data-suffix=" сек">
              5 сек
            </div>
            <div className="lp-band-cap">на запись обеда по фото</div>
          </div>
          <div>
            <div className="lp-band-num" data-count="300" data-suffix="">
              300
            </div>
            <div className="lp-band-cap">AI-распознаваний в месяц с Plus</div>
          </div>
          <div>
            <div className="lp-band-num" data-count="0" data-suffix=" ₽">
              0 ₽
            </div>
            <div className="lp-band-cap">за все основные функции</div>
          </div>
        </div>
      </section>

      {/* ── Финальный CTA ── */}
      <section className="lp-final">
        <div className="lp-container lp-final-in lp-stagger">
          <img src={mascotCelebrate} alt="" width={1024} height={1024} loading="lazy" decoding="async" />
          <h2>
            Первая запись — <span className="lp-grad">сегодня вечером</span>
          </h2>
          <Link to="/register" className="lp-btn lp-btn-lg lp-btn-pulse">
            Начать бесплатно
          </Link>
          <div className="lp-hero-note">Дневник, тренировки и лига — бесплатно навсегда</div>
        </div>
      </section>

      {/* ── Футер ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-in">
          <span className="lp-logo">
            Flareon<span>Fit</span>
          </span>
          <nav>
            {/* Якоря дублируются здесь: на мобильных навигация шапки скрыта */}
            <a href="#features">Функции</a>
            <a href="#app">Приложение</a>
            <Link to="/privacy">Политика конфиденциальности</Link>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </nav>
          <div className="lp-footer-copy">© {new Date().getFullYear()} FlareonFit</div>
        </div>
      </footer>
    </div>
  );
}

// Стили лендинга: page-scoped классы lp-* (длинная десктопная страница,
// инлайновые объекты неудобны)
const LP_STYLES = `
html{scroll-behavior:smooth}
/* Якорные секции не должны нырять под липкую шапку */
#features,#app{scroll-margin-top:96px}
.lp a:focus-visible,.lp button:focus-visible{outline:2px solid #7BD98A;outline-offset:3px;border-radius:12px}
.lp{--green:#4CB558;--green-l:#7BD98A;--blue:#8FD8FF;--cream:#FDECDC;--muted:#A9BFD0;--dim:#7D93A6;
  background:#060d16;color:var(--cream);font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;min-height:100vh;overflow-x:hidden}
.lp *{box-sizing:border-box}
.lp h1,.lp h2,.lp h3{margin:0;letter-spacing:-.02em}
.lp p{margin:0}
.lp a{text-decoration:none}
.lp-container{max-width:1140px;margin:0 auto;padding:0 20px}
.lp h2{font-size:44px;font-weight:800;text-align:center}
.lp-grad{background:linear-gradient(90deg,var(--green-l),var(--green) 45%,var(--blue));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  background-size:200% 100%;animation:lpShimmer 6s ease-in-out infinite}
@keyframes lpShimmer{0%,100%{background-position:0% 0}50%{background-position:100% 0}}

/* Reveal + каскад */
.lp-reveal{opacity:0;transform:translateY(30px);transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
.lp-reveal.lp-in{opacity:1;transform:none}
.lp-stagger > *{opacity:0;transform:translateY(30px);transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
.lp-stagger.lp-in > *{opacity:1;transform:none}

/* Кнопки */
/* Ховер-подъём через независимые translate/scale: не конфликтует с
   transform/transition каскадного появления (.lp-stagger > *) */
.lp-btn{display:inline-block;background:linear-gradient(135deg,var(--green-l),var(--green));color:#06210C;font-weight:800;border-radius:16px;text-align:center;
  transition:translate .15s,scale .15s,box-shadow .15s,opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1);
  box-shadow:0 10px 30px rgba(76,181,88,.35)}
.lp-btn:hover{translate:0 -2px;scale:1.02;box-shadow:0 16px 40px rgba(76,181,88,.5)}
.lp-btn-lg{padding:18px 46px;font-size:17px}
.lp-btn-sm{padding:10px 18px;font-size:14px}
.lp-btn-pulse{position:relative}
.lp-btn-pulse::after{content:'';position:absolute;inset:-3px;border-radius:19px;border:2px solid rgba(123,217,138,.5);
  animation:lpPulse 2.2s ease-out infinite}
@keyframes lpPulse{0%{opacity:1;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.12)}}
.lp-btn-ghost{color:var(--cream);font-weight:600;font-size:14px;padding:10px 14px;border-radius:12px}
.lp-btn-ghost:hover{background:rgba(160,200,220,.1)}
.lp-btn-outline{display:inline-block;padding:17px 32px;font-size:16px;font-weight:700;color:var(--cream);
  border:1px solid rgba(160,200,220,.3);border-radius:16px;transition:border-color .15s,background .15s}
.lp-btn-outline:hover{border-color:rgba(160,200,220,.6);background:rgba(160,200,220,.06)}

/* Шапка */
.lp-header{position:sticky;top:14px;z-index:50;display:flex;justify-content:center;padding:0 16px}
.lp-pill{position:relative;display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;max-width:1080px;height:66px;padding:0 12px 0 24px;
  background:rgba(10,24,38,.96);border:1px solid rgba(160,200,220,.16);
  border-radius:999px;box-shadow:0 18px 44px rgba(0,0,0,.4)}
/* backdrop-blur на sticky-элементе дорог при скролле — оставляем только десктопу */
@media (min-width:961px){.lp-pill{background:rgba(10,24,38,.85);backdrop-filter:blur(14px)}}
.lp-logo{font-size:20px;font-weight:800;color:var(--cream);white-space:nowrap}
.lp-logo span{color:var(--green)}
.lp-nav{display:flex;gap:4px;align-items:center;position:absolute;left:50%;transform:translateX(-50%)}
.lp-nav > a,.lp-dd > button{display:inline-block;color:#CBD9E4;font-size:15px;font-weight:700;padding:11px 18px;
  border-radius:999px;border:1px solid transparent;transition:border-color .12s,background .12s,color .12s;
  background:none;cursor:pointer;font-family:inherit}
.lp-nav > a:hover,.lp-dd:hover > button,.lp-dd:focus-within > button{color:var(--cream);border-color:rgba(160,200,220,.35);background:rgba(160,200,220,.08)}
.lp-dd{position:relative}
.lp-dd-caret{font-size:11px;opacity:.7;margin-left:2px}
.lp-dd::after{content:'';position:absolute;left:0;right:0;top:100%;height:12px}
.lp-dd-menu{display:none;position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%);
  min-width:240px;padding:8px;background:rgba(10,24,38,.98);border:1px solid rgba(160,200,220,.2);
  border-radius:18px;box-shadow:0 22px 44px rgba(0,0,0,.5)}
/* focus-within: меню доступно с клавиатуры (Tab) и открывается тапом по кнопке */
.lp-dd:hover .lp-dd-menu,.lp-dd:focus-within .lp-dd-menu{display:block;animation:lpDdIn .18s ease-out}
.lp-dd-note{display:block;padding:9px 14px 5px;font-size:11.5px;color:var(--dim);border-top:1px solid rgba(160,200,220,.12);margin-top:4px}
@keyframes lpDdIn{from{opacity:0;transform:translate(-50%,-6px)}to{opacity:1;transform:translate(-50%,0)}}
.lp-dd-menu a{display:block;color:#CBD9E4;font-size:14px;font-weight:600;padding:11px 14px;border-radius:12px}
.lp-dd-menu a:hover{background:rgba(160,200,220,.1);color:var(--cream)}
.lp-header-cta{display:flex;align-items:center;gap:6px;white-space:nowrap}

/* Hero */
.lp-hero{position:relative;padding:84px 0 0;--px:0;--py:0}
.lp-aurora{position:absolute;inset:0;overflow:hidden;pointer-events:none}
/* «Пре-размытый» radial-gradient вместо filter:blur — визуально то же мягкое
   пятно, но без пере-размытия слоя на каждом кадре анимации (GPU) */
.lp-blob{position:absolute;border-radius:50%;opacity:.55}
.lp-blob-1{width:900px;height:900px;background:radial-gradient(circle,rgba(29,122,60,.5) 0%,rgba(29,122,60,.18) 40%,transparent 68%);left:-300px;top:-300px;animation:lpDrift1 16s ease-in-out infinite}
.lp-blob-2{width:800px;height:800px;background:radial-gradient(circle,rgba(18,75,120,.5) 0%,rgba(18,75,120,.18) 40%,transparent 68%);right:-280px;top:-100px;animation:lpDrift2 19s ease-in-out infinite}
.lp-blob-3{width:700px;height:700px;background:radial-gradient(circle,rgba(122,61,18,.4) 0%,rgba(122,61,18,.14) 40%,transparent 68%);left:28%;top:300px;opacity:.4;animation:lpDrift3 22s ease-in-out infinite}
@keyframes lpDrift1{0%,100%{transform:translate(0,0)}50%{transform:translate(90px,60px)}}
@keyframes lpDrift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-70px,90px)}}
@keyframes lpDrift3{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,-70px)}}

.lp-hero-center{position:relative;z-index:2;text-align:center;display:flex;flex-direction:column;align-items:center}
.lp-badge{font-size:13px;font-weight:700;color:var(--green-l);background:rgba(76,181,88,.12);
  border:1px solid rgba(76,181,88,.35);border-radius:999px;padding:8px 16px;margin-bottom:24px;
  animation:lpHeroIn .7s both}
.lp-hero-center h1{font-size:76px;line-height:1.04;font-weight:800;animation:lpHeroIn .7s .08s both}
.lp-hero-sub{margin:24px 0 34px;font-size:19px;line-height:1.6;color:var(--muted);max-width:560px;animation:lpHeroIn .7s .16s both}
.lp-hero-actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:center;animation:lpHeroIn .7s .24s both}
.lp-hero-note{margin-top:16px;font-size:13px;color:var(--dim);animation:lpHeroIn .7s .3s both}
@keyframes lpHeroIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}

/* Сцена с маскотом и парящими карточками */
.lp-scene{position:relative;z-index:2;height:480px;margin-top:26px}
.lp-scene-ring{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);width:520px;height:520px;border-radius:50%;
  background:radial-gradient(circle,rgba(76,181,88,.18) 0%,rgba(76,181,88,.05) 45%,transparent 70%);
  border:1px solid rgba(123,217,138,.14)}
.lp-mascot{position:absolute;left:50%;bottom:0;transform:translateX(calc(-50% + var(--px,0)*14px));width:min(340px,60vw)}
.lp-mascot img{display:block;width:100%;height:auto;filter:drop-shadow(0 30px 60px rgba(0,0,0,.5))}
/* Видео-маскот: кадр шире тайтово обрезанного PNG + мягкая радиальная маска,
   растворяющая запечённый фон ролика в ауре страницы */
.lp-mascot--video{width:min(430px,78vw)}
.lp-hero-video{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;
  -webkit-mask-image:radial-gradient(ellipse 72% 72% at 50% 50%,#000 58%,transparent 94%);
  mask-image:radial-gradient(ellipse 72% 72% at 50% 50%,#000 58%,transparent 94%)}
/* С альфа-каналом виньетка не нужна, а тень по контуру наконец работает */
.lp-hero-video--alpha{-webkit-mask-image:none;mask-image:none;
  filter:drop-shadow(0 30px 60px rgba(0,0,0,.5))}
.lp-wave-arm{position:absolute;inset:0;transform-origin:38.1% 48.8%;animation:lpWave 4.6s ease-in-out .9s infinite}
@keyframes lpWave{0%{transform:rotate(0)}7%{transform:rotate(-9deg)}14%{transform:rotate(-3deg)}21%{transform:rotate(-8deg)}30%{transform:rotate(0)}100%{transform:rotate(0)}}
/* Покачивание через независимое свойство translate: композитор, не layout,
   и не конфликтует с transform (занят параллаксом) */
.lp-float{animation:lpFloat 5s ease-in-out infinite}
@keyframes lpFloat{0%,100%{translate:0 0}50%{translate:0 -12px}}

.lp-chip{position:absolute;background:rgba(13,34,49,.94);
  border:1px solid rgba(160,200,220,.22);border-radius:16px;padding:12px 16px;
  box-shadow:0 16px 36px rgba(0,0,0,.4);white-space:nowrap}
.lp-chip b{display:block;font-size:15px;color:var(--cream)}
.lp-chip i{display:block;font-style:normal;font-size:12px;color:var(--dim);margin-top:2px}
/* Позиции статичные, параллакс — через translate (композитор, не reflow) */
.lp-chip-1{left:14%;top:40px;translate:calc(var(--px,0)*-30px) calc(var(--py,0)*-20px)}
.lp-chip-2{right:12%;top:80px;translate:calc(var(--px,0)*30px) calc(var(--py,0)*-26px)}
.lp-chip-3{left:20%;bottom:90px;translate:calc(var(--px,0)*-40px) calc(var(--py,0)*24px)}
.lp-chip-4{right:17%;bottom:60px;translate:calc(var(--px,0)*40px) calc(var(--py,0)*30px)}
.lp-float-a{animation:lpBob 4.2s ease-in-out infinite}
.lp-float-b{animation:lpBob 5.1s ease-in-out .6s infinite}
.lp-float-c{animation:lpBob 4.7s ease-in-out 1.1s infinite}
@keyframes lpBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

/* Бегущая строка */
.lp-marquee{overflow:hidden;border-top:1px solid rgba(160,200,220,.1);border-bottom:1px solid rgba(160,200,220,.1);
  padding:16px 0;background:rgba(10,24,38,.5)}
.lp-marquee-track{display:flex;gap:12px;width:max-content;animation:lpMarquee 30s linear infinite}
.lp-marquee:hover .lp-marquee-track{animation-play-state:paused}
@keyframes lpMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.lp-marquee-chip{flex:none;background:rgba(160,200,220,.07);border:1px solid rgba(160,200,220,.16);
  border-radius:999px;padding:10px 18px;font-size:14px;font-weight:600;color:#CBD9E4}

/* Секция приложения: 3D-телефон */
.lp-app{padding:96px 0}
.lp-app-in{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
.lp-phone-wrap{display:flex;justify-content:center;perspective:1200px}
.lp-phone{width:290px;border-radius:40px;padding:12px;background:linear-gradient(160deg,#1a3850,#0b1d2c);
  border:1px solid rgba(160,200,220,.25);box-shadow:0 40px 80px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.08);
  transform:rotateY(-14deg) rotateX(4deg);transition:transform .5s ease}
.lp-phone:hover{transform:rotateY(-4deg) rotateX(1deg)}
.lp-phone-notch{width:110px;height:22px;background:#060d16;border-radius:0 0 14px 14px;margin:0 auto 8px}
.lp-phone-screen{background:#0A1929;border-radius:28px;padding:16px 14px 20px;display:flex;flex-direction:column;align-items:center;gap:10px}
.lp-ps-header{display:flex;justify-content:space-between;width:100%;font-size:15px;font-weight:800}
.lp-ps-streak{color:#FFB84D}
.lp-ps-kcal{font-size:12px;color:var(--dim)}
.lp-ps-meal{display:flex;justify-content:space-between;width:100%;background:rgba(160,200,220,.07);
  border:1px solid rgba(160,200,220,.12);border-radius:12px;padding:10px 12px;font-size:13px}
.lp-ps-meal b{color:var(--green-l)}
.lp-ps-scan{justify-content:center;color:var(--blue);border-style:dashed}
.lp-ring{width:104px;height:104px;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(var(--green) 0 270deg,rgba(160,200,220,.14) 270deg 360deg)}
.lp-ring span{width:78px;height:78px;border-radius:50%;background:#0A1929;display:grid;place-items:center;font-size:19px;font-weight:800}
.lp-macro{width:100%;display:flex;flex-direction:column;gap:8px}
.lp-macro-row{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted)}
.lp-macro-row span{flex:0 0 62px;text-align:left}
.lp-macro-bar{flex:1;height:7px;border-radius:4px;background:rgba(160,200,220,.13);overflow:hidden}
.lp-macro-bar i{display:block;height:100%;border-radius:4px}

.lp-app-text h2{text-align:left;margin-bottom:30px}
.lp-app-points{display:flex;flex-direction:column;gap:22px}
.lp-point{display:flex;gap:16px;align-items:flex-start}
.lp-point-icon{flex:0 0 48px;height:48px;display:grid;place-items:center;font-size:24px;
  background:rgba(76,181,88,.1);border:1px solid rgba(76,181,88,.3);border-radius:14px}
.lp-point b{font-size:17px}
.lp-point p{margin-top:4px;font-size:14.5px;line-height:1.55;color:var(--muted)}

/* Бенто */
.lp-bento-sec{padding:40px 0 90px}
.lp-bento{margin-top:40px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.lp-card{position:relative;background:linear-gradient(180deg,rgba(16,42,62,.9),rgba(10,28,44,.9));
  border:1px solid rgba(160,200,220,.14);border-radius:24px;padding:26px;overflow:hidden;
  transition:translate .25s,border-color .25s,opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
.lp-card:hover{translate:0 -4px;border-color:rgba(123,217,138,.35)}
.lp-card-wide{grid-column:span 2}
.lp-card h3{font-size:19px;margin:14px 0 8px}
.lp-card p{font-size:14px;line-height:1.6;color:var(--muted)}
.lp-card-icon{font-size:34px}
/* Свечение за курсором */
.lp-glow::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .3s;pointer-events:none;
  background:radial-gradient(360px circle at var(--mx,50%) var(--my,50%),rgba(123,217,138,.14),transparent 55%)}
.lp-glow:hover::before{opacity:1}

.lp-scan{position:relative;width:120px;height:100px;display:grid;place-items:center}
.lp-scan-emoji{font-size:50px}
.lp-scan-corner{position:absolute;width:20px;height:20px;border:3px solid var(--green)}
.lp-scan-corner.tl{top:0;left:0;border-right:none;border-bottom:none;border-radius:6px 0 0 0}
.lp-scan-corner.tr{top:0;right:0;border-left:none;border-bottom:none;border-radius:0 6px 0 0}
.lp-scan-corner.bl{bottom:0;left:0;border-right:none;border-top:none;border-radius:0 0 0 6px}
.lp-scan-corner.br{bottom:0;right:0;border-left:none;border-top:none;border-radius:0 0 6px 0}
.lp-scan-line{position:absolute;left:8px;right:8px;height:2px;background:rgba(123,217,138,.9);animation:lpScan 2.2s ease-in-out infinite}
@keyframes lpScan{0%,100%{top:12px}50%{top:calc(100% - 12px)}}

/* Полоса счётчиков */
.lp-band{background:linear-gradient(135deg,#3fa04f,#57c968);color:#06210C;padding:44px 0}
.lp-band-in{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center}
.lp-band-num{font-size:46px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
.lp-band-cap{margin-top:8px;font-size:13.5px;font-weight:700}

/* Финал */
.lp-final{padding:100px 0;position:relative;text-align:center;background:
  radial-gradient(circle at 50% 20%,rgba(76,181,88,.14),transparent 50%)}
.lp-final-in{display:flex;flex-direction:column;align-items:center;gap:24px}
.lp-final img{width:190px;height:auto;filter:drop-shadow(0 20px 40px rgba(0,0,0,.4))}
.lp-final h2{font-size:46px;max-width:700px}

/* Футер */
.lp-footer{border-top:1px solid rgba(160,200,220,.1);padding:32px 0}
.lp-footer-in{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.lp-footer nav{display:flex;gap:10px;flex-wrap:wrap}
/* padding + отрицательный margin: tap-target ≥24px без изменения плотности */
.lp-footer nav a{color:var(--dim);font-size:13px;padding:10px 6px;margin:-10px -2px;display:inline-block}
.lp-footer nav a:hover{color:var(--cream)}
.lp-footer-copy{margin-left:auto;color:var(--dim);font-size:13px}

@media (max-width:960px){
  .lp h2{font-size:32px}
  .lp-hero-center h1{font-size:42px}
  .lp-scene{height:400px}
  .lp-chip-1{left:2%}
  .lp-chip-2{right:2%}
  .lp-chip-3{left:4%}
  .lp-chip-4{right:4%}
  .lp-app-in{grid-template-columns:1fr;gap:40px}
  .lp-app-text h2{text-align:center}
  .lp-bento{grid-template-columns:1fr 1fr}
  .lp-card-wide{grid-column:span 2}
  .lp-band-in{grid-template-columns:1fr 1fr;gap:26px}
  .lp-stories-grid{grid-template-columns:1fr}
  .lp-nav{display:none}
  .lp-pill{height:58px;padding:0 8px 0 18px}
  .lp-final h2{font-size:32px}
}
@media (max-width:560px){
  .lp-blob{opacity:.35}
  .lp-blob-3{display:none}
  /* Таблетка не должна переполняться на 320–360px */
  .lp-pill{gap:8px;padding:0 6px 0 14px}
  .lp-logo{font-size:17px}
  .lp-btn-ghost{padding:8px 10px;font-size:13px}
  .lp-btn-sm{padding:9px 12px;font-size:13px}
  .lp-hero-center h1{font-size:34px}
  .lp-bento{grid-template-columns:1fr}
  .lp-card-wide{grid-column:span 1}
  .lp-chip-3,.lp-chip-4{display:none}
  .lp-scene{height:340px}
  .lp-mascot{width:70vw}
}
@media (max-width:360px){
  .lp-btn-ghost{display:none} /* «Войти» остаётся в футере */
}
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  .lp *{animation:none!important;transition:none!important}
  .lp-reveal,.lp-stagger > *{opacity:1;transform:none}
}
`;
