// Initialize IndexedDB for offline storage
let db;
let voiceEnabled = true;
let currentLanguage = 'bn';
let isOffline = false;
let isDarkMode = false;
let isLoggedIn = false;
let userProfile = {};
let map;
let userLocationMarker;
let facilityMarkers = [];
let trackingCharts = {}; // Store chart instances

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeIndexedDB();
    checkConnectivity();
    setupEventListeners();
    loadUserProfile();
});

// IndexedDB setup
function initializeIndexedDB() {
    const request = indexedDB.open('HealthCareDB', 1);
    
    request.onerror = function(event) {
        console.log('Database error: ' + event.target.errorCode);
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('Database initialized successfully');
    };
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('userData')) {
            const userStore = db.createObjectStore('userData', { keyPath: 'id' });
            userStore.createIndex('name', 'name', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('healthData')) {
            const healthStore = db.createObjectStore('healthData', { keyPath: 'id', autoIncrement: true });
            healthStore.createIndex('date', 'date', { unique: false });
            healthStore.createIndex('type', 'type', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('reminders')) {
            const reminderStore = db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
            reminderStore.createIndex('time', 'time', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('communityPosts')) {
            const communityStore = db.createObjectStore('communityPosts', { keyPath: 'id', autoIncrement: true });
            communityStore.createIndex('date', 'date', { unique: false });
            communityStore.createIndex('location', 'location', { unique: false });
        }
    };
}

// Check connectivity
function checkConnectivity() {
    if (!navigator.onLine) {
        isOffline = true;
        document.getElementById('offlineIndicator').style.display = 'block';
    }
    
    window.addEventListener('online', function() {
        isOffline = false;
        document.getElementById('offlineIndicator').style.display = 'none';
        syncOfflineData();
    });
    
    window.addEventListener('offline', function() {
        isOffline = true;
        document.getElementById('offlineIndicator').style.display = 'block';
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('voiceEnabled').addEventListener('change', function(e) {
        voiceEnabled = e.target.checked;
    });
    
    document.getElementById('languageSelect').addEventListener('change', function(e) {
        currentLanguage = e.target.value;
        updateLanguage();
    });
    
    document.getElementById('largeText').addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('large-text');
        } else {
            document.body.classList.remove('large-text');
        }
    });
    
    document.getElementById('highContrast').addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    });
    
    document.getElementById('darkMode').addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            isDarkMode = true;
        } else {
            document.body.classList.remove('dark-mode');
            isDarkMode = false;
        }
    });
    
    document.getElementById('vibration').addEventListener('change', function(e) {
        if (e.target.checked && 'vibrate' in navigator) {
            navigator.vibrate(200);
        }
    });
}

// Load user profile
function loadUserProfile() {
    const transaction = db.transaction(['userData'], 'readonly');
    const store = transaction.objectStore('userData');
    const request = store.get('userProfile');
    
    request.onsuccess = function(event) {
        if (request.result) {
            userProfile = request.result;
            isLoggedIn = true;
        }
    };
}

// App functions
function startApp() {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    
    // Load user data
    loadUserData();
    
    // Set up reminders
    setupReminders();
    
    // Speak welcome message
    speakText('স্বাস্থ্যসেবা অ্যাপে স্বাগতম');
}

function showLoginOptions() {
    document.getElementById('loginOptionsModal').classList.remove('hidden');
}

function showBiometricLogin() {
    document.getElementById('biometricModal').classList.remove('hidden');
}

function showPhoneLogin() {
    document.getElementById('phoneModal').classList.remove('hidden');
}

function showPasswordLogin() {
    document.getElementById('passwordModal').classList.remove('hidden');
}

function showProfileSetup() {
    document.getElementById('profileSetupModal').classList.remove('hidden');
}

function simulateBiometric() {
    // Simulate biometric authentication
    setTimeout(() => {
        closeModal('biometricModal');
        closeModal('loginOptionsModal');
        showProfileSetup();
        speakText('বায়োমেট্রিক লগইন সফল হয়েছে');
    }, 2000);
}

function sendOTP() {
    // Simulate OTP sending
    closeModal('phoneModal');
    closeModal('loginOptionsModal');
    showProfileSetup();
    speakText('OTP পাঠানো হয়েছে এবং লগইন সফল হয়েছে');
}

function passwordLogin() {
    // Simulate password login
    closeModal('passwordModal');
    closeModal('loginOptionsModal');
    showProfileSetup();
    speakText('পাসওয়ার্ড লগইন সফল হয়েছে');
}

function saveProfile() {
    // Save user profile
    userProfile = {
        id: 'userProfile',
        age: document.getElementById('ageSelect').value,
        gender: document.getElementById('genderSelect').value,
        religion: document.getElementById('religionSelect').value,
        region: document.getElementById('regionSelect').value,
        healthConditions: getSelectedHealthConditions(),
        loginTime: new Date().toISOString()
    };
    
    const transaction = db.transaction(['userData'], 'readwrite');
    const store = transaction.objectStore('userData');
    store.put(userProfile);
    
    closeModal('profileSetupModal');
    isLoggedIn = true;
    
    // Customize app based on profile
    customizeAppForUser();
    
    speakText('প্রোফাইল সংরক্ষিত হয়েছে');
}

function getSelectedHealthConditions() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const conditions = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.value) {
            conditions.push(checkbox.value);
        }
    });
    return conditions;
}

