import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/dicunglac")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dicunglac-secret-key-2026-super-secure")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_API_KEYS: str = os.getenv("GEMINI_API_KEYS", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    def get_gemini_keys(self) -> List[str]:
        keys: List[str] = []
        raw_multi = os.getenv("GEMINI_API_KEYS", "") or self.GEMINI_API_KEYS
        if raw_multi:
            for k in raw_multi.split(","):
                clean = k.strip().replace(" ", "").replace("\r", "").replace("\n", "")
                if clean and clean != "your_gemini_api_key_here" and clean not in keys:
                    keys.append(clean)
        single = (os.getenv("GEMINI_API_KEY", "") or self.GEMINI_API_KEY).strip()
        if single and single != "your_gemini_api_key_here" and single not in keys:
            keys.append(single)
        return keys

settings = Settings()
