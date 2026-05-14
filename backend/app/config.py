from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./apiscan.db"
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    admin_email: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
