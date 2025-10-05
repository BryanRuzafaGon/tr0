let estatDeLaPartida = crearEstatInicial();

function crearEstatInicial(nom = null) {
    return {
        contadorPreguntes: 0,          // quantes s'han contestat realment
        respostesUsuari: [],          // índex triat per cada pregunta
        preguntes: [],                // preguntes carregades
        preguntaActual: 0,            // índex que estem mostrant
        puntuacio: 0,                 // encerts
        tempsRestant: 30,             // segons
        tempsFinalitzat: false,       // bandera de final
        intervalTemporizador: null,   // id requestAnimationFrame
        nomUsuari: nom                // nom visible
    };
}

const el = (id) => document.getElementById(id);
const elements = {
    pantallaInici: el('pantalla-inici'),
    pantallaJoc: el('pantalla-joc'),
    pantallaResultats: el('pantalla-resultats'),
    formulariNom: el('formulari-nom'),
    salutacio: el('salutacio'),
    nomUsuari: el('nom-usuari'),
    nomGuardat: el('nom-guardat'),
    btnComençar: el('btn-començar'),
    btnContinuar: el('btn-continuar'),
    btnEsborrarNom: el('btn-esborrar-nom'),
    partida: el('partida'),
    numPregunta: el('num-pregunta'),
    puntuacio: el('puntuacio'),
    comptadorTemps: el('comptador-temps'),
    btnAnterior: el('btn-anterior'),
    btnSeguent: el('btn-següent'),
    navegacio: el('navegacio'),
    resumResultats: el('resum-resultats'),
    btnNovaPartida: el('btn-nova-partida'),
    // Ranking
    btnVeureRanking: el('btn-ver-ranking'),
    pantallaRanking: el('pantalla-ranking'),
    llistaRanking: el('llista-ranking'),
    btnTornarResultats: el('btn-tornar-resultats'),
    btnNovaPartida2: el('btn-nova-partida-2')
};

document.addEventListener('DOMContentLoaded', () => {
    inicialitzarApp();
    configurarEventListeners();
});

function inicialitzarApp() {
    const nom = localStorage.getItem('nomUsuari');
    if (nom) {
        elements.nomGuardat.textContent = nom;
        elements.formulariNom.classList.add('hidden');
        elements.salutacio.classList.remove('hidden');
    }
}

function configurarEventListeners() {
    // Pantalla d'inici
    elements.btnComençar?.addEventListener('click', començarJocAmbNom);
    elements.btnContinuar?.addEventListener('click', començarJoc);
    elements.btnEsborrarNom?.addEventListener('click', esborrarNom);
    elements.nomUsuari?.addEventListener('keypress', e => e.key === 'Enter' && començarJocAmbNom());
    // Joc
    elements.partida?.addEventListener('click', gestionarClicResposta);
    elements.btnAnterior?.addEventListener('click', anarAnteriorPregunta);
    elements.btnSeguent?.addEventListener('click', anarSeguentPregunta);
    elements.btnNovaPartida?.addEventListener('click', novaPartida);
    elements.btnNovaPartida2?.addEventListener('click', novaPartida);
    // Ranking
    elements.btnVeureRanking?.addEventListener('click', mostrarRanking);
    elements.btnTornarResultats?.addEventListener('click', () => {
        elements.pantallaRanking.classList.add('hidden');
        elements.pantallaResultats.classList.remove('hidden');
    });
}

function començarJocAmbNom() {
    const nom = elements.nomUsuari.value.trim();
    if (!nom) return alert('Si us plau, introdueix el teu nom');
    localStorage.setItem('nomUsuari', nom);
    començarJoc();
}

function esborrarNom() {
    localStorage.removeItem('nomUsuari');
    elements.salutacio.classList.add('hidden');
    elements.formulariNom.classList.remove('hidden');
    elements.nomUsuari.value = '';
}

async function començarJoc() {
    try {
        elements.pantallaInici.classList.add('hidden');
        elements.pantallaJoc.classList.remove('hidden');
        reinicialitzarEstatPartida();
        estatDeLaPartida.nomUsuari = localStorage.getItem('nomUsuari') || 'Anònim';
        await carregarPreguntes();
        if (!estatDeLaPartida.preguntes.length) throw new Error('Sense preguntes');
        iniciarTemporizador();
        mostrarPregunta();
    } catch (e) {
        alert('No s\'ha pogut iniciar el joc: ' + e.message);
        elements.pantallaJoc.classList.add('hidden');
        elements.pantallaInici.classList.remove('hidden');
    }
}

