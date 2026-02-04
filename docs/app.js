$(document).ready(function() {
    const STORAGE_KEY = 'contacts';
    let editingId = null;

    // Initialize the app
    loadContacts();

    // Event Listeners
    $('#btnAdd').on('click', openAddModal);
    $('#contactForm').on('submit', saveContact);
    $('.btn-cancel').on('click', closeModal);
    $('.close').on('click', closeModal);
    $('#searchInput').on('keyup', filterContacts);

    // Open Add Contact Modal
    function openAddModal() {
        editingId = null;
        $('#modalTitle').text('Add Contact');
        $('#contactForm')[0].reset();
        $('#contactModal').addClass('show');
    }

    // Open Edit Contact Modal
    function openEditModal(id) {
        const contacts = getContactsFromStorage();
        const contact = contacts.find(c => c.id === id);

        if (contact) {
            editingId = id;
            $('#modalTitle').text('Edit Contact');
            $('#contactName').val(contact.name);
            $('#contactPhone').val(contact.phone);
            $('#contactEmail').val(contact.email);
            $('#contactModal').addClass('show');
        }
    }

    // Close Modal
    function closeModal() {
        $('#contactModal').removeClass('show');
        editingId = null;
        $('#contactForm')[0].reset();
    }

    // Save Contact
    function saveContact(e) {
        e.preventDefault();

        const name = $('#contactName').val().trim();
        const phone = $('#contactPhone').val().trim();
        const email = $('#contactEmail').val().trim();

        if (!name || !phone || !email) {
            alert('Please fill in all fields');
            return;
        }

        let contacts = getContactsFromStorage();

        if (editingId) {
            // Update existing contact
            const index = contacts.findIndex(c => c.id === editingId);
            if (index !== -1) {
                contacts[index] = {
                    id: editingId,
                    name: name,
                    phone: phone,
                    email: email
                };
            }
        } else {
            // Add new contact
            const newContact = {
                id: Date.now(),
                name: name,
                phone: phone,
                email: email
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
                const contactHtml = `
                    <div class="contact-item">
                        <div class="contact-info">
                            <div class="contact-name">${escapeHtml(contact.name)}</div>
                            <div class="contact-phone">${escapeHtml(contact.phone)}</div>
                            <div class="contact-email">${escapeHtml(contact.email)}</div>
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
