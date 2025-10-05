// Variables globals
const API_BASE = '../api/';

// Elements del DOM
const elements = {
    // Navegació
    btnLlistar: document.getElementById('btn-llistar'),
    btnCrear: document.getElementById('btn-crear'),
    btnEstadistiques: document.getElementById('btn-estadistiques'),
    
    // Seccions
    seccioLlistar: document.getElementById('seccio-llistar'),
    seccioFormulari: document.getElementById('seccio-formulari'),
    seccioEstadistiques: document.getElementById('seccio-estadistiques'),
    
    // Llistar preguntes
    cercaPregunta: document.getElementById('cerca-pregunta'),
    btnCercar: document.getElementById('btn-cercar'),
    btnRecarregar: document.getElementById('btn-recarregar'),
    llistaPreguntes: document.getElementById('llista-preguntes'),
    
    // Formulari
    titolFormulari: document.getElementById('titol-formulari'),
    formulariPregunta: document.getElementById('formulari-pregunta'),
    preguntaId: document.getElementById('pregunta-id'),
    preguntaText: document.getElementById('pregunta-text'),
    preguntaImatge: document.getElementById('pregunta-imatge'),
    previewImatge: document.getElementById('preview-imatge'),
    resposta1: document.getElementById('resposta-1'),
    resposta2: document.getElementById('resposta-2'),
    resposta3: document.getElementById('resposta-3'),
    resposta4: document.getElementById('resposta-4'),
    respostaCorrecta: document.getElementById('resposta-correcta'),
    preguntaActiva: document.getElementById('pregunta-activa'),
    btnGuardar: document.getElementById('btn-guardar'),
    btnCancellar: document.getElementById('btn-cancel·lar'),
    
    // Estadístiques
    totalPreguntes: document.getElementById('total-preguntes'),
    preguntesActives: document.getElementById('preguntes-actives'),
    totalPartides: document.getElementById('total-partides'),
    puntuacioMitjana: document.getElementById('puntuacio-mitjana'),
    sessionsRecents: document.getElementById('sessions-recents'),
    
    // Modal
    modalConfirmacio: document.getElementById('modal-confirmacio'),
    modalMissatge: document.getElementById('modal-missatge'),
    modalConfirmar: document.getElementById('modal-confirmar'),
    modalCancellar: document.getElementById('modal-cancel·lar')
};

// Estat de l'aplicació
let aplicacio = {
    preguntaEditant: null,
    preguntesCarregades: []
};

// Inicialització
document.addEventListener('DOMContentLoaded', function() {
    configurarEventListeners();
    carregarPreguntes();
    carregarEstadistiques();
});

function configurarEventListeners() {
    // Navegació
    elements.btnLlistar.addEventListener('click', () => mostrarSeccio('llistar'));
    elements.btnCrear.addEventListener('click', () => mostrarSeccio('crear'));
    elements.btnEstadistiques.addEventListener('click', () => mostrarSeccio('estadistiques'));
    
    // Cercar preguntes
    elements.btnCercar.addEventListener('click', cercarPreguntes);
    elements.btnRecarregar.addEventListener('click', carregarPreguntes);
    elements.cercaPregunta.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cercarPreguntes();
        }
    });
    
    // Formulari
    elements.formulariPregunta.addEventListener('submit', guardarPregunta);
    elements.btnCancellar.addEventListener('click', cancellarFormulari);
    elements.preguntaImatge.addEventListener('input', mostrarPreviewImatge);
    
    // Modal
    elements.modalCancellar.addEventListener('click', tancarModal);
    elements.modalConfirmacio.addEventListener('click', function(e) {
        if (e.target === elements.modalConfirmacio) {
            tancarModal();
        }
    });
}

function mostrarSeccio(seccio) {
    // Ocultar totes les seccions
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la secció seleccionada
    switch(seccio) {
        case 'llistar':
            elements.seccioLlistar.classList.add('active');
            elements.btnLlistar.classList.add('active');
            break;
        case 'crear':
            elements.seccioFormulari.classList.add('active');
            elements.btnCrear.classList.add('active');
            elements.titolFormulari.textContent = 'Crear Nova Pregunta';
            netejareFormulari();
            break;
        case 'estadistiques':
            elements.seccioEstadistiques.classList.add('active');
            elements.btnEstadistiques.classList.add('active');
            carregarEstadistiques();
            break;
    }
}

