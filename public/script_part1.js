const API_URL = 'http://localhost:3000/api';
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
    } else if (sectionId === 'my-recipes') {
        loadMyRecipes();
    } else if (sectionId === 'favorites') {
        loadFavorites();
    } else if (sectionId === 'collections') {
        loadCollections();
    } else if (sectionId === 'feed') {
        loadFeed();
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
        if (['home', 'browse', 'my-recipes', 'favorites', 'collections', 'create', 'feed'].includes(sectionId)) {
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
            alert(data.message);
        }
    } catch (err) {
        alert('Error registering');
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
            alert(data.message);
        }
    } catch (err) {
        alert('Error logging in');
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

function checkAuth() {
    const userStr = localStorage.getItem('user');
    const unauthControls = document.getElementById('unauth-controls');
    const authControls = document.getElementById('auth-controls');
    const welcomeMsg = document.getElementById('welcome-msg');
    const createLink = document.getElementById('createLink');
    const myRecipesLink = document.getElementById('myRecipesLink');
    const favoritesLink = document.getElementById('favoritesLink');
    const collectionsLink = document.getElementById('collectionsLink');
    const feedLink = document.getElementById('feedLink');

    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
            if (unauthControls) unauthControls.classList.add('hidden');
            if (authControls) authControls.classList.remove('hidden');
            if (welcomeMsg && currentUser.username) {
                welcomeMsg.textContent = `Hi, ${currentUser.username}`;
            }
            if (createLink) createLink.classList.remove('hidden');
            if (myRecipesLink) myRecipesLink.classList.remove('hidden');
            if (favoritesLink) favoritesLink.classList.remove('hidden');
            if (collectionsLink) collectionsLink.classList.remove('hidden');
            if (feedLink) feedLink.classList.remove('hidden');
        } catch (err) {
            console.error('Error parsing user data:', err);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    } else {
        if (unauthControls) unauthControls.classList.remove('hidden');
        if (authControls) authControls.classList.add('hidden');
        if (createLink) createLink.classList.add('hidden');
        if (myRecipesLink) myRecipesLink.classList.add('hidden');
        if (favoritesLink) favoritesLink.classList.add('hidden');
        if (collectionsLink) collectionsLink.classList.add('hidden');
        if (feedLink) feedLink.classList.add('hidden');
    }
}

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
            <div class="recipe-card" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
                ${currentUserId ? `
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-favorite-id="${recipe.id}">
                    <i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="collection-add-btn" data-recipe-id="${recipe.id}" title="Add to collection">
                    <i class="fas fa-plus"></i>
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
                <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">By ${recipe.author ? recipe.author.username : 'Unknown'}</small>
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
                <div class="recipe-card" data-recipe-id="${recipe.id}" style="cursor: pointer; position: relative;">
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
                    <i class="fas fa-plus"></i>
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
    if (!token) return alert('Please login first');

    const formData = new FormData(e.target);
    const ingredients = formData.get('ingredients').split(',').map(i => i.trim());
    const recipeId = e.target.getAttribute('data-edit-recipe-id');

    // Get time and servings ranges
    const timeMin = parseInt(formData.get('cooking_time_min'));
    const timeMax = parseInt(formData.get('cooking_time_max'));
    const servingsMin = parseInt(formData.get('servings_min'));
    const servingsMax = parseInt(formData.get('servings_max'));

    // Validate ranges
    if (timeMin > timeMax) {
        alert('Minimum cooking time cannot be greater than maximum time');
        return;
    }
    if (servingsMin > servingsMax) {
        alert('Minimum servings cannot be greater than maximum servings');
        return;
    }

    // Store as range string for display, but send average to backend for compatibility
    const cooking_time = Math.round((timeMin + timeMax) / 2); // Average for backend
    const servings = Math.round((servingsMin + servingsMax) / 2); // Average for backend

    // Store range info in dietary_tags as metadata (filtered out in display)
    const timeRange = timeMin === timeMax ? `${timeMin}` : `${timeMin}-${timeMax}`;
    const servingsRange = servingsMin === servingsMax ? `${servingsMin}` : `${servingsMin}-${servingsMax}`;

    // Get existing dietary_tags if editing, otherwise start fresh
    let dietary_tags = [];
    if (recipeId) {
        // When editing, we'll preserve existing real tags and update range metadata
        // For now, we'll just add the range metadata
    }
    dietary_tags.push(`__time_range:${timeRange}`);
    dietary_tags.push(`__servings_range:${servingsRange}`);

    const recipeData = {
        title: formData.get('title'),
        description: formData.get('description'),
        cooking_time: cooking_time,
        servings: servings,
        difficulty: formData.get('difficulty'),
        instructions: formData.get('instructions'),
        ingredients: ingredients,
        dietary_tags: dietary_tags
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
            alert(recipeId ? 'Recipe updated!' : 'Recipe created!');
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
                // Refresh my-recipes after a short delay to ensure section is shown
                setTimeout(() => {
                    const myRecipesSection = document.getElementById('my-recipes');
                    if (myRecipesSection && !myRecipesSection.classList.contains('hidden')) {
                        loadMyRecipes();
                    }
                }, 100);
            } else {
                showSection('my-recipes');
            }
        } else {
            const data = await res.json();
            alert(data.message || 'Error saving recipe');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving recipe');
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
                <span><i class="far fa-clock"></i> ${getTimeRange(recipe)} m</span>
                <span><i class="fas fa-users"></i> ${getServingsRange(recipe)}</span>
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
            alert('Please select a rating');
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
                alert(data.message || 'Error submitting review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Error submitting review');
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

// Helper function to get time range from recipe
function getTimeRange(recipe) {
    if (recipe.dietary_tags && Array.isArray(recipe.dietary_tags)) {
        const timeRangeTag = recipe.dietary_tags.find(tag => tag && tag.startsWith('__time_range:'));
        if (timeRangeTag) {
            return timeRangeTag.replace('__time_range:', '');
        }
    }
    return recipe.cooking_time || 'N/A';
}

// Helper function to get servings range from recipe
function getServingsRange(recipe) {
    if (recipe.dietary_tags && Array.isArray(recipe.dietary_tags)) {
        const servingsRangeTag = recipe.dietary_tags.find(tag => tag && tag.startsWith('__servings_range:'));
        if (servingsRangeTag) {
            return servingsRangeTag.replace('__servings_range:', '');
        }
    }
    return recipe.servings || 'N/A';
}

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
                    <i class="fas fa-plus"></i>
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
                <small style="color: var(--text-muted); margin-top: 0.5rem; display: block;">By ${recipe.author ? recipe.author.username : 'Unknown'} • ${new Date(recipe.createdAt).toLocaleDateString()}</small>
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

    } catch (err) {
        console.error('Error loading feed:', err);
        grid.innerHTML = '<p>Error loading feed.</p>';
    }
}

// Global function for toggle follow (called from HTML onclick)
async function toggleFollow(userId, btn) {
    if (!token) return alert('Please login to follow users');

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
            alert(data.message || 'Error updating follow status');
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
window.showRecipeDetails = showRecipeDetails;

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
        let timeMin = recipe.cooking_time || '';
        let timeMax = recipe.cooking_time || '';
        if (recipe.dietary_tags && Array.isArray(recipe.dietary_tags)) {
            const timeRangeTag = recipe.dietary_tags.find(tag => tag && typeof tag === 'string' && tag.startsWith('__time_range:'));
            if (timeRangeTag) {
                const range = timeRangeTag.replace('__time_range:', '');
                const parts = range.split('-');
                timeMin = parts[0] || recipe.cooking_time;
                timeMax = parts[1] || parts[0] || recipe.cooking_time;
            }
        }
        form.querySelector('[name="cooking_time_min"]').value = timeMin;
        form.querySelector('[name="cooking_time_max"]').value = timeMax;

        // Handle servings range
        let servingsMin = recipe.servings || '';
        let servingsMax = recipe.servings || '';
        if (recipe.dietary_tags && Array.isArray(recipe.dietary_tags)) {
            const servingsRangeTag = recipe.dietary_tags.find(tag => tag && typeof tag === 'string' && tag.startsWith('__servings_range:'));
            if (servingsRangeTag) {
                const range = servingsRangeTag.replace('__servings_range:', '');
                const parts = range.split('-');
                servingsMin = parts[0] || recipe.servings;
                servingsMax = parts[1] || parts[0] || recipe.servings;
            }
        }
        form.querySelector('[name="servings_min"]').value = servingsMin;
        form.querySelector('[name="servings_max"]').value = servingsMax;

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
        alert('Error loading recipe for editing');
    }
}

// Delete recipe
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
        return;
    }

    if (!token) {
        alert('Please login first');
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
            alert('Recipe deleted successfully');
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
            alert(data.message || 'Error deleting recipe');
        }
    } catch (err) {
        console.error('Error deleting recipe:', err);
        alert('Error deleting recipe');
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
        alert('Please login to save favorites');
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

            // Update UI
            const heartBtn = document.querySelector(`[data-favorite-id="${recipeId}"]`);
            if (heartBtn) {
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
            }

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
                    <i class="fas fa-plus"></i>
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

