"""Textos de la web de Sol Galiana."""
from .common import SOL, URLS, wa, mail

LANGS = ['es', 'en']

_WA_ES = wa(SOL['phone'], 'Hola Sol, vi tu web y me gustaría consultar por una primera sesión.')
_WA_EN = wa(SOL['phone'], 'Hi Sol, I saw your website and I’d like to ask about a first session.')

ES = {
    'scene': {'label': 'Llegar, extrañar, pertenecer, quedarse', 'kicker': 'Empezar en otro lugar', 'words': ['Llegar.', 'Extrañar.', 'Pertenecer.', 'Quedarse.'], 'sub': 'Cada etapa de una mudanza mueve algo distinto. La terapia puede acompañarlas todas.'},
    'meta': {
        'title': 'Sol Galiana | Psicóloga en Barcelona y online · Terapia para expatriados',
        'description': 'Psicóloga clínica con orientación psicoanalítica en Barcelona (Gràcia y Sants) y online. Terapia en español e inglés para adultos, jóvenes y personas expatriadas. Espacio LGBTQ+ friendly.',
    },
    'schema': {'jobTitle': 'Psicóloga clínica', 'languages': ['es', 'en'],
               'alumniOf': [{'@type': 'CollegeOrUniversity', 'name': 'Universidad Nacional de La Matanza'},
                            {'@type': 'CollegeOrUniversity', 'name': 'Universidad de la Cuenca del Plata'}]},
    'nav': [
        {'href': '#sobre-mi', 'label': 'Sobre mí'},
        {'href': '#enfoque', 'label': 'Enfoque'},
        {'href': '#servicios', 'label': 'Servicios'},
        {'href': '#trayectoria', 'label': 'Trayectoria'},
        {'href': '#preguntas', 'label': 'Preguntas'},
    ],
    'cta': {'href': '#contacto', 'label': 'Primera consulta'},
    'hero': {
        'eyebrow': 'Psicóloga clínica · Barcelona y online',
        'h1': 'Un lugar propio, <em>también lejos de casa.</em>',
        'rotate_intro': 'Para ti, si',
        'rotate': [
            'acabas de llegar a Barcelona.',
            'echas de menos tu casa y no sabes cómo decirlo.',
            'algo se repite en tus vínculos.',
            'estás atravesando una pérdida.',
            'quieres entender lo que te pasa, no sólo calmarlo.',
        ],
        'lead': 'Acompaño a adultos, jóvenes y personas internacionales en procesos de ansiedad, identidad, vínculos, migración y duelo. En español o en inglés, según el idioma en el que te sientas más tú.',
        'primary': 'Escríbeme por WhatsApp',
        'secondary': 'Conóceme',
        'img_alt': 'Sol Galiana, psicóloga, sonriendo con un jersey verde',
        'badge': '7 años de experiencia clínica',
        'facts': ['Español · English', 'Presencial + online', 'LGBTQ+ friendly'],
    },
    'about': {
        'kicker': 'Sobre mí',
        'title': 'Empezar de nuevo puede abrir posibilidades. <em>También puede moverlo todo.</em>',
        'quote': 'Yo también soy expatriada.',
        'paras': [
            'Soy psicóloga clínica habilitada para ejercer en España, con formación en psicoanálisis y siete años de experiencia trabajando con adultos y jóvenes, tanto online como de manera presencial.',
            'Transitar un país nuevo, un idioma nuevo y reconstruir el sentido de pertenencia a un hogar no es algo que simplemente estudie en consulta: es algo que he vivido. Esa combinación de experiencia personal y clínica es una parte importante de por qué me gusta trabajar con personas que atraviesan transiciones similares.',
        ],
        'img_alt': 'Sol Galiana en su consultorio',
        'sign': 'Sol',
    },
    'topics': {
        'kicker': 'Lo que podemos trabajar',
        'title': 'Lo universal y lo que aparece al empezar en otro lugar.',
        'lead': 'Puedes llegar con un motivo claro o con una sensación difícil de nombrar.',
        'items': ['Ansiedad', 'Estrés', 'Identidad', 'Choque cultural', 'Nostalgia del país de origen', 'Soledad', 'Autoestima', 'Relaciones y vínculos', 'Pérdidas y duelo', 'Depresión', 'Pertenencia', 'Nuevos comienzos'],
    },
    'approach': {
        'kicker': 'Enfoque psicoanalítico',
        'title': 'Menos «aquí tienes una tarea». <em>Más ir a lo que hay debajo.</em>',
        'paras': [
            'Gran parte de mi trabajo se desarrolla desde una perspectiva psicoanalítica. Se trata de profundizar genuinamente en aquello que subyace a la ansiedad, el estrés, los patrones vinculares o el duelo que te llevó a buscar ayuda, y no únicamente en sus manifestaciones más visibles.',
            'Presto especial atención a tu historia y a tu experiencia particular. Cada proceso se construye contigo, a tu ritmo.',
        ],
        'points': ['Escucha sin juicios', 'Tu historia, no un protocolo', 'Un ritmo propio'],
        'img_alt': 'Consultorio luminoso con láminas de flores, plantas y un sofá',
    },
    'safe': {
        'kicker': 'Un espacio abierto',
        'title': 'Tu identidad no necesita traducción.',
        'paras': [
            'Ofrezco un espacio cálido, abierto y respetuoso con todas las identidades de género y orientaciones sexuales, incluidas las personas LGBTQ+.',
            'Las sesiones están disponibles en español (mi lengua materna) o en inglés (con fluidez), según el idioma en el que te sientas más tú.',
        ],
        'langs': [{'k': 'ES', 'v': 'Lengua materna'}, {'k': 'EN', 'v': 'Fluido'}],
    },
    'services': {
        'kicker': 'Servicios',
        'title': 'Formas de encontrarnos.',
        'items': [
            {'name': 'Psicoterapia individual', 'meta': ['45 min', 'Presencial u online'], 'text': 'Para adultos y jóvenes, con especial experiencia en personas internacionales y expatriadas.', 'featured': True},
            {'name': 'Sesión con tarifa flexible', 'meta': ['1 hora', 'Desde 40 €'], 'text': 'Para que el coste no sea un impedimento para empezar.'},
            {'name': 'Supervisión clínica individual', 'meta': ['1 hora', 'Presencial u online'], 'text': 'Análisis de casos clínicos para profesionales y personas en formación.'},
            {'name': 'Supervisión grupal', 'meta': ['2 horas', 'Presencial u online'], 'text': 'Para grupos de estudiantes y personas en formación psicoanalítica.'},
        ],
        'cta': 'Consultar disponibilidad',
    },
    'career': {
        'kicker': 'Trayectoria',
        'title': 'Clínica, docencia <em>e investigación.</em>',
        'intro': 'En Argentina enseñé psicoanálisis y práctica profesional a nivel universitario, y disfrutaba especialmente profundizando en el análisis de casos con otros profesionales de la salud mental. Hoy superviso casos clínicos con grupos de estudiantes o de manera individual.',
        'groups': [
            {'title': 'Formación', 'items': [
                {'when': '2020 — 2023', 'what': 'Máster en Psicoanálisis', 'where': 'Especialización en Clínica de Adultos · Universidad Nacional de La Matanza (UNLaM), Argentina'},
                {'when': '2018', 'what': 'Licenciatura en Psicología', 'where': 'Universidad de la Cuenca del Plata, Argentina · Título homologado en España'},
                {'when': '2019', 'what': 'Posgrado sobre el duelo', 'where': 'En adultos, niños y adolescentes · Universidad ISALUD, Argentina'},
                {'when': '', 'what': 'Programa intensivo de atención a personas con discapacidad', 'where': 'Formación complementaria'},
            ]},
            {'title': 'Experiencia', 'items': [
                {'when': '2019 — hoy', 'what': 'Consulta privada', 'where': 'Psicoterapia individual presencial y online, en español e inglés, principalmente con adultos y jóvenes internacionales.'},
                {'when': '2021 — hoy', 'what': 'OSDE · Seguros médicos internacionales', 'where': 'Atención a adolescentes y adultos: ansiedad, estrés, autoestima, identidad, vínculos, depresión, pérdidas y duelos.'},
                {'when': '2024 — hoy', 'what': 'APOLa Internacional, Barcelona', 'where': 'Psicoterapeuta asociada. Coordinación y dictado de cursos introductorios de psicoanálisis.'},
            ]},
        ],
        'research_kicker': 'Investigación',
        'research': '¿Cómo se construyen los sueños en personas que nunca han tenido percepción visual?',
        'research_note': 'La pregunta de mi tesis de máster. Ya sea a través de la docencia, la investigación o la clínica, me mueve la misma curiosidad: comprender cómo las personas construyen un sentido de su propia experiencia, especialmente cuando esa experiencia implica estar lejos del lugar del que partieron.',
    },
    'places': {
        'kicker': 'Dónde atiendo',
        'title': 'En Barcelona o desde donde estés.',
        'online_zone': 'Online',
        'online_title': 'Videollamada',
        'online_detail': 'En español o inglés, desde cualquier país',
        'img_alt': 'Sala de espera con sofá gris y cojines',
    },
    'faq': {
        'kicker': 'Preguntas frecuentes',
        'title': 'Antes de la primera consulta.',
        'items': [
            {'q': '¿Atiendes a personas expatriadas?', 'a': 'Sí. Trabajo especialmente con personas internacionales y expatriadas en temas de identidad, adaptación cultural, nostalgia por el país de origen, soledad y pertenencia, además de cuestiones más universales como la autoestima, las relaciones o las pérdidas.'},
            {'q': '¿Puedo hacer terapia en inglés?', 'a': 'Sí. Atiendo en español, mi lengua materna, y en inglés con fluidez. Puedes elegir el idioma en el que te sientas más cómodo o cómoda, e incluso combinar ambos.'},
            {'q': '¿Las sesiones son presenciales u online?', 'a': 'Ambas opciones. Atiendo de forma presencial en Barcelona (Gràcia y Sants) y online por videollamada.'},
            {'q': '¿Cuánto dura una sesión?', 'a': 'La sesión individual dura 45 minutos. También ofrezco una modalidad con tarifa flexible, de una hora, desde 40 €.'},
            {'q': '¿Con qué edades trabajas?', 'a': 'Trabajo con adultos y jóvenes, incluidos adolescentes en algunos casos.'},
            {'q': '¿Cómo es la primera consulta?', 'a': 'Es un primer encuentro para conocernos, empezar a poner en palabras lo que te trae y valorar juntas o juntos cómo seguir. No necesitas tener todo claro para empezar.'},
            {'q': '¿Ofreces supervisión clínica?', 'a': 'Sí, de forma individual (una hora) o grupal (dos horas), para profesionales y personas en formación psicoanalítica.'},
        ],
    },
    'contact': {
        'kicker': 'Primera consulta',
        'title': 'Empecemos por una conversación.',
        'lead': 'Cuéntame brevemente qué te lleva a consultar y coordinamos un primer encuentro, en Barcelona u online.',
        'wa': _WA_ES, 'wa_label': 'WhatsApp · ' + SOL['phone_display'],
        'mail': mail(SOL['email'], 'Primera consulta'), 'email': SOL['email'],
        'ig_label': 'Instagram · @lic.solgaliana',
    },
    'footer': {
        'role': 'Psicóloga clínica · Barcelona y online',
        'team': 'Parte de',
        'legal': 'Título homologado para ejercer en España.',
    },
    'team_url': URLS['conjunta'] + '/',
    'wa': _WA_ES,
    'dock': {'label': 'Escribir a Sol', 'href': _WA_ES, 'external': True, 'track': 'whatsapp-dock'},
}

