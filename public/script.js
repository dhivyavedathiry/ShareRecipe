const API_URL = `${window.location.origin}/api`;
let token = localStorage.getItem('token');
let currentUser = null;

// Navigation
function showSection(sectionId, addToHistory = true) {
    document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    if (sectionId === 'browse') {
        loadRecipes();
    } else if (sectionId === 'favorites') {
        loadFavorites();
    } else if (sectionId === 'collections') {
        loadCollections();
    } else if (sectionId === 'feed') {
        loadFeed();
    } else if (sectionId === 'profile') {
        loadProfile();
    } else if (sectionId === 'admin') {
        loadAdminUsers();
    }

    // Add to browser history
    if (addToHistory) {
        const state = { section: sectionId };
        const url = `#${sectionId}`;
        window.history.pushState(state, '', url);
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section) {
        showSection(e.state.section, false);
    } else {
        // Default to home if no state
        showSection('home', false);
    }
});

// Initialize history on page load (will be called in DOMContentLoaded)
function initializeHistory() {
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        if (['home', 'browse', 'favorites', 'collections', 'create', 'feed', 'profile'].includes(sectionId)) {
            showSection(sectionId, false);
        } else {
            showSection('home', false);
            window.history.replaceState({ section: 'home' }, '', '#home');
        }
    } else {
        // Set initial state
        showSection('home', false);
        window.history.replaceState({ section: 'home' }, '', '#home');
    }
}

function showModal(type) {
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(type) {
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make functions globally accessible immediately
window.showSection = showSection;
window.showModal = showModal;
window.closeModal = closeModal;

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Initialize browser history first
    initializeHistory();

    checkAuth();

    // Only load recipes if we're on the browse section initially
    const currentSection = window.location.hash ? window.location.hash.substring(1) : 'home';
    if (currentSection === 'browse') {
        loadRecipes();
    }

    // Navigation links - handle section switching
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Modal buttons - open modals
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalType = btn.getAttribute('data-modal');
            showModal(modalType);
        });
    });

    // Close modal buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalType = btn.getAttribute('data-close-modal');
            closeModal(modalType);
        });
    });

    // Close recipe detail modal when clicking outside
    const recipeDetailModal = document.getElementById('recipe-detail-modal');
    if (recipeDetailModal) {
        recipeDetailModal.addEventListener('click', (e) => {
            if (e.target === recipeDetailModal) {
                closeModal('recipe-detail');
            }
        });
    }

    const welcomeMsg = document.getElementById('welcome-msg');
    if (welcomeMsg) {
        welcomeMsg.addEventListener('click', () => {
            if (token) {
                showSection('profile');
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchRecipes();
        });
    }

    // Apply Filters button
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchRecipes();
        });
    }

    // Add Enter key support for search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchRecipes();
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            handleLogin(e);
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            handleRegister(e);
        });
    }

    // Create recipe form
    const createRecipeForm = document.getElementById('create-recipe-form');
    if (createRecipeForm) {
        createRecipeForm.addEventListener('submit', (e) => {
            handleCreateRecipe(e);
        });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-recipe-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            cancelRecipeForm();
        });
    }

    // Description character counter
    const descriptionInput = document.getElementById('description-input');
    const charCount = document.getElementById('description-char-count');
    if (descriptionInput && charCount) {
        descriptionInput.addEventListener('input', () => {
            const length = descriptionInput.value.length;
            const maxLength = 500;
            charCount.textContent = `(${length}/${maxLength})`;
            if (length > maxLength * 0.9) {
                charCount.style.color = '#ef4444';
            } else {
                charCount.style.color = 'var(--text-muted)';
            }
        });
    }

    // Create collection form
    const createCollectionForm = document.getElementById('create-collection-form');
    if (createCollectionForm) {
        createCollectionForm.addEventListener('submit', (e) => {
            createCollection(e);
        });
    }



    // Admin Dashboard Logic
    const adminUsersTab = document.getElementById('admin-users-tab');
    const adminRecipesTab = document.getElementById('admin-recipes-tab');
    const adminReviewsTab = document.getElementById('admin-reviews-tab');

    if (adminUsersTab && adminRecipesTab && adminReviewsTab) {
        adminUsersTab.addEventListener('click', () => {
            adminUsersTab.classList.add('active');
            adminUsersTab.classList.remove('btn-ghost');
            adminUsersTab.classList.add('btn-secondary');

            adminRecipesTab.classList.remove('active');
            adminRecipesTab.classList.add('btn-ghost');
            adminRecipesTab.classList.remove('btn-secondary');

            adminReviewsTab.classList.remove('active');
            adminReviewsTab.classList.add('btn-ghost');
            adminReviewsTab.classList.remove('btn-secondary');

            document.getElementById('admin-users-view').classList.remove('hidden');
            document.getElementById('admin-recipes-view').classList.add('hidden');
            document.getElementById('admin-reviews-view').classList.add('hidden');
            loadAdminUsers();
        });

        adminRecipesTab.addEventListener('click', () => {
            adminRecipesTab.classList.add('active');
            adminRecipesTab.classList.remove('btn-ghost');
            adminRecipesTab.classList.add('btn-secondary');

            adminUsersTab.classList.remove('active');
            adminUsersTab.classList.add('btn-ghost');
            adminUsersTab.classList.remove('btn-secondary');

            adminReviewsTab.classList.remove('active');
            adminReviewsTab.classList.add('btn-ghost');
            adminReviewsTab.classList.remove('btn-secondary');

            document.getElementById('admin-recipes-view').classList.remove('hidden');
            document.getElementById('admin-users-view').classList.add('hidden');
            document.getElementById('admin-reviews-view').classList.add('hidden');
            loadAdminRecipes();
        });

        adminReviewsTab.addEventListener('click', () => {
            adminReviewsTab.classList.add('active');
            adminReviewsTab.classList.remove('btn-ghost');
            adminReviewsTab.classList.add('btn-secondary');

            adminUsersTab.classList.remove('active');
            adminUsersTab.classList.add('btn-ghost');
            adminUsersTab.classList.remove('btn-secondary');

            adminRecipesTab.classList.remove('active');
            adminRecipesTab.classList.add('btn-ghost');
            adminRecipesTab.classList.remove('btn-secondary');

            document.getElementById('admin-reviews-view').classList.remove('hidden');
            document.getElementById('admin-users-view').classList.add('hidden');
            document.getElementById('admin-recipes-view').classList.add('hidden');
            loadAdminReviews();
        });
    }
});

// Close modal when clicking outside
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Auth
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();

        if (res.ok) {
            loginSuccess(data);
            closeModal('register');
        } else {
            showToast(data.message);
        }
    } catch (err) {
        showToast('Error registering');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            loginSuccess(data);
            closeModal('login');
        } else {
            showToast(data.message);
        }
    } catch (err) {
        showToast('Error logging in');
    }
}

// Make auth functions globally accessible
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;

function loginSuccess(data) {
    token = data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(data));
    checkAuth();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    checkAuth();
    showSection('home');
}

