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

        this.initializeCanvas();
        this.setupEventListeners();
        this.updateColorHistory('#000000');
        this.saveState();
    }

    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
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

        // Add tool selection listeners
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
                e.target.closest('.tool').classList.add('active');
                this.currentTool = e.target.closest('.tool').id;
            });
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        [this.startX, this.startY] = this.getMousePos(e);

        if (this.currentTool === 'brush') {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        } else {
            // Save the canvas state before drawing shapes
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const [x, y] = this.getMousePos(e);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;

        if (this.currentTool === 'brush') {
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else {
            // Restore the previous state before drawing the new shape
            this.ctx.putImageData(this.imageData, 0, 0);
            this.ctx.beginPath();

            switch (this.currentTool) {
                case 'line':
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(x, y);
                    break;
                case 'rectangle':
                    const width = x - this.startX;
                    const height = y - this.startY;
                    this.ctx.rect(this.startX, this.startY, width, height);
                    break;
                case 'circle':
                    const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
                    this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                    break;
            }
            
            this.ctx.stroke();
        }
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
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
}

// Initialize the drawing board when the page loads
window.addEventListener('load', () => {
    new DrawingBoard();
});
