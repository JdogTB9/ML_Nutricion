
// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
// ¡IMPORTANTE! Reemplaza estos valores con los de tu proyecto de Supabase
const SUPABASE_URL = 'https://palywztjfofiszdomkbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbHl3enRqZm9maXN6ZG9ta2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDQ0NDcsImV4cCI6MjA4NTI4MDQ0N30.XP5Wprj4-FacQUOGsBtu3tsQnkx9k6fwYk3ygpbb60g';

// Inicializar el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // Estado local de clientes (se llenará desde Supabase)
    let clients = [];
    let currentClientId = null;

    // ==========================================
    // FUNCIONES DE SUPABASE
    // ==========================================

    // 1. Obtener clientes (READ)
    async function fetchClients() {
        try {
            const { data, error } = await supabaseClient
                .from('Clientes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Procesar datos para añadir campos calculados como 'age' y 'photo' por defecto
            clients = data.map(client => {
                // Calcular edad si tenemos fecha de nacimiento
                let age = 'N/A';
                if (client['Fecha de Nacimiento']) {
                    const dob = new Date(client['Fecha de Nacimiento']);
                    const diff_ms = Date.now() - dob.getTime();
                    const age_dt = new Date(diff_ms);
                    age = Math.abs(age_dt.getUTCFullYear() - 1970);
                }

                return {
                    id: client.id_cliente,
                    name: client.Nombre,
                    surname: client.Apellido,
                    dob: client['Fecha de Nacimiento'],
                    phone: client.Telefono,
                    email: client.Correo,
                    age: age,
                    photo: client.foto_url || 'avatar.png'
                };
            });

            // Renderizar la lista
            renderClients();

        } catch (error) {
            console.error('Error al obtener clientes:', error);
            alert('Error al cargar los clientes. Revisa la consola para más detalles.');
        }
    }

    // 2. Añadir cliente (CREATE)
    async function addClientToSupabase(newClientData) {
        try {
            const { data, error } = await supabaseClient
                .from('Clientes')
                .insert([newClientData])
                .select();

            if (error) throw error;

            alert('Cliente añadido correctamente');
            fetchClients(); // Recargar la lista
            return true;

        } catch (error) {
            console.error('Error al añadir cliente:', error);
            alert('Error al guardar el cliente: ' + error.message);
            return false;
        }
    }

    // 3. Eliminar cliente (DELETE)
    async function deleteClientFromSupabase(id_cliente) {
        try {
            const { error } = await supabaseClient
                .from('Clientes')
                .delete()
                .eq('id_cliente', id_cliente);

            if (error) throw error;

            alert('Cliente eliminado.');
            fetchClients(); // Recargar la lista

            // Si estamos viendo el perfil del cliente eliminado, volver a la lista
            const profileView = document.getElementById('client-profile-view');
            if (profileView.classList.contains('active') && currentClientId === id_cliente) {
                views.forEach(v => v.classList.remove('active'));
                document.getElementById('clients-view').classList.add('active');
                pageTitle.textContent = 'Gestión de Clientes';
                currentClientId = null;
            }

        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            alert('Error al eliminar: ' + error.message);
        }
    }

    // ==========================================
    // FUNCIONES DE ANAMNESIS
    // ==========================================

    // 1. Obtener anamnesis de un cliente
    async function fetchClientAnamnesis(clienteId) {
        try {
            const { data, error } = await supabaseClient
                .from('Anamnesis')
                .select('*')
                .eq('id_cliente', clienteId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            renderAnamnesisList(data || []);

        } catch (error) {
            console.error('Error al obtener anamnesis:', error);
            alert('Error al cargar las anamnesis: ' + error.message);
        }
    }

    // 2. Guardar nueva anamnesis
    async function saveAnamnesis(anamnesisData) {
        try {
            const { data, error } = await supabaseClient
                .from('Anamnesis')
                .insert([anamnesisData])
                .select();

            if (error) throw error;

            alert('Anamnesis guardada correctamente');
            fetchClientAnamnesis(currentClientId);
            return true;

        } catch (error) {
            console.error('Error al guardar anamnesis:', error);
            alert('Error al guardar anamnesis: ' + error.message);
            return false;
        }
    }

    // 3. Renderizar lista de anamnesis
    function renderAnamnesisList(anamnesisList) {
        const container = document.getElementById('anamnesisList');
        if (!container) return;

        container.innerHTML = '';

        if (anamnesisList.length === 0) {
            container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon"><i class="fa-regular fa-file-lines"></i></div>
                    <p>No hay anamnesis registradas</p>
                    <small>Crea la primera anamnesis para este cliente</small>
                </div>
            `;
            return;
        }

        anamnesisList.forEach(anamnesis => {
            const card = document.createElement('div');
            card.className = 'card anamnesis-card';

            const fecha = new Date(anamnesis.created_at);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            card.innerHTML = `
                <div class="anamnesis-card-header">
                    <div>
                        <h4><i class="fa-regular fa-file-lines"></i> Anamnesis</h4>
                        <p class="anamnesis-date">${fechaFormateada}</p>
                    </div>
                    <button class="btn btn-secondary btn-sm">Ver detalles</button>
                </div>
                ${anamnesis.objetivo ? `<p class="anamnesis-preview"><strong>Objetivo:</strong> ${anamnesis.objetivo.substring(0, 100)}${anamnesis.objetivo.length > 100 ? '...' : ''}</p>` : ''}
            `;

            const viewBtn = card.querySelector('.btn-sm');
            viewBtn.addEventListener('click', () => viewAnamnesisDetails(anamnesis));

            container.appendChild(card);
        });
    }

    // 4. Ver detalles de una anamnesis
    function viewAnamnesisDetails(anamnesis) {
        const modal = document.getElementById('viewAnamnesisModal');
        const content = document.getElementById('anamnesisDetailsContent');

        const fecha = new Date(anamnesis.created_at);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Helper para mostrar arrays de alimentos
        const displayFoodArray = (arr) => {
            if (!arr || arr.length === 0) return '<em style="color: #999;">No seleccionados</em>';
            return arr.map(item => `<span class="food-chip">${item}</span>`).join(' ');
        };

        content.innerHTML = `
            <div class="anamnesis-details">
                <p style="color: #666; margin-bottom: 2rem;"><i class="fa-regular fa-calendar"></i> Creada el ${fechaFormateada}</p>

                ${anamnesis.centro_entrenamiento || anamnesis.estatura || anamnesis.analitica || anamnesis.objetivo ? `
                <div class="detail-section">
                    <h4>Datos Básicos</h4>
                    ${anamnesis.centro_entrenamiento ? `<p><strong>Centro de entrenamiento:</strong> ${anamnesis.centro_entrenamiento}</p>` : ''}
                    ${anamnesis.estatura ? `<p><strong>Estatura:</strong> ${anamnesis.estatura} cm</p>` : ''}
                    ${anamnesis.analitica ? `<p><strong>Analítica:</strong> ${anamnesis.analitica}</p>` : ''}
                    ${anamnesis.analitica_comentarios ? `<p><strong>Comentarios:</strong> ${anamnesis.analitica_comentarios}</p>` : ''}
                    ${anamnesis.objetivo ? `<p><strong>Objetivo:</strong> ${anamnesis.objetivo}</p>` : ''}
                </div>
                ` : ''}

                ${anamnesis.sueno_lunes || anamnesis.sueno_observaciones ? `
                <div class="detail-section">
                    <h4>Sueño</h4>
                    <div class="week-display">
                        ${anamnesis.sueno_lunes ? `<span><strong>L:</strong> ${anamnesis.sueno_lunes}h</span>` : ''}
                        ${anamnesis.sueno_martes ? `<span><strong>M:</strong> ${anamnesis.sueno_martes}h</span>` : ''}
                        ${anamnesis.sueno_miercoles ? `<span><strong>X:</strong> ${anamnesis.sueno_miercoles}h</span>` : ''}
                        ${anamnesis.sueno_jueves ? `<span><strong>J:</strong> ${anamnesis.sueno_jueves}h</span>` : ''}
                        ${anamnesis.sueno_viernes ? `<span><strong>V:</strong> ${anamnesis.sueno_viernes}h</span>` : ''}
                        ${anamnesis.sueno_sabado ? `<span><strong>S:</strong> ${anamnesis.sueno_sabado}h</span>` : ''}
                        ${anamnesis.sueno_domingo ? `<span><strong>D:</strong> ${anamnesis.sueno_domingo}h</span>` : ''}
                    </div>
                    ${anamnesis.sueno_observaciones ? `<p><strong>Observaciones:</strong> ${anamnesis.sueno_observaciones}</p>` : ''}
                </div>
                ` : ''}

                ${anamnesis.trabajo_lunes || anamnesis.trabajo_observaciones ? `
                <div class="detail-section">
                    <h4>Trabajo</h4>
                    <div class="week-display">
                        ${anamnesis.trabajo_lunes ? `<span><strong>L:</strong> ${anamnesis.trabajo_lunes}h</span>` : ''}
                        ${anamnesis.trabajo_martes ? `<span><strong>M:</strong> ${anamnesis.trabajo_martes}h</span>` : ''}
                        ${anamnesis.trabajo_miercoles ? `<span><strong>X:</strong> ${anamnesis.trabajo_miercoles}h</span>` : ''}
                        ${anamnesis.trabajo_jueves ? `<span><strong>J:</strong> ${anamnesis.trabajo_jueves}h</span>` : ''}
                        ${anamnesis.trabajo_viernes ? `<span><strong>V:</strong> ${anamnesis.trabajo_viernes}h</span>` : ''}
                        ${anamnesis.trabajo_sabado ? `<span><strong>S:</strong> ${anamnesis.trabajo_sabado}h</span>` : ''}
                        ${anamnesis.trabajo_domingo ? `<span><strong>D:</strong> ${anamnesis.trabajo_domingo}h</span>` : ''}
                    </div>
                    ${anamnesis.trabajo_observaciones ? `<p><strong>Observaciones:</strong> ${anamnesis.trabajo_observaciones}</p>` : ''}
                </div>
                ` : ''}

                ${anamnesis.actividad_fisica || anamnesis.suplementacion || anamnesis.medicacion ? `
                <div class="detail-section">
                    <h4>Estilo de Vida</h4>
                    ${anamnesis.actividad_fisica ? `<p><strong>Actividad Física:</strong> ${anamnesis.actividad_fisica}</p>` : ''}
                    ${anamnesis.suplementacion ? `<p><strong>Suplementación:</strong> ${anamnesis.suplementacion}</p>` : ''}
                    ${anamnesis.medicacion ? `<p><strong>Medicación:</strong> ${anamnesis.medicacion}</p>` : ''}
                </div>
                ` : ''}

                ${anamnesis.alimentos_favoritos || anamnesis.alimentos_odiados || anamnesis.intolerancias || anamnesis.funcion_intestinal ? `
                <div class="detail-section">
                    <h4>Preferencias Alimentarias</h4>
                    ${anamnesis.alimentos_favoritos ? `<p><strong>Favoritos:</strong> ${anamnesis.alimentos_favoritos}</p>` : ''}
                    ${anamnesis.alimentos_odiados ? `<p><strong>Odiados:</strong> ${anamnesis.alimentos_odiados}</p>` : ''}
                    ${anamnesis.intolerancias ? `<p><strong>Intolerancias/Alergias:</strong> ${anamnesis.intolerancias}</p>` : ''}
                    ${anamnesis.funcion_intestinal ? `<p><strong>Función Intestinal:</strong> ${anamnesis.funcion_intestinal}</p>` : ''}
                </div>
                ` : ''}

                <div class="detail-section">
                    <h4>Reporte Dietético</h4>
                    ${anamnesis.carbohidratos && anamnesis.carbohidratos.length > 0 ? `<p><strong>Carbohidratos:</strong><br>${displayFoodArray(anamnesis.carbohidratos)}</p>` : ''}
                    ${anamnesis.carnes && anamnesis.carnes.length > 0 ? `<p><strong>Carnes:</strong><br>${displayFoodArray(anamnesis.carnes)}</p>` : ''}
                    ${anamnesis.embutidos && anamnesis.embutidos.length > 0 ? `<p><strong>Embutidos:</strong><br>${displayFoodArray(anamnesis.embutidos)}</p>` : ''}
                    ${anamnesis.pescado_blanco && anamnesis.pescado_blanco.length > 0 ? `<p><strong>Pescado Blanco:</strong><br>${displayFoodArray(anamnesis.pescado_blanco)}</p>` : ''}
                    ${anamnesis.marisco && anamnesis.marisco.length > 0 ? `<p><strong>Marisco:</strong><br>${displayFoodArray(anamnesis.marisco)}</p>` : ''}
                    ${anamnesis.pescado_graso && anamnesis.pescado_graso.length > 0 ? `<p><strong>Pescado Graso:</strong><br>${displayFoodArray(anamnesis.pescado_graso)}</p>` : ''}
                    ${anamnesis.lacteos && anamnesis.lacteos.length > 0 ? `<p><strong>Lácteos:</strong><br>${displayFoodArray(anamnesis.lacteos)}</p>` : ''}
                    ${anamnesis.legumbres && anamnesis.legumbres.length > 0 ? `<p><strong>Legumbres:</strong><br>${displayFoodArray(anamnesis.legumbres)}</p>` : ''}
                    ${anamnesis.frutos_secos && anamnesis.frutos_secos.length > 0 ? `<p><strong>Frutos Secos:</strong><br>${displayFoodArray(anamnesis.frutos_secos)}</p>` : ''}
                    ${anamnesis.grasas && anamnesis.grasas.length > 0 ? `<p><strong>Grasas:</strong><br>${displayFoodArray(anamnesis.grasas)}</p>` : ''}
                    ${anamnesis.frutas && anamnesis.frutas.length > 0 ? `<p><strong>Frutas:</strong><br>${displayFoodArray(anamnesis.frutas)}</p>` : ''}
                    ${anamnesis.verduras && anamnesis.verduras.length > 0 ? `<p><strong>Verduras:</strong><br>${displayFoodArray(anamnesis.verduras)}</p>` : ''}
                    ${anamnesis.otros_alimentos && anamnesis.otros_alimentos.length > 0 ? `<p><strong>Otros:</strong><br>${displayFoodArray(anamnesis.otros_alimentos)}</p>` : ''}
                </div>

                ${anamnesis.supermercado || anamnesis.plan_contratado || anamnesis.estrategia || anamnesis.valoracion_nutricional ? `
                <div class="detail-section">
                    <h4>Plan y Seguimiento</h4>
                    ${anamnesis.supermercado ? `<p><strong>Supermercado:</strong> ${anamnesis.supermercado}</p>` : ''}
                    ${anamnesis.plan_contratado ? `<p><strong>Plan:</strong> ${anamnesis.plan_contratado}</p>` : ''}
                    ${anamnesis.estrategia ? `<p><strong>Estrategia:</strong> ${anamnesis.estrategia}</p>` : ''}
                    ${anamnesis.valoracion_nutricional ? `<p><strong>Valoración:</strong> ${anamnesis.valoracion_nutricional}</p>` : ''}
                </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }


    // ==========================================
    // LÓGICA DE INTERFAZ (UI)
    // ==========================================

    // Navigation
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update Active Nav
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update View
            const targetId = item.getAttribute('data-target');
            views.forEach(view => view.classList.remove('active'));

            // Handle specific views
            if (targetId === 'dashboard') {
                document.getElementById('dashboard-view').classList.add('active');
                pageTitle.textContent = 'Buenas tardes, Javier';
            } else if (targetId === 'clients') {
                document.getElementById('clients-view').classList.add('active');
                pageTitle.textContent = 'Gestión de Clientes';
                // Ya no necesitamos llamar a renderClients aquí porque se actualiza automáticamente
                // o podríamos llamar a fetchClients() para asegurar datos frescos
                fetchClients();
            } else {
                alert('Esta sección estará disponible próximamente.');
                item.classList.remove('active');
                document.querySelector('.nav-item[data-target="dashboard"]').classList.add('active');
                document.getElementById('dashboard-view').classList.add('active');
            }
        });
    });

    // Render Clients Function
    function renderClients(filter = '') {
        const container = document.getElementById('clientsList');
        if (!container) return;
        container.innerHTML = '';

        const filteredClients = clients.filter(client =>
            `${client.name} ${client.surname}`.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredClients.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888; margin-top: 20px;">No se encontraron clientes.</p>';
            return;
        }

        filteredClients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card-item';

            card.innerHTML = `
                <button class="card-delete-btn" data-id="${client.id}">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
                <img src="${client.photo}" alt="${client.name}" class="avatar-medium">
                <h4>${client.name} ${client.surname}</h4>
                <p style="font-size: 0.85rem; color: var(--secondary-color); margin-bottom: 0.5rem;">${client.email}</p>
                <span class="tag warning">${client.age} años</span>
            `;

            // Card click
            card.addEventListener('click', () => openClientProfile(client));

            // Delete btn click
            const deleteBtn = card.querySelector('.card-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('¿Estás seguro de que quieres eliminar a este cliente? Esta acción no se puede deshacer.')) {
                    deleteClientFromSupabase(client.id);
                }
            });

            container.appendChild(card);
        });
    }

    // Search
    const searchInput = document.getElementById('clientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderClients(e.target.value);
        });
    }

    // Add Client Modal
    const addClientBtn = document.getElementById('addClientBtn');
    const modalOverlay = document.getElementById('addClientModal');
    const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    const addClientForm = document.getElementById('addClientForm');

    if (addClientBtn) {
        addClientBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    });

    if (addClientForm) {
        addClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addClientForm);

            // Preparamos el objeto para Supabase
            // NOTA: Asegúrate de que los nombres coinciden con las columnas de tu tabla 'Clientes'
            const newClientData = {
                Nombre: formData.get('name'),
                Apellido: formData.get('surname'),
                "Fecha de Nacimiento": formData.get('dob'),
                Telefono: formData.get('phone'),
                Correo: formData.get('email')
                // photo: 'avatar.png' // Descomentar si tienes columna 'photo' en Supabase
            };

            const success = await addClientToSupabase(newClientData);

            if (success) {
                modalOverlay.classList.remove('active');
                addClientForm.reset();
            }
        });
    }

    // Client Profile Logic
    function openClientProfile(client) {
        currentClientId = client.id;

        views.forEach(v => v.classList.remove('active'));
        const profileView = document.getElementById('client-profile-view');
        profileView.classList.add('active');

        // Update Header
        pageTitle.textContent = `Perfil de ${client.name}`;

        // Populate Data
        document.getElementById('profileName').textContent = `${client.name} ${client.surname}`;
        document.getElementById('profileAge').textContent = `${client.age} años`;
        document.getElementById('profileEmail').textContent = client.email || 'No email';
        document.getElementById('profilePhone').textContent = client.phone || 'No tlf';
        document.getElementById('profilePhoto').src = client.photo;

        // Load anamnesis for this client
        fetchClientAnamnesis(client.id);

        // Load measurements for this client
        if (window.loadClientMeasurements) {
            if (window.resetMeasurementsView) {
                window.resetMeasurementsView();
            }
            window.loadClientMeasurements(client.id);
        }

        // Load planning for this client
        if (window.loadClientPlanning) {
            window.loadClientPlanning(client.id);
        }
    }

    // Delete Profile Button
    const deleteProfileBtn = document.getElementById('deleteClientProfileBtn');
    if (deleteProfileBtn) {
        deleteProfileBtn.addEventListener('click', () => {
            if (currentClientId) {
                if (confirm('¿Estás seguro de que quieres eliminar a este cliente?')) {
                    deleteClientFromSupabase(currentClientId);
                }
            }
        });
    }

    // Photo Upload (Solo local por ahora, requiere configuración de Storage en Supabase)
    const avatarWrapper = document.getElementById('avatarWrapper');
    const photoInput = document.getElementById('photoUploadInput');

    if (avatarWrapper && photoInput) {
        avatarWrapper.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && currentClientId) {
                // Mostrar preview inmediato (opcional, pero da buen feedback)
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('profilePhoto').src = e.target.result;
                };
                reader.readAsDataURL(file);

                try {
                    // 1. Subir a Supabase Storage (Bucket: 'avatars')
                    const fileExt = file.name.split('.').pop();
                    const fileName = `client-${currentClientId}-${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    // Mostrar indicador de carga (opcional)
                    console.log('Subiendo foto...');

                    const { error: uploadError } = await supabaseClient.storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // 2. Obtener URL pública
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    // 3. Actualizar campo 'foto_url' en tabla 'Clientes'
                    const { error: updateError } = await supabaseClient
                        .from('Clientes')
                        .update({ foto_url: publicUrl })
                        .eq('id_cliente', currentClientId);

                    if (updateError) throw updateError;

                    alert('Foto de perfil actualizada correctamente.');

                    // Actualizar el objeto local para que no se pierda al navegar
                    const clientIdx = clients.findIndex(c => c.id === currentClientId);
                    if (clientIdx !== -1) clients[clientIdx].photo = publicUrl;

                } catch (error) {
                    console.error('Error al subir foto:', error);
                    alert('Error al subir la foto. Asegúrate de tener el bucket "avatars" creado en Supabase.');
                }
            }
        });
    }

    // Back Button
    const backBtn = document.getElementById('backToClients');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            views.forEach(v => v.classList.remove('active'));
            document.getElementById('clients-view').classList.add('active');
            pageTitle.textContent = 'Gestión de Clientes';
            fetchClients(); // Refrescar al volver
        });
    }

    // Profile Tabs
    const profileTabs = document.querySelectorAll('.profile-tab');
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            profileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetId = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${targetId}`).classList.add('active');
        });
    });

    // ==========================================
    // ANAMNESIS MODAL
    // ==========================================
    const addAnamnesisBtn = document.getElementById('addAnamnesisBtn');
    const anamnesisModal = document.getElementById('addAnamnesisModal');
    const anamnesisForm = document.getElementById('addAnamnesisForm');

    if (addAnamnesisBtn) {
        addAnamnesisBtn.addEventListener('click', () => {
            anamnesisModal.classList.add('active');
        });
    }

    // Close anamnesis modal
    const closeAnamnesisModalBtns = anamnesisModal.querySelectorAll('.close-modal, .close-modal-btn');
    closeAnamnesisModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            anamnesisModal.classList.remove('active');
        });
    });

    // Submit anamnesis form
    if (anamnesisForm) {
        anamnesisForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect all form data
            const formData = new FormData(anamnesisForm);

            // Helper function to get all checked values for a checkbox group
            const getCheckedValues = (name) => {
                const checkboxes = anamnesisForm.querySelectorAll(`input[name="${name}"]:checked`);
                return Array.from(checkboxes).map(cb => cb.value);
            };

            // Build anamnesis object
            const anamnesisData = {
                id_cliente: currentClientId,
                fecha: new Date().toISOString(),

                // Datos básicos
                centro_entrenamiento: formData.get('centro_entrenamiento'),
                estatura: formData.get('estatura') || null,
                analitica: formData.get('analitica'),
                analitica_comentarios: formData.get('analitica_comentarios'),
                objetivo: formData.get('objetivo'),

                // Sueño
                sueno_lunes: formData.get('sueno_lunes') || null,
                sueno_martes: formData.get('sueno_martes') || null,
                sueno_miercoles: formData.get('sueno_miercoles') || null,
                sueno_jueves: formData.get('sueno_jueves') || null,
                sueno_viernes: formData.get('sueno_viernes') || null,
                sueno_sabado: formData.get('sueno_sabado') || null,
                sueno_domingo: formData.get('sueno_domingo') || null,
                sueno_observaciones: formData.get('sueno_observaciones'),

                // Trabajo
                trabajo_lunes: formData.get('trabajo_lunes') || null,
                trabajo_martes: formData.get('trabajo_martes') || null,
                trabajo_miercoles: formData.get('trabajo_miercoles') || null,
                trabajo_jueves: formData.get('trabajo_jueves') || null,
                trabajo_viernes: formData.get('trabajo_viernes') || null,
                trabajo_sabado: formData.get('trabajo_sabado') || null,
                trabajo_domingo: formData.get('trabajo_domingo') || null,
                trabajo_observaciones: formData.get('trabajo_observaciones'),

                // Estilo de vida
                actividad_fisica: formData.get('actividad_fisica'),
                suplementacion: formData.get('suplementacion'),
                medicacion: formData.get('medicacion'),

                // Preferencias
                alimentos_favoritos: formData.get('alimentos_favoritos'),
                alimentos_odiados: formData.get('alimentos_odiados'),
                intolerancias: formData.get('intolerancias'),
                funcion_intestinal: formData.get('funcion_intestinal'),

                // Reporte dietético (arrays de seleccionados)
                carbohidratos: getCheckedValues('carbs'),
                carnes: getCheckedValues('carnes'),
                embutidos: getCheckedValues('embutidos'),
                pescado_blanco: getCheckedValues('pescado_blanco'),
                marisco: getCheckedValues('marisco'),
                pescado_graso: getCheckedValues('pescado_graso'),
                lacteos: getCheckedValues('lacteos'),
                legumbres: getCheckedValues('legumbres'),
                frutos_secos: getCheckedValues('frutos_secos'),
                grasas: getCheckedValues('grasas'),
                frutas: getCheckedValues('frutas'),
                verduras: getCheckedValues('verduras'),
                otros_alimentos: getCheckedValues('otros'),

                // Plan
                supermercado: formData.get('supermercado'),
                plan_contratado: formData.get('plan_contratado'),
                estrategia: formData.get('estrategia'),
                valoracion_nutricional: formData.get('valoracion_nutricional')
            };

            const success = await saveAnamnesis(anamnesisData);

            if (success) {
                anamnesisModal.classList.remove('active');
                anamnesisForm.reset();
            }
        });
    }

    // Close view anamnesis modal
    const viewAnamnesisModal = document.getElementById('viewAnamnesisModal');
    const closeViewModalBtns = viewAnamnesisModal.querySelectorAll('.close-modal');
    closeViewModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewAnamnesisModal.classList.remove('active');
        });
    });

    // ==========================================
    // MEASUREMENTS MODULE
    // ==========================================

    let measurementsChart = null;
    let currentMeasurementField = null;
    let allMeasurements = [];

    // Measurement field labels for display
    const measurementLabels = {
        'peso': 'Peso',
        'altura': 'Altura',
        'porcentaje_grasa': 'Porcentaje de masa grasa',
        'masa_muscular': 'Masa muscular',
        'grasa_visceral': 'Grasa visceral',
        'perimetro_gemelo': 'Perímetro gemelo',
        'perimetro_bajo_muslo': 'Perímetro bajo muslo',
        'perimetro_superior_muslo': 'Perímetro superior muslo',
        'perimetro_cadera': 'Perímetro cadera',
        'perimetro_abdominal': 'Perímetro abdominal',
        'perimetro_cintura': 'Perímetro cintura',
        'perimetro_pectoral': 'Perímetro pectoral',
        'perimetro_hombros': 'Perímetro hombros',
        'perimetro_brazo_relajado': 'Perímetro brazo relajado',
        'perimetro_brazo_flexion': 'Perímetro brazo en flexión',
        'pliegue_bicipital': 'Pliegue bicipital',
        'pliegue_tricipital': 'Pliegue tricipital',
        'pliegue_subescapular': 'Pliegue subescapular',
        'pliegue_suprailíaco': 'Pliegue suprailíaco'
    };

    // 1. Fetch measurements for a client
    async function fetchClientMeasurements(clienteId) {
        try {
            const { data, error } = await supabaseClient
                .from('Mediciones')
                .select('*')
                .eq('id_cliente', clienteId)
                .order('fecha', { ascending: false });

            if (error) throw error;

            allMeasurements = data || [];
            updateMeasurementValues();

        } catch (error) {
            console.error('Error al obtener mediciones:', error);
        }
    }

    // 2. Update measurement values in sidebar
    function updateMeasurementValues() {
        const measurementItems = document.querySelectorAll('.measurement-item');

        measurementItems.forEach(item => {
            const field = item.getAttribute('data-field');
            const unit = item.getAttribute('data-unit');
            const valueSpan = item.querySelector('.measurement-value');

            // Get latest measurement for this field
            const latestValue = getLatestMeasurementValue(field);

            if (latestValue !== null) {
                valueSpan.textContent = `${latestValue} ${unit}`;
            } else {
                valueSpan.textContent = '—';
            }
        });
    }

    // 3. Get latest measurement value for a field
    function getLatestMeasurementValue(field) {
        for (const measurement of allMeasurements) {
            if (measurement[field] !== null && measurement[field] !== undefined) {
                return measurement[field];
            }
        }
        return null;
    }

    // 4. Handle measurement item click
    function selectMeasurement(field, unit) {
        currentMeasurementField = field;

        // Update active state
        document.querySelectorAll('.measurement-item').forEach(item => {
            if (item.getAttribute('data-field') === field) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Show detail view
        document.getElementById('measurementsEmptyState').style.display = 'none';
        document.getElementById('measurementsDetailView').style.display = 'flex';

        // Update title
        const title = measurementLabels[field] || field;
        document.getElementById('selectedMeasurementTitle').textContent = title;

        // Render history
        renderMeasurementHistory(field, unit);

        // Render chart
        renderMeasurementChart(field, unit);
    }

    // 5. Render measurement history with differences
    function renderMeasurementHistory(field, unit) {
        const container = document.getElementById('measurementHistoryList');
        container.innerHTML = '';

        // Filter measurements that have this field
        const fieldMeasurements = allMeasurements.filter(m => m[field] !== null && m[field] !== undefined);

        if (fieldMeasurements.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No hay mediciones registradas</p>';
            return;
        }

        fieldMeasurements.forEach((measurement, index) => {
            const value = measurement[field];
            const fecha = new Date(measurement.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            let changeHtml = '';
            if (index < fieldMeasurements.length - 1) {
                const previousValue = fieldMeasurements[index + 1][field];
                const difference = value - previousValue;

                if (difference !== 0) {
                    const arrow = difference > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                    const sign = difference > 0 ? '+' : '';
                    changeHtml = `
                        <div class="measurement-history-change">
                            <i class="fa-solid ${arrow}"></i>
                            ${sign}${difference.toFixed(1)} ${unit}
                        </div>
                    `;
                } else {
                    changeHtml = '<div class="measurement-history-change">=</div>';
                }
            } else {
                // Para la primera medición histórica
                changeHtml = '<div class="measurement-history-change">=</div>';
            }

            const itemHtml = `
                <div class="measurement-history-item">
                    <div class="measurement-history-date">${fechaFormateada}</div>
                    <div class="measurement-history-value">${value} ${unit}</div>
                    <div class="measurement-history-change-wrapper">${changeHtml}</div>
                </div>
            `;

            container.innerHTML += itemHtml;
        });
    }

    // 6. Render chart with Chart.js
    function renderMeasurementChart(field, unit) {
        const canvas = document.getElementById('measurementChart');
        const ctx = canvas.getContext('2d');

        // Destroy previous chart
        if (measurementsChart) {
            measurementsChart.destroy();
        }

        // Filter and prepare data
        const fieldMeasurements = allMeasurements
            .filter(m => m[field] !== null && m[field] !== undefined)
            .reverse(); // Oldest first for chart

        if (fieldMeasurements.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Inter';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('No hay datos para mostrar', canvas.width / 2, canvas.height / 2);
            return;
        }

        const labels = fieldMeasurements.map(m => {
            const fecha = new Date(m.fecha);
            return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        });

        const data = fieldMeasurements.map(m => m[field]);

        measurementsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: measurementLabels[field],
                    data: data,
                    borderColor: '#38C7A5',
                    backgroundColor: 'rgba(56, 199, 165, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#38C7A5',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#374151',
                        bodyColor: '#374151',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return `${context.parsed.y} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function (value) {
                                return value + ' ' + unit;
                            }
                        },
                        grid: {
                            color: '#F3F4F6'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // 7. Save new measurement
    async function saveMeasurement(measurementData) {
        try {
            const { data, error } = await supabaseClient
                .from('Mediciones')
                .insert([measurementData])
                .select();

            if (error) throw error;

            alert('Medición guardada correctamente');
            await fetchClientMeasurements(currentClientId);

            // If a measurement is selected, refresh it
            if (currentMeasurementField) {
                const item = document.querySelector(`[data-field="${currentMeasurementField}"]`);
                if (item) {
                    const unit = item.getAttribute('data-unit');
                    selectMeasurement(currentMeasurementField, unit);
                }
            }

            return true;

        } catch (error) {
            console.error('Error al guardar medición:', error);
            alert('Error al guardar medición: ' + error.message);
            return false;
        }
    }

    // 8. Modal controls
    const addMeasurementBtn = document.getElementById('addMeasurementBtn');
    const measurementModal = document.getElementById('addMeasurementModal');
    const measurementForm = document.getElementById('addMeasurementForm');

    if (addMeasurementBtn) {
        addMeasurementBtn.addEventListener('click', () => {
            // Set default date to today
            const dateInput = measurementForm.querySelector('input[name="fecha"]');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
            measurementModal.classList.add('active');
        });
    }

    // Close modal
    const closeMeasurementModalBtns = measurementModal.querySelectorAll('.close-modal, .close-modal-btn');
    closeMeasurementModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            measurementModal.classList.remove('active');
        });
    });

    // Submit form
    if (measurementForm) {
        measurementForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(measurementForm);

            const measurementData = {
                id_cliente: currentClientId,
                fecha: formData.get('fecha'),
                peso: formData.get('peso') || null,
                altura: formData.get('altura') || null,
                porcentaje_grasa: formData.get('porcentaje_grasa') || null,
                masa_muscular: formData.get('masa_muscular') || null,
                grasa_visceral: formData.get('grasa_visceral') || null,
                perimetro_gemelo: formData.get('perimetro_gemelo') || null,
                perimetro_bajo_muslo: formData.get('perimetro_bajo_muslo') || null,
                perimetro_superior_muslo: formData.get('perimetro_superior_muslo') || null,
                perimetro_cadera: formData.get('perimetro_cadera') || null,
                perimetro_abdominal: formData.get('perimetro_abdominal') || null,
                perimetro_cintura: formData.get('perimetro_cintura') || null,
                perimetro_pectoral: formData.get('perimetro_pectoral') || null,
                perimetro_hombros: formData.get('perimetro_hombros') || null,
                perimetro_brazo_relajado: formData.get('perimetro_brazo_relajado') || null,
                perimetro_brazo_flexion: formData.get('perimetro_brazo_flexion') || null,
                pliegue_bicipital: formData.get('pliegue_bicipital') || null,
                pliegue_tricipital: formData.get('pliegue_tricipital') || null,
                pliegue_subescapular: formData.get('pliegue_subescapular') || null,
                pliegue_suprailíaco: formData.get('pliegue_suprailíaco') || null
            };

            const success = await saveMeasurement(measurementData);

            if (success) {
                measurementModal.classList.remove('active');
                measurementForm.reset();
            }
        });
    }

    // 9. Attach click handlers to measurement items
    document.querySelectorAll('.measurement-item').forEach(item => {
        item.addEventListener('click', function () {
            const field = this.getAttribute('data-field');
            const unit = this.getAttribute('data-unit');
            selectMeasurement.call(this, field, unit);
        });
    });

    // 10. Load measurements when opening client profile
    // This will be called from openClientProfile function
    window.loadClientMeasurements = fetchClientMeasurements;

    window.resetMeasurementsView = function () {
        currentMeasurementField = null;
        const emptyState = document.getElementById('measurementsEmptyState');
        const detailView = document.getElementById('measurementsDetailView');

        if (emptyState) emptyState.style.display = 'flex';
        if (detailView) detailView.style.display = 'none';

        document.querySelectorAll('.measurement-item').forEach(i => i.classList.remove('active'));

        if (measurementsChart) {
            measurementsChart.destroy();
            measurementsChart = null;
        }
    };

    // ==========================================
    // PLANNING MODULE
    // ==========================================

    let currentPlanningId = null;
    let currentPlanningWeight = null;

    // Elementos DOM de Planificación
    const planningKcalInput = document.getElementById('planningKcal');
    const planningGastoInput = document.getElementById('planningGasto');
    const planningTotalPercentBadge = document.getElementById('planningTotalPercent');
    const planningWeightLabel = document.getElementById('planningWeightLabel');

    // 1. Cargar Planificación
    async function fetchClientPlanning(clienteId) {
        // Reset Status
        currentPlanningId = null;
        currentPlanningWeight = null;
        // No reseteamos los inputs aquí para evitar flickering visual. 
        // Se actualizarán con los datos de Supabase o se limpiarán en el else si no hay datos.

        try {
            // A. Obtener último peso (independiente de si cargó measurements tab)
            const { data: weightData, error: weightError } = await supabaseClient
                .from('Mediciones')
                .select('peso')
                .eq('id_cliente', clienteId)
                .order('fecha', { ascending: false })
                .limit(1);

            if (!weightError && weightData && weightData.length > 0) {
                currentPlanningWeight = weightData[0].peso;
                if (planningWeightLabel) planningWeightLabel.textContent = `(${currentPlanningWeight} kg)`;
            } else {
                if (planningWeightLabel) planningWeightLabel.textContent = '(Sin peso registrado)';
            }

            // B. Obtener planificación existente
            const { data, error } = await supabaseClient
                .from('Planificaciones')
                .select('*')
                .eq('id_cliente', clienteId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                currentPlanningId = data.id_planificacion;
                // Rellenar datos
                if (planningKcalInput) planningKcalInput.value = data.kcal_diarias;
                if (planningGastoInput) planningGastoInput.value = data.gasto_energetico_total || '';

                if (planningGastoInput) planningGastoInput.value = data.gasto_energetico_total || '';

                const recEditor = document.getElementById('recommendationsEditor');
                if (recEditor) {
                    recEditor.innerHTML = data.recomendaciones || '';
                }

                updateInputValue('planningFats', data.porcentaje_grasas);
                updateInputValue('planningCarbs', data.porcentaje_hidratos);
                updateInputValue('planningProt', data.porcentaje_proteinas);

                if (document.getElementById('planningFiberSource')) document.getElementById('planningFiberSource').value = data.fibra_fuente || '';
                if (document.getElementById('planningFiberGrams')) document.getElementById('planningFiberGrams').value = data.fibra_gramos || '';
            } else {
                // No hay planificación: Resetear a valores limpios/por defecto
                if (planningKcalInput) planningKcalInput.value = '';
                if (planningGastoInput) planningGastoInput.value = '';

                const recEditor = document.getElementById('recommendationsEditor');
                if (recEditor) recEditor.innerHTML = '';

                // Volver a porcentajes típicos si es nuevo
                updateInputValue('planningFats', 30);
                updateInputValue('planningCarbs', 50);
                updateInputValue('planningProt', 20);

                if (document.getElementById('planningFiberSource')) document.getElementById('planningFiberSource').value = '';
                if (document.getElementById('planningFiberGrams')) document.getElementById('planningFiberGrams').value = '';
            }

            // Recalcular todo
            calculateMacros();

        } catch (error) {
            console.error('Error al cargar planificación:', error);
        }
    }

    const macroColors = {
        'Fats': '#FACC15',
        'Carbs': '#EF4444',
        'Prot': '#3B82F6'
    };

    function updateRangeTrack(range, macro) {
        if (!range) return;
        const val = range.value;
        const color = macroColors[macro] || '#38C7A5';
        range.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${val}%, #E5E7EB ${val}%, #E5E7EB 100%)`;
    }

    // Helper para actualizar input y range
    function updateInputValue(prefix, value) {
        const input = document.getElementById(`${prefix}Percent`);
        const range = document.getElementById(`${prefix}Range`);
        if (input) input.value = value;
        if (range) {
            range.value = value;
            const macro = prefix.replace('planning', '');
            updateRangeTrack(range, macro);
        }
    }

    // 2. Calcular Macros
    function calculateMacros() {
        if (!planningKcalInput) return;

        const kcal = parseFloat(planningKcalInput.value) || 0;

        const fatsPct = parseFloat(document.getElementById('planningFatsPercent').value) || 0;
        const carbsPct = parseFloat(document.getElementById('planningCarbsPercent').value) || 0;
        const protPct = parseFloat(document.getElementById('planningProtPercent').value) || 0;

        const totalPct = fatsPct + carbsPct + protPct;
        if (planningTotalPercentBadge) {
            planningTotalPercentBadge.textContent = `Total: ${totalPct}%`;

            if (totalPct !== 100) {
                planningTotalPercentBadge.style.backgroundColor = '#EF4444'; // Rojo (aviso)
            } else {
                planningTotalPercentBadge.style.backgroundColor = '#10B981'; // Verde (ok)
            }
        }

        // Conversiones: Grasas=9, Carbs=4, Prot=4
        const fatsGrams = (kcal * (fatsPct / 100)) / 9;
        const carbsGrams = (kcal * (carbsPct / 100)) / 4;
        const protGrams = (kcal * (protPct / 100)) / 4;

        updateMacroDisplay('planningFats', fatsGrams);
        updateMacroDisplay('planningCarbs', carbsGrams);
        updateMacroDisplay('planningProt', protGrams);

        if (window.updateRecommendationsHeader) {
            window.updateRecommendationsHeader();
        }
    }

    function updateMacroDisplay(prefix, grams) {
        const gramsEl = document.getElementById(`${prefix}Grams`);
        const gkgEl = document.getElementById(`${prefix}Gkg`);

        if (gramsEl) gramsEl.textContent = grams.toFixed(0) + ' g';

        if (gkgEl) {
            if (currentPlanningWeight && currentPlanningWeight > 0) {
                const gkg = grams / currentPlanningWeight;
                gkgEl.textContent = gkg.toFixed(2) + ' g/kg';
            } else {
                gkgEl.textContent = '—';
            }
        }
    }

    // 3. Setup Listeners
    function setupPlanningListeners() {
        const macros = ['Fats', 'Carbs', 'Prot'];

        macros.forEach(macro => {
            const range = document.getElementById(`planning${macro}Range`);
            const number = document.getElementById(`planning${macro}Percent`);

            if (range && number) {
                range.addEventListener('input', () => {
                    number.value = range.value;
                    updateRangeTrack(range, macro);
                    calculateMacros();
                });

                number.addEventListener('input', () => {
                    range.value = number.value;
                    updateRangeTrack(range, macro);
                    calculateMacros();
                });

                // Inicializar visualmente
                updateRangeTrack(range, macro);
            }
        });

        if (planningKcalInput) {
            planningKcalInput.addEventListener('input', calculateMacros);
        }

        const saveBtn = document.getElementById('savePlanningBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', savePlanning);
        }
    }

    // 4. Guardar Planificación
    async function savePlanning() {
        const kcal = parseFloat(planningKcalInput.value);
        if (!kcal) {
            alert('Por favor, indica las necesidades energéticas (kcal/día).');
            return;
        }

        // Obtener valores actuales
        const fatsPct = parseFloat(document.getElementById('planningFatsPercent').value) || 0;
        const carbsPct = parseFloat(document.getElementById('planningCarbsPercent').value) || 0;
        const protPct = parseFloat(document.getElementById('planningProtPercent').value) || 0;

        // Calcular gramos
        const fatsGk = (kcal * (fatsPct / 100)) / 9;
        const carbsGk = (kcal * (carbsPct / 100)) / 4;
        const protGk = (kcal * (protPct / 100)) / 4;

        // Calcular g/kg
        let fatsGkg = null, carbsGkg = null, protGkg = null;
        if (currentPlanningWeight && currentPlanningWeight > 0) {
            fatsGkg = fatsGk / currentPlanningWeight;
            carbsGkg = carbsGk / currentPlanningWeight;
            protGkg = protGk / currentPlanningWeight;
        }

        const planningData = {
            id_cliente: currentClientId,
            kcal_diarias: kcal,
            gasto_energetico_total: parseFloat(planningGastoInput.value) || null,

            // Porcentajes
            porcentaje_grasas: fatsPct,
            porcentaje_hidratos: carbsPct,
            porcentaje_proteinas: protPct,

            // Gramos totales (Redondeamos a 2 decimales para BD)
            gramos_grasas: parseFloat(fatsGk.toFixed(2)),
            gramos_hidratos: parseFloat(carbsGk.toFixed(2)),
            gramos_proteinas: parseFloat(protGk.toFixed(2)),

            // g/kg
            g_kg_grasas: fatsGkg ? parseFloat(fatsGkg.toFixed(2)) : null,
            g_kg_hidratos: carbsGkg ? parseFloat(carbsGkg.toFixed(2)) : null,
            g_kg_proteinas: protGkg ? parseFloat(protGkg.toFixed(2)) : null,

            // Fibra
            fibra_fuente: document.getElementById('planningFiberSource').value,
            fibra_gramos: parseFloat(document.getElementById('planningFiberGrams').value) || null,

            updated_at: new Date()
        };

        try {
            let error;
            if (currentPlanningId) {
                const { error: updateError } = await supabaseClient
                    .from('Planificaciones')
                    .update(planningData)
                    .eq('id_planificacion', currentPlanningId);
                error = updateError;
            } else {
                const { error: insertError } = await supabaseClient
                    .from('Planificaciones')
                    .insert([planningData]);
                error = insertError;
            }

            if (error) throw error;

            alert('Planificación guardada correctamente.');
            fetchClientPlanning(currentClientId); // Recargar

        } catch (error) {
            console.error('Error al guardar planificación:', error);
            alert('Error al guardar: ' + error.message);
        }
    }

    // Expose Global
    window.loadClientPlanning = fetchClientPlanning;

    // Initialize Listeners
    setupPlanningListeners();


    // ==========================================
    // ==========================================
    // MÓDULO DE RECOMENDACIONES (Rich Text)
    // ==========================================
    const recommendationsEditor = document.getElementById('recommendationsEditor');
    const updateHeaderBtn = document.getElementById('regenerateTextBtn');

    window.formatDoc = function (cmd, value = null) {
        if (value) {
            document.execCommand(cmd, false, value);
        } else {
            document.execCommand(cmd);
        }
        const editor = document.getElementById('recommendationsEditor');
        if (editor) editor.focus();
    }

    function getMonthName(date) {
        const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        return months[date ? date.getMonth() : new Date().getMonth()];
    }

    function generateRecommendationsHeader() {
        if (!planningKcalInput) return '';

        const date = new Date();
        const mes = getMonthName(date);
        const anio = date.getFullYear();

        const kcal = planningKcalInput.value || 0;
        const gasto = planningGastoInput && planningGastoInput.value ? planningGastoInput.value : 0;

        const protPct = document.getElementById('planningProtPercent').value || 0;
        const carbsPct = document.getElementById('planningCarbsPercent').value || 0;
        const fatsPct = document.getElementById('planningFatsPercent').value || 0;

        const getGkg = (id) => {
            const el = document.getElementById(id);
            return el ? el.textContent.split(' ')[0] : '0';
        };

        const protGkg = getGkg('planningProtGkg');
        const carbsGkg = getGkg('planningCarbsGkg');
        const fatsGkg = getGkg('planningFatsGkg');

        return `<p><strong>OTRAS RECOMENDACIONES</strong></p>
        <p><br></p>
        <p>${mes} ${anio} (1º Fase) --&gt; Plan nutricional de ${kcal} Kcal distribuidas en:</p>
        <p>- ${protPct} % de proteína (${protGkg} g Proteína / Kg peso corporal)</p>
        <p>- ${carbsPct} % de carbohidratos (${carbsGkg} g CHO / Kg peso corporal)</p>
        <p>- ${fatsPct} % de lípidos (${fatsGkg} g Grasa / Kg peso corporal)</p>
        <p>Gasto Energético Total calculado: ${gasto} Kcal</p>
        <p><br></p>`;
    }

    function updateRecommendationsHeader(force = false) {
        if (!recommendationsEditor) return;

        const newHeader = generateRecommendationsHeader();
        const currentHTML = recommendationsEditor.innerHTML;
        const plainText = recommendationsEditor.innerText || "";

        // Regex para detectar la cabecera HTML (desde OTRAS RECOMENDACIONES hasta el último Kcal del gasto)
        const headerRegex = /<p><strong>OTRAS RECOMENDACIONES<\/strong><\/p>[\s\S]*?Gasto Energético Total calculado:.*?Kcal<\/p>\s*(<p><br><\/p>)?/i;

        if (!plainText.trim()) {
            // Si está vacío, ponemos la cabecera directamente
            recommendationsEditor.innerHTML = newHeader;
        } else if (headerRegex.test(currentHTML)) {
            // Si ya existe una cabecera, la reemplazamos por la nueva para actualizar datos
            recommendationsEditor.innerHTML = currentHTML.replace(headerRegex, newHeader);
        } else if (force) {
            // Si no detectamos una cabecera estándar pero pulsas el botón, la añadimos al principio
            recommendationsEditor.innerHTML = newHeader + currentHTML;
        }
    }

    async function saveRecommendations() {
        if (!currentClientId) return;

        try {
            const htmlContent = recommendationsEditor ? recommendationsEditor.innerHTML : '';

            // Si ya existe una planificación, actualizamos el campo recomendaciones
            if (currentPlanningId) {
                const { error } = await supabaseClient
                    .from('Planificaciones')
                    .update({ recomendaciones: htmlContent, updated_at: new Date() })
                    .eq('id_planificacion', currentPlanningId);

                if (error) throw error;
                alert('Recomendaciones guardadas correctamente.');
            } else {
                // Si no existe planificación, avisamos que debe crear una primero o la creamos básica
                // Para simplificar, pedimos que guarde la planificación primero para tener kcal y demás
                alert('Primero debes guardar los datos de la pestaña "Planificación" para poder guardar las recomendaciones.');
            }

        } catch (error) {
            console.error('Error al guardar recomendaciones:', error);
            alert('Error al guardar: ' + error.message);
        }
    }

    if (updateHeaderBtn) {
        updateHeaderBtn.addEventListener('click', () => updateRecommendationsHeader(true));
    }

    const saveRecsBtn = document.getElementById('saveRecommendationsBtn');
    if (saveRecsBtn) {
        saveRecsBtn.addEventListener('click', saveRecommendations);
    }

    window.updateRecommendationsHeader = updateRecommendationsHeader;

    // Cargar clientes al iniciar la app
    fetchClients();
});
