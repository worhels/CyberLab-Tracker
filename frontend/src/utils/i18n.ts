import type { Language } from '../types'

export type TranslationKey =
  | 'account'
  | 'accentColor'
  | 'active'
  | 'all'
  | 'apiConnected'
  | 'behavior'
  | 'comfortable'
  | 'compact'
  | 'crisisCube'
  | 'crisisCubeDescription'
  | 'crisisMode'
  | 'crisisModeSubtitle'
  | 'dashboard'
  | 'dashboardDensity'
  | 'dashboardSubtitle'
  | 'dark'
  | 'deadlineReminders'
  | 'deadlineRemindersDescription'
  | 'email'
  | 'english'
  | 'interface'
  | 'language'
  | 'light'
  | 'name'
  | 'navSubjects'
  | 'navTasks'
  | 'notSet'
  | 'reducedMotion'
  | 'reducedMotionDescription'
  | 'settings'
  | 'settingsSaved'
  | 'settingsSubtitle'
  | 'showCrisisCube'
  | 'studyControlCenter'
  | 'system'
  | 'systemOnline'
  | 'theme'
  | 'ukrainian'
  | 'russian'
  | 'workspace'
  | 'zerkalo'

const translations: Record<Language, Record<TranslationKey, string>> = {
  ru: {
    account: 'Аккаунт',
    accentColor: 'Цвет акцента',
    active: 'активно',
    all: 'всего',
    apiConnected: 'API подключен',
    behavior: 'Поведение',
    comfortable: 'Обычный',
    compact: 'Компактный',
    crisisCube: 'Кризисный куб',
    crisisCubeDescription: 'Показывать 3D-объем на странице Crisis Mode.',
    crisisMode: 'Кризисный режим',
    crisisModeSubtitle: 'Задачи с самым высоким риском, отсортированные по кризисному весу.',
    dashboard: 'Дашборд',
    dashboardDensity: 'Плотность дашборда',
    dashboardSubtitle: 'Нагрузка, прогресс и ближайшие риски в одном рабочем экране.',
    dark: 'Темная',
    deadlineReminders: 'Напоминания о дедлайнах',
    deadlineRemindersDescription: 'Оставить включенными поверхности с напоминаниями по срокам.',
    email: 'Email',
    english: 'Английский',
    interface: 'Интерфейс',
    language: 'Язык',
    light: 'Светлая',
    name: 'Имя',
    navSubjects: 'Предметы',
    navTasks: 'Задачи',
    notSet: 'Не задано',
    reducedMotion: 'Меньше анимаций',
    reducedMotionDescription: 'Отключить тяжелые фоновые эффекты и резкие переходы.',
    russian: 'Русский',
    settings: 'Настройки',
    settingsSaved: 'Настройки сохранены',
    settingsSubtitle: 'Персонализация интерфейса и поведения CyberLab Tracker.',
    showCrisisCube: 'Показывать куб',
    studyControlCenter: 'Центр управления учебой',
    system: 'Как в системе',
    systemOnline: 'Система онлайн',
    theme: 'Тема',
    ukrainian: 'Украинский',
    workspace: 'Рабочее пространство',
    zerkalo: 'Zerkalo',
  },
  uk: {
    account: 'Акаунт',
    accentColor: 'Колір акценту',
    active: 'активно',
    all: 'усього',
    apiConnected: 'API підключено',
    behavior: 'Поведінка',
    comfortable: 'Звичайний',
    compact: 'Компактний',
    crisisCube: 'Кризовий куб',
    crisisCubeDescription: 'Показувати 3D-обсяг на сторінці Crisis Mode.',
    crisisMode: 'Кризовий режим',
    crisisModeSubtitle: 'Задачі з найвищим ризиком, відсортовані за кризовою вагою.',
    dashboard: 'Дашборд',
    dashboardDensity: 'Щільність дашборду',
    dashboardSubtitle: 'Навантаження, прогрес і найближчі ризики в одному робочому екрані.',
    dark: 'Темна',
    deadlineReminders: 'Нагадування про дедлайни',
    deadlineRemindersDescription: 'Залишити увімкненими поверхні з нагадуваннями про строки.',
    email: 'Email',
    english: 'Англійська',
    interface: 'Інтерфейс',
    language: 'Мова',
    light: 'Світла',
    name: 'Імʼя',
    navSubjects: 'Предмети',
    navTasks: 'Задачі',
    notSet: 'Не задано',
    reducedMotion: 'Менше анімацій',
    reducedMotionDescription: 'Вимкнути важкі фонові ефекти та різкі переходи.',
    russian: 'Російська',
    settings: 'Налаштування',
    settingsSaved: 'Налаштування збережено',
    settingsSubtitle: 'Персоналізація інтерфейсу та поведінки CyberLab Tracker.',
    showCrisisCube: 'Показувати куб',
    studyControlCenter: 'Центр керування навчанням',
    system: 'Як у системі',
    systemOnline: 'Система онлайн',
    theme: 'Тема',
    ukrainian: 'Українська',
    workspace: 'Робочий простір',
    zerkalo: 'Zerkalo',
  },
  en: {
    account: 'Account',
    accentColor: 'Accent color',
    active: 'active',
    all: 'total',
    apiConnected: 'API Connected',
    behavior: 'Behavior',
    comfortable: 'Comfortable',
    compact: 'Compact',
    crisisCube: 'Crisis cube',
    crisisCubeDescription: 'Show the 3D crisis volume on Crisis Mode.',
    crisisMode: 'Crisis Mode',
    crisisModeSubtitle: 'Highest-risk tasks sorted by crisis score.',
    dashboard: 'Dashboard',
    dashboardDensity: 'Dashboard density',
    dashboardSubtitle: 'Workload, progress, and near-term risk in one control surface.',
    dark: 'Dark',
    deadlineReminders: 'Deadline reminders',
    deadlineRemindersDescription: 'Keep deadline reminder surfaces enabled.',
    email: 'Email',
    english: 'English',
    interface: 'Interface',
    language: 'Language',
    light: 'Light',
    name: 'Name',
    navSubjects: 'Subjects',
    navTasks: 'Tasks',
    notSet: 'Not set',
    reducedMotion: 'Reduced motion',
    reducedMotionDescription: 'Reduce heavy UI motion and background transitions.',
    russian: 'Russian',
    settings: 'Settings',
    settingsSaved: 'Settings saved',
    settingsSubtitle: 'Personalize CyberLab Tracker UI and workspace behavior.',
    showCrisisCube: 'Show cube',
    studyControlCenter: 'Study control center',
    system: 'System',
    systemOnline: 'System online',
    theme: 'Theme',
    ukrainian: 'Ukrainian',
    workspace: 'Workspace',
    zerkalo: 'Zerkalo',
  },
}

export function translate(language: Language, key: TranslationKey) {
  return translations[language]?.[key] ?? translations.en[key]
}
