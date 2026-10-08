"""Datos compartidos entre las tres webs. Cambiar acá teléfonos y emails."""
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

# Sólo el barrio: la dirección exacta se comparte por privado al confirmar la cita.
PLACES = [
    {'zone': 'Gràcia'},
]


# Datos de contacto editables desde el panel. 'original' es el valor publicado hoy en las webs:
# si en el panel se cambia, la web reemplaza el original por el nuevo en todas las páginas.
CONTACTS = {
    'sol_phone': {'label': 'WhatsApp / teléfono de Sol', 'type': 'phone', 'original': SOL['phone_display']},
    'sol_email': {'label': 'Email de Sol', 'type': 'email', 'original': SOL['email']},
    'sol_instagram': {'label': 'Instagram de Sol (usuario, sin @)', 'type': 'instagram', 'original': 'lic.solgaliana'},
    'nahuel_phone': {'label': 'WhatsApp / teléfono de Nahuel', 'type': 'phone', 'original': NAHUEL['phone_display']},
    'nahuel_email': {'label': 'Email de Nahuel', 'type': 'email', 'original': NAHUEL['email']},
}


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
