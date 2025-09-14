"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application settings
    app_name: str = "Taxi App Backend"
    debug: bool = True

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend port
        "http://localhost:8080",  # Additional port
    ]

    # Redis settings (for future use)
    redis_host: str = "localhost"
    redis_port: int = 6379

    # Data file paths
    geo_data_file: str = "/app/data/geo_locations_astana_hackathon"

    # Driver generation settings
    default_driver_count: int = 10
    driver_update_interval: int = 30  # seconds

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
