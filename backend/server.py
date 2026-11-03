"""
Legacy/Compatibility Entrypoint for Word Builder (Subwords).
Re-exports the application instance from the modern MVC app package (app.main:app).
"""

from app.main import app
from app.services.dictionary_service import (
    WORD_LIST,
    VALID_WORDS,
    generate_subwords,
    can_form_word,
    check_dictionary,
)

__all__ = [
    "app",
    "WORD_LIST",
    "VALID_WORDS",
    "generate_subwords",
    "can_form_word",
    "check_dictionary",
]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
