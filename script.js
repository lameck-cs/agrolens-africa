/* Updated Script - Handles Bullet Points & Common Regions */

const preview = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const cameraBtn = document.getElementById("cameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const identifyBtn = document.getElementById("identifyBtn");

let currentFile = null;
let currentStream = null;

// Helper to format arrays into lists
function formatList(items) {
    if (Array.isArray(items)) {
        return `<ul style="margin: 5px 0 10px 20px; padding: 0; list-style-type: disc;">
                    ${items.map(i => `<li style="margin-bottom: 5px;">${i}</li>`).join('')}
                </ul>`;
    }
    return items; 
}

// 1. FILE UPLOAD
if(imageInput) {
    imageInput.addEventListener("change", function() {
        if (this.files && this.files[0]) {
            currentFile = this.files[0];
            preview.src = URL.createObjectURL(currentFile);
            preview.style.display = "block";
            if(video) video.style.display = "none";
            stopCamera();
            document.getElementById("plantName").innerHTML = "";
        }
    });
}

// 2. CAMERA LOGIC
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    if(video) video.style.display = "none";
    if(stopCameraBtn) stopCameraBtn.style.display = "none";
    if(cameraBtn) cameraBtn.style.display = "block";
}

if(cameraBtn) {
    cameraBtn.addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                currentStream = stream;
                video.srcObject = stream;
                video.style.display = "block";
                video.play();
                preview.style.display = "none";
                cameraBtn.style.display = "none";
                stopCameraBtn.style.display = "block";

                video.onclick = () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(blob => {
                        currentFile = new File([blob], "camera.jpg", { type: "image/jpeg" });
                        preview.src = URL.createObjectURL(currentFile);
                        preview.style.display = "block";
                        stopCamera();
                    }, "image/jpeg", 0.95);
                };
            })
            .catch(err => alert("Camera error: " + err));
    });
}

if(stopCameraBtn) stopCameraBtn.addEventListener("click", stopCamera);

// 3. IDENTIFY LOGIC
if(identifyBtn) {
    identifyBtn.addEventListener("click", () => {
        if (!currentFile) {
            alert("Please upload an image first.");
            return;
        }

        const formData = new FormData();
        formData.append("image", currentFile);

        const resultDiv = document.getElementById("plantName");
        resultDiv.innerHTML = `
            <div style="text-align:center; padding:30px; color:#555;">
                <p><strong>Analyzing Image...</strong></p>
                <p>🤖 AI Expert is diagnosing...</p>
            </div>`;

        // FIXED: Use relative path for production
        fetch("/identify", { method: "POST", body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.error) { resultDiv.innerHTML = `<span style="color:red">Error: ${data.error}</span>`; return; }

            let htmlContent = `
                <div style="border-bottom: 2px solid #a5d6a7; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color:#1b5e20; margin:0;">${data.plant_name}</h2>
                    <p style="font-style:italic; color:#2e7d32; margin:0;">${data.scientific_name}</p>
                    <span style="background:${data.is_healthy ? '#2ecc71' : '#e74c3c'}; color:white; padding:5px 12px; border-radius:15px; font-weight:bold; font-size:0.9em;">
                        ${data.is_healthy ? '✅ Healthy' : '⚠️ Disease Detected'}
                    </span>
                </div>
                <p style="color:#1b3a1b; line-height:1.5;">${data.description}</p>
            `;

            if (data.diagnoses && data.diagnoses.length > 0) {
                htmlContent += `<div id="diseaseList">`;
                data.diagnoses.forEach((disease, index) => {
                    let imgHTML = "";
                    if(disease.images && disease.images.length > 0) {
                        imgHTML = `<div style="display:flex; gap:10px; margin-bottom:10px;">`;
                        disease.images.forEach(img => imgHTML += `<img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:5px;">`);
                        imgHTML += `</div>`;
                    }

                    htmlContent += `
                        <div class="disease-card" style="background:#f9fbe7; border-left: 5px solid #8bc34a; padding:15px; margin-bottom:15px; border-radius:4px;">
                            <strong style="color:#33691e; font-size: 1.1em;">${disease.name}</strong>
                            ${imgHTML}
                            
                            <div style="margin: 5px 0; color:#d35400; font-size: 0.9em;">
                                🌍 <b>Common in:</b> ${disease.common_regions || "Widespread in Kenya"}
                            </div>

                            <div style="margin: 10px 0;">
                                <b style="color:#555;">Symptoms:</b>
                                <div style="color:#333;">${formatList(disease.symptoms)}</div>
                            </div>
                            
                            <div style="background:#e8f5e9; color:#1b5e20; padding:10px; border-radius:5px; margin-top:10px;">
                                <strong>💊 Remedy:</strong>
                                <div style="margin-top:5px;">${formatList(disease.remedy)}</div>
                            </div>
                        </div>`;
                });
                htmlContent += `</div>`;
            } 
            
            htmlContent += `<div style="text-align:center; margin-top:25px;"><button onclick="location.reload()" style="background:#558b2f; padding:10px 20px;">🔄 Identify Another Plant</button></div>`;
            resultDiv.innerHTML = htmlContent;
        })
        .catch(err => {
            console.error(err);
            resultDiv.innerHTML = `<span style="color:red">Server Error. Ensure backend is running.</span>`;
        });
    });
}