export const ru = {
  // App
  app: {
    name: 'FlareonFit',
  },
  // Common
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    save: 'Сохранить',
    saving: 'Сохранение...',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    search: 'Поиск...',
  },

  // Home
  home: {
    title: 'Вход выполнен',
    userId: 'ID пользователя',
    tgUserId: 'Telegram User ID',
    username: 'Имя пользователя',
    goToToday: 'Перейти к сегодня',
    notLoggedIn: 'Не вошел в систему',
    tgNotAvailable: 'Telegram WebApp недоступен. Откройте это приложение в Telegram.',
    initDataNotAvailable: 'InitData недоступен. Откройте это приложение в Telegram WebApp.',
    authFailed: 'Ошибка аутентификации',
  },

  // Today
  today: {
    title: 'Сегодня',
    dateTitle: 'Сегодня — {date}',
    totals: 'Итого',
    entries: 'Записи',
    noEntries: 'Нет записей на сегодня',
    addEntry: '+ Добавить запись',
    deleteConfirm: 'Удалить эту запись?',
    deleteFailed: 'Не удалось удалить запись',
    entriesCount: '{count} записей',
    entriesCount_one: '{count} запись',
    entriesCount_few: '{count} записи',
    entriesCount_many: '{count} записей',
  },

  // Totals
  totals: {
    kcal: '{value} ккал',
    protein: 'Б: {value}г',
    fat: 'Ж: {value}г',
    carb: 'У: {value}г',
    macros: 'Б: {protein}г | Ж: {fat}г | У: {carb}г',
  },

  // Entry
  entry: {
    add: 'Добавить запись',
    edit: 'Редактировать запись',
    date: 'Дата (ГГГГ-ММ-ДД)',
    time: 'Время (ЧЧ:мм) - Необязательно',
    mealType: 'Тип приема пищи',
    product: 'Продукт',
    productSearch: 'Поиск продуктов...',
    grams: 'Граммы',
    gramsPlaceholder: 'Введите граммы',
    selected: 'Выбрано: {name}',
    noProductSelected: 'Пожалуйста, выберите продукт',
    invalidGrams: 'Пожалуйста, введите граммы > 0',
    saveFailed: 'Не удалось сохранить запись',
    loadFailed: 'Не удалось загрузить запись',
    selectProduct: 'Пожалуйста, выберите продукт',
  },

  // Meal types
  mealType: {
    other: 'Другое',
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
  },

  // Products
  products: {
    title: 'Продукты',
    searchPlaceholder: 'Поиск продуктов...',
    noProductsFound: 'Продукты не найдены',
    calories: 'Калории: {value} ккал/100г',
    loadFailed: 'Не удалось загрузить продукты',
  },

  // Stats
  stats: {
    loadFailed: 'Не удалось загрузить статистику',
  },
};