function skipProfile() {
    closeModal('profileSetupModal');
    isLoggedIn = false;
    speakText('প্রোফাইল সেটআপ এড়িয়ে যাওয়া হয়েছে');
}

function customizeAppForUser() {
    // Customize app based on user profile
    if (userProfile.age === 'child') {
        // Customize for children
    } else if (userProfile.age === 'teen') {
        // Customize for teenagers
    } else if (userProfile.age === 'adult') {
        // Customize for adults
    } else if (userProfile.age === 'elderly') {
        // Customize for elderly
    }
    
    // Customize based on health conditions
    if (userProfile.healthConditions.includes('diabetes')) {
        // Show diabetes-related content
    }
    
    // Customize based on religion
    if (userProfile.religion) {
        // Show religion-specific content
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Dashboard functions
function loadUserData() {
    // Load user data from IndexedDB
    const transaction = db.transaction(['userData'], 'readonly');
    const store = transaction.objectStore('userData');
    const request = store.get('userProfile');
    
    request.onsuccess = function(event) {
        if (request.result) {
            userProfile = request.result;
            customizeAppForUser();
        }
    };
}

function setupReminders() {
    // Check for pending reminders
    const transaction = db.transaction(['reminders'], 'readonly');
    const store = transaction.objectStore('reminders');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const reminders = request.result;
        // Process reminders
    };
}

// Module functions
function openModule(moduleName) {
    if (moduleName === 'community') {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('communityModule').classList.remove('hidden');
        
        // Load community posts
        loadCommunityPosts();
        
        // Speak module title if voice is enabled
        if (voiceEnabled) {
            speakText('সম্প্রদায়');
        }
        return;
    }
    
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('moduleView').classList.remove('hidden');
    
    const moduleTitle = document.getElementById('moduleTitle');
    const moduleContent = document.getElementById('moduleContent');
    
    // Load module content based on type
    switch(moduleName) {
        case 'general':
            moduleTitle.textContent = 'সাধারণ স্বাস্থ্য';
            loadGeneralHealthModule();
            break;
        case 'women':
            moduleTitle.textContent = 'নারী স্বাস্থ্য';
            loadWomenHealthModule();
            break;
        case 'men':
            moduleTitle.textContent = 'পুরুষ স্বাস্থ্য';
            loadMenHealthModule();
            break;
        case 'pregnancy':
            moduleTitle.textContent = 'গর্ভাবস্থা';
            loadPregnancyModule();
            break;
        case 'elderly':
            moduleTitle.textContent = 'বয়স্ক যত্ন';
            loadElderlyCareModule();
            break;
        case 'child':
            moduleTitle.textContent = 'শিশু স্বাস্থ্য';
            loadChildHealthModule();
            break;
        case 'mental':
            moduleTitle.textContent = 'মানসিক স্বাস্থ্য';
            loadMentalHealthModule();
            break;
        case 'chronic':
            moduleTitle.textContent = 'দীর্ঘস্থায়ী রোগ';
            loadChronicIllnessModule();
            break;
        case 'religion':
            moduleTitle.textContent = 'ধর্ম ও অনুপ্রেরণা';
            loadReligionModule();
            break;
        case 'emergency':
            moduleTitle.textContent = 'জরুরি সেবা';
            loadEmergencyModule();
            break;
        case 'learning':
            moduleTitle.textContent = 'শিক্ষা';
            loadLearningModule();
            break;
        case 'contact':
            moduleTitle.textContent = 'যোগাযোগ';
            loadContactModule();
            break;
        case 'map':
            moduleTitle.textContent = 'মানচিত্র';
            loadMapModule();
            break;
        case 'tracking':
            moduleTitle.textContent = 'স্বাস্থ্য ট্র্যাকিং';
            loadTrackingModule();
            break;
        case 'settings':
            moduleTitle.textContent = 'সেটিংস';
            loadSettingsModule();
            break;
    }
    
    // Speak module title if voice is enabled
    if (voiceEnabled) {
        speakText(moduleTitle.textContent);
    }
}

function loadCommunityPosts() {
    // Load community posts from IndexedDB
    const transaction = db.transaction(['communityPosts'], 'readonly');
    const store = transaction.objectStore('communityPosts');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const posts = request.result;
        // Display posts
    };
}

function loadGeneralHealthModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">আজকের স্বাস্থ্য পর্যালোচনা</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>আপনি কেমন অনুভব করছেন?</span>
                        <div class="flex space-x-2">
                            <button class="px-3 py-1 primary-bg text-white rounded hover-opacity focus-ring">ভালো</button>
                            <button class="px-3 py-1 bg-white border border-primary text-primary rounded hover-opacity focus-ring">মাঝারি</button>
                            <button class="px-3 py-1 bg-white border border-primary text-primary rounded hover-opacity focus-ring">খারাপ</button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>শক্তি স্তর</span>
                        <input type="range" min="0" max="10" value="7" class="w-32">
                    </div>
                    <div>
                        <label class="block mb-2">লক্ষণ যোগ করুন</label>
                        <input type="text" placeholder="যেমন: মাথাব্যথা, জ্বর" class="w-full px-3 py-2 border border-primary rounded-lg focus-ring">
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">পুষ্টি পরামর্শ</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-apple-alt primary-text mr-3"></i>
                        <span>দৈনিক ২ টি ফল খান</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-carrot primary-text mr-3"></i>
                        <span>সবজি অন্তর্ভুক্ত করুন</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-tint primary-text mr-3"></i>
                        <span>৮ গ্লাস পানি পান করুন</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ব্যায়াম পরিকল্পনা</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>সকালের হাঁটা</span>
                        <span>৩০ মিনিট</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>যোগব্যায়াম</span>
                        <span>১৫ মিনিট</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">মৌসুমী সতর্কতা</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-temperature-high primary-text mr-3"></i>
                        <span>তাপপ্রবাহ: প্রচুর পানি পান করুন</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-water primary-text mr-3"></i>
                        <span>বন্যা: বিশুদ্ধ পানি ব্যবহার করুন</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadWomenHealthModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">মাসিক চক্র ট্র্যাকিং</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>শেষ মাসিকের তারিখ</span>
                        <input type="date" class="px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <div class="flex items-center justify-between">
                        <span>চক্রের দৈর্ঘ্য</span>
                        <input type="number" value="28" class="w-20 px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        পরবর্তী মাসিকের তারিখ হিসাব করুন
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">পুষ্টি পরামর্শ</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-pills primary-text mr-3"></i>
                        <span>আয়রন সমৃদ্ধ খাবার</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-leaf primary-text mr-3"></i>
                        <span>ফলিক এসিড গ্রহণ</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-bone primary-text mr-3"></i>
                        <span>ক্যালসিয়াম সাপ্লিমেন্ট</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্য পরীক্ষা</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>হিমোগ্লোবিন পরীক্ষা</span>
                        <button class="primary-text">সময়সূচী</button>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ব্রেস্ট পরীক্ষা</span>
                        <button class="primary-text">সময়সূচী</button>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">মেনোপজ সহায়তা</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-sun primary-text mr-3"></i>
                        <span>হট ফ্ল্যাশ ব্যবস্থাপনা</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-bed primary-text mr-3"></i>
                        <span>ঘুমের উন্নতি</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadMenHealthModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ফিটনেস ট্র্যাকিং</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>ওজন</span>
                        <input type="number" placeholder="কেজি" class="w-24 px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <div class="flex items-center justify-between">
                        <span>উচ্চতা</span>
                        <input type="number" placeholder="সেমি" class="w-24 px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <div class="flex items-center justify-between">
                        <span>BMI</span>
                        <span class="font-bold">22.5</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ব্যায়াম পরিকল্পনা</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ওয়েট ট্রেনিং</span>
                        <span>৩ দিন/সপ্তাহ</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>কার্ডিও</span>
                        <span>২ দিন/সপ্তাহ</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্য সচেতনতা</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-heart primary-text mr-3"></i>
                        <span>হৃদরোগের ঝুঁকি পরীক্ষা</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle primary-text mr-3"></i>
                        <span>প্রোস্টেট স্বাস্থ্য</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">মানসিক চাপ ব্যবস্থাপনা</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-brain primary-text mr-3"></i>
                        <span>ধ্যান এবং শ্বাসব্যায়াম</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-users primary-text mr-3"></i>
                        <span>সামাজিক সম্পর্ক বজায় রাখুন</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadPregnancyModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">গর্ভাবস্থা ট্র্যাকার</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>গর্ভধারণের তারিখ</span>
                        <input type="date" class="px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-sm">আপনি বর্তমানে <span class="font-bold">১২ সপ্তাহের</span> গর্ভবতী</p>
                    </div>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        সপ্তাহ অনুযায়ী গাইড দেখুন
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ভ্রূণের গতিবিধি ট্র্যাকিং</h3>
                <div class="space-y-3">
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        <i class="fas fa-plus mr-2"></i>
                        গতিবিধি যোগ করুন
                    </button>
                    <div class="text-center primary-text">
                        আজকের গতিবিধি: ১০ বার
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">পুষ্টি গাইড</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-fish primary-text mr-3"></i>
                        <span>ওমেগা-৩ সমৃদ্ধ মাছ</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-egg primary-text mr-3"></i>
                        <span>প্রোটিন সমৃদ্ধ খাবার</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-seedling primary-text mr-3"></i>
                        <span>সবুজ শাকসবজি</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-xl p-4 border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">SOS জরুরি সেবা</h3>
                <button class="w-full primary-bg text-white py-3 rounded-lg font-bold hover-opacity focus-ring">
                    <i class="fas fa-phone-alt mr-2"></i>
                    জরুরি নম্বরে কল করুন
                </button>
            </div>
        </div>
    `;
}

function loadElderlyCareModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ওষুধের রিমাইন্ডার</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ডায়াবেটিস ওষুধ</span>
                        <span>সকাল ৮টা</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ব্লাড প্রেশার ওষুধ</span>
                        <span>রাত ৯টা</span>
                    </div>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        নতুন রিমাইন্ডার যোগ করুন
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্মৃতি যত্ন</h3>
                <div class="space-y-3">
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-sm mb-2">আজকের স্মৃতি ব্যায়াম</p>
                        <p class="text-lg font-bold">১৯৭১ সালে কি ঘটেছিল?</p>
                    </div>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        উত্তর দেখুন
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">শারীরিক কসরত</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-walking primary-text mr-3"></i>
                        <span>ধীর হাঁটা - ৩০ মিনিট</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-hands primary-text mr-3"></i>
                        <span>হাতের ব্যায়াম - ১০ মিনিট</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">পড়ে যাওয়ার ঝুঁকি পরীক্ষা</h3>
                <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                    ঝুঁকি মূল্যায়ন করুন
                </button>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">আর্থারাইটিস যত্ন</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-hot-tub primary-text mr-3"></i>
                        <span>উষ্ণ জলে স্নান</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-temperature-low primary-text mr-3"></i>
                        <span>ঠান্ডা কম্প্রেস</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadChildHealthModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">টিকা ক্যালেন্ডার</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>BCG</span>
                        <span class="primary-text">সম্পন্ন</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>DPT-১</span>
                        <span class="primary-text">আসন্ন</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>হাম</span>
                        <span>৬ মাসে</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">বৃদ্ধি চার্ট</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>বয়স</span>
                        <span>৬ মাস</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>ওজন</span>
                        <span>৭.২ কেজি</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>উচ্চতা</span>
                        <span>৬৫ সেমি</span>
                    </div>
                    <div class="bg-gray-50 p-2 rounded text-center">
                        <span class="primary-text">স্বাভাবিক বৃদ্ধি</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">পুষ্টি গাইড</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-baby primary-text mr-3"></i>
                        <span>মায়ের দুধ (৬ মাস পর্যন্ত)</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-carrot primary-text mr-3"></i>
                        <span>শাকসবজি পিউরি</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-apple-alt primary-text mr-3"></i>
                        <span>ফলের রস</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্যবিধি</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-soap primary-text mr-3"></i>
                        <span>হাত ধোয়ার অভ্যাস</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-tooth primary-text mr-3"></i>
                        <span>দাঁতের যত্ন</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">বিকাশমান বয়স</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-graduation-cap primary-text mr-3"></i>
                        <span>শিক্ষা এবং স্বাস্থ্য ভারসাম্য</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-book primary-text mr-3"></i>
                        <span>পড়ার অভ্যাস</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadMentalHealthModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">আজকের মেজাজ</h3>
                <div class="grid grid-cols-3 gap-2">
                    <button class="p-3 bg-gray-50 rounded-lg text-center hover-opacity focus-ring">
                        <i class="fas fa-smile text-2xl primary-text"></i>
                        <p class="text-xs mt-1">ভালো</p>
                    </button>
                    <button class="p-3 bg-gray-50 rounded-lg text-center hover-opacity focus-ring">
                        <i class="fas fa-meh text-2xl primary-text"></i>
                        <p class="text-xs mt-1">ঠিক আছে</p>
                    </button>
                    <button class="p-3 bg-gray-50 rounded-lg text-center hover-opacity focus-ring">
                        <i class="fas fa-frown text-2xl primary-text"></i>
                        <p class="text-xs mt-1">খারাপ</p>
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ধ্যান ও শ্বাসব্যায়াম</h3>
                <div class="space-y-2">
                    <button class="w-full primary-bg text-white py-3 rounded-lg flex items-center justify-center hover-opacity focus-ring">
                        <i class="fas fa-play mr-2"></i>
                        ৫ মিনিটের শ্বাসব্যায়াম
                    </button>
                    <button class="w-full primary-bg text-white py-3 rounded-lg flex items-center justify-center hover-opacity focus-ring">
                        <i class="fas fa-play mr-2"></i>
                        ১০ মিনিটের ধ্যান
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বেচ্ছাসেবক সাহায্য</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <i class="fas fa-user-md primary-text mr-3"></i>
                            <span>ডা. ফারজানা</span>
                        </div>
                        <button class="primary-text">যোগাযোগ</button>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <i class="fas fa-user-nurse primary-text mr-3"></i>
                            <span>নার্স রুমা</span>
                        </div>
                        <button class="primary-text">যোগাযোগ</button>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">বেনামী সাপোর্ট গ্রুপ</h3>
                <button class="w-full primary-bg text-white py-3 rounded-lg hover-opacity focus-ring">
                    <i class="fas fa-users mr-2"></i>
                    গ্রুপে যোগ দিন
                </button>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">আত্ম-সহায়তা</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-book primary-text mr-3"></i>
                        <span>জার্নাল লেখা</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-paint-brush primary-text mr-3"></i>
                        <span>আঁকা বা শিল্প</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadChronicIllnessModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">আপনার অবস্থা</h3>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-3" checked>
                        <span>ডায়াবেটিস</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-3">
                        <span>উচ্চ রক্তচাপ</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-3">
                        <span>হৃদরোগ</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" class="mr-3">
                        <span>অ্যাজমা</span>
                    </label>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">দৈনিক ট্র্যাকিং</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>রক্তের শর্করা</span>
                        <input type="number" placeholder="mg/dL" class="w-24 px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <div class="flex items-center justify-between">
                        <span>রক্তচাপ</span>
                        <input type="text" placeholder="120/80" class="w-24 px-3 py-1 border border-primary rounded focus-ring">
                    </div>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        সংরক্ষণ করুন
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ওষুধের তালিকা</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>মেটফরমিন</span>
                        <span>দৈনিক ২ বার</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>গ্লাইমেপাইরাইড</span>
                        <span>দৈনিক ১ বার</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">পারিবারিক ইতিহাস</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-dna primary-text mr-3"></i>
                        <span>উত্তরাধিকারসূত্রে প্রাপ্ত ঝুঁকি</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-shield-alt primary-text mr-3"></i>
                        <span>প্রতিরোধমূলক ব্যবস্থা</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ডাক্তারের পরামর্শ</h3>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm">পরবর্তী সাক্ষাৎ: ১৫ ডিসেম্বর, ২০২৩</p>
                    <p class="text-sm">ডা. আহমেদ, বিএমডিসি হাসপাতাল</p>
                </div>
            </div>
        </div>
    `;
}

function loadReligionModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">আজকের প্রেরণা</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-lg italic">"সুস্থ থাকা ঈমানের অংশ"</p>
                    <p class="text-sm mt-2 primary-text">- হাদিস</p>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">প্রার্থনা রিমাইন্ডার</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ফজর</span>
                        <span>৪:৩০ AM</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>যোহর</span>
                        <span>১২:০০ PM</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>আসর</span>
                        <span>৩:৩০ PM</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>মাগরিব</span>
                        <span>৫:৩০ PM</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>এশা</span>
                        <span>৭:০০ PM</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্য ও ধর্ম</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-book primary-text mr-3"></i>
                        <span>রোজায় স্বাস্থ্য সুরক্ষা</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-hands primary-text mr-3"></i>
                        <span>নামাজের স্বাস্থ্য উপকারিতা</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-moon primary-text mr-3"></i>
                        <span>তাহাজ্জুদ ও মানসিক শান্তি</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">দোয়া ও সুরা</h3>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm">আয়াতুল কুরসি পড়ুন প্রতিদিন</p>
                    <button class="mt-2 primary-text text-sm">শুনুন</button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ধর্মীয় অনুপ্রেরণা</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <i class="fas fa-heart primary-text mr-3"></i>
                        <span>দৈনিক ইতিবাচক বার্তা</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-smile primary-text mr-3"></i>
                        <span>কৃতজ্ঞতা অনুশীলন</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadEmergencyModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="primary-bg text-white rounded-xl p-6 shadow-lg">
                <h3 class="font-bold text-2xl mb-4">জরুরি সেবা</h3>
                <button class="w-full bg-white text-primary py-4 rounded-lg font-bold text-xl pulse-animation hover-opacity focus-ring">
                    <i class="fas fa-phone-alt mr-2"></i>
                    ৯৯৯ - জরুরি নম্বর
                </button>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">জরুরি যোগাযোগ</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>অ্যাম্বুলেন্স</span>
                        <button class="primary-text font-bold">১৬২৬৩</button>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ফায়ার সার্ভিস</span>
                        <button class="primary-text font-bold">১৬১</button>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>পুলিশ</span>
                        <button class="primary-text font-bold">১০০</button>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">প্রথম সহায়তা</h3>
                <div class="space-y-2">
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        <i class="fas fa-heartbeat mr-2"></i>
                        CPR গাইড
                    </button>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        <i class="fas fa-band-aid mr-2"></i>
                        ক্ষত চিকিৎসা
                    </button>
                    <button class="w-full primary-bg text-white py-2 rounded-lg hover-opacity focus-ring">
                        <i class="fas fa-fire-extinguisher mr-2"></i>
                        পোড়া চিকিৎসা
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">নিকটস্থ হাসপাতাল</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                            <p class="font-semibold">সদর হাসপাতাল</p>
                            <p class="text-xs primary-text">২ কিমি দূরে</p>
                        </div>
                        <button class="primary-text">নির্দেশনা</button>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                            <p class="font-semibold">মেডিকেয়ার হাসপাতাল</p>
                            <p class="text-xs primary-text">৫ কিমি দূরে</p>
                        </div>
                        <button class="primary-text">নির্দেশনা</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadLearningModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্য শিক্ষা</h3>
                <div class="space-y-2">
                    <button class="w-full primary-bg text-white py-3 rounded-lg text-left hover-opacity focus-ring">
                        <i class="fas fa-video mr-2"></i>
                        হাত ধোয়ার সঠিক পদ্ধতি
                    </button>
                    <button class="w-full primary-bg text-white py-3 rounded-lg text-left hover-opacity focus-ring">
                        <i class="fas fa-video mr-2"></i>
                        স্বাস্থ্যকর খাদ্যাভ্যাস
                    </button>
                    <button class="w-full primary-bg text-white py-3 rounded-lg text-left hover-opacity focus-ring">
                        <i class="fas fa-video mr-2"></i>
                        ডেঙ্গু প্রতিরোধ
                    </button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">কুইজ</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="font-semibold mb-2">প্রশ্ন: দৈনিক কত গ্লাস পানি পান করা উচিত?</p>
                    <div class="space-y-2 mt-3">
                        <button class="w-full bg-white p-2 rounded border border-primary hover-opacity focus-ring">৪ গ্লাস</button>
                        <button class="w-full bg-white p-2 rounded border border-primary hover-opacity focus-ring">৬ গ্লাস</button>
                        <button class="w-full primary-bg text-white p-2 rounded hover-opacity focus-ring">৮ গ্লাস</button>
                        <button class="w-full bg-white p-2 rounded border border-primary hover-opacity focus-ring">১০ গ্লাস</button>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">তথ্য পুস্তিকা</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>মা ও শিশু স্বাস্থ্য</span>
                        <i class="fas fa-download primary-text"></i>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>পুষ্টি গাইড</span>
                        <i class="fas fa-download primary-text"></i>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>ডায়াবেটিস নিয়ন্ত্রণ</span>
                        <i class="fas fa-download primary-text"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadContactModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্য স্বেচ্ছাসেবক</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-12 h-12 primary-bg rounded-full flex items-center justify-center text-white mr-3">
                                <i class="fas fa-user-md"></i>
                            </div>
                            <div>
                                <p class="font-semibold">ডা. রহিম</p>
                                <p class="text-xs primary-text">সাধারণ চিকিৎসক</p>
                            </div>
                        </div>
                        <button class="primary-bg text-white px-4 py-2 rounded-lg hover-opacity focus-ring">
                            <i class="fas fa-phone"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-12 h-12 primary-bg rounded-full flex items-center justify-center text-white mr-3">
                                <i class="fas fa-user-nurse"></i>
                            </div>
                            <div>
                                <p class="font-semibold">নার্স ফাতেমা</p>
                                <p class="text-xs primary-text">মা ও শিশু বিশেষজ্ঞ</p>
                            </div>
                        </div>
                        <button class="primary-bg text-white px-4 py-2 rounded-lg hover-opacity focus-ring">
                            <i class="fas fa-phone"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">হেল্পলাইন</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>স্বাস্থ্য বাতায়ন</span>
                        <span class="primary-text font-bold">১৬২৬৩</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>মানসিক স্বাস্থ্য হেল্পলাইন</span>
                        <span class="primary-text font-bold">১৯৯০</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">বার্তা পাঠান</h3>
                <textarea placeholder="আপনার সমস্যা লিখুন..." class="w-full px-3 py-2 border border-primary rounded-lg h-32 focus-ring"></textarea>
                <button class="w-full primary-bg text-white py-2 rounded-lg mt-2 hover-opacity focus-ring">
                    পাঠান
                </button>
            </div>
        </div>
    `;
}

function loadMapModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">নিকটস্থ স্বাস্থ্যসেবা</h3>
                <div id="map"></div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">ফিল্টার</h3>
                <div id="mapFilters">
                    <button class="map-filter-btn active" data-type="all">সব</button>
                    <button class="map-filter-btn" data-type="hospital">হাসপাতাল</button>
                    <button class="map-filter-btn" data-type="clinic">ক্লিনিক</button>
                    <button class="map-filter-btn" data-type="pharmacy">ফার্মেসি</button>
                    <button class="map-filter-btn" data-type="volunteer">স্বেচ্ছাসেবক</button>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">অবস্থান তালিকা</h3>
                <div id="locationList" class="space-y-2">
                    <!-- Location list will be populated here -->
                </div>
            </div>
        </div>
    `;
    
    // Initialize map after content is loaded
    setTimeout(() => {
        initializeMap();
    }, 100);
}

