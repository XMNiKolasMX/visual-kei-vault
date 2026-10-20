// ==========================================
// 1. FUNCIONES AUXILIARES (Badge & Buscador)
// ==========================================

// Evalúa si un registro fue creado en los últimos 7 días
function esNuevo(fechaCreacion) {
    if (!fechaCreacion) return false;
    const fechaRegistro = new Date(fechaCreacion);
    const ahora = new Date();
    const diferenciaDias = (ahora - fechaRegistro) / (1000 * 60 * 60 * 24);
    return diferenciaDias <= 7; // Retorna true si tiene 7 días o menos de subido
}

// Buscador en tiempo real para filtrar bandas por nombre o álbum
function filtrarBandas() {
    const input = document.getElementById('search-input');
    if (!input) return;
    
    const filtro = input.value.toLowerCase();
    const filas = document.querySelectorAll('#discography-tbody tr');

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        if (textoFila.includes(filtro)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

// ==========================================
// 2. AUTO-DETECCIÓN DE CANCIONES (MusicBrainz)
// ==========================================

async function autoDetectarTracklist(banda, album) {
    try {
        console.log(`Consultando MusicBrainz para: ${banda} - ${album}...`);
        
        const query = encodeURIComponent(`artist:"${banda}" AND release:"${album}"`);
        const response = await fetch(`https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json`);
        const data = await response.json();

        if (!data.releases || data.releases.length === 0) {
            console.warn('No se encontró el álbum en MusicBrainz.');
            return [];
        }

        const releaseId = data.releases[0].id;
        const trackResponse = await fetch(`https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`);
        const trackData = await trackResponse.json();

        let canciones = [];
        if (trackData.media && trackData.media[0].tracks) {
            canciones = trackData.media[0].tracks.map((t, index) => `${index + 1}. ${t.title}`);
        }

        return canciones;
    } catch (err) {
        console.error('Error al detectar canciones:', err);
        return [];
    }
}

// ==========================================
// 3. GUARDAR DESDE EL PANEL ADMIN (admin.html)
// ==========================================

const albumForm = document.getElementById('album-form');
if (albumForm) {
    albumForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const banda = document.getElementById('input-banda').value;
        const album = document.getElementById('input-album').value;
        const year = document.getElementById('input-year').value;
        const terabox = document.getElementById('input-terabox').value;
        const btnSubmit = document.getElementById('btn-save');

        btnSubmit.innerText = 'Detectando canciones...';
        btnSubmit.disabled = true;

        // Auto-detección
        const canciones = await autoDetectarTracklist(banda, album);

        btnSubmit.innerText = 'Guardando en Supabase...';

        const { data, error } = await db.from('discography').insert([
            { 
                band_name: banda, 
                album_title: album, 
                release_year: year,
                terabox_link: terabox, 
                tracklist: canciones 
            }
        ]);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            alert(`¡Guardado! ${album} registrado con ${canciones.length} canciones detectadas automáticamente.`);
            albumForm.reset();
            cargarDiscos();
        }

        btnSubmit.innerText = 'Guardar Álbum';
        btnSubmit.disabled = false;
    });
}

// ==========================================
// 4. CARGAR TABLA CON BADGE "¡NUEVO!"
// ==========================================

async function cargarDiscos() {
    const tbody = document.getElementById('discography-tbody');
    if (!tbody) return;

    const { data, error } = await db.from('discography').select('*').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay discos guardados aún.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    data.forEach(item => {
        // Indicador NUEVO si se subió hace menos de 7 días
        const badgeNuevo = esNuevo(item.created_at) 
            ? `<span class="badge-nuevo">¡NUEVO!</span>` 
            : '';

        // Lista de canciones
        let tracklistHtml = '<span style="color:#666;">Sin canciones detectadas</span>';
        if (item.tracklist && item.tracklist.length > 0) {
            tracklistHtml = `<ul class="tracklist-ul">` + 
                item.tracklist.map(song => `<li>${song}</li>`).join('') + 
                `</ul>`;
        }

        // Fila de la tabla
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.band_name}</strong> ${badgeNuevo}</td>
            <td>${item.album_title} (${item.release_year || 'N/A'})</td>
            <td>${item.terabox_link ? `<a href="${item.terabox_link}" target="_blank" class="terabox-btn">Descargar TeraBox</a>` : 'Sin Link'}</td>
            <td>${tracklistHtml}</td>
            ${document.getElementById('admin-tbody') ? `<td><button onclick="borrarDisco('${item.id}')" style="background:#500; color:#fff; border:none; padding:4px 8px; cursor:pointer;">Borrar</button></td>` : ''}
        `;
        tbody.appendChild(tr);
    });
}

// Eliminar Registro desde Admin
async function borrarDisco(id) {
    if (confirm('¿Deseas eliminar este registro de la base de datos?')) {
        const { error } = await db.from('discography').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else cargarDiscos();
    }
}

// Cargar catálogo al abrir la página
window.onload = () => {
    cargarDiscos();

    // Evento para el buscador en tiempo real
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', filtrarBandas);
    }
};