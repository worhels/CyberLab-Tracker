from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.subject import Subject
from app.models.task import Task, TaskPriority, TaskStatus, TaskType
from app.models.user import User

DEMO_EMAIL = "demo@cyberlab.local"
DEMO_PASSWORD = "password123"

SUBJECTS = [
    {
        "name": "Основи криптографічного захисту інформації",
        "color": "#2563eb",
        "teacher": "Демо викладач",
        "semester": "2026 весна",
        "description": "Криптографія, лабораторні та дедлайни по захисту інформації.",
    },
    {
        "name": "Об’єктно-орієнтоване програмування",
        "color": "#16a34a",
        "teacher": "Демо викладач",
        "semester": "2026 весна",
        "description": "Практика ООП, курсові задачі та репозиторії з кодом.",
    },
    {
        "name": "Основи тестування ПЗ",
        "color": "#f97316",
        "teacher": "Демо викладач",
        "semester": "2026 весна",
        "description": "Тест-дизайн, чеклісти, баг-репорти та автоматизація.",
    },
    {
        "name": "Адміністрування Linux",
        "color": "#7c3aed",
        "teacher": "Демо викладач",
        "semester": "2026 весна",
        "description": "Linux, shell, права доступу, сервіси та мережеве адміністрування.",
    },
]


def demo_tasks(now: datetime) -> list[dict]:
    return [
        {
            "subject_name": "Основи криптографічного захисту інформації",
            "title": "Лабораторна: шифр Цезаря та частотний аналіз",
            "description": "Підготувати код, README та короткий звіт.",
            "deadline": now + timedelta(days=1),
            "type": TaskType.LAB,
            "status": TaskStatus.IN_PROGRESS,
            "priority": TaskPriority.HIGH,
            "estimated_hours": 6,
            "github_url": "https://github.com/worhels/CyberLab-Tracker",
            "moodle_url": "https://moodle.example.local/mod/assign/view.php?id=crypto-lab-1",
            "report_file": "reports/crypto-lab-1.pdf",
        },
        {
            "subject_name": "Об’єктно-орієнтоване програмування",
            "title": "Курсова: модель трекера задач",
            "description": "Описати сутності, зв'язки та базові сценарії.",
            "deadline": now + timedelta(days=3),
            "type": TaskType.COURSEWORK,
            "status": TaskStatus.NOT_STARTED,
            "priority": TaskPriority.CRITICAL,
            "estimated_hours": 12,
            "github_url": "https://github.com/worhels/CyberLab-Tracker",
            "moodle_url": "https://moodle.example.local/mod/assign/view.php?id=oop-coursework",
            "report_file": "reports/oop-coursework.docx",
        },
        {
            "subject_name": "Основи тестування ПЗ",
            "title": "Практика: тест-кейси для авторизації",
            "description": "Скласти позитивні та негативні тест-кейси.",
            "deadline": now + timedelta(days=7),
            "type": TaskType.PRACTICE,
            "status": TaskStatus.SUBMITTED,
            "priority": TaskPriority.MEDIUM,
            "estimated_hours": 3,
            "submitted_at": now - timedelta(hours=2),
            "moodle_url": "https://moodle.example.local/mod/assign/view.php?id=testing-practice",
            "report_file": "reports/auth-test-cases.xlsx",
        },
        {
            "subject_name": "Адміністрування Linux",
            "title": "Борг: налаштування systemd service",
            "description": "Доробити сервіс, логування та автозапуск.",
            "deadline": now - timedelta(days=2),
            "type": TaskType.LAB,
            "status": TaskStatus.DEBT,
            "priority": TaskPriority.HIGH,
            "estimated_hours": 8,
            "github_url": "https://github.com/worhels/CyberLab-Tracker",
            "moodle_url": "https://moodle.example.local/mod/assign/view.php?id=linux-systemd",
            "report_file": "reports/linux-systemd.pdf",
        },
        {
            "subject_name": "Основи криптографічного захисту інформації",
            "title": "Іспит: повторити хеш-функції та цифровий підпис",
            "description": "Підготувати конспект по основних визначеннях.",
            "deadline": now + timedelta(days=14),
            "type": TaskType.EXAM,
            "status": TaskStatus.NOT_STARTED,
            "priority": TaskPriority.MEDIUM,
            "estimated_hours": 5,
        },
    ]


def get_or_create_demo_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    if user is not None:
        return user

    user = User(
        email=DEMO_EMAIL,
        hashed_password=get_password_hash(DEMO_PASSWORD),
        full_name="CyberLab Demo",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def upsert_subjects(db: Session, user: User) -> dict[str, Subject]:
    subjects: dict[str, Subject] = {}
    for item in SUBJECTS:
        subject = db.scalar(select(Subject).where(Subject.user_id == user.id, Subject.name == item["name"]))
        if subject is None:
            subject = Subject(user_id=user.id, **item)
            db.add(subject)
        else:
            for key, value in item.items():
                setattr(subject, key, value)
        subjects[item["name"]] = subject

    db.commit()
    for subject in subjects.values():
        db.refresh(subject)
    return subjects


def upsert_tasks(db: Session, subjects: dict[str, Subject], now: datetime) -> int:
    count = 0
    for item in demo_tasks(now):
        subject = subjects[item.pop("subject_name")]
        task = db.scalar(select(Task).where(Task.subject_id == subject.id, Task.title == item["title"]))
        if task is None:
            task = Task(subject_id=subject.id, **item)
            db.add(task)
        else:
            for key, value in item.items():
                setattr(task, key, value)
        count += 1

    db.commit()
    return count


def main() -> None:
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        user = get_or_create_demo_user(db)
        subjects = upsert_subjects(db, user)
        task_count = upsert_tasks(db, subjects, now)

    print(f"Seeded demo user {DEMO_EMAIL} / {DEMO_PASSWORD}")
    print(f"Seeded {len(subjects)} subjects and {task_count} tasks")


if __name__ == "__main__":
    main()
