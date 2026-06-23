import { t } from "../i18n"
import { useTheme } from "../theme/useTheme"

const Loader = () => {
  const theme = useTheme()
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: theme.palette.bg,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        justifyContent: 'center'
      }}
    >
      <div style={{
        position: 'absolute', left: "0",
        right: "0",
        marginInline: "auto",
        fontSize: '24px',
        opacity: '0.5',
        width: "fit-content",
        animationName: "pulse-text",
        animationDuration: "2s",
        animationIterationCount: "infinite"
      }}>{t('common.loading')}</div>
      <style>{`
        @keyframes rotate-loader {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .inner-line-loader-group {
          animation: rotate-loader 2s linear infinite;
          transform-origin: 32px 32px;
        }
      `}</style>
      <div style={{ color: '#0D2231' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
          <g className="inner-line-loader-group">
            <path d="M32 8 A24 24 0 0 1 55 28" className="inner-line-loader" stroke="#53D46B" strokeWidth="6" strokeLinecap="round" />
          </g>
          <path d="M32 8 A24 24 0 1 1 31.999 8" stroke="#B4C2C6" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
export default Loader
