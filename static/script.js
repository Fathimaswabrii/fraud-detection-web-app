// DOM Elements
const predictionForm = document.getElementById('prediction-form');
const resultContainer = document.getElementById('result-container');
const predictionResult = document.getElementById('prediction-result');
const probabilityValue = document.getElementById('probability-value');
const probabilityBar = document.getElementById('probability-bar');
const resultIcon = document.getElementById('result-icon');
const transactionId = document.getElementById('transaction-id');
const fillSampleButton = document.getElementById('fill-sample');
const recentTransactionsList = document.getElementById('recent-transactions-list');

// Chart Variable
let transactionsChart = null;

// Function to generate random values within a range
function getRandomValue(min, max, decimals = 6) {
    const rand = Math.random() * (max - min) + min;
    return parseFloat(rand.toFixed(decimals));
}

// Generate sample amount
function generateSampleAmount() {
    return getRandomValue(1, 1000, 2);
}

// Fill form with random sample amount
fillSampleButton.addEventListener('click', function() {
    const sampleAmount = generateSampleAmount();
    const amountInput = document.getElementById('Amount');
    if (amountInput) {
        amountInput.value = sampleAmount;
    }
    
    // Optional: Clear any previous results
    resultContainer.classList.add('hidden');
    transactionId.classList.add('hidden');
});

// Handle form submission
predictionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    predictionResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing transaction...';
    predictionResult.className = 'result-legitimate';
    resultContainer.classList.remove('hidden');
    
    // Collect form data
    const formData = new FormData(predictionForm);
    
    // Send prediction request
    fetch('/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display result
            const isFraud = data.is_fraud;
            const probability = data.fraud_probability;
            
            predictionResult.textContent = data.prediction;
            predictionResult.className = isFraud ? 'result-fraud' : 'result-legitimate';
            
            // Update probability meter
            probabilityValue.textContent = `${probability}%`;
            probabilityBar.style.width = `${probability}%`;
            
            // Update icon
            resultIcon.innerHTML = isFraud 
                ? '<i class="fas fa-exclamation-triangle" style="color: #e74a3b;"></i>' 
                : '<i class="fas fa-check-circle" style="color: #1cc88a;"></i>';
            
            // Show transaction ID
            transactionId.textContent = `Transaction ID: #${data.transaction_id}`;
            transactionId.classList.remove('hidden');
            
            // Update statistics and recent transactions
            updateStatistics();
            loadRecentTransactions();
            
            // Update chart
            updateChart();
        } else {
            predictionResult.textContent = `Error: ${data.error}`;
            predictionResult.className = 'result-fraud';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        predictionResult.textContent = 'Error making prediction. Please try again.';
        predictionResult.className = 'result-fraud';
    });
});

// Load and display recent transactions
function loadRecentTransactions() {
    fetch('/api/transactions')
        .then(response => response.json())
        .then(transactions => {
            // Get the 5 most recent transactions
            const recent = transactions.slice(-5).reverse();
            
            if (recent.length === 0) {
                recentTransactionsList.innerHTML = '<p class="loading-text">No transactions yet</p>';
                return;
            }
            
            let html = '';
            recent.forEach(transaction => {
                const isFraud = transaction.is_fraud;
                const statusClass = isFraud ? 'status-fraud' : 'status-legitimate';
                const statusText = isFraud ? 'Fraud' : 'Legitimate';
                const icon = isFraud ? 'fa-exclamation-triangle' : 'fa-check-circle';
                
                html += `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <h4>Transaction #${transaction.id}</h4>
                            <p>${transaction.timestamp} • $${transaction.Amount.toFixed(2)}</p>
                        </div>
                        <div class="transaction-status ${statusClass}">
                            <i class="fas ${icon}"></i> ${statusText}
                        </div>
                    </div>
                `;
            });
            
            recentTransactionsList.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            recentTransactionsList.innerHTML = '<p class="loading-text">Error loading transactions</p>';
        });
}

// Update statistics display
function updateStatistics() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(stats => {
            document.getElementById('total-transactions').textContent = stats.total;
            document.getElementById('legitimate-count').textContent = stats.legitimate_count;
            document.getElementById('fraud-count').textContent = stats.fraud_count;
            document.getElementById('fraud-percentage').textContent = `${stats.fraud_percentage}%`;
        })
        .catch(error => console.error('Error loading stats:', error));
}

// Initialize and update the chart
function updateChart() {
    fetch('/api/transactions')
        .then(response => response.json())
        .then(transactions => {
            // Group transactions by hour of the day
            const hourlyData = {
                labels: [],
                fraudCount: [],
                legitimateCount: []
            };
            
            // Initialize hours (0-23)
            for (let i = 0; i < 24; i++) {
                hourlyData.labels.push(`${i}:00`);
                hourlyData.fraudCount.push(0);
                hourlyData.legitimateCount.push(0);
            }
            
            // Count transactions by hour
            transactions.forEach(transaction => {
                const hour = new Date(transaction.timestamp).getHours();
                if (transaction.is_fraud) {
                    hourlyData.fraudCount[hour]++;
                } else {
                    hourlyData.legitimateCount[hour]++;
                }
            });
            
            // Get chart canvas context
            const ctx = document.getElementById('transactionsChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (transactionsChart) {
                transactionsChart.destroy();
            }
            
            // Create new chart
            transactionsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hourlyData.labels,
                    datasets: [
                        {
                            label: 'Legitimate',
                            data: hourlyData.legitimateCount,
                            backgroundColor: 'rgba(28, 200, 138, 0.7)',
                            borderColor: 'rgba(28, 200, 138, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Fraud',
                            data: hourlyData.fraudCount,
                            backgroundColor: 'rgba(231, 74, 59, 0.7)',
                            borderColor: 'rgba(231, 74, 59, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Hour of Day'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Transactions'
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Transactions by Hour'
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Error loading chart data:', error));
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    updateStatistics();
    loadRecentTransactions();
    updateChart();
    
    // Set up auto-refresh for statistics (every 30 seconds)
    setInterval(updateStatistics, 30000);
});