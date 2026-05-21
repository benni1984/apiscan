from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)
    locale: str = Field(default="en", pattern="^(en|fr|de|es)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CISetupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    token: str
    name: str = "CI Admin"


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    locale: str
    is_admin: bool
    is_supporter: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserOut


class AccessTokenResponse(BaseModel):
    access_token: str


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserUpdate(BaseModel):
    name: Optional[str] = None
    locale: Optional[str] = Field(default=None, pattern="^(en|fr|de|es)$")
    password: Optional[str] = Field(default=None, min_length=8)
    current_password: Optional[str] = None

    @model_validator(mode='after')
    def password_requires_current(self) -> 'UserUpdate':
        if self.password is not None and not self.current_password:
            raise ValueError('current_password is required when changing password')
        return self


class AdminUserDetail(BaseModel):
    id: str
    email: str
    name: str
    locale: str
    is_admin: bool
    is_supporter: bool
    created_at: datetime
    apiary_count: int
    hive_count: int
    inspection_count: int


class SupporterUpdate(BaseModel):
    is_supporter: bool


# ---------------------------------------------------------------------------
# Admin — platform stats
# ---------------------------------------------------------------------------

class AdminApiaryOut(BaseModel):
    id: str
    name: str
    owner_email: str
    latitude: Optional[float]
    longitude: Optional[float]
    hive_count: int
    is_public: bool
    created_at: datetime


class SignupDay(BaseModel):
    date: str
    count: int


class HealthSummary(BaseModel):
    inactive_users: int
    zero_inspection_hives: int
    no_varroa_inspections: int


class InactiveUserOut(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    apiary_count: int


class NoVarroaApiaryOut(BaseModel):
    apiary_id: str
    apiary_name: str
    owner_email: str
    missing_varroa_count: int


class ZeroInspectionHiveOut(BaseModel):
    id: str
    name: str
    hive_type: str
    apiary_id: str
    apiary_name: str
    owner_email: str
    initialized_at: datetime


class AdminTokenOut(BaseModel):
    id: str
    expires_at: datetime


class AdminTokenStats(BaseModel):
    total_active_sessions: int
    users_with_active_sessions: int
    avg_sessions_per_user: float


class AdminPlatformStats(BaseModel):
    preset: str
    total_users: int
    new_users_in_period: int
    supporter_count: int
    total_apiaries: int
    public_apiaries: int
    total_hives: int
    total_inspections: int
    active_users_30d: int
    signups_by_day: List[SignupDay]


# ---------------------------------------------------------------------------
# Field Definitions
# ---------------------------------------------------------------------------

class FieldDefinitionCreate(BaseModel):
    target: str = Field(pattern="^(hive|inspection)$")
    name: str = Field(min_length=1)
    type: str = Field(pattern="^(text|number|boolean|date|select)$")
    options: List[str] = Field(default_factory=list)
    required: bool = False
    default_value: Optional[Any] = None
    sort_order: int = 0


class FieldDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    options: Optional[List[str]] = None
    required: Optional[bool] = None
    default_value: Optional[Any] = None
    sort_order: Optional[int] = None


class FieldDefinitionOut(BaseModel):
    id: str
    scope: str
    apiary_id: Optional[str]
    target: str
    name: str
    type: str
    options: List[str]
    required: bool
    default_value: Optional[Any]
    sort_order: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Apiaries
# ---------------------------------------------------------------------------

class ApiaryCreate(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    is_public: bool = False


class ApiaryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    is_public: Optional[bool] = None


class ApiaryOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    hive_count: int
    is_public: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# QR Batches
# ---------------------------------------------------------------------------

class QrBatchCreate(BaseModel):
    count: int = Field(ge=1, le=50)


class QrTokenOut(BaseModel):
    token: str
    linked_hive_id: Optional[str]

    model_config = {"from_attributes": True}


class QrBatchOut(BaseModel):
    id: str
    count: int
    created_at: datetime
    tokens: List[QrTokenOut]

    model_config = {"from_attributes": True}


class QrBatchSummary(BaseModel):
    id: str
    count: int
    created_at: datetime
    linked_count: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Hives
# ---------------------------------------------------------------------------

class HiveCreate(BaseModel):
    name: str = Field(min_length=1)
    hive_type: str = Field(default="langstroth", pattern="^(langstroth|dadant|top_bar|warre|other)$")
    acquisition_date: Optional[date] = None
    notes: Optional[str] = None


class HiveInitialize(BaseModel):
    qr_token: str
    apiary_id: str
    name: str = Field(min_length=1)
    hive_type: str = Field(default="langstroth", pattern="^(langstroth|dadant|top_bar|warre|other)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acquisition_date: Optional[date] = None
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)


class HiveUpdate(BaseModel):
    apiary_id: Optional[str] = None
    name: Optional[str] = None
    hive_type: Optional[str] = Field(default=None, pattern="^(langstroth|dadant|top_bar|warre|other)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acquisition_date: Optional[date] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class HiveOut(BaseModel):
    id: str
    qr_token: str
    apiary_id: str
    name: str
    hive_type: str
    latitude: Optional[float]
    longitude: Optional[float]
    acquisition_date: Optional[date]
    notes: Optional[str]
    custom_fields: Dict[str, Any]
    initialized_at: datetime
    last_inspection_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class QrScanUnlinked(BaseModel):
    status: str = "unlinked"
    token: str


# ---------------------------------------------------------------------------
# Inspections
# ---------------------------------------------------------------------------

# _Date avoids field-name / type-name shadowing: Python assigns `date = None`
# before evaluating annotations, so `date: Optional[date]` would resolve to
# Optional[NoneType]. Using an alias keeps the module-level datetime.date.
_Date = date


class InspectionCreate(BaseModel):
    date: date
    queen_seen: Optional[bool] = None
    queen_color: Optional[str] = Field(default=None, pattern="^(white|yellow|red|green|blue)$")
    brood_frames: Optional[int] = Field(default=None, ge=0, le=10)
    honey_frames: Optional[int] = Field(default=None, ge=0, le=10)
    mood: Optional[str] = Field(default=None, pattern="^(calm|nervous|aggressive)$")
    population_strength: Optional[int] = Field(default=None, ge=1, le=5)
    varroa_count: Optional[int] = Field(default=None, ge=0)
    swarm_cells_seen: Optional[bool] = None
    treatment_applied: Optional[str] = None
    feeding_done: Optional[bool] = None
    feeding_type: Optional[str] = None
    weight_kg: Optional[float] = None
    notes: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)


class InspectionUpdate(BaseModel):
    date: Optional[_Date] = None
    queen_seen: Optional[bool] = None
    queen_color: Optional[str] = Field(default=None, pattern="^(white|yellow|red|green|blue)$")
    brood_frames: Optional[int] = Field(default=None, ge=0, le=10)
    honey_frames: Optional[int] = Field(default=None, ge=0, le=10)
    mood: Optional[str] = Field(default=None, pattern="^(calm|nervous|aggressive)$")
    population_strength: Optional[int] = Field(default=None, ge=1, le=5)
    varroa_count: Optional[int] = Field(default=None, ge=0)
    swarm_cells_seen: Optional[bool] = None
    treatment_applied: Optional[str] = None
    feeding_done: Optional[bool] = None
    feeding_type: Optional[str] = None
    weight_kg: Optional[float] = None
    notes: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class InspectionOut(BaseModel):
    id: str
    hive_id: str
    date: date
    queen_seen: Optional[bool]
    queen_color: Optional[str]
    brood_frames: Optional[int]
    honey_frames: Optional[int]
    mood: Optional[str]
    population_strength: Optional[int]
    varroa_count: Optional[int]
    swarm_cells_seen: Optional[bool]
    treatment_applied: Optional[str]
    feeding_done: Optional[bool]
    feeding_type: Optional[str]
    weight_kg: Optional[float]
    notes: Optional[str]
    custom_fields: Dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

class StatsPeriod(BaseModel):
    from_date: date = Field(alias="from")
    to_date: date = Field(alias="to")
    preset: str

    model_config = {"populate_by_name": True}


class TrendPoint(BaseModel):
    date: date
    value: Any


class CustomFieldStat(BaseModel):
    field_name: str
    type: str
    trend: Optional[List[TrendPoint]] = None
    distribution: Optional[Dict[str, int]] = None


class HiveStats(BaseModel):
    hive_id: str
    period: StatsPeriod
    inspection_count: int
    days_since_last_inspection: Optional[int]
    queen_seen_rate: Optional[float]
    mood_distribution: Dict[str, int]
    swarm_cells_count: int
    treatments: List[Dict[str, Any]]
    varroa_trend: List[TrendPoint]
    brood_frames_trend: List[TrendPoint]
    honey_frames_trend: List[TrendPoint]
    population_strength_trend: List[TrendPoint]
    weight_trend: List[TrendPoint]
    custom_field_stats: Dict[str, CustomFieldStat]


class HiveStatsSummary(BaseModel):
    hive_id: str
    hive_name: str
    inspection_count: int
    days_since_last_inspection: Optional[int]
    average_varroa: Optional[float]


class ApiaryStats(BaseModel):
    apiary_id: str
    period: StatsPeriod
    hive_count: int
    inspections_total: int
    hives_inspected_last_30d: int
    hives_not_inspected_30d: int
    average_varroa: Optional[float]
    average_brood_frames: Optional[float]
    average_honey_frames: Optional[float]
    mood_distribution: Dict[str, int]
    swarm_alerts: int
    per_hive: List[HiveStatsSummary]


class ApiaryStatsSummary(BaseModel):
    apiary_id: str
    apiary_name: str
    hive_count: int
    inspections_total: int


class OverviewStats(BaseModel):
    period: StatsPeriod
    apiary_count: int
    hive_count: int
    inspections_total: int
    per_apiary: List[ApiaryStatsSummary]


# ---------------------------------------------------------------------------
# Hornet Tracker
# ---------------------------------------------------------------------------

class HornetCatchCreate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    count: int = Field(default=1, ge=1, le=1000)
    reporter_name: Optional[str] = Field(default=None, max_length=100)


class HornetCatchOut(BaseModel):
    id: str
    count: int
    latitude: Optional[float]
    longitude: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class HornetNestCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    reporter_name: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    photo_url: Optional[str] = None


class HornetNestOut(BaseModel):
    id: str
    latitude: float
    longitude: float
    status: str
    reporter_name: Optional[str]
    notes: Optional[str]
    photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HornetSightingCreate(BaseModel):
    photo_url: str
    description: Optional[str] = Field(default=None, max_length=2000)
    reporter_name: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class HornetSightingOut(BaseModel):
    id: str
    photo_url: str
    description: Optional[str]
    reporter_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    yes_votes: int
    no_votes: int
    created_at: datetime

    model_config = {"from_attributes": True}


class HornetVote(BaseModel):
    vote: str = Field(pattern="^(yes|no)$")


class HornetSightingStatusUpdate(BaseModel):
    status: str = Field(pattern="^(confirmed|rejected)$")


class HornetStatsOut(BaseModel):
    total_caught: int
    total_nests: int
    destroyed_nests: int
    pending_sightings: int
    confirmed_sightings: int


# Resolve forward references
TokenResponse.model_rebuild()
