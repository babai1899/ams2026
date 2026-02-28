// ================= SIDEBAR FUNCTIONS =================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
    
    // Load jobs when job-list-panel section is shown
    if (sectionId === 'job-list-panel') {
        loadJobsAdmin();
    }
    
    // Load staff when staff-accounts section is shown
    if (sectionId === 'staff-accounts') {
        loadStaff();
    }
    
    // Load notifications when activity-panel section is shown
    if (sectionId === 'activity-panel') {
        loadNotifications();
    }
    
    // Close sidebar on mobile after selecting a menu item
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
}

function toggleMenu(menuId, btn) {
    const menu = document.getElementById(menuId);
    
    // Get all menu containers (divs inside sidebar that contain menus)
    const allMenus = document.querySelectorAll('.sidebar > div');
    
    // Close all other menus (accordion behavior)
    allMenus.forEach(menuContainer => {
        const menuDiv = menuContainer.querySelector('div[id]');
        if (menuDiv && menuDiv.id !== menuId && menuDiv.classList.contains('open')) {
            // Close this menu
            menuDiv.classList.remove('open');
            
            // Reset arrow rotation for the corresponding button
            const button = menuContainer.querySelector('button');
            if (button) {
                const arrow = button.querySelector('.arrow');
                if (arrow) {
                    arrow.style.transform = 'rotate(0deg)';
                }
            }
        }
    });
    
    // Toggle the 'open' class for CSS transition
    menu.classList.toggle('open');
    
    // Update arrow rotation
    if (btn) {
        const arrow = btn.querySelector('.arrow');
        if (arrow) {
            if (menu.classList.contains('open')) {
                arrow.style.transform = 'rotate(90deg)';
            } else {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    }
}

function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const profile = document.querySelector('.profile');
    const dropdown = document.getElementById('profileDropdown');
    
    if (!profile.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// ================= HAMBURGER MENU =================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    
    if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ================= CLOCK =================

function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

// Clock is started in DOMContentLoaded to ensure DOM is ready

// ================= CHART =================

function initChart() {
    const chartCanvas = document.getElementById('chart');
    if (!chartCanvas) return;
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded yet');
        return;
    }
    
    const ctx = chartCanvas.getContext('2d');
    
    // Fetch data from server
    fetch('/dashboard-stats')
        .then(response => response.json())
        .then(data => {
            const labels = Object.keys(data.daily_uploads);
            const values = Object.values(data.daily_uploads);
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'CV Uploads',
                        data: values.length > 0 ? values : [50, 67, 20, 12, 45, 10, 100],
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.log('Using default chart data');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'CV Uploads',
                        data: [50, 67, 20, 12, 45, 10, 100],
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });
}

// Initialize chart when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart);
} else {
    initChart();
}

// ================= CV FUNCTIONS =================

function previewCV(cvPath) {
    const modal = document.getElementById('cvModal');
    const frame = document.getElementById('cvFrame');
    
    if (modal && frame) {
        frame.src = cvPath;
        modal.style.display = 'flex';
    }
}

function closeModal() {
    const modal = document.getElementById('cvModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function toggleCVStatus(element) {
    if (element.classList.contains('badge-warning')) {
        element.classList.remove('badge-warning');
        element.classList.add('badge-success');
        element.textContent = 'Reviewed';
    } else {
        element.classList.remove('badge-success');
        element.classList.add('badge-warning');
        element.textContent = 'Pending';
    }
}

// CV Selection
const selectAllCheckbox = document.getElementById('selectAll');
if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.rowCheck');
        checkboxes.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
    });
}

function deleteSelected() {
    const checked = document.querySelectorAll('.rowCheck:checked');
    if (checked.length === 0) {
        alert('Please select at least one CV to delete');
        return;
    }
    
    if (confirm('Are you sure you want to delete ' + checked.length + ' selected CV(s)?')) {
        // Implement deletion logic
        alert('CVs deleted successfully');
    }
}

// ================= MESSAGE FUNCTIONS =================

function viewMessage(name, email, message) {
    const modal = document.getElementById('messageModal');
    const msgName = document.getElementById('msgName');
    const msgEmail = document.getElementById('msgEmail');
    const msgContent = document.getElementById('msgContent');
    
    if (modal) {
        msgName.textContent = name;
        msgEmail.textContent = email;
        msgContent.textContent = message;
        modal.style.display = 'flex';
    }
}

function closeMessageModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function deleteSelectedMessages() {
    const checked = document.querySelectorAll('.msgCheck:checked');
    if (checked.length === 0) {
        alert('Please select at least one message to delete');
        return;
    }
    
    if (confirm('Are you sure you want to delete ' + checked.length + ' message(s)?')) {
        // Implement deletion logic
        alert('Messages deleted successfully');
    }
}

// ================= IMAGE GALLERY =================

function deleteImage(button) {
    if (confirm('Are you sure you want to delete this image?')) {
        const card = button.closest('.card');
        card.remove();
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================= VIDEO GALLERY =================

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ================= MARQUEE FUNCTIONS =================

function openMarqueeBox() {
    const marqueeBox = document.getElementById('marquee-box');
    if (marqueeBox) {
        marqueeBox.classList.toggle('show');
    }
}

function saveMarquee() {
    const marqueeInput = document.getElementById('marqueeInput');
    if (!marqueeInput) return;
    
    const text = marqueeInput.value;
    
    const formData = new FormData();
    formData.append('text', text);
    
    fetch('/update-marquee', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert('Marquee updated successfully!');
        } else {
            alert('Failed to update marquee');
        }
    })
    .catch(err => {
        console.error('Error updating marquee:', err);
    });
}

// Word count for marquee
const marqueeInputEl = document.getElementById('marqueeInput');
if (marqueeInputEl) {
    marqueeInputEl.addEventListener('input', function() {
        const wordCount = document.getElementById('wordCount');
        if (wordCount) {
            wordCount.textContent = this.value.length + ' / 250 Characters';
        }
    });
}

function toggleEmojiPanel() {
    const panel = document.getElementById('emojiPanel');
    if (panel) {
        panel.classList.toggle('show');
    }
}

// ================= BACKUP FUNCTIONS =================

function backupWebsite() {
    const modal = document.getElementById('backupModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // Start backup
    fetch('/start-backup', {
        method: 'POST'
    })
    .then(response => {
        if (response.ok) {
            // Backup started
            monitorBackupProgress();
        }
    })
    .catch(err => {
        console.error('Error starting backup:', err);
    });
}

function monitorBackupProgress() {
    const interval = setInterval(() => {
        fetch('/backup-progress')
            .then(response => response.json())
            .then(data => {
                const percent = data.percent;
                const current = data.current;
                const total = data.total;
                const status = data.status;
                
                // Update UI
                const backupBar = document.getElementById('backupBar');
                const backupPercent = document.getElementById('backupPercent');
                const fileCounter = document.getElementById('fileCounter');
                const backupStatus = document.getElementById('backupStatus');
                
                if (backupBar) backupBar.style.width = percent + '%';
                if (backupPercent) backupPercent.textContent = percent + '%';
                if (fileCounter) fileCounter.textContent = current + ' / ' + total + ' files';
                if (backupStatus) backupStatus.textContent = status;
                
                if (status === 'Backup completed' || status === 'Backup cancelled') {
                    clearInterval(interval);
                }
            })
            .catch(err => {
                console.error('Error monitoring backup:', err);
                clearInterval(interval);
            });
    }, 1000);
}

function cancelBackup() {
    fetch('/cancel-backup', {
        method: 'POST'
    })
    .then(response => {
        if (response.ok) {
            alert('Backup cancelled');
            const modal = document.getElementById('backupModal');
            if (modal) modal.style.display = 'none';
        }
    });
}

// ================= DOWNLOAD FUNCTIONS =================

function downloadAllCVs() {
    window.location.href = '/download-all-cvs';
}

function downloadLogs() {
    window.location.href = '/download-logs';
}

// ================= NOTIFICATIONS FUNCTIONS =================

// Load notifications from server
function loadNotifications() {
    fetch('/get-notifications')
        .then(response => response.json())
        .then(notifications => {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            if (notifications.length === 0) {
                activityList.innerHTML = '<div class="no-notifications">No notifications yet</div>';
                return;
            }
            
            activityList.innerHTML = '';
            
            notifications.forEach(function(notif) {
                const item = document.createElement('div');
                item.className = 'activity-item ' + notif.notification_type;
                if (notif.is_read) {
                    item.classList.add('read');
                }
                
                item.innerHTML = '<span class="icon">' + notif.icon + '</span><div><p><strong>' + notif.title + '</strong></p><small>' + notif.description + '</small><span>' + notif.created_at + '</span></div><span class="delete-alert" onclick="deleteNotification(' + notif.id + ', this)">✖</span>';
                
                activityList.appendChild(item);
            });
            
            // Update notification badge
            updateNotificationBadge(notifications.length);
        })
        .catch(function(err) {
            console.error('Error loading notifications:', err);
            const activityList = document.getElementById('activityList');
            if (activityList) {
                activityList.innerHTML = '<div class="no-notifications">Failed to load notifications</div>';
            }
        });
}

// Delete a single notification
function deleteNotification(id, element) {
    if (confirm('Delete this notification?')) {
        fetch('/mark-notification-read/' + id, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                element.closest('.activity-item').remove();
                loadNotifications();
            }
        })
        .catch(err => console.error('Error deleting notification:', err));
    }
}

