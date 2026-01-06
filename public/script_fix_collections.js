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
        alert('Please login to create collections');
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
