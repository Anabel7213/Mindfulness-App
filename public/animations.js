const inquiryIcon = document.querySelector(".fa-circle-question");
const closeIcon = document.querySelector(".fa-xmark");
const devNote = document.querySelector(".dev-note-container");

closeIcon.addEventListener("click", () => {
    devNote.classList.replace("d-flex", "d-none");
    inquiryIcon.classList.remove("d-none");
});

inquiryIcon.addEventListener("click", () => {
    devNote.classList.replace("d-none", "d-flex");
    inquiryIcon.classList.add("d-none");
});

    // Function to get the category name from the current URL
    function getCategoryName() {
        const parts = window.location.pathname.split('/');
        return parts[parts.length - 1];
    }

    // Update the href attribute for each category button
    document.addEventListener('DOMContentLoaded', () => {
        const categoryName = getCategoryName();

        document.getElementById('contemplate-btn').href = `/composer/contemplate`;
        document.getElementById('reflect-btn').href = `/composer/reflect`;
        document.getElementById('explore-btn').href = `/composer/explore`;
        document.getElementById('wonder-btn').href = `/composer/wonder`;
    });