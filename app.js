// ====== CONFIGURACIÓN DE SUPABASE ======
const SUPABASE_URL = 'https://fcnnxqxarwfxavlmjqnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbm54cXhhcndmeGF2bG1qcW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzA1MzAsImV4cCI6MjA5NzE0NjUzMH0.AKeeDeIqpWEaj5EeMUzdxmmjw_gdxPgjq--u2MM9fL8';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== FUNCIONES PRINCIPALES ======

/**
 * Carga las tareas desde la base de datos y las renderiza
 */
async function cargarTareas() {
    const { data, error } = await db
        .from('tareas')
        .select('*')
        .order('created_at');

    if (error) {
        console.error('Error al cargar tareas:', error);
        return;
    }

    renderTareas(data);
}

/**
 * Agrega una nueva tarea a la base de datos
 */
async function agregarTarea() {
    const tituloInput = document.getElementById('titulo');
    const responsableInput = document.getElementById('responsable');
    
    const titulo = tituloInput.value.trim();
    const responsable = responsableInput.value.trim();

    if (!titulo || !responsable) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    const { error } = await db
        .from('tareas')
        .insert({ titulo, responsable });

    if (error) {
        console.error('Error al agregar tarea:', error);
        return;
    }

    // Limpiar campos del formulario
    tituloInput.value = '';
    responsableInput.value = '';
}

/**
 * Alterna el estado de completado de una tarea
 */
async function toggleEstado(id, estado) {
    const { error } = await db
        .from('tareas')
        .update({ completada: !estado })
        .eq('id', id);

    if (error) {
        console.error('Error al cambiar estado:', error);
    }
}

/**
 * Elimina una tarea de la base de datos
 */
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    const { error } = await db
        .from('tareas')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error al eliminar tarea:', error);
    }
}

// ====== RENDERIZADO DE INTERFAZ ======

/**
 * Dibuja la lista de tareas en el HTML
 */
function renderTareas(tareas) {
    const cont = document.getElementById('tareas-container');
    const contador = document.getElementById('contador');
    
    // Actualizar contador
    contador.textContent = `(${tareas.length})`;

    if (tareas.length === 0) {
        cont.innerHTML = '<p class="vacio">No hay tareas aún.</p>';
        return;
    }

    // Generar el HTML de las tareas
    cont.innerHTML = tareas.map(t => `
        <div class="tarea ${t.completada ? 'completada' : ''}">
            <div class="tarea-info">
                <strong>${t.titulo}</strong>
                <span>Responsable: ${t.responsable}</span>
            </div>
            <div class="tarea-acciones">
                <button onclick="toggleEstado('${t.id}', ${t.completada})">
                    ${t.completada ? 'Reabrir' : 'Completar'}
                </button>
                <button class="btn-eliminar" onclick="eliminarTarea('${t.id}')">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// ====== SUSCRIPCIÓN EN TIEMPO REAL ======
db.channel('tareas-canal')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => {
        cargarTareas();
    })
    .subscribe();

// ====== INICIALIZACIÓN ======
cargarTareas();