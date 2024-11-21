import { SkinViewer } from "skinview3d";

// Create the SkinViewer instance
const viewer = new SkinViewer({
  canvas: document.getElementById("skinViewer"),
  width: 400,
  height: 600,
  skin: null, // Default to null until a skin is loaded
});

// Add controls for interaction
viewer.controls.enableZoom = true;
viewer.controls.enableRotate = true;

let currentSkinBase64 = null; // Store the current skin in base64 format

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
      ctx.drawImage(skinImage, 0, 0, 64, 64);

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

// Function to update the 3D viewer and download link with the selected clothing
const updateClothing = async () => {
  const clothingPath = document.getElementById("clothingSelect").value;
  const modifiedSkin = await overlayClothing(clothingPath);

  viewer.loadSkin(modifiedSkin);

  // Enable and configure download button
  const downloadButton = document.getElementById("downloadButton");
  downloadButton.style.display = "block";
  downloadButton.onclick = () => {
    const link = document.createElement("a");
    link.href = modifiedSkin;
    link.download = "modified_skin.png";
    link.click();
  };
};

// Event listener for file upload
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      currentSkinBase64 = event.target.result;
      updateClothing(); // Update the 3D model with the selected clothing
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
        updateClothing(); // Update the 3D model with the selected clothing
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      alert("An error occurred while fetching the skin.");
    }
  }
});

// Event listener for clothing selection
document.getElementById("clothingSelect").addEventListener("change", updateClothing);