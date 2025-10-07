/**
 * NestNav - Form Handler JavaScript
 * Handles form validation, AJAX calls, and dynamic UI updates
 */

document.addEventListener('DOMContentLoaded', function () {
    initializeFormHandlers();
    initializeAnimations();
    initializeTooltips();
});

// Initialize all form handlers
function initializeFormHandlers() {
    // Dashboard form validation
    const dashboardForm = document.getElementById('recommendationForm');
    if (dashboardForm) {
        setupDashboardForm(dashboardForm);
    }

    // Login form enhancements
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        setupLoginForm(loginForm);
    }

    // Register form validation
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        setupRegisterForm(registerForm);
    }

    // Generic form enhancements
    setupGenericFormEnhancements();
}

// Dashboard form setup
function setupDashboardForm(form) {
    const preferences = ['preference1', 'preference2', 'preference3'];
    const submitBtn = form.querySelector('#submitBtn');
    const loadingSpinner = form.querySelector('#loadingSpinner');

    // Real-time preference validation
    preferences.forEach(prefId => {
        const select = document.getElementById(prefId);
        if (select) {
            select.addEventListener('change', function () {
                validatePreferences();
                updateFormState();
            });
        }
    });

    // Area selection handler
    const areaSelect = document.getElementById('selectedArea');
    if (areaSelect) {
        areaSelect.addEventListener('change', function () {
            if (this.value) {
                fetchZoneInfo(this.value);
            }
            updateFormState();
        });
    }

    // Budget input validation
    const budgetInput = document.getElementById('budget');
    if (budgetInput) {
        budgetInput.addEventListener('input', function () {
            validateBudget(this);
            updateFormState();
        });
    }

    // Form submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (validateDashboardForm()) {
            showLoadingState(submitBtn, loadingSpinner);
            this.submit();
        }
    });

    // Auto-populate from URL parameters
    populateFromUrlParams();

    // Validate preferences for duplicates
    function validatePreferences() {
        const values = preferences.map(id => {
            const elem = document.getElementById(id);
            return elem ? elem.value : '';
        }).filter(v => v);

        const duplicates = values.length !== new Set(values).size;

        preferences.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            if (duplicates && values.filter(v => v === select.value).length > 1) {
                select.classList.add('is-invalid');
                showFieldError(select, 'Please select different preferences');
            } else {
                select.classList.remove('is-invalid');
                hideFieldError(select);
            }
        });
    }

    // Validate budget input
    function validateBudget(input) {
        const value = parseFloat(input.value);

        if (input.value && (isNaN(value) || value < 1 || value > 10)) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Budget score must be between 1 and 10');
        } else {
            input.classList.remove('is-invalid');
            hideFieldError(input);
        }
    }

    // Complete form validation
    function validateDashboardForm() {
        let isValid = true;

        // Check required fields
        const requiredFields = ['selectedArea', 'preference1', 'preference2', 'preference3'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                field?.classList.add('is-invalid');
                showFieldError(field, 'This field is required');
                isValid = false;
            }
        });

        // Check for duplicate preferences
        const prefValues = preferences.map(id => document.getElementById(id)?.value).filter(v => v);
        if (prefValues.length !== new Set(prefValues).size) {
            isValid = false;
            showAlert('Please select 3 different preferences', 'danger');
        }

        return isValid;
    }

    // Update form state based on validation
    function updateFormState() {
        const area = document.getElementById('selectedArea')?.value;
        const pref1 = document.getElementById('preference1')?.value;
        const pref2 = document.getElementById('preference2')?.value;
        const pref3 = document.getElementById('preference3')?.value;

        const isFormValid = area && pref1 && pref2 && pref3;

        if (submitBtn) {
            submitBtn.disabled = !isFormValid;
            if (isFormValid) {
                submitBtn.classList.remove('btn-secondary');
                submitBtn.classList.add('btn-primary');
            } else {
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-secondary');
            }
        }
    }
}

// Login form setup
function setupLoginForm(form) {
    const usernameInput = form.querySelector('input[name="username"]');
    const passwordInput = form.querySelector('input[name="password"]');

    // Real-time validation
    if (usernameInput) {
        usernameInput.addEventListener('blur', function () {
            if (!this.value.trim()) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Username or email is required');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('blur', function () {
            if (!this.value.trim()) {
                this.classList.add('is-invalid');
                showFieldError(this, 'Password is required');
            } else {
                this.classList.remove('is-invalid');
                hideFieldError(this);
            }
        });
    }
}

