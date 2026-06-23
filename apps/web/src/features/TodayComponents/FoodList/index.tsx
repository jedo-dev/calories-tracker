import { useNavigate } from "react-router-dom"
import DeleteIcon from "../../../assets/DeleteIcon.tsx"
import EditIcon from '../../../assets/EditIcon.tsx'
import emptyFood from '../../../assets/03_empty_states/empty_food.jpg'
import { t } from "../../../i18n"
import { Entry } from "../../../pages/TodayPage"
import { useTheme } from "../../../theme/useTheme"
import { Button } from "../../../ui/Button"
import { Card } from "../../../ui/Card"
import { Text } from "../../../ui/Text"
interface Props {
  entries: Entry[];
  handleDelete: (id: string) => void;
}

const FoodList = ({ entries, handleDelete }: Props) => {
  const theme = useTheme()
  const navigate = useNavigate()
  return (
    <div>
      <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>
        {t('today.entries')}
      </Text>
      {entries.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <img src={emptyFood} alt="" style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: theme.spacing.md, opacity: 0.8 }} />
          <Text muted>{t('today.noEntries')}</Text>
        </Card>
      ) : (
        entries.map((entry: Entry) => (
          <Card key={entry._id} style={{ padding: `${theme.spacing.md} 0`, backgroundColor: theme.palette.bg, border: 'unset' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md }}>
              {(entry.time) && (
                <div style={{ padding: theme.spacing.xs, borderRadius: '15px', }}>
                  <span style={{ color: theme.palette.white, fontSize: '12px' }}>  {entry.time && `${entry.time} `}</span>

                </div>
              )}
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Text muted>
                      {entry.productName}
                    </Text>
                    <Text variant="small" muted style={{ fontSize: '10px' }}>
                      {t('totals.macros', {
                        kcal: entry.kcal.toFixed(1),
                        protein: entry.protein.toFixed(1),
                        fat: entry.fat.toFixed(1),
                        carb: entry.carb.toFixed(1),
                      })}
                    </Text>
                    </div>
                  <Text muted variant="small" style={{}}>
                    {entry.grams}г
                  </Text>
                </div>

              </div>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <Button
                  variant="ghost"
                  size='sm'
                  onClick={() => navigate(`/entry/${entry._id}`)}
                  style={{ padding: '8px', minWidth: '44px', minHeight: '44px' }}
                  aria-label="Редактировать запись"
                >
                  <EditIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ padding: '8px', minWidth: '44px', minHeight: '44px' }}
                  onClick={() => handleDelete(entry._id)}
                  aria-label="Удалить запись"
                >
                  <DeleteIcon />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
export default FoodList