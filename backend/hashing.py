import bcrypt

_MAX_BYTES = 72  # bcrypt only uses the first 72 bytes


def _prep(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_BYTES]


class Hash:
    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(_prep(password), bcrypt.gensalt()).decode("utf-8")

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(_prep(plain_password), hashed_password.encode("utf-8"))
        except (ValueError, TypeError):
            return False