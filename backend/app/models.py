import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    locale = Column(SAEnum("en", "fr", "de", name="locale_enum"), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    apiaries = relationship("Apiary", back_populates="user", cascade="all, delete-orphan")
    field_definitions = relationship("FieldDefinition", back_populates="user", cascade="all, delete-orphan")
    qr_batches = relationship("QrBatch", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_tokens")


class Apiary(Base):
    __tablename__ = "apiaries"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    city_name = Column(String, nullable=True)
    city_latitude = Column(Float, nullable=True)
    city_longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="apiaries")
    hives = relationship("Hive", back_populates="apiary")
    field_definitions = relationship("FieldDefinition", back_populates="apiary", cascade="all, delete-orphan")


class FieldDefinition(Base):
    __tablename__ = "field_definitions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    apiary_id = Column(String, ForeignKey("apiaries.id"), nullable=True)
    scope = Column(SAEnum("user", "apiary", name="field_scope_enum"), nullable=False)
    target = Column(SAEnum("hive", "inspection", name="field_target_enum"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(SAEnum("text", "number", "boolean", "date", "select", name="field_type_enum"), nullable=False)
    options = Column(JSON, default=list)
    required = Column(Boolean, default=False)
    default_value = Column(JSON, nullable=True)
    sort_order = Column(Integer, default=0)

    user = relationship("User", back_populates="field_definitions")
    apiary = relationship("Apiary", back_populates="field_definitions")


class QrBatch(Base):
    __tablename__ = "qr_batches"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="qr_batches")
    tokens = relationship("QrToken", back_populates="batch", cascade="all, delete-orphan")


class QrToken(Base):
    __tablename__ = "qr_tokens"

    token = Column(String, primary_key=True, default=_uuid)
    batch_id = Column(String, ForeignKey("qr_batches.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    batch = relationship("QrBatch", back_populates="tokens")
    hive = relationship("Hive", back_populates="qr_token_rel", uselist=False)


class Hive(Base):
    __tablename__ = "hives"

    id = Column(String, primary_key=True, default=_uuid)
    qr_token = Column(String, ForeignKey("qr_tokens.token"), unique=True, nullable=False)
    apiary_id = Column(String, ForeignKey("apiaries.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    hive_type = Column(
        SAEnum("langstroth", "dadant", "top_bar", "warre", "other", name="hive_type_enum"),
        default="langstroth"
    )
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    acquisition_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    custom_fields = Column(JSON, default=dict)
    initialized_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    apiary = relationship("Apiary", back_populates="hives")
    qr_token_rel = relationship("QrToken", back_populates="hive")
    inspections = relationship("Inspection", back_populates="hive", cascade="all, delete-orphan")

    @property
    def last_inspection_at(self):
        if not self.inspections:
            return None
        return max(i.created_at for i in self.inspections)


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, default=_uuid)
    hive_id = Column(String, ForeignKey("hives.id"), nullable=False)
    date = Column(Date, nullable=False)
    queen_seen = Column(Boolean, nullable=True)
    queen_color = Column(
        SAEnum("white", "yellow", "red", "green", "blue", name="queen_color_enum"),
        nullable=True
    )
    brood_frames = Column(Integer, nullable=True)
    honey_frames = Column(Integer, nullable=True)
    mood = Column(SAEnum("calm", "nervous", "aggressive", name="mood_enum"), nullable=True)
    population_strength = Column(Integer, nullable=True)
    varroa_count = Column(Integer, nullable=True)
    swarm_cells_seen = Column(Boolean, nullable=True)
    treatment_applied = Column(String, nullable=True)
    feeding_done = Column(Boolean, nullable=True)
    feeding_type = Column(String, nullable=True)
    weight_kg = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    custom_fields = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    hive = relationship("Hive", back_populates="inspections")
