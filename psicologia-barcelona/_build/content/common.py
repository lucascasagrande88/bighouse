"""Datos compartidos entre las tres webs. Cambiar acá teléfonos, emails y direcciones."""
from urllib.parse import quote

URLS = {
    'conjunta': 'https://psicoanalisis-en-barcelona.netlify.app',
    'sol': 'https://sol-galiana-psicologia.netlify.app',
    'nahuel': 'https://nahuel-psicologia-barcelona.netlify.app',
}

SOL = {
    'name': 'Sol Galiana',
    'phone': '+34605695603',
    'phone_display': '+34 605 69 56 03',
    'email': 'solgaliana@gmail.com',
    'instagram': 'https://www.instagram.com/lic.solgaliana/',
}

NAHUEL = {
    'name': 'Nahuel Ponce',
    'phone': '+34641901660',
    'phone_display': '+34 641 90 16 60',
    'email': 'lic.poncenahuel@gmail.com',
}

PLACES = [
    {
        'zone': 'Gràcia',
        'street': 'Carrer de Badia, 24',
        'detail': 'Local 3 · 08012 Barcelona',
        'map': 'https://www.google.com/maps/search/?api=1&query=' + quote('Carrer de Badia 24, 08012 Barcelona'),
        'schema': {'streetAddress': 'Carrer de Badia, 24, Local 3', 'postalCode': '08012'},
    },
    {
        'zone': 'Sants',
        'street': 'Carrer de València, 28',
        'detail': 'Sants · Barcelona',
        'map': 'https://www.google.com/maps/search/?api=1&query=' + quote('Carrer de València 28, Barcelona'),
        'schema': {'streetAddress': 'Carrer de València, 28'},
    },
]


def wa(phone, text):
    return f"https://wa.me/{phone.lstrip('+')}?text={quote(text)}"


def mail(email, subject):
    return f"mailto:{email}?subject={quote(subject)}"


LANG_NAMES = {'es': 'Español', 'en': 'English', 'pt': 'Português'}
OG_LOCALES = {'es': 'es_ES', 'en': 'en_GB', 'pt': 'pt_BR'}

UI = {
    'es': {
        'skip': 'Ir al contenido', 'home': 'Inicio', 'menu': 'Abrir menú', 'nav_label': 'Navegación principal',
        'language': 'Idioma', 'consent_label': 'Preferencias de analítica',
        'consent_text': 'Usamos analítica anónima sólo si la aceptas, para saber qué partes de la web resultan útiles.',
        'consent_more': 'Privacidad', 'consent_reject': 'Ahora no', 'consent_accept': 'Aceptar',
        'privacy': 'Privacidad', 'map': 'Ver en el mapa', 'back': 'Volver al inicio',
    },
    'en': {
        'skip': 'Skip to content', 'home': 'Home', 'menu': 'Open menu', 'nav_label': 'Main navigation',
        'language': 'Language', 'consent_label': 'Analytics preferences',
        'consent_text': 'We only use anonymous analytics if you accept, to learn which parts of the site are useful.',
        'consent_more': 'Privacy', 'consent_reject': 'Not now', 'consent_accept': 'Accept',
        'privacy': 'Privacy', 'map': 'View on map', 'back': 'Back to home',
    },
    'pt': {
        'skip': 'Ir para o conteúdo', 'home': 'Início', 'menu': 'Abrir menu', 'nav_label': 'Navegação principal',
        'language': 'Idioma', 'consent_label': 'Preferências de análise',
        'consent_text': 'Só usamos análise anônima se você aceitar, para entender quais partes do site são úteis.',
        'consent_more': 'Privacidade', 'consent_reject': 'Agora não', 'consent_accept': 'Aceitar',
        'privacy': 'Privacidade', 'map': 'Ver no mapa', 'back': 'Voltar ao início',
    },
}
