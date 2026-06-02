from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/inventory_db"
    SECRET_KEY: str = "supersecretkey"
    ALLOWED_ORIGINS: str = "*"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
