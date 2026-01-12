/* Script for Risk Forecast Page Only */
const predictBtn = document.getElementById("predictBtn");
const cropInput = document.getElementById("cropInput");
const countyInput = document.getElementById("countyInput");
const resultDiv = document.getElementById("riskResult");
const loadingDiv = document.getElementById("loading");
const chartWrapper = document.querySelector(".chart-wrapper");
let myChart = null;

if(predictBtn) {
    predictBtn.addEventListener("click", () => {
        const crop = cropInput.value.trim();
        const county = countyInput.value.trim();

        if (!crop) { alert("Please enter a crop name!"); return; }

        resultDiv.innerHTML = "";
        chartWrapper.style.display = "none";
        loadingDiv.style.display = "block";

        // FIXED: Use relative path for production
        fetch("/forecast_risk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                crop_name: crop, 
                county: county 
            })
        })
        .then(res => res.json())
        .then(data => {
            loadingDiv.style.display = "none";

            if (data.error) {
                resultDiv.innerHTML = `<p style="color:red">Error: ${data.error}</p>`;
                return;
            }

            renderChart(data.risks);

            let locationText = data.location ? ` in ${data.location}` : "";
            let html = `<h4>Forecast for: ${data.crop}${locationText}</h4>`;
            
            data.risks.forEach(risk => {
                let riskColor = "#2ecc71"; // Green
                if (risk.probability_score > 70) riskColor = "#e74c3c"; // Red
                else if (risk.probability_score > 40) riskColor = "#f39c12"; // Orange

                html += `
                    <div class="disease-card" style="background:#fff; border-left: 5px solid ${riskColor}; padding:15px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                        <div style="display:flex; justify-content:space-between;">
                            <strong style="color:#333; font-size:1.1em;">${risk.disease_name}</strong>
                            <span style="background:${riskColor}; color:white; padding:2px 8px; border-radius:10px; font-size:0.8em;">
                                ${risk.probability_score}% Risk
                            </span>
                        </div>
                        
                        <p style="margin:5px 0 10px 0; color:#555; font-style:italic; font-size:0.95em;">
                            "${risk.description}"
                        </p>

                        <p style="margin:5px 0; font-size:0.95em; color:#d35400;">
                            <b>🗓️ Likely Period:</b> ${risk.risk_months}
                        </p>

                        <p style="margin:5px 0; font-size:0.9em;"><b>📍 Location:</b> ${risk.affected_counties}</p>
                        <p style="margin:0; font-size:0.9em; color:#555;"><i>☁️ Conditions: ${risk.conditions}</i></p>
                        
                        <div style="margin-top:10px; background:#e8f5e9; padding:8px; border-radius:5px; color:#1b5e20; font-size:0.9em;">
                            <strong>💊 Prevention/Remedy:</strong> ${risk.remedy}
                        </div>
                    </div>
                `;
            });
            resultDiv.innerHTML = html;
        })
        .catch(err => {
            loadingDiv.style.display = "none";
            resultDiv.innerHTML = `<p style="color:red">Server Error. Ensure backend is running.</p>`;
            console.error(err);
        });
    });
}

function renderChart(risks) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    chartWrapper.style.display = "block";

    const labels = risks.map(r => r.disease_name);
    const dataPoints = risks.map(r => r.probability_score);
    const colors = dataPoints.map(s => s > 70 ? '#e74c3c' : (s > 40 ? '#f39c12' : '#2ecc71'));

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Risk Probability (%)',
                data: dataPoints,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}