// Register form setup
function setupRegisterForm(form) {
    const usernameInput = form.querySelector('input[name="username"]');
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');

    // Username validation
    if (usernameInput) {
        usernameInput.addEventListener('input', function () {
            validateUsername(this);
        });
    }

    // Email validation
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            validateEmail(this);
        });
    }

    // Password validation
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            validatePassword(this);
            if (confirmPasswordInput && confirmPasswordInput.value) {
                validatePasswordConfirmation(confirmPasswordInput, this.value);
            }
        });
    }

    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function () {
            const password = passwordInput ? passwordInput.value : '';
            validatePasswordConfirmation(this, password);
        });
    }

    function validateUsername(input) {
        const username = input.value.trim();
        const regex = /^[a-zA-Z0-9_]{3,20}$/;

        if (!username) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Username is required');
        } else if (!regex.test(username)) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Username must be 3-20 characters with only letters, numbers, and underscores');
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            hideFieldError(input);
        }
    }

    function validateEmail(input) {
        const email = input.value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Email is required');
        } else if (!regex.test(email)) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Please enter a valid email address');
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            hideFieldError(input);
        }
    }

    function validatePassword(input) {
        const password = input.value;

        if (!password) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Password is required');
        } else if (password.length < 6) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Password must be at least 6 characters long');
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            hideFieldError(input);
        }
    }

    function validatePasswordConfirmation(input, password) {
        if (!input.value) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Please confirm your password');
        } else if (input.value !== password) {
            input.classList.add('is-invalid');
            showFieldError(input, 'Passwords do not match');
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            hideFieldError(input);
        }
    }
}

// Generic form enhancements
function setupGenericFormEnhancements() {
    // Auto-dismiss alerts
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeBtn = alert.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        }, 5000);
    });

    // Form loading states
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function () {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                showFormLoadingState(submitBtn);
            }
        });
    });
}

// Utility functions
function showLoadingState(button, spinner) {
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    }
    if (spinner) {
        spinner.classList.remove('d-none');
    }
}

function showFormLoadingState(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Please wait...';

    // Reset after 10 seconds as fallback
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalText;
    }, 10000);
}

function showFieldError(field, message) {
    if (!field) return;

    hideFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
}

function hideFieldError(field) {
    if (!field) return;

    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-info-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    const container = document.querySelector('.container');
    if (container) {
        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = alertHtml;
        container.insertBefore(alertDiv.firstElementChild, container.firstElementChild);
    }
}

