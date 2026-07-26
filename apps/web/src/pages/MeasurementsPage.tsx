import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client";
import chestImage from "../assets/measurements/body_chest.jpg";
import hipsImage from "../assets/measurements/body_hips.jpg";
import waistImage from "../assets/measurements/body_waist.jpg";
import { useTheme } from "../theme/useTheme";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import Loader from "../ui/Loader";
import { Text } from "../ui/Text";

interface Measurement {
  _id: string;
  date: string;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  bicepCm?: number;
  thighCm?: number;
}

function formatDateRu(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const monthNames = [
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

  if (!year || !month || !day) return dateStr;
  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatMetricValue(value?: number, decimals = 1): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(decimals);
}

function getDelta(current?: number, previous?: number): number | null {
  if (typeof current !== "number" || typeof previous !== "number") return null;
  return current - previous;
}

function getArrow(delta: number | null): "up" | "down" | "flat" {
  if (delta === null || Math.abs(delta) < 0.0001) return "flat";
  return delta > 0 ? "up" : "down";
}

function MeasurementIcon({
  kind
}: {
  kind: "waist" | "hips" | "chest" | "bicep" | "thigh";
}) {
  const common = {
    width: 34,
    height: 34,
    viewBox: "0 0 34 34",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (kind === "waist") {
    return (
      <svg {...common}>
        <path d="M10 7c0 4-2 5.5-3 8-.9 2.2-.9 5.3 0 8 .7 2 1.8 4.5 1.8 5.5" />
        <path d="M24 7c0 4 2 5.5 3 8 .9 2.2.9 5.3 0 8-.7 2-1.8 4.5-1.8 5.5" />
        <path d="M13 12c1.2.7 2.5 1 4 1s2.8-.3 4-1" />
        <path d="M9 20c2.8-2.7 4.7-3.8 8-3.8s5.2 1.1 8 3.8" />
      </svg>
    );
  }

  if (kind === "hips") {
    return (
      <svg {...common}>
        <path d="M11 7c0 3.2-1.5 5.3-2.4 7.7-.9 2.3-1.3 5.1-.9 8.8" />
        <path d="M23 7c0 3.2 1.5 5.3 2.4 7.7.9 2.3 1.3 5.1.9 8.8" />
        <path d="M8 19.5c2.7-3 4.9-4.5 9-4.5s6.3 1.5 9 4.5" />
        <path d="M11 25c2.2-1.8 3.8-2.5 6-2.5s3.8.7 6 2.5" />
      </svg>
    );
  }

  if (kind === "chest") {
    return (
      <svg {...common}>
        <path d="M12 6c0 2-1.2 3.3-2.6 4.4C7.7 11.2 7 13 7 16v11" />
        <path d="M22 6c0 2 1.2 3.3 2.6 4.4C26.3 11.2 27 13 27 16v11" />
        <path d="M13 12.5c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5" />
        <path d="M12 18c1.7-1.6 3.4-2.3 5-2.3s3.3.7 5 2.3" />
      </svg>
    );
  }

  if (kind === "bicep") {
    return (
      <svg {...common}>
        <path d="M12 6c0 2.8-1.2 4.7-2.4 6.6-1.3 2.2-2.1 4.8-2.1 8.1 0 4.2 2.1 6.8 7.5 6.8 5 0 8.9-2.1 11-5.2" />
        <path d="M17.2 12c1.2-.7 2.7-1 4.4-.7 2.2.4 3.6 1.7 3.4 3.6-.2 1.7-1.6 2.8-3.2 3.7" />
        <path d="M13 20c1.4-1.3 2.9-2 4.7-2 2.4 0 4.5 1.1 6.3 3" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M16 7c-1.4 2.8-2.9 5.4-4.6 7.9-1.6 2.3-2.7 5.1-2.7 8.1 0 2.3.8 4.1 2.2 4.9" />
      <path d="M18 7c1.4 2.8 2.9 5.4 4.6 7.9 1.6 2.3 2.7 5.1 2.7 8.1 0 2.3-.8 4.1-2.2 4.9" />
      <path d="M12 18c1.2-1.3 2.7-2 5-2s3.8.7 5 2" />
      <path d="M11.5 26c1.3-1 2.9-1.5 5.5-1.5s4.2.5 5.5 1.5" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "flat") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 9h10"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={
          direction === "down"
            ? "M9 3v12M4.5 10.5L9 15l4.5-4.5"
            : "M9 15V3M4.5 7.5L9 3l4.5 4.5"
        }
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MeasurementsPage() {
  const theme = useTheme();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  );
  const [form, setForm] = useState({
    waistCm: "",
    hipsCm: "",
    chestCm: "",
    bicepCm: "",
    thighCm: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/measurements", {
        params: { limit: 90 }
      });
      setMeasurements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedMeasurements = useMemo(
    () => [...measurements].sort((a, b) => a.date.localeCompare(b.date)),
    [measurements]
  );

  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1];
  const previousMeasurement = sortedMeasurements[sortedMeasurements.length - 2];

  const measurementRows = [
    {
      key: "waistCm",
      label: "Талия",
      unit: "см",
      icon: (
        <img
          src={waistImage}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )
    },
    {
      key: "hipsCm",
      label: "Бёдра",
      unit: "см",
      icon: (
        <img
          src={hipsImage}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )
    },
    {
      key: "chestCm",
      label: "Грудь",
      unit: "см",
      icon: (
        <img
          src={chestImage}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )
    },
    {
      key: "bicepCm",
      label: "Бицепс",
      unit: "см",
      icon: <MeasurementIcon kind="bicep" />
    },
    {
      key: "thighCm",
      label: "Бедро",
      unit: "см",
      icon: <MeasurementIcon kind="thigh" />
    }
  ] as const;

  const historyEntries = useMemo(
    () => [...sortedMeasurements].reverse(),
    [sortedMeasurements]
  );

  const handleSave = async () => {
    const data: any = { date };
    if (form.waistCm) data.waistCm = parseFloat(form.waistCm);
    if (form.hipsCm) data.hipsCm = parseFloat(form.hipsCm);
    if (form.chestCm) data.chestCm = parseFloat(form.chestCm);
    if (form.bicepCm) data.bicepCm = parseFloat(form.bicepCm);
    if (form.thighCm) data.thighCm = parseFloat(form.thighCm);

    try {
      await apiClient.post("/measurements", data);
      setForm({
        waistCm: "",
        hipsCm: "",
        chestCm: "",
        bicepCm: "",
        thighCm: ""
      });
      setShowForm(false);
      setTab("overview");
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!window.confirm("Удалить запись замеров?")) return;
    try {
      await apiClient.delete(`/measurements/${id}`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Не удалось удалить запись");
    }
  };

  const cardBackground =
    "linear-gradient(180deg, rgba(13, 38, 58, 0.95), rgba(9, 27, 42, 0.95))";
  const outline = "rgba(120, 176, 204, 0.18)";

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(83, 212, 107, 0.12), transparent 26%), radial-gradient(circle at top right, rgba(0, 155, 255, 0.09), transparent 28%), linear-gradient(180deg, #020d17 0%, #061726 100%)",
        padding: "22px 20px 28px",

        maxWidth: "100%"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "24px"
        }}
      >
        <Text
          variant="h1"
          bold
          style={{
            display: "block",
            fontSize: "32px",
            lineHeight: 1.05,
            letterSpacing: "-0.04em"
          }}
        >
          Замеры тела
        </Text>

        <Button
          onClick={() => {
            setShowForm((value) => !value);
            setTab("overview");
          }}
          variant="ghost"
          style={{
            width: "auto",
            border: "none",
            color: "#62df73",
            background: "transparent",
            padding: "10px 0",
            fontSize: "20px",
            fontWeight: 600
          }}
        >
          + Добавить
        </Button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          padding: "4px",
          borderRadius: "20px",
          background: "rgba(14, 37, 56, 0.75)",
          border: "1px solid rgba(116, 160, 190, 0.18)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
          marginBottom: "22px",
        }}
      >
        {(
          [
            { key: "overview", label: "Обзор" },
            { key: "history", label: "История" }
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              style={{
                minHeight: "54px",
                border: "none",
                cursor: "pointer",
                borderRadius: "16px",
                background: active
                  ? "linear-gradient(180deg, #5cd76f 0%, #53d46b 100%)"
                  : "transparent",
                color: active ? "#ffffff" : theme.palette.textMuted,
                fontSize: "18px",
                fontWeight: 700,
                display: "grid",
                placeItems: "center"
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {showForm && (
        <div
          style={{
            background: cardBackground,
            border: `1px solid ${outline}`,
            borderRadius: "28px",
            padding: "18px",
            marginBottom: "22px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)"
          }}
        >
          <Text
            variant="h2"
            bold
            style={{ display: "block", marginBottom: "14px", fontSize: "26px" }}
          >
            Добавить замеры
          </Text>
          <div style={{ marginBottom: "12px" }}>
            <Input
              label="Дата"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                background: "rgba(3, 18, 28, 0.7)",
                border: "1px solid rgba(160, 200, 220, 0.16)",
                borderRadius: "16px",
                padding: "14px 16px"
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px"
            }}
          >
            {measurementRows.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type="number"
                value={form[field.key]}
                onChange={(e) =>
                  setForm({ ...form, [field.key]: e.target.value })
                }
                placeholder={field.unit}
                step="0.1"
                style={{
                  background: "rgba(3, 18, 28, 0.7)",
                  border: "1px solid rgba(160, 200, 220, 0.16)",
                  borderRadius: "16px",
                  padding: "14px 16px"
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              style={{
                width: "auto",
                minWidth: "120px",
                background: "rgba(3, 18, 28, 0.6)",
                border: `1px solid ${outline}`
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              style={{
                width: "auto",
                flex: 1,
                background: "linear-gradient(180deg, #5cd76f 0%, #53d46b 100%)",
                color: "#08161a",
                boxShadow: "0 18px 30px rgba(83, 212, 107, 0.24)"
              }}
            >
              Сохранить
            </Button>
          </div>
        </div>
      )}

      {tab === "overview" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <section>
            <Text
              variant="h2"
              bold
              style={{
                display: "block",
                marginBottom: "14px",
                fontSize: "28px"
              }}
            >
              Текущие замеры
            </Text>

            <div
              style={{
                background: cardBackground,
                border: `1px solid ${outline}`,
                borderRadius: "28px",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)"
              }}
            >
              {measurementRows.map((field, index) => {
                const current = latestMeasurement?.[field.key];
                const previous = previousMeasurement?.[field.key];
                const delta = getDelta(current, previous);
                const direction = getArrow(delta);
                const hasValue = typeof current === "number";

                return (
                  <div
                    key={field.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "82px minmax(0, 1fr) minmax(104px, auto)",
                      alignItems: "center",
                      gap: "14px",
                      padding: "18px",
                      borderTop:
                        index === 0
                          ? "none"
                          : "1px solid rgba(160, 200, 220, 0.12)"
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(83, 212, 107, 0.08)",
                        border: "1px solid rgba(83, 212, 107, 0.35)",
                        color: "#89ee7f",
                        overflow: "hidden"
                      }}
                    >
                      {field.icon}
                    </div>

                    <div>
                      <Text
                        variant="h2"
                        bold
                        style={{
                          display: "block",
                          fontSize: "24px",
                          lineHeight: 1.05
                        }}
                      >
                        {field.label}
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "6px",
                          marginTop: "8px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <span
                          style={{
                            fontSize: "34px",
                            fontWeight: 800,
                            letterSpacing: "-0.05em",
                            lineHeight: 1
                          }}
                        >
                          {hasValue ? formatMetricValue(current, 1) : "—"}
                        </span>
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 700,
                            color: theme.palette.text
                          }}
                        >
                          {field.unit}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "8px",
                        color: "#9fb2bf",
                        minWidth: "104px",
                        justifyContent: "center",
                        whiteSpace: "nowrap"
                      }}
                    >
                      <span style={{ fontSize: "17px", fontWeight: 500 }}>
                        {typeof previous === "number"
                          ? `${formatMetricValue(previous, 1)} ${field.unit}`
                          : "—"}
                      </span>
                      {delta !== null && (
                        <span style={{ color: "#5cd76f" }}>
                          <ArrowIcon direction={direction} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Text
            variant="h2"
            bold
            style={{ display: "block", fontSize: "28px", marginBottom: "2px" }}
          >
            История
          </Text>

          {historyEntries.length === 0 ? (
            <div
              style={{
                background: cardBackground,
                border: `1px solid ${outline}`,
                borderRadius: "28px",
                padding: "28px 20px",
                textAlign: "center",
                color: "#95a7b3"
              }}
            >
              История замеров появится после первого сохранения.
            </div>
          ) : (
            historyEntries.map((entry) => (
              <div
                key={entry._id}
                style={{
                  background: cardBackground,
                  border: `1px solid ${outline}`,
                  borderRadius: "28px",
                  padding: "18px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px"
                  }}
                >
                  <div>
                    <Text
                      variant="h2"
                      bold
                      style={{ display: "block", fontSize: "22px" }}
                    >
                      {formatDateRu(entry.date)}
                    </Text>
                  </div>

                  <button
                    onClick={() => handleDeleteMeasurement(entry._id)}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(160, 200, 220, 0.12)",
                      color: theme.palette.textMuted,
                      borderRadius: "14px",
                      width: "40px",
                      height: "40px",
                      cursor: "pointer",
                      fontSize: "18px"
                    }}
                    aria-label="Удалить"
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {measurementRows.map((row) => {
                    const value = entry[row.key];
                    if (typeof value !== "number") return null;
                    return (
                      <div
                        key={row.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          color: "#dbe7ed"
                        }}
                      >
                        <span>{row.label}</span>
                        <span>
                          {value.toFixed(1)} {row.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