function initializeMap() {
    // Initialize map centered on Bangladesh
    map = L.map('map').setView([23.6850, 90.3563], 7);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);
    
    // Sample healthcare facilities data
    const facilities = [
        {
            name: "ঢাকা মেডিকেল কলেজ হাসপাতাল",
            type: "hospital",
            lat: 23.8223,
            lng: 90.4131,
            address: "শাহবাগ, ঢাকা",
            phone: "02-8616641"
        },
        {
            name: "বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয়",
            type: "hospital",
            lat: 23.8245,
            lng: 90.4153,
            address: "শাহবাগ, ঢাকা",
            phone: "02-9130800"
        },
        {
            name: "ইবনে সিনা হাসপাতাল",
            type: "hospital",
            lat: 23.7589,
            lng: 90.3876,
            address: "ধানমন্ডি, ঢাকা",
            phone: "02-8616600"
        },
        {
            name: "স্কয়ার হাসপাতাল",
            type: "hospital",
            lat: 23.7465,
            lng: 90.3760,
            address: "পান্থপথ, ঢাকা",
            phone: "02-8144400"
        },
        {
            name: "ইবনে সিনা ডায়াগনস্টিক সেন্টার",
            type: "clinic",
            lat: 23.7925,
            lng: 90.4075,
            address: "ধানমন্ডি, ঢাকা",
            phone: "02-8618800"
        },
        {
            name: "পপুলার ডায়াগনস্টিক সেন্টার",
            type: "clinic",
            lat: 23.7589,
            lng: 90.3876,
            address: "ধানমন্ডি, ঢাকা",
            phone: "02-8616600"
        },
        {
            name: "ল্যাবএইড ফার্মেসি",
            type: "pharmacy",
            lat: 23.8103,
            lng: 90.4125,
            address: "ধানমন্ডি, ঢাকা",
            phone: "02-8616600"
        },
        {
            name: "স্বাস্থ্য সেবা স্বেচ্ছাসেবক কেন্দ্র",
            type: "volunteer",
            lat: 23.7954,
            lng: 90.4043,
            address: "ধানমন্ডি, ঢাকা",
            phone: "02-8616600"
        }
    ];
    
    // Add user location marker
    userLocationMarker = L.marker([23.8103, 90.4125], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    
    // Add markers for each facility
    facilities.forEach(facility => {
        const icon = getFacilityIcon(facility.type);
        
        const marker = L.marker([facility.lat, facility.lng], { icon })
            .addTo(map)
            .bindPopup(createPopupContent(facility));
        
        facilityMarkers.push({
            marker,
            type: facility.type,
            facility
        });
    });
    
    // Populate location list
    updateLocationList(facilities);
    
    // Setup filter buttons
    setupMapFilters();
    
    // Try to get user's actual location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Update map view to user's location
                map.setView([lat, lng], 13);
                
                // Update user marker position
                userLocationMarker.setLatLng([lat, lng]);
            },
            error => {
                console.log('Error getting location:', error);
                // Continue with default location
            }
        );
    }
}

