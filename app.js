class DrawingBoard {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.undoStack = [];
        this.redoStack = [];
        this.isDrawing = false;
        this.color = '#000000';
        this.brushSize = 5;

        this.initializeCanvas();
        this.setupEventListeners();
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

        document.getElementById('undo').addEventListener('click', this.undo.bind(this));
        document.getElementById('redo').addEventListener('click', this.redo.bind(this));
        document.getElementById('colorPicker').addEventListener('change', (e) => this.color = e.target.value);
        document.getElementById('brushSize').addEventListener('change', (e) => this.brushSize = e.target.value);
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.ctx.beginPath();
        const [x, y] = this.getMousePos(e);
        this.ctx.moveTo(x, y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const [x, y] = this.getMousePos(e);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.stroke();
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
}

// Initialize the drawing board when the page loads
window.addEventListener('load', () => {
    new DrawingBoard();
});
