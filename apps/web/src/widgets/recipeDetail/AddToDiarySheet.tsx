import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t, todayISO } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';
import type { Recipe } from './types';

interface AddToDiarySheetProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

// Лист «Добавить рецепт в дневник»: дата/приём пищи/граммы + превью КБЖУ.
// Владеет формой и отправкой; после успеха уводит на «Сегодня».
export function AddToDiarySheet({ recipe, isOpen, onClose }: AddToDiarySheetProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [mealType, setMealType] = useState('other');
  // Порция предзаполняется размером порции рецепта (как было на странице).
  const [grams, setGrams] = useState(recipe.servingGrams?.toString() || '');
  const [adding, setAdding] = useState(false);

  const gramsNum = parseFloat(grams) || 0;
  const preview = {
    kcal: Math.round((recipe.kcalPer100g * gramsNum) / 100),
    protein: Math.round(((recipe.proteinPer100g * gramsNum) / 100) * 10) / 10,
    fat: Math.round(((recipe.fatPer100g * gramsNum) / 100) * 10) / 10,
    carb: Math.round(((recipe.carbPer100g * gramsNum) / 100) * 10) / 10,
  };

  const handleSubmit = async () => {
    if (!grams || gramsNum <= 0) return;
    setAdding(true);
    try {
      await apiClient.post(`/recipes/${recipe._id}/create-entry`, {
        date,
        mealType,
        grams: gramsNum,
      });
      onClose();
      navigate('/today');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || t('common.error'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      header={
        <div style={{ padding: theme.spacing.md, textAlign: 'center' }}>
          <Text variant="h2">{t('recipes.addToDiary')}</Text>
        </div>
      }
      handle={<div style={{ width: '40px', height: '4px', backgroundColor: theme.palette.border, borderRadius: '2px', margin: `${theme.spacing.sm} auto` }} />}
    >
      <div style={{ padding: theme.spacing.md }}>
        <div style={{ marginBottom: theme.spacing.md }}>
          <Input
            label={t('entry.date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: theme.spacing.md }}>
          <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text, fontSize: theme.typography.small.fontSize }}>
            {t('entry.mealType')}
          </label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              fontSize: theme.typography.body.fontSize,
              backgroundColor: theme.palette.bg,
              color: theme.palette.text,
              border: `1px solid ${theme.palette.border}`,
              borderRadius: theme.radius.sm,
              boxSizing: 'border-box',
            }}
          >
            <option value="other">{t('mealType.other')}</option>
            <option value="breakfast">{t('mealType.breakfast')}</option>
            <option value="lunch">{t('mealType.lunch')}</option>
            <option value="dinner">{t('mealType.dinner')}</option>
            <option value="snack">{t('mealType.snack')}</option>
          </select>
        </div>

        <div style={{ marginBottom: theme.spacing.md }}>
          <Input
            label={t('entry.grams')}
            type="number"
            inputMode="decimal"
            placeholder="150"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
          {recipe.servingGrams && (
            <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
              <Button size="sm" variant="ghost" onClick={() => setGrams(recipe.servingGrams!.toString())}>
                {recipe.servingName || t('recipes.onePortion')} ({recipe.servingGrams}г)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setGrams('100')}>
                100г
              </Button>
            </div>
          )}
        </div>

        {gramsNum > 0 && (
          <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '15', borderRadius: '16px' }}>
            <Text variant="small" bold style={{ display: 'block' }}>
              {recipe.name} · {gramsNum}г
            </Text>
            <Text variant="small" muted>
              {preview.kcal} ккал · Б{preview.protein} Ж{preview.fat} У{preview.carb}
            </Text>
          </Card>
        )}

        <Button onClick={handleSubmit} disabled={adding || gramsNum <= 0}>
          {adding ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </BottomSheet>
  );
}
