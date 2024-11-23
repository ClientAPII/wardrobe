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

let currentSkinBase64 = null; // Store the current skin in base64 format
let currentModelType = "classic"; // Default to classic

// Function to overlay the selected clothing onto the skin
const overlayClothing = (clothingPath) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const skinImage = new Image();
    const clothingImage = new Image();

    canvas.width = 64;
    canvas.height = 64;

    return new Promise((resolve) => {
        skinImage.onload = () => {
            // Draw the base skin
            ctx.drawImage(skinImage, 0, 0, 64, 16, 0, 0, 64, 16);

            clothingImage.onload = () => {
                // Overlay the selected clothing texture
                ctx.drawImage(clothingImage, 0, 0, 64, 64);

                // Convert the modified skin back to base64
                const modifiedSkinBase64 = canvas.toDataURL("image/png");
                resolve(modifiedSkinBase64);
            };

            clothingImage.src = clothingPath; // Path to the selected clothing texture
        };

        skinImage.src = currentSkinBase64;
    });
};

// Function to update the 3D viewer with selected clothing
const updateSkin = async () => {
  const clothingPath = `./${document.getElementById("clothingSelect").value}_${currentModelType}.png`;

  try {
      // Apply the selected clothing overlay
      const modifiedSkin = await overlayClothing(clothingPath);

      // Load the modified skin into the viewer
      viewer.loadSkin(modifiedSkin);

      // Force the correct model type (classic or slim)
      if (currentModelType === "classic") {
          viewer.playerObject.skin.slim = false; // Force classic
          viewer.playerObject.skin.model = "classic"; // Explicitly set to classic
      } else {
          viewer.playerObject.skin.slim = true; // Force slim
          viewer.playerObject.skin.model = "slim"; // Explicitly set to slim
      }

      // Enable the download button
      const downloadButton = document.getElementById("downloadButton");
      downloadButton.style.display = "block";
      downloadButton.onclick = () => {
          const link = document.createElement("a");
          link.href = modifiedSkin;
          link.download = "modified_skin.png";
          link.click();
      };
  } catch (error) {
      console.error("Error updating skin:", error);
      alert("Failed to load or apply the selected clothing.");
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
        updateSkin(); // Refresh the 3D model with the selected type
    });
});