EN = {
    'scene': {'label': 'Arriving, missing, belonging, staying', 'kicker': 'Starting somewhere new', 'words': ['Arriving.', 'Missing.', 'Belonging.', 'Staying.'], 'sub': 'Every stage of a move stirs something different. Therapy can be there for all of them.'},
    'meta': {
        'title': 'Sol Galiana | English-speaking psychologist in Barcelona & online · Therapy for expats',
        'description': 'Clinical psychologist with a psychoanalytic approach in Barcelona (Gràcia and Sants) and online. Therapy in English and Spanish for adults, young people and expats. LGBTQ+ affirming.',
    },
    'schema': ES['schema'],
    'nav': [
        {'href': '#sobre-mi', 'label': 'About'},
        {'href': '#enfoque', 'label': 'Approach'},
        {'href': '#servicios', 'label': 'Services'},
        {'href': '#trayectoria', 'label': 'Background'},
        {'href': '#preguntas', 'label': 'FAQ'},
    ],
    'cta': {'href': '#contacto', 'label': 'First session'},
    'hero': {
        'eyebrow': 'Clinical psychologist · Barcelona & online',
        'h1': 'A place of your own, <em>even far from home.</em>',
        'rotate_intro': 'For you, if',
        'rotate': [
            'you’ve just moved to Barcelona.',
            'you miss home and can’t quite say how.',
            'something keeps repeating in your relationships.',
            'you’re going through a loss.',
            'you want to understand what’s happening, not just calm it down.',
        ],
        'lead': 'I work with adults, young people and internationals through anxiety, identity, relationships, migration and grief — in English or Spanish, whichever feels most like you.',
        'primary': 'Message me on WhatsApp',
        'secondary': 'About me',
        'img_alt': 'Sol Galiana, psychologist, smiling in a green sweater',
        'badge': '7 years of clinical experience',
        'facts': ['English · Español', 'In person + online', 'LGBTQ+ affirming'],
    },
    'about': {
        'kicker': 'About me',
        'title': 'Starting over can open up possibilities. <em>It can also move everything.</em>',
        'quote': 'I’m an expat too.',
        'paras': [
            'I’m a clinical psychologist licensed to practise in Spain, trained in psychoanalysis, with seven years of experience working with adults and young people, both online and in person.',
            'Navigating a new country, a new language and rebuilding a sense of belonging to a home is not something I simply study in session — it’s something I’ve lived. That combination of personal and clinical experience is a big part of why I love working with people going through similar transitions.',
        ],
        'img_alt': 'Sol Galiana in her office',
        'sign': 'Sol',
    },
    'topics': {
        'kicker': 'What we can work on',
        'title': 'The universal, and what comes up when you start somewhere new.',
        'lead': 'You can come with a clear reason or with a feeling that’s hard to name.',
        'items': ['Anxiety', 'Stress', 'Identity', 'Culture shock', 'Homesickness', 'Loneliness', 'Self-esteem', 'Relationships', 'Loss and grief', 'Depression', 'Belonging', 'New beginnings'],
    },
    'approach': {
        'kicker': 'Psychoanalytic approach',
        'title': 'Less “here’s some homework”. <em>More getting to what lies underneath.</em>',
        'paras': [
            'Much of my work comes from a psychoanalytic perspective. It’s about genuinely exploring what sits beneath the anxiety, stress, relationship patterns or grief that brought you to seek help — not only their most visible signs.',
            'I pay close attention to your history and your particular experience. Each process is built with you, at your own pace.',
        ],
        'points': ['Listening without judgement', 'Your story, not a protocol', 'Your own pace'],
        'img_alt': 'Bright therapy room with floral prints, plants and a sofa',
    },
    'safe': {
        'kicker': 'An open space',
        'title': 'Your identity doesn’t need translating.',
        'paras': [
            'I offer a warm, open space that is respectful of all gender identities and sexual orientations, including LGBTQ+ people.',
            'Sessions are available in Spanish (my native language) or English (fluent), whichever language feels most like you.',
        ],
        'langs': [{'k': 'EN', 'v': 'Fluent'}, {'k': 'ES', 'v': 'Native'}],
    },
    'services': {
        'kicker': 'Services',
        'title': 'Ways we can meet.',
        'items': [
            {'name': 'Individual therapy', 'meta': ['45 min', 'In person or online'], 'text': 'For adults and young people, with particular experience with internationals and expats.', 'featured': True},
            {'name': 'Sliding-scale session', 'meta': ['1 hour', 'From €40'], 'text': 'So that cost doesn’t stand in the way of getting started.'},
            {'name': 'Individual clinical supervision', 'meta': ['1 hour', 'In person or online'], 'text': 'Case analysis for professionals and trainees.'},
            {'name': 'Group supervision', 'meta': ['2 hours', 'In person or online'], 'text': 'For student groups and people in psychoanalytic training.'},
        ],
        'cta': 'Ask about availability',
    },
    'career': {
        'kicker': 'Background',
        'title': 'Clinical work, teaching <em>and research.</em>',
        'intro': 'In Argentina I taught psychoanalysis and professional practice at university level, and especially enjoyed digging into case analysis with other mental health professionals. Today I supervise clinical cases with student groups or individually.',
        'groups': [
            {'title': 'Education', 'items': [
                {'when': '2020 — 2023', 'what': 'Master’s in Psychoanalysis', 'where': 'Specialisation in Adult Clinical Practice · Universidad Nacional de La Matanza (UNLaM), Argentina'},
                {'when': '2018', 'what': 'Degree in Psychology', 'where': 'Universidad de la Cuenca del Plata, Argentina · Recognised in Spain'},
                {'when': '2019', 'what': 'Postgraduate course on grief', 'where': 'In adults, children and adolescents · Universidad ISALUD, Argentina'},
                {'when': '', 'what': 'Intensive programme on supporting people with disabilities', 'where': 'Complementary training'},
            ]},
            {'title': 'Experience', 'items': [
                {'when': '2019 — now', 'what': 'Private practice', 'where': 'Individual therapy in person and online, in English and Spanish, mainly with international adults and young people.'},
                {'when': '2021 — now', 'what': 'OSDE · International health insurance', 'where': 'Working with adolescents and adults: anxiety, stress, self-esteem, identity, relationships, depression, loss and grief.'},
                {'when': '2024 — now', 'what': 'APOLa Internacional, Barcelona', 'where': 'Associate psychotherapist. Coordinating and teaching introductory courses in psychoanalysis.'},
            ]},
        ],
        'research_kicker': 'Research',
        'research': 'How are dreams built by people who have never had visual perception?',
        'research_note': 'The question behind my master’s thesis. Whether through teaching, research or clinical work, I’m driven by the same curiosity: understanding how people make sense of their own experience — especially when that experience means being far from where they started.',
    },
    'places': {
        'kicker': 'Where I work',
        'title': 'In Barcelona, or wherever you are.',
        'online_zone': 'Online',
        'online_title': 'Video sessions',
        'online_detail': 'In English or Spanish, from any country',
        'img_alt': 'Waiting room with a grey sofa and cushions',
    },
    'faq': {
        'kicker': 'FAQ',
        'title': 'Before your first session.',
        'items': [
            {'q': 'Do you work with expats?', 'a': 'Yes. I work especially with internationals and expats around identity, cultural adjustment, homesickness, loneliness and belonging, as well as more universal issues like self-esteem, relationships and loss.'},
            {'q': 'Can I do therapy in English?', 'a': 'Yes. I work in Spanish, my native language, and fluently in English. You can choose whichever language feels most comfortable — or mix both.'},
            {'q': 'Are sessions in person or online?', 'a': 'Both. I see clients in person in Barcelona (Gràcia and Sants) and online via video call.'},
            {'q': 'How long is a session?', 'a': 'An individual session lasts 45 minutes. I also offer a one-hour sliding-scale option from €40.'},
            {'q': 'Which ages do you work with?', 'a': 'I work with adults and young people, including adolescents in some cases.'},
            {'q': 'What is the first session like?', 'a': 'It’s a first meeting to get to know each other, start putting into words what brings you, and think together about how to continue. You don’t need to have it all figured out.'},
            {'q': 'Do you offer clinical supervision?', 'a': 'Yes, individually (one hour) or in groups (two hours), for professionals and people in psychoanalytic training.'},
        ],
    },
    'contact': {
        'kicker': 'First session',
        'title': 'Let’s start with a conversation.',
        'lead': 'Tell me briefly what brings you here and we’ll arrange a first meeting, in Barcelona or online.',
        'wa': _WA_EN, 'wa_label': 'WhatsApp · ' + SOL['phone_display'],
        'mail': mail(SOL['email'], 'First session'), 'email': SOL['email'],
        'ig_label': 'Instagram · @lic.solgaliana',
    },
    'footer': {
        'role': 'Clinical psychologist · Barcelona & online',
        'team': 'Part of',
        'legal': 'Degree officially recognised to practise in Spain.',
    },
    'team_url': URLS['conjunta'] + '/en/',
    'wa': _WA_EN,
    'dock': {'label': 'Message Sol', 'href': _WA_EN, 'external': True, 'track': 'whatsapp-dock'},
}

PAGES = {'es': ES, 'en': EN}
