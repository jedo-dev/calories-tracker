import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "../api/client";
import emptyWeight from "../assets/03_empty_states/empty_weight.png";
import DeleteIcon from "../assets/DeleteIcon";
import { plural, t } from "../i18n";
import { useTheme } from "../theme/useTheme";
import { Card } from "../ui/Card";
import { ConfirmSheet } from "../ui/ConfirmSheet";
import { EmptyState } from "../ui/EmptyState";
import { IconButton } from "../ui/IconButton";
import { BackIcon, EditIcon } from "../ui/icons";
import Loader from "../ui/Loader";
import { Text } from "../ui/Text";
import { showToast } from "../ui/Toast";
import { WeightSheet } from "../widgets/weight/WeightSheet";

interface WeightEntry {
  _id: string;
  date: string;
  weightKg: number;
}

const MONTHS_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря"
];

const PAGE_SIZE = 7;
const MIN_WEIGHT = 20;
const MAX_WEIGHT = 300;

const cardStyle: React.CSSProperties = {
  borderRadius: "22px",
  background:
    "linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))",
  border: "1px solid rgba(160, 200, 220, 0.18)",
  boxShadow: "0 22px 44px rgba(0, 0, 0, 0.28)",
  padding: "14px"
};

function formatDateRu(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTHS_RU[month - 1]}`;
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Smooth month line chart ─────────────────────────────────────────────────

interface ChartPoint {
  x: number;
  y: number;
  entry: WeightEntry;
}

// Catmull-Rom → cubic bezier path through all points
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const theme = useTheme();
  const [hover, setHover] = useState<ChartPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 480;
  const H = 180;
  const PAD_L = 34;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 22;

  const { points, gridLines, path, areaPath } = useMemo(() => {
    const minW = Math.min(...entries.map((e) => e.weightKg));
    const maxW = Math.max(...entries.map((e) => e.weightKg));
    const pad = Math.max(0.5, (maxW - minW) * 0.15);
    const lo = minW - pad;
    const hi = maxW + pad;

    const t0 = Date.parse(entries[0].date);
    const t1 = Date.parse(entries[entries.length - 1].date);
    const span = Math.max(1, t1 - t0);

    const points: ChartPoint[] = entries.map((e) => ({
      x: PAD_L + ((Date.parse(e.date) - t0) / span) * (W - PAD_L - PAD_R),
      y: PAD_T + (1 - (e.weightKg - lo) / (hi - lo)) * (H - PAD_T - PAD_B),
      entry: e
    }));

    const gridLines = [
      lo + (hi - lo) * 0.15,
      (lo + hi) / 2,
      hi - (hi - lo) * 0.15
    ].map((v) => ({
      y: PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B),
      label: v.toFixed(1)
    }));

    const path = smoothPath(points);
    const last = points[points.length - 1];
    const first = points[0];
    const areaPath = `${path} L ${last.x} ${H - PAD_B} L ${first.x} ${H - PAD_B} Z`;

    return { points, gridLines, path, areaPath };
  }, [entries]);

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let nearest = points[0];
    for (const p of points) {
      if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
    }
    setHover(nearest);
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", touchAction: "pan-y" }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <defs>
          <linearGradient id="weight-area" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={theme.palette.primary}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor={theme.palette.primary}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={g.y}
              y2={g.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={g.y + 3}
              textAnchor="end"
              fontSize="9"
              fill={theme.palette.textMuted}
            >
              {g.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#weight-area)" />
        <path
          d={path}
          fill="none"
          stroke={theme.palette.primary}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* end point always marked */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3.5"
          fill={theme.palette.primary}
          stroke="rgba(10,32,46,1)"
          strokeWidth="2"
        />

        {hover && (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4"
              fill={theme.palette.primary}
              stroke="#fff"
              strokeWidth="1.5"
            />
          </g>
        )}

        <text x={PAD_L} y={H - 6} fontSize="9" fill={theme.palette.textMuted}>
          {formatDateRu(entries[0].date)}
        </text>
        <text
          x={W - PAD_R}
          y={H - 6}
          textAnchor="end"
          fontSize="9"
          fill={theme.palette.textMuted}
        >
          {formatDateRu(entries[entries.length - 1].date)}
        </text>
      </svg>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: `${(hover.x / W) * 100}%`,
            top: 0,
            transform: `translateX(${hover.x > W * 0.75 ? "-100%" : "8px"})`,
            background: "rgba(3, 18, 28, 0.95)",
            border: "1px solid rgba(160, 200, 220, 0.25)",
            borderRadius: "10px",
            padding: "5px 9px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 5
          }}
        >
          <span style={{ fontSize: "11px", color: theme.palette.textMuted }}>
            {formatDateRu(hover.entry.date)} ·{" "}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: theme.palette.text
            }}
          >
            {hover.entry.weightKg} кг
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function WeightHistoryPage() {
  const theme = useTheme();
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<WeightEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(0);

  const today = localToday();

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await apiClient.get("/weight", { params: { limit: 90 } });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      // Ошибка сети не должна выглядеть как «истории нет».
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (dateStr: string, weight: number) => {
    if (isNaN(weight)) {
      setFormError(t("weight.errorNoWeight"));
      return;
    }
    if (weight < MIN_WEIGHT || weight > MAX_WEIGHT) {
      setFormError(
        t("weight.errorWeightRange", { min: MIN_WEIGHT, max: MAX_WEIGHT })
      );
      return;
    }
    if (!dateStr || dateStr > today) {
      setFormError(t("weight.errorFutureDate"));
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await apiClient.post("/weight", { date: dateStr, weightKg: weight });
      setPage(0);
      setSheetOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/weight/${id}`);
      await load();
    } catch (err: any) {
      showToast(err.response?.data?.message || t("weight.deleteFailed"));
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return <Loader />;

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const oldest = sorted[0];
  const diff =
    latest && oldest && sorted.length > 1
      ? latest.weightKg - oldest.weightKg
      : 0;

  // Month window for the chart
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthAgoStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, "0")}-${String(monthAgo.getDate()).padStart(2, "0")}`;
  const monthEntries = sorted.filter((e) => e.date >= monthAgoStr);

  // Newest-first paged list
  const newestFirst = [...sorted].reverse();
  const totalPages = Math.max(1, Math.ceil(newestFirst.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageEntries = newestFirst.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div
      style={{
        padding: "12px",
        maxWidth: "520px",
        margin: "0 auto",
        minHeight: "100vh",
        paddingBottom: "100px",
        background: `
          radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
          radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
          linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
        `
      }}
    >
      {/* Stats */}
      {latest && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            marginBottom: "12px"
          }}
        >
          <div
            style={{ ...cardStyle, padding: "12px 8px", textAlign: "center" }}
          >
            <Text
              variant="small"
              muted
              style={{ display: "block", fontSize: "11px" }}
            >
              {t("weight.current")}
            </Text>
            <Text
              bold
              style={{
                color: theme.palette.primary,
                display: "block",
                fontSize: "20px"
              }}
            >
              {latest.weightKg}
            </Text>
            <Text variant="small" muted style={{ fontSize: "11px" }}>
              {t("weight.kg")}
            </Text>
          </div>
          <div
            style={{ ...cardStyle, padding: "12px 8px", textAlign: "center" }}
          >
            <Text
              variant="small"
              muted
              style={{ display: "block", fontSize: "11px" }}
            >
              {t("weight.change")}
            </Text>
            <Text
              bold
              style={{
                color: diff <= 0 ? theme.palette.success : theme.palette.danger,
                display: "block",
                fontSize: "20px"
              }}
            >
              {diff > 0 ? "+" : ""}
              {diff.toFixed(1)}
            </Text>
            <Text variant="small" muted style={{ fontSize: "11px" }}>
              {t("weight.kg")}
            </Text>
          </div>
          <div
            style={{ ...cardStyle, padding: "12px 8px", textAlign: "center" }}
          >
            <Text
              variant="small"
              muted
              style={{ display: "block", fontSize: "11px" }}
            >
              {t("weight.history")}
            </Text>
            <Text bold style={{ display: "block", fontSize: "20px" }}>
              {history.length}
            </Text>
            <Text variant="small" muted style={{ fontSize: "11px" }}>
              {plural(history.length, "day")}
            </Text>
          </div>
        </div>
      )}

      {/* Month chart */}
      {monthEntries.length > 1 && (
        <Card style={{ ...cardStyle, marginBottom: "12px" }}>
          <Text
            variant="h2"
            bold
            style={{ marginBottom: theme.spacing.sm, fontSize: "18px" }}
          >
            {t("weight.chartMonth")}
          </Text>
          <WeightChart entries={monthEntries} />
        </Card>
      )}

      {/* Add weight */}
      <button
        type="button"
        onClick={() => {
          setFormError(null);
          setEditEntry(null);
          setSheetOpen(true);
        }}
        style={{
          width: "100%",
          height: "54px",
          marginBottom: "12px",
          borderRadius: "18px",
          border: "none",
          background:
            "linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))",
          color: "#07210f",
          fontSize: "16px",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 18px 30px rgba(83, 212, 107, 0.24)",
          fontFamily: "inherit"
        }}
      >
        {t("weight.logWeight")}
      </button>

      <WeightSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editEntry ? t("weight.editWeight") : t("weight.addWeight")}
        initialWeight={editEntry?.weightKg ?? latest?.weightKg ?? 70}
        date={editEntry?.date ?? today}
        min={MIN_WEIGHT}
        max={MAX_WEIGHT}
        saving={saving}
        error={formError}
        onConfirm={handleSave}
      />

      {/* History list with pager */}
      {loadError ? (
        <EmptyState title={t("common.loadError")} description={t("common.retryHint")} />
      ) : history.length === 0 ? (
        <EmptyState image={emptyWeight} title={t("weight.noHistory")} />
      ) : (
        <Card style={{ ...cardStyle }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.sm
            }}
          >
            <Text variant="h2" bold style={{ fontSize: "18px" }}>
              {t("weight.history")}
            </Text>
            {totalPages > 1 && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <IconButton
                  label={t("weight.pagePrev")}
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  size={30}
                >
                  <BackIcon size={16} />
                </IconButton>
                <Text
                  variant="small"
                  muted
                  style={{ minWidth: "38px", textAlign: "center" }}
                >
                  {safePage + 1} / {totalPages}
                </Text>
                <IconButton
                  label={t("weight.pageNext")}
                  onClick={() =>
                    setPage(Math.min(totalPages - 1, safePage + 1))
                  }
                  size={30}
                >
                  <span style={{ display: "flex", transform: "scaleX(-1)" }}>
                    <BackIcon size={16} />
                  </span>
                </IconButton>
              </div>
            )}
          </div>
          {pageEntries.map((entry, i) => (
            <div
              key={entry._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom:
                  i < pageEntries.length - 1
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "none"
              }}
            >
              <Text variant="small" muted>
                {formatDateRu(entry.date)}
              </Text>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing.sm
                }}
              >
                <Text bold>
                  {entry.weightKg} {t("weight.kg")}
                </Text>
                <IconButton
                  label={t("common.edit")}
                  onClick={() => {
                    setFormError(null);
                    setEditEntry(entry);
                    setSheetOpen(true);
                  }}
                  size={30}
                >
                  <EditIcon size={16} />
                </IconButton>
                <IconButton
                  label={t("common.delete")}
                  onClick={() => setDeleteId(entry._id)}
                  danger
                  size={30}
                >
                  <DeleteIcon />
                </IconButton>
              </div>
            </div>
          ))}
        </Card>
      )}

      <ConfirmSheet
        isOpen={deleteId !== null}
        title={t("weight.confirmDelete")}
        confirmLabel={t("common.delete")}
        danger
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