// Make logout globally accessible
window.logout = logout;

// ... (logout function remains)

// Check authentication status
function checkAuth() {
    const userStr = localStorage.getItem('user');
    const unauthControls = document.getElementById('unauth-controls');
    const authControls = document.getElementById('auth-controls');

    // New Dropdown Elements
    const userNameDisplay = document.getElementById('user-name-display');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    const logoutLink = document.getElementById('logout-link');

    const createLink = document.getElementById('createLink');
    const feedLink = document.getElementById('feedLink');

    // New Icon Buttons
    const collectionsBtn = document.getElementById('nav-collections-btn');
    const favoritesBtn = document.getElementById('nav-favorites-btn');

    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
            if (unauthControls) unauthControls.classList.add('hidden');
            if (authControls) authControls.classList.remove('hidden');

            // Explicitly set flex display to ensure alignment
            authControls.style.display = 'flex';

            if (userNameDisplay && currentUser.username) {
                // Just the username, no "Hi"
                userNameDisplay.textContent = currentUser.username;
            }

            // Dropdown Toggle Logic
            if (userMenuBtn && userDropdownMenu) {
                // Remove old listener to prevent duplicates if any (basic approach)
                const newBtn = userMenuBtn.cloneNode(true);
                userMenuBtn.parentNode.replaceChild(newBtn, userMenuBtn);

                newBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdownMenu.classList.toggle('hidden');
                });

                // Close when clicking outside
                document.addEventListener('click', (e) => {
                    if (!newBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                        userDropdownMenu.classList.add('hidden');
                    }
                });
            }

            // Logout Logic
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    currentUser = null;
                    checkAuth();
                    showSection('home');
                    if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
                    showToast('Logged out successfully');
                });
            }

            if (createLink) createLink.classList.remove('hidden');
            if (feedLink) feedLink.classList.remove('hidden');

            // Show Icons
            if (collectionsBtn) collectionsBtn.classList.remove('hidden');
            if (favoritesBtn) favoritesBtn.classList.remove('hidden');

            // Admin check
            const adminLink = document.getElementById('adminLink');
            if (currentUser.role === 'admin') {
                if (adminLink) adminLink.classList.remove('hidden');
            } else {
                if (adminLink) adminLink.classList.add('hidden');
            }
        } catch (err) {
            console.error('Error parsing user data:', err);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    } else {
        if (unauthControls) unauthControls.classList.remove('hidden');
        if (authControls) {
            authControls.classList.add('hidden');
            authControls.style.display = 'none'; // Ensure hidden
        }
        if (createLink) createLink.classList.add('hidden');
        if (feedLink) feedLink.classList.add('hidden');

        // Hide Icons
        if (collectionsBtn) collectionsBtn.classList.add('hidden');
        if (favoritesBtn) favoritesBtn.classList.add('hidden');

        const adminLink = document.getElementById('adminLink');
        if (adminLink) adminLink.classList.add('hidden');
    }
}

// ... (loadRecipes remains)

// Event Listeners for New Navbar Icons
document.addEventListener('DOMContentLoaded', () => {
    // ... (existing history init)

    // Collections Icon
    const navCollectionsBtn = document.getElementById('nav-collections-btn');
    if (navCollectionsBtn) {
        navCollectionsBtn.addEventListener('click', () => showSection('collections'));
    }

    // Favorites Icon
    const navFavoritesBtn = document.getElementById('nav-favorites-btn');
    if (navFavoritesBtn) {
        navFavoritesBtn.addEventListener('click', () => showSection('favorites'));
    }
});

