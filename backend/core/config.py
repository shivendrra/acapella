from pydantic_settings import BaseSettings

class Settings(BaseSettings):
  DATABASE_URL: str
  JWT_SECRET: str
  JWT_ALGORITHM: str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
  REFRESH_TOKEN_EXPIRE_DAYS: int = 30
  FIREBASE_CREDENTIALS_PATH: str = "../../serviceaccountsecret.json"

  class Config:
    env_file = ".env"

settings = Settings()