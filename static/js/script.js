document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let currentResults = null;
    
    // DOM Elements
    const predictionForm = document.getElementById('predictionForm');
    const resetBtn = document.getElementById('resetBtn');
    const resultsPlaceholder = document.getElementById('resultsPlaceholder');
    const resultsDisplay = document.getElementById('resultsDisplay');
    const sampleProfiles = document.getElementById('sampleProfiles');
    const globalStats = document.getElementById('globalStats');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Feature configurations
    const features = [
        { id: 'Pregnancies', min: 0, max: 20, step: 1, defaultValue: 2 },
        { id: 'Glucose', min: 0, max: 300, step: 1, defaultValue: 120 },
        { id: 'BloodPressure', min: 0, max: 140, step: 1, defaultValue: 72 },
        { id: 'SkinThickness', min: 0, max: 100, step: 1, defaultValue: 29 },
        { id: 'Insulin', min: 0, max: 900, step: 1, defaultValue: 125 },
        { id: 'BMI', min: 0, max: 70, step: 0.1, defaultValue: 25.5 },
        { id: 'DiabetesPedigreeFunction', min: 0.08, max: 2.5, step: 0.01, defaultValue: 0.35 },
        { id: 'Age', min: 20, max: 100, step: 1, defaultValue: 35 }
    ];
    
    // Initialize form controls
    function initializeForm() {
        features.forEach(feature => {
            const input = document.getElementById(feature.id);
            const slider = document.getElementById(feature.id + 'Slider');
            const valueDisplay = document.getElementById(feature.id + 'Value');
            
            if (input && slider && valueDisplay) {
                // Set initial values
                input.value = feature.defaultValue;
                slider.value = feature.defaultValue;
                valueDisplay.textContent = feature.defaultValue;
                
                // Add event listeners
                input.addEventListener('input', function() {
                    let value = parseFloat(this.value) || 0;
                    
                    // Constrain value
                    if (value < feature.min) value = feature.min;
                    if (value > feature.max) value = feature.max;
                    
                    this.value = value;
                    slider.value = value;
                    valueDisplay.textContent = value.toFixed(feature.id === 'BMI' || feature.id === 'DiabetesPedigreeFunction' ? 1 : 0);
                });
                
                slider.addEventListener('input', function() {
                    let value = parseFloat(this.value) || 0;
                    input.value = value;
                    valueDisplay.textContent = value.toFixed(feature.id === 'BMI' || feature.id === 'DiabetesPedigreeFunction' ? 1 : 0);
                });
            }
        });
    }
    
    // Load sample profiles
    async function loadSampleProfiles() {
        try {
            const response = await fetch('/sample_data');
            const profiles = await response.json();
            
            sampleProfiles.innerHTML = '';
            profiles.forEach(profile => {
                const profileCard = document.createElement('div');
                profileCard.className = 'profile-card';
                profileCard.style.background = profile.color + '15';
                profileCard.style.borderColor = profile.color;
                profileCard.innerHTML = `
                    <h5>${profile.name}</h5>
                    <p>${profile.description}</p>
                    <div class="profile-stats">
                        <span>Glucose: ${profile.Glucose}</span>
                        <span class="expected-result" style="color: ${profile.color}; font-weight: 600">
                            ${profile.expected_result}
                        </span>
                    </div>
                `;
                
                profileCard.addEventListener('click', () => loadProfile(profile));
                sampleProfiles.appendChild(profileCard);
            });
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    }
    
    // Load profile into form
    function loadProfile(profile) {
        features.forEach(feature => {
            const input = document.getElementById(feature.id);
            const slider = document.getElementById(feature.id + 'Slider');
            const valueDisplay = document.getElementById(feature.id + 'Value');
            
            if (input && slider && valueDisplay) {
                const value = profile[feature.id];
                input.value = value;
                slider.value = value;
                valueDisplay.textContent = value;
            }
        });
        
        showToast(`Loaded "${profile.name}" profile`, 'success');
    }
    
    // Load global statistics
    async function loadGlobalStats() {
        try {
            const response = await fetch('/health_stats');
            const stats = await response.json();
            
            const statsData = [
                { icon: 'fas fa-users', value: stats.global_diabetes_cases, label: 'Global Diabetes Cases' },
                { icon: 'fas fa-chart-line', value: stats.predicted_2045, label: 'Predicted by 2045' },
                { icon: 'fas fa-heartbeat', value: stats.annual_deaths, label: 'Annual Deaths' },
                { icon: 'fas fa-exclamation-triangle', value: stats.undiagnosed_percentage, label: 'Undiagnosed Cases' }
            ];
            
            globalStats.innerHTML = '';
            statsData.forEach(stat => {
                const statBox = document.createElement('div');
                statBox.className = 'stat-box';
                statBox.innerHTML = `
                    <i class="${stat.icon}"></i>
                    <span class="stat-number">${stat.value}</span>
                    <span class="stat-desc">${stat.label}</span>
                `;
                globalStats.appendChild(statBox);
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // Show loading overlay
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }
    
    // Hide loading overlay
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Add close functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    // Handle form submission
    predictionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {};
        features.forEach(feature => {
            const input = document.getElementById(feature.id);
            formData[feature.id] = parseFloat(input.value) || 0;
        });
        
        // Show loading
        showLoading();
        
        try {
            // Send prediction request
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                currentResults = result;
                displayResults(result);
                showToast('Analysis complete! Results are ready.', 'success');
            } else {
                throw new Error(result.error || 'Prediction failed');
            }
        } catch (error) {
            console.error('Prediction error:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Display results
    function displayResults(result) {
        // Show results display, hide placeholder
        resultsPlaceholder.classList.add('hidden');
        resultsDisplay.classList.remove('hidden');
        
        // Update risk score
        const riskPercentage = result.risk_percentage;
        document.getElementById('riskScore').textContent = riskPercentage.toFixed(1);
        
        // Update risk circle
        const circle = document.getElementById('riskCircle');
        const circumference = 2 * Math.PI * 80;
        const offset = circumference - (riskPercentage / 100) * circumference;
        
        // Set circle color based on risk level
        let circleColor;
        switch (result.risk_level) {
            case 'very_low': circleColor = '#27ae60'; break;
            case 'low': circleColor = '#2ecc71'; break;
            case 'moderate': circleColor = '#f39c12'; break;
            case 'high': circleColor = '#e74c3c'; break;
            default: circleColor = '#3498db';
        }
        
        circle.style.stroke = circleColor;
        circle.style.strokeDashoffset = offset;
        
        // Update risk level
        const riskLevelElement = document.getElementById('riskLevelValue');
        riskLevelElement.textContent = result.risk_label;
        riskLevelElement.style.color = circleColor;
        riskLevelElement.style.background = circleColor + '20';
        
        // Update confidence
        document.getElementById('confidenceValue').textContent = result.confidence_text;
        
        // Update prediction text
        const predictionElement = document.getElementById('predictionText');
        predictionElement.textContent = result.message;
        predictionElement.style.background = circleColor + '20';
        predictionElement.style.color = circleColor;
        predictionElement.style.border = `2px solid ${circleColor}`;
        
        // Update probabilities
        const probDiabetes = result.probability_diabetes * 100;
        const probNoDiabetes = result.probability_no_diabetes * 100;
        
        document.getElementById('probDiabetes').textContent = probDiabetes.toFixed(1) + '%';
        document.getElementById('probNoDiabetes').textContent = probNoDiabetes.toFixed(1) + '%';
        
        // Animate probability bars
        setTimeout(() => {
            document.querySelector('.diabetes-fill').style.width = `${probDiabetes}%`;
            document.querySelector('.healthy-fill').style.width = `${probNoDiabetes}%`;
        }, 300);
        
        // Update key indicators
        updateIndicators(result.features);
        
        // Update recommendations
        updateRecommendations(result.risk_level, riskPercentage);
    }
    
    // Update key indicators
    function updateIndicators(features) {
        const indicatorsGrid = document.getElementById('indicatorsGrid');
        indicatorsGrid.innerHTML = '';
        
        const indicators = [
            {
                name: 'Glucose Level',
                value: features[1],
                unit: 'mg/dL',
                type: 'glucose',
                high: 140,
                low: 70
            },
            {
                name: 'Blood Pressure',
                value: features[2],
                unit: 'mm Hg',
                type: 'pressure',
                high: 90,
                low: 60
            },
            {
                name: 'Body Mass Index',
                value: features[5],
                unit: 'kg/m²',
                type: 'bmi',
                high: 30,
                low: 18.5
            },
            {
                name: 'Age Factor',
                value: features[7],
                unit: 'years',
                type: 'age',
                high: 45,
                low: 20
            }
        ];
        
        indicators.forEach(indicator => {
            const isHigh = indicator.value > indicator.high;
            const isLow = indicator.value < indicator.low;
            const status = isHigh ? 'High' : isLow ? 'Low' : 'Normal';
            const statusClass = isHigh ? 'high' : isLow ? 'moderate' : '';
            
            const indicatorCard = document.createElement('div');
            indicatorCard.className = `indicator-card ${statusClass}`;
            indicatorCard.innerHTML = `
                <h6>${indicator.name}</h6>
                <div class="indicator-value">${indicator.value} ${indicator.unit}</div>
                <span class="indicator-status" style="background: ${getStatusColor(status)}">
                    ${status}
                </span>
            `;
            
            indicatorsGrid.appendChild(indicatorCard);
        });
    }
    
    // Get status color
    function getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'high': return '#e74c3c20';
            case 'low': return '#f39c1220';
            default: return '#2ecc7120';
        }
    }
    
    // Update recommendations
    function updateRecommendations(riskLevel, riskPercentage) {
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        let recommendations = [];
        
        if (riskLevel === 'high' || riskLevel === 'moderate') {
            recommendations = [
                { icon: 'fas fa-user-md', text: 'Consult a healthcare professional immediately' },
                { icon: 'fas fa-heartbeat', text: 'Schedule regular glucose monitoring' },
                { icon: 'fas fa-utensils', text: 'Follow a diabetic-friendly diet plan' },
                { icon: 'fas fa-running', text: 'Engage in 30+ minutes of daily exercise' },
                { icon: 'fas fa-weight', text: 'Aim for healthy BMI range (18.5-24.9)' },
                { icon: 'fas fa-bed', text: 'Ensure 7-8 hours of quality sleep nightly' }
            ];
        } else {
            recommendations = [
                { icon: 'fas fa-calendar-check', text: 'Continue annual health check-ups' },
                { icon: 'fas fa-apple-alt', text: 'Maintain balanced, nutritious diet' },
                { icon: 'fas fa-dumbbell', text: 'Regular physical activity (150 mins/week)' },
                { icon: 'fas fa-weight', text: 'Monitor weight and BMI regularly' },
                { icon: 'fas fa-smile', text: 'Manage stress through mindfulness' },
                { icon: 'fas fa-ban-smoking', text: 'Avoid tobacco and limit alcohol' }
            ];
        }
        
        recommendations.forEach(rec => {
            const item = document.createElement('div');
            item.className = `recommendation-item ${riskLevel}`;
            item.innerHTML = `
                <i class="${rec.icon}"></i>
                <span>${rec.text}</span>
            `;
            recommendationsList.appendChild(item);
        });
    }
    
    // Reset form
    resetBtn.addEventListener('click', function() {
        if (confirm('Reset all values to defaults?')) {
            initializeForm();
            resultsDisplay.classList.add('hidden');
            resultsPlaceholder.classList.remove('hidden');
            showToast('Form reset to default values', 'info');
        }
    });
    
    // Initialize everything
    initializeForm();
    loadSampleProfiles();
    loadGlobalStats();
    
    // Show welcome message
    setTimeout(() => {
        showToast('Welcome to DiabetesPredict Pro! Enter your health data or try sample profiles.', 'info');
    }, 1000);
});