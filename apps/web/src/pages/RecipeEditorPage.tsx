import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import Loader from '../ui/Loader';
import { RichTextEditor, isRichTextEmpty } from '../ui/RichTextEditor';
import { IconButton } from '../ui/IconButton';
import { CoverPhotoCard } from '../widgets/recipeEditor/CoverPhotoCard';
import { Ingredient, IngredientProduct, IngredientsCard } from '../widgets/recipeEditor/IngredientsCard';
import { BackIcon } from '../ui/icons';

const cardStyle = glassCardStyle;

export function RecipeEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipe, setSavedRecipe] = useState<any>(null);
  const [showSavedActions, setShowSavedActions] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [calculationMode, setCalculationMode] = useState<'manual' | 'ingredients' | 'mixed'>('manual');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [totalCookedWeightG, setTotalCookedWeightG] = useState('');
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [servingName, setServingName] = useState('');
  const [servingGrams, setServingGrams] = useState('');
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (isEdit) loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/recipes/${id}`);
      const recipe = response.data;
      setName(recipe.name);
      setDescription(recipe.description || '');
      setPhotoUrl(recipe.photoUrl || '');
      setCalculationMode(recipe.calculationMode);
      setIngredients(recipe.ingredients || []);
      setTotalCookedWeightG(recipe.totalCookedWeightG?.toString() || '');
      setManualKcal(recipe.kcalPer100g?.toString() || '');
      setManualProtein(recipe.proteinPer100g?.toString() || '');
      setManualFat(recipe.fatPer100g?.toString() || '');
      setManualCarb(recipe.carbPer100g?.toString() || '');
      setServingName(recipe.servingName || '');
      setServingGrams(recipe.servingGrams?.toString() || '');
      setVisibility(recipe.visibility || 'private');
    } catch (err) {
      console.error(err);
      setError(t('recipes.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const markDirty = useCallback(() => setIsDirty(true), []);

  const addIngredient = (product: IngredientProduct) => {
    markDirty();
    setIngredients((prev) => [
      ...prev,
      {
        productId: product._id,
        productName: product.name,
        grams: 100,
        kcalPer100g: product.kcalPer100g,
        proteinPer100g: product.proteinPer100g,
        fatPer100g: product.fatPer100g,
        carbPer100g: product.carbPer100g,
        kcal: product.kcalPer100g,
        protein: product.proteinPer100g,
        fat: product.fatPer100g,
        carb: product.carbPer100g,
      },
    ]);
  };

  const updateIngredientGrams = (index: number, grams: number) => {
    markDirty();
    setIngredients((prev) => {
      const updated = [...prev];
      const ing = { ...updated[index] };
      ing.grams = grams;
      const factor = grams / 100;
      ing.kcal = Math.round(ing.kcalPer100g * factor * 100) / 100;
      ing.protein = Math.round(ing.proteinPer100g * factor * 100) / 100;
      ing.fat = Math.round(ing.fatPer100g * factor * 100) / 100;
      ing.carb = Math.round(ing.carbPer100g * factor * 100) / 100;
      updated[index] = ing;
      return updated;
    });
  };

  const removeIngredient = (index: number) => {
    markDirty();
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculated totals from ingredients
  const ingredientsTotal = ingredients.reduce(
    (acc, ing) => ({
      kcal: acc.kcal + ing.kcal,
      protein: acc.protein + ing.protein,
      fat: acc.fat + ing.fat,
      carb: acc.carb + ing.carb,
    }),
    { kcal: 0, protein: 0, fat: 0, carb: 0 },
  );

  const ingredientsWeightSum = ingredients.reduce((sum, ing) => sum + ing.grams, 0);

  // Calculated per 100g
  const weight = parseFloat(totalCookedWeightG) || 0;
  const calculatedPer100g = weight > 0
    ? {
        kcal: Math.round(ingredientsTotal.kcal / weight * 100 * 100) / 100,
        protein: Math.round(ingredientsTotal.protein / weight * 100 * 100) / 100,
        fat: Math.round(ingredientsTotal.fat / weight * 100 * 100) / 100,
        carb: Math.round(ingredientsTotal.carb / weight * 100 * 100) / 100,
      }
    : { kcal: 0, protein: 0, fat: 0, carb: 0 };

  const finalPer100g = calculationMode === 'manual'
    ? {
        kcal: parseFloat(manualKcal) || 0,
        protein: parseFloat(manualProtein) || 0,
        fat: parseFloat(manualFat) || 0,
        carb: parseFloat(manualCarb) || 0,
      }
    : calculationMode === 'mixed'
      ? {
          kcal: parseFloat(manualKcal) || calculatedPer100g.kcal,
          protein: parseFloat(manualProtein) || calculatedPer100g.protein,
          fat: parseFloat(manualFat) || calculatedPer100g.fat,
          carb: parseFloat(manualCarb) || calculatedPer100g.carb,
        }
      : calculatedPer100g;

  // The api client defaults Content-Type to application/json, which makes
  // axios >=1.2 serialize FormData to JSON — override it so multipart is sent.
  const uploadRecipePhoto = async (recipeId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.post(`/recipes/${recipeId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.photoUrl as string;
  };

  const uploadInlineImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/recipes/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url as string;
  };

  const validate = (): string | null => {
    if (!name.trim() || name.trim().length < 2) return t('recipeValidation.nameMinLength');
    if (weight <= 0) return t('recipeValidation.weightRequired');
    if (calculationMode === 'ingredients' && ingredients.length === 0) return t('recipeValidation.ingredientRequired');

    // Validate macros per 100g
    const macrosSum = finalPer100g.protein + finalPer100g.fat + finalPer100g.carb;
    if (macrosSum > 100) {
      return `Сумма Б+Ж+У (${macrosSum.toFixed(1)}г) не может превышать 100г на 100г продукта`;
    }

    // Validate calories consistency (4/9/4 kcal per gram)
    const expectedKcal = finalPer100g.protein * 4 + finalPer100g.fat * 9 + finalPer100g.carb * 4;
    if (finalPer100g.kcal > 0 && expectedKcal > 0) {
      const diff = Math.abs(finalPer100g.kcal - expectedKcal);
      const pctDiff = (diff / expectedKcal) * 100;
      if (pctDiff > 30) {
        return `Калории (${finalPer100g.kcal}) не соответствуют макросам (ожидается ~${Math.round(expectedKcal)} ккал). Проверьте данные.`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isLocalPhotoPreview = photoUrl.startsWith('data:');
      const payload: any = {
        name: name.trim(),
        description: isRichTextEmpty(description) ? undefined : description,
        photoUrl: !isLocalPhotoPreview && photoUrl ? photoUrl : undefined,
        calculationMode,
        totalCookedWeightG: weight,
        servingName: servingName.trim() || undefined,
        servingGrams: servingGrams ? parseFloat(servingGrams) : undefined,
        visibility,
        ingredients: calculationMode !== 'manual' ? ingredients.map((ing) => ({
          productId: ing.productId,
          productName: ing.productName,
          grams: ing.grams,
          kcalPer100g: ing.kcalPer100g,
          proteinPer100g: ing.proteinPer100g,
          fatPer100g: ing.fatPer100g,
          carbPer100g: ing.carbPer100g,
        })) : [],
      };

      if (calculationMode === 'manual' || calculationMode === 'mixed') {
        if (manualKcal) payload.kcalPer100g = parseFloat(manualKcal);
        if (manualProtein) payload.proteinPer100g = parseFloat(manualProtein);
        if (manualFat) payload.fatPer100g = parseFloat(manualFat);
        if (manualCarb) payload.carbPer100g = parseFloat(manualCarb);
      }

      let result;
      if (isEdit) {
        result = await apiClient.patch(`/recipes/${id}`, payload);
      } else {
        result = await apiClient.post('/recipes', payload);
      }

      let saved = result.data;
      if (pendingPhotoFile) {
        try {
          const uploadedPhotoUrl = await uploadRecipePhoto(saved._id, pendingPhotoFile);
          saved = { ...saved, photoUrl: uploadedPhotoUrl };
          setPhotoUrl(uploadedPhotoUrl);
          setPendingPhotoFile(null);
        } catch (err) {
          setSavedRecipe(saved);
          setError(t('recipeEditor.photoUploadFailed'));
          return;
        }
      }

      setSavedRecipe(saved);
      setIsDirty(false);

      if (!isEdit) {
        setShowSavedActions(true);
      } else {
        navigate(`/recipes/${saved._id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('recipeEditor.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(t('recipeEditor.photoTooLarge'));
      return;
    }

    const recipeIdForUpload = savedRecipe?._id || id;
    if (!recipeIdForUpload) {
      // Preview locally before saving
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
        setPendingPhotoFile(file);
        markDirty();
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      const uploadedPhotoUrl = await uploadRecipePhoto(recipeIdForUpload, file);
      setPhotoUrl(uploadedPhotoUrl);
      setPendingPhotoFile(null);
      markDirty();
    } catch (err) {
      setError(t('recipeEditor.photoUploadFailed'));
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl('');
    setPendingPhotoFile(null);
    markDirty();
    const recipeIdForDelete = savedRecipe?._id || id;
    if (recipeIdForDelete) {
      try {
        await apiClient.delete(`/recipes/${recipeIdForDelete}/photo`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSetWeightToIngredientsSum = () => {
    setTotalCookedWeightG(ingredientsWeightSum.toString());
    markDirty();
  };

  const handleSetWeightPercent = (percent: number) => {
    const val = Math.round(ingredientsWeightSum * percent);
    setTotalCookedWeightG(val.toString());
    markDirty();
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (loading) return <Loader />;

  // Show saved actions dialog
  if (showSavedActions && savedRecipe) {
    return (
      <div
        style={{
          padding: '12px',
          maxWidth: '520px',
          margin: '0 auto',
          minHeight: '100vh',
          background: pageBackground(theme.palette.bg),
        }}
      >
        <Card style={{ ...cardStyle, textAlign: 'center', padding: theme.spacing.xl }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>
             {t('recipeEditor.savedActions')}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <Button onClick={() => navigate(`/entry/new?recipeId=${savedRecipe._id}&recipeName=${encodeURIComponent(savedRecipe.name)}&kcal=${savedRecipe.kcalPer100g}&protein=${savedRecipe.proteinPer100g}&fat=${savedRecipe.fatPer100g}&carb=${savedRecipe.carbPer100g}`)}>
               {t('recipeEditor.addToDiary')}
            </Button>
            <Button variant="secondary" onClick={() => setShowSavedActions(false)}>
               {t('recipeEditor.stayHere')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/recipes')}>
               {t('recipeEditor.goToList')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        paddingBottom: '100px',
        minHeight: '100vh',
        background: pageBackground(theme.palette.bg),
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: theme.spacing.lg }}>
        <IconButton
          label={t('common.back')}
          onClick={() => {
            // beforeunload ловит только закрытие вкладки — SPA-переход
            // назад тоже не должен молча терять несохранённое.
            if (isDirty && !confirm(t('recipeEditor.unsavedConfirm'))) return;
            navigate(-1);
          }}
        >
          <BackIcon />
        </IconButton>
        <Text variant="h2" bold style={{ fontSize: '20px' }}>
          {isEdit ? t('recipeEditor.editTitle') : t('recipeEditor.newTitle')}
        </Text>
      </div>

      {error && (
        <Card style={{ ...cardStyle, marginBottom: '12px', border: '1px solid rgba(255,120,120,0.35)' }}>
          <Text style={{ color: theme.palette.danger }}>{error}</Text>
        </Card>
      )}

      <CoverPhotoCard
        photoUrl={photoUrl}
        alt={name}
        onFileSelected={handlePhotoUpload}
        onRemove={handleRemovePhoto}
      />

      {/* Basic Info */}
      <Card style={{ ...cardStyle, marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <Input
            label={t('recipeEditor.name')}
            placeholder={t('recipeEditor.namePlaceholder')}
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
          />
          <div>
            <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text, fontSize: theme.typography.small.fontSize }}>
              {t('recipeEditor.description')}
            </label>
            <RichTextEditor
              value={description}
              onChange={(html) => { setDescription(html); markDirty(); }}
              onUploadImage={uploadInlineImage}
              placeholder={t('recipeEditor.descriptionPlaceholder')}
            />
          </div>

          {/* Visibility toggle */}
          <div>
            <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text, fontSize: theme.typography.small.fontSize }}>
              {t('recipes.visibility')}
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.xs }}>
              <button
                onClick={() => { setVisibility('private'); markDirty(); }}
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.small.fontSize,
                  fontWeight: '600',
                  border: `2px solid ${visibility === 'private' ? theme.palette.border : theme.palette.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: visibility === 'private' ? theme.palette.surface : 'transparent',
                  color: visibility === 'private' ? theme.palette.text : theme.palette.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                 {t('recipes.visibilityPrivate')}
              </button>
              <button
                onClick={() => { setVisibility('public'); markDirty(); }}
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.small.fontSize,
                  fontWeight: '600',
                  border: `2px solid ${visibility === 'public' ? theme.palette.primary : theme.palette.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: visibility === 'public' ? theme.palette.primary + '20' : 'transparent',
                  color: visibility === 'public' ? theme.palette.primary : theme.palette.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                 {t('recipes.visibilityPublic')}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Calculation Mode */}
      <Card style={{ ...cardStyle, marginBottom: '12px' }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipeEditor.calculationMode')}</Text>
        <div style={{ display: 'flex', gap: theme.spacing.xs }}>
          {(['manual', 'ingredients', 'mixed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setCalculationMode(mode); markDirty(); }}
              style={{
                flex: 1,
                padding: theme.spacing.sm,
                fontSize: theme.typography.small.fontSize,
                fontWeight: '600',
                border: `2px solid ${calculationMode === mode ? theme.palette.primary : theme.palette.border}`,
                borderRadius: theme.radius.md,
                backgroundColor: calculationMode === mode ? theme.palette.primary + '20' : 'transparent',
                color: calculationMode === mode ? theme.palette.primary : theme.palette.text,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {t(`recipeEditor.${mode}`)}
            </button>
          ))}
        </div>
      </Card>

      {/* Manual KBJU */}
      {(calculationMode === 'manual' || calculationMode === 'mixed') && (
        <Card style={{ ...cardStyle, marginBottom: '12px' }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
            {calculationMode === 'mixed' ? t('recipeEditor.mixed') + ' — КБЖУ' : t('recipeEditor.manual') + ' — КБЖУ'}
          </Text>
          <Text variant="small" muted style={{ marginBottom: theme.spacing.sm, display: 'block' }}>
            {t('recipes.per100g')}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            <Input
              label={t('recipeEditor.manualKcal')}
              type="number"
              inputMode="decimal"
              value={manualKcal}
              onChange={(e) => { setManualKcal(e.target.value); markDirty(); }}
              placeholder="0"
            />
            <Input
              label={t('recipeEditor.manualProtein')}
              type="number"
              inputMode="decimal"
              value={manualProtein}
              onChange={(e) => { setManualProtein(e.target.value); markDirty(); }}
              placeholder="0"
            />
            <Input
              label={t('recipeEditor.manualFat')}
              type="number"
              inputMode="decimal"
              value={manualFat}
              onChange={(e) => { setManualFat(e.target.value); markDirty(); }}
              placeholder="0"
            />
            <Input
              label={t('recipeEditor.manualCarb')}
              type="number"
              inputMode="decimal"
              value={manualCarb}
              onChange={(e) => { setManualCarb(e.target.value); markDirty(); }}
              placeholder="0"
            />
          </div>
        </Card>
      )}

      {calculationMode !== 'manual' && (
        <IngredientsCard
          ingredients={ingredients}
          onAdd={addIngredient}
          onUpdateGrams={updateIngredientGrams}
          onRemove={removeIngredient}
        />
      )}

      {/* Total Weight */}
      <Card style={{ ...cardStyle, marginBottom: '12px' }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipeEditor.totalWeight')}</Text>
        <Text variant="small" muted style={{ marginBottom: theme.spacing.sm, display: 'block' }}>
          {t('recipeEditor.totalWeightHint')}
        </Text>
        <Input
          type="number"
          inputMode="decimal"
          placeholder={t('recipeEditor.totalWeightPlaceholder')}
          value={totalCookedWeightG}
          onChange={(e) => { setTotalCookedWeightG(e.target.value); markDirty(); }}
        />
        {calculationMode !== 'manual' && ingredients.length > 0 && (
          <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.sm, flexWrap: 'wrap' }}>
            <Button size="sm" variant="ghost" onClick={handleSetWeightToIngredientsSum}>
              {t('recipeEditor.weightEqualsSum')} ({ingredientsWeightSum}г)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleSetWeightPercent(0.9)}>
              {t('recipeEditor.weightMinus10')} ({Math.round(ingredientsWeightSum * 0.9)}г)
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleSetWeightPercent(0.8)}>
              {t('recipeEditor.weightMinus20')} ({Math.round(ingredientsWeightSum * 0.8)}г)
            </Button>
          </div>
        )}
      </Card>

      {/* Serving info */}
      <Card style={{ ...cardStyle, marginBottom: '12px' }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipeEditor.servingName')}</Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
          <Input
            label={t('recipeEditor.servingName')}
            placeholder="тарелка"
            value={servingName}
            onChange={(e) => { setServingName(e.target.value); markDirty(); }}
          />
          <Input
            label={t('recipeEditor.servingGrams')}
            type="number"
            inputMode="decimal"
            placeholder="250"
            value={servingGrams}
            onChange={(e) => { setServingGrams(e.target.value); markDirty(); }}
          />
        </div>
      </Card>

      {/* Result summary */}
      <Card style={{ ...cardStyle, marginBottom: '12px', border: `1px solid ${theme.palette.primary}55` }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipeEditor.resultTitle')}</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm, textAlign: 'center' }}>
          <div>
            <Text bold style={{ fontSize: '20px', display: 'block', color: theme.palette.primary }}>{finalPer100g.kcal.toFixed(0)}</Text>
            <Text variant="small" muted>ккал</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '20px', display: 'block' }}>{finalPer100g.protein.toFixed(1)}</Text>
            <Text variant="small" muted>белки</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '20px', display: 'block' }}>{finalPer100g.fat.toFixed(1)}</Text>
            <Text variant="small" muted>жиры</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '20px', display: 'block' }}>{finalPer100g.carb.toFixed(1)}</Text>
            <Text variant="small" muted>углеводы</Text>
          </div>
        </div>

        {/* Macro sum warning */}
        {(() => {
          const macrosSum = finalPer100g.protein + finalPer100g.fat + finalPer100g.carb;
          if (macrosSum > 100) {
            return (
              <div style={{ marginTop: theme.spacing.sm, padding: theme.spacing.sm, backgroundColor: theme.palette.danger + '20', borderRadius: theme.radius.sm }}>
                <Text variant="small" style={{ color: theme.palette.danger }}>
                   Сумма Б+Ж+У = {macrosSum.toFixed(1)}г превышает 100г/100г
                </Text>
              </div>
            );
          }
          return null;
        })()}

        {/* Calorie consistency warning */}
        {(() => {
          const expectedKcal = finalPer100g.protein * 4 + finalPer100g.fat * 9 + finalPer100g.carb * 4;
          if (finalPer100g.kcal > 0 && expectedKcal > 0) {
            const diff = Math.abs(finalPer100g.kcal - expectedKcal);
            const pctDiff = (diff / expectedKcal) * 100;
            if (pctDiff > 20) {
              return (
                <div style={{ marginTop: theme.spacing.sm, padding: theme.spacing.sm, backgroundColor: '#FFA500' + '20', borderRadius: theme.radius.sm }}>
                  <Text variant="small" style={{ color: '#FFA500' }}>
                     Калории не соответствуют макросам (ожидается ~{Math.round(expectedKcal)} ккал)
                  </Text>
                </div>
              );
            }
          }
          return null;
        })()}

        {servingGrams && parseFloat(servingGrams) > 0 && (
          <div style={{ marginTop: theme.spacing.sm, textAlign: 'center' }}>
            <Text variant="small" muted>
              {servingName || 'Порция'} ({servingGrams}г): {((finalPer100g.kcal * parseFloat(servingGrams)) / 100).toFixed(0)} ккал
            </Text>
          </div>
        )}
      </Card>

      {/* Sticky Save Button */}
      <div style={{
        position: 'sticky',
        bottom: '0',
        padding: theme.spacing.md,
        background: 'rgba(8, 21, 35, 0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(160, 200, 220, 0.18)',
        zIndex: 5,
        marginTop: theme.spacing.md,
        margin: `${theme.spacing.md} -12px 0`,
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 12px' }}>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? t('common.saving') : isEdit ? t('recipeEditor.saveChanges') : t('recipeEditor.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