function reinicialitzarEstatPartida() {
    const nom = estatDeLaPartida.nomUsuari;
    estatDeLaPartida = crearEstatInicial(nom);
    elements.navegacio?.classList.add('hidden');
    if (elements.btnAnterior) elements.btnAnterior.disabled = false;
    if (elements.btnSeguent) elements.btnSeguent.disabled = false;
    if (elements.comptadorTemps) {
        elements.comptadorTemps.style.color = '';
        elements.comptadorTemps.style.fontWeight = '';
    }
    renderitzarMarcador();
}

async function carregarPreguntes() {
    const urls = [
        '../server/api/getPreguntes.php?num=30',
        '../../server/api/getPreguntes.php?num=30',
        '/server/api/getPreguntes.php?num=30'
    ];
    for (const url of urls) {
        try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const data = await r.json();
            if (!data.preguntes?.length) continue;
            estatDeLaPartida.preguntes = barrejarArray(
                data.preguntes.map(p => prepararPregunta(p))
            );
            return;
        } catch { /* provem següent */ }
    }
    throw new Error('No s\'han pogut carregar preguntes');
}

function prepararPregunta(p) {
    if (!p.respostes) {
        p.respostes = [p.resposta_1, p.resposta_2, p.resposta_3, p.resposta_4];
    }
    if (typeof p.resposta_correcta_index !== 'number' || p.resposta_correcta_index < 0 || p.resposta_correcta_index > 3) {
        p.resposta_correcta_index = 0;
    }
    return randomitzarRespostes(p);
}

function barrejarArray(array) {
    const arrayCopia = [...array];
    for (let i = arrayCopia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopia[i], arrayCopia[j]] = [arrayCopia[j], arrayCopia[i]];
    }
    return arrayCopia;
}

function randomitzarRespostes(pregunta) {
    const respostaCorrecta = pregunta.respostes[pregunta.resposta_correcta_index];
    
    const indexosBarrejats = barrejarArray([0, 1, 2, 3]);
    
    const respostesBarrejades = indexosBarrejats.map(i => pregunta.respostes[i]);
    
    const nouIndexCorrect = respostesBarrejades.indexOf(respostaCorrecta);
    
    pregunta.respostes = respostesBarrejades;
    pregunta.resposta_correcta_index = nouIndexCorrect;
    

    return pregunta;
}

function mostrarPregunta() {
    if (estatDeLaPartida.preguntaActual >= estatDeLaPartida.preguntes.length) return finalitzarPartida();
    const p = estatDeLaPartida.preguntes[estatDeLaPartida.preguntaActual];
    elements.partida.innerHTML = `
      <div class="pregunta">
        <h2>${p.pregunta}</h2>
        <img src="${p.imatge}" alt="Bandera del país" class="imatge-bandera">
        <div class="respostes">
          ${p.respostes.map((r,i)=>`<button class="resposta" data-index="${i}">${r}</button>`).join('')}
        </div>
      </div>`;
    if (estatDeLaPartida.preguntaActual < estatDeLaPartida.contadorPreguntes) mostrarPreguntaContestada();
    (estatDeLaPartida.contadorPreguntes>0?elements.navegacio.classList.remove('hidden'):elements.navegacio.classList.add('hidden'));
    actualitzarEstatNavegacio();
    renderitzarMarcador();
}

function mostrarPreguntaContestada() {
    const p = estatDeLaPartida.preguntes[estatDeLaPartida.preguntaActual];
    const idxUsuari = estatDeLaPartida.respostesUsuari[estatDeLaPartida.preguntaActual];
    const idxCorrecte = p.correctIndex ?? p.resposta_correcta_index ?? 0;
    const botons = document.querySelectorAll('.resposta');
    botons.forEach(b=>b.disabled=true);
    botons[idxCorrecte]?.classList.add('correcta');
    if (idxUsuari !== idxCorrecte) botons[idxUsuari]?.classList.add('incorrecta','seleccionada');
    else botons[idxUsuari]?.classList.add('seleccionada');
}

function actualitzarEstatNavegacio() {
    const idx = estatDeLaPartida.preguntaActual;
    const contestades = estatDeLaPartida.contadorPreguntes;
    const total = estatDeLaPartida.preguntes.length;
    if (elements.btnAnterior) elements.btnAnterior.disabled = (idx === 0);
    if (elements.btnSeguent) {
        let disabled;
        if (estatDeLaPartida.tempsFinalitzat) disabled = idx >= contestades - 1;
        else if (idx < contestades - 1) disabled = false;
        else if (idx === contestades - 1) disabled = (idx + 1 >= total);
        else disabled = true;
        elements.btnSeguent.disabled = disabled;
    }
}

