import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt

from backend.schema import TokenData
from backend.config import settings

SECRET_KEY = settings.secret_key
ALGO = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    to_encode.update(
        {
            "exp": expire
        }
        )
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGO)



def verify_access_token(token: str, credentials_exception) -> TokenData:

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
    except JWTError:
        raise credentials_exception

    username = payload.get("sub")

    if not username:
        raise credentials_exception
    
    return TokenData(username=username)