async function carregarPreguntes() {
    try {
        mostrarCarregant(elements.llistaPreguntes);
        
        const response = await fetch('../admin-api/llistarPreguntes.php');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        aplicacio.preguntesCarregades = data.preguntes;
        renderitzarPreguntes(data.preguntes);
        
    } catch (error) {
    // ...existing code...
        elements.llistaPreguntes.innerHTML = '<p>Error carregant les preguntes.</p>';
    }
}

function renderitzarPreguntes(preguntes) {
    if (preguntes.length === 0) {
        elements.llistaPreguntes.innerHTML = '<p>No s\'han trobat preguntes.</p>';
        return;
    }
    
    const svgBase64 = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" fill="#f8f9fa"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">Imatge no disponible</text></svg>');
    const html = preguntes.map(pregunta => `
        <div class="pregunta-item">
            <div class="pregunta-header">
                <div class="pregunta-text">${pregunta.pregunta}</div>
                <span class="pregunta-status ${pregunta.activa ? 'activa' : 'inactiva'}">
                    ${pregunta.activa ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            
            <img src="${pregunta.imatge}" alt="Bandera" class="pregunta-imatge"
                 onerror="this.src='${svgBase64}';">
            
            <div class="pregunta-respostes">
                <div class="resposta-item ${pregunta.resposta_correcta_index == 0 ? 'correcta' : ''}">${pregunta.resposta_1}</div>
                <div class="resposta-item ${pregunta.resposta_correcta_index == 1 ? 'correcta' : ''}">${pregunta.resposta_2}</div>
                <div class="resposta-item ${pregunta.resposta_correcta_index == 2 ? 'correcta' : ''}">${pregunta.resposta_3}</div>
                <div class="resposta-item ${pregunta.resposta_correcta_index == 3 ? 'correcta' : ''}">${pregunta.resposta_4}</div>
            </div>
            
            <div class="pregunta-actions">
                <button class="btn-editar" onclick="editarPregunta(${pregunta.id})">Editar</button>
                <button class="btn-eliminar" onclick="confirmarEliminacio(${pregunta.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    elements.llistaPreguntes.innerHTML = html;
}

function cercarPreguntes() {
    const terme = elements.cercaPregunta.value.toLowerCase().trim();
    
    if (terme === '') {
        renderitzarPreguntes(aplicacio.preguntesCarregades);
        return;
    }
    
    const preguntesFiltrades = aplicacio.preguntesCarregades.filter(pregunta => 
        pregunta.pregunta.toLowerCase().includes(terme) ||
        pregunta.resposta_1.toLowerCase().includes(terme) ||
        pregunta.resposta_2.toLowerCase().includes(terme) ||
        pregunta.resposta_3.toLowerCase().includes(terme) ||
        pregunta.resposta_4.toLowerCase().includes(terme)
    );
    
    renderitzarPreguntes(preguntesFiltrades);
}

function editarPregunta(id) {
    const pregunta = aplicacio.preguntesCarregades.find(p => p.id == id);
    
    if (!pregunta) {
        alert('Pregunta no trobada');
        return;
    }
    
    aplicacio.preguntaEditant = pregunta;
    
    // Omplir el formulari
    elements.preguntaId.value = pregunta.id;
    elements.preguntaText.value = pregunta.pregunta;
    elements.preguntaImatge.value = pregunta.imatge;
    elements.resposta1.value = pregunta.resposta_1;
    elements.resposta2.value = pregunta.resposta_2;
    elements.resposta3.value = pregunta.resposta_3;
    elements.resposta4.value = pregunta.resposta_4;
    elements.respostaCorrecta.value = pregunta.resposta_correcta_index;
    elements.preguntaActiva.checked = pregunta.activa == 1;
    
    mostrarPreviewImatge();
    
    // Canviar a la secció del formulari
    elements.titolFormulari.textContent = 'Editar Pregunta';
    mostrarSeccio('crear');
}

async function guardarPregunta(e) {
    e.preventDefault();
    
    const dadesFormulari = {
        id: elements.preguntaId.value || null,
        pregunta: elements.preguntaText.value.trim(),
        imatge: elements.preguntaImatge.value.trim(),
        resposta_1: elements.resposta1.value.trim(),
        resposta_2: elements.resposta2.value.trim(),
        resposta_3: elements.resposta3.value.trim(),
        resposta_4: elements.resposta4.value.trim(),
        resposta_correcta_index: parseInt(elements.respostaCorrecta.value),
        activa: elements.preguntaActiva.checked
    };
    
    // Validació
    if (!dadesFormulari.pregunta || !dadesFormulari.imatge) {
        alert('Si us plau, omple tots els camps obligatoris.');
        return;
    }
    
    if (!dadesFormulari.resposta_1 || !dadesFormulari.resposta_2 || 
        !dadesFormulari.resposta_3 || !dadesFormulari.resposta_4) {
        alert('Si us plau, omple totes les respostes.');
        return;
    }
    
    if (isNaN(dadesFormulari.resposta_correcta_index)) {
        alert('Si us plau, selecciona la resposta correcta.');
        return;
    }
    
    try {
        elements.btnGuardar.disabled = true;
        elements.btnGuardar.textContent = 'Guardant...';
        
        const url = dadesFormulari.id ? '../admin-api/editarPregunta.php' : '../admin-api/crearPregunta.php';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadesFormulari)
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        alert(dadesFormulari.id ? 'Pregunta actualitzada correctament!' : 'Pregunta creada correctament!');
        
        // Recarregar preguntes i tornar a la llista
        await carregarPreguntes();
        mostrarSeccio('llistar');
        
    } catch (error) {
    // ...existing code...
        alert('Error guardant la pregunta: ' + error.message);
    } finally {
        elements.btnGuardar.disabled = false;
        elements.btnGuardar.textContent = 'Guardar Pregunta';
    }
}

function confirmarEliminacio(id) {
    const pregunta = aplicacio.preguntesCarregades.find(p => p.id == id);
    
    if (!pregunta) {
        alert('Pregunta no trobada');
        return;
    }
    
    elements.modalMissatge.textContent = `Estàs segur que vols eliminar la pregunta "${pregunta.pregunta}"?`;
    elements.modalConfirmacio.style.display = 'block';
    
    elements.modalConfirmar.onclick = () => {
        eliminarPregunta(id);
        tancarModal();
    };
}

async function eliminarPregunta(id) {
    try {
        const response = await fetch('../admin-api/eliminarPregunta.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        alert('Pregunta eliminada correctament!');
        carregarPreguntes();
        
    } catch (error) {
    // ...existing code...
        alert('Error eliminant la pregunta: ' + error.message);
    }
}

function cancellarFormulari() {
    netejareFormulari();
    mostrarSeccio('llistar');
}

function netejareFormulari() {
    aplicacio.preguntaEditant = null;
    elements.formulariPregunta.reset();
    elements.preguntaId.value = '';
    elements.previewImatge.innerHTML = '';
    elements.preguntaActiva.checked = true;
}

function mostrarPreviewImatge() {
    const url = elements.preguntaImatge.value.trim();
    
    if (url) {
        elements.previewImatge.innerHTML = `<img src="${url}" alt="Preview" onerror="this.style.display='none'">`;
    } else {
        elements.previewImatge.innerHTML = '';
    }
}

async function carregarEstadistiques() {
    try {
        const response = await fetch('../admin-api/estadistiques.php');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Actualitzar estadístiques generals
        elements.totalPreguntes.textContent = data.total_preguntes || 0;
        elements.preguntesActives.textContent = data.preguntes_actives || 0;
        elements.totalPartides.textContent = data.total_partides || 0;
        elements.puntuacioMitjana.textContent = (data.puntuacio_mitjana || 0) + '%';
        
        // Mostrar sessions recents
        if (data.sessions_recents && data.sessions_recents.length > 0) {
            const htmlSessions = data.sessions_recents.map(sessio => `
                <div class="session-item">
                    <div>
                        <strong>${sessio.puntuacio}/${sessio.total_preguntes}</strong>
                        (${Math.round((sessio.puntuacio / sessio.total_preguntes) * 100)}%)
                    </div>
                    <div>
                        ${new Date(sessio.data_sessio).toLocaleString('ca-ES')}
                    </div>
                </div>
            `).join('');
            
            elements.sessionsRecents.innerHTML = htmlSessions;
        } else {
            elements.sessionsRecents.innerHTML = '<p>No hi ha sessions recents.</p>';
        }
        
    } catch (error) {
    // ...existing code...
    }
}

function tancarModal() {
    elements.modalConfirmacio.style.display = 'none';
}

function mostrarCarregant(element) {
    element.innerHTML = '<p>Carregant...</p>';
}