function anarAnteriorPregunta() {
    if (estatDeLaPartida.preguntaActual === 0) return;
    estatDeLaPartida.preguntaActual--;
    mostrarPregunta();
}

function anarSeguentPregunta() {
    const {preguntaActual, contadorPreguntes, tempsFinalitzat, preguntes} = estatDeLaPartida;
    if (preguntaActual < contadorPreguntes - 1) {
        estatDeLaPartida.preguntaActual++;
        return mostrarPregunta();
    }
    if (!tempsFinalitzat && preguntaActual === contadorPreguntes - 1 && preguntaActual + 1 < preguntes.length) {
        estatDeLaPartida.preguntaActual++;
        return mostrarPregunta();
    }
}

function gestionarClicResposta(e) {
    if (estatDeLaPartida.tempsFinalitzat || estatDeLaPartida.tempsRestant <= 0) return;
    if (estatDeLaPartida.preguntaActual < estatDeLaPartida.contadorPreguntes) return;
    const btn = e.target;
    if (!btn.classList.contains('resposta')) return;
    const index = +btn.dataset.index;
    estatDeLaPartida.respostesUsuari.push(index);
    btn.classList.add('seleccionada');
    document.querySelectorAll('.resposta').forEach(b=>b.disabled=true);
    mostrarRespostaCorrecta();
    setTimeout(()=>{
        if (!estatDeLaPartida.tempsFinalitzat && estatDeLaPartida.tempsRestant>0) següentPregunta();
        else finalitzarPartida();
    },1000);
}

function mostrarRespostaCorrecta() {
    const p = estatDeLaPartida.preguntes[estatDeLaPartida.preguntaActual];
    const idxUsuari = estatDeLaPartida.respostesUsuari.at(-1);
    const idxCorrecte = p.correctIndex ?? p.resposta_correcta_index ?? 0;
    const botons = document.querySelectorAll('.resposta');
    botons[idxCorrecte]?.classList.add('correcta');
    if (idxUsuari !== idxCorrecte) botons[idxUsuari]?.classList.add('incorrecta');
    else estatDeLaPartida.puntuacio++;
}

function següentPregunta() {
    if (estatDeLaPartida.tempsFinalitzat || estatDeLaPartida.tempsRestant <= 0) return finalitzarPartida();
    estatDeLaPartida.preguntaActual++;
    estatDeLaPartida.contadorPreguntes++;
    if (estatDeLaPartida.preguntaActual >= estatDeLaPartida.preguntes.length) return finalitzarPartida();
    mostrarPregunta();
}

function renderitzarMarcador() {
    elements.numPregunta.textContent = `${estatDeLaPartida.puntuacio}/${estatDeLaPartida.contadorPreguntes}`;
    const pct = estatDeLaPartida.contadorPreguntes ? Math.round((estatDeLaPartida.puntuacio/estatDeLaPartida.contadorPreguntes)*100) : 0;
    elements.puntuacio.textContent = pct + '%';
}

function iniciarTemporizador() {
    const barra = document.getElementById('barra-temps');
    const inici = performance.now();
    const DURADA = 30000;
    function tick() {
        const trans = performance.now() - inici;
        const restant = Math.max(0, DURADA - trans);
        const s = Math.ceil(restant/1000);
        if (s !== estatDeLaPartida.tempsRestant) {
            estatDeLaPartida.tempsRestant = s;
            elements.comptadorTemps.textContent = s;
            if (s <= 10) { elements.comptadorTemps.style.color = '#dc3545'; elements.comptadorTemps.style.fontWeight='bold'; }
            if (s <= 5) barra?.classList.add('danger');
        }
        if (barra) {
            const percent = (trans / DURADA) * 100;
            barra.style.width = Math.min(100, percent) + '%';
            barra.style.backgroundColor = s <=5 ? '#dc3545' : s<=10 ? '#ffc107' : calcularColorProgress(percent/100);
            if (percent>5) barra.classList.add('shadow-fill');
            if (percent>=100) barra.classList.add('finishing');
        }
        if (restant<=0 || estatDeLaPartida.tempsFinalitzat) {
            estatDeLaPartida.tempsRestant = 0;
            elements.comptadorTemps.textContent = 0;
            aturarTemporizador();
            return finalitzarPartida();
        }
        estatDeLaPartida.intervalTemporizador = requestAnimationFrame(tick);
    }
    estatDeLaPartida.intervalTemporizador = requestAnimationFrame(tick);
}

