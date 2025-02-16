(function () {
    console.log("Loading script...");
  
    // Helper function: Loads the jsPDF library and returns a promise when it's ready.
    function loadJSPDF(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
  
        // If Trusted Types is supported, create a policy for our script URL.
        if (window.trustedTypes && trustedTypes.createPolicy) {
          const policy = trustedTypes.createPolicy("myPolicy", {
            createScriptURL: (input) => input,
          });
          script.src = policy.createScriptURL(url);
        } else {
          script.src = url;
        }
  
        script.onload = () => {
          console.log("jsPDF library loaded successfully.");
          resolve();
        };
        script.onerror = () => reject(new Error("Failed to load jsPDF."));
  
        document.body.appendChild(script);
      });
    }
  
    // Helper function: Detect images in the DOM that start with the "blob:https://drive.google.com/" prefix.
    function getValidImages() {
      const images = document.getElementsByTagName("img");
      const validImgs = [];
      const driveBlobPrefix = "blob:https://drive.google.com/";
  
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.src.startsWith(driveBlobPrefix)) {
          validImgs.push(img);
        }
      }
      return validImgs;
    }
  
    // Helper function: Convert an <img> element to a base64 data URL using a canvas.
    function convertImageToDataUrl(imgElement) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
  
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
  
      ctx.drawImage(imgElement, 0, 0, imgElement.naturalWidth, imgElement.naturalHeight);
      return canvas.toDataURL();
    }
  
    // Main function: Generates and downloads a PDF from the valid images found on the page.
    function generatePDFFromImages(images) {
      if (!images || !images.length) {
        console.warn("No images found that match the Drive blob criteria.");
        return;
      }
  
      // We’ll access jsPDF through the UMD global object: `window.jspdf.jsPDF`.
      const { jsPDF } = window.jspdf;
  
      console.log(`${images.length} valid image(s) found. Building PDF...`);
  
      let pdf;
      let isFirstPage = true;
  
      images.forEach((img, idx) => {
        const imgData = convertImageToDataUrl(img);
  
        const orientation = img.naturalWidth > img.naturalHeight ? "l" : "p";
        const pageWidth = img.naturalWidth;
        const pageHeight = img.naturalHeight;
  
        // Initialize PDF on the first valid image.
        if (isFirstPage) {
          pdf = new jsPDF({
            orientation: orientation,
            unit: "px",
            format: [pageWidth, pageHeight],
          });
          isFirstPage = false;
        } else {
          pdf.addPage([pageWidth, pageHeight], orientation);
        }
  
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  
        const percentDone = Math.round(((idx + 1) / images.length) * 100);
        console.log(`Processing image ${idx + 1}/${images.length} (${percentDone}%)`);
      });
  
      // Extract a title from the page’s meta if available, fallback to “download.pdf”.
      let title = "download.pdf";
      const metaTitle = document.querySelector('meta[itemprop="name"]');
      if (metaTitle && metaTitle.content) {
        title = metaTitle.content.endsWith(".pdf") ? metaTitle.content : `${metaTitle.content}.pdf`;
      }
  
      console.log("Saving PDF...");
      pdf.save(title, { returnPromise: true }).then(() => {
        console.log("PDF downloaded successfully!");
      });
    }
  
    // Execute our steps in sequence:
    // 1) Load jsPDF
    // 2) Gather valid images
    // 3) Generate & download PDF
    loadJSPDF("https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js")
      .then(() => {
        const images = getValidImages();
        generatePDFFromImages(images);
      })
      .catch((err) => console.error(err));
  })();