class DrawingBoard {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.undoStack = [];
        this.redoStack = [];
        this.isDrawing = false;
        this.color = '#000000';
        this.brushSize = 5;
        this.brushSizeDisplay = document.getElementById('brushSizeDisplay');
        this.colorHistory = ['#000000'];
        this.colorHistoryContainer = document.getElementById('colorHistory');
        this.currentTool = 'brush';
        this.startX = 0;
        this.startY = 0;
        this.imageData = null;
        this.fillShape = false;
        this.textInput = document.getElementById('textInput');
        this.fontSelect = document.getElementById('fontSelect');
        this.fontSize = document.getElementById('fontSize');
        this.textControls = document.querySelector('.text-controls');
        this.circleControls = document.querySelector('.circle-controls');
        this.circleLineWidth = document.getElementById('circleLineWidth');
        this.fileInput = document.getElementById('fileInput');
        this.canvasWidth = document.getElementById('canvasWidth');
        this.canvasHeight = document.getElementById('canvasHeight');
        this.objects = [];
        this.selectedObject = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.tempShape = null;
        this.polygonPoints = [];
        this.isDrawingPolygon = false;

        this.initializeCanvas();
        this.setupEventListeners();
        this.updateColorHistory('#000000');
        this.saveState();
    }

    initializeCanvas() {
        this.canvas.width = this.canvasWidth.value;
        this.canvas.height = this.canvasHeight.value;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        document.getElementById('undo').addEventListener('click', this.undo.bind(this));
        document.getElementById('redo').addEventListener('click', this.redo.bind(this));
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.color = e.target.value;
            this.updateColorHistory(e.target.value);
        });
        document.getElementById('brushSize').addEventListener('change', (e) => {
            this.brushSize = e.target.value;
            this.brushSizeDisplay.textContent = e.target.value;
        });
        document.getElementById('clear').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('download').addEventListener('click', this.downloadCanvas.bind(this));
        document.getElementById('fillShape').addEventListener('change', (e) => {
            this.fillShape = e.target.checked;
        });

        // Add tool selection listeners
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
                e.target.closest('.tool').classList.add('active');
                this.currentTool = e.target.closest('.tool').id;
                this.updateToolUI();
            });
        });
        this.fileInput.addEventListener('change', this.handleImageUpload.bind(this));
        document.addEventListener('paste', this.handlePaste.bind(this));
        document.getElementById('resizeCanvas').addEventListener('click', this.resizeCanvas.bind(this));
    }

    updateToolUI() {
        this.textControls.style.display = this.currentTool === 'text' ? 'flex' : 'none';
        this.circleControls.style.display = this.currentTool === 'circle' ? 'flex' : 'none';
    }

    startDrawing(e) {
        if (this.currentTool === 'polygon') {
            const [x, y] = this.getMousePos(e);
            
            if (!this.isDrawingPolygon) {
                this.isDrawingPolygon = true;
                this.polygonPoints = [[x, y]];
            } else {
                const firstPoint = this.polygonPoints[0];
                const distance = Math.sqrt(
                    Math.pow(x - firstPoint[0], 2) + 
                    Math.pow(y - firstPoint[1], 2)
                );
                
                if (e.detail === 2 && distance < 20) {
                    this.finishPolygon();
                    return;
                }
                this.polygonPoints.push([x, y]);
            }
            this.redrawCanvas();
            return;
        }
        if (this.currentTool === 'select') {
            const [x, y] = this.getMousePos(e);
            this.handleSelection(x, y);
            return;
        }
        
        this.isDrawing = true;
        [this.startX, this.startY] = this.getMousePos(e);

        if (this.currentTool === 'text') {
            const text = this.textInput.value.trim();
            if (text) {
                const fontFamily = this.fontSelect.value;
                const fontSize = parseInt(this.fontSize.value, 10);
                const font = `${fontSize}px ${fontFamily}`;
                this.ctx.font = font;
                const textWidth = this.ctx.measureText(text).width;

                this.objects.push({
                    type: 'text',
                    text: text,
                    x: this.startX,
                    y: this.startY - fontSize,
                    font: font,
                    color: this.color,
                    width: textWidth,
                    height: fontSize
                });
                this.redrawCanvas();
                this.saveState();
            }
            return;
        }

        if (this.currentTool === 'brush') {
            this.tempShape = {
                type: 'brush',
                color: this.color,
                size: this.brushSize,
                points: [[this.startX, this.startY]],
                x: this.startX,
                y: this.startY,
                width: 0,
                height: 0
            };
        }
    }

    finishPolygon() {
        if (this.polygonPoints.length >= 3) {
            const minX = Math.min(...this.polygonPoints.map(p => p[0]));
            const minY = Math.min(...this.polygonPoints.map(p => p[1]));
            const maxX = Math.max(...this.polygonPoints.map(p => p[0]));
            const maxY = Math.max(...this.polygonPoints.map(p => p[1]));
            
            this.objects.push({
                type: 'polygon',
                points: [...this.polygonPoints],
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
                color: this.color,
                size: this.brushSize,
                fill: this.fillShape
            });
        }
        
        this.isDrawingPolygon = false;
        this.polygonPoints = [];
        this.redrawCanvas();
        this.saveState();
    }

    draw(e) {
        if (this.currentTool === 'select' && this.isDragging && this.selectedObject) {
            const [x, y] = this.getMousePos(e);
            const dx = x - this.dragOffset.x - this.selectedObject.x;
            const dy = y - this.dragOffset.y - this.selectedObject.y;
            
            this.selectedObject.x += dx;
            this.selectedObject.y += dy;
            
            if (this.selectedObject.type === 'brush') {
                this.selectedObject.points = this.selectedObject.points.map(point => [
                    point[0] + dx,
                    point[1] + dy
                ]);
            } else if (this.selectedObject.type === 'polygon') {
                this.selectedObject.points = this.selectedObject.points.map(point => [
                    point[0] + dx,
                    point[1] + dy
                ]);
            } else if (this.selectedObject.type !== 'image' && this.selectedObject.type !== 'text') {
                this.selectedObject.startX += dx;
                this.selectedObject.startY += dy;
                this.selectedObject.endX += dx;
                this.selectedObject.endY += dy;
            }
            
            this.dragOffset.x = x - this.selectedObject.x;
            this.dragOffset.y = y - this.selectedObject.y;
            
            this.redrawCanvas();
            return;
        }

        if (!this.isDrawing || this.currentTool === 'text') return;

        const [x, y] = this.getMousePos(e);

        if (this.currentTool === 'brush') {
            this.tempShape.points.push([x, y]);
            this.tempShape.x = Math.min(this.tempShape.x, x);
            this.tempShape.y = Math.min(this.tempShape.y, y);
            this.tempShape.width = Math.max(...this.tempShape.points.map(p => p[0])) - this.tempShape.x;
            this.tempShape.height = Math.max(...this.tempShape.points.map(p => p[1])) - this.tempShape.y;
        } else if (this.currentTool === 'circle') {
            const centerX = this.startX;
            const centerY = this.startY;
            const radius = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const size = parseInt(this.brushSize, 10);
            this.tempShape = {
                type: 'circle',
                startX: centerX,
                startY: centerY,
                endX: x,
                endY: y,
                x: centerX - radius,
                y: centerY - radius,
                width: 2 * radius,
                height: 2 * radius,
                color: this.color,
                size: size,
                fill: this.fillShape
            };
        } else {
            const size = this.currentTool === 'circle' ? parseInt(this.circleLineWidth.value, 10) : this.brushSize;

            this.tempShape = {
                type: this.currentTool,
                x: Math.min(this.startX, x),
                y: Math.min(this.startY, y),
                width: Math.abs(x - this.startX),
                height: Math.abs(y - this.startY),
                startX: this.startX,
                startY: this.startY,
                endX: x,
                endY: y,
                color: this.color,
                size: size,
                fill: this.fillShape
            };
        }

        this.redrawCanvas();
        this.drawShape(this.tempShape);
    }

    stopDrawing() {
        if (this.isDragging) {
            this.isDragging = false;
            this.saveState();
        }
        if (this.isDrawing) {
            this.isDrawing = false;
            if (this.tempShape) {
                this.objects.push(this.tempShape);
                this.tempShape = null;
            }
            this.saveState();
        }
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
    }

    saveState() {
        this.undoStack.push(this.canvas.toDataURL());
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length <= 1) return;
        
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        this.loadState(this.undoStack[this.undoStack.length - 1]);
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.loadState(state);
    }

    loadState(state) {
        const img = new Image();
        img.src = state;
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }

    downloadCanvas() {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        if (e.type === 'touchstart') {
            this.startDrawing(mouseEvent);
        } else if (e.type === 'touchmove') {
            this.draw(mouseEvent);
        }
    }

    updateColorHistory(color) {
        if (!this.colorHistory.includes(color)) {
            this.colorHistory.unshift(color);
            if (this.colorHistory.length > 5) {
                this.colorHistory.pop();
            }
        }
        
        this.colorHistoryContainer.innerHTML = '';
        this.colorHistory.forEach(c => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (c === this.color ? ' active' : '');
            swatch.style.backgroundColor = c;
            swatch.addEventListener('click', () => {
                this.color = c;
                document.getElementById('colorPicker').value = c;
                this.updateColorHistory(c);
            });
            this.colorHistoryContainer.appendChild(swatch);
        });
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
        this.fileInput.value = '';
    }

    handlePaste(e) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                this.loadImage(file);
                break;
            }
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(
                    this.canvas.width / img.width,
                    this.canvas.height / img.height
                );
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (this.canvas.width - width) / 2;
                const y = (this.canvas.height - height) / 2;
                
                this.objects.push({
                    type: 'image',
                    img: img,
                    x: x,
                    y: y,
                    width: width,
                    height: height
                });
                
                this.redrawCanvas();
                this.saveState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    resizeCanvas() {
        const newWidth = parseInt(this.canvasWidth.value);
        const newHeight = parseInt(this.canvasHeight.value);
        
        if (newWidth < 100 || newHeight < 100 || 
            newWidth > 2000 || newHeight > 2000) {
            alert('Canvas dimensions must be between 100 and 2000 pixels');
            return;
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
        
        this.saveState();
    }

    handleSelection(x, y) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            let isHit = false;

            if (obj.type === 'circle') {
                const radius = Math.sqrt(
                    Math.pow(obj.endX - obj.startX, 2) + 
                    Math.pow(obj.endY - obj.startY, 2)
                );
                const distance = Math.sqrt(
                    Math.pow(x - obj.startX, 2) + 
                    Math.pow(y - obj.startY, 2)
                );
                isHit = distance <= radius;
            } else if (obj.type === 'line') {
                const lineDistance = this.pointToLineDistance(
                    x, y,
                    obj.startX, obj.startY,
                    obj.endX, obj.endY
                );
                isHit = lineDistance < 5;
            } else if (obj.type === 'polygon') {
                isHit = this.isPointInPolygon(x, y, obj.points);
            } else {
                isHit = x >= obj.x && x <= obj.x + obj.width &&
                        y >= obj.y && y <= obj.y + obj.height;
            }

            if (isHit) {
                this.selectedObject = obj;
                this.isDragging = true;
                this.dragOffset.x = x - obj.x;
                this.dragOffset.y = y - obj.y;
                this.redrawCanvas();
                return;
            }
        }
        this.selectedObject = null;
        this.isDragging = false;
        this.redrawCanvas();
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isPointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i][0], yi = points[i][1];
            const xj = points[j][0], yj = points[j][1];
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const obj of this.objects) {
            if (obj.type === 'image') {
                this.ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
            } else {
                this.drawShape(obj);
            }
        }

        if (this.tempShape) {
            this.drawShape(this.tempShape);
        }

        if (this.selectedObject) {
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(
                this.selectedObject.x - 2,
                this.selectedObject.y - 2,
                this.selectedObject.width + 4,
                this.selectedObject.height + 4
            );
            this.ctx.setLineDash([]);
        }
        
        if (this.isDrawingPolygon && this.polygonPoints.length > 0) {
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.brushSize;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.polygonPoints[0][0], this.polygonPoints[0][1]);
            for (let i = 1; i < this.polygonPoints.length; i++) {
                this.ctx.lineTo(this.polygonPoints[i][0], this.polygonPoints[i][1]);
            }
            this.ctx.stroke();
            
            this.polygonPoints.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
                this.ctx.fillStyle = this.color;
                this.ctx.fill();
            });
        }
    }

    drawShape(shape) {
        this.ctx.strokeStyle = shape.color;
        this.ctx.fillStyle = shape.color;
        this.ctx.lineWidth = shape.size;

        this.ctx.beginPath();

        switch (shape.type) {
            case 'brush':
                if (shape.points && shape.points.length > 0) {
                    this.ctx.moveTo(shape.points[0][0], shape.points[0][1]);
                    shape.points.forEach(point => {
                        this.ctx.lineTo(point[0], point[1]);
                    });
                }
                this.ctx.stroke();
                break;

            case 'line':
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                break;

            case 'rectangle':
                if (shape.fill) {
                    this.ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                }
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                break;

            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(shape.endX - shape.startX, 2) + 
                    Math.pow(shape.endY - shape.startY, 2)
                );
                this.ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
                if (shape.fill) {
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;

            case 'text':
                this.ctx.font = shape.font;
                this.ctx.fillStyle = shape.color;
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(shape.text, shape.x, shape.y);
                break;
                
            case 'polygon':
                this.ctx.beginPath();
                this.ctx.moveTo(shape.points[0][0], shape.points[0][1]);
                for (let i = 1; i < shape.points.length; i++) {
                    this.ctx.lineTo(shape.points[i][0], shape.points[i][1]);
                }
                this.ctx.closePath();
                if (shape.fill) {
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;
        }
    }
}

// Initialize the drawing board when the page loads
window.addEventListener('load', () => {
    new DrawingBoard();
});