function aturarTemporizador() {
    if (estatDeLaPartida.intervalTemporizador) cancelAnimationFrame(estatDeLaPartida.intervalTemporizador);
    estatDeLaPartida.intervalTemporizador = null;
}


function finalitzarPartida() {
        aturarTemporizador();
        estatDeLaPartida.tempsFinalitzat = true;
        elements.navegacio?.classList.add('hidden');
        if (elements.btnAnterior) elements.btnAnterior.disabled = true;
        if (elements.btnSeguent) elements.btnSeguent.disabled = true;
        const barra = document.getElementById('barra-temps');
        if (barra) barra.style.width = '100%';
        document.querySelectorAll('.resposta').forEach(b=>b.disabled = true);
        if (!estatDeLaPartida.contadorPreguntes) return;
        elements.partida.innerHTML = `
            <div class="timeout-animation">
                <div class="timeout-clock">
                    <div class="clock-face">
                        <div class="clock-hand hour-hand"></div>
                        <div class="clock-hand minute-hand"></div>
                        <div class="clock-center"></div>
                    </div>
                    <div class="timeout-waves">
                        <div class="wave wave-1"></div><div class="wave wave-2"></div><div class="wave wave-3"></div>
                    </div>
                </div>
                <div class="timeout-message">
                    <h2 class="timeout-main-title">S'ha acabat el temps!</h2>
                    <p class="timeout-subtitle">Processant els teus resultats...</p>
                </div>
                <div class="timeout-action">
                    <button class="results-btn" onclick="enviarResultats()">
                        <span class="btn-icon">📊</span><span class="btn-text">Veure els meus Resultats</span><div class="btn-shine"></div>
                    </button>
                </div>
            </div>`;
}

async function enviarResultats() {
    let data = null;
    const urls = [
        '../server/api/finalitza.php',
        '../../server/api/finalitza.php',
        '/server/api/finalitza.php',
        '../server/api/finalitza-fallback.php'
    ];
    const payload = {
        respostes: estatDeLaPartida.respostesUsuari,
        nom_usuari: estatDeLaPartida.nomUsuari || 'Anònim',
        temps_client: 30 - estatDeLaPartida.tempsRestant,
        preguntes_contestades: estatDeLaPartida.contadorPreguntes,
        preguntes_correctes: estatDeLaPartida.puntuacio,
        percentatge_client: estatDeLaPartida.contadorPreguntes ? Math.round((estatDeLaPartida.puntuacio/estatDeLaPartida.contadorPreguntes)*100) : 0
    };
    for (const url of urls) {
        try {
            const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
            if (!r.ok) continue; data = await r.json(); if (!data.error) break;
        } catch {/* següent */}
    }
    if (!data) {
        elements.resumResultats.innerHTML = `<div class="error" style="color:#dc3545;text-align:center;padding:20px;">
          <h3>❌ Error de connexió</h3><p>No s'han pogut guardar els resultats.</p>
          <button onclick="novaPartida()" class="btn">Tornar a jugar</button></div>`;
        return mostrarPantallaResultats();
    }
    enviarAlRanking(data);
    mostrarResultatsFinals(data);
}

function mostrarPantallaResultats() {
    elements.pantallaJoc.classList.add('hidden');
    elements.pantallaResultats.classList.remove('hidden');
}

function mostrarResultatsFinals(d) {
    const {percentatge, correctes:encerts, total, temps_utilitzat:temps} = d;
    const rangs = [
        {min:90,cat:'PERFECTE!',col:'#ffd700',ic:'🏆'},
        {min:80,cat:'EXCEL·LENT',col:'#ff6b35',ic:'🌟'},
        {min:70,cat:'MOLT BÉ',col:'#4ecdc4',ic:'👏'},
        {min:60,cat:'BÉ',col:'#45b7d1',ic:'👍'},
        {min:50,cat:'ACCEPTABLE',col:'#96ceb4',ic:'💪'},
        {min:0, cat:'POTS MILLORAR',col:'#feca57',ic:'🎯'}
    ];
    const {cat:categoria,col:colorCategoria,ic:iconCategoria} = rangs.find(r=>percentatge>=r.min);
    elements.resumResultats.innerHTML = `
      <div class="results-container">
        <div class="results-header">
          <div class="score-circle"><div class="score-number">${encerts}/${total}</div><div class="score-subtitle">ENCERTS</div></div>
          <div class="category-badge" style="background:${colorCategoria};"><span class="category-icon">${iconCategoria}</span><span class="category-text">${categoria}</span></div>
        </div>
        <div class="stats-section">
          <h3 class="section-title">📊 Estadístiques</h3>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${encerts}</div><div class="stat-label">Encerts</div></div>
            <div class="stat-card"><div class="stat-icon">📊</div><div class="stat-value">${percentatge}%</div><div class="stat-label">Precisió</div></div>
            <div class="stat-card"><div class="stat-icon">⏱️</div><div class="stat-value">${temps}s</div><div class="stat-label">Temps</div></div>
          </div>
        </div>
      </div>`;
    mostrarPantallaResultats();
}

