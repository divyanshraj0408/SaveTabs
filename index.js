// Data structure
let data = {
    folders: [],
    uncategorizedLinks: []
};

// DOM elements
const inputBtn = document.getElementById("input-btn");
const inputEl = document.getElementById("input-el");
const deleteBtn = document.getElementById("delete-btn");
const tabBtn = document.getElementById("tab-btn");
const addFolderBtn = document.getElementById("add-folder-btn");
const foldersContainer = document.getElementById("folders-container");
const uncategorizedLinks = document.getElementById("uncategorized-links");
const uncategorizedSection = document.getElementById("uncategorized-section");
const emptyState = document.getElementById("empty-state");

// Load data from localStorage (using in-memory storage for Claude.ai)
function loadData() {
    const saved = JSON.parse(localStorage.getItem("tabsData") || '{"folders":[],"uncategorizedLinks":[]}');
    data = saved;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem("tabsData", JSON.stringify(data));
}

// Generate unique ID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Extract domain from URL for title
function getTitleFromUrl(url) {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
        const domain = urlObj.hostname.replace('www.', '');
        return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
        return url;
    }
}

// Validate URL
function validateUrl(url) {
    try {
        const urlToTest = url.startsWith('http') ? url : 'https://' + url;
        new URL(urlToTest);
        return urlToTest;
    } catch {
        return null;
    }
}

// Create folder element
function createFolderElement(folder) {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder';
    folderDiv.dataset.folderId = folder.id;

    folderDiv.innerHTML = `
        <div class="folder-head">
            <div class="folder-info">
                <i class="fas fa-chevron-right folder-icon" id="icon-${folder.id}"></i>
                <input class="folder-name" id="name-${folder.id}" value="${folder.name}" readonly>
                <span class="folder-count">${folder.links.length}</span>
            </div>
            <div class="folder-actions">
                <button class="folder-action rename" title="Rename folder">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="folder-action delete" title="Delete folder">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="folder-content" id="content-${folder.id}">
            <div class="folder-links" id="links-${folder.id}">
                ${folder.links.map(link => createLinkElement(link, folder.id).outerHTML).join('')}
            </div>
            <div class="drop-zone" data-folder-id="${folder.id}">
                <i class="fas fa-arrow-down"></i>
                <span>Drop links here</span>
            </div>
        </div>
    `;

    // Event listeners
    const head = folderDiv.querySelector('.folder-head');
    head.addEventListener('click', (e) => {
        // Don't toggle if clicking on actions
        if (!e.target.closest('.folder-actions')) {
            toggleFolder(folder.id);
        }
    });

    const renameBtn = folderDiv.querySelector('.folder-action.rename');
    renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editFolder(folder.id);
    });

    const deleteBtn = folderDiv.querySelector('.folder-action.delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFolder(folder.id);
    });

    // Drag and drop on folder content
    const folderContent = folderDiv.querySelector('.folder-content');
    folderContent.addEventListener('dragover', allowDrop);
    folderContent.addEventListener('drop', (e) => dropLink(e, folder.id));
    folderContent.addEventListener('dragleave', handleDragLeave);

    // Re-attach event listeners to links
    const links = folderDiv.querySelectorAll('.link-item');
    links.forEach(linkEl => {
        const linkId = linkEl.dataset.linkId;
        linkEl.addEventListener('dragstart', dragStart);
        linkEl.addEventListener('dragend', dragEnd);
        
        const deleteBtn = linkEl.querySelector('.link-action.delete');
        deleteBtn.addEventListener('click', () => deleteLink(linkId, folder.id));
    });

    return folderDiv;
}