// Recipes
async function loadRecipes(searchQuery = '', filters = {}) {
    const grid = document.getElementById('recipe-grid');
    if (!grid) return;

    grid.innerHTML = '<p>Loading...</p>';

    try {
        let url = `${API_URL}/recipes`;
        const params = new URLSearchParams();
        if (searchQuery) params.append('keyword', searchQuery);
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.time) params.append('time', filters.time);
        if (filters.dietary) params.append('dietary', filters.dietary);

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const recipes = await res.json();

        if (!recipes || recipes.length === 0) {
            grid.innerHTML = '<p>No recipes found.</p>';
            return;
        }

        // Check if user is logged in and get user ID
        const userStr = localStorage.getItem('user');
        const currentUserId = userStr ? JSON.parse(userStr).id : null;

        // Fetch user's favorites if logged in
        let favoriteRecipeIds = [];
        if (currentUserId && token) {
            try {
                const favRes = await fetch(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (favRes.ok) {
                    const userData = await favRes.json();
                    favoriteRecipeIds = (userData.favoriteRecipes || []).map(r => r.id);
                }
            } catch (err) {
                console.error('Error fetching favorites:', err);
            }
        }

        grid.innerHTML = recipes.map(recipe => {
            const isOwner = currentUserId && recipe.author && recipe.author.id === currentUserId;
            const isFavorited = favoriteRecipeIds.includes(recipe.id);
            return `
            <div class="recipe-card ${isOwner ? 'has-owner-controls' : ''}" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                ${currentUserId ? `
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${recipe.id}">
                    <i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="collection-add-btn" data-recipe-id="${recipe.id}" title="Add to collection">
                    <i class="far fa-bookmark"></i>
                </button>
                ` : ''}
                ${isOwner ? `
                <div class="recipe-kebab" data-recipe-id="${recipe.id}">
                    <button class="kebab-btn" data-recipe-id="${recipe.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="kebab-menu" id="kebab-menu-${recipe.id}">
                        <button class="kebab-item" data-action="edit" data-recipe-id="${recipe.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="kebab-item" data-action="delete" data-recipe-id="${recipe.id}" style="color: #ef4444;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                ` : ''}
                <h3>${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.cooking_time}m</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                </div>
                <p>${recipe.description ? recipe.description.substring(0, 100) + '...' : ''}</p>
                <div style="margin-top: 1rem;">
                    ${filterDietaryTags(recipe.dietary_tags).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                    By <span class="author-link" data-author-id="${recipe.author ? recipe.author.id : ''}" style="color: var(--primary); cursor: pointer; font-weight: 500;">
                        ${recipe.author ? recipe.author.username : 'Unknown'}
                    </span>
                </small>
            </div>
        `
        }).join('');

        // Add click handlers to recipe cards
        grid.querySelectorAll('.recipe-card[data-recipe-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on kebab menu, favorite button, collection button, or their children
                if (!e.target.closest('.recipe-kebab') && !e.target.closest('.kebab-menu') && !e.target.closest('.favorite-btn') && !e.target.closest('.collection-add-btn')) {
                    const recipeId = card.getAttribute('data-recipe-id');
                    showRecipeDetails(recipeId);
                }
            });
        });

        // Prevent card click when clicking on kebab area
        grid.querySelectorAll('.recipe-kebab').forEach(kebab => {
            kebab.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Add kebab menu handlers
        setupKebabMenus(grid);

        // Add favorite button handlers
        grid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-favorite-id'));
                toggleFavorite(recipeId, e);
            });
        });

        // Add collection button handlers
        grid.querySelectorAll('.collection-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-recipe-id'));
                showAddToCollectionModal(recipeId);
            });
        });

        // Add author link handlers
        grid.querySelectorAll('.author-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const authorId = link.getAttribute('data-author-id');
                if (authorId) {
                    loadPublicProfile(authorId);
                }
            });
        });
    } catch (err) {
        console.error('Error loading recipes:', err);
        grid.innerHTML = '<p>Error loading recipes.</p>';
    }
}

function searchRecipes() {
    const searchInput = document.getElementById('searchInput');
    const difficultyInput = document.getElementById('filter-difficulty');
    const timeInput = document.getElementById('filter-time');
    const dietaryInput = document.getElementById('filter-dietary');

    if (searchInput) {
        const query = searchInput.value.trim();
        const filters = {
            difficulty: difficultyInput ? difficultyInput.value : '',
            time: timeInput ? timeInput.value : '',
            dietary: dietaryInput ? dietaryInput.value : ''
        };
        loadRecipes(query, filters);
    }
}

// Make search function globally accessible
window.searchRecipes = searchRecipes;

// Load user's own recipes
async function loadMyRecipes() {
    const grid = document.getElementById('my-recipes-grid');
    if (!grid) return;

    if (!token) {
        grid.innerHTML = '<p>Please login to view your recipes.</p>';
        return;
    }

    grid.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                grid.innerHTML = '<p>Please login to view your recipes.</p>';
                return;
            }
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const user = await res.json();
        const recipes = user.recipes || [];

        if (!recipes || recipes.length === 0) {
            grid.innerHTML = '<p>You haven\'t created any recipes yet. <a href="#" data-section="create" style="color: var(--primary);">Create your first recipe!</a></p>';
            // Add click handler for the create link
            const createLink = grid.querySelector('[data-section="create"]');
            if (createLink) {
                createLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    showSection('create');
                });
            }
            return;
        }

        grid.innerHTML = recipes.map(recipe => `
                <div class="recipe-card has-owner-controls" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                <div class="recipe-kebab" data-recipe-id="${recipe.id}">
                    <button class="kebab-btn" data-recipe-id="${recipe.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="kebab-menu" id="kebab-menu-my-${recipe.id}">
                        <button class="kebab-item" data-action="edit" data-recipe-id="${recipe.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="kebab-item" data-action="delete" data-recipe-id="${recipe.id}" style="color: #ef4444;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <button class="collection-add-btn" data-recipe-id="${recipe.id}" title="Add to collection">
                    <i class="far fa-bookmark"></i>
                </button>
                <h3>${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.cooking_time}m</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                </div>
                <p>${recipe.description ? recipe.description.substring(0, 100) + '...' : ''}</p>
                <div style="margin-top: 1rem;">
                    ${filterDietaryTags(recipe.dietary_tags).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <small>Created ${new Date(recipe.createdAt).toLocaleDateString()}</small>
            </div>
                `).join('');

        // Add click handlers to recipe cards
        grid.querySelectorAll('.recipe-card[data-recipe-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on kebab menu, collection button, or their children
                if (!e.target.closest('.recipe-kebab') && !e.target.closest('.kebab-menu') && !e.target.closest('.collection-add-btn')) {
                    const recipeId = card.getAttribute('data-recipe-id');
                    showRecipeDetails(recipeId);
                }
            });
        });

        // Prevent card click when clicking on kebab area
        grid.querySelectorAll('.recipe-kebab').forEach(kebab => {
            kebab.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Add kebab menu handlers
        setupKebabMenus(grid);

        // Add collection button handlers
        grid.querySelectorAll('.collection-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-recipe-id'));
                showAddToCollectionModal(recipeId);
            });
        });
    } catch (err) {
        console.error('Error loading my recipes:', err);
        grid.innerHTML = '<p>Error loading your recipes.</p>';
    }
}

async function handleCreateRecipe(e) {
    e.preventDefault();
    if (!token) return showToast('Please login first');

    const formData = new FormData(e.target);
    const ingredients = formData.get('ingredients').split(',').map(i => i.trim());
    const recipeId = e.target.getAttribute('data-edit-recipe-id');

    // Get time and servings
    const cooking_time = parseInt(formData.get('cooking_time'));
    const servings = parseInt(formData.get('servings'));

    const recipeData = {
        title: formData.get('title'),
        description: formData.get('description'),
        cooking_time: cooking_time,
        servings: servings,
        difficulty: formData.get('difficulty'),
        instructions: formData.get('instructions'),
        ingredients: ingredients,
        dietary_tags: [] // We don't use this for range metadata anymore
    };

    try {
        let res;
        if (recipeId) {
            // Update existing recipe
            res = await fetch(`${API_URL}/recipes/${recipeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(recipeData)
            });
        } else {
            // Create new recipe
            res = await fetch(`${API_URL}/recipes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(recipeData)
            });
        }

        if (res.ok) {
            showToast(recipeId ? 'Recipe updated!' : 'Recipe Published!');
            e.target.reset();
            e.target.removeAttribute('data-edit-recipe-id');

            // Reset form title and button text
            const section = document.getElementById('create');
            const heading = section.querySelector('h2');
            if (heading) heading.textContent = 'Share Your Recipe';
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Publish Recipe';

            // Navigate back to my-recipes (or previous page)
            if (window.history.length > 1) {
                window.history.back();
                // Refresh profile after a short delay
                setTimeout(() => {
                    const profileSection = document.getElementById('profile');
                    if (profileSection && !profileSection.classList.contains('hidden')) {
                        loadProfile();
                    }
                }, 100);
            } else {
                showSection('profile');
            }
        } else {
            const data = await res.json();
            showToast(data.message || 'Error saving recipe');
        }
    } catch (err) {
        console.error(err);
        showToast('Error saving recipe');
    }
}

// Show recipe details
async function showRecipeDetails(recipeId) {
    const modal = document.getElementById('recipe-detail-modal');
    const content = document.getElementById('recipe-detail-content');

    if (!modal || !content) return;

    content.innerHTML = '<p>Loading...</p>';
    modal.style.display = 'block';

    try {
        const res = await fetch(`${API_URL}/recipes/${recipeId}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const recipe = await res.json();

        // Format ingredients array
        let ingredientsHtml = '';
        if (recipe.ingredients) {
            const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
            ingredientsHtml = ingredients.map(ing => `<li>${ing}</li>`).join('');
        }

        // Format dietary tags (filter out metadata)
        const realTags = filterDietaryTags(recipe.dietary_tags);

        // Fetch reviews
        let reviews = [];
        try {
            const reviewRes = await fetch(`${API_URL}/recipes/${recipeId}/reviews`);
            if (reviewRes.ok) {
                reviews = await reviewRes.json();
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }

        // Calculate stats
        const avgRating = calculateAverageRating(reviews);
        const reviewCount = reviews.length;

        // Generate Star UI
        const starRatingHtml = generateStars(avgRating);

        // Check if user has already reviewed
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const userHasReviewed = currentUser && reviews.some(r => r.userId === currentUser.id);
        const isOwner = currentUser && recipe.author && recipe.author.id === currentUser.id;

        // Check if user is following author
        let isFollowing = false;
        if (currentUser && recipe.author && recipe.author.id !== currentUser.id) {
            try {
                const profileRes = await fetch(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    if (profile.Following) {
                        isFollowing = profile.Following.some(u => u.id === recipe.author.id);
                    }
                }
            } catch (ignore) { }
        }

        content.innerHTML = `
            <h2>${recipe.title}</h2>
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">
                <div>
                   <small>By ${recipe.author ? recipe.author.username : 'Unknown'}</small>
                   ${(currentUser && recipe.author && recipe.author.id !== currentUser.id) ? `
                   <button class="follow-btn ${isFollowing ? 'following' : ''}" data-author-id="${recipe.author.id}">
                       ${isFollowing ? 'Unfollow' : 'Follow'}
                   </button>
                   ` : ''}
                </div>
                ${recipe.createdAt ? `<small>Created ${new Date(recipe.createdAt).toLocaleDateString()}</small>` : ''}
            </div>

            <div style="margin: 1rem 0; color: var(--text-muted); display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <span><i class="far fa-clock"></i> ${recipe.cooking_time} m</span>
                <span><i class="fas fa-users"></i> ${recipe.servings} pp</span>
                <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                   <span style="color: var(--primary);">${starRatingHtml}</span> 
                   <span>(${reviewCount} reviews)</span>
                </span>
            </div>
            ${realTags.length > 0 ? `<div style="margin: 1rem 0;">${realTags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            <p style="margin: 1.5rem 0; line-height: 1.6;">${recipe.description || ''}</p>
            
            <h3 style="margin-top: 2rem;">Ingredients</h3>
            <ul style="margin: 1rem 0; padding-left: 1.5rem; line-height: 1.8;">
                ${ingredientsHtml || '<li>No ingredients listed</li>'}
            </ul>
            
            <h3 style="margin-top: 2rem;">Instructions</h3>
            <div style="margin: 1rem 0; white-space: pre-wrap; line-height: 1.8;">${recipe.instructions || 'No instructions provided'}</div>
            
            <div class="reviews-section">
                <div class="review-stats">
                    <div class="average-rating">${avgRating}</div>
                    <div>
                        <div class="star-rating" style="font-size: 1.5rem;">${starRatingHtml}</div>
                        <div class="total-reviews">${reviewCount} Reviews</div>
                    </div>
                </div>

                ${(!userHasReviewed && currentUser && !isOwner) ? `
                <div class="review-form-container">
                    <h4>Write a Review</h4>
                    <form id="review-form" data-recipe-id="${recipe.id}">
                        <div style="margin: 1rem 0;">
                            <label style="margin-bottom: 0.5rem; display: block;">Rating</label>
                            <div class="star-rating" id="review-star-input">
                                ${[1, 2, 3, 4, 5].map(i => `<i class="fas fa-star star interactive" data-value="${i}"></i>`).join('')}
                            </div>
                            <input type="hidden" name="rating" id="rating-input" required>
                        </div>
                        <div class="form-group">
                            <label>Comment</label>
                            <textarea name="comment" placeholder="Share your experience..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Submit Review</button>
                    </form>
                </div>
                ` : ''}

                <div class="review-list">
                    ${reviews.length > 0 ? reviews.map(review => `
                    <div class="review-item">
                        <div class="review-header">
                            <span class="reviewer-name">${review.reviewer ? review.reviewer.username : 'Unknown User'}</span>
                            <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem; color: var(--primary);">
                            ${generateStars(review.rating)}
                        </div>
                        <div class="review-body">${review.comment || ''}</div>
                    </div>
                    `).join('') : '<p>No reviews yet. Be the first to review!</p>'}
                </div>
            </div>
        `;

        // Add follow button handler
        const followBtn = content.querySelector('.follow-btn');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                const authorId = followBtn.getAttribute('data-author-id');
                toggleFollow(authorId, followBtn);
            });
        }

        // Initialize review form logic if present
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            initReviewForm(reviewForm);
        }

    } catch (err) {
        console.error('Error loading recipe details:', err);
        content.innerHTML = '<p>Error loading recipe details.</p>';
    }
}

function initReviewForm(form) {
    const stars = form.querySelectorAll('.star.interactive');
    const ratingInput = document.getElementById('rating-input');
    let currentRating = 0;

    stars.forEach(star => {
        star.addEventListener('mouseover', () => {
            const val = parseInt(star.getAttribute('data-value'));
            highlightStars(stars, val);
        });

        star.addEventListener('mouseout', () => {
            highlightStars(stars, currentRating);
        });

        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            ratingInput.value = currentRating;
            highlightStars(stars, currentRating);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = ratingInput.value;
        const comment = form.comment.value;
        const recipeId = form.getAttribute('data-recipe-id');

        if (!rating) {
            showToast('Please select a rating');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/recipes/${recipeId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rating, comment })
            });

            if (res.ok) {
                // Reload recipe details to show new review
                showRecipeDetails(recipeId);
            } else {
                const data = await res.json();
                showToast(data.message || 'Error submitting review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            showToast('Error submitting review');
        }
    });
}

function highlightStars(stars, value) {
    stars.forEach(star => {
        const starVal = parseInt(star.getAttribute('data-value'));
        if (starVal <= value) {
            star.classList.add('filled');
            star.style.color = 'var(--primary)';
        } else {
            star.classList.remove('filled');
            star.style.color = 'var(--text-muted)';
        }
    });
}

function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star" style="color: var(--primary);"></i>';
    }
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt" style="color: var(--primary);"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star" style="color: var(--text-muted);"></i>';
    }
    return html;
}

// Helper functions getTimeRange and getServingsRange removed to support single value fields

// Helper function to filter out metadata tags from display
function filterDietaryTags(tags) {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.filter(tag => tag && !tag.startsWith('__'));
}

// Feed
async function loadFeed() {
    const grid = document.getElementById('feed-grid');
    if (!grid) return;

    if (!token) {
        grid.innerHTML = '<p>Please login to view your feed.</p>';
        return;
    }

    grid.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`${API_URL}/users/feed`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const recipes = await res.json();

        if (!recipes || recipes.length === 0) {
            grid.innerHTML = '<p>No activity yet. Follow some users to see their recipes here!</p>';
            return;
        }

        // Reuse the same card rendering logic or copy-paste (DRY would be better but keeping it simple for now)
        // We'll just map them similarly to loadRecipes but without delete/edit buttons for others' recipes
        // Also need to checkfavorites
        // Fetch user's favorites
        let favoriteRecipeIds = [];
        try {
            const favRes = await fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (favRes.ok) {
                const userData = await favRes.json();
                favoriteRecipeIds = (userData.favoriteRecipes || []).map(r => r.id);
            }
        } catch (err) { }

        grid.innerHTML = recipes.map(recipe => {
            const isFavorited = favoriteRecipeIds.includes(recipe.id);
            return `
            <div class="recipe-card" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                 <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${recipe.id}">
                    <i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="collection-add-btn" data-recipe-id="${recipe.id}" title="Add to collection">
                    <i class="far fa-bookmark"></i>
                </button>
                <h3>${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.cooking_time}m</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                </div>
                <p>${recipe.description ? recipe.description.substring(0, 100) + '...' : ''}</p>
                <div style="margin-top: 1rem;">
                    ${filterDietaryTags(recipe.dietary_tags).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">
                    By <span class="author-link" data-author-id="${recipe.author ? recipe.author.id : ''}" style="color: var(--primary); cursor: pointer; font-weight: 500;">
                        ${recipe.author ? recipe.author.username : 'Unknown'}
                    </span> 
                    • ${new Date(recipe.createdAt).toLocaleDateString()}
                </small>
            </div>
        `
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.recipe-card[data-recipe-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-btn') && !e.target.closest('.collection-add-btn')) {
                    const recipeId = card.getAttribute('data-recipe-id');
                    showRecipeDetails(recipeId);
                }
            });
        });

        // Add favorite button handlers
        grid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-favorite-id'));
                toggleFavorite(recipeId, e);
            });
        });

        // Add collection button handlers
        grid.querySelectorAll('.collection-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-recipe-id'));
                showAddToCollectionModal(recipeId);
            });
        });

        // Add author link handlers
        grid.querySelectorAll('.author-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                const authorId = link.getAttribute('data-author-id');
                if (authorId) {
                    loadPublicProfile(authorId);
                }
            });
        });

    } catch (err) {
        console.error('Error loading feed:', err);
        grid.innerHTML = '<p>Error loading feed.</p>';
    }
}

// Global function for toggle follow (called from HTML onclick)
async function toggleFollow(userId, btn) {
    if (!token) return showToast('Please login to follow users');

    // Optimistic UI update
    const isFollowing = btn.classList.contains('following');
    const OriginalText = btn.textContent;

    if (isFollowing) {
        btn.classList.remove('following');
        btn.textContent = 'Follow';
    } else {
        btn.classList.add('following');
        btn.textContent = 'Unfollow';
    }

    try {
        const res = await fetch(`${API_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            // Revert if error
            if (isFollowing) {
                btn.classList.add('following');
                btn.textContent = 'Unfollow';
            } else {
                btn.classList.remove('following');
                btn.textContent = 'Follow';
            }
            const data = await res.json();
            showToast(data.message || 'Error updating follow status');
        }
    } catch (err) {
        console.error(err);
        // Revert
        if (isFollowing) {
            btn.classList.add('following');
            btn.textContent = 'Unfollow';
        } else {
            btn.classList.remove('following');
            btn.textContent = 'Follow';
        }
    }
}

// Make globally accessible
window.loadFeed = loadFeed;
window.toggleFollow = toggleFollow;

// Make showRecipeDetails globally accessible
window.loadPublicProfile = loadPublicProfile;

// Setup kebab menus
function setupKebabMenus(container) {
    // Close all menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.recipe-kebab')) {
            container.querySelectorAll('.kebab-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }
    });

    // Toggle menu on kebab button click
    container.querySelectorAll('.kebab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipeId = btn.getAttribute('data-recipe-id');
            const menu = container.querySelector(`#kebab-menu-${recipeId}`) || container.querySelector(`#kebab-menu-my-${recipeId}`);
            if (menu) {
                // Close all other menus
                container.querySelectorAll('.kebab-menu').forEach(m => {
                    if (m !== menu) m.classList.remove('active');
                });
                // Toggle current menu
                menu.classList.toggle('active');
            }
        });
    });

    // Handle edit action
    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipeId = btn.getAttribute('data-recipe-id');
            editRecipe(recipeId);
            // Close menu
            container.querySelectorAll('.kebab-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        });
    });

    // Handle delete action
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipeId = btn.getAttribute('data-recipe-id');
            deleteRecipe(recipeId);
            // Close menu
            container.querySelectorAll('.kebab-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        });
    });
}

// Cancel recipe form
function cancelRecipeForm() {
    const form = document.getElementById('create-recipe-form');
    if (form) {
        form.reset();
        form.removeAttribute('data-edit-recipe-id');

        // Reset form title and button text
        const section = document.getElementById('create');
        const heading = section.querySelector('h2');
        if (heading) heading.textContent = 'Share Your Recipe';
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Publish Recipe';
    }

    // Go back in browser history (will navigate to previous section)
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // If no history, go to my-recipes
        showSection('my-recipes');
    }
}