// Update notification badge count
function updateNotificationBadge(count) {
    const notifyDot = document.getElementById('notifyDot');
    if (notifyDot) {
        if (count > 0) {
            notifyDot.style.display = 'block';
        } else {
            notifyDot.style.display = 'none';
        }
    }
}

// ================= CLEAR FUNCTIONS =================

function clearNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        fetch('/clear-notifications', {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                const activityList = document.getElementById('activityList');
                if (activityList) {
                    activityList.innerHTML = '<div class="no-notifications">No notifications yet</div>';
                }
                updateNotificationBadge(0);
            }
        })
        .catch(err => {
            console.error('Error clearing notifications:', err);
        });
    }
}

function clearMessages() {
    if (confirm('Are you sure you want to delete all messages?')) {
        fetch('/clear-messages', {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                const table = document.getElementById('messagesTable');
                if (table) {
                    const tbody = table.querySelector('tbody');
                    if (tbody) tbody.innerHTML = '';
                }
            }
        });
    }
}

function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
        fetch('/clear-logs', {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                const logsContainer = document.getElementById('logsContainer');
                if (logsContainer) {
                    logsContainer.innerHTML = '<p>No logs</p>';
                }
            }
        });
    }
}

function clearCVUploads() {
    if (confirm('Are you sure you want to delete all uploaded CVs? This cannot be undone.')) {
        fetch('/clear-cv-uploads', {
            method: 'POST'
        })
        .then(response => {
            if (response.ok) {
                alert('CV uploads cleared');
            }
        });
    }
}

// ================= LOGS FUNCTIONS =================

function loadLogs() {
    fetch('/get-logs')
        .then(response => response.json())
        .then(logs => {
            const container = document.getElementById('logsContainer');
            if (!container) return;
            
            container.innerHTML = '';
            
            logs.forEach(log => {
                const logItem = document.createElement('div');
                logItem.className = 'log-item ' + log.level;
                logItem.innerHTML = '<span class="log-time">' + log.time + '</span><span class="log-level">' + log.level + '</span><span class="log-message">' + log.message + '</span>';
                container.appendChild(logItem);
            });
        })
        .catch(err => {
            console.error('Error loading logs:', err);
        });
}

// ================= PAGINATION =================

let currentPage = 1;
const itemsPerPage = 10;

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
}

function nextPage() {
    currentPage++;
    updatePagination();
}

function updatePagination() {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = 'Page ' + currentPage;
    }
}

// ================= JOB FUNCTIONS =================

// Job form submission
const jobForm = document.getElementById('jobForm');
if (jobForm) {
    jobForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('companyName', document.getElementById('companyName').value);
        formData.append('place', document.getElementById('place').value);
        formData.append('positions', document.getElementById('positions').value);
        formData.append('jobType', document.getElementById('jobType').value);
        
        const descriptionEl = document.getElementById('jobDescription');
        if (descriptionEl) {
            formData.append('description', descriptionEl.value);
        }
        
        fetch('/add-job', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Job added successfully!');
                jobForm.reset();
                loadJobsAdmin();
                showSection('job-list-panel');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error adding job:', err);
            alert('Failed to add job');
        });
    });
}

// Load jobs for admin panel
function loadJobsAdmin() {
    fetch('/get-jobs-admin')
        .then(response => response.json())
        .then(jobs => {
            const tbody = document.getElementById('jobTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (jobs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No jobs added yet</td></tr>';
                return;
            }
            
            jobs.forEach(job => {
                const row = document.createElement('tr');
                row.innerHTML = '<td>' + (job.company || 'N/A') + '</td><td>' + (job.positions || 'N/A') + '</td><td>' + (job.place || 'N/A') + '</td><td>' + (job.job_type || 'N/A') + '</td><td>' + (job.created_at || 'N/A') + '</td><td><button class="btn btn-danger" onclick="deleteJob(' + job.id + ')">Delete</button></td>';
                tbody.appendChild(row);
            });
        })
        .catch(err => console.error('Error loading jobs:', err));
}

