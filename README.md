# Mobile Contacts App

A modern, responsive mobile web application for managing contacts with localStorage persistence.

## Features

✅ **Add Contacts** - Create new contacts with name, phone, and email
✅ **View Contacts** - Browse all contacts in an alphabetically organized scrollable list
✅ **Search Contacts** - Search contacts by name or phone number in real-time
✅ **Edit Contacts** - Modify existing contact information
✅ **Delete Contacts** - Remove contacts with confirmation
✅ **LocalStorage** - All contacts are saved locally in the browser
✅ **Responsive Design** - Works seamlessly on mobile devices and desktops

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations and gradients
- **jQuery** - JavaScript library for DOM manipulation
- **LocalStorage API** - Client-side data persistence

## File Structure

```
contact-app/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive design
├── app.js          # jQuery application logic
└── README.md       # Documentation
```

## Usage

### Opening the App
Simply open `index.html` in a web browser.

### Adding a Contact
1. Click the **"+ Add Contact"** button in the header
2. Fill in the contact details (Name, Phone, Email)
3. Click **"Save Contact"** to add the contact
4. The contact will be saved to localStorage and appear in the alphabetical list

### Viewing Contacts
- Contacts are displayed in an alphabetically organized scrollable list
- Each contact shows name, phone number, and email
- The list is grouped by the first letter of the contact's name

### Searching Contacts
- Use the search bar at the top to search by name or phone number
- The list filters in real-time as you type
- Clear the search to see all contacts again

### Editing a Contact
1. Find the contact you want to edit
2. Click the **"Edit"** button next to the contact
3. Modify the contact information in the modal
4. Click **"Save Contact"** to update

### Deleting a Contact
1. Find the contact you want to delete
2. Click the **"Delete"** button next to the contact
3. Confirm the deletion in the popup
4. The contact will be removed from the list and localStorage

## Features Details

### Alphabetical Organization
Contacts are automatically sorted alphabetically by name and grouped by their first letter for easy browsing.

### Real-time Search
The search functionality filters contacts dynamically as you type, searching both names and phone numbers.

### Data Persistence
All contacts are stored in the browser's localStorage, so your data persists even after closing and reopening the app.

### Responsive Design
The app is fully responsive and works great on:
- Mobile phones (iOS and Android)
- Tablets
- Desktop browsers

### Modern UI/UX
- Smooth animations and transitions
- Gradient header with purple theme
- Interactive buttons with hover effects
- Modal dialogs for adding/editing contacts
- Empty state message when no contacts exist

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Data Storage

All contacts are stored in the browser's localStorage under the key `contacts`. The data is stored as a JSON array of contact objects.

Example localStorage format:
```json
[
  {
    "id": 1234567890,
    "name": "John Doe",
    "phone": "+1-555-0123",
    "email": "john@example.com"
  }
]
```

## Notes

- Each contact has a unique timestamp-based ID for identification
- Email validation is performed on the client side
- All HTML content is escaped to prevent XSS attacks
- The app works offline once loaded, as all functionality uses localStorage

## Future Enhancements

Potential improvements could include:
- Contact profile pictures
- Contact groups/categories
- Export/import contacts
- Multiple phone numbers and emails per contact
- Contact favorites/starred contacts
- Contact backup and sync
- Dark mode theme
