from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://toratau:toratau_secret@localhost:5432/toratau"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    default_portal_slug: str = "demo"
    superadmin_login: str = "superadmin"
    superadmin_password: str = "superadmin123"

    class Config:
        env_file = ".env"
        extra = "ignore"
        env_file_encoding = "utf-8"


settings = Settings()
