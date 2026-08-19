import { PageHeader } from '../ui/PageHeader';
import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import emptyWeight from "../assets/03_empty_states/empty_weight.png";
import DeleteIcon from "../assets/DeleteIcon";
import { formatDateHuman, plural, t, todayISO } from '../i18n';
import { glassCardStyle, pageBackground } from "../theme/styles";
import { useTheme } from "../theme/useTheme";
import { Card } from "../ui/Card";
import { ConfirmSheet } from "../ui/ConfirmSheet";
import { EmptyState } from "../ui/EmptyState";
import { IconButton } from "../ui/IconButton";
import { BackIcon, EditIcon } from "../ui/icons";
import Loader from "../ui/Loader";
import { Text } from "../ui/Text";
import { showToast } from "../ui/Toast";
import { WeightChart, WeightEntry } from "../widgets/weight/WeightChart";
import { WeightSheet } from "../widgets/weight/WeightSheet";

const PAGE_SIZE = 7;
const MIN_WEIGHT = 20;
const MAX_WEIGHT = 300;

const cardStyle = glassCardStyle;

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
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const today = todayISO();
  const BATCH = 90;

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await apiClient.get("/weight", { params: { limit: BATCH } });
      setHistory(res.data);
      setHasMore(res.data.length === BATCH);
    } catch (err) {
      console.error(err);
      // Ошибка сети не должна выглядеть как «истории нет».
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  // Догрузка старой истории: раньше всё старше 90 записей было недоступно.
  const loadMore = async (): Promise<boolean> => {
    if (loadingMore || !hasMore) return false;
    setLoadingMore(true);
    try {
      const res = await apiClient.get("/weight", {
        params: { limit: BATCH, offset: history.length }
      });
      setHistory((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length === BATCH);
      return res.data.length > 0;
    } catch (err) {
      console.error(err);
      showToast(t("common.loadError"));
      return false;
    } finally {
      setLoadingMore(false);
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
        paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
        maxWidth: "520px",
        margin: "0 auto",
        minHeight: "100vh",
        paddingBottom: "100px",
        background: pageBackground(theme.palette.bg)
      }}
    >
      <PageHeader title={t("weight.title")} />

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
            {(totalPages > 1 || hasMore) && (
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
                  {hasMore ? "+" : ""}
                </Text>
                <IconButton
                  label={t("weight.pageNext")}
                  onClick={async () => {
                    // На последней загруженной странице тянем следующую пачку с сервера.
                    if (safePage >= totalPages - 1) {
                      if (await loadMore()) setPage(safePage + 1);
                    } else {
                      setPage(safePage + 1);
                    }
                  }}
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
                {formatDateHuman(entry.date)}
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
