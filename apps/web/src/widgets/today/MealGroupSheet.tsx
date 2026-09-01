import type { MealGroup } from "../../features/TodayComponents/FoodList";
import DeleteIcon from "../../assets/DeleteIcon";
import EditIcon from "../../assets/EditIcon";
import { plural, t } from "../../i18n";
import { useTheme } from "../../theme/useTheme";
import { Button } from "../../ui/Button";
import { Text } from "../../ui/Text";

interface MealGroupSheetProps {
  group: MealGroup;
  onClose: () => void;
  onEditEntry: (entryId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  /** Просмотр прошлых дней: записи не редактируются и не удаляются */
  readOnly?: boolean;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: t("mealType.breakfast"),
  lunch: t("mealType.lunch"),
  dinner: t("mealType.dinner"),
  snack: t("mealType.snack"),
  other: t("mealType.other")
};

// Модалка приёма пищи: список записей с редактированием/удалением.
export function MealGroupSheet({ group, onClose, onEditEntry, onDeleteEntry, readOnly = false }: MealGroupSheetProps) {
  const theme = useTheme();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: theme.spacing.sm,
        zIndex: 40
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(600px, 100%)",
          maxHeight: "78vh",
          overflow: "hidden",
          borderRadius: "28px",
          padding: 0,
          background:
            "linear-gradient(180deg, rgba(18, 52, 72, 0.98) 0%, rgba(9, 28, 42, 1) 100%)",
          border: "1px solid rgba(146, 188, 221, 0.18)",
          boxShadow: "0 -18px 50px rgba(0,0,0,0.45)",
          transform: "translateY(-60px)"
        }}
      >
        <div
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderBottom: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: theme.spacing.sm
            }}
          >
            <div>
              <Text variant="h2" bold style={{ display: "block" }}>
                {MEAL_LABELS[group.mealType] || group.mealType}
              </Text>
              <Text
                variant="small"
                muted
                style={{ display: "block", marginTop: "2px" }}
              >
                {group.entries.length} {plural(group.entries.length, "entry")}
              </Text>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={{
                width: "auto",
                minWidth: "40px",
                minHeight: "40px",
                padding: 0
              }}
            >
              ×
            </Button>
          </div>
        </div>

        <div style={{ overflowY: "auto", maxHeight: "calc(78vh - 76px)" }}>
          {group.entries.map((entry, index) => (
            <div
              key={entry._id}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderTop:
                  index === 0 ? "none" : "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: theme.spacing.sm,
                  alignItems: "flex-start"
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Text bold style={{ display: "block", fontSize: "17px" }}>
                    {entry.productName}
                  </Text>
                  <Text
                    variant="small"
                    muted
                    style={{ display: "block", marginTop: "3px" }}
                  >
                    {entry.grams} г · {entry.kcal.toFixed(0)} ккал
                  </Text>
                  <Text
                    variant="small"
                    muted
                    style={{ display: "block", marginTop: "2px" }}
                  >
                    Б: {entry.protein.toFixed(1)} · Ж: {entry.fat.toFixed(1)} ·
                    У: {entry.carb.toFixed(1)}
                  </Text>
                </div>

                {!readOnly && (
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditEntry(entry._id)}
                    style={{
                      width: "auto",
                      minWidth: "44px",
                      minHeight: "44px",
                      padding: "0 10px"
                    }}
                    aria-label={t("common.edit")}
                  >
                    <EditIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-tour="meal-entry-delete"
                    onClick={() => onDeleteEntry(entry._id)}
                    style={{
                      width: "auto",
                      minWidth: "44px",
                      minHeight: "44px",
                      padding: "0 10px"
                    }}
                    aria-label={t("common.delete")}
                  >
                    <DeleteIcon />
                  </Button>
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
