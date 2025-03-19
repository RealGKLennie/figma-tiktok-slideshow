/// <reference types="@figma/plugin-typings" />

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

interface Message {
  type: string;
  csvData: string;
  images: Uint8Array[];
}

interface CSVRow {
  text: string;
  [key: string]: string;
}

// Define the HTML directly as a string
const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    :root {
      --primary-color: #18A0FB;
      --text-color: #333333;
      --light-gray: #E5E5E5;
      --medium-gray: #666666;
      --dark-gray: #333333;
      --success-color: #2ABB7F;
      --border-radius: 6px;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: var(--spacing-lg);
      color: var(--text-color);
      background-color: white;
      line-height: 1.5;
    }
    
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: var(--spacing-md);
      color: var(--dark-gray);
    }
    
    .container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }
    
    .input-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    
    label {
      font-weight: 600;
      font-size: 14px;
      color: var(--dark-gray);
    }
    
    .file-input-wrapper {
      position: relative;
      margin-top: var(--spacing-xs);
    }
    
    .file-input-button {
      display: inline-block;
      background-color: var(--light-gray);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--border-radius);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      transition: background-color 0.2s;
      border: 1px solid rgba(0,0,0,0.1);
      width: 100%;
    }
    
    .file-input-button:hover {
      background-color: #DBDBDB;
    }
    
    input[type="file"] {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    
    .file-info {
      font-size: 13px;
      color: var(--medium-gray);
      margin-top: var(--spacing-sm);
      display: flex;
      align-items: center;
    }
    
    .file-info-icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: var(--spacing-sm);
      background-color: var(--success-color);
      border-radius: 50%;
      position: relative;
    }
    
    .file-info-icon::after {
      content: '✓';
      color: white;
      font-size: 11px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .hidden {
      display: none;
    }
    
    button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: var(--spacing-md);
      border-radius: var(--border-radius);
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      width: 100%;
      transition: opacity 0.2s, transform 0.1s;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    button:disabled {
      background-color: var(--light-gray);
      color: var(--medium-gray);
      cursor: not-allowed;
      transform: none;
    }
    
    .divider {
      height: 1px;
      background-color: var(--light-gray);
      margin: var(--spacing-sm) 0;
    }
    
    .help-text {
      font-size: 12px;
      color: var(--medium-gray);
      margin-top: var(--spacing-xs);
    }
    
    .credit {
      font-size: 12px;
      color: var(--medium-gray);
      text-align: center;
      margin-top: var(--spacing-lg);
    }
    
    .credit a {
      color: var(--primary-color);
      text-decoration: none;
    }
    
    .credit a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Bulk Create Slideshow</h1>
    
    <div class="input-group">
      <label for="csv">CSV File with Text</label>
      <div class="help-text">First column will be used as text content</div>
      <div class="file-input-wrapper">
        <div class="file-input-button">Choose CSV File</div>
        <input type="file" id="csv" accept=".csv" />
      </div>
      <div id="csv-info" class="file-info hidden"></div>
    </div>
    
    <div class="input-group">
      <label for="images">Images</label>
      <div class="help-text">Select one or multiple image files</div>
      <div class="file-input-wrapper">
        <div class="file-input-button">Choose Images</div>
        <input type="file" id="images" accept="image/*" multiple />
      </div>
      <div id="images-info" class="file-info hidden"></div>
    </div>
    
    <button id="create" disabled>Create Designs</button>
    
    <div class="credit">
      Created by <a href="https://x.com/alf_eco" target="_blank">@alf_eco</a>
    </div>
  </div>

  <script>
    let csvData = null;
    let imageFiles = [];

    document.getElementById('csv').onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        csvData = await file.text();
        const infoEl = document.getElementById('csv-info');
        infoEl.innerHTML = '<span class="file-info-icon"></span> Selected: ' + file.name;
        infoEl.classList.remove('hidden');
        updateCreateButton();
      }
    };

    document.getElementById('images').onchange = (event) => {
      imageFiles = Array.from(event.target.files);
      if (imageFiles.length > 0) {
        const infoEl = document.getElementById('images-info');
        infoEl.innerHTML = '<span class="file-info-icon"></span> Selected: ' + imageFiles.length + ' image(s)';
        infoEl.classList.remove('hidden');
        updateCreateButton();
      }
    };

    function updateCreateButton() {
      const createButton = document.getElementById('create');
      createButton.disabled = !csvData || imageFiles.length === 0;
    }

    document.getElementById('create').onclick = async () => {
      const createButton = document.getElementById('create');
      createButton.textContent = 'Creating...';
      createButton.disabled = true;
      
      try {
        const imagePromises = imageFiles.map(file => 
          file.arrayBuffer().then(buffer => new Uint8Array(buffer))
        );
        
        const images = await Promise.all(imagePromises);
        
        parent.postMessage({
          pluginMessage: {
            type: 'create-designs',
            csvData,
            images
          }
        }, '*');
      } catch (error) {
        createButton.textContent = 'Create Designs';
        createButton.disabled = false;
      }
    };
  </script>
