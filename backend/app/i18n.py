from typing import Optional

MESSAGES = {
    "INVALID_CREDENTIALS": {
        "en": "Invalid email or password.",
        "fr": "Email ou mot de passe invalide.",
        "de": "Ungültige E-Mail oder Passwort.",
    },
    "TOKEN_EXPIRED": {
        "en": "Access token has expired.",
        "fr": "Le jeton d'accès a expiré.",
        "de": "Das Zugriffstoken ist abgelaufen.",
    },
    "TOKEN_INVALID": {
        "en": "Could not validate credentials.",
        "fr": "Impossible de valider les informations d'identification.",
        "de": "Anmeldeinformationen konnten nicht überprüft werden.",
    },
    "FORBIDDEN": {
        "en": "You do not have permission to access this resource.",
        "fr": "Vous n'avez pas la permission d'accéder à cette ressource.",
        "de": "Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.",
    },
    "USER_NOT_FOUND": {
        "en": "User not found.",
        "fr": "Utilisateur introuvable.",
        "de": "Benutzer nicht gefunden.",
    },
    "APIARY_NOT_FOUND": {
        "en": "Apiary not found.",
        "fr": "Rucher introuvable.",
        "de": "Bienenstand nicht gefunden.",
    },
    "HIVE_NOT_FOUND": {
        "en": "Hive not found.",
        "fr": "Ruche introuvable.",
        "de": "Bienenstock nicht gefunden.",
    },
    "INSPECTION_NOT_FOUND": {
        "en": "Inspection not found.",
        "fr": "Inspection introuvable.",
        "de": "Inspektion nicht gefunden.",
    },
    "FIELD_DEFINITION_NOT_FOUND": {
        "en": "Field definition not found.",
        "fr": "Définition de champ introuvable.",
        "de": "Felddefinition nicht gefunden.",
    },
    "QR_BATCH_NOT_FOUND": {
        "en": "QR batch not found.",
        "fr": "Lot QR introuvable.",
        "de": "QR-Charge nicht gefunden.",
    },
    "QR_TOKEN_NOT_FOUND": {
        "en": "QR token does not exist.",
        "fr": "Le jeton QR n'existe pas.",
        "de": "QR-Token existiert nicht.",
    },
    "QR_TOKEN_ALREADY_LINKED": {
        "en": "This QR code is already linked to a hive.",
        "fr": "Ce code QR est déjà lié à une ruche.",
        "de": "Dieser QR-Code ist bereits mit einem Bienenstock verknüpft.",
    },
    "APIARY_HAS_HIVES": {
        "en": "Cannot delete an apiary that still contains hives.",
        "fr": "Impossible de supprimer un rucher qui contient encore des ruches.",
        "de": "Ein Bienenstand mit Bienenstöcken kann nicht gelöscht werden.",
    },
    "EMAIL_ALREADY_REGISTERED": {
        "en": "This email address is already registered.",
        "fr": "Cette adresse email est déjà enregistrée.",
        "de": "Diese E-Mail-Adresse ist bereits registriert.",
    },
    "QR_BATCH_LIMIT_EXCEEDED": {
        "en": "Count must be between 1 and 50.",
        "fr": "Le nombre doit être compris entre 1 et 50.",
        "de": "Die Anzahl muss zwischen 1 und 50 liegen.",
    },
}


def get_message(code: str, accept_language: Optional[str] = None) -> str:
    lang = "en"
    if accept_language:
        for part in accept_language.split(","):
            tag = part.strip().split(";")[0].strip()[:2].lower()
            if tag in ("en", "fr", "de"):
                lang = tag
                break
    messages = MESSAGES.get(code, {})
    return messages.get(lang, messages.get("en", code))


def error(code: str, accept_language: Optional[str] = None) -> dict:
    return {"code": code, "message": get_message(code, accept_language)}
