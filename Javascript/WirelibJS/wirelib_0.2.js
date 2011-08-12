// Based on WirelibJS from http://www.bit-101.com/blog/?p=3129

function Wirelib(canvas) {
    if (canvas !== undefined) {
        this.lines = [];
        this.fl = 250;
        this.strokeStyle = "#000000";
        this.lineWidth = 1;
        this.showCenter = false;
        this.clearCanvas = true;
        this.width = canvas.width;
        this.height = canvas.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
        this.cz = this.fl * 2;
        this.context = canvas.getContext("2d");
    }   
}

Wirelib.prototype.project = function (p3d) {
    var p2d = {}, scale = this.fl / (this.fl + p3d.z + this.cz);
    p2d.x = this.cx + p3d.x * scale;
    p2d.y = this.cy + p3d.y * scale;
    return p2d;
};

Wirelib.prototype.addLine = function () {
    var i, numPoints, points, line;
    points = (typeof arguments[0] === "object") ? arguments[0] : arguments;
    
    numPoints = points.length;
    if (numPoints >= 6) {
        line = {style: this.strokeStyle, width: this.lineWidth, points: []};
        this.lines.push(line);
        for (i = 0; i < numPoints; i += 3) {
            line.points.push({x: points[i], y: points[i + 1], z: points[i + 2]});
        }
    } else {
        console.error("wirelib.addLine: You need to add at least two 3d points (6 numbers) to make a line.");
    }
    return line;
};
    
Wirelib.prototype.addCube = function (x, y, z, w, h, d) {
    this.addLine(x - w / 2, y - h / 2, z - d / 2,
                 x + w / 2, y - h / 2, z - d / 2,
                 x + w / 2, y + h / 2, z - d / 2,
                 x - w / 2, y + h / 2, z - d / 2,
                 x - w / 2, y - h / 2, z - d / 2);
    this.addLine(x - w / 2, y - h / 2, z + d / 2,
                 x + w / 2, y - h / 2, z + d / 2,
                 x + w / 2, y + h / 2, z + d / 2,
                 x - w / 2, y + h / 2, z + d / 2,
                 x - w / 2, y - h / 2, z + d / 2);
    this.addLine(x - w / 2, y - h / 2, z - d / 2,
                 x - w / 2, y - h / 2, z + d / 2); 
    this.addLine(x + w / 2, y - h / 2, z - d / 2,
                 x + w / 2, y - h / 2, z + d / 2); 
    this.addLine(x + w / 2, y + h / 2, z - d / 2,
                 x + w / 2, y + h / 2, z + d / 2); 
    this.addLine(x - w / 2, y + h / 2, z - d / 2,
                 x - w / 2, y + h / 2, z + d / 2); 
};

Wirelib.prototype.addRect = function (x, y, z, w, h) {
    this.addLine(x - w / 2, y - h / 2, z,
                 x + w / 2, y - h / 2, z,
                 x + w / 2, y + h / 2, z,
                 x - w / 2, y + h / 2, z,
                 x - w / 2, y - h / 2, z);
};

Wirelib.prototype.addCircle = function (x, y, z, radius, segments) {
    var i, points = [], a;
    for (i = 0; i < segments; i += 1) {
        a = Math.PI * 2 * i / segments;
        points.push(x + Math.cos(a) * radius, y + Math.sin(a) * radius, z);
    }
    points.push(points[0], points[1], points[2]);
    this.addLine(points);
};

Wirelib.prototype.draw = function () {
    var i, j, line, p2d;
    if (this.clearCanvas) {
        this.context.clearRect(0, 0, this.width, this.height);
    }
    for (i = 0; i < this.lines.length; i += 1) {
        this.context.beginPath();
        line = this.lines[i];
        p2d = this.project(line.points[0]);
        this.context.moveTo(p2d.x, p2d.y);
        for (j = 1; j < line.points.length; j += 1) {
            p2d = this.project(line.points[j]);
            this.context.lineTo(p2d.x, p2d.y);
        }
        this.context.lineWidth = line.width;
        this.context.strokeStyle = line.style;
        this.context.stroke();
    }
    if (this.showCenter) {
        p2d = this.project({x: 0, y: 0, z: 0});
        this.context.strokeStyle = "#ff0000";
        this.context.lineWidth = 0.5;
        this.context.beginPath();
        this.context.arc(p2d.x, p2d.y, 5, 0, Math.PI * 2, false);
        this.context.stroke();
    }
};

Wirelib.prototype.loop = function (fps, callback) {
    if (!this.running) {
        var wl = this;
        this.running = true;
        this.interval = setInterval(function () {
            callback();
            wl.draw();
        }, 1000 / fps);
    }
};

Wirelib.prototype.stop = function () {
    this.running = false;
    clearInterval(this.interval);
};

Wirelib.prototype.rotateX = function (radians) {
    var i, j, p, y1, z1, line, cos = Math.cos(radians), sin = Math.sin(radians);
    for (i = 0; i < this.lines.length; i += 1) {
        line = this.lines[i];
        for (j = 0; j < line.points.length; j += 1) {
            p = line.points[j];
            y1 = p.y * cos - p.z * sin;
            z1 = p.z * cos + p.y * sin;
            p.y = y1;
            p.z = z1;
        }
    }
};

Wirelib.prototype.rotateY = function (radians) {
    var i, j, p, x1, z1, line, cos = Math.cos(radians), sin = Math.sin(radians);
    for (i = 0; i < this.lines.length; i += 1) {
        line = this.lines[i];
        for (j = 0; j < line.points.length; j += 1) {
            p = line.points[j];
            z1 = p.z * cos - p.x * sin;
            x1 = p.x * cos + p.z * sin;
            p.x = x1;
            p.z = z1;
        }
    }
};

Wirelib.prototype.rotateZ = function (radians) {
    var i, j, p, x1, y1, line, cos = Math.cos(radians), sin = Math.sin(radians);
    for (i = 0; i < this.lines.length; i += 1) {
        line = this.lines[i];
        for (j = 0; j < line.points.length; j += 1) {
            p = line.points[j];
            y1 = p.y * cos - p.x * sin;
            x1 = p.x * cos + p.y * sin;
            p.x = x1;
            p.y = y1;
        }
    }
};

Wirelib.prototype.translate = function (x, y, z) {
    var i, j, p, line;
    for (i = 0; i < this.lines.length; i += 1) {
        line = this.lines[i];
        for (j = 0; j < line.points.length; j += 1) {
            p = line.points[j];
            p.x += x;
            p.y += y;
            p.z += z;
        }
    }
};

Wirelib.prototype.jitter = function (amount) {
    var i, j, line, p;
    for (i = 0; i < this.lines.length; i += 1) {
        line = this.lines[i];
        for (j = 0; j < line.points.length; j += 1) {
            p = line.points[j];
            p.x += Math.random() * amount * 2 - amount;
            p.y += Math.random() * amount * 2 - amount;
            p.z += Math.random() * amount * 2 - amount;
        }
    }
};