function getFacilityIcon(type) {
    const iconConfig = {
        hospital: {
            icon: 'fa-hospital',
            color: '#0B7A55'
        },
        clinic: {
            icon: 'fa-clinic-medical',
            color: '#87B1C4'
        },
        pharmacy: {
            icon: 'fa-pills',
            color: '#0B7A55'
        },
        volunteer: {
            icon: 'fa-user-nurse',
            color: '#87B1C4'
        }
    };
    
    const config = iconConfig[type] || iconConfig.hospital;
    
    return L.divIcon({
        className: 'facility-marker',
        html: `<div class="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center" style="border: 2px solid ${config.color};">
            <i class="fas ${config.icon}" style="color: ${config.color};"></i>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

function createPopupContent(facility) {
    return `
        <div class="facility-popup">
            <h3>${facility.name}</h3>
            <p>${facility.address}</p>
            <p>ফোন: ${facility.phone}</p>
            <div class="popup-buttons">
                <button class="direction-btn" onclick="getDirections(${facility.lat}, ${facility.lng})">
                    <i class="fas fa-directions"></i> দিকনির্দেশ
                </button>
                <button class="call-btn" onclick="callFacility('${facility.phone}')">
                    <i class="fas fa-phone"></i> কল করুন
                </button>
            </div>
        </div>
    `;
}

function updateLocationList(facilities) {
    const locationList = document.getElementById('locationList');
    locationList.innerHTML = '';
    
    facilities.forEach(facility => {
        const locationItem = document.createElement('div');
        locationItem.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
        locationItem.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-map-marker-alt primary-text mr-3"></i>
                <div>
                    <p class="font-semibold">${facility.name}</p>
                    <p class="text-xs primary-text">${facility.address}</p>
                </div>
            </div>
            <button class="primary-text" onclick="focusOnFacility(${facility.lat}, ${facility.lng})">
                দেখুন
            </button>
        `;
        locationList.appendChild(locationItem);
    });
}