// Edit recipe
async function editRecipe(recipeId) {
    try {
        const res = await fetch(`${API_URL}/recipes/${recipeId}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const recipe = await res.json();

        // Populate the create form with recipe data
        const form = document.getElementById('create-recipe-form');
        if (!form) return;

        form.querySelector('[name="title"]').value = recipe.title || '';
        form.querySelector('[name="description"]').value = recipe.description || '';

        // Update character counter
        const descriptionInput = document.getElementById('description-input');
        const charCount = document.getElementById('description-char-count');
        if (descriptionInput && charCount) {
            const length = descriptionInput.value.length;
            charCount.textContent = `(${length}/500)`;
        }

        // Handle time range - check if stored in dietary_tags or use single value
        form.querySelector('[name="cooking_time"]').value = recipe.cooking_time || '';
        form.querySelector('[name="servings"]').value = recipe.servings || '';

        form.querySelector('[name="difficulty"]').value = recipe.difficulty || 'Medium';
        form.querySelector('[name="instructions"]').value = recipe.instructions || '';

        // Handle ingredients (array to comma-separated string)
        let ingredientsStr = '';
        if (recipe.ingredients) {
            if (Array.isArray(recipe.ingredients)) {
                ingredientsStr = recipe.ingredients.join(', ');
            } else {
                ingredientsStr = recipe.ingredients;
            }
        }
        form.querySelector('[name="ingredients"]').value = ingredientsStr;

        // Store recipe ID for update
        form.setAttribute('data-edit-recipe-id', recipeId);

        // Change form title and button text
        const section = document.getElementById('create');
        const heading = section.querySelector('h2');
        if (heading) heading.textContent = 'Edit Recipe';

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Recipe';

        // Show create section (this will add to history)
        showSection('create');
    } catch (err) {
        console.error('Error loading recipe for edit:', err);
        showToast('Error loading recipe for editing');
    }
}

// Delete recipe
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
        return;
    }

    if (!token) {
        showToast('Please login first');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            showToast('Recipe deleted successfully');
            // Reload recipes
            const myRecipesSection = document.getElementById('my-recipes');
            const browseSection = document.getElementById('browse');
            if (myRecipesSection && !myRecipesSection.classList.contains('hidden')) {
                loadMyRecipes();
            } else if (browseSection && !browseSection.classList.contains('hidden')) {
                loadRecipes();
            }
        } else {
            const data = await res.json();
            showToast(data.message || 'Error deleting recipe');
        }
    } catch (err) {
        console.error('Error deleting recipe:', err);
        showToast('Error deleting recipe');
    }
}

// Make functions globally accessible
window.editRecipe = editRecipe;
window.deleteRecipe = deleteRecipe;

// ============================================
// FAVORITES FUNCTIONALITY
// ============================================

// Toggle favorite status for a recipe
async function toggleFavorite(recipeId, event) {
    if (event) {
        event.stopPropagation(); // Prevent card click
    }

    if (!token) {
        showToast('Please login to save favorites');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/users/favorites/${recipeId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const data = await res.json();

            // Update UI - update ALL buttons with this recipe ID (fixes issue when same recipe appears in multiple sections)
            const heartBtns = document.querySelectorAll(`[data-favorite-id="${recipeId}"]`);
            heartBtns.forEach(heartBtn => {
                const icon = heartBtn.querySelector('i');
                if (data.message.includes('added')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    heartBtn.classList.add('favorited');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    heartBtn.classList.remove('favorited');
                }
            });

            // Reload favorites if on favorites page
            const favoritesSection = document.getElementById('favorites');
            if (favoritesSection && !favoritesSection.classList.contains('hidden')) {
                loadFavorites();
            }
        } else {
            const data = await res.json();
            alert(data.message || 'Error updating favorites');
        }
    } catch (err) {
        console.error('Error toggling favorite:', err);
        alert('Error updating favorites');
    }
}

// Load user's favorite recipes
async function loadFavorites() {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;

    if (!token) {
        grid.innerHTML = '<p>Please login to view your favorites.</p>';
        return;
    }

    grid.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const user = await res.json();
        const recipes = user.favoriteRecipes || [];

        if (!recipes || recipes.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No favorites yet. Start exploring recipes and save your favorites!</p>
                    <button class="btn btn-primary" data-section="browse" style="margin-top: 1rem;">Browse Recipes</button>
                </div>
            `;

            // Add click handler for browse button
            const browseBtn = grid.querySelector('[data-section="browse"]');
            if (browseBtn) {
                browseBtn.addEventListener('click', () => showSection('browse'));
            }
            return;
        }

        const currentUserId = currentUser ? currentUser.id : null;

        grid.innerHTML = recipes.map(recipe => {
            const isOwner = currentUserId && recipe.userId === currentUserId;
            return `
            <div class="recipe-card" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                <button class="favorite-btn favorited" data-favorite-id="${recipe.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="collection-add-btn" data-recipe-id="${recipe.id}" title="Add to collection">
                    <i class="far fa-bookmark"></i>
                </button>
                ${isOwner ? `
                <div class="recipe-kebab" data-recipe-id="${recipe.id}">
                    <button class="kebab-btn" data-recipe-id="${recipe.id}">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="kebab-menu" id="kebab-menu-fav-${recipe.id}">
                        <button class="kebab-item" data-action="edit" data-recipe-id="${recipe.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="kebab-item" data-action="delete" data-recipe-id="${recipe.id}" style="color: #ef4444;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                ` : ''}
                <h3>${recipe.title}</h3>
                <div class="recipe-meta">
                    <span><i class="far fa-clock"></i> ${recipe.cooking_time}m</span>
                    <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                </div>
                <p>${recipe.description ? recipe.description.substring(0, 100) + '...' : ''}</p>
                <div style="margin-top: 1rem;">
                    ${filterDietaryTags(recipe.dietary_tags).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <small>By ${recipe.author ? recipe.author.username : 'Unknown'}</small>
            </div>
        `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.recipe-card[data-recipe-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.recipe-kebab') && !e.target.closest('.favorite-btn') && !e.target.closest('.collection-add-btn')) {
                    const recipeId = card.getAttribute('data-recipe-id');
                    showRecipeDetails(recipeId);
                }
            });
        });

        setupKebabMenus(grid);

        // Add favorite button handlers
        grid.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-favorite-id'));
                toggleFavorite(recipeId, e);
            });
        });

        // Add collection button handlers
        grid.querySelectorAll('.collection-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = parseInt(btn.getAttribute('data-recipe-id'));
                showAddToCollectionModal(recipeId);
            });
        });
    } catch (err) {
        console.error('Error loading favorites:', err);
        grid.innerHTML = '<p>Error loading favorites.</p>';
    }
}

// ============================================
// COLLECTIONS FUNCTIONALITY
// ============================================

let currentRecipeForCollection = null; // Track which recipe is being added to collection

// Load user's collections
async function loadCollections() {
    const container = document.getElementById('collections-list');
    const detailView = document.getElementById('collection-detail');

    if (!container) return;

    if (!token) {
        container.innerHTML = '<p>Please login to view your collections.</p>';
        return;
    }

    // Hide detail view and show list
    if (detailView) detailView.classList.add('hidden');
    container.classList.remove('hidden');

    container.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`${API_URL}/collections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const collections = await res.json();

        if (!collections || collections.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No collections yet. Create your first collection to organize your favorite recipes!</p>
                    <button class="btn btn-primary create-collection-trigger" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Create Collection
                    </button>
                </div>
            `;

            // Add click handler (CSP fix)
            const createBtn = container.querySelector('.create-collection-trigger');
            if (createBtn) {
                createBtn.addEventListener('click', () => showModal('create-collection'));
            }
            return;
        }

        container.innerHTML = collections.map(collection => `
            <div class="collection-card" data-collection-id="${collection.id}">
                <div class="collection-header">
                    <h3><i class="fas fa-folder"></i> ${collection.name}</h3>
                    <span class="recipe-count">${collection.recipes ? collection.recipes.length : 0} recipes</span>
                </div>
                ${collection.description ? `<p>${collection.description}</p>` : ''}
                <div class="collection-actions">
                    <button class="btn btn-ghost btn-sm delete-collection-btn" data-collection-id="${collection.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners (CSP fix)
        container.querySelectorAll('.collection-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-collection-btn')) {
                    const id = card.getAttribute('data-collection-id');
                    showCollectionDetail(parseInt(id));
                }
            });
        });

        container.querySelectorAll('.delete-collection-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute('data-collection-id');
                deleteCollection(parseInt(id));
            });
        });

    } catch (err) {
        console.error('Error loading collections:', err);
        container.innerHTML = '<p>Error loading collections.</p>';
    }
}

