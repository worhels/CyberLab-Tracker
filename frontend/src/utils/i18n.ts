import type { Language } from '../types'

export type TranslationKey =
  | 'account'
  | 'accentColor'
  | 'active'
  | 'all'
  | 'apiConnected'
  | 'behavior'
  | 'calendar'
  | 'calendarSubtitle'
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
  | 'dataExport'
  | 'dataExportDescription'
  | 'deadlineReminders'
  | 'deadlineRemindersDescription'
  | 'email'
  | 'english'
  | 'exportCsv'
  | 'exporting'
  | 'exportJson'
  | 'exportStarted'
  | 'interface'
  | 'language'
  | 'light'
  | 'logout'
  | 'mentor.action.build'
  | 'mentor.action.close'
  | 'mentor.action.download'
  | 'mentor.action.downloading'
  | 'mentor.action.send'
  | 'mentor.artifact.created'
  | 'mentor.artifact.defaultRounds'
  | 'mentor.artifact.files'
  | 'mentor.build.empty'
  | 'mentor.context'
  | 'mentor.empty'
  | 'mentor.error.offline'
  | 'mentor.hint.build'
  | 'mentor.hint.send'
  | 'mentor.mode.build'
  | 'mentor.mode.build.description'
  | 'mentor.mode.chat'
  | 'mentor.mode.chat.description'
  | 'mentor.mode.code'
  | 'mentor.mode.code.description'
  | 'mentor.mode.deadline'
  | 'mentor.mode.deadline.description'
  | 'mentor.mode.lab'
  | 'mentor.mode.lab.description'
  | 'mentor.mode.report'
  | 'mentor.mode.report.description'
  | 'mentor.placeholder'
  | 'mentor.placeholder.build'
  | 'mentor.quick.accepted'
  | 'mentor.quick.activeLabs'
  | 'mentor.quick.deadlines'
  | 'mentor.quick.urgent'
  | 'mentor.status.offline'
  | 'mentor.status.ready'
  | 'mentor.status.thinking'
  | 'mentor.subtitle'
  | 'mentor.title'
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
    calendar: 'Календарь',
    calendarSubtitle: 'Задачи по локальной дате: просроченные, сегодняшние, будущие и без срока.',
    dataExport: 'Экспорт данных',
    dataExportDescription: 'Скачать предметы, задачи и временные метки рабочей области.',
    exportCsv: 'Экспорт CSV',
    exporting: 'Экспорт...',
    exportJson: 'Экспорт JSON',
    exportStarted: 'Загрузка экспорта началась.',
    account: 'Аккаунт',
    accentColor: 'Цвет акцента',
    active: 'активно',
    all: 'всего',
    apiConnected: 'API подключен',
    behavior: 'Поведение',
    comfortable: 'Обычный',
    compact: 'Компактный',
    crisisCube: 'Кризисный куб',
    crisisCubeDescription: 'Показывать 3D-объем на странице кризисного режима.',
    crisisMode: 'Кризисный режим',
    crisisModeSubtitle: 'Задачи с самым высоким риском, отсортированные по кризисному весу.',
    dashboard: 'Дашборд',
    dashboardDensity: 'Плотность дашборда',
    dashboardSubtitle: 'Нагрузка, прогресс и ближайшие риски в одном рабочем экране.',
    dark: 'Темная',
    deadlineReminders: 'Напоминания о дедлайнах',
    deadlineRemindersDescription: 'Показывать поверхности с напоминаниями по срокам.',
    email: 'Email',
    english: 'Английский',
    interface: 'Интерфейс',
    language: 'Язык',
    light: 'Светлая',
    logout: 'Выйти',
    'mentor.action.build': 'Собрать',
    'mentor.action.close': 'Закрыть CyberMentor',
    'mentor.action.download': 'Скачать ZIP',
    'mentor.action.downloading': 'Скачивание...',
    'mentor.action.send': 'Отправить сообщение',
    'mentor.artifact.created': 'Создано',
    'mentor.artifact.defaultRounds': 'Раунды по умолчанию',
    'mentor.artifact.files': 'Файлы',
    'mentor.build.empty': 'Опиши цель — Mentor соберёт безопасную bcrypt timing web-лабораторную и вернёт ZIP с файлами и контрольными SHA-256.',
    'mentor.context': 'Контекст',
    'mentor.empty': 'Спроси о работе: Mentor сам определит intent и учтёт выбранную задачу.',
    'mentor.error.offline': 'Локальная AI-модель не отвечает. Запусти Ollama и проверь установленные модели из README.',
    'mentor.hint.build': 'Enter — собрать',
    'mentor.hint.send': 'Enter — отправить',
    'mentor.mode.build': 'Сборка',
    'mentor.mode.build.description': 'Создать изолированный bcrypt timing web-проект по заданной цели.',
    'mentor.mode.chat': 'Чат',
    'mentor.mode.chat.description': 'Можно просто обсудить идею, интерфейс, код, дедлайн или проект.',
    'mentor.mode.code': 'Код',
    'mentor.mode.code.description': 'Конкретный разбор ошибки и минимальный рабочий фикс.',
    'mentor.mode.deadline': 'Дедлайн',
    'mentor.mode.deadline.description': 'Короткий план действий, который помогает успеть сдать.',
    'mentor.mode.lab': 'Лаба',
    'mentor.mode.lab.description': 'Пошаговая помощь с лабораторной и результатом для сдачи.',
    'mentor.mode.report': 'Отчёт',
    'mentor.mode.report.description': 'Готовая структура и формулировки для Word.',
    'mentor.placeholder': 'Спроси про задачи, код, отчёт, дедлайны или проект...',
    'mentor.placeholder.build': 'Опиши цель для bcrypt timing web-проекта...',
    'mentor.quick.accepted': 'Что уже принято?',
    'mentor.quick.activeLabs': 'Покажи активные лабы',
    'mentor.quick.deadlines': 'Покажи ближайшие дедлайны',
    'mentor.quick.urgent': 'Что сейчас горит?',
    'mentor.status.offline': 'Offline',
    'mentor.status.ready': 'Local AI',
    'mentor.status.thinking': 'Думает',
    'mentor.subtitle': 'Локальный AI-наставник с автоматическим контекстом запроса.',
    'mentor.title': 'CyberMentor',
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
    calendar: 'Календар',
    calendarSubtitle: 'Завдання за локальною датою: прострочені, сьогоднішні, майбутні та без строку.',
    dataExport: 'Експорт даних',
    dataExportDescription: 'Завантажити предмети, завдання та часові мітки робочого простору.',
    exportCsv: 'Експорт CSV',
    exporting: 'Експорт...',
    exportJson: 'Експорт JSON',
    exportStarted: 'Завантаження експорту розпочато.',
    account: 'Акаунт',
    accentColor: 'Колір акценту',
    active: 'активно',
    all: 'усього',
    apiConnected: 'API підключено',
    behavior: 'Поведінка',
    comfortable: 'Звичайний',
    compact: 'Компактний',
    crisisCube: 'Кризовий куб',
    crisisCubeDescription: 'Показувати 3D-обсяг на сторінці кризового режиму.',
    crisisMode: 'Кризовий режим',
    crisisModeSubtitle: 'Задачі з найвищим ризиком, відсортовані за кризовою вагою.',
    dashboard: 'Дашборд',
    dashboardDensity: 'Щільність дашборду',
    dashboardSubtitle: 'Навантаження, прогрес і найближчі ризики в одному робочому екрані.',
    dark: 'Темна',
    deadlineReminders: 'Нагадування про дедлайни',
    deadlineRemindersDescription: 'Показувати поверхні з нагадуваннями про строки.',
    email: 'Email',
    english: 'Англійська',
    interface: 'Інтерфейс',
    language: 'Мова',
    light: 'Світла',
    logout: 'Вийти',
    'mentor.action.build': 'Зібрати',
    'mentor.action.close': 'Закрити CyberMentor',
    'mentor.action.download': 'Завантажити ZIP',
    'mentor.action.downloading': 'Завантаження...',
    'mentor.action.send': 'Надіслати повідомлення',
    'mentor.artifact.created': 'Створено',
    'mentor.artifact.defaultRounds': 'Раунди за замовчуванням',
    'mentor.artifact.files': 'Файли',
    'mentor.build.empty': 'Опиши мету — Mentor збере безпечну bcrypt timing web-лабораторну та поверне ZIP із файлами й контрольними SHA-256.',
    'mentor.context': 'Контекст',
    'mentor.empty': 'Запитай про роботу: Mentor сам визначить intent і врахує вибране завдання.',
    'mentor.error.offline': 'Локальна AI-модель не відповідає. Запусти Ollama та перевір встановлені моделі з README.',
    'mentor.hint.build': 'Enter — зібрати',
    'mentor.hint.send': 'Enter — надіслати',
    'mentor.mode.build': 'Збірка',
    'mentor.mode.build.description': 'Створити ізольований bcrypt timing web-проєкт за заданою метою.',
    'mentor.mode.chat': 'Чат',
    'mentor.mode.chat.description': 'Можна просто обговорити ідею, інтерфейс, код, дедлайн або проєкт.',
    'mentor.mode.code': 'Код',
    'mentor.mode.code.description': 'Конкретний розбір помилки та мінімальне робоче виправлення.',
    'mentor.mode.deadline': 'Дедлайн',
    'mentor.mode.deadline.description': 'Короткий план дій, який допомагає встигнути здати.',
    'mentor.mode.lab': 'Лаба',
    'mentor.mode.lab.description': 'Покрокова допомога з лабораторною та результатом для здачі.',
    'mentor.mode.report': 'Звіт',
    'mentor.mode.report.description': 'Готова структура та формулювання для Word.',
    'mentor.placeholder': 'Запитай про завдання, код, звіт, дедлайни або проєкт...',
    'mentor.placeholder.build': 'Опиши мету для bcrypt timing web-проєкту...',
    'mentor.quick.accepted': 'Що вже прийнято?',
    'mentor.quick.activeLabs': 'Покажи активні лаби',
    'mentor.quick.deadlines': 'Покажи найближчі дедлайни',
    'mentor.quick.urgent': 'Що зараз горить?',
    'mentor.status.offline': 'Offline',
    'mentor.status.ready': 'Local AI',
    'mentor.status.thinking': 'Думає',
    'mentor.subtitle': 'Локальний AI-наставник з автоматичним контекстом запиту.',
    'mentor.title': 'CyberMentor',
    name: "Ім'я",
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
    calendar: 'Calendar',
    calendarSubtitle: 'Tasks grouped by local date, with overdue work and unscheduled items separated.',
    dataExport: 'Data export',
    dataExportDescription: 'Download workspace subjects, tasks, and timestamps.',
    exportCsv: 'Export CSV',
    exporting: 'Exporting...',
    exportJson: 'Export JSON',
    exportStarted: 'Export download started.',
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
    logout: 'Logout',
    'mentor.action.build': 'Build',
    'mentor.action.close': 'Close CyberMentor',
    'mentor.action.download': 'Download ZIP',
    'mentor.action.downloading': 'Downloading...',
    'mentor.action.send': 'Send message',
    'mentor.artifact.created': 'Created',
    'mentor.artifact.defaultRounds': 'Default rounds',
    'mentor.artifact.files': 'Files',
    'mentor.build.empty': 'Describe the goal. Mentor will build a safe bcrypt timing web lab and return a ZIP with file checksums.',
    'mentor.context': 'Context',
    'mentor.empty': 'Ask about your work. Mentor detects the intent and uses the selected task.',
    'mentor.error.offline': 'The local AI model is not responding. Start Ollama and check the models listed in README.',
    'mentor.hint.build': 'Enter to build',
    'mentor.hint.send': 'Enter to send',
    'mentor.mode.build': 'Build',
    'mentor.mode.build.description': 'Create an isolated bcrypt timing web project for the stated goal.',
    'mentor.mode.chat': 'Chat',
    'mentor.mode.chat.description': 'Discuss an idea, interface, code, deadline, or project freely.',
    'mentor.mode.code': 'Code',
    'mentor.mode.code.description': 'A focused error analysis and the smallest working fix.',
    'mentor.mode.deadline': 'Deadline',
    'mentor.mode.deadline.description': 'A short action plan focused on getting the work submitted.',
    'mentor.mode.lab': 'Lab',
    'mentor.mode.lab.description': 'Step-by-step help with a lab and a submission-ready result.',
    'mentor.mode.report': 'Report',
    'mentor.mode.report.description': 'A ready-to-use structure and wording for Word.',
    'mentor.placeholder': 'Ask about tasks, code, reports, deadlines, or the project...',
    'mentor.placeholder.build': 'Describe the goal for the bcrypt timing web project...',
    'mentor.quick.accepted': 'What is already accepted?',
    'mentor.quick.activeLabs': 'Show active labs',
    'mentor.quick.deadlines': 'Show nearest deadlines',
    'mentor.quick.urgent': 'What is urgent?',
    'mentor.status.offline': 'Offline',
    'mentor.status.ready': 'Local AI',
    'mentor.status.thinking': 'Thinking',
    'mentor.subtitle': 'Local AI guidance with automatic request context.',
    'mentor.title': 'CyberMentor',
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