async function enviarAlRanking(d) {
    const urls = ['../server/api/ranking.php','../../server/api/ranking.php','/server/api/ranking.php'];
    const body = {
        nom_usuari: estatDeLaPartida.nomUsuari || 'Anònim',
        puntuacio: d.correctes || estatDeLaPartida.puntuacio,
        preguntes_correctes: d.correctes || estatDeLaPartida.puntuacio,
        preguntes_totals: d.total || estatDeLaPartida.contadorPreguntes,
        percentatge: d.percentatge || 0,
        temps_total: d.temps_utilitzat || 30
    };
    for (const u of urls) {
        try { const r = await fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); if (r.ok) return; } catch { /* seg */ }
    }
}

async function obtenirRanking() {
    const urls = ['../server/api/ranking.php','../../server/api/ranking.php','/server/api/ranking.php'];
    for (const u of urls) {
        try { const r = await fetch(u); if (!r.ok) continue; const d = await r.json(); if (d.ranking) return d.ranking; } catch { }
    }
    return [];
}

function generarAvatar(nom) {
    if (!nom || nom.trim() === '') return '👤';
    const primeraLletra = nom.trim().charAt(0).toUpperCase();
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
        'linear-gradient(135deg, #ff8a80 0%, #ffb74d 100%)',
        'linear-gradient(135deg, #81c784 0%, #aed581 100%)'
    ];
    const gradientIndex = primeraLletra.charCodeAt(0) % gradients.length;
    const backgroundGradient = gradients[gradientIndex];
    
    return `<div class="avatar" style="
        width: 40px; height: 40px; 
        border-radius: 50%; 
        background: ${backgroundGradient}; 
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        font-size: 16px;
        margin-right: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3);
        border: 2px solid rgba(255,255,255,0.2);
        position: relative;
        overflow: hidden;
    ">
        <span style="position: relative; z-index: 2;">${primeraLletra}</span>
        <div style="
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            z-index: 1;
        "></div>
    </div>`;
}

function formatTemps(s) {
    if (s < 60) return s + 's';
    const m = Math.floor(s/60); const rest = s % 60;
    return `${m}m ${rest}s`;
}

function crearFilaRanking(entry, idx, esJugadorActual = false) {
    const classes = ['fila-ranking'];
    if (idx === 0) classes.push('top1');
    else if (idx === 1) classes.push('top2');
    else if (idx === 2) classes.push('top3');
    
    // Resaltar si és el jugador actual
    if (esJugadorActual) {
        classes.push('jugador-actual');
    }
    
    const pos = idx + 1;
    let badge = '';
    if (pos === 1) {
        badge = '🥇';
    } else if (pos === 2) {
        badge = '🥈';
    } else if (pos === 3) {
        badge = '🥉';
    }
    
    const avatar = generarAvatar(entry.nom);
    const metriques = calcularMetriquesRendiment(entry);
    const destacat = esJugadorActual ? '<span class="nou-al-ranking">🎆 TU!</span>' : '';
    
    // Barra de progrés per a la precisió
    const progressBar = `
        <div class="progress-container">
            <div class="progress-bar" style="width: ${entry.percentatge}%; background: ${metriques.color};"></div>
            <span class="progress-text">${entry.percentatge}%</span>
        </div>
    `;
        const stats = `
        <div class="player-stats">
            <div class="stat-item">
                <span class="stat-label">Encerts</span>
                <span class="stat-value">${entry.encerts}/${entry.contestades}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Temps</span>
                <span class="stat-value">${formatTemps(entry.temps)}</span>
            </div>
        </div>
    `;
    
    return `<div class="${classes.join(' ')}">
        <div class="rank-position">
            <span class="position-number">${pos}</span>
            ${badge ? `<span class="badge">${badge}</span>` : ''}
        </div>
        
        <div class="player-info-extended">
            <div class="player-main">
                <div class="avatar-container">
                    ${pos === 1 ? '<div class="crown-above-avatar">👑</div>' : ''}
                    ${avatar}
                </div>
                <div class="player-details">
                    <div class="player-name">${escapeHtml(entry.nom)} ${destacat}</div>
                    <div class="player-category" style="color: ${metriques.color};">
                        ${metriques.icon} ${metriques.categoria}
                    </div>
                </div>
            </div>
            
            <div class="performance-section">
                <div class="accuracy-display">
                    ${progressBar}
                </div>
                ${stats}
            </div>
        </div>
        
        <div class="rank-score">
            <div class="score-main">${Math.round((entry.percentatge * entry.contestades) / 10)}</div>
            <div class="score-label">PUNTS</div>
        </div>
    </div>`;
}