// Show collection detail with recipes
async function showCollectionDetail(collectionId) {
    const listView = document.getElementById('collections-list');
    const detailView = document.getElementById('collection-detail');

    if (!detailView) return;

    // Hide list, show detail
    if (listView) listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    detailView.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`${API_URL}/collections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const collections = await res.json();
        const collection = collections.find(c => c.id === collectionId);

        if (!collection) {
            detailView.innerHTML = '<p>Collection not found.</p>';
            return;
        }

        const recipes = collection.recipes || [];

        detailView.innerHTML = `
            <div class="collection-detail-header">
                <button class="btn btn-ghost back-btn">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <div>
                    <h2>${collection.name}</h2>
                    ${collection.description ? `<p style="color: var(--text-muted); margin-top: 0.5rem;">${collection.description}</p>` : ''}
                </div>
                <button class="btn btn-danger delete-collection-detail-btn" data-collection-id="${collection.id}">
                    <i class="fas fa-trash"></i> Delete Collection
                </button>
            </div>
            <div class="recipe-grid" id="collection-recipes-grid">
                ${recipes.length === 0 ? `
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted); grid-column: 1 / -1;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p>No recipes in this collection yet.</p>
                        <button class="btn btn-primary browse-btn" data-section="browse" style="margin-top: 1rem;">Browse Recipes</button>
                    </div>
                ` : recipes.map(recipe => `
                    <div class="recipe-card" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                        <button class="collection-remove-btn" data-recipe-id="${recipe.id}" title="Remove from collection">
                            <i class="fas fa-times"></i>
                        </button>
                        <h3>${recipe.title}</h3>
                        <div class="recipe-meta">
                            <span><i class="far fa-clock"></i> ${recipe.cooking_time || 'N/A'}m</span>
                            <span><i class="fas fa-signal"></i> ${recipe.difficulty || 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners (CSP fix)
        const backBtn = detailView.querySelector('.back-btn');
        if (backBtn) backBtn.addEventListener('click', backToCollections);

        const deleteColBtn = detailView.querySelector('.delete-collection-detail-btn');
        if (deleteColBtn) {
            deleteColBtn.addEventListener('click', () => {
                const id = deleteColBtn.getAttribute('data-collection-id');
                deleteCollection(parseInt(id), true);
            });
        }

        // Add click handlers for recipe cards
        const recipeCards = detailView.querySelectorAll('.recipe-card[data-recipe-id]');
        recipeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.collection-remove-btn')) {
                    const recipeId = card.getAttribute('data-recipe-id');
                    showRecipeDetails(recipeId);
                }
            });
        });

        // Add remove handlers
        detailView.querySelectorAll('.collection-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.getAttribute('data-recipe-id');
                removeRecipeFromCollection(collectionId, recipeId);
            });
        });

        // Add click handler for browse button if present
        const browseBtn = detailView.querySelector('.browse-btn');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => showSection('browse'));
        }
    } catch (err) {
        console.error('Error loading collection detail:', err);
        detailView.innerHTML = '<p>Error loading collection.</p>';
    }
}

// Back to collections list
function backToCollections() {
    const listView = document.getElementById('collections-list');
    const detailView = document.getElementById('collection-detail');

    if (listView) listView.classList.remove('hidden');
    if (detailView) detailView.classList.add('hidden');
}

// Create new collection
async function createCollection(event) {
    if (event) event.preventDefault();

    if (!token) {
        showToast('Please login to create collections');
        return;
    }

    const nameInput = document.getElementById('collection-name');
    const descInput = document.getElementById('collection-description');

    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) {
        alert('Please enter a collection name');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });

        if (res.ok) {
            const collection = await res.json();

            // Clear form
            nameInput.value = '';
            descInput.value = '';

            // Close modal
            closeModal('create-collection');

            // If we're adding a recipe to this new collection
            if (currentRecipeForCollection) {
                await addRecipeToCollection(collection.id, currentRecipeForCollection);
                currentRecipeForCollection = null;
            }

            // Reload collections if on collections page
            const collectionsSection = document.getElementById('collections');
            if (collectionsSection && !collectionsSection.classList.contains('hidden')) {
                loadCollections();
            }

            alert('Collection created!');
        } else {
            const data = await res.json();
            alert(data.message || 'Error creating collection');
        }
    } catch (err) {
        console.error('Error creating collection:', err);
        alert('Error creating collection');
    }
}

// Delete collection
async function deleteCollection(collectionId, fromDetail = false) {
    if (!confirm('Are you sure you want to delete this collection?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/collections/${collectionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            if (fromDetail) {
                backToCollections();
            }
            loadCollections();
        } else {
            const data = await res.json();
            alert(data.message || 'Error deleting collection');
        }
    } catch (err) {
        console.error('Error deleting collection:', err);
        alert('Error deleting collection');
    }
}

// Show add to collection modal
function showAddToCollectionModal(recipeId) {
    currentRecipeForCollection = recipeId;
    loadCollectionsForModal();
    showModal('add-to-collection');
}

// Load collections in the "Add to Collection" modal
async function loadCollectionsForModal() {
    const container = document.getElementById('collection-list-container');
    if (!container) return;

    container.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch(`${API_URL}/collections`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const collections = await res.json();

        if (!collections || collections.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No collections yet. Create one below!</p>';
            return;
        }

        container.innerHTML = collections.map(collection => `
            <div class="collection-list-item" data-collection-id="${collection.id}">
                <i class="fas fa-folder"></i>
                <span>${collection.name}</span>
                <i class="fas fa-plus" style="margin-left: auto; opacity: 0.5;"></i>
            </div>
        `).join('');

        // Add click handlers (CSP fix)
        container.querySelectorAll('.collection-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-collection-id');
                addRecipeToCollection(parseInt(id), currentRecipeForCollection);
            });
        });

    } catch (err) {
        console.error('Error loading collections:', err);
        container.innerHTML = '<p>Error loading collections.</p>';
    }
}

// Add recipe to collection
async function addRecipeToCollection(collectionId, recipeId) {
    try {
        const res = await fetch(`${API_URL}/collections/${collectionId}/recipes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ recipeId })
        });

        if (res.ok) {
            closeModal('add-to-collection');
            currentRecipeForCollection = null;
            alert('Recipe added to collection!');
        } else {
            const data = await res.json();
            alert(data.message || 'Error adding recipe to collection');
        }
    } catch (err) {
        console.error('Error adding recipe to collection:', err);
        alert('Error adding recipe to collection');
    }
}

