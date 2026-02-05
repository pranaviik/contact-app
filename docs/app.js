// Mobile Contacts App - jQuery SPA
// Data is stored in localStorage under CONTACTS_KEY and RECENTS_KEY.

$(function () {
    const CONTACTS_KEY = 'contacts';
    const RECENTS_KEY = 'recents';

    /** @type {Array<{id:string,name:string,phone:string,email?:string,address?:string,notes?:string,birthday?:string,favorite?:boolean,emergency?:boolean}>} */
    let contacts = [];
    /** @type {Array<{id:string,number:string,contactId?:string,type:string,timestamp:number}>} */
    let recents = [];
    let currentContactId = null;
    let editingContactId = null;

    // Cache DOM
    const $screens = $('.screen');
    const $bottomNavItems = $('.bottom-nav-item');
    const $tabButtons = $('.tab-button');

    const $favoritesSection = $('#favoritesSection');
    const $favoritesList = $('#favoritesList');
    const $birthdaysSection = $('#birthdaysSection');
    const $birthdaysList = $('#birthdaysList');
    const $contactsList = $('#contactsList');
    const $emptyContacts = $('#emptyContacts');

    const $emergencySection = $('#emergencySection');
    const $emergencyContactsList = $('#emergencyContactsList');
    const $emptyEmergency = $('#emptyEmergency');

    const $recentsList = $('#recentsList');
    const $emptyRecents = $('#emptyRecents');

    const $searchInput = $('#searchInput');

    const $fabAdd = $('#fabAddContact');

    // Details screen elements
    const $detailsName = $('#detailsName');
    const $detailsTitle = $('#detailsTitle');
    const $detailsAvatar = $('#detailsAvatar');
    const $detailsPhone = $('#detailsPhone');
    const $detailsEmail = $('#detailsEmail');
    const $detailsAddress = $('#detailsAddress');
    const $detailsNotes = $('#detailsNotes');
    const $detailsBirthday = $('#detailsBirthday');
    const $detailsPhoneRow = $('#detailsPhoneRow');
    const $detailsEmailRow = $('#detailsEmailRow');
    const $detailsAddressRow = $('#detailsAddressRow');
    const $detailsNotesRow = $('#detailsNotesRow');
    const $detailsBirthdayRow = $('#detailsBirthdayRow');
    const $btnToggleFavorite = $('#btnToggleFavorite');
    const $btnToggleEmergency = $('#btnToggleEmergency');

    // Edit screen elements
    const $editTitle = $('#editTitle');
    const $editAvatar = $('#editAvatar');
    const $inputName = $('#inputName');
    const $inputPhone = $('#inputPhone');
    const $inputEmail = $('#inputEmail');
    const $inputAddress = $('#inputAddress');
    const $inputNotes = $('#inputNotes');
    const $inputBirthday = $('#inputBirthday');

    // Keypad
    const $keypadDisplay = $('#keypadDisplay');

    // --- Storage helpers ---
    function loadContacts() {
        try {
            const raw = localStorage.getItem(CONTACTS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    contacts = parsed;
                    return;
                }
            }
        } catch (e) {
            console.warn('Failed to load contacts', e);
        }

        // Seed with a few contacts on first load (for demo / Figma parity)
        contacts = [
            { id: uid(), name: 'Alice Johnson', phone: '+1 (555) 123-4567', email: 'alice.johnson@email.com', address: '123 Main St, New York, NY 10001', notes: 'Met at conference', favorite: true },
            { id: uid(), name: 'Bob Smith', phone: '+1 (555) 234-5678', favorite: false },
            { id: uid(), name: 'Carol Williams', phone: '+1 (555) 345-6789', favorite: true },
            { id: uid(), name: 'David Brown', phone: '+1 (555) 456-7890', favorite: false },
        ];
        saveContacts();
    }

    function saveContacts() {
        localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    }

    function loadRecents() {
        try {
            const raw = localStorage.getItem(RECENTS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    recents = parsed;
                    return;
                }
            }
        } catch (e) {
            console.warn('Failed to load recents', e);
        }
        recents = [];
    }

    function saveRecents() {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
    }

    // --- Utility ---
    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function firstInitial(name) {
        if (!name) return '?';
        return name.trim().charAt(0).toUpperCase();
    }

    function normalize(str) {
        return (str || '').toLowerCase();
    }

    function formatTimeAgo(timestamp) {
        const diffMs = Date.now() - timestamp;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin === 1) return '1 min ago';
        if (diffMin < 60) return diffMin + ' min ago';
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr === 1) return '1 hour ago';
        if (diffHr < 24) return diffHr + ' hours ago';
        if (diffHr < 48) return 'Yesterday';
        const diffDay = Math.floor(diffHr / 24);
        return diffDay + ' days ago';
    }

    // --- Birthday helpers ---
    function formatBirthday(birthday) {
        if (!birthday) return '';
        try {
            const date = new Date(birthday + 'T00:00:00');
            const options = { month: 'long', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        } catch (e) {
            return birthday;
        }
    }

    function getUpcomingBirthdays() {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return contacts
            .filter(c => c.birthday)
            .map(c => {
                const [year, month, day] = c.birthday.split('-').map(Number);
                const currentYear = today.getFullYear();
                
                // Calculate next birthday occurrence
                let nextBirthday = new Date(currentYear, month - 1, day);
                
                // If birthday already passed this year, use next year
                if (nextBirthday < today) {
                    nextBirthday = new Date(currentYear + 1, month - 1, day);
                }
                
                const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
                
                return {
                    contact: c,
                    nextBirthday,
                    daysUntil,
                    monthDay: `${month}-${day}`
                };
            })
            .filter(b => b.daysUntil >= 0 && b.daysUntil <= 30)
            .sort((a, b) => a.daysUntil - b.daysUntil);
    }

    function formatDaysUntilBirthday(days) {
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `In ${days} days`;
    }

    function findContactById(id) {
        return contacts.find(c => c.id === id) || null;
    }

    function findContactByNumber(number) {
        const clean = (number || '').replace(/\D/g, '');
        if (!clean) return null;
        return contacts.find(c => (c.phone || '').replace(/\D/g, '') === clean) || null;
    }

    // --- Navigation ---
    function showScreen(id) {
        $screens.removeClass('active');
        $('#' + id).addClass('active');
    }

    function setActiveBottomNav(screenId) {
        $bottomNavItems.each(function () {
            const $btn = $(this);
            $btn.toggleClass('active', $btn.data('screen') === screenId);
        });
    }

    $bottomNavItems.on('click', function () {
        const screenId = $(this).data('screen');
        if (!screenId) return;
        showScreen(screenId);
        setActiveBottomNav(screenId);
    });

    // Tab switching within contacts screen
    $tabButtons.on('click', function () {
        const tab = $(this).data('tab');
        if (tab === 'contacts-list') {
            $tabButtons.removeClass('active');
            $(this).addClass('active');
            $('#favoritesSection, #birthdaysSection, #allContactsSection').removeClass('hidden');
            $emergencySection.addClass('hidden');
        } else if (tab === 'emergency-list') {
            $tabButtons.removeClass('active');
            $(this).addClass('active');
            $('#favoritesSection, #birthdaysSection, #allContactsSection').addClass('hidden');
            $emergencySection.removeClass('hidden');
        }
    });

    // --- Rendering ---
    function renderContacts() {
        const q = normalize($searchInput.val());

        const filtered = contacts
            .slice()
            .sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));

        const favorites = filtered.filter(c => c.favorite);
        const nonFavorites = filtered.filter(c => !c.favorite);

        // Favorites list
        $favoritesList.empty();
        if (favorites.length) {
            $favoritesSection.removeClass('hidden');
            favorites.forEach(c => {
                const $row = buildContactRow(c, true);
                $favoritesList.append($row);
            });
        } else {
            $favoritesSection.addClass('hidden');
        }

        // Upcoming birthdays
        const upcomingBirthdays = getUpcomingBirthdays();
        $birthdaysList.empty();
        if (upcomingBirthdays.length) {
            $birthdaysSection.removeClass('hidden');
            upcomingBirthdays.forEach(b => {
                const $row = buildBirthdayRow(b);
                $birthdaysList.append($row);
            });
        } else {
            $birthdaysSection.addClass('hidden');
        }

        // All contacts with alphabetical headers
        $contactsList.empty();
        if (!nonFavorites.length && !favorites.length) {
            $emptyContacts.removeClass('hidden');
        } else {
            $emptyContacts.addClass('hidden');
            let currentLetter = null;
            filtered.forEach(c => {
                if (q && !matchesSearch(c, q)) return;
                const letter = firstInitial(c.name);
                if (letter !== currentLetter) {
                    currentLetter = letter;
                    const $sec = $('<div>').addClass('section-label').text(currentLetter);
                    $contactsList.append($sec);
                }
                const $row = buildContactRow(c, false);
                $contactsList.append($row);
            });
        }

        // Emergency list
        $emergencyContactsList.empty();
        const emerg = filtered.filter(c => c.emergency);
        if (emerg.length) {
            emerg.forEach(c => {
                const $row = buildContactRow(c, false, true);
                $emergencyContactsList.append($row);
            });
            $emptyEmergency.addClass('hidden');
        } else {
            $emptyEmergency.removeClass('hidden');
        }
    }

    function buildBirthdayRow(birthdayData) {
        const c = birthdayData.contact;
        const initial = firstInitial(c.name);
        
        const $row = $('<div>').addClass('contact-row');
        const $avatar = $('<div>')
            .addClass('avatar')
            .text(initial);
        
        const $text = $('<div>').addClass('contact-text');
        const $name = $('<div>').addClass('contact-name').text(c.name);
        const $meta = $('<div>')
            .addClass('contact-meta')
            .text(formatDaysUntilBirthday(birthdayData.daysUntil));
        $text.append($name, $meta);
        
        const $icon = $('<div>')
            .addClass('birthday-icon')
            .text('🎂');
        
        $row.append($avatar, $text, $icon);
        
        $row.on('click', function () {
            openDetails(c.id);
        });
        
        return $row;
    }

    function matchesSearch(contact, q) {
        if (!q) return true;
        const name = normalize(contact.name);
        const phone = normalize(contact.phone);
        const email = normalize(contact.email);
        return name.includes(q) || phone.includes(q) || email.includes(q);
    }

    function buildContactRow(contact, isFavoriteSection, isEmergencySection) {
        const $row = $('<div>')
            .addClass('contact-row')
            .attr('data-id', contact.id);

        const $avatar = $('<div>')
            .addClass('avatar')
            .toggleClass('emergency', !!contact.emergency)
            .text(firstInitial(contact.name));

        const $text = $('<div>').addClass('contact-text');
        $('<div>').addClass('contact-name').text(contact.name).appendTo($text);
        $('<div>').addClass('contact-meta').text(contact.phone || '').appendTo($text);

        const $star = $('<div>').addClass('favorite-star').html(contact.favorite ? '★' : '☆');
        if (contact.favorite) $star.addClass('active');

        $row.append($avatar, $text, $star);

        // Click row -> details
        $row.on('click', function (e) {
            if ($(e.target).is($star)) return;
            openDetails(contact.id);
        });

        // Toggle favorite
        $star.on('click', function (e) {
            e.stopPropagation();
            contact.favorite = !contact.favorite;
            saveContacts();
            renderContacts();
            if (currentContactId === contact.id) {
                // Update chips if viewing details
                syncDetailsFavoriteEmergency(contact);
            }
        });

        return $row;
    }

    function renderRecents() {
        $recentsList.empty();
        if (!recents.length) {
            $emptyRecents.removeClass('hidden');
            return;
        }
        $emptyRecents.addClass('hidden');

        // newest first
        const items = recents.slice().sort((a, b) => b.timestamp - a.timestamp);
        items.forEach(r => {
            const contact = r.contactId ? findContactById(r.contactId) : findContactByNumber(r.number);
            const isKnown = !!contact;
            const name = contact ? contact.name : r.number;
            const initials = isKnown ? firstInitial(contact.name) : '+(';

            const $item = $('<div>').addClass('recents-list-item');
            const $avatar = $('<div>')
                .addClass('recent-avatar')
                .addClass(isKnown ? 'known' : 'unknown')
                .text(initials);
            const $info = $('<div>').addClass('recent-info');
            const $name = $('<div>')
                .addClass('recent-name')
                .toggleClass('unknown', !isKnown)
                .text(name);
            const $number = $('<div>')
                .addClass('recent-number')
                .text(isKnown ? r.number : r.number);
            const $meta = $('<div>')
                .addClass('recent-meta')
                .text(formatTimeAgo(r.timestamp));

            $info.append($name, $number, $meta);
            const $icon = $('<div>').addClass('recent-call-icon').html('📞');

            $item.append($avatar, $info, $icon);

            // Tapping call icon re-adds to recents
            $icon.on('click', function () {
                logCall(r.number);
            });

            $recentsList.append($item);
        });
    }

    // --- Details screen ---
    function openDetails(contactId) {
        const contact = findContactById(contactId);
        if (!contact) return;
        currentContactId = contactId;

        $detailsName.text(contact.name || '');
        $detailsTitle.text(contact.name || 'Contact');
        $detailsAvatar.text(firstInitial(contact.name));

        setRowValue($detailsPhoneRow, $detailsPhone, contact.phone);
        setRowValue($detailsEmailRow, $detailsEmail, contact.email);
        setRowValue($detailsAddressRow, $detailsAddress, contact.address);
        setRowValue($detailsNotesRow, $detailsNotes, contact.notes);
        setRowValue($detailsBirthdayRow, $detailsBirthday, contact.birthday ? formatBirthday(contact.birthday) : '');

        syncDetailsFavoriteEmergency(contact);

        showScreen('screen-details');
    }

    function syncDetailsFavoriteEmergency(contact) {
        $btnToggleFavorite.toggleClass('active', !!contact.favorite);
        $btnToggleFavorite.find('.chip-icon').text(contact.favorite ? '★' : '☆');

        $btnToggleEmergency.toggleClass('active', !!contact.emergency);
    }

    function setRowValue($row, $valueEl, value) {
        if (value && value.trim()) {
            $valueEl.text(value);
            $row.show();
        } else {
            $row.hide();
        }
    }

    $('#btnBackFromDetails').on('click', function () {
        showScreen('screen-contacts');
        setActiveBottomNav('screen-contacts');
    });

    $('#btnEditFromDetails').on('click', function () {
        if (!currentContactId) return;
        const contact = findContactById(currentContactId);
        if (!contact) return;
        openEdit(contact);
    });

    $('#btnDeleteFromDetails').on('click', function () {
        if (!currentContactId) return;
        const contact = findContactById(currentContactId);
        if (!contact) return;
        if (!window.confirm(`Delete contact "${contact.name}"?`)) return;
        contacts = contacts.filter(c => c.id !== contact.id);
        saveContacts();
        currentContactId = null;
        renderContacts();
        showScreen('screen-contacts');
        setActiveBottomNav('screen-contacts');
    });

    $btnToggleFavorite.on('click', function () {
        if (!currentContactId) return;
        const contact = findContactById(currentContactId);
        if (!contact) return;
        contact.favorite = !contact.favorite;
        saveContacts();
        syncDetailsFavoriteEmergency(contact);
        renderContacts();
    });

    $btnToggleEmergency.on('click', function () {
        if (!currentContactId) return;
        const contact = findContactById(currentContactId);
        if (!contact) return;
        contact.emergency = !contact.emergency;
        saveContacts();
        syncDetailsFavoriteEmergency(contact);
        renderContacts();
    });

    // --- Add / Edit contact ---
    function resetEditForm() {
        editingContactId = null;
        $editTitle.text('New Contact');
        $editAvatar.text('?');
        $inputName.val('');
        $inputPhone.val('');
        $inputEmail.val('');
        $inputAddress.val('');
        $inputNotes.val('');
        $inputBirthday.val('');
    }

    function openEdit(contact) {
        if (contact) {
            editingContactId = contact.id;
            $editTitle.text('Edit Contact');
            $editAvatar.text(firstInitial(contact.name));
            $inputName.val(contact.name || '');
            $inputPhone.val(contact.phone || '');
            $inputEmail.val(contact.email || '');
            $inputAddress.val(contact.address || '');
            $inputNotes.val(contact.notes || '');
            $inputBirthday.val(contact.birthday || '');
        } else {
            resetEditForm();
        }
        showScreen('screen-edit');
    }

    $fabAdd.on('click', function () {
        resetEditForm();
        openEdit(null);
    });

    $('#btnCancelEdit').on('click', function () {
        if (currentContactId) {
            openDetails(currentContactId);
        } else {
            showScreen('screen-contacts');
            setActiveBottomNav('screen-contacts');
        }
    });

    $('#contactForm').on('input', '#inputName', function () {
        const name = $inputName.val();
        $editAvatar.text(firstInitial(name));
    });

    $('#btnSaveContact').on('click', function () {
        const name = $inputName.val().trim();
        const phone = $inputPhone.val().trim();

        if (!name || !phone) {
            alert('Name and phone are required.');
            return;
        }

        if (editingContactId) {
            const contact = findContactById(editingContactId);
            if (contact) {
                contact.name = name;
                contact.phone = phone;
                contact.email = $inputEmail.val().trim();
                contact.address = $inputAddress.val().trim();
                contact.notes = $inputNotes.val().trim();
                contact.birthday = $inputBirthday.val().trim();
            }
        } else {
            const newContact = {
                id: uid(),
                name,
                phone,
                email: $inputEmail.val().trim(),
                address: $inputAddress.val().trim(),
                notes: $inputNotes.val().trim(),
                birthday: $inputBirthday.val().trim(),
                favorite: false,
                emergency: false,
            };
            contacts.push(newContact);
            editingContactId = newContact.id;
        }

        saveContacts();
        renderContacts();

        // After saving, show details for this contact
        currentContactId = editingContactId;
        openDetails(currentContactId);
    });

    // --- Search ---
    $searchInput.on('input', function () {
        renderContacts();
    });

    // --- Keypad & recents ---
    $('.keypad-key').on('click', function () {
        const key = $(this).data('key');
        if (!key) return;
        $keypadDisplay.text($keypadDisplay.text() + key);
    });

    $('#btnBackspace').on('click', function () {
        const current = $keypadDisplay.text();
        $keypadDisplay.text(current.slice(0, -1));
    });

    function logCall(number) {
        const trimmed = (number || '').trim();
        if (!trimmed) return;
        const contact = findContactByNumber(trimmed);
        const entry = {
            id: uid(),
            number: trimmed,
            contactId: contact ? contact.id : undefined,
            type: 'outgoing',
            timestamp: Date.now(),
        };
        recents.push(entry);
        saveRecents();
        renderRecents();
    }

    $('#btnCallFromKeypad').on('click', function () {
        const number = $keypadDisplay.text();
        if (!number.trim()) return;
        logCall(number);
        $keypadDisplay.text('');
        window.location.href='tel'+number;
    });

    // --- Initial load ---
    loadContacts();
    loadRecents();
    renderContacts();
    renderRecents();

    // Ensure initial visible screen and nav state
    showScreen('screen-contacts');
    setActiveBottomNav('screen-contacts');

    // --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, (err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
});