function setupMapFilters() {
    const filterButtons = document.querySelectorAll('.map-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter markers
            const filterType = button.getAttribute('data-type');
            filterMarkers(filterType);
        });
    });
}

function filterMarkers(type) {
    facilityMarkers.forEach(({ marker, facility }) => {
        if (type === 'all' || facility.type === type) {
            marker.setOpacity(1);
        } else {
            marker.setOpacity(0.3);
        }
    });
}

function focusOnFacility(lat, lng) {
    map.setView([lat, lng], 15);
    
    // Find and open the marker popup
    const markerData = facilityMarkers.find(({ facility }) => 
        facility.lat === lat && facility.lng === lng
    );
    
    if (markerData) {
        markerData.marker.openPopup();
    }
}

function getDirections(lat, lng) {
    // In a real app, this would open a navigation app or show directions
    alert(`নির্দেশনা পেতে অ্যাপ খুলুন: ${lat}, ${lng}`);
}

function callFacility(phone) {
    // In a real app, this would initiate a phone call
    alert(`কল করতে: ${phone}`);
}

function loadTrackingModule() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">স্বাস্থ্য পরিসংখ্যান</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span>গড় রক্তচাপ</span>
                        <span class="font-bold">১২০/৮০</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>গড় রক্তের শর্করা</span>
                        <span class="font-bold">১১০ mg/dL</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span>গড় ওজন</span>
                        <span class="font-bold">৬৫ কেজি</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">মাসিক প্রতিবেদন</h3>
                <div class="chart-tabs">
                    <div class="chart-tab active" onclick="switchTrackingChart('bloodPressure')">রক্তচাপ</div>
                    <div class="chart-tab" onclick="switchTrackingChart('bloodSugar')">রক্তের শর্করা</div>
                    <div class="chart-tab" onclick="switchTrackingChart('weight')">ওজন</div>
                    <div class="chart-tab" onclick="switchTrackingChart('heartRate')">হৃদস্পন্দন</div>
                </div>
                <div class="chart-container">
                    <canvas id="trackingChart"></canvas>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-md border border-primary">
                <h3 class="font-bold text-lg primary-text mb-3">লক্ষ্য</h3>
                <div class="space-y-2">
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>দৈনিক ১০,০০০ পদক্ষেপ</span>
                        <span class="primary-text">৮৫%</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>৮ গ্লাস পানি</span>
                        <span class="primary-text">৬২%</span>
                    </div>
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>৭ ঘন্টা ঘুম</span>
                        <span class="primary-text">৯০%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize charts after content is loaded
    setTimeout(() => {
        initializeTrackingCharts();
    }, 100);
}

