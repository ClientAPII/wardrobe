import { SkinViewer } from "skinview3d";

// Create the SkinViewer instance
const viewer = new SkinViewer({
    canvas: document.getElementById("skinViewer"),
    width: 400,
    height: 600,
    skin: "./steve.png", // Default skin
    model: "classic", // Default to classic model
});

viewer.controls.enableZoom = true;
viewer.controls.enableRotate = true;

let currentSkinBase64 = null; // Store the imported skin in base64 format
let currentModelType = "classic"; // Default to classic
const baseSkins = {
    classic: "./blank-skin-template.png",
    slim: "./blank-skin-template.png",
};

// Function to merge the custom head and body with the base skin
const createCustomSkin = (baseSkinPath, bodyOverlayPath) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const baseImage = new Image();
    const overlayImage = new Image();
    const importedImage = new Image();

    canvas.width = 64;
    canvas.height = 64;

    return new Promise((resolve, reject) => {
        baseImage.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the base skin
            ctx.drawImage(baseImage, 0, 0);

            importedImage.onload = () => {
                // Replace the head from the imported skin
                ctx.drawImage(importedImage, 0, 0, 64, 16, 0, 0, 64, 16);

                overlayImage.onload = () => {
                    // Overlay the custom body texture
                    ctx.drawImage(overlayImage, 0, 0, 64, 64, 0, 0, 64, 64);

                    // Convert the result back to base64
                    const customSkinBase64 = canvas.toDataURL("image/png");
                    resolve(customSkinBase64);
                };

                overlayImage.onerror = () => {
                    console.error("Error loading body overlay image:", bodyOverlayPath);
                    reject(new Error("Failed to load body overlay image."));
                };
                overlayImage.src = bodyOverlayPath;
            };

            importedImage.onerror = () => {
                console.error("Error loading imported skin image:", currentSkinBase64);
                reject(new Error("Failed to load imported skin image."));
            };
            importedImage.src = currentSkinBase64;
        };

        baseImage.onerror = () => {
            console.error("Error loading base skin image:", baseSkinPath);
            reject(new Error("Failed to load base skin image."));
        };
        baseImage.src = baseSkinPath;
    });
};


const updateSkin = async () => {
    const baseSkinPath = baseSkins[currentModelType];
    const bodyOverlayPath = `./${document.getElementById("clothingSelect").value}_${currentModelType}.png`;

    try {
        //console.log("Base skin path:", baseSkinPath);
        //console.log("Body overlay path:", bodyOverlayPath);

        // Create the custom skin
        const customSkin = await createCustomSkin(baseSkinPath, bodyOverlayPath);

        // Recreate the SkinViewer to enforce model changes
        const canvas = document.getElementById("skinViewer");
        viewer.dispose(); // Dispose of the existing SkinViewer instance

        const newViewer = new SkinViewer({
            canvas: canvas,
            width: 400,
            height: 600,
            skin: customSkin,
            model: currentModelType === "slim" ? "slim" : "classic", // Explicitly set the model
        });

        newViewer.controls.enableZoom = true;
        newViewer.controls.enableRotate = true;

        // Replace the old viewer with the new one
        window.viewer = newViewer; // Ensure it's accessible globally if needed

        //console.log("Skin successfully updated for model type:", currentModelType);

        // Enable the download button
        const downloadButton = document.getElementById("downloadButton");
        downloadButton.style.display = "block";
        downloadButton.onclick = () => {
            const link = document.createElement("a");
            link.href = customSkin;
            link.download = "custom_skin.png";
            link.click();
        };
    } catch (error) {
        console.error("Error updating skin:", error);
        alert("Failed to create or apply the custom skin.");
    }
};

// Event listener for file upload
document.getElementById("upload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentSkinBase64 = event.target.result;
            updateSkin(); // Update the 3D model with the uploaded skin
        };
        reader.readAsDataURL(file);
    }
});

// Event listener for username search
document.getElementById("searchButton").addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    if (username) {
        try {
            const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);
            if (!response.ok) {
                alert("Username not found!");
                return;
            }
            const data = await response.json();
            const uuid = data.uuid;

            // Use Crafatar to get the skin
            const skinUrl = `https://crafatar.com/skins/${uuid}`;
            const skinResponse = await fetch(skinUrl);
            const blob = await skinResponse.blob();

            const reader = new FileReader();
            reader.onload = (event) => {
                currentSkinBase64 = event.target.result;

                // Detect if the skin is slim or classic
                const isSlim = data.textures?.slim; // Ashcon API provides this information
                currentModelType = isSlim ? "slim" : "classic";

                updateSkin(); // Update the 3D model with the fetched skin
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            alert("An error occurred while fetching the skin.");
        }
    }
});

// Event listener for clothing selection
document.getElementById("clothingSelect").addEventListener("change", updateSkin);

// Event listener for model type toggle
document.querySelectorAll('.toggle-container input[name="modelType"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
        currentModelType = e.target.value; // Update the model type (classic or slim)
        updateSkin(); // Refresh the 3D model with the new base and overlay
    });
});
