from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Real environment variables win over the .env file; names are case-insensitive.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "write-your-database-url-here"
    secret_key: str = "write-your-secret-key-here"
    algorithm: str = "write the algorithm here like HS256"
    access_token_expire_minutes: int = 30 
    sql_echo: bool = False


settings = Settings()