function calcularMetriquesRendiment(entry) {
    const percent = entry.percentatge;
    const efficiency = entry.contestades > 0 ? (entry.encerts / entry.contestades) : 0;
    
    let categoria, color, icon;
    if (percent >= 90) {
        categoria = 'LEGEND';
        color = '#ffd700';
        icon = '🏆';
    } else if (percent >= 80) {
        categoria = 'EXPERT';
        color = '#ff6b35';
        icon = '🔥';
    } else if (percent >= 70) {
        categoria = 'PRO';
        color = '#4ecdc4';
        icon = '⭐';
    } else if (percent >= 60) {
        categoria = 'AVANÇAT';
        color = '#45b7d1';
        icon = '💪';
    } else if (percent >= 50) {
        categoria = 'INTERMEDI';
        color = '#96ceb4';
        icon = '📈';
    } else {
        categoria = 'NOVELL';
        color = '#feca57';
        icon = '🌱';
    }
    
    return {
        categoria,
        color,
        icon,
        efficiency: Math.round(efficiency * 100),
        percentatge: percent
    };
}

function escapeHtml(text) {
    return text.replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

async function mostrarRanking() {
    elements.pantallaResultats.classList.add('hidden');
    elements.pantallaRanking.classList.remove('hidden');
    elements.llistaRanking.innerHTML = '<div style="padding:15px;">🔄 Carregant rànquing...</div>';
    const ranking = await obtenirRanking();
    if (!ranking.length) return elements.llistaRanking.innerHTML='<div style="padding:15px;">📈 No hi ha dades de rànquing encara.</div>';
    const nomActual = estatDeLaPartida.nomUsuari;
    const idxJugador = ranking.findIndex(r=>r.nom.toLowerCase().trim()===nomActual?.toLowerCase().trim());
    elements.llistaRanking.innerHTML = ranking.map((e,i)=>crearFilaRanking(e,i,i===idxJugador)).join('');
    if (idxJugador>=0) {
        const popup = document.createElement('div');
        popup.className='popup-ranking-flotant';
        popup.innerHTML=`<div class="popup-content"><div class="popup-icon">🏆</div><div class="popup-text"><div class="popup-title">Felicitats!</div><div class="popup-subtitle">Posició ${idxJugador+1} al top 10</div></div></div>`;
        document.body.appendChild(popup);
        setTimeout(()=>popup.remove(),5000);
    }
}

// Funció per calcular el color de la barra segons progrés 
function calcularColorProgress(t) {
    t = Math.min(1, Math.max(0, t));
    // Verd (#28a745) -> Groc (#ffc107) -> Vermell (#dc3545)
    let r, g, b;
    if (t <= 0.5) {
        const p = t / 0.5;
        r = Math.round(40 + (255 - 40) * p);
        g = Math.round(167 + (193 - 167) * p);
        b = Math.round(69 + (7 - 69) * p);
    } else {
        const p = (t - 0.5) / 0.5;
        r = Math.round(255 + (220 - 255) * p);
        g = Math.round(193 + (53 - 193) * p);
        b = Math.round(7 + (69 - 7) * p);
    }
    return `rgb(${r},${g},${b})`;
}

function novaPartida() {
    elements.pantallaResultats.classList.add('hidden');
    elements.pantallaRanking.classList.add('hidden');
    elements.pantallaJoc.classList.add('hidden');
    elements.pantallaInici.classList.remove('hidden');
    reinicialitzarEstatPartida();
}

