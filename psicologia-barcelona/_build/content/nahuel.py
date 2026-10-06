"""Textos de la web de Nahuel Ponce."""
from .common import NAHUEL, URLS, wa, mail

LANGS = ['es', 'pt']

_WA_ES = wa(NAHUEL['phone'], 'Hola Nahuel, vi tu web y me gustaría consultar por una primera sesión.')
_WA_PT = wa(NAHUEL['phone'], 'Olá Nahuel, vi seu site e gostaria de marcar uma primeira sessão.')

ES = {
    'scene': {'label': 'Lo que no se dice, insiste', 'lines': ['Lo que no se dice', '<em>insiste.</em>', 'Escucharlo <em>es empezar.</em>']},
    'meta': {
        'title': 'Nahuel Ponce | Psicólogo en Barcelona y online · Orientación psicoanalítica',
        'description': 'Psicólogo General Sanitario con orientación psicoanalítica en Barcelona (Gràcia y Sants) y online. Ansiedad, angustia, duelo, apego, trauma y procesos migratorios. Sesiones en español y portugués.',
    },
    'schema': {'jobTitle': 'Psicólogo General Sanitario', 'languages': ['es', 'pt'],
               'alumniOf': [{'@type': 'CollegeOrUniversity', 'name': 'Universidad de la Cuenca del Plata'},
                            {'@type': 'EducationalOrganization', 'name': 'Instituto Fernando Ulloa'},
                            {'@type': 'CollegeOrUniversity', 'name': 'Universidad Europea Miguel de Cervantes'}]},
    'nav': [
        {'href': '#enfoque', 'label': 'Enfoque'},
        {'href': '#motivos', 'label': 'Motivos'},
        {'href': '#trayectoria', 'label': 'Trayectoria'},
        {'href': '#servicios', 'label': 'Servicios'},
        {'href': '#preguntas', 'label': 'Preguntas'},
    ],
    'cta': {'href': '#contacto', 'label': 'Primera consulta'},
    'hero': {
        'eyebrow': 'Psicólogo General Sanitario · Barcelona y online',
        'h1': 'Un espacio para escuchar <em>lo que insiste.</em>',
        'rotate_intro': 'Cuando',
        'rotate': [
            'la angustia no encuentra palabras.',
            'una pérdida sigue pesando.',
            'las mismas escenas vuelven a repetirse.',
            'el cuerpo dice lo que no se puede decir.',
            'empezar de nuevo resulta más difícil de lo esperado.',
        ],
        'lead': 'Psicoterapia de orientación psicoanalítica para adultos. Presencial en Barcelona y online, en español y en portugués.',
        'primary': 'Escribir por WhatsApp',
        'secondary': 'Conocer el enfoque',
        'img_alt': 'Retrato en blanco y negro de Nahuel Ponce, psicólogo, en una avenida',
        'facts': [{'k': '+7', 'v': 'años de experiencia clínica'}, {'k': 'ES · PT', 'v': 'idiomas de atención'}, {'k': '45′', 'v': 'sesión individual'}],
    },
    'intro': {
        'kicker': 'Una forma de trabajo',
        'title': 'Comprender antes que silenciar.',
        'text': 'La terapia puede abrir un tiempo distinto: detenerse, poner en palabras y comprender qué lugar ocupa el malestar dentro de la propia historia.',
    },
    'approach': {
        'kicker': 'Enfoque terapéutico',
        'title': 'Lo que aparece como síntoma <em>también tiene una historia.</em>',
        'paras': [
            'Trabajo desde una perspectiva psicoanalítica, ofreciendo un espacio de escucha orientado a comprender aquello que está detrás del malestar y de las situaciones que tienden a repetirse.',
            'El trabajo terapéutico permite profundizar en la historia, los vínculos y las experiencias particulares de cada persona. Cada proceso se construye de manera individual, respetando los tiempos y la singularidad de quien consulta.',
        ],
        'img_alt': 'Nahuel Ponce leyendo en un café, en blanco y negro',
        'details': [{'k': 'Modalidad', 'v': 'Presencial en Barcelona y online'}, {'k': 'Población', 'v': 'Principalmente adultos'}, {'k': 'Idiomas', 'v': 'Español y portugués'}],
    },
    'reasons': {
        'kicker': 'Motivos de consulta',
        'title': 'Cuando algo se vuelve difícil de sostener.',
        'lead': 'No hace falta tener una explicación cerrada. El motivo inicial puede ser concreto o apenas una sensación de que algo no está funcionando.',
        'items': [
            {'t': 'Ansiedad y angustia', 'd': 'Estrés, sensación de bloqueo o un malestar que se vuelve difícil de nombrar.'},
            {'t': 'Vínculos y apego', 'd': 'Conflictos relacionales, distancia, dependencia o dificultades que se repiten.'},
            {'t': 'Duelo y pérdidas', 'd': 'Separaciones, cambios vitales y procesos que necesitan tiempo de elaboración.'},
            {'t': 'Crisis y cambios', 'd': 'Momentos de transición, crisis personales y nuevas etapas de la vida.'},
            {'t': 'Trauma', 'd': 'Experiencias difíciles cuyos efectos persisten en el presente.'},
            {'t': 'Manifestaciones psicosomáticas', 'd': 'Malestares corporales que pueden expresar algo de la historia subjetiva.'},
            {'t': 'Identidad y migración', 'd': 'Desarraigo, adaptación, distancia con los vínculos de origen y nuevos proyectos.'},
        ],
    },
    'about': {
        'kicker': 'Sobre mí',
        'title': 'Clínica, formación y <em>actualización permanente.</em>',
        'paras': [
            'Soy Psicólogo General Sanitario habilitado para ejercer en España, con formación en psicoanálisis y más de siete años de experiencia trabajando principalmente con adultos, tanto online como de manera presencial.',
            'Trabajo especialmente con adultos que atraviesan momentos de cambio, crisis personales, dificultades en sus relaciones o procesos de adaptación a nuevas etapas de vida. También cuento con experiencia con personas migrantes, estudiantes internacionales y adultos jóvenes.',
            'En Argentina desarrollé actividad docente universitaria en Psicopatología e Historia de la Psicología. Actualmente continúo participando en espacios de formación, investigación, supervisión clínica y construcción de casos dentro del psicoanálisis.',
        ],
        'img_alt': 'Nahuel Ponce de pie en una calle al atardecer, en blanco y negro',
    },
    'career': {
        'kicker': 'Trayectoria',
        'groups': [
            {'title': 'Experiencia', 'items': [
                {'when': '2019 — actualidad', 'what': 'Psicólogo clínico · Consulta privada', 'where': 'Barcelona / online. Psicoterapia individual con adultos en español y portugués: ansiedad, duelo, apego, conflictos relacionales, trauma y manifestaciones psicosomáticas.'},
                {'when': '2024 — 2026', 'what': 'Psicólogo clínico · Instituto Fernando Ulloa', 'where': 'Buenos Aires / online. Atención clínica de adultos y participación en espacios de supervisión y construcción de casos.'},
                {'when': '2025 — actualidad', 'what': 'OSDE Argentina', 'where': 'Compañía de seguros médicos internacionales. Atención online.'},
                {'when': 'Actualidad', 'what': 'Miembro de APOLa Barcelona', 'where': 'Formación, investigación, supervisión clínica y construcción de casos orientadas a la transmisión del psicoanálisis.'},
            ]},
            {'title': 'Formación', 'items': [
                {'when': '2025 — 2026', 'what': 'Posgrado en Clínica Psicoanalítica', 'where': '«Variantes de las neurosis clásicas» · Instituto Fernando Ulloa, Buenos Aires'},
                {'when': '2024 — 2025', 'what': 'Máster Universitario en Dirección y Gestión de Personas', 'where': 'Universidad Europea Miguel de Cervantes, Valladolid'},
                {'when': '2019', 'what': 'Licenciatura en Psicología', 'where': 'Universidad de la Cuenca del Plata, Argentina · Título homologado en España · Psicólogo General Sanitario'},
            ]},
        ],
        'extra_title': 'Formación complementaria',
        'extra': [
            'Angustia: una llamada al Otro y pasaje al acto',
            'Clínica de los goces: del goce del Otro',
            '¿El duelo es tratado en la clínica?',
            'Cuidado e intervención en el comportamiento autolesivo y el suicidio',
            'La dirección de la cura',
            'Clínica de las adicciones',
            'Las formaciones del inconsciente — Seminario 5 de Jacques Lacan',
        ],
    },
    'banner': {
        'title': 'Presencia para encontrarse. <em>Distancia para poder llegar.</em>',
        'text': 'Consultorios en Gràcia y Sants, y sesiones online desde cualquier lugar.',
        'img_alt': 'Fachadas de una avenida europea en blanco y negro',
    },
    'services': {
        'kicker': 'Servicios',
        'title': 'Un proceso pensado para cada persona.',
        'items': [
            {'name': 'Psicoterapia individual', 'meta': '45 minutos · presencial u online', 'text': 'Un espacio clínico para trabajar sobre el malestar, los vínculos, las pérdidas, los cambios y aquello que se repite.'},
            {'name': 'Sesión con tarifa flexible', 'meta': '1 hora · desde 40 €', 'text': 'Una opción accesible para iniciar o sostener un proceso terapéutico.'},
            {'name': 'Supervisión clínica', 'meta': '1 hora · presencial u online', 'text': 'Supervisión y construcción de casos para profesionales de la salud mental.'},
            {'name': 'Supervisión grupal', 'meta': '2 horas · presencial u online', 'text': 'Análisis de casos clínicos para personas en formación psicoanalítica.'},
        ],
        'migr_title': 'Procesos migratorios',
        'migr_text': 'Acompañamiento a personas migrantes, estudiantes internacionales y adultos jóvenes en la adaptación, el desarraigo y la construcción de nuevos proyectos personales.',
    },
    'places': {
        'in_person': 'Presencial',
        'address_note': 'Dirección exacta al confirmar la cita',
        'kicker': 'Consultorios',
        'online_zone': 'Online',
        'online_title': 'Videollamada',
        'online_detail': 'En español o portugués',
    },
    'faq': {
        'kicker': 'Preguntas frecuentes',
        'title': 'Antes de empezar.',
        'items': [
            {'q': '¿Atiendes de forma presencial en Barcelona?', 'a': 'Sí. Atiendo en consultorios de Barcelona (Gràcia y Sants) y también ofrezco sesiones online.'},
            {'q': '¿En qué idiomas pueden ser las sesiones?', 'a': 'En español y en portugués.'},
            {'q': '¿Con qué edades trabajas?', 'a': 'Trabajo principalmente con adultos, incluidos adultos jóvenes y estudiantes.'},
            {'q': '¿Tengo que saber exactamente qué me pasa?', 'a': 'No. La primera consulta también sirve para comenzar a poner en palabras aquello que preocupa o genera malestar.'},
            {'q': '¿Cuánto dura una sesión individual?', 'a': 'La sesión individual dura 45 minutos. También existe una modalidad con tarifa flexible, de una hora, desde 40 €.'},
            {'q': '¿Trabajas con personas migrantes?', 'a': 'Sí. Tengo experiencia acompañando a personas migrantes y estudiantes internacionales en cuestiones de identidad, desarraigo, adaptación y distancia con los vínculos de origen.'},
        ],
    },
    'contact': {
        'kicker': 'Primera consulta',
        'title': 'Puedes empezar por escribir.',
        'lead': 'No es necesario tener todo claro de antemano. Cuéntame brevemente qué te lleva a consultar y coordinamos una primera entrevista.',
        'wa': _WA_ES, 'wa_label': 'WhatsApp', 'phone': NAHUEL['phone_display'],
        'mail': mail(NAHUEL['email'], 'Primera consulta'), 'email': NAHUEL['email'], 'mail_label': 'Email',
    },
    'footer': {
        'role': 'Psicólogo General Sanitario · Barcelona y online',
        'team': 'Parte de',
        'legal': 'Título homologado para ejercer en España.',
    },
    'team_url': URLS['conjunta'] + '/',
    'wa': _WA_ES,
    'dock': {'label': 'Escribir a Nahuel', 'href': _WA_ES, 'external': True, 'track': 'whatsapp-dock'},
}