function initializeTrackingCharts() {
    // Destroy existing charts if any
    Object.values(trackingCharts).forEach(chart => {
        if (chart) chart.destroy();
    });
    
    // Generate demo data for the past 30 days
    const labels = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
    }
    
    // Blood pressure data (systolic/diastolic)
    const bloodPressureSystolic = [];
    const bloodPressureDiastolic = [];
    
    for (let i = 0; i < 30; i++) {
        bloodPressureSystolic.push(110 + Math.floor(Math.random() * 20));
        bloodPressureDiastolic.push(70 + Math.floor(Math.random() * 15));
    }
    
    // Blood sugar data
    const bloodSugar = [];
    
    for (let i = 0; i < 30; i++) {
        bloodSugar.push(90 + Math.floor(Math.random() * 40));
    }
    
    // Weight data
    const weight = [];
    let currentWeight = 65;
    
    for (let i = 0; i < 30; i++) {
        currentWeight += (Math.random() - 0.5) * 0.5;
        weight.push(currentWeight.toFixed(1));
    }
    
    // Heart rate data
    const heartRate = [];
    
    for (let i = 0; i < 30; i++) {
        heartRate.push(65 + Math.floor(Math.random() * 15));
    }
    
    // Create blood pressure chart
    const bloodPressureCtx = document.getElementById('trackingChart').getContext('2d');
    trackingCharts.bloodPressure = new Chart(bloodPressureCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'সিস্টোলিক',
                    data: bloodPressureSystolic,
                    borderColor: '#0B7A55',
                    backgroundColor: 'rgba(11, 122, 85, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'ডায়াস্টোলিক',
                    data: bloodPressureDiastolic,
                    borderColor: '#87B1C4',
                    backgroundColor: 'rgba(135, 177, 196, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'mmHg'
                    }
                }
            }
        }
    });
    
    // Store other chart data for later use
    trackingCharts.bloodSugarData = {
        labels: labels,
        data: bloodSugar
    };
    
    trackingCharts.weightData = {
        labels: labels,
        data: weight
    };
    
    trackingCharts.heartRateData = {
        labels: labels,
        data: heartRate
    };
}

function switchTrackingChart(chartType) {
    // Update active tab
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Destroy current chart
    if (trackingCharts.bloodPressure) {
        trackingCharts.bloodPressure.destroy();
    }
    
    // Create new chart based on type
    const ctx = document.getElementById('trackingChart').getContext('2d');
    
    switch(chartType) {
        case 'bloodPressure':
            initializeTrackingCharts();
            break;
            
        case 'bloodSugar':
            trackingCharts.bloodSugar = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trackingCharts.bloodSugarData.labels,
                    datasets: [{
                        label: 'রক্তের শর্করা',
                        data: trackingCharts.bloodSugarData.data,
                        borderColor: '#0B7A55',
                        backgroundColor: 'rgba(11, 122, 85, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'mg/dL'
                            }
                        }
                    }
                }
            });
            break;
            
        case 'weight':
            trackingCharts.weight = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trackingCharts.weightData.labels,
                    datasets: [{
                        label: 'ওজন',
                        data: trackingCharts.weightData.data,
                        borderColor: '#0B7A55',
                        backgroundColor: 'rgba(11, 122, 85, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'কেজি'
                            }
                        }
                    }
                }
            });
            break;
            
        case 'heartRate':
            trackingCharts.heartRate = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trackingCharts.heartRateData.labels,
                    datasets: [{
                        label: 'হৃদস্পন্দন',
                        data: trackingCharts.heartRateData.data,
                        borderColor: '#0B7A55',
                        backgroundColor: 'rgba(11, 122, 85, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'bpm'
                            }
                        }
                    }
                }
            });
            break;
    }
}

function loadSettingsModule() {
    document.getElementById('moduleView').classList.add('hidden');
    document.getElementById('settingsModal').classList.remove('hidden');
}

function backToDashboard() {
    document.getElementById('moduleView').classList.add('hidden');
    document.getElementById('settingsModal').classList.add('hidden');
    document.getElementById('communityModule').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

// Voice functions
function toggleVoiceAssistant() {
    const voiceBtn = document.getElementById('voiceAssistant');
    voiceBtn.classList.toggle('active');
    
    if (voiceBtn.classList.contains('active')) {
        startVoiceRecognition();
    } else {
        stopVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'bn-BD';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = function(event) {
            const command = event.results[0][0].transcript;
            processVoiceCommand(command);
        };
        
        recognition.start();
    }
}

function stopVoiceRecognition() {
    // Stop voice recognition
}

function processVoiceCommand(command) {
    // Process voice commands
    console.log('Voice command:', command);
}

function speakText(text) {
    if ('speechSynthesis' in window && voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'bn-BD';
        speechSynthesis.speak(utterance);
    }
}

function toggleVoiceForModule() {
    const moduleTitle = document.getElementById('moduleTitle').textContent;
    speakText(moduleTitle);
}

// Data sharing functions
function showDataSharingOptions() {
    document.getElementById('dataSharingModal').classList.remove('hidden');
}

function saveDataSharingSettings() {
    // Save data sharing preferences
    closeModal('dataSharingModal');
    speakText('ডেটা শেয়ারিং সেটিংস সংরক্ষিত হয়েছে');
}

// Notification functions
function showNotifications() {
    // Show notifications
}

function showProfile() {
    // Show user profile
}

// Sync offline data
function syncOfflineData() {
    // Sync data when online
}

// Update language
function updateLanguage() {
    // Update UI language based on selection
}

// Logout function
function logout() {
    isLoggedIn = false;
    userProfile = {};
    document.getElementById('settingsModal').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    speakText('লগআউট সফল হয়েছে');
}