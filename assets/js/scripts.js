// Importamos la función getRandomUser desde api.js (RandomUser API)
import { getRandomUser } from './api.js';

// ======================
// VARIABLES GLOBALES
// ======================
const USERS_API_URL = 'http://localhost:3000/users'; // URL base para json-server
export let users = []; // Lista en memoria
let editingIndex = null;
let deleteIndex = null;

// ======================
let showingFavorites = false; // Controlar si estamos mostrando favoritos
let favoriteUsers = JSON.parse(localStorage.getItem('favorites')) || [];
// ======================

// ======================
// EVENTOS PRINCIPALES
// ======================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar usuarios desde json-server al iniciar
    loadUsersFromJSON();

    // Configurar eventos
    document.getElementById('autoFillBtn').addEventListener('click', autoFillForm);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('userForm').addEventListener('submit', handleSubmit);
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

// ======================
// Inicializar tooltips al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltips.map(function(el) {
        return new bootstrap.Tooltip(el);
    });
});
// ======================

// ======================
// FUNCIONES CRUD CON JSON-SERVER
// ======================
async function loadUsersFromJSON() {
    try {
        const response = await fetch(USERS_API_URL);
        if (!response.ok) throw new Error('Error al cargar usuarios');
        users = await response.json();
        renderUsers();
    } catch (error) {
        console.error('Error al leer JSON:', error);
        showToast('No se pudo cargar el archivo JSON', 'danger');
    }
}