// Create link HTML
function createLinkElement(link, folderId = null) {
    const div = document.createElement('div');
    div.className = 'link-item';
    div.draggable = true;
    div.dataset.linkId = link.id;
    div.dataset.folderId = folderId || 'uncategorized';

    div.innerHTML = `
        <i class="fas fa-grip-vertical drag-handle"></i>
        <i class="fas fa-link link-icon"></i>
        <a href="${link.url}" target="_blank" class="link-text" title="${link.url}">
            ${link.title}
        </a>
        <div class="link-actions">
            <button class="link-action delete" title="Delete link">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    div.addEventListener('dragstart', dragStart);
    div.addEventListener('dragend', dragEnd);

    const deleteBtn = div.querySelector('.link-action.delete');
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteLink(link.id, folderId);
    });

    return div;
}

// Toggle folder expansion
function toggleFolder(folderId) {
    const content = document.getElementById(`content-${folderId}`);
    const icon = document.getElementById(`icon-${folderId}`);

    if (content && icon) {
        content.classList.toggle('expanded');
        icon.classList.toggle('expanded');
    }
}

// Add new folder
function addFolder() {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    const newFolder = {
        id: generateId(),
        name: folderName.trim(),
        links: []
    };

    data.folders.push(newFolder);
    saveData();
    renderFolders();
    
    // Auto-expand the new folder
    setTimeout(() => toggleFolder(newFolder.id), 100);
}

// Edit folder name
function editFolder(folderId) {
    const nameInput = document.getElementById(`name-${folderId}`);
    if (!nameInput) return;
    
    const originalName = nameInput.value;

    nameInput.readOnly = false;
    nameInput.focus();
    nameInput.select();
    nameInput.classList.add('editing');

    const saveEdit = () => {
        const newName = nameInput.value.trim();
        if (newName && newName !== originalName) {
            const folder = data.folders.find(f => f.id === folderId);
            if (folder) {
                folder.name = newName;
                saveData();
            }
        } else {
            nameInput.value = originalName;
        }
        nameInput.readOnly = true;
        nameInput.classList.remove('editing');
    };

    nameInput.addEventListener('blur', saveEdit, { once: true });
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameInput.blur();
        } else if (e.key === 'Escape') {
            nameInput.value = originalName;
            nameInput.blur();
        }
    }, { once: true });
}

// Delete folder
function deleteFolder(folderId) {
    const folder = data.folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const message = folder.links.length > 0 
        ? `Delete "${folder.name}" and move ${folder.links.length} link(s) to uncategorized?`
        : `Delete "${folder.name}"?`;
    
    if (!confirm(message)) return;

    const folderIndex = data.folders.findIndex(f => f.id === folderId);
    if (folderIndex === -1) return;

    data.uncategorizedLinks.push(...folder.links);
    data.folders.splice(folderIndex, 1);

    saveData();
    render();
}

// Add link
function addLink() {
    const url = inputEl.value.trim();
    if (!url) return;

    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
        alert('Please enter a valid URL');
        return;
    }

    const newLink = {
        id: generateId(),
        url: validatedUrl,
        title: getTitleFromUrl(validatedUrl)
    };

    data.uncategorizedLinks.push(newLink);
    inputEl.value = '';
    saveData();
    render();
    
    // Show success feedback
    inputEl.placeholder = 'Link added! Enter another URL...';
    setTimeout(() => {
        inputEl.placeholder = 'Enter URL or paste link';
    }, 2000);
}

// Save current tab (simulated for demo - works in Chrome extension)
function saveCurrentTab() {
    // Check if Chrome API is available
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs && tabs[0]) {
                const newLink = {
                    id: generateId(),
                    url: tabs[0].url,
                    title: tabs[0].title || getTitleFromUrl(tabs[0].url)
                };
                data.uncategorizedLinks.push(newLink);
                saveData();
                render();
            }
        });
    } else {
        // Demo mode - use current page URL
        alert('This feature requires the Chrome extension. In demo mode, add links manually.');
    }
}

// Delete link
function deleteLink(linkId, folderId) {
    if (folderId && folderId !== 'null' && folderId !== 'uncategorized') {
        const folder = data.folders.find(f => f.id === folderId);
        if (folder) {
            folder.links = folder.links.filter(l => l.id !== linkId);
        }
    } else {
        data.uncategorizedLinks = data.uncategorizedLinks.filter(l => l.id !== linkId);
    }

    saveData();
    render();
}

// Delete all data
function deleteAll() {
    const totalLinks = data.uncategorizedLinks.length + 
        data.folders.reduce((sum, f) => sum + f.links.length, 0);
    
    if (totalLinks === 0) {
        alert('Nothing to delete!');
        return;
    }
    
    if (!confirm(`Delete all ${data.folders.length} folders and ${totalLinks} links? This cannot be undone.`)) return;

    data = { folders: [], uncategorizedLinks: [] };
    saveData();
    render();
}

// Drag and drop functions
let draggedElement = null;
let draggedLinkId = null;
let draggedFromFolderId = null;

function dragStart(event) {
    draggedElement = event.currentTarget;
    draggedLinkId = draggedElement.dataset.linkId;
    draggedFromFolderId = draggedElement.dataset.folderId;
    
    event.currentTarget.classList.add('dragging');
    
    // Set drag image
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedLinkId);
    
    // Add visual feedback to all drop zones
    setTimeout(() => {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.add('active');
        });
        document.querySelectorAll('.folder-content').forEach(content => {
            content.classList.add('drag-active');
        });
        document.getElementById('uncategorized-links').classList.add('drag-active');
    }, 0);
}

function dragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    
    // Remove all drag visual feedback
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('active', 'drag-over');
    });
    document.querySelectorAll('.folder-content').forEach(content => {
        content.classList.remove('drag-active', 'drag-over');
    });
    document.querySelectorAll('.folder').forEach(folder => {
        folder.classList.remove('drag-over');
    });
    document.getElementById('uncategorized-links').classList.remove('drag-active', 'drag-over');
    
    draggedElement = null;
    draggedLinkId = null;
    draggedFromFolderId = null;
}

function allowDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropTarget = event.currentTarget;
    
    if (!dropTarget.classList.contains('drag-over')) {
        dropTarget.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const dropTarget = event.currentTarget;
    const rect = dropTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    // Only remove drag-over if we're actually leaving the element
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
        dropTarget.classList.remove('drag-over');
    }
}

function dropLink(event, targetFolderId) {
    event.preventDefault();
    event.stopPropagation();

    // Remove all drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });

    if (!draggedLinkId) return;

    // Find and remove link from current location
    let link = null;

    // Check uncategorized links
    const uncatIndex = data.uncategorizedLinks.findIndex(l => l.id === draggedLinkId);
    if (uncatIndex !== -1) {
        link = data.uncategorizedLinks[uncatIndex];
        data.uncategorizedLinks.splice(uncatIndex, 1);
    } else {
        // Check folders
        for (let folder of data.folders) {
            const linkIndex = folder.links.findIndex(l => l.id === draggedLinkId);
            if (linkIndex !== -1) {
                link = folder.links[linkIndex];
                folder.links.splice(linkIndex, 1);
                break;
            }
        }
    }

    if (!link) return;

    // Add to target location
    if (targetFolderId && targetFolderId !== 'null' && targetFolderId !== 'uncategorized') {
        const targetFolder = data.folders.find(f => f.id === targetFolderId);
        if (targetFolder) {
            targetFolder.links.push(link);
        }
    } else {
        // Add to uncategorized
        data.uncategorizedLinks.push(link);
    }

    saveData();
    render();
}

// Render functions
function renderFolders() {
    foldersContainer.innerHTML = '';
    
    if (data.folders.length === 0) {
        foldersContainer.innerHTML = `
            <div class="no-folders">
                <i class="fas fa-folder-plus"></i>
                <p>No folders yet. Click "Add Folder" to organize your links.</p>
            </div>
        `;
        return;
    }
    
    data.folders.forEach(folder => {
        foldersContainer.appendChild(createFolderElement(folder));
    });
}

function renderUncategorizedLinks() {
    uncategorizedLinks.innerHTML = '';

    if (data.uncategorizedLinks.length === 0) {
        uncategorizedLinks.innerHTML = `
            <div class="no-links">
                <i class="fas fa-inbox"></i>
                <p>No uncategorized links</p>
            </div>
        `;
    } else {
        data.uncategorizedLinks.forEach(link => {
            uncategorizedLinks.appendChild(createLinkElement(link, null));
        });
    }

    // Add drop zone for uncategorized section
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.dataset.folderId = 'uncategorized';
    dropZone.innerHTML = `
        <i class="fas fa-arrow-down"></i>
        <span>Drop links here</span>
    `;
    dropZone.addEventListener('dragover', allowDrop);
    dropZone.addEventListener('drop', (e) => dropLink(e, null));
    dropZone.addEventListener('dragleave', handleDragLeave);
    uncategorizedLinks.appendChild(dropZone);
}

function render() {
    renderFolders();
    renderUncategorizedLinks();

    const hasData = data.folders.length > 0 || data.uncategorizedLinks.length > 0;
    emptyState.style.display = hasData ? 'none' : 'flex';
    uncategorizedSection.style.display = hasData ? 'block' : 'none';
    
    // Update folder header visibility
    const folderSection = document.querySelector('.folder-section');
    if (folderSection) {
        folderSection.style.display = hasData ? 'block' : 'none';
    }
}

// Event listeners
inputBtn.addEventListener("click", addLink);
tabBtn.addEventListener("click", saveCurrentTab);
deleteBtn.addEventListener("click", deleteAll);
addFolderBtn.addEventListener("click", addFolder);

inputEl.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addLink();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputEl.focus();
        inputEl.select();
    }
});

// Initialize
loadData();
render();