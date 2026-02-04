$(document).ready(function() {
    const STORAGE_KEY = 'contacts';
    const ACCESS_HISTORY_KEY = 'contactAccessHistory';
    let editingId = null;

    // Initialize the app
    loadContacts();
    displayFrequentlyAccessed();

    // Event Listeners
    $('#btnAdd').on('click', openAddModal);
    $('#contactForm').on('submit', saveContact);
    $('.btn-cancel').on('click', closeModal);
    $('.close').on('click', closeModal);
    $('#searchInput').on('keyup', filterContacts);
    $('#btnClearHistory').on('click', clearAccessHistory);
    
    // Picture preview
    $('#contactPicture').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                $('#profilePreview').attr('src', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Open Add Contact Modal
    function openAddModal() {
        editingId = null;
        $('#modalTitle').text('Add Contact');
        $('#contactForm')[0].reset();
        $('#profilePreview').attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%234a4a4a" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23888" text-anchor="middle" dy=".3em"%3E👤%3C/text%3E%3C/svg%3E');
        $('#contactModal').addClass('show');
    }

    // Open Edit Contact Modal
    function openEditModal(id) {
        const contacts = getContactsFromStorage();
        const contact = contacts.find(c => c.id === id);

        if (contact) {
            editingId = id;
            recordContactAccess(id);
            $('#modalTitle').text('Edit Contact');
            $('#contactName').val(contact.name);
            $('#contactPhone').val(contact.phone);
            $('#contactPhone2').val(contact.phone2 || '');
            $('#contactEmail').val(contact.email || '');
            $('#contactLocation').val(contact.location || '');
            if (contact.picture) {
                $('#profilePreview').attr('src', contact.picture);
            } else {
                $('#profilePreview').attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%234a4a4a" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23888" text-anchor="middle" dy=".3em"%3E👤%3C/text%3E%3C/svg%3E');
            }
            $('#contactModal').addClass('show');
        }
    }

    // Close Modal
    function closeModal() {
        $('#contactModal').removeClass('show');
        editingId = null;
        $('#contactForm')[0].reset();
        $('#profilePreview').attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%234a4a4a" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="%23888" text-anchor="middle" dy=".3em"%3E👤%3C/text%3E%3C/svg%3E');
    }

    // Save Contact
    function saveContact(e) {
        e.preventDefault();

        const name = $('#contactName').val().trim();
        const phone = $('#contactPhone').val().trim();
        const phone2 = $('#contactPhone2').val().trim();
        const email = $('#contactEmail').val().trim();
        const location = $('#contactLocation').val().trim();
        const picture = $('#contactPicture')[0].files[0];

        if (!name || !phone) {
            alert('Name and Primary Phone are required');
            return;
        }

        let contacts = getContactsFromStorage();
        let pictureData = null;

        // Handle picture upload
        if (picture) {
            const reader = new FileReader();
            reader.onload = function(e) {
                pictureData = e.target.result;
                saveContactData(name, phone, phone2, email, location, pictureData, contacts);
            };
            reader.readAsDataURL(picture);
        } else if (editingId) {
            // Keep existing picture if editing
            const existingContact = contacts.find(c => c.id === editingId);
            pictureData = existingContact ? existingContact.picture : null;
            saveContactData(name, phone, phone2, email, location, pictureData, contacts);
        } else {
            saveContactData(name, phone, phone2, email, location, pictureData, contacts);
        }
    }

    function saveContactData(name, phone, phone2, email, location, picture, contacts) {
        if (editingId) {
            // Update existing contact
            const index = contacts.findIndex(c => c.id === editingId);
            if (index !== -1) {
                contacts[index] = {
                    id: editingId,
                    name: name,
                    phone: phone,
                    phone2: phone2,
                    email: email,
                    location: location,
                    picture: picture
                };
            }
        } else {
            // Add new contact
            const newContact = {
                id: Date.now(),
                name: name,
                phone: phone,
                phone2: phone2,
                email: email,
                location: location,
                picture: picture
            };
            contacts.push(newContact);
        }

        // Sort contacts alphabetically
        contacts.sort((a, b) => a.name.localeCompare(b.name));

        // Save to localStorage
        saveContactsToStorage(contacts);

        // Refresh the UI
        loadContacts();
        closeModal();
    }

    // Delete Contact
    function deleteContact(id) {
        if (confirm('Are you sure you want to delete this contact?')) {
            let contacts = getContactsFromStorage();
            contacts = contacts.filter(c => c.id !== id);
            saveContactsToStorage(contacts);
            loadContacts();
        }
    }

    // Load and Display Contacts
    function loadContacts() {
        const contacts = getContactsFromStorage();
        displayContacts(contacts);
    }

    // Display Contacts with Alphabetical Grouping
    function displayContacts(contacts) {
        const contactsList = $('#contactsList');
        contactsList.empty();

        if (contacts.length === 0) {
            contactsList.html('<p class="empty-state">No contacts yet. Add one to get started!</p>');
            return;
        }

        // Group contacts by first letter
        const groupedContacts = {};
        contacts.forEach(contact => {
            const firstLetter = contact.name.charAt(0).toUpperCase();
            if (!groupedContacts[firstLetter]) {
                groupedContacts[firstLetter] = [];
            }
            groupedContacts[firstLetter].push(contact);
        });

        // Display grouped contacts
        Object.keys(groupedContacts).sort().forEach(letter => {
            const html = `<div class="section-header">${letter}</div>`;
            contactsList.append(html);

            groupedContacts[letter].forEach(contact => {
                const profilePic = contact.picture ? `<img class="contact-avatar" src="${contact.picture}" alt="Profile">` : '<div class="contact-avatar-placeholder">👤</div>';
                let detailsHtml = `<div class="contact-phone">${escapeHtml(contact.phone)}</div>`;
                if (contact.phone2) {
                    detailsHtml += `<div class="contact-phone2">${escapeHtml(contact.phone2)}</div>`;
                }
                if (contact.email) {
                    detailsHtml += `<div class="contact-email">${escapeHtml(contact.email)}</div>`;
                }
                if (contact.location) {
                    detailsHtml += `<div class="contact-location">📍 ${escapeHtml(contact.location)}</div>`;
                }
                
                const contactHtml = `
                    <div class="contact-item">
                        <div class="contact-avatar-wrapper">
                            ${profilePic}
                        </div>
                        <div class="contact-info">
                            <div class="contact-name">${escapeHtml(contact.name)}</div>
                            ${detailsHtml}
                        </div>
                        <div class="contact-actions">
                            <button class="btn-edit" data-id="${contact.id}">Edit</button>
                            <button class="btn-delete" data-id="${contact.id}">Delete</button>
                        </div>
                    </div>
                `;
                contactsList.append(contactHtml);
            });
        });

        // Attach event listeners to Edit and Delete buttons
        $('.btn-edit').on('click', function() {
            openEditModal(parseInt($(this).data('id')));
        });

        $('.btn-delete').on('click', function() {
            deleteContact(parseInt($(this).data('id')));
        });
    }

    // Filter Contacts by Search
    function filterContacts() {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const contacts = getContactsFromStorage();

        const filteredContacts = contacts.filter(contact => {
            return contact.name.toLowerCase().includes(searchTerm) ||
                   contact.phone.toLowerCase().includes(searchTerm);
        });

        displayContacts(filteredContacts);
    }

    // LocalStorage Functions
    function getContactsFromStorage() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    function saveContactsToStorage(contacts) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    }

    // Track Contact Access
    function recordContactAccess(contactId) {
        let history = JSON.parse(localStorage.getItem(ACCESS_HISTORY_KEY) || '{}');
        history[contactId] = (history[contactId] || 0) + 1;
        localStorage.setItem(ACCESS_HISTORY_KEY, JSON.stringify(history));
        displayFrequentlyAccessed();
    }

    // Display Frequently Accessed Contacts
    function displayFrequentlyAccessed() {
        const contacts = getContactsFromStorage();
        const history = JSON.parse(localStorage.getItem(ACCESS_HISTORY_KEY) || '{}');
        
        // Get contacts with access count > 0, sorted by count
        const frequentContacts = contacts
            .filter(c => history[c.id] && history[c.id] > 0)
            .map(c => ({...c, accessCount: history[c.id]}))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 5); // Show top 5

        const container = $('#frequentlyAccessedContainer');
        const list = $('#frequentlyAccessedList');

        if (frequentContacts.length === 0) {
            container.hide();
            return;
        }

        list.empty();
        frequentContacts.forEach(contact => {
            const html = `
                <div class="frequent-contact-item">
                    <div class="frequent-contact-info">
                        <div class="frequent-contact-name">${escapeHtml(contact.name)}</div>
                        <div class="frequent-contact-phone">${escapeHtml(contact.phone)}</div>
                    </div>
                    <div class="frequent-contact-meta">
                        <span class="access-badge">${contact.accessCount}</span>
                        <button class="btn-quick-edit" data-id="${contact.id}">Edit</button>
                    </div>
                </div>
            `;
            list.append(html);
        });

        container.show();

        // Attach event listeners
        $('.btn-quick-edit').on('click', function() {
            openEditModal(parseInt($(this).data('id')));
        });
    }

    // Clear Access History
    function clearAccessHistory() {
        if (confirm('Clear frequently accessed history?')) {
            localStorage.removeItem(ACCESS_HISTORY_KEY);
            displayFrequentlyAccessed();
        }
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Close modal when clicking outside of it
    $(window).on('click', function(e) {
        const modal = $('#contactModal');
        if (e.target === modal[0]) {
            closeModal();
        }
    });
});
