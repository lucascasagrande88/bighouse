"""Textos legales básicos (revisar con un profesional antes de usar datos personales más allá del contacto)."""
from .common import SOL, NAHUEL

RESPONSABLES = {
    'conjunta': (f"{SOL['name']} y {NAHUEL['name']}", f"{SOL['email']} / {NAHUEL['email']}"),
    'sol': (SOL['name'], SOL['email']),
    'nahuel': (NAHUEL['name'], NAHUEL['email']),
}


def privacy(key):
    name, email = RESPONSABLES[key]
    return {
        'title': 'Privacidad y cookies',
        'body': f"""
<p>Esta web es un sitio informativo. No tiene formularios ni áreas de registro, y no recoge datos personales de forma directa.</p>
<h2>Responsable</h2>
<p>{name}. Contacto: {email}.</p>
<h2>Datos que nos envías</h2>
<p>Si nos escribes por WhatsApp o por email, usaremos los datos que nos facilites (nombre, teléfono, email y el contenido del mensaje) únicamente para responderte y, en su caso, coordinar una consulta. No los cedemos a terceros salvo obligación legal. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo al email indicado, y presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>
<p>Recuerda que los servicios de mensajería y correo (WhatsApp, Gmail) tienen sus propias políticas de privacidad. Si prefieres no compartir información sensible por estos medios, puedes reservarla para la sesión.</p>
<h2>Cookies y analítica</h2>
<p>La web no usa cookies propias. Sólo si aceptas la analítica en el aviso correspondiente se carga Google Analytics 4, con la IP anonimizada, para medir de forma agregada qué páginas se visitan. Si eliges «Ahora no», no se carga ningún script de terceros. Tu elección se guarda en tu navegador; puedes cambiarla borrando los datos del sitio.</p>
<h2>Alojamiento</h2>
<p>El sitio está alojado en Netlify, que puede registrar datos técnicos de acceso (como la IP) por motivos de seguridad y funcionamiento.</p>
""",
    }


def not_found(key):
    return {
        'title': 'Esta página no existe.',
        'body': '<p>Puede que el enlace haya cambiado o que la dirección esté mal escrita.</p><p><a href="/">Volver al inicio</a></p>',
    }
