let slideIndex = 0;

function showSlide(n) {
    const slides = document.getElementsByClassName("slide");
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slideIndex = (n + slides.length) % slides.length;
    slides[slideIndex].style.display = "block";
}

// Automatic slideshow
function autoSlide() {
    showSlide(slideIndex + 1);
}

showSlide(slideIndex);
setInterval(autoSlide, 2500); // slides every 2.5 seconds
