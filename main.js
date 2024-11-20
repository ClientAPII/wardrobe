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

// Function to overlay the robe texture onto the skin
const overlayRobe = (skinBase64) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const skinImage = new Image();
  const robeImage = new Image();

  canvas.width = 64;
  canvas.height = 64;

  return new Promise((resolve) => {
    skinImage.onload = () => {
      // Draw the base skin
      ctx.drawImage(skinImage, 0, 0, 64, 64);

      robeImage.onload = () => {
        // Overlay the robe texture
        ctx.drawImage(robeImage, 0, 0, 64, 64);

        // Convert the modified skin back to base64
        const modifiedSkinBase64 = canvas.toDataURL("image/png");
        resolve(modifiedSkinBase64);
      };

      // Path to the robe texture
      robeImage.src = "./public/robe.png"; // Adjust this path based on your folder structure
    };

    // Load the base skin image
    skinImage.src = skinBase64;
  });
};

// Function to load a skin
const loadSkin = async (skinUrl) => {
  const response = await fetch(skinUrl);
  const blob = await response.blob();
  const reader = new FileReader();

  reader.onload = async (event) => {
    const skinBase64 = event.target.result;
    const modifiedSkin = await overlayRobe(skinBase64);
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

  reader.readAsDataURL(blob);
};

// Event listener for file upload
document.getElementById("upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      loadSkin(event.target.result);
    };
    reader.readAsDataURL(file);
  }
});

// Event listener for username search
document.getElementById("searchButton").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  if (username) {
    try {
      // Fetch user data from Ashcon API
      const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);
      if (!response.ok) {
        alert("Username not found!");
        return;
      }
      const data = await response.json();
      const uuid = data.uuid;

      // Use Crafatar to get the skin
      const skinUrl = `https://crafatar.com/skins/${uuid}`;
      loadSkin(skinUrl); // Load the skin into the viewer
    } catch (error) {
      alert("An error occurred while fetching the skin.");
    }
  }
});