// Remove recipe from collection
async function removeRecipeFromCollection(collectionId, recipeId) {
    if (!confirm('Remove this recipe from the collection?')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/collections/${collectionId}/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            // Reload collection detail
            showCollectionDetail(collectionId);
        } else {
            const data = await res.json();
            alert(data.message || 'Error removing recipe');
        }
    } catch (err) {
        console.error('Error removing recipe:', err);
        alert('Error removing recipe');
    }
}

// Admin API Functions
async function loadAdminUsers() {
    const tbody = document.getElementById('admin-users-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch users');

        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="tag">${user.role}</span></td>
                <td>
                    ${user.role !== 'admin' ? `
                    <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');

        // Add event listeners for delete buttons
        tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                deleteUser(userId);
            });
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5">Error loading users</td></tr>';
    }
}



async function loadAdminRecipes() {
    const tbody = document.getElementById('admin-recipes-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/recipes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch recipes');

        const recipes = await res.json();

        if (recipes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No recipes found</td></tr>';
            return;
        }

        tbody.innerHTML = recipes.map(recipe => `
            <tr>
                <td>${recipe.id}</td>
                <td>${recipe.title}</td>
                <td>${recipe.author ? recipe.author.username : 'Unknown'}</td>
                <td>${new Date(recipe.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-recipe-btn" data-recipe-id="${recipe.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for delete buttons
        tbody.querySelectorAll('.delete-recipe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recipeId = btn.getAttribute('data-recipe-id');
                deleteAdminRecipe(recipeId);
            });
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5">Error loading recipes</td></tr>';
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
        const res = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            loadAdminUsers();
        } else {
            alert('Failed to delete user');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting user');
    }
}

async function deleteAdminRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            loadAdminRecipes();
        } else {
            alert('Failed to delete recipe');
        }
    } catch (err) {
        console.error(err);
        showToast('Error deleting recipe');
    }
}