PT = {
    'scene': {'label': 'O que não se diz, insiste', 'lines': ['O que não se diz', '<em>insiste.</em>', 'Escutar <em>é começar.</em>']},
    'meta': {
        'title': 'Nahuel Ponce | Psicólogo em português em Barcelona e online · Psicanálise',
        'description': 'Psicólogo com orientação psicanalítica em Barcelona (Gràcia e Sants) e online, com atendimento em português. Ansiedade, angústia, luto, apego, trauma e processos migratórios.',
    },
    'schema': ES['schema'],
    'nav': [
        {'href': '#enfoque', 'label': 'Abordagem'},
        {'href': '#motivos', 'label': 'Motivos'},
        {'href': '#trayectoria', 'label': 'Trajetória'},
        {'href': '#servicios', 'label': 'Serviços'},
        {'href': '#preguntas', 'label': 'Perguntas'},
    ],
    'cta': {'href': '#contacto', 'label': 'Primeira consulta'},
    'hero': {
        'eyebrow': 'Psicólogo · Barcelona e online · Em português',
        'h1': 'Um espaço para escutar <em>o que insiste.</em>',
        'rotate_intro': 'Quando',
        'rotate': [
            'a angústia não encontra palavras.',
            'uma perda continua pesando.',
            'as mesmas cenas voltam a se repetir.',
            'o corpo diz o que não se consegue dizer.',
            'recomeçar é mais difícil do que parecia.',
        ],
        'lead': 'Psicoterapia de orientação psicanalítica para adultos. Presencial em Barcelona e online, em português e em espanhol.',
        'primary': 'Escrever no WhatsApp',
        'secondary': 'Conhecer a abordagem',
        'img_alt': 'Retrato em preto e branco de Nahuel Ponce, psicólogo, em uma avenida',
        'facts': [{'k': '+7', 'v': 'anos de experiência clínica'}, {'k': 'PT · ES', 'v': 'idiomas de atendimento'}, {'k': '45′', 'v': 'sessão individual'}],
    },
    'intro': {
        'kicker': 'Uma forma de trabalho',
        'title': 'Compreender antes de silenciar.',
        'text': 'A terapia pode abrir um tempo diferente: parar, colocar em palavras e compreender que lugar o sofrimento ocupa dentro da própria história.',
    },
    'approach': {
        'kicker': 'Abordagem terapêutica',
        'title': 'O que aparece como sintoma <em>também tem uma história.</em>',
        'paras': [
            'Trabalho a partir de uma perspectiva psicanalítica, oferecendo um espaço de escuta voltado a compreender o que está por trás do sofrimento e das situações que tendem a se repetir.',
            'O trabalho terapêutico permite aprofundar a história, os vínculos e as experiências particulares de cada pessoa. Cada processo é construído de forma individual, respeitando o tempo e a singularidade de quem procura ajuda.',
        ],
        'img_alt': 'Nahuel Ponce lendo em um café, em preto e branco',
        'details': [{'k': 'Modalidade', 'v': 'Presencial em Barcelona e online'}, {'k': 'Público', 'v': 'Principalmente adultos'}, {'k': 'Idiomas', 'v': 'Português e espanhol'}],
    },
    'reasons': {
        'kicker': 'Motivos de consulta',
        'title': 'Quando algo fica difícil de sustentar.',
        'lead': 'Não é preciso ter uma explicação pronta. O motivo inicial pode ser concreto ou apenas a sensação de que algo não está funcionando.',
        'items': [
            {'t': 'Ansiedade e angústia', 'd': 'Estresse, sensação de bloqueio ou um mal-estar difícil de nomear.'},
            {'t': 'Vínculos e apego', 'd': 'Conflitos nas relações, distância, dependência ou dificuldades que se repetem.'},
            {'t': 'Luto e perdas', 'd': 'Separações, mudanças de vida e processos que precisam de tempo para serem elaborados.'},
            {'t': 'Crises e mudanças', 'd': 'Momentos de transição, crises pessoais e novas etapas da vida.'},
            {'t': 'Trauma', 'd': 'Experiências difíceis cujos efeitos persistem no presente.'},
            {'t': 'Manifestações psicossomáticas', 'd': 'Sintomas no corpo que podem expressar algo da história de cada um.'},
            {'t': 'Identidade e migração', 'd': 'Desenraizamento, adaptação, saudade, distância dos vínculos de origem e novos projetos.'},
        ],
    },
    'about': {
        'kicker': 'Sobre mim',
        'title': 'Clínica, formação e <em>atualização permanente.</em>',
        'paras': [
            'Sou Psicólogo General Sanitario, habilitado para exercer na Espanha, com formação em psicanálise e mais de sete anos de experiência trabalhando principalmente com adultos, online e presencialmente.',
            'Trabalho especialmente com adultos que atravessam momentos de mudança, crises pessoais, dificuldades nas relações ou processos de adaptação a novas etapas da vida. Também tenho experiência com pessoas migrantes, estudantes internacionais e jovens adultos.',
            'Na Argentina fui docente universitário de Psicopatologia e História da Psicologia. Hoje sigo participando de espaços de formação, pesquisa, supervisão clínica e construção de casos em psicanálise.',
        ],
        'img_alt': 'Nahuel Ponce em uma rua ao entardecer, em preto e branco',
    },
    'career': {
        'kicker': 'Trajetória',
        'groups': [
            {'title': 'Experiência', 'items': [
                {'when': '2019 — atual', 'what': 'Psicólogo clínico · Consultório particular', 'where': 'Barcelona / online. Psicoterapia individual com adultos em português e espanhol: ansiedade, luto, apego, conflitos nas relações, trauma e manifestações psicossomáticas.'},
                {'when': '2024 — 2026', 'what': 'Psicólogo clínico · Instituto Fernando Ulloa', 'where': 'Buenos Aires / online. Atendimento clínico de adultos e participação em espaços de supervisão e construção de casos.'},
                {'when': '2025 — atual', 'what': 'OSDE Argentina', 'where': 'Seguradora de saúde internacional. Atendimento online.'},
                {'when': 'Atual', 'what': 'Membro da APOLa Barcelona', 'where': 'Formação, pesquisa, supervisão clínica e construção de casos voltadas à transmissão da psicanálise.'},
            ]},
            {'title': 'Formação', 'items': [
                {'when': '2025 — 2026', 'what': 'Pós-graduação em Clínica Psicanalítica', 'where': '«Variantes das neuroses clássicas» · Instituto Fernando Ulloa, Buenos Aires'},
                {'when': '2024 — 2025', 'what': 'Mestrado Universitário em Direção e Gestão de Pessoas', 'where': 'Universidad Europea Miguel de Cervantes, Valladolid'},
                {'when': '2019', 'what': 'Graduação em Psicologia', 'where': 'Universidad de la Cuenca del Plata, Argentina · Diploma homologado na Espanha'},
            ]},
        ],
        'extra_title': 'Formação complementar',
        'extra': [
            'Angústia: um chamado ao Outro e passagem ao ato',
            'Clínica dos gozos: do gozo do Outro',
            'O luto é tratado na clínica?',
            'Cuidado e intervenção no comportamento autolesivo e no suicídio',
            'A direção do tratamento',
            'Clínica das adições',
            'As formações do inconsciente — Seminário 5 de Jacques Lacan',
        ],
    },
    'banner': {
        'title': 'Presença para se encontrar. <em>Distância para poder chegar.</em>',
        'text': 'Consultórios em Gràcia e Sants, e sessões online de qualquer lugar.',
        'img_alt': 'Fachadas de uma avenida europeia em preto e branco',
    },
    'services': {
        'kicker': 'Serviços',
        'title': 'Um processo pensado para cada pessoa.',
        'items': [
            {'name': 'Psicoterapia individual', 'meta': '45 minutos · presencial ou online', 'text': 'Um espaço clínico para trabalhar o sofrimento, os vínculos, as perdas, as mudanças e aquilo que se repete.'},
            {'name': 'Sessão com valor flexível', 'meta': '1 hora · a partir de 40 €', 'text': 'Uma opção acessível para iniciar ou sustentar um processo terapêutico.'},
            {'name': 'Supervisão clínica', 'meta': '1 hora · presencial ou online', 'text': 'Supervisão e construção de casos para profissionais de saúde mental.'},
            {'name': 'Supervisão em grupo', 'meta': '2 horas · presencial ou online', 'text': 'Análise de casos clínicos para pessoas em formação psicanalítica.'},
        ],
        'migr_title': 'Processos migratórios',
        'migr_text': 'Acompanhamento de pessoas migrantes, estudantes internacionais e jovens adultos na adaptação, no desenraizamento e na construção de novos projetos pessoais.',
    },
    'places': {
        'in_person': 'Presencial',
        'address_note': 'Endereço exato ao confirmar a consulta',
        'kicker': 'Consultórios',
        'online_zone': 'Online',
        'online_title': 'Videochamada',
        'online_detail': 'Em português ou espanhol',
    },
    'faq': {
        'kicker': 'Perguntas frequentes',
        'title': 'Antes de começar.',
        'items': [
            {'q': 'Você atende presencialmente em Barcelona?', 'a': 'Sim. Atendo em consultórios em Barcelona (Gràcia e Sants) e também ofereço sessões online.'},
            {'q': 'Em quais idiomas podem ser as sessões?', 'a': 'Em português e em espanhol.'},
            {'q': 'Com que idades você trabalha?', 'a': 'Trabalho principalmente com adultos, incluindo jovens adultos e estudantes.'},
            {'q': 'Preciso saber exatamente o que está acontecendo comigo?', 'a': 'Não. A primeira consulta também serve para começar a colocar em palavras aquilo que preocupa ou causa sofrimento.'},
            {'q': 'Quanto dura uma sessão individual?', 'a': 'A sessão individual dura 45 minutos. Também existe uma modalidade com valor flexível, de uma hora, a partir de 40 €.'},
            {'q': 'Você trabalha com pessoas migrantes?', 'a': 'Sim. Tenho experiência acompanhando pessoas migrantes e estudantes internacionais em questões de identidade, desenraizamento, adaptação e distância dos vínculos de origem.'},
        ],
    },
    'contact': {
        'kicker': 'Primeira consulta',
        'title': 'Você pode começar escrevendo.',
        'lead': 'Não é preciso ter tudo claro de antemão. Conte brevemente o que te leva a buscar ajuda e combinamos uma primeira entrevista.',
        'wa': _WA_PT, 'wa_label': 'WhatsApp', 'phone': NAHUEL['phone_display'],
        'mail': mail(NAHUEL['email'], 'Primeira consulta'), 'email': NAHUEL['email'], 'mail_label': 'E-mail',
    },
    'footer': {
        'role': 'Psicólogo · Barcelona e online',
        'team': 'Parte de',
        'legal': 'Diploma homologado para exercer na Espanha.',
    },
    'team_url': URLS['conjunta'] + '/pt/',
    'wa': _WA_PT,
    'dock': {'label': 'Escrever para Nahuel', 'href': _WA_PT, 'external': True, 'track': 'whatsapp-dock'},
}

PAGES = {'es': ES, 'pt': PT}
