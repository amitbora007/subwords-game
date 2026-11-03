"""
Legacy/Compatibility Entrypoint for Dictionary data.
Re-exports WORD_LIST and VALID_WORDS from app.services.dictionary_service.
"""

from app.services.dictionary_service import (
    WORD_LIST,
    VALID_WORDS,
    generate_subwords,
    can_form_word,
    check_dictionary,
)

__all__ = [
    "WORD_LIST",
    "VALID_WORDS",
    "generate_subwords",
    "can_form_word",
    "check_dictionary",
]