async function loadAdminReviews() {
    const tbody = document.getElementById('admin-reviews-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch reviews');

        const reviews = await res.json();

        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No reviews found</td></tr>';
            return;
        }

        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td>${review.id}</td>
                <td>${review.recipe ? review.recipe.title : 'Unknown'}</td>
                <td>${review.reviewer ? review.reviewer.username : 'Unknown'}</td>
                <td>
                     <span style="color: gold;">
                        ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                        ${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
                    </span>
                </td>
                <td>${review.comment || ''}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-review-btn" data-review-id="${review.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for delete buttons
        tbody.querySelectorAll('.delete-review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reviewId = btn.getAttribute('data-review-id');
                deleteAdminReview(reviewId);
            });
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="6">Error loading reviews</td></tr>';
    }
}

async function deleteAdminReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            loadAdminReviews();
        } else {
            alert('Failed to delete review');
        }
    } catch (err) {
        console.error(err);
        alert('Error deleting review');
    }
}

// Global functions
// window.deleteUser = deleteUser;
// window.deleteAdminRecipe = deleteAdminRecipe;

// Profile Functions
async function loadProfile() {
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileBio = document.getElementById('profile-bio');
    const profileAvatar = document.getElementById('profile-avatar-display');

    if (!profileUsername) return;

    profileUsername.textContent = 'Loading...';

    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const user = await res.json();

        profileUsername.textContent = user.username;
        profileEmail.textContent = user.email;
        profileBio.textContent = user.bio || 'No bio yet.';

        if (user.avatar_url) {
            profileAvatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        // Pre-fill edit form
        const editUsername = document.getElementById('edit-username');
        const editEmail = document.getElementById('edit-email');
        const editBio = document.getElementById('edit-bio');
        const editAvatar = document.getElementById('edit-avatar');

        if (editUsername) editUsername.value = user.username;
        if (editEmail) editEmail.value = user.email;
        if (editBio) editBio.value = user.bio || '';
        if (editUsername) editUsername.value = user.username;
        if (editEmail) editEmail.value = user.email;
        if (editBio) editBio.value = user.bio || '';
        if (editAvatar) editAvatar.value = user.avatar_url || '';

        // Load user's recipes
        loadMyRecipes();

    } catch (err) {
        console.error(err);
        profileUsername.textContent = 'Error loading profile';
    }
}