async function createUserOnServer(user) {
    try {
        const response = await fetch(USERS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await response.json();
    } catch (error) {
        console.error('Error en POST:', error);
    }
}

async function updateUserOnServer(id, user) {
    try {
        const response = await fetch(`${USERS_API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await response.json();
    } catch (error) {
        console.error('Error en PUT:', error);
    }
}

async function deleteUserOnServer(id) {
    try {
        const response = await fetch(`${USERS_API_URL}/${id}`, { method: 'DELETE' });
        return response.ok;
    } catch (error) {
        console.error('Error en DELETE:', error);
    }
}

// ======================
// FUNCIONES DEL FORMULARIO
// ======================
function getFormData() {
    return {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        profileImage: document.getElementById('profileImage').src
    };
}

function fillForm(user) {
    document.getElementById('fullName').value = user.fullName;
    document.getElementById('email').value = user.email;
    document.getElementById('phone').value = user.phone;
    document.getElementById('profileImage').src = user.profileImage;
}

async function autoFillForm() {
    try {
        const user = await getRandomUser(); // Datos desde RandomUser
        fillForm(user);
        showToast('Formulario auto-rellenado con datos de RandomUser', 'success');
    } catch {
        showToast('Error al obtener datos de la API', 'danger');
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    const userData = getFormData();

    if (!validateUser(userData)) return;

    const createdUser = await createUserOnServer(userData);
    if (createdUser) {
        users.push(createdUser);
        clearForm();
        renderUsers();
        showToast('Usuario agregado correctamente', 'success');
    }
}

function clearForm() {
    document.getElementById('userForm').reset();
    document.getElementById('profileImage').src = 'https://via.placeholder.com/100x100/6c757d/ffffff?text=Foto';
}

// ======================
// RENDERIZADO DE USUARIOS
// ======================

// Función renderUsers actualizada

export function renderUsers(filteredList = null) {
    const list = filteredList || users;
    const container = document.getElementById('usersList');
    
    // Actualizar el contador en caso de cambios
    updateFavoriteBadge();
    
    if (showingFavorites && list.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-heart-broken text-danger fa-3x mb-3"></i>
                <h4 class="text-muted">No tienes usuarios favoritos</h4>
                <button class="btn btn-sm btn-outline-primary mt-3" 
                        onclick="mostrarFavoritos()">
                    Ver todos los usuarios
                </button>
            </div>`;
    } else {
        document.getElementById('userCount').textContent = `${list.length} usuarios`;
        container.innerHTML = list.length
            ? list.map(user => userCard(user)).join('')
            : `<div class="col-12 text-center text-muted py-5">No hay usuarios</div>`;
    }
}
/**export function renderUsers(filteredList = null) {
    const list = filteredList || users;
    const container = document.getElementById('usersList');
    
    if (showingFavorites && list.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-heart-broken text-danger fa-3x mb-3"></i>
                <h4 class="text-muted">No tienes usuarios favoritos</h4>
                <button class="btn btn-sm btn-outline-primary mt-3" 
                        onclick="mostrarFavoritos()">
                    Ver todos los usuarios
                </button>
            </div>`;
    } else {
        document.getElementById('userCount').textContent = `${list.length} usuarios`;
        container.innerHTML = list.length
            ? list.map(user => userCard(user)).join('')
            : `<div class="col-12 text-center text-muted py-5">No hay usuarios</div>`;
    }
}
export function renderUsers(filteredList = null) {
    const list = filteredList || users;
    const container = document.getElementById('usersList');
    document.getElementById('userCount').textContent = `${list.length} usuarios`;

    container.innerHTML = list.length
        ? list.map((u, i) => userCard(u, i)).join('')
        : `<div class="col-12 text-center text-muted py-5">No hay usuarios</div>`;
}

function userCard(user) {
    return `
        <div class="col-md-6 mb-3">
            <div class="card shadow-sm">
                <div class="card-body text-center">
                    <img src="${user.profileImage}" class="rounded-circle mb-2" width="80">
                    <h5>${user.fullName}</h5>
                    <p>${user.email}</p>
                    <p>${user.phone}</p>
                   <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.id}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="askDelete('${user.id}')">Eliminar</button>
                </div>
            </div>
        </div>`;
}
function userCard(user) {
    return `
        <div class="col-md-6 mb-3">
            <div class="card shadow-sm">
                <div class="card-body text-center">
                    <img src="${user.profileImage}" class="rounded-circle mb-2" width="80">
                    <h5>${user.fullName}</h5>
                    <p>${user.email}</p>
                    <p>${user.phone}</p>
                    <!-- Botón Editar con Tooltip -->
                    <button 
                        class="btn btn-sm btn-outline-primary" 
                        onclick="editUser('${user.id}')"
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Editar usuario"
                    >
                        <i class="fas fa-edit me-1"></i> Editar
                    </button>
                    <!-- Botón Eliminar con Tooltip -->
                    <button 
                        class="btn btn-sm btn-outline-danger" 
                        onclick="askDelete('${user.id}')"
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Eliminar usuario"
                    >
                        <i class="fas fa-trash-alt me-1"></i> Eliminar <!-- Esto es un comentario -->
                    </button>
                </div>
            </div>
        </div>`;
}

function userCard(user) {
    const isFavorite = favoriteUsers.includes(user.id);
    return `
        <div class="col-md-6 mb-3">
            <div class="card shadow-sm ${isFavorite ? 'border-danger' : ''}">
                <div class="card-body text-center">
                    <img src="${user.profileImage}" class="rounded-circle mb-2" width="80">
                    <h5>${user.fullName}</h5>
                    <p>${user.email}</p>
                    <p>${user.phone}</p>
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="editUser('${user.id}')"
                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Editar usuario"
                                >
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="askDelete('${user.id}')"
                                data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Eliminar usuario"
                                >
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                        <!-- Botón de favorito -->
                        <button class="btn btn-sm ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}" 
                                onclick="toggleFavorite('${user.id}')"
                                data-bs-toggle="tooltip"
                                title="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
}**/
function userCard(user) {
    const isFavorite = favoriteUsers.includes(user.id);
    return `
        <div class="col-md-6 mb-3">
            <div class="card shadow-sm ${isFavorite ? 'border-danger' : ''}">
                <div class="card-body text-center">
                    <img src="${user.profileImage}" class="rounded-circle mb-2" width="80">
                    <h5>${user.fullName}</h5>
                    <p>${user.email}</p>
                    <p>${user.phone}</p>
                    <div class="d-flex justify-content-center gap-2">
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="editUser('${user.id}')"

                                data-bs-toggle="tooltip" 
                                data-bs-placement="top" 
                                title="Editar usuario"

                                >
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="askDelete('${user.id}')"
                                
                                data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Eliminar usuario"

                                >
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                        <button class="btn btn-sm ${isFavorite ? 'btn-danger' : 'btn-outline-danger'}" 
                                onclick="toggleFavorite('${user.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
}
// ======================
// Función para mostrar favoritos (modificada)
window.mostrarFavoritos = function() {
    showingFavorites = !showingFavorites;
    
    if (showingFavorites) {
        // Filtrar usuarios favoritos
        const filteredUsers = users.filter(user => favoriteUsers.includes(user.id));
        renderUsers(filteredUsers);
        document.getElementById('favoritesBtn').classList.add('active');
        showToast('Mostrando solo favoritos', 'info');
    } else {
        // Mostrar todos los usuarios
        renderUsers();
        document.getElementById('favoritesBtn').classList.remove('active');
        showToast('Mostrando todos los usuarios', 'info');
    }
};
// ======================
// Función toggleFavorite actualizada
window.toggleFavorite = function(userId) {
    const index = favoriteUsers.indexOf(userId);
    if (index === -1) {
        favoriteUsers.push(userId);
    } else {
        favoriteUsers.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favoriteUsers));
    updateFavoriteBadge();
    
    // Si estamos mostrando favoritos, actualizar la vista
    if (showingFavorites) {
        mostrarFavoritos(); // Esto recargará la lista filtrada
    }
};
// ======================
// ======================
function updateFavoriteBadge() {
    const badge = document.getElementById('favoriteBadge');
    if (badge) {
        badge.textContent = favoriteUsers.length;
        badge.classList.toggle('bg-danger', favoriteUsers.length > 0);
        badge.classList.toggle('bg-secondary', favoriteUsers.length === 0);
    }
}
// ======================
// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateFavoriteBadge();
    
    // Inicializar tooltips para los botones de favoritos
    const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltips.map(el => new bootstrap.Tooltip(el));
});
// ======================

// ======================
// MODAL DE EDICIÓN
// ======================
window.editUser = (id) => {
    editingIndex = id;
    const user = users.find(u => u.id === id);
    document.getElementById('editUserIndex').value = id;
    document.getElementById('editProfileImage').src = user.profileImage;
    document.getElementById('editFullName').value = user.fullName;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;
    new bootstrap.Modal(document.getElementById('editModal')).show();
};

async function saveEdit() {
    const id = editingIndex;
    if (id === null) return;

    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    if (!validateEmail(email) || !validatePhone(phone)) {
        showToast('Datos inválidos al editar', 'danger');
        return;
    }

    const userIndex = users.findIndex(u => u.id === id);
    users[userIndex].email = email;
    users[userIndex].phone = phone;

    await updateUserOnServer(id, users[userIndex]);
    editingIndex = null;
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    renderUsers();
    showToast('Usuario actualizado correctamente', 'success');
}

// ======================
// MODAL DE ELIMINACIÓN
// ======================
window.askDelete = (id) => {
    deleteIndex = id;
    const user = users.find(u => u.id === id);
    document.getElementById('deleteUserName').textContent = user.fullName;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
};
// ======================
async function confirmDelete() {
    if (deleteIndex === null) return;

    // Verificar si el usuario que se elimina está en favoritos
    const isFavorite = favoriteUsers.includes(deleteIndex);
    
    await deleteUserOnServer(deleteIndex);
    users = users.filter(u => u.id !== deleteIndex);
    
    // Si el usuario estaba en favoritos, quitarlo de la lista
    if (isFavorite) {
        favoriteUsers = favoriteUsers.filter(id => id !== deleteIndex);
        localStorage.setItem('favorites', JSON.stringify(favoriteUsers));
        updateFavoriteBadge();
    }
    
    deleteIndex = null;
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    renderUsers(showingFavorites ? users.filter(user => favoriteUsers.includes(user.id)) : users);
    showToast('Usuario eliminado', 'warning');
}
// ======================
//async function confirmDelete() {
//    if (deleteIndex === null) return;

//    await deleteUserOnServer(deleteIndex);
 //   users = users.filter(u => u.id !== deleteIndex);
  //  deleteIndex = null;
  //  bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
   // renderUsers();
   // showToast('Usuario eliminado', 'warning');
//}

// ======================
// VALIDACIONES
// ======================
function validateUser(user) {
    if (!user.fullName || user.fullName.length < 2) {
        showToast('Nombre inválido', 'danger');
        return false;
    }
    if (!validateEmail(user.email)) {
        showToast('Email inválido', 'danger');
        return false;
    }
    if (!validatePhone(user.phone)) {
        showToast('Teléfono inválido', 'danger');
        return false;
    }
    return true;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9+\-()\s]{7,15}$/.test(phone);
}

// ======================
// NOTIFICACIONES (TOAST)
// ======================
function showToast(message, type = 'primary') {
    const toast = document.getElementById('mainToast');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    document.getElementById('toastMessage').textContent = message;
    new bootstrap.Toast(toast).show();
}


// Inicializar badge al cargar
document.addEventListener('DOMContentLoaded', updateFavoriteBadge);