// Delete job function
function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job?')) {
        fetch('/delete-job/' + jobId, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Job deleted successfully!');
                loadJobsAdmin();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error deleting job:', err);
            alert('Failed to delete job');
        });
    }
}

// ================= STAFF FUNCTIONS =================

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-pass');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (toggleBtn) toggleBtn.textContent = '👁';
    } else {
        passwordInput.type = 'password';
        if (toggleBtn) toggleBtn.textContent = '👁';
    }
}

// Staff image preview
const staffImageInput = document.getElementById('staffImage');
if (staffImageInput) {
    staffImageInput.addEventListener('change', function() {
        const preview = document.getElementById('staffPreview');
        if (preview && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// Load staff data
function loadStaff() {
    fetch('/get-staff')
        .then(response => response.json())
        .then(staff => {
            const tbody = document.getElementById('accountsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (staff.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No staff members added yet</td></tr>';
                return;
            }
            
            staff.forEach(function(s) {
                const photoSrc = s.photo ? '/static/uploads/' + s.photo : '/static/images/gallery1.jpg';
                const statusClass = s.status === 'Active' ? 'badge-success' : 'badge-danger';
                const loginText = s.login_access ? 'Yes' : 'No';
                
                const row = document.createElement('tr');
                row.innerHTML = '<td><img src="' + photoSrc + '" alt="Photo" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td><td>' + (s.name || 'N/A') + '</td><td>' + (s.userid || 'N/A') + '</td><td>' + (s.role || 'N/A') + '</td><td><span class="badge ' + statusClass + '" onclick="toggleStaffStatus(' + s.id + ')" style="cursor:pointer;">' + s.status + '</span></td><td>' + loginText + '</td><td><button class="btn btn-secondary" onclick="toggleStaffLogin(' + s.id + ')">Toggle</button> <a href="/delete-staff/' + s.id + '" class="btn btn-danger" onclick="return confirm(\'Delete this staff member?\')">Delete</a></td>';
                tbody.appendChild(row);
            });
        })
        .catch(err => console.error('Error loading staff:', err));
}

function toggleStaffStatus(id) {
    fetch('/toggle-staff-status/' + id, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadStaff();
            }
        })
        .catch(err => console.error('Error toggling status:', err));
}

function toggleStaffLogin(id) {
    fetch('/toggle-staff-login/' + id, { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadStaff();
            }
        })
        .catch(err => console.error('Error toggling login:', err));
}

// Staff form submission
const staffForm = document.getElementById('staffForm');
if (staffForm) {
    staffForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', document.getElementById('staffName').value);
        formData.append('father_name', document.getElementById('fatherName').value);
        formData.append('mother_name', document.getElementById('motherName').value);
        formData.append('dob', document.getElementById('dateofBirth').value);
        formData.append('gender', document.getElementById('gender').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('alt_phone', document.getElementById('alternatePhone').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('marital_status', document.getElementById('maritalStatus').value);
        formData.append('blood_group', document.getElementById('bloodGroup').value);
        formData.append('address', document.getElementById('address').value);
        formData.append('role', document.getElementById('role').value);
        formData.append('userid', document.getElementById('userid').value);
        formData.append('password', document.getElementById('password').value);
        
        const photoInput = document.getElementById('staffImage');
        if (photoInput && photoInput.files[0]) {
            formData.append('photo', photoInput.files[0]);
        }
        
        fetch('/add-staff', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Staff added successfully!');
                staffForm.reset();
                const preview = document.getElementById('staffPreview');
                if (preview) preview.innerHTML = '<span>Photo</span>';
                showSection('staff-accounts');
                loadStaff();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error adding staff:', err);
            alert('Failed to add staff');
        });
    });
}

// ================= IMAGE UPLOAD =================

const dropZone = document.getElementById('dropZone');
if (dropZone) {
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const input = document.getElementById('imageUpload');
            if (input) {
                input.files = files;
                // Trigger change event
                input.dispatchEvent(new Event('change'));
            }
        }
    });
}

// Browse button for images
const browseBtn = document.querySelector('.browse-btn');
if (browseBtn) {
    browseBtn.addEventListener('click', function() {
        const input = document.getElementById('imageUpload');
        if (input) input.click();
    });
}