async function loadPublicProfile(userId) {
    const section = document.getElementById('public-profile');
    const profileUsername = document.getElementById('public-username');
    const profileJoined = document.getElementById('public-joined');
    const profileBio = document.getElementById('public-bio');
    const profileAvatar = document.getElementById('public-avatar-display');
    const grid = document.getElementById('public-recipes-grid');

    if (!section) return;

    // Check if viewing own profile
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const currentUser = JSON.parse(userStr);
        if (currentUser.id == userId) {
            showSection('profile');
            loadProfile();
            return;
        }
    }

    // Show section
    showSection('public-profile');

    // Reset/Loading state
    profileUsername.textContent = 'Loading...';
    profileJoined.textContent = '';
    profileBio.textContent = '';
    profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
    grid.innerHTML = '<p>Loading recipes...</p>';

    try {
        const res = await fetch(`${API_URL}/users/${userId}/public`);
        if (!res.ok) throw new Error('Failed to load public profile');

        const user = await res.json();

        profileUsername.textContent = user.username;
        profileJoined.textContent = `Member since ${new Date(user.createdAt).toLocaleDateString()}`;
        profileBio.textContent = user.bio || 'No bio yet.';

        if (user.avatar_url) {
            profileAvatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }

        // Render recipes
        if (user.recipes && user.recipes.length > 0) {
            grid.innerHTML = user.recipes.map(recipe => `
                <div class="recipe-card" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                    <h3>${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span><i class="far fa-clock"></i> ${recipe.cooking_time}m</span>
                        <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
                    </div>
                     <div style="margin-top: 1rem;">
                         <img src="${recipe.image_url || ''}" onerror="this.style.display='none'" style="width:100%; height: 150px; object-fit:cover; border-radius: 8px; margin-bottom: 1rem;">
                    </div>
                    <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">Created ${new Date(recipe.createdAt).toLocaleDateString()}</small>
                </div>
            `).join('');

            // Add click handlers for recipe cards
            grid.querySelectorAll('.recipe-card').forEach(card => {
                card.addEventListener('click', () => {
                    const recipeId = card.getAttribute('data-recipe-id');
                    showRecipeDetails(recipeId);
                });
            });
        } else {
            grid.innerHTML = '<p>No public recipes found.</p>';
        }

    } catch (err) {
        console.error(err);
        profileUsername.textContent = 'Error loading user profile';
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Remove password if empty
    if (!data.password) {
        delete data.password;
    }

    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            // Update local storage
            localStorage.setItem('user', JSON.stringify({
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: currentUser.role // Keep role
            }));
            // Check auth to update UI welcome message
            checkAuth();

            alert('Profile updated successfully!');

            // Hide form and reload profile
            document.getElementById('edit-profile-form-container').classList.add('hidden');
            document.querySelector('.profile-card').classList.remove('hidden');
            loadProfile();
        } else {
            const errData = await res.json();
            alert(errData.message || 'Failed to update profile');
        }
    } catch (err) {
        console.error(err);
        alert('Error updating profile');
    }
}

// Event Listeners for Profile
document.addEventListener('DOMContentLoaded', () => {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editProfileContainer = document.getElementById('edit-profile-form-container');
    const profileCard = document.querySelector('.profile-card');

    if (editProfileBtn && editProfileContainer && profileCard) {
        editProfileBtn.addEventListener('click', () => {
            editProfileContainer.classList.remove('hidden');
            profileCard.classList.add('hidden');
        });
    }

    if (cancelEditProfileBtn && editProfileContainer && profileCard) {
        cancelEditProfileBtn.addEventListener('click', () => {
            editProfileContainer.classList.add('hidden');
            profileCard.classList.remove('hidden');
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            handleUpdateProfile(e);
        });
    }
});

// Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Make globally accessible
window.showToast = showToast;
