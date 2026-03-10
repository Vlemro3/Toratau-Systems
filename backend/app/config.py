from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://toratau:toratau_secret@localhost:5432/toratau"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    default_portal_slug: str = "demo"
    superadmin_login: str = "superadmin"
    superadmin_password: str = "superadmin123"
    openai_api_key: str = ""
    openai_estimate_model: str = "gpt-4.1"
    anthropic_api_key: str = ""
    anthropic_estimate_model: str = "claude-sonnet-4-20250514"
    # DaData API (автозаполнение по ИНН/БИК)
    dadata_api_key: str = ""
    # Tochka Bank integration (интернет-эквайринг)
    tochka_api_url: str = "https://enter.tochka.com/uapi"
    tochka_jwt_token: str = ""
    tochka_customer_code: str = ""
    tochka_merchant_id: str = ""
    tochka_webhook_secret: str = ""
    tochka_redirect_url: str = "https://app.example.com/billing?payment=success"
    tochka_fail_redirect_url: str = "https://app.example.com/billing?payment=fail"

    class Config:
        env_file = ".env"
        extra = "ignore"
        env_file_encoding = "utf-8"


settings = Settings()
