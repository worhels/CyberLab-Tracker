from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate


def list_subjects(db: Session, user_id: int) -> list[Subject]:
    return list(db.scalars(select(Subject).where(Subject.user_id == user_id).order_by(Subject.name)))


def get_subject(db: Session, subject_id: int, user_id: int) -> Subject | None:
    return db.scalar(select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id))


def create_subject(db: Session, payload: SubjectCreate, user_id: int) -> Subject:
    subject = Subject(**payload.model_dump(), user_id=user_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def update_subject(db: Session, subject: Subject, payload: SubjectUpdate) -> Subject:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(subject, key, value)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, subject: Subject) -> None:
    db.delete(subject)
    db.commit()