function fetchZoneInfo(area) {
    fetch(`/api/zones/${encodeURIComponent(area)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.zone) {
                showZoneInfo(data.data.zone);
            }
        })
        .catch(error => {
            console.error('Error fetching zone info:', error);
        });
}

function showZoneInfo(zone) {
    const existingInfo = document.querySelector('.zone-info-alert');
    if (existingInfo) {
        existingInfo.remove();
    }

    const zoneColors = {
        'Central': 'primary',
        'South': 'success',
        'North': 'info',
        'West': 'warning',
        'East Coast': 'secondary'
    };

    const color = zoneColors[zone] || 'info';

    const alertHtml = `
        <div class="alert alert-${color} zone-info-alert fade show" role="alert">
            <i class="fas fa-map-marker-alt me-2"></i>
            This area is in the <strong>${zone} Zone</strong>. 
            We'll recommend similar areas in the same zone.
        </div>
    `;

    const form = document.getElementById('recommendationForm');
    if (form) {
        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = alertHtml;
        form.insertBefore(alertDiv.firstElementChild, form.firstElementChild);
    }
}

function populateFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    // Populate area
    const area = urlParams.get('area');
    if (area) {
        const areaSelect = document.getElementById('selectedArea');
        if (areaSelect) {
            areaSelect.value = area;
            fetchZoneInfo(area);
        }
    }

    // Populate budget
    const budget = urlParams.get('budget');
    if (budget) {
        const budgetInput = document.getElementById('budget');
        if (budgetInput) {
            budgetInput.value = budget;
        }
    }

    // Populate preferences
    for (let i = 1; i <= 3; i++) {
        const pref = urlParams.get(`pref${i}`);
        if (pref) {
            const prefSelect = document.getElementById(`preference${i}`);
            if (prefSelect) {
                prefSelect.value = pref;
            }
        }
    }

    // Trigger form state update after population
    setTimeout(() => {
        const form = document.getElementById('recommendationForm');
        if (form) {
            const event = new Event('change', { bubbles: true });
            const areaSelect = document.getElementById('selectedArea');
            if (areaSelect && areaSelect.value) {
                areaSelect.dispatchEvent(event);
            }
        }
    }, 100);
}

// Animation and UI enhancements
function initializeAnimations() {
    // Fade-in animation for form sections
    const formSections = document.querySelectorAll('.form-section, .card');
    formSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';

        setTimeout(() => {
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Button hover animations
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Smooth scroll for form navigation
    const formLinks = document.querySelectorAll('a[href^="#"]');
    formLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Initialize tooltips
function initializeTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Custom tooltips for form help
    const helpIcons = document.querySelectorAll('.help-icon, [data-help]');
    helpIcons.forEach(icon => {
        icon.addEventListener('mouseenter', showCustomTooltip);
        icon.addEventListener('mouseleave', hideCustomTooltip);
    });
}

function showCustomTooltip(event) {
    const helpText = event.target.getAttribute('data-help') || 'Help information';

    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.innerHTML = helpText;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 200px;
        word-wrap: break-word;
    `;

    document.body.appendChild(tooltip);

    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';

    // Fade in
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 10);

    event.target._tooltip = tooltip;
}

function hideCustomTooltip(event) {
    const tooltip = event.target._tooltip;
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 300);
        delete event.target._tooltip;
    }
}

// Advanced form features
function initializeAdvancedFeatures() {
    // Auto-save form data to session storage (if supported)
    if (typeof Storage !== 'undefined') {
        setupAutoSave();
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts();

    // Progress tracking
    setupProgressTracking();
}

function setupAutoSave() {
    const forms = document.querySelectorAll('form[data-autosave]');

    forms.forEach(form => {
        const formId = form.id || 'default-form';
        const inputs = form.querySelectorAll('input, select, textarea');

        // Load saved data
        inputs.forEach(input => {
            const savedValue = sessionStorage.getItem(`${formId}_${input.name}`);
            if (savedValue && !input.value) {
                input.value = savedValue;
            }
        });

        // Save data on change
        inputs.forEach(input => {
            input.addEventListener('change', function () {
                sessionStorage.setItem(`${formId}_${this.name}`, this.value);
            });
        });

        // Clear saved data on successful submit
        form.addEventListener('submit', function () {
            inputs.forEach(input => {
                sessionStorage.removeItem(`${formId}_${input.name}`);
            });
        });
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Ctrl+Enter to submit form
        if (e.ctrlKey && e.key === 'Enter') {
            const activeForm = document.querySelector('form:focus-within');
            if (activeForm) {
                const submitBtn = activeForm.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }

        // Escape to clear form
        if (e.key === 'Escape') {
            const activeInput = document.activeElement;
            if (activeInput && activeInput.tagName === 'INPUT') {
                activeInput.blur();
            }
        }
    });
}

function setupProgressTracking() {
    const forms = document.querySelectorAll('form[data-progress]');

    forms.forEach(form => {
        const progressBar = form.querySelector('.progress-bar');
        const requiredFields = form.querySelectorAll('[required]');

        if (!progressBar || requiredFields.length === 0) return;

        function updateProgress() {
            const filledFields = Array.from(requiredFields).filter(field => field.value.trim());
            const progress = (filledFields.length / requiredFields.length) * 100;

            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = Math.round(progress) + '%';
        }

        requiredFields.forEach(field => {
            field.addEventListener('input', updateProgress);
            field.addEventListener('change', updateProgress);
        });

        // Initial progress update
        updateProgress();
    });
}

// Initialize advanced features when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeAdvancedFeatures();
});

// Export functions for external use
window.NestNavForms = {
    showAlert,
    showLoadingState,
    validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    validateUsername: (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username),
    fetchZoneInfo,
    populateFromUrlParams
};