// Image preview on file select
const imageUpload = document.getElementById('imageUpload');
if (imageUpload) {
    imageUpload.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewImage = document.getElementById('previewImage');
                const previewBox = document.getElementById('previewBox');
                if (previewImage && previewBox) {
                    previewImage.src = e.target.result;
                    previewBox.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// Image upload function
function uploadImage() {
    const input = document.getElementById('imageUpload');
    const title = document.getElementById('imageTitle') ? document.getElementById('imageTitle').value : '';

    if (!input || !input.files[0]) {
        alert('Please select an image first');
        return;
    }

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('media_type', 'image');

    // Show progress
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable && progressBar) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percent + '%';
        }
    });

    xhr.onload = function() {
        // Hide progress
        if (progressContainer) progressContainer.style.display = 'none';

        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                // Show toast
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                }

                // Clear form
                input.value = '';
                const titleInput = document.getElementById('imageTitle');
                if (titleInput) titleInput.value = '';
                const previewBox = document.getElementById('previewBox');
                if (previewBox) previewBox.style.display = 'none';

                // Reload gallery
                loadAdminImages();
            } else {
                alert('Upload failed: ' + response.message);
            }
        } else {
            alert('Upload failed. Please try again.');
        }
    };

    xhr.onerror = function() {
        if (progressContainer) progressContainer.style.display = 'none';
        alert('Upload failed. Please try again.');
    };

    xhr.open('POST', '/add-gallery');
    xhr.send(formData);
}

// ================= VIDEO UPLOAD =================

const videoUploadBox = document.getElementById('videoUploadBox');
if (videoUploadBox) {
    videoUploadBox.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    videoUploadBox.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });

    videoUploadBox.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadVideo(files[0]);
        }
    });
}

// Video upload button click
const videoUploadContent = document.querySelector('.upload-content');
if (videoUploadContent) {
    const chooseBtn = videoUploadContent.querySelector('.btn');
    if (chooseBtn) {
        chooseBtn.addEventListener('click', function() {
            const input = document.getElementById('videoInput');
            if (input) input.click();
        });
    }
}

// Video file selection
const videoInput = document.getElementById('videoInput');
if (videoInput) {
    videoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            uploadVideo(file);
        }
    });
}

// Video upload function
function uploadVideo(file) {
    if (!file) {
        alert('Please select a video first');
        return;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, WebM, MOV, AVI)');
        return;
    }

    // Check file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Video file is too large. Maximum size is 100MB');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', '');
    formData.append('media_type', 'video');

    // Show progress
    const uploadProgress = document.getElementById('uploadProgress');
    const videoProgressBar = document.getElementById('videoProgressBar');
    if (uploadProgress) uploadProgress.style.display = 'block';
    if (videoProgressBar) videoProgressBar.style.width = '0%';

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable && videoProgressBar) {
            const percent = Math.round((e.loaded / e.total) * 100);
            videoProgressBar.style.width = percent + '%';
        }
    });

    xhr.onload = function() {
        // Hide progress
        if (uploadProgress) uploadProgress.style.display = 'none';

        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                alert('Video uploaded successfully!');

                // Clear form
                const input = document.getElementById('videoInput');
                if (input) input.value = '';

                // Reload video gallery
                loadAdminVideos();
            } else {
                alert('Upload failed: ' + response.message);
            }
        } else {
            alert('Upload failed. Please try again.');
        }
    };

    xhr.onerror = function() {
        if (uploadProgress) uploadProgress.style.display = 'none';
        alert('Upload failed. Please try again.');
    };

    xhr.open('POST', '/add-gallery');
    xhr.send(formData);
}

// ================= CHANGE PASSWORD =================

function verifyUser() {
    const userId = document.getElementById('cpUserId').value;
    const oldPassword = document.getElementById('cpOldPassword').value;
    
    if (!userId || !oldPassword) {
        alert('Please enter User ID and Old Password');
        return;
    }
    
    // Move to step 2
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
}

function verifyOtp() {
    const otp = document.getElementById('cpOtp').value;
    
    if (!otp) {
        alert('Please enter OTP');
        return;
    }
    
    // Move to step 3 (in real app, verify OTP first)
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.add('active');
}

function resendOtp() {
    alert('OTP resent to your email/mobile');
}

