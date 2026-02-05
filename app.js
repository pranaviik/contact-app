$(document).ready(function() {
    const STORAGE_KEY = 'contacts';
    const ACCESS_HISTORY_KEY = 'contactAccessHistory';
    const STARRED_KEY = 'starredContacts';
    const EMERGENCY_KEY = 'emergencyContacts';
    let editingId = null;
    let selectedLocationFilter = null;

    // Initialize the app
    loadContacts();
    displayFrequentlyAccessed();
    displayUpcomingBirthdays();
    displayEmergencyContacts();
    displayStarredContacts();
    displayLocationFilter();

    // Event Listeners
    $('#btnAdd').on('click', openAddModal);
    $('#contactForm').on('submit', saveContact);
    $('.btn-cancel').on('click', closeModal);
    $('.close').on('click', closeModal);
    $('#searchInput').on('keyup', filterContacts);
    $('#btnClearHistory').on('click', clearAccessHistory);
    $('#btnClearLocationFilter').on('click', clearLocationFilter);
    
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
        $('#profilePreview').attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ccircle cx="50" cy="36" r="18" fill="%23d0d0d0"/%3E%3Crect x="20" y="62" width="60" height="20" rx="10" fill="%23d0d0d0"/%3E%3C/svg%3E');
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
            $('#contactBirthday').val(contact.birthday || '');
            if (contact.picture) {
                $('#profilePreview').attr('src', contact.picture);
            } else {
                $('#profilePreview').attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ccircle cx="50" cy="36" r="18" fill="%23d0d0d0"/%3E%3Crect x="20" y="62" width="60" height="20" rx="10" fill="%23d0d0d0"/%3E%3C/svg%3E');
            }
            $('#contactModal').addClass('show');
        }
    }

    // Close Modal
    function closeModal() {
        $('#contactModal').removeClass('show');
        editingId = null;
        $('#contactForm')[0].reset();
        $('#profilePreview').attr('src', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ccircle cx="50" cy="36" r="18" fill="%23d0d0d0"/%3E%3Crect x="20" y="62" width="60" height="20" rx="10" fill="%23d0d0d0"/%3E%3C/svg%3E');
    }

    // Save Contact
    function saveContact(e) {
        e.preventDefault();

        const name = $('#contactName').val().trim();
        const phone = $('#contactPhone').val().trim();
        const phone2 = $('#contactPhone2').val().trim();
        const email = $('#contactEmail').val().trim();
        const location = $('#contactLocation').val().trim();
        const birthday = $('#contactBirthday').val();
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
                saveContactData(name, phone, phone2, email, location, birthday, pictureData, contacts);
            };
            reader.readAsDataURL(picture);
        } else if (editingId) {
            // Keep existing picture if editing
            const existingContact = contacts.find(c => c.id === editingId);
            pictureData = existingContact ? existingContact.picture : null;
            saveContactData(name, phone, phone2, email, location, birthday, pictureData, contacts);
        } else {
            saveContactData(name, phone, phone2, email, location, birthday, pictureData, contacts);
        }
    }

    function saveContactData(name, phone, phone2, email, location, birthday, picture, contacts) {
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
                    birthday: birthday,
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
                birthday: birthday,
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
                const profilePic = contact.picture ? `<img class="contact-avatar" src="${contact.picture}" alt="Profile">` : '<div class="contact-avatar-placeholder"></div>';
                let detailsHtml = `<div class="contact-phone">${escapeHtml(contact.phone)}</div>`;
                if (contact.phone2) {
                    detailsHtml += `<div class="contact-phone2">${escapeHtml(contact.phone2)}</div>`;
                }
                if (contact.email) {
                    detailsHtml += `<div class="contact-email">${escapeHtml(contact.email)}</div>`;
                }
                if (contact.location) {
                    detailsHtml += `<div class="contact-location">${escapeHtml(contact.location)}</div>`;
                }
                if (contact.birthday) {
                    detailsHtml += `<div class="contact-birthday">BD ${escapeHtml(contact.birthday)}</div>`;
                }
                
                const isStarred = isContactStarred(contact.id);
                const starClass = isStarred ? 'btn-star active' : 'btn-star';
                const starText = '...';
                
                const isEmergency = isContactEmergency(contact.id);
                const emergencyClass = isEmergency ? 'btn-emergency active' : 'btn-emergency';
                const emergencyText = '...';
                
                const displayName = isStarred ? ('★ ' + escapeHtml(contact.name)) : escapeHtml(contact.name);
                const contactHtml = `
                    <div class="contact-item">
                        <div class="contact-avatar-wrapper">
                            ${profilePic}
                        </div>
                        <div class="contact-info">
                            <div class="contact-name">${displayName}</div>
                            ${detailsHtml}
                        </div>
                        <div class="contact-actions">
                            <button class="${starClass}" data-id="${contact.id}" title="${isStarred ? 'Unstar' : 'Star'}">${starText}</button>
                            <button class="${emergencyClass}" data-id="${contact.id}" title="${isEmergency ? 'Remove emergency' : 'Mark as emergency'}">${emergencyText}</button>
                            <button class="btn-edit" data-id="${contact.id}" title="Edit">...</button>
                            <button class="btn-delete" data-id="${contact.id}" title="Delete">...</button>
                        </div>
                    </div>
                `;
                contactsList.append(contactHtml);
                
                // Star button listener
                contactsList.find('.btn-star[data-id="' + contact.id + '"]').on('click', function(e) {
                    e.preventDefault();
                    toggleStar(contact.id);
                });
                
                // Emergency button listener
                contactsList.find('.btn-emergency[data-id="' + contact.id + '"]').on('click', function(e) {
                    e.preventDefault();
                    toggleEmergency(contact.id);
                });
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

        let filteredContacts = contacts.filter(contact => {
            return contact.name.toLowerCase().includes(searchTerm) ||
                   contact.phone.toLowerCase().includes(searchTerm) ||
                   (contact.phone2 && contact.phone2.toLowerCase().includes(searchTerm)) ||
                   (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
                   (contact.location && contact.location.toLowerCase().includes(searchTerm)) ||
                   (contact.birthday && contact.birthday.toLowerCase().includes(searchTerm));
        });

        // Apply location filter if selected
        if (selectedLocationFilter) {
            filteredContacts = filteredContacts.filter(contact => 
                contact.location && contact.location.toLowerCase() === selectedLocationFilter.toLowerCase()
            );
        }

        displayContacts(filteredContacts);
    }

    // Display Location Filter
    function displayLocationFilter() {
        const contacts = getContactsFromStorage();
        const locations = {};
        
        // Count contacts by location
        contacts.forEach(contact => {
            if (contact.location && contact.location.trim()) {
                const loc = contact.location.trim();
                locations[loc] = (locations[loc] || 0) + 1;
            }
        });

        const locationFilterList = $('#locationFilterList');
        locationFilterList.empty();

        if (Object.keys(locations).length === 0) {
            $('#locationFilterContainer').hide();
            return;
        }

        // Sort locations alphabetically
        Object.keys(locations).sort().forEach(location => {
            const btn = $(`<button class="btn-location-filter" data-location="${location}">${location} (${locations[location]})</button>`);
            btn.on('click', function() {
                selectedLocationFilter = location;
                displayLocationFilter();
                filterContacts();
            });
            locationFilterList.append(btn);
        });

        $('#locationFilterContainer').show();
    }

    // Clear Location Filter
    function clearLocationFilter() {
        selectedLocationFilter = null;
        $('#searchInput').val('');
        displayLocationFilter();
        loadContacts();
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
        history[contactId] = new Date().toISOString();
        localStorage.setItem(ACCESS_HISTORY_KEY, JSON.stringify(history));
        displayFrequentlyAccessed();
    }

    // Display Frequently Accessed Contacts
    function displayFrequentlyAccessed() {
        const contacts = getContactsFromStorage();
        const history = JSON.parse(localStorage.getItem(ACCESS_HISTORY_KEY) || '{}');
        
        // Get contacts with access history, sorted by most recent
        const frequentContacts = contacts
            .filter(c => history[c.id])
            .map(c => ({...c, lastAccessed: history[c.id]}))
            .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
            .slice(0, 5); // Show top 5

        const container = $('#frequentlyAccessedContainer');
        const list = $('#frequentlyAccessedList');

        if (frequentContacts.length === 0) {
            container.hide();
            return;
        }

        list.empty();
        frequentContacts.forEach(contact => {
            const lastAccessDate = new Date(contact.lastAccessed);
            const formattedDate = lastAccessDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const html = `
                <div class="frequent-contact-item">
                    <div class="frequent-contact-info">
                        <div class="frequent-contact-name">${escapeHtml(contact.name)}</div>
                        <div class="frequent-contact-phone">${escapeHtml(contact.phone)}</div>
                    </div>
                    <div class="frequent-contact-meta">
                        <span class="last-accessed-badge">${formattedDate}</span>
                        <button class="btn-quick-edit" data-id="${contact.id}" title="Edit">...</button>
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

    // Starred Contacts Functions
    function toggleStar(contactId) {
        let starred = JSON.parse(localStorage.getItem(STARRED_KEY) || '[]');
        const index = starred.indexOf(contactId);
        
        if (index > -1) {
            starred.splice(index, 1);
        } else {
            starred.push(contactId);
        }
        
        localStorage.setItem(STARRED_KEY, JSON.stringify(starred));
        displayStarredContacts();
        loadContacts();
    }

    function isContactStarred(contactId) {
        const starred = JSON.parse(localStorage.getItem(STARRED_KEY) || '[]');
        return starred.includes(contactId);
    }

    function displayStarredContacts() {
        const contacts = getContactsFromStorage();
        const starred = JSON.parse(localStorage.getItem(STARRED_KEY) || '[]');
        
        const starredContacts = contacts.filter(c => starred.includes(c.id));
        const starredContainer = $('#starredContainer');
        const starredList = $('#starredList');
        
        starredList.empty();
        
        if (starredContacts.length === 0) {
            starredContainer.hide();
            return;
        }

        starredContacts.forEach(contact => {
            const profilePic = contact.picture ? `<img class="contact-avatar" src="${contact.picture}" alt="Profile">` : '<div class="contact-avatar-placeholder"></div>';
            let detailsHtml = `<div class="starred-phone">${escapeHtml(contact.phone)}</div>`;
            if (contact.email) {
                detailsHtml += `<div class="starred-email">${escapeHtml(contact.email)}</div>`;
            }

            const contactHtml = `
                <div class="starred-contact-item">
                    <div class="starred-avatar">
                        ${profilePic}
                    </div>
                    <div class="starred-info">
                        <div class="starred-name">${escapeHtml(contact.name)}</div>
                        ${detailsHtml}
                    </div>
                    <div class="starred-actions">
                        <button class="btn-unstar" data-id="${contact.id}" title="Unstar">...</button>
                        <button class="btn-edit" data-id="${contact.id}" title="Edit">...</button>
                    </div>
                </div>
            `;
            starredList.append(contactHtml);
        });

        // Attach listeners
        starredList.find('.btn-unstar').on('click', function() {
            toggleStar(parseInt($(this).data('id')));
        });

        starredList.find('.btn-edit').on('click', function() {
            openEditModal(parseInt($(this).data('id')));
        });

        starredContainer.show();
    }

    // Toggle Emergency Contact
    function toggleEmergency(contactId) {
        let emergency = JSON.parse(localStorage.getItem(EMERGENCY_KEY) || '[]');
        
        if (emergency.includes(contactId)) {
            emergency = emergency.filter(id => id !== contactId);
        } else {
            emergency.push(contactId);
        }
        
        localStorage.setItem(EMERGENCY_KEY, JSON.stringify(emergency));
        displayEmergencyContacts();
        loadContacts();
    }

    function isContactEmergency(contactId) {
        const emergency = JSON.parse(localStorage.getItem(EMERGENCY_KEY) || '[]');
        return emergency.includes(contactId);
    }

    function displayEmergencyContacts() {
        const contacts = getContactsFromStorage();
        const emergency = JSON.parse(localStorage.getItem(EMERGENCY_KEY) || '[]');
        
        const emergencyContacts = contacts.filter(c => emergency.includes(c.id));
        const emergencyContainer = $('#emergencyContainer');
        const emergencyList = $('#emergencyList');
        
        emergencyList.empty();
        
        if (emergencyContacts.length === 0) {
            emergencyContainer.hide();
            return;
        }

        emergencyContacts.forEach(contact => {
            const profilePic = contact.picture ? `<img class="contact-avatar" src="${contact.picture}" alt="Profile">` : '<div class="contact-avatar-placeholder"></div>';
            let detailsHtml = `<div class="emergency-phone">${escapeHtml(contact.phone)}</div>`;
            if (contact.phone2) {
                detailsHtml += `<div class="emergency-phone2">${escapeHtml(contact.phone2)}</div>`;
            }

            const contactHtml = `
                <div class="emergency-contact-item">
                    <div class="emergency-avatar">
                        ${profilePic}
                    </div>
                    <div class="emergency-info">
                        <div class="emergency-name">${escapeHtml(contact.name)}</div>
                        ${detailsHtml}
                    </div>
                    <div class="emergency-actions">
                        <button class="btn-remove-emergency" data-id="${contact.id}" title="Remove from emergency">...</button>
                        <button class="btn-edit" data-id="${contact.id}" title="Edit">...</button>
                    </div>
                </div>
            `;
            emergencyList.append(contactHtml);
        });

        // Attach listeners
        emergencyList.find('.btn-remove-emergency').on('click', function() {
            toggleEmergency(parseInt($(this).data('id')));
        });

        emergencyList.find('.btn-edit').on('click', function() {
            openEditModal(parseInt($(this).data('id')));
        });

        emergencyContainer.show();
    }


    // Display upcoming birthdays in next 5 days
    function displayUpcomingBirthdays() {
        try {
            const upcomingContainer = $('#upcomingBirthdaysContainer');
            const upcomingList = $('#upcomingBirthdaysList');
            upcomingList.empty();

            const contacts = getContactsFromStorage();
            if (!contacts || !Array.isArray(contacts)) {
                upcomingContainer.hide();
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingBirthdays = [];

            contacts.forEach(contact => {
                if (contact && contact.birthday) {
                    const [year, month, day] = contact.birthday.split('-');
                    if (year && month && day) {
                        // Check if birthday is in the current year
                        let nextBirthday = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
                        if (nextBirthday < today) {
                            // If birthday has passed this year, check next year
                            nextBirthday = new Date(today.getFullYear() + 1, parseInt(month) - 1, parseInt(day));
                        }

                        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

                        // Include birthdays within next 5 days
                        if (daysUntil >= 0 && daysUntil <= 5) {
                            upcomingBirthdays.push({
                                name: contact.name,
                                id: contact.id,
                                birthday: contact.birthday,
                                daysUntil: daysUntil
                            });
                        }
                    }
                }
            });

            if (upcomingBirthdays.length > 0) {
                // Sort by days until birthday
                upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

                upcomingBirthdays.forEach(bday => {
                    const daysText = bday.daysUntil === 0 ? 'Today!' : `in ${bday.daysUntil} day${bday.daysUntil === 1 ? '' : 's'}`;
                    const html = `
                        <div class="birthday-item">
                            <div class="birthday-info">
                                <div class="birthday-name">${escapeHtml(bday.name)}</div>
                                <div class="birthday-date">BD ${escapeHtml(bday.birthday)} - ${daysText}</div>
                            </div>
                            <button class="btn-edit-bday" data-id="${bday.id}" title="Edit">...</button>
                        </div>
                    `;
                    upcomingList.append(html);
                });

                // Add edit listener
                upcomingList.find('.btn-edit-bday').on('click', function() {
                    openEditModal(parseInt($(this).data('id')));
                });

                upcomingContainer.show();
            } else {
                upcomingContainer.hide();
            }
        } catch (error) {
            console.error('Error displaying upcoming birthdays:', error);
            $('#upcomingBirthdaysContainer').hide();
        }
    }

    // Close modal when clicking outside of it
    $(window).on('click', function(e) {
        const modal = $('#contactModal');
        if (e.target === modal[0]) {
            closeModal();
        }
    });
});
