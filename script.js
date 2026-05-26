
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
                loadDashboard();
            } else if (targetId === 'clients') {
                document.getElementById('clients-view').classList.add('active');
                pageTitle.textContent = 'Gestión de Clientes';
                fetchClients();
            } else if (targetId === 'foods') {
                document.getElementById('foods-view').classList.add('active');
                pageTitle.textContent = 'Alimentos';
                fetchFoods();
            } else if (targetId === 'equivalences') {
                document.getElementById('equivalences-view').classList.add('active');
                pageTitle.textContent = 'Equivalencias';
                ensureFoodsLoaded();
                fetchEquivalences();
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

        // Load nutrition plan for this client
        if (window.loadNutritionPlan) {
            window.loadNutritionPlan(client.id);
        }

        // Load planning targets for analysis
        if (window.loadPlanningTargets) {
            window.loadPlanningTargets(client.id);
        }

        // Load revisiones
        if (window.fetchClientRevisiones) {
            window.fetchClientRevisiones(client.id);
        }

        // Load seguimiento
        if (window.loadSeguimientoConfig) {
            window.loadSeguimientoConfig(client.id);
        }
        if (window.loadSeguimientoRegistros) {
            window.loadSeguimientoRegistros(client.id);
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

        return `<p><strong>RECOMENDACIONES</strong></p>
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

        // Regex para detectar la cabecera HTML (retrocompatible con "OTRAS RECOMENDACIONES" y "RECOMENDACIONES")
        const headerRegex = /<p><strong>(OTRAS )?RECOMENDACIONES<\/strong><\/p>[\s\S]*?Gasto Energético Total calculado:.*?Kcal<\/p>\s*(<p><br><\/p>)?/i;

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

    // ==========================================
    // MÓDULO DE ALIMENTOS (FOODS)
    // ==========================================

    let allFoods = [];
    let currentFoodSort = 'nombre';

    // 1. Fetch foods from Supabase
    async function fetchFoods() {
        try {
            const { data, error } = await supabaseClient
                .from('Alimentos')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;

            allFoods = data || [];
            renderFoods();

        } catch (error) {
            console.error('Error al obtener alimentos:', error);
        }
    }

    // 2. Render foods list
    function renderFoods(filter = '') {
        const container = document.getElementById('foodsList');
        if (!container) return;
        container.innerHTML = '';

        let filtered = allFoods.filter(food =>
            food.nombre.toLowerCase().includes(filter.toLowerCase())
        );

        // Sort
        filtered.sort((a, b) => {
            if (currentFoodSort === 'nombre') {
                return a.nombre.localeCompare(b.nombre, 'es');
            }
            return (b[currentFoodSort] || 0) - (a[currentFoodSort] || 0);
        });

        // Count badge
        const countEl = document.createElement('div');
        countEl.className = 'food-count';
        countEl.textContent = `${filtered.length} alimento${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;
        container.appendChild(countEl);

        if (filtered.length === 0) {
            container.innerHTML += '<p style="text-align: center; color: #888; margin-top: 20px;">No se encontraron alimentos.</p>';
            return;
        }

        filtered.forEach(food => {
            const row = document.createElement('div');
            row.className = 'food-row';

            row.innerHTML = `
                <div class="food-info">
                    <span class="food-name">${food.nombre}</span>
                    <span class="food-source">${food.fuente || 'Base de datos local'}</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${food.energia_kcal ?? 0} kcal</span>
                    <span class="food-nutrient-label nutrient-energy"><i class="fa-solid fa-fire"></i> Energía</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${food.grasas ?? 0} g</span>
                    <span class="food-nutrient-label nutrient-fat"><i class="fa-solid fa-droplet"></i> Grasa</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${food.hidratos ?? 0} g</span>
                    <span class="food-nutrient-label nutrient-carbs"><i class="fa-regular fa-circle"></i> H. Carbono</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${food.proteinas ?? 0} g</span>
                    <span class="food-nutrient-label nutrient-protein"><i class="fa-regular fa-gem"></i> Proteína</span>
                </div>
                <div class="food-actions">
                    <button class="food-action-btn edit" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="food-action-btn delete" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;

            // Edit button
            row.querySelector('.food-action-btn.edit').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditFoodModal(food);
            });

            // Delete button
            row.querySelector('.food-action-btn.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar "${food.nombre}"?`)) {
                    deleteFoodFromSupabase(food.id_alimento);
                }
            });

            container.appendChild(row);
        });
    }

    // 3. Add food
    async function addFoodToSupabase(foodData) {
        try {
            const { data, error } = await supabaseClient
                .from('Alimentos')
                .insert([foodData])
                .select();

            if (error) throw error;

            alert('Alimento añadido correctamente');
            fetchFoods();
            return true;
        } catch (error) {
            console.error('Error al añadir alimento:', error);
            alert('Error al guardar: ' + error.message);
            return false;
        }
    }

    // 4. Update food
    async function updateFoodInSupabase(id, foodData) {
        try {
            const { error } = await supabaseClient
                .from('Alimentos')
                .update(foodData)
                .eq('id_alimento', id);

            if (error) throw error;

            alert('Alimento actualizado correctamente');
            fetchFoods();
            return true;
        } catch (error) {
            console.error('Error al actualizar alimento:', error);
            alert('Error al actualizar: ' + error.message);
            return false;
        }
    }

    // 5. Delete food
    async function deleteFoodFromSupabase(id) {
        try {
            const { error } = await supabaseClient
                .from('Alimentos')
                .delete()
                .eq('id_alimento', id);

            if (error) throw error;

            alert('Alimento eliminado.');
            fetchFoods();
        } catch (error) {
            console.error('Error al eliminar alimento:', error);
            alert('Error al eliminar: ' + error.message);
        }
    }

    // 6. Open edit modal
    function openEditFoodModal(food) {
        document.getElementById('foodModalTitle').textContent = 'Editar alimento';
        document.getElementById('foodSubmitBtn').textContent = 'Actualizar';
        document.getElementById('editFoodId').value = food.id_alimento;
        document.getElementById('foodNombre').value = food.nombre || '';
        document.getElementById('foodFuente').value = food.fuente || 'Base de datos local';
        document.getElementById('foodKcal').value = food.energia_kcal || '';
        document.getElementById('foodGrasas').value = food.grasas || '';
        document.getElementById('foodHidratos').value = food.hidratos || '';
        document.getElementById('foodProteinas').value = food.proteinas || '';
        document.getElementById('foodFibra').value = food.fibra || '';

        document.getElementById('addFoodModal').classList.add('active');
    }

    // 7. Setup food event listeners
    const addFoodBtn = document.getElementById('addFoodBtn');
    const foodModal = document.getElementById('addFoodModal');
    const foodForm = document.getElementById('addFoodForm');
    const foodSearch = document.getElementById('foodSearch');
    const foodSortSelect = document.getElementById('foodSortSelect');

    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', () => {
            // Reset to "add" mode
            document.getElementById('foodModalTitle').textContent = 'Agregar nuevo alimento';
            document.getElementById('foodSubmitBtn').textContent = 'Guardar';
            document.getElementById('editFoodId').value = '';
            foodForm.reset();
            document.getElementById('foodFuente').value = 'Base de datos local';
            foodModal.classList.add('active');
        });
    }

    // Close food modal
    if (foodModal) {
        foodModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                foodModal.classList.remove('active');
            });
        });
    }

    // Food search
    if (foodSearch) {
        foodSearch.addEventListener('input', (e) => {
            renderFoods(e.target.value);
        });
    }

    // Food sort
    if (foodSortSelect) {
        foodSortSelect.addEventListener('change', (e) => {
            currentFoodSort = e.target.value;
            renderFoods(foodSearch ? foodSearch.value : '');
        });
    }

    // Food form submit
    if (foodForm) {
        foodForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const foodData = {
                nombre: document.getElementById('foodNombre').value.trim(),
                fuente: document.getElementById('foodFuente').value.trim() || 'Base de datos local',
                energia_kcal: parseFloat(document.getElementById('foodKcal').value) || 0,
                grasas: parseFloat(document.getElementById('foodGrasas').value) || 0,
                hidratos: parseFloat(document.getElementById('foodHidratos').value) || 0,
                proteinas: parseFloat(document.getElementById('foodProteinas').value) || 0,
                fibra: parseFloat(document.getElementById('foodFibra').value) || 0
            };

            const editId = document.getElementById('editFoodId').value;
            let success;

            if (editId) {
                success = await updateFoodInSupabase(parseInt(editId), foodData);
            } else {
                success = await addFoodToSupabase(foodData);
            }

            if (success) {
                foodModal.classList.remove('active');
                foodForm.reset();
            }
        });
    }

    // ==========================================
    // MÓDULO DE EQUIVALENCIAS
    // ==========================================

    let allEquivalences = [];
    let currentEquivId = null;
    let currentEquivItems = []; // Estado LOCAL de items (no se guarda hasta pulsar Guardar)
    let equivHasUnsavedChanges = false;

    // Helper: calcular macros de un alimento para una cantidad dada
    function calcNutrient(alimento, campo, cantidad) {
        if (!alimento) return 0;
        const val = alimento[campo] || 0;
        return ((val * cantidad) / 100);
    }

    function formatNutrient(value, suffix) {
        return Math.round(value * 10) / 10 + ' ' + suffix;
    }

    // Helper: auto-calcular gramos para igualar kcal de referencia
    function calcAutoQtyByKcal(refFood, refQty, targetFood) {
        const refKcal100 = refFood.energia_kcal || 0;
        const targetKcal100 = targetFood.energia_kcal || 0;
        if (targetKcal100 === 0) return 100;
        const targetKcal = (refKcal100 * refQty) / 100;
        return Math.round((targetKcal * 100) / targetKcal100);
    }

    // 1. Fetch all equivalence lists
    async function fetchEquivalences() {
        try {
            const { data, error } = await supabaseClient
                .from('Equivalencias')
                .select(`
                    *,
                    Equivalencias_Alimentos (
                        *,
                        Alimentos (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            allEquivalences = data || [];
            renderEquivalencesList();

        } catch (error) {
            console.error('Error al obtener equivalencias:', error);
        }
    }

    // 2. Render main list of equivalences
    function renderEquivalencesList(filter = '') {
        const container = document.getElementById('equivList');
        if (!container) return;
        container.innerHTML = '';

        let filtered = allEquivalences.filter(eq =>
            eq.nombre.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-right-left"></i></div>
                    <p>No hay listas de equivalencias</p>
                    <small>Crea tu primera lista de equivalencias</small>
                </div>`;
            return;
        }

        filtered.forEach(eq => {
            const items = eq.Equivalencias_Alimentos || [];
            const refItem = items.find(i => i.es_referencia);
            let totalKcal = '—', totalGrasa = '—', totalCarbs = '—', totalProt = '—';

            if (refItem && refItem.Alimentos) {
                const c = refItem.cantidad || 100;
                const a = refItem.Alimentos;
                totalKcal = formatNutrient(calcNutrient(a, 'energia_kcal', c), 'kcal');
                totalGrasa = formatNutrient(calcNutrient(a, 'grasas', c), 'g');
                totalCarbs = formatNutrient(calcNutrient(a, 'hidratos', c), 'g');
                totalProt = formatNutrient(calcNutrient(a, 'proteinas', c), 'g');
            }

            const row = document.createElement('div');
            row.className = 'equiv-row';
            row.innerHTML = `
                <div class="food-info">
                    <span class="food-name">${eq.nombre}</span>
                    <span class="food-source">${items.length} alimento${items.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${totalKcal}</span>
                    <span class="food-nutrient-label nutrient-energy"><i class="fa-solid fa-fire"></i> Energía</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${totalGrasa}</span>
                    <span class="food-nutrient-label nutrient-fat"><i class="fa-solid fa-droplet"></i> Grasa</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${totalCarbs}</span>
                    <span class="food-nutrient-label nutrient-carbs"><i class="fa-regular fa-circle"></i> H. Carbono</span>
                </div>
                <div class="food-nutrient">
                    <span class="food-nutrient-value">${totalProt}</span>
                    <span class="food-nutrient-label nutrient-protein"><i class="fa-regular fa-gem"></i> Proteína</span>
                </div>
            `;

            row.addEventListener('click', () => openEquivDetail(eq.id_equivalencia));
            container.appendChild(row);
        });
    }

    // 3. Create new equivalence list
    async function createEquivalence() {
        try {
            const { data, error } = await supabaseClient
                .from('Equivalencias')
                .insert([{ nombre: 'Lista de equivalencias' }])
                .select();

            if (error) throw error;

            await fetchEquivalences();
            openEquivDetail(data[0].id_equivalencia);

        } catch (error) {
            console.error('Error al crear equivalencia:', error);
            alert('Error al crear: ' + error.message);
        }
    }

    // 4. Open equivalence detail — loads from DB into local state
    async function openEquivDetail(equivId) {
        currentEquivId = equivId;
        equivHasUnsavedChanges = false;

        views.forEach(v => v.classList.remove('active'));
        document.getElementById('equiv-detail-view').classList.add('active');
        pageTitle.textContent = 'Equivalencias';

        try {
            const { data, error } = await supabaseClient
                .from('Equivalencias')
                .select(`
                    *,
                    Equivalencias_Alimentos (
                        *,
                        Alimentos (*)
                    )
                `)
                .eq('id_equivalencia', equivId)
                .single();

            if (error) throw error;

            document.getElementById('equivNameInput').value = data.nombre;
            document.getElementById('equivDetailTitle').textContent = data.nombre;

            // Clone items into local state
            currentEquivItems = (data.Equivalencias_Alimentos || []).map(item => ({
                ...item,
                _localId: item.id, // track DB id
                _isNew: false
            }));

            renderEquivDetail();
            renderEquivFoodSearch();

        } catch (error) {
            console.error('Error al cargar detalle:', error);
        }
    }

    // 5. Render equivalence detail (reference + equivalents) — fully local
    function renderEquivDetail() {
        const refContainer = document.getElementById('equivReferenceFood');
        const foodsContainer = document.getElementById('equivFoodsList');

        refContainer.innerHTML = '';
        foodsContainer.innerHTML = '';

        const refItem = currentEquivItems.find(i => i.es_referencia);
        const equivItems = currentEquivItems.filter(i => !i.es_referencia);

        // --- Reference food ---
        if (refItem && refItem.Alimentos) {
            const a = refItem.Alimentos;
            const c = refItem.cantidad;
            const customName = refItem.nombre_personalizado || '';
            refContainer.innerHTML = `
                <div class="equiv-reference-item">
                    <div class="equiv-item-text">
                        <input type="number" value="${c}" min="1" step="1" class="equiv-ref-qty">
                        <span>gramos de</span>
                        <input type="text" class="equiv-custom-name" value="${customName}" placeholder="${a.nombre}">
                    </div>
                    <div class="equiv-ref-macros">
                        <span class="ref-macro" data-field="energia_kcal">${formatNutrient(calcNutrient(a, 'energia_kcal', c), 'kcal')}</span>
                        <span class="ref-macro" data-field="grasas">${formatNutrient(calcNutrient(a, 'grasas', c), 'g')}</span>
                        <span class="ref-macro" data-field="hidratos">${formatNutrient(calcNutrient(a, 'hidratos', c), 'g')}</span>
                        <span class="ref-macro" data-field="proteinas">${formatNutrient(calcNutrient(a, 'proteinas', c), 'g')}</span>
                    </div>
                    <button class="food-action-btn delete equiv-item-remove" title="Quitar referencia">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;

            // Custom name listener
            refContainer.querySelector('.equiv-custom-name').addEventListener('input', (e) => {
                refItem.nombre_personalizado = e.target.value;
                equivHasUnsavedChanges = true;
            });

            // Dynamic recalc on ref qty change → recalc ALL equiv items
            refContainer.querySelector('.equiv-ref-qty').addEventListener('input', (e) => {
                const newQty = parseFloat(e.target.value) || 0;
                refItem.cantidad = newQty;
                equivHasUnsavedChanges = true;

                // Update ref macros inline
                refContainer.querySelector('[data-field="energia_kcal"]').textContent = formatNutrient(calcNutrient(a, 'energia_kcal', newQty), 'kcal');
                refContainer.querySelector('[data-field="grasas"]').textContent = formatNutrient(calcNutrient(a, 'grasas', newQty), 'g');
                refContainer.querySelector('[data-field="hidratos"]').textContent = formatNutrient(calcNutrient(a, 'hidratos', newQty), 'g');
                refContainer.querySelector('[data-field="proteinas"]').textContent = formatNutrient(calcNutrient(a, 'proteinas', newQty), 'g');

                // Recalc ALL non-reference items to match new kcal
                const chipEls = foodsContainer.querySelectorAll('.equiv-food-chip');
                equivItems.forEach((item, idx) => {
                    if (!item.Alimentos) return;
                    item.cantidad = calcAutoQtyByKcal(a, newQty, item.Alimentos);
                    const chipEl = chipEls[idx];
                    if (chipEl) {
                        chipEl.querySelector('.chip-qty').value = item.cantidad;
                        const ia = item.Alimentos;
                        chipEl.querySelector('[data-field="energia_kcal"]').textContent = formatNutrient(calcNutrient(ia, 'energia_kcal', item.cantidad), 'kcal');
                        chipEl.querySelector('[data-field="grasas"]').textContent = formatNutrient(calcNutrient(ia, 'grasas', item.cantidad), 'g');
                        chipEl.querySelector('[data-field="hidratos"]').textContent = formatNutrient(calcNutrient(ia, 'hidratos', item.cantidad), 'g');
                        chipEl.querySelector('[data-field="proteinas"]').textContent = formatNutrient(calcNutrient(ia, 'proteinas', item.cantidad), 'g');
                    }
                });
            });

            // Remove reference
            refContainer.querySelector('.equiv-item-remove').addEventListener('click', () => {
                currentEquivItems = currentEquivItems.filter(i => i !== refItem);
                equivHasUnsavedChanges = true;
                renderEquivDetail();
            });
        } else {
            refContainer.innerHTML = '<p class="text-muted">Añade un alimento como referencia</p>';
        }

        // --- Equivalent items ---
        equivItems.forEach(item => {
            if (!item.Alimentos) return;
            const a = item.Alimentos;
            const c = item.cantidad;
            const customName = item.nombre_personalizado || '';

            const chip = document.createElement('div');
            chip.className = 'equiv-food-chip';
            chip.innerHTML = `
                <span class="chip-prefix">o</span>
                <input type="number" class="chip-qty" value="${c}" min="1" step="1">
                <span>gramos de</span>
                <input type="text" class="equiv-custom-name" value="${customName}" placeholder="${a.nombre}">
                <span class="chip-macros">
                    <span data-field="energia_kcal">${formatNutrient(calcNutrient(a, 'energia_kcal', c), 'kcal')}</span> |
                    <span data-field="grasas">${formatNutrient(calcNutrient(a, 'grasas', c), 'g')}</span> |
                    <span data-field="hidratos">${formatNutrient(calcNutrient(a, 'hidratos', c), 'g')}</span> |
                    <span data-field="proteinas">${formatNutrient(calcNutrient(a, 'proteinas', c), 'g')}</span>
                </span>
                <button class="food-action-btn delete equiv-item-remove" title="Quitar"><i class="fa-solid fa-xmark"></i></button>
            `;

            // Custom name listener
            chip.querySelector('.equiv-custom-name').addEventListener('input', (e) => {
                item.nombre_personalizado = e.target.value;
                equivHasUnsavedChanges = true;
            });

            // Dynamic recalc — solo este item (permite redondeo manual)
            chip.querySelector('.chip-qty').addEventListener('input', (e) => {
                const newQty = parseFloat(e.target.value) || 0;
                item.cantidad = newQty;
                equivHasUnsavedChanges = true;
                chip.querySelector('[data-field="energia_kcal"]').textContent = formatNutrient(calcNutrient(a, 'energia_kcal', newQty), 'kcal');
                chip.querySelector('[data-field="grasas"]').textContent = formatNutrient(calcNutrient(a, 'grasas', newQty), 'g');
                chip.querySelector('[data-field="hidratos"]').textContent = formatNutrient(calcNutrient(a, 'hidratos', newQty), 'g');
                chip.querySelector('[data-field="proteinas"]').textContent = formatNutrient(calcNutrient(a, 'proteinas', newQty), 'g');
            });

            // Remove
            chip.querySelector('.equiv-item-remove').addEventListener('click', () => {
                currentEquivItems = currentEquivItems.filter(i => i !== item);
                equivHasUnsavedChanges = true;
                renderEquivDetail();
            });

            foodsContainer.appendChild(chip);
        });
    }

    // 6. Render food search results in add section
    function renderEquivFoodSearch(filter = '', sortBy = 'nombre') {
        const container = document.getElementById('equivFoodResults');
        if (!container) return;
        container.innerHTML = '';

        let foods = [...allFoods];

        if (filter) {
            foods = foods.filter(f => f.nombre.toLowerCase().includes(filter.toLowerCase()));
        }

        foods.sort((a, b) => {
            if (sortBy === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
            return (b[sortBy] || 0) - (a[sortBy] || 0);
        });

        if (foods.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: #999; padding: 1rem;">No se encontraron alimentos</p>';
            return;
        }

        foods.forEach(food => {
            const row = document.createElement('div');
            row.className = 'equiv-food-result-row';

            const kcal100 = food.energia_kcal ?? 0;
            const grasas100 = food.grasas ?? 0;
            const hidratos100 = food.hidratos ?? 0;
            const prot100 = food.proteinas ?? 0;

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="equiv-qty-control">
                        <input type="number" value="100" min="1" step="1" class="equiv-result-qty">
                        <span class="qty-unit">gra...</span>
                        <span class="qty-total">100g</span>
                    </div>
                    <div class="equiv-result-food-info">
                        <span class="equiv-result-food-name">${food.nombre}</span>
                        <span class="equiv-result-food-source">${food.fuente || 'Base de datos local'}</span>
                    </div>
                </div>
                <span class="equiv-result-nutrient" data-base="${kcal100}">${kcal100} kcal</span>
                <span class="equiv-result-nutrient" data-base="${grasas100}">${grasas100} g</span>
                <span class="equiv-result-nutrient" data-base="${hidratos100}">${hidratos100} g</span>
                <span class="equiv-result-nutrient" data-base="${prot100}">${prot100} g</span>
                <button class="equiv-add-btn" title="Añadir"><i class="fa-solid fa-plus"></i></button>
            `;

            const qtyInput = row.querySelector('.equiv-result-qty');
            const totalLabel = row.querySelector('.qty-total');
            const nutrientSpans = row.querySelectorAll('.equiv-result-nutrient');

            // Dynamic recalc in search results too
            qtyInput.addEventListener('input', () => {
                const qty = parseFloat(qtyInput.value) || 0;
                totalLabel.textContent = qty + 'g';
                const factor = qty / 100;
                nutrientSpans[0].textContent = formatNutrient(kcal100 * factor, 'kcal');
                nutrientSpans[1].textContent = formatNutrient(grasas100 * factor, 'g');
                nutrientSpans[2].textContent = formatNutrient(hidratos100 * factor, 'g');
                nutrientSpans[3].textContent = formatNutrient(prot100 * factor, 'g');
            });

            // Add button — adds to LOCAL state only
            row.querySelector('.equiv-add-btn').addEventListener('click', () => {
                const qty = parseFloat(qtyInput.value) || 100;
                addFoodToEquivalenceLocal(food, qty);
            });

            container.appendChild(row);
        });
    }

    // 7. Add food to equivalence (LOCAL only, no DB call)
    function addFoodToEquivalenceLocal(food, cantidad) {
        const isRef = currentEquivItems.length === 0;

        // Auto-calcular gramos para igualar kcal de referencia
        let autoCantidad = cantidad;
        if (!isRef) {
            const refItem = currentEquivItems.find(i => i.es_referencia);
            if (refItem && refItem.Alimentos) {
                autoCantidad = calcAutoQtyByKcal(refItem.Alimentos, refItem.cantidad, food);
            }
        }

        currentEquivItems.push({
            id: null,
            _localId: 'new_' + Date.now() + '_' + Math.random(),
            _isNew: true,
            id_equivalencia: currentEquivId,
            id_alimento: food.id_alimento,
            cantidad: autoCantidad,
            unidad: 'gramos',
            es_referencia: isRef,
            nombre_personalizado: null,
            Alimentos: food
        });

        equivHasUnsavedChanges = true;
        renderEquivDetail();
    }

    // 8. SAVE equivalence — writes everything to Supabase
    async function saveEquivalence() {
        if (!currentEquivId) return;

        try {
            // A. Update name
            const newName = document.getElementById('equivNameInput').value.trim() || 'Lista de equivalencias';
            const { error: nameError } = await supabaseClient
                .from('Equivalencias')
                .update({ nombre: newName })
                .eq('id_equivalencia', currentEquivId);
            if (nameError) throw nameError;

            // B. Delete all existing items for this equivalence
            const { error: delError } = await supabaseClient
                .from('Equivalencias_Alimentos')
                .delete()
                .eq('id_equivalencia', currentEquivId);
            if (delError) throw delError;

            // C. Insert all current local items
            if (currentEquivItems.length > 0) {
                const inserts = currentEquivItems.map(item => ({
                    id_equivalencia: currentEquivId,
                    id_alimento: item.id_alimento,
                    cantidad: item.cantidad,
                    unidad: item.unidad || 'gramos',
                    es_referencia: item.es_referencia,
                    nombre_personalizado: item.nombre_personalizado?.trim() || null
                }));

                const { error: insError } = await supabaseClient
                    .from('Equivalencias_Alimentos')
                    .insert(inserts);
                if (insError) throw insError;
            }

            equivHasUnsavedChanges = false;
            alert('Equivalencia guardada correctamente.');

            // Reload to get fresh IDs
            await openEquivDetail(currentEquivId);

        } catch (error) {
            console.error('Error al guardar equivalencia:', error);
            alert('Error al guardar: ' + error.message);
        }
    }

    // 9. Delete entire equivalence list
    async function deleteEquivalence() {
        if (!currentEquivId) return;
        try {
            const { error } = await supabaseClient
                .from('Equivalencias')
                .delete()
                .eq('id_equivalencia', currentEquivId);

            if (error) throw error;

            alert('Lista eliminada.');
            currentEquivId = null;
            equivHasUnsavedChanges = false;
            views.forEach(v => v.classList.remove('active'));
            document.getElementById('equivalences-view').classList.add('active');
            fetchEquivalences();
        } catch (error) {
            console.error('Error al eliminar equivalencia:', error);
            alert('Error: ' + error.message);
        }
    }

    // 10. Event listeners
    const equivNameInput = document.getElementById('equivNameInput');
    if (equivNameInput) {
        equivNameInput.addEventListener('input', () => {
            const newName = equivNameInput.value.trim();
            document.getElementById('equivDetailTitle').textContent = newName || 'Lista de equivalencias';
            equivHasUnsavedChanges = true;
        });
    }

    const createEquivBtn = document.getElementById('createEquivBtn');
    if (createEquivBtn) {
        createEquivBtn.addEventListener('click', createEquivalence);
    }

    const saveEquivBtn = document.getElementById('saveEquivBtn');
    if (saveEquivBtn) {
        saveEquivBtn.addEventListener('click', saveEquivalence);
    }

    const backToEquivBtn = document.getElementById('backToEquivList');
    if (backToEquivBtn) {
        backToEquivBtn.addEventListener('click', () => {
            if (equivHasUnsavedChanges && !confirm('Tienes cambios sin guardar. ¿Salir sin guardar?')) {
                return;
            }
            currentEquivId = null;
            equivHasUnsavedChanges = false;
            views.forEach(v => v.classList.remove('active'));
            document.getElementById('equivalences-view').classList.add('active');
            pageTitle.textContent = 'Equivalencias';
            fetchEquivalences();
        });
    }

    const deleteEquivBtn = document.getElementById('deleteEquivBtn');
    if (deleteEquivBtn) {
        deleteEquivBtn.addEventListener('click', () => {
            if (confirm('¿Eliminar esta lista de equivalencias?')) {
                deleteEquivalence();
            }
        });
    }

    const equivSearch = document.getElementById('equivSearch');
    if (equivSearch) {
        equivSearch.addEventListener('input', (e) => {
            renderEquivalencesList(e.target.value);
        });
    }

    const equivFoodSearch = document.getElementById('equivFoodSearch');
    const equivFoodSort = document.getElementById('equivFoodSort');
    if (equivFoodSearch) {
        equivFoodSearch.addEventListener('input', () => {
            renderEquivFoodSearch(equivFoodSearch.value, equivFoodSort ? equivFoodSort.value : 'nombre');
        });
    }
    if (equivFoodSort) {
        equivFoodSort.addEventListener('change', () => {
            renderEquivFoodSearch(equivFoodSearch ? equivFoodSearch.value : '', equivFoodSort.value);
        });
    }

    // Ensure allFoods is loaded for equivalences food search
    async function ensureFoodsLoaded() {
        if (allFoods.length === 0) {
            await fetchFoods();
        }
    }

    // ==========================================
    // MÓDULO DE PLAN NUTRICIONAL
    // ==========================================

    let currentNutritionPlanId = null;
    let nutritionPlanMeals = []; // Local state: array of meals
    // Each meal: { _localId, nombre, hora, orden, platos: [ { _localId, nombre, orden, items: [ { _localId, tipo, id_alimento, id_equivalencia, Alimentos, Equivalencia, cantidad, unidad, nota } ] } ] }
    let planFoodSearchTargetPlatoId = null; // which plato to add food to

    // 1. Load nutrition plan for a client
    async function loadNutritionPlan(clienteId) {
        currentNutritionPlanId = null;
        nutritionPlanMeals = [];

        await ensureFoodsLoaded();

        try {
            // Get plan for this client
            const { data: planData, error: planError } = await supabaseClient
                .from('Planes_Nutricionales')
                .select('*')
                .eq('id_cliente', clienteId)
                .maybeSingle();

            if (planError) throw planError;

            if (planData) {
                currentNutritionPlanId = planData.id_plan;
                document.getElementById('nutritionPlanTitle').value = planData.titulo || 'Todos los días';

                // Load comidas with platos and items
                const { data: comidasData, error: comidasError } = await supabaseClient
                    .from('Plan_Comidas')
                    .select(`
                        *,
                        Plan_Platos (
                            *,
                            Plan_Items (
                                *,
                                Alimentos (*),
                                Equivalencias (
                                    *,
                                    Equivalencias_Alimentos (
                                        *,
                                        Alimentos (*)
                                    )
                                )
                            )
                        )
                    `)
                    .eq('id_plan', planData.id_plan)
                    .order('orden', { ascending: true });

                if (comidasError) throw comidasError;

                nutritionPlanMeals = (comidasData || []).map(comida => ({
                    _localId: 'db_' + comida.id_comida,
                    _dbId: comida.id_comida,
                    nombre: comida.nombre,
                    hora: comida.hora,
                    orden: comida.orden,
                    platos: (comida.Plan_Platos || [])
                        .sort((a, b) => a.orden - b.orden)
                        .map(plato => ({
                            _localId: 'db_' + plato.id_plato,
                            _dbId: plato.id_plato,
                            nombre: plato.nombre,
                            orden: plato.orden,
                            items: (plato.Plan_Items || [])
                                .sort((a, b) => a.orden - b.orden)
                                .map(item => ({
                                    _localId: 'db_' + item.id_item,
                                    tipo: item.tipo,
                                    id_alimento: item.id_alimento,
                                    id_equivalencia: item.id_equivalencia,
                                    Alimentos: item.Alimentos,
                                    Equivalencias: item.Equivalencias,
                                    cantidad: item.cantidad,
                                    unidad: item.unidad || 'gramos',
                                    nota: item.nota,
                                    _equivGroupId: item.equiv_group || null,
                                    _isEquivRef: item.es_equiv_ref || false,
                                    _fromEquiv: item.equiv_group ? 'Equivalencia' : null
                                }))
                        }))
                }));
            } else {
                document.getElementById('nutritionPlanTitle').value = 'Todos los días';
            }

            renderNutritionPlan();

        } catch (error) {
            console.error('Error al cargar plan nutricional:', error);
        }
    }

    // 2. Render full plan
    function renderNutritionPlan() {
        const container = document.getElementById('nutritionMealsContainer');
        if (!container) return;
        container.innerHTML = '';

        if (nutritionPlanMeals.length === 0) {
            container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-utensils"></i></div>
                    <p>No hay comidas en el plan</p>
                    <small>Añade comidas como Desayuno, Comida, Cena...</small>
                </div>`;
            return;
        }

        nutritionPlanMeals.sort((a, b) => {
            if (a.hora < b.hora) return -1;
            if (a.hora > b.hora) return 1;
            return 0;
        });

        nutritionPlanMeals.forEach((meal, mealIdx) => {
            meal.orden = mealIdx;
            const card = document.createElement('div');
            card.className = 'meal-card' + (meal._collapsed ? ' collapsed' : '');

            // --- Header ---
            const header = document.createElement('div');
            header.className = 'meal-card-header';
            header.innerHTML = `
                <span class="meal-time">${meal.hora || '12:00'}</span>
                <span class="meal-name">${meal.nombre}</span>
                <div class="meal-card-actions">
                    <button class="food-action-btn" title="Añadir plato"><i class="fa-solid fa-plus"></i></button>
                    <button class="food-action-btn delete" title="Eliminar comida"><i class="fa-regular fa-trash-can"></i></button>
                </div>
                <i class="fa-solid fa-chevron-up meal-toggle-icon"></i>
            `;

            // Toggle collapse
            header.addEventListener('click', (e) => {
                if (e.target.closest('.meal-card-actions') || e.target.closest('.food-action-btn')) return;
                card.classList.toggle('collapsed');
                meal._collapsed = card.classList.contains('collapsed');
            });

            // Add plato
            header.querySelector('.food-action-btn:not(.delete)').addEventListener('click', (e) => {
                e.stopPropagation();
                addPlatoToMeal(meal);
            });

            // Delete meal
            header.querySelector('.food-action-btn.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar "${meal.nombre}"?`)) {
                    nutritionPlanMeals = nutritionPlanMeals.filter(m => m !== meal);
                    renderNutritionPlan();
                }
            });

            card.appendChild(header);

            // --- Body ---
            const body = document.createElement('div');
            body.className = 'meal-card-body';

            // Platos
            meal.platos.forEach(plato => {
                const platoSection = document.createElement('div');
                platoSection.className = 'plato-section';

                // Plato header
                const platoHeader = document.createElement('div');
                platoHeader.className = 'plato-header';
                platoHeader.innerHTML = `
                    <span class="plato-name">${plato.nombre}</span>
                    <div class="plato-actions">
                        <button class="food-action-btn" title="Añadir alimento"><i class="fa-solid fa-plus"></i></button>
                        <button class="food-action-btn delete" title="Eliminar plato"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                `;

                // Add food to plato
                platoHeader.querySelector('.food-action-btn:not(.delete)').addEventListener('click', () => {
                    openPlanFoodSearch(plato._localId);
                });

                // Delete plato
                platoHeader.querySelector('.food-action-btn.delete').addEventListener('click', () => {
                    meal.platos = meal.platos.filter(p => p !== plato);
                    renderNutritionPlan();
                });

                platoSection.appendChild(platoHeader);

                // Items
                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'plato-items';

                if (plato.items.length === 0) {
                    itemsContainer.innerHTML = '<p class="plato-empty">No fueron introducidos alimentos</p>';
                } else {
                    // Group items: normal items + equivalence groups
                    const rendered = new Set();
                    plato.items.forEach(item => {
                        if (rendered.has(item._localId)) return;

                        // If this item belongs to an equivalence group, render the whole group
                        if (item._equivGroupId) {
                            const groupItems = plato.items.filter(i => i._equivGroupId === item._equivGroupId);
                            groupItems.forEach(gi => rendered.add(gi._localId));

                            const groupEl = document.createElement('div');
                            groupEl.className = 'equiv-group-block';

                            const groupHeader = document.createElement('div');
                            groupHeader.className = 'equiv-group-header';
                            groupHeader.innerHTML = `
                                <span class="plato-item-equivtag"><i class="fa-solid fa-right-left"></i> ${item._fromEquiv || 'Equivalencia'}</span>
                                <button class="plato-item-remove" title="Quitar equivalencia"><i class="fa-solid fa-xmark"></i></button>
                            `;
                            groupHeader.querySelector('.plato-item-remove').addEventListener('click', () => {
                                plato.items = plato.items.filter(i => i._equivGroupId !== item._equivGroupId);
                                renderNutritionPlan();
                            });
                            groupEl.appendChild(groupHeader);

                            // Store DOM elements for inline updates
                            const giElements = [];

                            groupItems.forEach((gi, giIdx) => {
                                const isRef = gi._isEquivRef;
                                const nombre = getItemDisplayName(gi);
                                const macros = getItemMacros(gi);

                                const giEl = document.createElement('div');
                                giEl.className = 'plato-item' + (isRef ? ' equiv-ref-item' : ' equiv-alt-item');

                                const prefix = isRef ? '' : '<span class="equiv-or-label">o</span>';

                                giEl.innerHTML = `
                                    ${prefix}
                                    <input type="number" class="plato-item-qty" value="${gi.cantidad}" min="1" step="1">
                                    <span class="plato-item-unit">${gi.unidad}</span>
                                    <input type="text" class="plato-item-name-input" value="${gi.nota || ''}" placeholder="${nombre}">
                                    <span class="plato-item-macros ${isRef ? '' : 'equiv-alt-macros'}">
                                        <span data-m="kcal">${formatNutrient(macros.kcal, 'kcal')}</span>
                                        <span data-m="g">${formatNutrient(macros.grasas, 'g')}</span>
                                        <span data-m="h">${formatNutrient(macros.hidratos, 'g')}</span>
                                        <span data-m="p">${formatNutrient(macros.proteinas, 'g')}</span>
                                    </span>
                                    <button class="plato-item-remove" title="Quitar alimento"><i class="fa-solid fa-xmark"></i></button>
                                `;

                                giElements.push({ gi, giEl, isRef });

                                giEl.querySelector('.plato-item-name-input').addEventListener('input', (e) => {
                                    gi.nota = e.target.value;
                                });

                                // Remove individual item from equiv group
                                giEl.querySelector('.plato-item-remove').addEventListener('click', () => {
                                    plato.items = plato.items.filter(i => i !== gi);
                                    renderNutritionPlan();
                                });

                                giEl.querySelector('.plato-item-qty').addEventListener('input', (e) => {
                                    const newQty = parseFloat(e.target.value) || 0;
                                    gi.cantidad = newQty;

                                    // Update this item's macros
                                    const newMacros = getItemMacros(gi);
                                    giEl.querySelector('[data-m="kcal"]').textContent = formatNutrient(newMacros.kcal, 'kcal');
                                    giEl.querySelector('[data-m="g"]').textContent = formatNutrient(newMacros.grasas, 'g');
                                    giEl.querySelector('[data-m="h"]').textContent = formatNutrient(newMacros.hidratos, 'g');
                                    giEl.querySelector('[data-m="p"]').textContent = formatNutrient(newMacros.proteinas, 'g');

                                    // If reference changed, recalc all alternatives
                                    if (isRef && gi.Alimentos) {
                                        giElements.forEach(other => {
                                            if (other.isRef || !other.gi.Alimentos) return;
                                            other.gi.cantidad = calcAutoQtyByKcal(gi.Alimentos, newQty, other.gi.Alimentos);
                                            other.giEl.querySelector('.plato-item-qty').value = other.gi.cantidad;
                                            const om = getItemMacros(other.gi);
                                            other.giEl.querySelector('[data-m="kcal"]').textContent = formatNutrient(om.kcal, 'kcal');
                                            other.giEl.querySelector('[data-m="g"]').textContent = formatNutrient(om.grasas, 'g');
                                            other.giEl.querySelector('[data-m="h"]').textContent = formatNutrient(om.hidratos, 'g');
                                            other.giEl.querySelector('[data-m="p"]').textContent = formatNutrient(om.proteinas, 'g');
                                        });
                                    }

                                    updateMealMacros(card, meal);
                                    if (window.updateNutritionAnalysis) window.updateNutritionAnalysis();
                                });

                                groupEl.appendChild(giEl);
                            });

                            itemsContainer.appendChild(groupEl);
                        } else {
                            // Normal item (not from equivalence)
                            rendered.add(item._localId);
                            const itemEl = document.createElement('div');
                            itemEl.className = 'plato-item';

                            const nombre = getItemDisplayName(item);
                            const macros = getItemMacros(item);

                            itemEl.innerHTML = `
                                <input type="number" class="plato-item-qty" value="${item.cantidad}" min="1" step="1">
                                <span class="plato-item-unit">${item.unidad}</span>
                                <input type="text" class="plato-item-name-input" value="${item.nota || ''}" placeholder="${nombre}">
                                <span class="plato-item-macros">
                                    <span data-m="kcal">${formatNutrient(macros.kcal, 'kcal')}</span>
                                    <span data-m="g">${formatNutrient(macros.grasas, 'g')}</span>
                                    <span data-m="h">${formatNutrient(macros.hidratos, 'g')}</span>
                                    <span data-m="p">${formatNutrient(macros.proteinas, 'g')}</span>
                                </span>
                                <button class="plato-item-remove" title="Quitar"><i class="fa-solid fa-xmark"></i></button>
                            `;

                            itemEl.querySelector('.plato-item-name-input').addEventListener('input', (e) => {
                                item.nota = e.target.value;
                            });

                            itemEl.querySelector('.plato-item-qty').addEventListener('input', (e) => {
                                item.cantidad = parseFloat(e.target.value) || 0;
                                const newMacros = getItemMacros(item);
                                itemEl.querySelector('[data-m="kcal"]').textContent = formatNutrient(newMacros.kcal, 'kcal');
                                itemEl.querySelector('[data-m="g"]').textContent = formatNutrient(newMacros.grasas, 'g');
                                itemEl.querySelector('[data-m="h"]').textContent = formatNutrient(newMacros.hidratos, 'g');
                                itemEl.querySelector('[data-m="p"]').textContent = formatNutrient(newMacros.proteinas, 'g');
                                updateMealMacros(card, meal);
                                if (window.updateNutritionAnalysis) window.updateNutritionAnalysis();
                            });

                            itemEl.querySelector('.plato-item-remove').addEventListener('click', () => {
                                plato.items = plato.items.filter(i => i !== item);
                                renderNutritionPlan();
                            });

                            itemsContainer.appendChild(itemEl);
                        }
                    });
                }

                platoSection.appendChild(itemsContainer);
                body.appendChild(platoSection);
            });

            // Add plato button at bottom
            const addPlatoBtn = document.createElement('button');
            addPlatoBtn.className = 'add-plato-btn';
            addPlatoBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir sección (plato, postre, bebida...)';
            addPlatoBtn.addEventListener('click', () => addPlatoToMeal(meal));
            body.appendChild(addPlatoBtn);

            // --- Macros Summary ---
            const macrosSummary = document.createElement('div');
            macrosSummary.className = 'meal-macros-summary';
            macrosSummary.innerHTML = `
                <div class="meal-macro">
                    <div class="meal-macro-badge energy"><i class="fa-solid fa-fire"></i> Energía</div>
                    <div class="meal-macro-value" data-meal-macro="kcal">0 kcal</div>
                </div>
                <div class="meal-macro">
                    <div class="meal-macro-badge fat"><i class="fa-solid fa-droplet"></i> Grasa</div>
                    <div class="meal-macro-value" data-meal-macro="grasas">0 g</div>
                </div>
                <div class="meal-macro">
                    <div class="meal-macro-badge carbs"><i class="fa-regular fa-circle"></i> H. Carbono</div>
                    <div class="meal-macro-value" data-meal-macro="hidratos">0 g</div>
                </div>
                <div class="meal-macro">
                    <div class="meal-macro-badge protein"><i class="fa-regular fa-gem"></i> Proteína</div>
                    <div class="meal-macro-value" data-meal-macro="proteinas">0 g</div>
                </div>
                <div class="meal-macro">
                    <div class="meal-macro-badge fiber"><i class="fa-solid fa-leaf"></i> Fibra alimentaria</div>
                    <div class="meal-macro-value" data-meal-macro="fibra">0 g</div>
                </div>
            `;
            body.appendChild(macrosSummary);

            card.appendChild(body);
            container.appendChild(card);

            // Calculate initial macros
            updateMealMacros(card, meal);
        });

        // Update global analysis after full render
        if (window.updateNutritionAnalysis) window.updateNutritionAnalysis();
    }

    // Helpers
    function getItemDisplayName(item) {
        if (item.tipo === 'alimento' && item.Alimentos) {
            return item.Alimentos.nombre;
        }
        if (item.tipo === 'equivalencia' && item.Equivalencias) {
            return item.Equivalencias.nombre;
        }
        return 'Alimento desconocido';
    }

    function getItemMacros(item) {
        const c = item.cantidad || 100;
        if (item.tipo === 'alimento' && item.Alimentos) {
            const a = item.Alimentos;
            return {
                kcal: calcNutrient(a, 'energia_kcal', c),
                grasas: calcNutrient(a, 'grasas', c),
                hidratos: calcNutrient(a, 'hidratos', c),
                proteinas: calcNutrient(a, 'proteinas', c),
                fibra: calcNutrient(a, 'fibra', c)
            };
        }
        if (item.tipo === 'equivalencia' && item.Equivalencias) {
            // Use reference food of the equivalence
            const eqItems = item.Equivalencias.Equivalencias_Alimentos || [];
            const ref = eqItems.find(e => e.es_referencia);
            if (ref && ref.Alimentos) {
                // Adjust: item.cantidad is the desired qty, ref.cantidad is base qty for 100g data
                const factor = c / 100;
                const a = ref.Alimentos;
                return {
                    kcal: (a.energia_kcal || 0) * factor,
                    grasas: (a.grasas || 0) * factor,
                    hidratos: (a.hidratos || 0) * factor,
                    proteinas: (a.proteinas || 0) * factor,
                    fibra: (a.fibra || 0) * factor
                };
            }
        }
        return { kcal: 0, grasas: 0, hidratos: 0, proteinas: 0, fibra: 0 };
    }

    function updateMealMacros(cardEl, meal) {
        let totalKcal = 0, totalGrasas = 0, totalHidratos = 0, totalProteinas = 0, totalFibra = 0;

        meal.platos.forEach(plato => {
            plato.items.forEach(item => {
                // Skip equivalence alternatives — only count reference items
                if (item._equivGroupId && !item._isEquivRef) return;

                const m = getItemMacros(item);
                totalKcal += m.kcal;
                totalGrasas += m.grasas;
                totalHidratos += m.hidratos;
                totalProteinas += m.proteinas;
                totalFibra += m.fibra;
            });
        });

        const summary = cardEl.querySelector('.meal-macros-summary');
        if (summary) {
            summary.querySelector('[data-meal-macro="kcal"]').textContent = formatNutrient(totalKcal, 'kcal');
            summary.querySelector('[data-meal-macro="grasas"]').textContent = formatNutrient(totalGrasas, 'g');
            summary.querySelector('[data-meal-macro="hidratos"]').textContent = formatNutrient(totalHidratos, 'g');
            summary.querySelector('[data-meal-macro="proteinas"]').textContent = formatNutrient(totalProteinas, 'g');
            summary.querySelector('[data-meal-macro="fibra"]').textContent = formatNutrient(totalFibra, 'g');
        }
    }

    // 3. Add plato to a meal
    function addPlatoToMeal(meal) {
        const platoNames = ['Primer plato', 'Segundo plato', 'Postre', 'Bebida', 'Snack', 'Complemento'];
        const existingNames = meal.platos.map(p => p.nombre);
        const suggestion = platoNames.find(n => !existingNames.includes(n)) || 'Plato';

        const name = prompt('Nombre de la sección:', suggestion);
        if (!name) return;

        meal.platos.push({
            _localId: 'new_' + Date.now(),
            nombre: name,
            orden: meal.platos.length,
            items: []
        });

        renderNutritionPlan();
    }

    // 4. Open food search modal for a specific plato
    async function openPlanFoodSearch(platoLocalId) {
        planFoodSearchTargetPlatoId = platoLocalId;
        document.getElementById('planFoodSearchInput').value = '';

        // Ensure both foods and equivalences are loaded
        await ensureFoodsLoaded();
        if (allEquivalences.length === 0) {
            await fetchEquivalences();
        }

        renderPlanFoodSearchResults('');
        renderPlanEquivSearchResults('');

        // Reset tabs
        document.querySelectorAll('[data-plan-search-tab]').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-plan-search-tab="foods"]').classList.add('active');
        document.getElementById('planFoodSearchResults').style.display = '';
        document.getElementById('planEquivSearchResults').style.display = 'none';

        document.getElementById('planFoodSearchModal').classList.add('active');
    }

    // 5. Render food search results
    function renderPlanFoodSearchResults(filter) {
        const container = document.getElementById('planFoodSearchResults');
        container.innerHTML = '';

        let foods = [...allFoods];
        if (filter) {
            foods = foods.filter(f => f.nombre.toLowerCase().includes(filter.toLowerCase()));
        }
        foods.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

        foods.forEach(food => {
            const row = document.createElement('div');
            row.className = 'plan-search-row';

            row.innerHTML = `
                <input type="number" class="plan-search-qty" value="100" min="1" step="1">
                <span style="font-size:0.8rem; color: var(--text-muted);">g</span>
                <div class="plan-search-info">
                    <div class="plan-search-name">${food.nombre}</div>
                    <div class="plan-search-source">${food.fuente || 'Base de datos local'}</div>
                </div>
                <div class="plan-search-macros">
                    <span data-ps="kcal">${food.energia_kcal ?? 0} kcal</span>
                    <span data-ps="g">${food.grasas ?? 0} g</span>
                    <span data-ps="h">${food.hidratos ?? 0} g</span>
                    <span data-ps="p">${food.proteinas ?? 0} g</span>
                </div>
                <button class="plan-search-add" title="Añadir"><i class="fa-solid fa-plus"></i></button>
            `;

            // Dynamic recalc
            const qtyInput = row.querySelector('.plan-search-qty');
            qtyInput.addEventListener('input', () => {
                const q = parseFloat(qtyInput.value) || 0;
                const f = q / 100;
                row.querySelector('[data-ps="kcal"]').textContent = formatNutrient((food.energia_kcal || 0) * f, 'kcal');
                row.querySelector('[data-ps="g"]').textContent = formatNutrient((food.grasas || 0) * f, 'g');
                row.querySelector('[data-ps="h"]').textContent = formatNutrient((food.hidratos || 0) * f, 'g');
                row.querySelector('[data-ps="p"]').textContent = formatNutrient((food.proteinas || 0) * f, 'g');
            });

            // Add
            row.querySelector('.plan-search-add').addEventListener('click', (e) => {
                e.stopPropagation();
                const qty = parseFloat(qtyInput.value) || 100;
                addItemToPlato(planFoodSearchTargetPlatoId, {
                    tipo: 'alimento',
                    id_alimento: food.id_alimento,
                    Alimentos: food,
                    cantidad: qty,
                    unidad: 'gramos'
                });
            });

            container.appendChild(row);
        });
    }

    // 6. Render equivalence search results
    function renderPlanEquivSearchResults(filter) {
        const container = document.getElementById('planEquivSearchResults');
        container.innerHTML = '';

        let equivs = [...allEquivalences];
        if (filter) {
            equivs = equivs.filter(e => e.nombre.toLowerCase().includes(filter.toLowerCase()));
        }

        if (equivs.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:1rem;">No hay equivalencias creadas</p>';
            return;
        }

        equivs.forEach(eq => {
            const items = eq.Equivalencias_Alimentos || [];
            const ref = items.find(i => i.es_referencia);
            let kcalText = '—', gText = '—', hText = '—', pText = '—';

            if (ref && ref.Alimentos) {
                const f = (ref.cantidad || 100) / 100;
                const a = ref.Alimentos;
                kcalText = formatNutrient((a.energia_kcal || 0) * f, 'kcal');
                gText = formatNutrient((a.grasas || 0) * f, 'g');
                hText = formatNutrient((a.hidratos || 0) * f, 'g');
                pText = formatNutrient((a.proteinas || 0) * f, 'g');
            }

            const row = document.createElement('div');
            row.className = 'plan-search-row';

            row.innerHTML = `
                <input type="number" class="plan-search-qty" value="100" min="1" step="1">
                <span style="font-size:0.8rem; color: var(--text-muted);">g</span>
                <div class="plan-search-info">
                    <div class="plan-search-name">${eq.nombre}</div>
                    <div class="plan-search-source">${items.length} alimento${items.length !== 1 ? 's' : ''} equivalentes <span class="plato-item-equivtag">EQUIV</span></div>
                </div>
                <div class="plan-search-macros">
                    <span>${kcalText}</span>
                    <span>${gText}</span>
                    <span>${hText}</span>
                    <span>${pText}</span>
                </div>
                <button class="plan-search-add" title="Añadir"><i class="fa-solid fa-plus"></i></button>
            `;

            row.querySelector('.plan-search-add').addEventListener('click', (e) => {
                e.stopPropagation();
                const qty = parseFloat(row.querySelector('.plan-search-qty').value) || 100;
                addItemToPlato(planFoodSearchTargetPlatoId, {
                    tipo: 'equivalencia',
                    id_equivalencia: eq.id_equivalencia,
                    Equivalencias: eq,
                    cantidad: qty,
                    unidad: 'gramos'
                });
            });

            container.appendChild(row);
        });
    }

    // 7. Add item to plato (local)
    function addItemToPlato(platoLocalId, itemData) {
        for (const meal of nutritionPlanMeals) {
            for (const plato of meal.platos) {
                if (plato._localId === platoLocalId) {
                    // Si es equivalencia, expandir en alimentos individuales agrupados
                    if (itemData.tipo === 'equivalencia' && itemData.Equivalencias) {
                        const eqItems = itemData.Equivalencias.Equivalencias_Alimentos || [];
                        const eqName = itemData.Equivalencias.nombre || 'Equivalencia';
                        const equivGroupId = 'eqg_' + Date.now() + '_' + Math.random();

                        eqItems.forEach((eqItem, idx) => {
                            if (!eqItem.Alimentos) return;
                            const isRef = eqItem.es_referencia;
                            const displayName = eqItem.nombre_personalizado || eqItem.Alimentos.nombre;
                            const factor = (itemData.cantidad || 100) / 100;
                            const adjustedQty = Math.round(eqItem.cantidad * factor);

                            plato.items.push({
                                _localId: 'new_' + Date.now() + '_' + Math.random() + '_' + idx,
                                tipo: 'alimento',
                                id_alimento: eqItem.id_alimento,
                                Alimentos: eqItem.Alimentos,
                                cantidad: adjustedQty,
                                unidad: 'gramos',
                                nota: displayName,
                                orden: plato.items.length,
                                _fromEquiv: eqName,
                                _equivGroupId: equivGroupId,
                                _isEquivRef: isRef
                            });
                        });
                    } else {
                        plato.items.push({
                            _localId: 'new_' + Date.now() + '_' + Math.random(),
                            ...itemData,
                            orden: plato.items.length
                        });
                    }
                    renderNutritionPlan();
                    return;
                }
            }
        }
    }

    // 8. Save full plan to Supabase
    async function saveNutritionPlan() {
        if (!currentClientId) return;

        try {
            const titulo = document.getElementById('nutritionPlanTitle').value.trim() || 'Todos los días';

            // A. Create or update plan
            if (currentNutritionPlanId) {
                const { error } = await supabaseClient
                    .from('Planes_Nutricionales')
                    .update({ titulo, updated_at: new Date() })
                    .eq('id_plan', currentNutritionPlanId);
                if (error) throw error;

                // Delete old comidas (cascades to platos and items)
                await supabaseClient
                    .from('Plan_Comidas')
                    .delete()
                    .eq('id_plan', currentNutritionPlanId);
            } else {
                const { data, error } = await supabaseClient
                    .from('Planes_Nutricionales')
                    .insert([{ id_cliente: currentClientId, titulo }])
                    .select();
                if (error) throw error;
                currentNutritionPlanId = data[0].id_plan;
            }

            // B. Insert all meals, platos, items
            for (const meal of nutritionPlanMeals) {
                const { data: comidaData, error: comidaErr } = await supabaseClient
                    .from('Plan_Comidas')
                    .insert([{
                        id_plan: currentNutritionPlanId,
                        nombre: meal.nombre,
                        hora: meal.hora,
                        orden: meal.orden
                    }])
                    .select();
                if (comidaErr) throw comidaErr;

                const comidaId = comidaData[0].id_comida;

                for (const plato of meal.platos) {
                    const { data: platoData, error: platoErr } = await supabaseClient
                        .from('Plan_Platos')
                        .insert([{
                            id_comida: comidaId,
                            nombre: plato.nombre,
                            orden: plato.orden
                        }])
                        .select();
                    if (platoErr) throw platoErr;

                    const platoId = platoData[0].id_plato;

                    if (plato.items.length > 0) {
                        const itemInserts = plato.items.map((item, idx) => ({
                            id_plato: platoId,
                            tipo: item.tipo,
                            id_alimento: item.id_alimento || null,
                            id_equivalencia: item.id_equivalencia || null,
                            cantidad: item.cantidad,
                            unidad: item.unidad || 'gramos',
                            nota: item.nota || null,
                            orden: idx,
                            equiv_group: item._equivGroupId || null,
                            es_equiv_ref: item._isEquivRef || false
                        }));

                        const { error: itemsErr } = await supabaseClient
                            .from('Plan_Items')
                            .insert(itemInserts);
                        if (itemsErr) throw itemsErr;
                    }
                }
            }

            alert('Plan nutricional guardado correctamente.');
            // Reload to get DB ids
            await loadNutritionPlan(currentClientId);

        } catch (error) {
            console.error('Error al guardar plan nutricional:', error);
            alert('Error al guardar: ' + error.message);
        }
    }

    // 9. Event listeners
    const addMealBtn = document.getElementById('addMealBtn');
    const addMealModal = document.getElementById('addMealModal');
    const addMealForm = document.getElementById('addMealForm');

    if (addMealBtn) {
        addMealBtn.addEventListener('click', () => {
            addMealModal.classList.add('active');
        });
    }

    if (addMealModal) {
        addMealModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => addMealModal.classList.remove('active'));
        });
    }

    if (addMealForm) {
        addMealForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('mealNombre').value;
            const hora = document.getElementById('mealHora').value;

            nutritionPlanMeals.push({
                _localId: 'new_' + Date.now(),
                nombre,
                hora,
                orden: nutritionPlanMeals.length,
                platos: []
            });

            addMealModal.classList.remove('active');
            renderNutritionPlan();
        });
    }

    // Save plan button
    const saveNutritionPlanBtn = document.getElementById('saveNutritionPlanBtn');
    if (saveNutritionPlanBtn) {
        saveNutritionPlanBtn.addEventListener('click', saveNutritionPlan);
    }

    // Food search modal
    const planFoodSearchModal = document.getElementById('planFoodSearchModal');
    if (planFoodSearchModal) {
        planFoodSearchModal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => planFoodSearchModal.classList.remove('active'));
        });
    }

    const planFoodSearchInput = document.getElementById('planFoodSearchInput');
    if (planFoodSearchInput) {
        planFoodSearchInput.addEventListener('input', (e) => {
            const activeTab = document.querySelector('[data-plan-search-tab].active');
            if (activeTab && activeTab.dataset.planSearchTab === 'equivs') {
                renderPlanEquivSearchResults(e.target.value);
            } else {
                renderPlanFoodSearchResults(e.target.value);
            }
        });
    }

    // Tabs in search modal
    document.querySelectorAll('[data-plan-search-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-plan-search-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = planFoodSearchInput ? planFoodSearchInput.value : '';

            if (tab.dataset.planSearchTab === 'equivs') {
                document.getElementById('planFoodSearchResults').style.display = 'none';
                document.getElementById('planEquivSearchResults').style.display = '';
                renderPlanEquivSearchResults(filter);
            } else {
                document.getElementById('planFoodSearchResults').style.display = '';
                document.getElementById('planEquivSearchResults').style.display = 'none';
                renderPlanFoodSearchResults(filter);
            }
        });
    });

    // Expose for openClientProfile
    window.loadNutritionPlan = loadNutritionPlan;

    // ==========================================
    // MÓDULO DE SEGUIMIENTO
    // ==========================================

    const DEFAULT_MEDIDAS = [
        { nombre: 'Adherencia', opciones: ['Total', 'Media', 'Ninguna'] },
        { nombre: 'Entrenamiento', opciones: ['Sí', 'No'] },
        { nombre: 'Descanso', opciones: ['Bueno', 'Regular', 'Malo'] },
        { nombre: 'Estrés', opciones: ['Poco', 'Moderado', 'Mucho'] },
        { nombre: 'Pasos', opciones: ['Menos de 7.500', 'Entre 7.500 y 10.000', 'Más de 10.000'] },
        { nombre: 'Hidratación', opciones: ['Menos de 1L', 'Entre 1L y 2L', 'Más de 2L'] },
        { nombre: 'Motivación', opciones: ['Poca', 'Normal', 'Mucha'] }
    ];

    let seguimientoConfig = [];
    let seguimientoRegistros = [];
    let calendarYear, calendarMonth; // current calendar view

    // Initialize calendar to current month
    const now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();

    // ---- CONFIG (Ajustar seguimiento tab) ----

    async function loadSeguimientoConfig(clienteId) {
        seguimientoConfig = [];
        try {
            const { data, error } = await supabaseClient
                .from('Seguimiento_Config')
                .select('*')
                .eq('id_cliente', clienteId)
                .order('orden', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                seguimientoConfig = data.map(c => ({
                    _localId: 'db_' + c.id_config,
                    _dbId: c.id_config,
                    nombre: c.nombre,
                    opciones: c.opciones || [],
                    orden: c.orden
                }));
            } else {
                // No config yet: load defaults
                seguimientoConfig = DEFAULT_MEDIDAS.map((m, idx) => ({
                    _localId: 'default_' + idx,
                    nombre: m.nombre,
                    opciones: [...m.opciones],
                    orden: idx
                }));
            }
        } catch (e) {
            console.error('Error al cargar config seguimiento:', e);
        }
        renderSeguimientoConfig();
    }

    async function loadSeguimientoRegistros(clienteId) {
        seguimientoRegistros = [];
        try {
            const { data, error } = await supabaseClient
                .from('Seguimiento_Registros')
                .select('*')
                .eq('id_cliente', clienteId)
                .order('fecha', { ascending: true });

            if (error) throw error;
            seguimientoRegistros = data || [];
        } catch (e) {
            console.error('Error al cargar registros seguimiento:', e);
        }
        renderCalendar();
    }

    function renderSeguimientoConfig() {
        const container = document.getElementById('seguimientoConfigList');
        if (!container) return;
        container.innerHTML = '';

        seguimientoConfig.forEach((medida) => {
            const card = document.createElement('div');
            card.className = 'seguimiento-medida-card';

            const header = document.createElement('div');
            header.className = 'seguimiento-medida-header';
            header.innerHTML = `
                <input type="text" class="seguimiento-medida-name" value="${medida.nombre}" placeholder="Nombre de la medida">
                <button class="food-action-btn delete" title="Eliminar medida"><i class="fa-regular fa-trash-can"></i></button>
            `;

            header.querySelector('.seguimiento-medida-name').addEventListener('input', (e) => {
                medida.nombre = e.target.value;
            });

            header.querySelector('.food-action-btn.delete').addEventListener('click', () => {
                seguimientoConfig = seguimientoConfig.filter(m => m !== medida);
                renderSeguimientoConfig();
            });

            card.appendChild(header);

            const opcionesDiv = document.createElement('div');
            opcionesDiv.className = 'seguimiento-medida-opciones';

            medida.opciones.forEach((op, opIdx) => {
                const chip = document.createElement('span');
                chip.className = 'seguimiento-opcion-chip';
                chip.innerHTML = `${op} <button class="chip-remove-small" title="Quitar"><i class="fa-solid fa-xmark"></i></button>`;
                chip.querySelector('.chip-remove-small').addEventListener('click', () => {
                    medida.opciones.splice(opIdx, 1);
                    renderSeguimientoConfig();
                });
                opcionesDiv.appendChild(chip);
            });

            const addOpDiv = document.createElement('span');
            addOpDiv.className = 'seguimiento-add-opcion';
            addOpDiv.innerHTML = `
                <input type="text" placeholder="Nueva opción..." class="seg-new-opcion-input">
                <button title="Añadir"><i class="fa-solid fa-plus"></i></button>
            `;
            const addInput = addOpDiv.querySelector('input');
            const addBtn = addOpDiv.querySelector('button');
            const doAdd = () => {
                const val = addInput.value.trim();
                if (val) { medida.opciones.push(val); renderSeguimientoConfig(); }
            };
            addBtn.addEventListener('click', doAdd);
            addInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

            opcionesDiv.appendChild(addOpDiv);
            card.appendChild(opcionesDiv);
            container.appendChild(card);
        });
    }

    async function saveSeguimientoConfig() {
        if (!currentClientId) return;
        try {
            await supabaseClient.from('Seguimiento_Config').delete().eq('id_cliente', currentClientId);

            if (seguimientoConfig.length > 0) {
                const inserts = seguimientoConfig.map((m, idx) => ({
                    id_cliente: currentClientId,
                    nombre: m.nombre,
                    opciones: m.opciones,
                    orden: idx
                }));
                const { error } = await supabaseClient.from('Seguimiento_Config').insert(inserts);
                if (error) throw error;
            }

            alert('Configuración de seguimiento guardada.');
            await loadSeguimientoConfig(currentClientId);
        } catch (e) {
            console.error('Error al guardar config:', e);
            alert('Error: ' + e.message);
        }
    }

    // ---- CALENDAR (Seguimiento tab) ----

    const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    function getRegistroForDate(dateStr) {
        return seguimientoRegistros.find(r => r.fecha === dateStr);
    }

    function renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const titleEl = document.getElementById('calMonthTitle');
        if (!grid || !titleEl) return;

        titleEl.textContent = `${MONTH_NAMES_ES[calendarMonth]} ${calendarYear}`;
        grid.innerHTML = '';

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

        // Monday = 0 in our grid. JS: 0=Sun, 1=Mon...
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6; // Sunday → 6

        // Fill previous month days
        const prevMonthLast = new Date(calendarYear, calendarMonth, 0);
        for (let i = startDow - 1; i >= 0; i--) {
            const dayNum = prevMonthLast.getDate() - i;
            const d = new Date(calendarYear, calendarMonth - 1, dayNum);
            const dateStr = d.toISOString().split('T')[0];
            const hasRecord = !!getRegistroForDate(dateStr);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month' + (hasRecord ? ' has-record' : '');
            dayEl.innerHTML = `<span class="calendar-day-number">${dayNum}</span>${hasRecord ? '<span class="calendar-day-dot"></span>' : ''}`;
            grid.appendChild(dayEl);
        }

        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(calendarYear, calendarMonth, day);
            const dateStr = d.toISOString().split('T')[0];
            const isToday = dateStr === todayStr;
            const hasRecord = !!getRegistroForDate(dateStr);

            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day' + (isToday ? ' today' : '') + (hasRecord ? ' has-record' : '');
            dayEl.innerHTML = `<span class="calendar-day-number">${day}</span>${hasRecord ? '<span class="calendar-day-dot"></span>' : ''}`;

            dayEl.addEventListener('click', () => openRegistroDiario(dateStr));
            grid.appendChild(dayEl);
        }

        // Fill next month days to complete grid
        const totalCells = grid.children.length;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(calendarYear, calendarMonth + 1, i);
            const dateStr = d.toISOString().split('T')[0];
            const hasRecord = !!getRegistroForDate(dateStr);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day other-month' + (hasRecord ? ' has-record' : '');
            dayEl.innerHTML = `<span class="calendar-day-number">${i}</span>${hasRecord ? '<span class="calendar-day-dot"></span>' : ''}`;
            grid.appendChild(dayEl);
        }
    }

    // ---- REGISTRO DIARIO MODAL ----

    let currentRegistroDate = null;

    function openRegistroDiario(dateStr) {
        currentRegistroDate = dateStr;
        const modal = document.getElementById('registroDiarioModal');
        const fieldsContainer = document.getElementById('registroDiarioFields');
        const titleEl = document.getElementById('registroDiarioTitle');

        const fecha = new Date(dateStr + 'T12:00:00');
        titleEl.textContent = 'Registro: ' + fecha.toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        fieldsContainer.innerHTML = '';

        // Get existing values for this date
        const existing = getRegistroForDate(dateStr);
        const existingValues = existing ? (existing.valores || {}) : {};

        if (seguimientoConfig.length === 0) {
            fieldsContainer.innerHTML = '<p class="text-muted">No hay medidas configuradas. Ve a "Ajustar seguimiento" para configurar.</p>';
            modal.classList.add('active');
            return;
        }

        seguimientoConfig.forEach(medida => {
            const group = document.createElement('div');
            group.className = 'registro-field-group';

            const label = document.createElement('label');
            label.textContent = medida.nombre;
            group.appendChild(label);

            const select = document.createElement('select');
            select.name = medida.nombre;

            // Empty option
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '— Seleccionar —';
            select.appendChild(emptyOpt);

            medida.opciones.forEach(op => {
                const opt = document.createElement('option');
                opt.value = op;
                opt.textContent = op;
                if (existingValues[medida.nombre] === op) opt.selected = true;
                select.appendChild(opt);
            });

            group.appendChild(select);
            fieldsContainer.appendChild(group);
        });

        modal.classList.add('active');
    }

    async function saveRegistroDiario() {
        if (!currentClientId || !currentRegistroDate) return;

        const fieldsContainer = document.getElementById('registroDiarioFields');
        const selects = fieldsContainer.querySelectorAll('select');
        const valores = {};
        selects.forEach(sel => {
            if (sel.value) valores[sel.name] = sel.value;
        });

        try {
            const existing = getRegistroForDate(currentRegistroDate);

            if (existing) {
                const { error } = await supabaseClient
                    .from('Seguimiento_Registros')
                    .update({ valores })
                    .eq('id_registro', existing.id_registro);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient
                    .from('Seguimiento_Registros')
                    .insert([{ id_cliente: currentClientId, fecha: currentRegistroDate, valores }]);
                if (error) throw error;
            }

            document.getElementById('registroDiarioModal').classList.remove('active');
            await loadSeguimientoRegistros(currentClientId);

        } catch (e) {
            console.error('Error al guardar registro:', e);
            alert('Error: ' + e.message);
        }
    }

    // ---- EVENT LISTENERS ----

    // Config tab
    const addMedidaBtn = document.getElementById('addSeguimientoMedidaBtn');
    const medidaModal = document.getElementById('addMedidaModal');
    const medidaForm = document.getElementById('addMedidaForm');

    if (addMedidaBtn) {
        addMedidaBtn.addEventListener('click', () => {
            document.getElementById('medidaNombre').value = '';
            document.getElementById('medidaOpciones').value = '';
            medidaModal.classList.add('active');
        });
    }

    if (medidaModal) {
        medidaModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => medidaModal.classList.remove('active'));
        });
    }

    if (medidaForm) {
        medidaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('medidaNombre').value.trim();
            const opcionesStr = document.getElementById('medidaOpciones').value.trim();
            if (!nombre) return;
            const opciones = opcionesStr.split(',').map(o => o.trim()).filter(o => o);
            seguimientoConfig.push({ _localId: 'new_' + Date.now(), nombre, opciones, orden: seguimientoConfig.length });
            medidaModal.classList.remove('active');
            renderSeguimientoConfig();
        });
    }

    const saveSeguimientoBtn = document.getElementById('saveSeguimientoConfigBtn');
    if (saveSeguimientoBtn) {
        saveSeguimientoBtn.addEventListener('click', saveSeguimientoConfig);
    }

    // Calendar nav
    const calPrevBtn = document.getElementById('calPrevMonth');
    const calNextBtn = document.getElementById('calNextMonth');

    if (calPrevBtn) {
        calPrevBtn.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
            renderCalendar();
        });
    }
    if (calNextBtn) {
        calNextBtn.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
            renderCalendar();
        });
    }

    // Registro diario modal
    const registroModal = document.getElementById('registroDiarioModal');
    const registroForm = document.getElementById('registroDiarioForm');

    if (registroModal) {
        registroModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => registroModal.classList.remove('active'));
        });
    }

    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveRegistroDiario();
        });
    }

    window.loadSeguimientoConfig = loadSeguimientoConfig;
    window.loadSeguimientoRegistros = loadSeguimientoRegistros;

    // ==========================================
    // MÓDULO DE REVISIONES
    // ==========================================

    let revisionSortAsc = false; // false = más recientes primero

    async function fetchClientRevisiones(clienteId) {
        try {
            const { data, error } = await supabaseClient
                .from('Revisiones')
                .select('*')
                .eq('id_cliente', clienteId)
                .order('fecha', { ascending: revisionSortAsc });

            if (error) throw error;
            renderRevisionesList(data || []);
        } catch (error) {
            console.error('Error al obtener revisiones:', error);
        }
    }

    function renderRevisionesList(list) {
        const container = document.getElementById('revisionesList');
        if (!container) return;
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon"><i class="fa-regular fa-clipboard"></i></div>
                    <p>No hay revisiones registradas</p>
                    <small>Crea la primera revisión para este cliente</small>
                </div>`;
            return;
        }

        list.forEach(rev => {
            const fecha = new Date(rev.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const card = document.createElement('div');
            card.className = 'card revision-card';
            card.innerHTML = `
                <div class="revision-card-header">
                    <div>
                        <h4><i class="fa-regular fa-clipboard"></i> Revisión</h4>
                        <p class="revision-date">${fechaFormateada}</p>
                    </div>
                    <div class="revision-actions">
                        <button class="food-action-btn delete" title="Eliminar"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>
                ${rev.contenido ? `<p class="revision-preview">${rev.contenido.substring(0, 200)}${rev.contenido.length > 200 ? '...' : ''}</p>` : '<p class="revision-preview text-muted">Sin contenido</p>'}
            `;

            card.querySelector('.food-action-btn.delete').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('¿Eliminar esta revisión?')) {
                    try {
                        await supabaseClient.from('Revisiones').delete().eq('id_revision', rev.id_revision);
                        fetchClientRevisiones(currentClientId);
                    } catch (err) {
                        alert('Error al eliminar: ' + err.message);
                    }
                }
            });

            container.appendChild(card);
        });
    }

    async function saveRevision(data) {
        try {
            const { error } = await supabaseClient.from('Revisiones').insert([data]);
            if (error) throw error;
            alert('Revisión guardada correctamente');
            fetchClientRevisiones(currentClientId);
            return true;
        } catch (error) {
            console.error('Error al guardar revisión:', error);
            alert('Error: ' + error.message);
            return false;
        }
    }

    // Event listeners
    const addRevisionBtn = document.getElementById('addRevisionBtn');
    const revisionModal = document.getElementById('addRevisionModal');
    const revisionForm = document.getElementById('addRevisionForm');

    if (addRevisionBtn) {
        addRevisionBtn.addEventListener('click', () => {
            document.getElementById('revisionFecha').value = new Date().toISOString().split('T')[0];
            document.getElementById('revisionContenido').value = '';
            revisionModal.classList.add('active');
        });
    }

    if (revisionModal) {
        revisionModal.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => revisionModal.classList.remove('active'));
        });
    }

    if (revisionForm) {
        revisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const success = await saveRevision({
                id_cliente: currentClientId,
                fecha: document.getElementById('revisionFecha').value,
                contenido: document.getElementById('revisionContenido').value
            });
            if (success) {
                revisionModal.classList.remove('active');
            }
        });
    }

    const toggleSortBtn = document.getElementById('toggleRevisionSort');
    if (toggleSortBtn) {
        toggleSortBtn.addEventListener('click', () => {
            revisionSortAsc = !revisionSortAsc;
            toggleSortBtn.innerHTML = revisionSortAsc
                ? '<i class="fa-solid fa-arrow-up-short-wide"></i> Más antiguas'
                : '<i class="fa-solid fa-arrow-down-short-wide"></i> Más recientes';
            if (currentClientId) fetchClientRevisiones(currentClientId);
        });
    }

    window.fetchClientRevisiones = fetchClientRevisiones;

    // ==========================================
    // DASHBOARD
    // ==========================================

    async function loadDashboard() {
        try {
            // KPI: Total clients
            document.getElementById('kpiTotalClients').textContent = clients.length;

            // KPI: Total revisiones
            const { count: revCount } = await supabaseClient
                .from('Revisiones')
                .select('*', { count: 'exact', head: true });
            document.getElementById('kpiTotalRevisiones').textContent = revCount || 0;

            // KPI: Active plans
            const { count: planCount } = await supabaseClient
                .from('Planes_Nutricionales')
                .select('*', { count: 'exact', head: true });
            document.getElementById('kpiActivePlans').textContent = planCount || 0;

            // KPI: Average
            const avg = clients.length > 0 ? ((revCount || 0) / clients.length).toFixed(1) : '0';
            document.getElementById('kpiAvgRevisiones').textContent = avg;

            // Latest revisiones with client data
            const { data: latestRevs } = await supabaseClient
                .from('Revisiones')
                .select('*')
                .order('fecha', { ascending: false })
                .limit(10);

            renderDashboardRevisiones(latestRevs || []);

        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        }
    }

    function renderDashboardRevisiones(revisions) {
        const container = document.getElementById('dashboardRevisiones');
        if (!container) return;
        container.innerHTML = '';

        if (revisions.length === 0) {
            container.innerHTML = `
                <div class="card empty-state">
                    <div class="empty-icon"><i class="fa-regular fa-clipboard"></i></div>
                    <p>Aún no hay revisiones</p>
                    <small>Las revisiones de tus clientes aparecerán aquí</small>
                </div>`;
            return;
        }

        revisions.forEach(rev => {
            const fecha = new Date(rev.fecha);
            const fechaStr = fecha.toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            // Find client in local array
            const client = clients.find(c => c.id === rev.id_cliente);
            const clientName = client ? `${client.name} ${client.surname}` : 'Cliente';
            const clientPhoto = client ? client.photo : 'avatar.png';

            const card = document.createElement('div');
            card.className = 'card dashboard-revision-item';
            card.innerHTML = `
                <img src="${clientPhoto}" alt="${clientName}" class="avatar-medium">
                <div class="dashboard-revision-info">
                    <div class="dashboard-revision-top">
                        <strong>${clientName}</strong>
                        <span class="dashboard-revision-date">${fechaStr}</span>
                    </div>
                    <p class="dashboard-revision-text">${rev.contenido ? rev.contenido.substring(0, 120) + (rev.contenido.length > 120 ? '...' : '') : 'Sin contenido'}</p>
                </div>
            `;

            // Click to go to client profile
            if (client) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => openClientProfile(client));
            }

            container.appendChild(card);
        });
    }

    // ==========================================
    // ANÁLISIS GLOBAL DEL PLAN NUTRICIONAL
    // ==========================================

    let planningTargets = null; // { kcal, grasas, hidratos, proteinas, fibra }

    // 1. Load planning targets for the current client
    async function loadPlanningTargets(clienteId) {
        planningTargets = null;

        try {
            const { data, error } = await supabaseClient
                .from('Planificaciones')
                .select('kcal_diarias, gramos_grasas, gramos_hidratos, gramos_proteinas, fibra_gramos')
                .eq('id_cliente', clienteId)
                .maybeSingle();

            if (error) throw error;

            if (data && data.kcal_diarias) {
                planningTargets = {
                    kcal: data.kcal_diarias || 0,
                    grasas: data.gramos_grasas || 0,
                    hidratos: data.gramos_hidratos || 0,
                    proteinas: data.gramos_proteinas || 0,
                    fibra: data.fibra_gramos || 0
                };
            }
        } catch (e) {
            console.error('Error al cargar objetivos de planificación:', e);
        }

        updateNutritionAnalysis();
    }

    // 2. Calculate total macros from all meals
    function calculatePlanTotals() {
        let totalKcal = 0, totalGrasas = 0, totalHidratos = 0, totalProteinas = 0, totalFibra = 0;

        nutritionPlanMeals.forEach(meal => {
            meal.platos.forEach(plato => {
                plato.items.forEach(item => {
                    // Skip equivalence alternatives — only count reference
                    if (item._equivGroupId && !item._isEquivRef) return;

                    const m = getItemMacros(item);
                    totalKcal += m.kcal;
                    totalGrasas += m.grasas;
                    totalHidratos += m.hidratos;
                    totalProteinas += m.proteinas;
                    totalFibra += m.fibra;
                });
            });
        });

        return { kcal: totalKcal, grasas: totalGrasas, hidratos: totalHidratos, proteinas: totalProteinas, fibra: totalFibra };
    }

    // 3. Update the analysis panel UI
    function updateNutritionAnalysis() {
        const barsEl = document.getElementById('analysisContent');
        const noPlanEl = document.getElementById('analysisNoPlanning');

        if (!planningTargets) {
            if (barsEl) barsEl.style.display = 'none';
            if (noPlanEl) noPlanEl.style.display = '';
            return;
        }

        if (barsEl) barsEl.style.display = '';
        if (noPlanEl) noPlanEl.style.display = 'none';

        const totals = calculatePlanTotals();

        const fields = [
            { key: 'Kcal', current: totals.kcal, target: planningTargets.kcal },
            { key: 'Grasas', current: totals.grasas, target: planningTargets.grasas },
            { key: 'Hidratos', current: totals.hidratos, target: planningTargets.hidratos },
            { key: 'Proteinas', current: totals.proteinas, target: planningTargets.proteinas },
            { key: 'Fibra', current: totals.fibra, target: planningTargets.fibra }
        ];

        fields.forEach(f => {
            const currentEl = document.getElementById(`analysis${f.key}Current`);
            const targetEl = document.getElementById(`analysis${f.key}Target`);
            const barEl = document.getElementById(`analysis${f.key}Bar`);
            const percentEl = document.getElementById(`analysis${f.key}Percent`);

            if (!currentEl) return;

            const currentVal = Math.round(f.current * 10) / 10;
            const targetVal = Math.round(f.target * 10) / 10;
            const pct = targetVal > 0 ? (currentVal / targetVal) * 100 : 0;
            const displayPct = Math.round(pct);
            const barWidth = Math.min(pct, 100);

            currentEl.textContent = currentVal;
            targetEl.textContent = targetVal;
            barEl.style.width = barWidth + '%';
            percentEl.textContent = displayPct + '%';

            // Overflow styling
            if (pct > 100) {
                barEl.classList.add('overflow');
                percentEl.classList.add('overflow');
            } else {
                barEl.classList.remove('overflow');
                percentEl.classList.remove('overflow');
            }
        });

        // Update pie chart
        updateMacrosPieChart(totals);
    }

    // Macros pie chart
    let macrosPieChartInstance = null;

    function updateMacrosPieChart(totals) {
        const canvas = document.getElementById('macrosPieChart');
        const chartSection = document.getElementById('analysisChartSection');
        if (!canvas || !chartSection) return;

        const grasasKcal = (totals.grasas || 0) * 9;
        const hidratosKcal = (totals.hidratos || 0) * 4;
        const proteinasKcal = (totals.proteinas || 0) * 4;
        const totalMacroKcal = grasasKcal + hidratosKcal + proteinasKcal;

        if (totalMacroKcal === 0) {
            chartSection.style.display = 'none';
            return;
        }
        chartSection.style.display = '';

        const grasasPct = Math.round((grasasKcal / totalMacroKcal) * 100);
        const hidratosPct = Math.round((hidratosKcal / totalMacroKcal) * 100);
        const proteinasPct = 100 - grasasPct - hidratosPct;

        if (macrosPieChartInstance) {
            macrosPieChartInstance.data.datasets[0].data = [grasasPct, hidratosPct, proteinasPct];
            macrosPieChartInstance.update();
            return;
        }

        const ctx = canvas.getContext('2d');
        macrosPieChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Grasas', 'H. Carbono', 'Proteína'],
                datasets: [{
                    data: [grasasPct, hidratosPct, proteinasPct],
                    backgroundColor: ['#FACC15', '#EF4444', '#3B82F6'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12, family: 'Inter' }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#374151',
                        bodyColor: '#374151',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(ctx) {
                                return ctx.label + ': ' + ctx.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // Expose globally so it can be called from renderNutritionPlan and item changes
    window.updateNutritionAnalysis = updateNutritionAnalysis;
    window.loadPlanningTargets = loadPlanningTargets;

    // ==========================================
    // GENERADOR DE PDF
    // ==========================================

    async function generateClientPDF() {
        if (!currentClientId) return;

        const client = clients.find(c => c.id === currentClientId);
        if (!client) { alert('Cliente no encontrado'); return; }

        // Check jsPDF loaded
        if (!window.jspdf && !window.jsPDF && typeof jspdf === 'undefined') {
            alert('Error: la librería jsPDF no se ha cargado. Recarga la página e inténtalo de nuevo.');
            console.error('jsPDF not found. window.jspdf:', window.jspdf, 'window.jsPDF:', window.jsPDF);
            return;
        }

        try {

        // Load data
        let planData = null;
        try {
            const res = await supabaseClient.from('Planificaciones').select('*').eq('id_cliente', currentClientId).maybeSingle();
            planData = res.data;
        } catch (e) { console.warn('No planning data:', e); }

        let planNutData = null;
        try {
            const res = await supabaseClient.from('Planes_Nutricionales').select(`*, Plan_Comidas(*, Plan_Platos(*, Plan_Items(*, Alimentos(*))))`).eq('id_cliente', currentClientId).maybeSingle();
            planNutData = res.data;
        } catch (e) { console.warn('No nutrition plan data:', e); }

        let lastMedicion = null;
        try {
            const res = await supabaseClient.from('Mediciones').select('peso, altura').eq('id_cliente', currentClientId).order('fecha', { ascending: false }).limit(1);
            lastMedicion = res.data;
        } catch (e) { console.warn('No measurement data:', e); }

        const peso = lastMedicion?.[0]?.peso || null;
        const altura = lastMedicion?.[0]?.altura || null;
        const imc = (peso && altura) ? (peso / ((altura / 100) ** 2)).toFixed(1) : null;

        // Month names
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const nowDate = new Date();
        const mesActual = meses[nowDate.getMonth()];
        const anioActual = nowDate.getFullYear();

        // jsPDF
        const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
        const doc = new JsPDF('p', 'mm', 'letter');
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const marginL = 20;
        const marginR = 20;
        const contentW = pageW - marginL - marginR;
        let y = 15;

        const GREEN = [56, 199, 165];
        const DARK = [55, 65, 81];
        const GRAY = [107, 114, 128];

        // Load logo
        let logoImg = null;
        try {
            const img = new Image();
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = () => { console.warn('Logo no cargado'); resolve(); };
                img.src = 'Logo_ML_Sin_Fondo.png';
            });
            if (img.width > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                logoImg = canvas.toDataURL('image/png');
            }
        } catch (e) {
            console.warn('No se pudo cargar el logo:', e);
        }

        function checkNewPage(needed) {
            if (y + needed > pageH - 20) {
                doc.addPage();
                y = 20;
                return true;
            }
            return false;
        }

        // ---- HEADER ----
        function drawHeader() {
            const headerY = y;
            if (logoImg) {
                doc.addImage(logoImg, 'PNG', marginL, headerY, 20, 19);
            }

            // Nutricionista info: 2 rows x 2 columns with green labels
            const infoStartX = pageW - marginR - 125;
            const col2X = pageW - marginR - 48;
            const row1Y = headerY + 6;
            const row2Y = headerY + 13;

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');

            // Helper: label (green) + value (dark) inline
            function labelValue(x, yPos, label, value) {
                doc.setTextColor(...GREEN);
                doc.text(label + ': ', x, yPos);
                const labelW = doc.getTextWidth(label + ': ');
                doc.setTextColor(...DARK);
                doc.text(value, x + labelW, yPos);
            }

            // Row 1: Nutricionista | Telefono
            labelValue(infoStartX, row1Y, 'Nutricionista', 'Mario Llanos Nutricion');
            labelValue(col2X, row1Y, 'Telefono', '+34 677 876 638');

            // Row 2: Correo | Servicio
            labelValue(infoStartX, row2Y, 'Correo', 'llanosnutricion@gmail.com');
            labelValue(col2X, row2Y, 'Servicio', 'En linea');

            y = headerY + 20;

            // Green line
            doc.setDrawColor(...GREEN);
            doc.setLineWidth(0.8);
            doc.line(marginL, y, pageW - marginR, y);
            y += 8;
        }

        drawHeader();

        // ---- CLIENT INFO ----
        doc.setFontSize(11);
        doc.setTextColor(...GREEN);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIONES DEL CLIENTE', marginL, y);
        y += 7;

        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'normal');

        const clientInfo = [
            [`${client.name} ${client.surname}`, `EDAD: ${client.age} años`, `ALTURA: ${altura ? altura + ' cm' : '—'}`],
            [client.email || '', `IMC: ${imc || '—'} kg/m²`, `PESO: ${peso ? peso + ' kg' : '—'}`]
        ];

        clientInfo.forEach(row => {
            const colW = contentW / 3;
            row.forEach((text, i) => {
                const x = marginL + (colW * i);
                if (i === 0) {
                    doc.setFont('helvetica', 'bold');
                } else {
                    doc.setFont('helvetica', 'normal');
                }
                doc.text(text, x, y);
            });
            y += 5;
        });

        y += 8;

        // ---- COMIDAS ----
        doc.setFontSize(11);
        doc.setTextColor(...GREEN);
        doc.setFont('helvetica', 'bold');
        doc.text('COMIDAS', marginL, y);
        y += 8;

        if (planNutData && planNutData.Plan_Comidas) {
            const comidas = planNutData.Plan_Comidas.sort((a, b) => {
                if (a.hora < b.hora) return -1;
                if (a.hora > b.hora) return 1;
                return a.orden - b.orden;
            });

            comidas.forEach(comida => {
                checkNewPage(15);

                // Hora + Nombre
                doc.setFontSize(10);
                doc.setTextColor(...GREEN);
                doc.setFont('helvetica', 'bold');
                doc.text(comida.hora || '12:00', marginL, y);
                doc.setTextColor(...DARK);
                doc.text(comida.nombre.toUpperCase(), marginL + 18, y);
                y += 6;

                const platos = (comida.Plan_Platos || []).sort((a, b) => a.orden - b.orden);

                platos.forEach(plato => {
                    const items = (plato.Plan_Items || []).sort((a, b) => a.orden - b.orden);
                    if (items.length === 0) return;

                    checkNewPage(10);

                    // Plato name as bullet header
                    doc.setFontSize(8.5);
                    doc.setTextColor(...DARK);
                    doc.setFont('helvetica', 'bold');
                    doc.text('*', marginL + 4, y);
                    doc.text(plato.nombre.toUpperCase() + ':', marginL + 8, y);
                    y += 5;

                    // Items as sub-bullets under the plato
                    const processed = new Set();
                    doc.setFont('helvetica', 'normal');

                    items.forEach(item => {
                        if (processed.has(item.id_item)) return;

                        checkNewPage(6);

                        if (item.equiv_group) {
                            // Equivalence: join with "o"
                            const groupItems = items.filter(i => i.equiv_group === item.equiv_group);
                            groupItems.forEach(gi => processed.add(gi.id_item));

                            let text = '';
                            groupItems.forEach((gi, idx) => {
                                const nombre = gi.nota || (gi.Alimentos ? gi.Alimentos.nombre : 'Alimento');
                                const qty = gi.cantidad || 100;
                                if (idx > 0) text += ' o ';
                                text += `${qty} gramos de ${nombre.toLowerCase()}`;
                            });

                            doc.setFontSize(8);
                            doc.text('-', marginL + 10, y);
                            const lines = doc.splitTextToSize(text, contentW - 18);
                            lines.forEach(line => {
                                checkNewPage(4);
                                doc.text(line, marginL + 14, y);
                                y += 3.8;
                            });
                            y += 1;

                        } else {
                            processed.add(item.id_item);
                            const nombre = item.nota || (item.Alimentos ? item.Alimentos.nombre : 'Alimento');
                            const qty = item.cantidad || 100;
                            const text = `${qty} gramos de ${nombre.toLowerCase()}`;

                            doc.setFontSize(8);
                            doc.text('-', marginL + 10, y);
                            const lines = doc.splitTextToSize(text, contentW - 18);
                            lines.forEach(line => {
                                checkNewPage(4);
                                doc.text(line, marginL + 14, y);
                                y += 3.8;
                            });
                            y += 1;
                        }
                    });
                    y += 2;
                });

                y += 4;
            });
        }

        // ---- RECOMENDACIONES ----
        checkNewPage(20);
        y += 5;

        doc.setFontSize(11);
        doc.setTextColor(...GREEN);
        doc.setFont('helvetica', 'bold');
        doc.text('RECOMENDACIONES', marginL, y);
        y += 8;

        // Get recommendations: prefer editor content (live), fallback to DB
        const editorEl = document.getElementById('recommendationsEditor');
        const recsHtml = (editorEl && editorEl.innerHTML.trim()) ? editorEl.innerHTML : (planData?.recomendaciones || '');
        if (recsHtml) {
            // Convert HTML to lines: replace <br> and </p> with newlines, strip tags
            const cleanText = recsHtml
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<\/div>/gi, '\n')
                .replace(/<\/li>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/-->/g, '-->')
                .trim();

            const textLines = cleanText.split('\n');

            textLines.forEach(rawLine => {
                const text = rawLine.trim();
                if (!text) { y += 2; return; }

                // Detect bold titles (all uppercase, > 3 chars)
                const isTitle = text === text.toUpperCase() && text.length > 3 && !/^\d/.test(text);

                if (isTitle) {
                    checkNewPage(8);
                    y += 2;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(...DARK);
                } else {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8.5);
                    doc.setTextColor(...DARK);
                }

                const wrappedLines = doc.splitTextToSize(text, contentW - 4);
                wrappedLines.forEach(line => {
                    checkNewPage(4.5);
                    doc.text(line, marginL + 2, y);
                    y += 4;
                });
            });
        }

        // ---- FIRMA como footer fijo de la última página (abajo derecha) ----
        const totalPages = doc.internal.getNumberOfPages();
        doc.setPage(totalPages); // ensure we're on the last page
        const footerY = pageH - 18;
        const sigRightX = pageW - marginR;
        const sigLineWidth = 70;

        doc.setDrawColor(...GRAY);
        doc.setLineWidth(0.3);
        doc.line(sigRightX - sigLineWidth, footerY, sigRightX, footerY);

        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        doc.setFont('helvetica', 'normal');
        doc.text('(ML Nutricion)', sigRightX - (sigLineWidth / 2), footerY + 5, { align: 'center' });

        // Save
        const fileName = `PLAN NUTRICIONAL ${mesActual} ${anioActual} ${client.name.toUpperCase()} ${client.surname.toUpperCase()}.pdf`;
        doc.save(fileName);

        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar PDF: ' + error.message);
        }
    }

    // Button listener
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generateClientPDF);
    }

    // Cargar clientes al iniciar la app, luego dashboard
    fetchClients().then(() => loadDashboard());
});