function changePassword() {
    const newPassword = document.getElementById('cpNewPassword').value;
    const confirmPassword = document.getElementById('cpConfirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        alert('Please enter both passwords');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Submit password change
    fetch('/change-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'current=' + encodeURIComponent(document.getElementById('cpOldPassword').value) + '&new=' + encodeURIComponent(newPassword)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Password changed successfully!');
            // Reset form
            document.getElementById('step3').classList.remove('active');
            document.getElementById('step1').classList.add('active');
            document.getElementById('cpUserId').value = '';
            document.getElementById('cpOldPassword').value = '';
            document.getElementById('cpOtp').value = '';
            document.getElementById('cpNewPassword').value = '';
            document.getElementById('cpConfirmPassword').value = '';
        } else {
            alert(data.message || 'Failed to change password');
        }
    })
    .catch(err => {
        console.error('Error changing password:', err);
        alert('An error occurred');
    });
}

// ================= EXPORT STAFF =================

function exportStaffExcel() {
    fetch('/export-staff')
        .then(response => {
            if (response.ok) {
                // Trigger download
                const blob = response.blob();
                return blob;
            } else {
                throw new Error('Export failed');
            }
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'staff_export.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(err => {
            console.error('Error exporting staff:', err);
            alert('Failed to export staff data');
        });
}

// Initialize - show dashboard panel by default and start clock
document.addEventListener('DOMContentLoaded', function() {
    showSection('dashboard-panel');
    updateClock();
    setInterval(updateClock, 1000);
});

// Load images for admin image panel
function loadAdminImages() {
    fetch("/get-gallery")
        .then(response => response.json())
        .then(galleryItems => {
            const container = document.getElementById("galleryGrid");
            if (!container) return;
            // Clear existing content except the sample if any, but since we replace, clear all
            container.innerHTML = "";
            galleryItems.filter(item => item.media_type === "image").forEach(item => {
                const galleryItem = document.createElement("div");
                galleryItem.className = "card";
                galleryItem.innerHTML = `
                    <img src="/static/images/${item.filename}" alt="${item.title || 'Uploaded image'}">
                    <button class="delete-img" onclick="deleteImage('${item.id}', '${item.filename}')">✖</button>
                    <div class="gallery-info">
                        <p class="img-title">${item.title || 'Image'}</p>
                        <span class="img-date">${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                `;
                container.appendChild(galleryItem);
            });
        })
        .catch(err => {
            console.error("Error loading admin images:", err);
        });
}

// Load videos for admin video panel
function loadAdminVideos() {
    fetch("/get-gallery")
        .then(response => response.json())
        .then(galleryItems => {
            const container = document.getElementById("videoGrid");
            if (!container) return;
            container.innerHTML = "";
            galleryItems.filter(item => item.media_type === "video").forEach(item => {
                const videoItem = document.createElement("div");
                videoItem.className = "video-card";
                videoItem.innerHTML = `
                    <video src="/static/videos/${item.filename}" muted></video>
                    <div class="video-overlay">▶</div>
                    <button class="delete-video" onclick="deleteVideo('${item.id}', '${item.filename}')">✖</button>
                    <div class="video-info">
                        <p class="video-title">${item.title || 'Video'}</p>
                        <span class="video-date">${new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                `;
                container.appendChild(videoItem);
            });
        })
        .catch(err => {
            console.error("Error loading admin videos:", err);
        });
}

// Delete image function
function deleteImage(id, filename) {
    if (confirm("Delete this image?")) {
        fetch(`/delete-gallery/${id}`, { method: "DELETE" })
            .then(response => {
                if (response.ok) {
                    loadAdminImages();
                } else {
                    alert("Failed to delete image");
                }
            })
            .catch(err => console.error("Error deleting image:", err));
    }
}

// Delete video function
function deleteVideo(id, filename) {
    if (confirm("Delete this video?")) {
        fetch(`/delete-gallery/${id}`, { method: "DELETE" })
            .then(response => {
                if (response.ok) {
                    loadAdminVideos();
                } else {
                    alert("Failed to delete video");
                }
            })
            .catch(err => console.error("Error deleting video:", err));
    }
}

// Modify showSection to load galleries when panels are shown
const originalShowSection = showSection;
showSection = function(panelId) {
    originalShowSection(panelId);
    if (panelId === 'image-panel') {
        loadAdminImages();
    } else if (panelId === 'video-panel') {
        loadAdminVideos();
    }
};

// After upload, refresh galleries
const originalUploadImage = uploadImage;
uploadImage = function() {
    originalUploadImage();
    // Assuming uploadImage calls loadAdminImages internally or we add it
    // For now, add after success
};

// Similarly for video upload, if exists
// Assuming uploadVideo exists, modify similarly