</body>
</html>
`;

// Show the plugin interface using the HTML string
figma.showUI(html, { width: 400, height: 480 });

// Load the Proxima Nova font
const fontName = { family: "Proxima Nova", style: "Semibold" };

figma.ui.onmessage = async (msg: Message) => {
  if (msg.type === 'create-designs') {
    const { csvData, images } = msg;
    
    try {
      // Load the font first
      await figma.loadFontAsync(fontName);
      
      // Parse CSV data
      const rows: CSVRow[] = parseCSV(csvData);
      
      // Store all frames to select them later
      const createdFrames: FrameNode[] = [];
      
      // Create a frame for each row
      const framesPerRow = 3; // Number of frames to arrange in a row
      const horizontalSpacing = 100;
      const verticalSpacing = 100;
      const frameWidth = 1080;
      const frameHeight = 1350;
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const image = images[i % images.length]; // Cycle through images if fewer images than rows
        
        // Create frame
        const frame = figma.createFrame();
        frame.name = `Design ${i + 1}`;
        frame.resize(frameWidth, frameHeight);
        
        // Calculate position (grid layout)
        const rowIndex = Math.floor(i / framesPerRow);
        const colIndex = i % framesPerRow;
        
        frame.x = colIndex * (frameWidth + horizontalSpacing);
        frame.y = rowIndex * (frameHeight + verticalSpacing);
        
        // Add image as a fill on the frame itself
        const imageNode = await figma.createImage(image);
        frame.fills = [{
          type: 'IMAGE',
          imageHash: imageNode.hash,
          scaleMode: 'FILL'
        }];
        
        // Add text
        const text = figma.createText();
        text.fontName = fontName;
        text.characters = row.text;
        text.fontSize = 74;
        text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        
        // Add black stroke to text
        text.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
        text.strokeWeight = 6;
        text.strokeAlign = 'OUTSIDE';
        
        // Center text
        text.textAlignHorizontal = 'CENTER';
        text.textAlignVertical = 'CENTER';
        
        // Resize text box to frame width (with padding) and auto-height
        text.resize(frame.width * 0.9, frame.height * 0.8);
        text.x = (frame.width - text.width) / 2;
        text.y = (frame.height - text.height) / 2;
        
        frame.appendChild(text);
        figma.currentPage.appendChild(frame);
        createdFrames.push(frame);
      }
      
      // Select all created frames for easy export
      figma.currentPage.selection = createdFrames;
      
      // Zoom viewport to see all frames
      figma.viewport.scrollAndZoomIntoView(createdFrames);
      
      figma.notify(`Created ${createdFrames.length} frames. Ready for export!`);
      
      // Reset the UI
      figma.ui.postMessage({ type: 'creation-complete' });
    } catch (error: any) {
      figma.notify('Error creating designs: ' + (error.message || 'Unknown error'));
      figma.ui.postMessage({ type: 'creation-error' });
    }
  }
  
  // Don't close the plugin after creation to allow multiple attempts
};

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: CSVRow = { text: values[0] };
    
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    return row;
  });
}
