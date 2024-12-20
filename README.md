# DrawBoard

A powerful web-based drawing application that allows users to create, edit, and manipulate artwork with multiple tools and layers.

## Features

- **Drawing Tools**:
  - Brush: Freehand drawing with adjustable size
  - Freehand Shape: Create smooth, continuous shapes
  - Line: Draw straight lines
  - Arrow: Draw lines with arrow heads
  - Rectangle: Draw rectangles with optional fill
  - Circle: Create circles with adjustable radius
  - Polygon: Create multi-point shapes
  - Text: Add text with customizable font and size
  - Select: Move, resize, and rotate objects

- **Layer Management**:
  - Multiple layers with visibility toggle
  - Layer opacity control
  - Blend mode selection
  - Drag and drop layer reordering

- **Image Handling**:
  - Image upload support
  - Paste images from clipboard
  - Export to PNG and SVG formats
  - Save and load drawings (JSON format)

- **Canvas Features**:
  - Multi-page support
  - Zoom and pan
  - Grid overlay with snap-to-grid
  - Undo/redo support
  - Color history
  - Shape history for quick reuse

## Keyboard Shortcuts

### Tools
- `1`: Brush
- `2`: Freehand Shape
- `3`: Line
- `4`: Arrow
- `5`: Rectangle
- `6`: Circle
- `7`: Polygon
- `8`: Select
- `9`: Text

### Actions
- `Ctrl + Z`: Undo
- `Ctrl + Y` or `Ctrl + Shift + Z`: Redo
- `Ctrl + S`: Save as PNG
- `Ctrl + C`: Copy selected object
- `Ctrl + V`: Paste object
- `Ctrl + E`: Export drawing
- `Ctrl + I`: Import drawing
- `Delete`: Delete selected object
- `Escape`: Deselect or cancel polygon drawing
- `H` or `?`: Show keyboard shortcuts

## Development

No installation required. Simply open the `index.html` file in a compatible web browser to run the application.

### File Structure
- `index.html`: The main HTML file with the application's structure
- `styles.css`: Contains styles for the layout and appearance
- `app.js`: Implements the drawing functionality and event handling

### Features in Detail

#### Layer System
- Each layer has independent opacity and blend mode settings
- Supports common blend modes: normal, multiply, screen, overlay, darken, lighten
- Live preview of layer contents
- Drag-and-drop reordering

#### Multi-page Support
- Create multiple pages in a single document
- Page preview thumbnails
- Navigate between pages
- Copy and paste between pages

#### Advanced Selection
- Move objects with arrow keys
- Resize from corners or edges
- Rotate objects
- Maintain aspect ratio with modifier keys

#### Grid System
- Toggleable grid overlay
- Adjustable grid size
- Optional snap-to-grid functionality
- Helps with precise alignment
