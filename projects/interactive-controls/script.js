const button = document.getElementById("actionButton");
const message = document.getElementById("message");

if (button && message) {
    button.addEventListener("click", () => {
        message.textContent =
            "VEXORITE says: Website is working.";

        button.textContent = "WORKING ✓";
    });
}
