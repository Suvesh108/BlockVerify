// Admin-specific functionality
const AdminApp = {
    init() {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user || user.user_type !== 'Admin') {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = user;

        // Update sidebar info
        $('#user-name').text(user.name);
        $('#user-email').text(user.email);

        this.bindEvents();
    },

    bindEvents() {
        // Navigation
        $('#nav-dashboard').on('click', (e) => { e.preventDefault(); this.switchView('view-dashboard'); });
        $('#nav-users').on('click', (e) => {
            e.preventDefault();
            this.switchView('view-users');
            this.loadUsers();
        });

        $('#logout-btn').on('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });

        // Filter buttons
        $('#filter-all').on('click', () => this.filterUsers('all'));
        $('#filter-manufacturers').on('click', () => this.filterUsers('Manufacturer'));
        $('#filter-sellers').on('click', () => this.filterUsers('Seller'));

        // User Action Events (Delegation)
        $('body').on('click', '.btn-revoke', function () {
            const id = $(this).data('id');
            const type = $(this).data('type');
            AdminApp.revokeAccess(id, type);
        });

        $('body').on('click', '.btn-preserve', function () {
            const id = $(this).data('id');
            const type = $(this).data('type');
            AdminApp.preserveAccess(id, type);
        });

        $('body').on('click', '.btn-delete', function () {
            const id = $(this).data('id');
            const type = $(this).data('type');
            AdminApp.deleteUser(id, type);
        });
    },

    switchView(viewId) {
        $('.view-section').hide();
        $(`#${viewId}`).fadeIn(300);
        $('.nav-link').removeClass('active');

        const navMap = {
            'view-dashboard': 'nav-dashboard',
            'view-users': 'nav-users'
        };

        if (navMap[viewId]) {
            $(`#${navMap[viewId]}`).addClass('active');
        }
    },

    loadUsers() {
        console.log('Loading users...');
        const manufacturers = LocalStorageManager.getManufacturers();
        const sellers = LocalStorageManager.getSellers();
        this.allUsers = [...manufacturers, ...sellers];
        console.log('Found users:', this.allUsers);
        this.renderUsers(this.allUsers);
    },

    filterUsers(type) {
        $('.btn-group .btn').removeClass('btn-primary active').addClass('btn-outline-primary');

        if (type === 'all') {
            $('#filter-all').removeClass('btn-outline-primary').addClass('btn-primary active');
            this.renderUsers(this.allUsers);
        } else if (type === 'Manufacturer') {
            $('#filter-manufacturers').removeClass('btn-outline-primary').addClass('btn-primary active');
            this.renderUsers(this.allUsers.filter(u => u.user_type === 'Manufacturer'));
        } else if (type === 'Seller') {
            $('#filter-sellers').removeClass('btn-outline-primary').addClass('btn-primary active');
            this.renderUsers(this.allUsers.filter(u => u.user_type === 'Seller'));
        }
    },

    renderUsers(users) {
        const tbody = $('#users-table-body');
        tbody.empty();

        if (users.length === 0) {
            tbody.html('<tr><td colspan="7" class="text-center" style="padding: 2rem;">No users found.</td></tr>');
            return;
        }

        users.forEach(user => {
            const statusColor = user.status === 'Active' ? 'text-success' : 'text-danger';
            const actionBtn = user.status === 'Active'
                ? `<button class="btn btn-sm btn-outline-danger btn-revoke" data-id="${user.id}" data-type="${user.user_type}">Revoke</button>`
                : `<button class="btn btn-sm btn-outline-success btn-preserve" data-id="${user.id}" data-type="${user.user_type}">Preserve</button>`;

            const row = `
                <tr style="border-bottom: 1px solid var(--border-light);">
                    <td style="padding: 1rem;">${user.id}</td>
                    <td style="padding: 1rem;">${user.name}</td>
                    <td style="padding: 1rem;">${user.email}</td>
                    <td style="padding: 1rem;"><span class="badge">${user.user_type}</span></td>
                    <td style="padding: 1rem;"><span class="${statusColor}">${user.status}</span></td>
                    <td style="padding: 1rem;">${new Date(user.joined).toLocaleDateString()}</td>
                    <td style="padding: 1rem;">
                        <div style="display: flex; gap: 0.5rem;">
                            ${actionBtn}
                            <button class="btn btn-sm btn-danger btn-delete" data-id="${user.id}" data-type="${user.user_type}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    },

    revokeAccess(id, type) {
        console.log('Revoking access for:', id, type);
        if (!confirm('Are you sure you want to revoke access for this user? They will no longer be able to log in.')) return;
        this.updateUserStatus(id, type, 'Revoked');
    },

    preserveAccess(id, type) {
        console.log('Preserving access for:', id, type);
        if (!confirm('Are you sure you want to restore access for this user?')) return;
        this.updateUserStatus(id, type, 'Active');
    },

    updateUserStatus(id, type, status) {
        if (type === 'Manufacturer') {
            const manufacturers = LocalStorageManager.getManufacturers();
            const user = manufacturers.find(m => m.id === id);
            if (user) {
                user.status = status;
                LocalStorageManager.saveManufacturer(user);
            }
        } else if (type === 'Seller') {
            const sellers = LocalStorageManager.getSellers();
            const user = sellers.find(s => s.id === id);
            if (user) {
                user.status = status;
                LocalStorageManager.saveSeller(user);
            }
        }
        this.loadUsers(); // Refresh list
    },

    deleteUser(id, type) {
        console.log('Deleting user:', id, type);
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        if (type === 'Manufacturer') {
            LocalStorageManager.deleteManufacturer(id);
        } else if (type === 'Seller') {
            LocalStorageManager.deleteSeller(id);
        }
        this.loadUsers(); // Refresh list
    }
};

// Expose to window
window.AdminApp = AdminApp;

// Initialize app
$(window).on('load', function () {
    AdminApp.init();
});
