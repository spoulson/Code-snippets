// Must also include jsgl.js

var jsglscene = (function () {
    var self = {
        // Camera affine matrix.
        camera_mat: function () { return camera_mat; },

        // Projection affine matrix.
        proj_mat: function () { return proj_mat; },
        
        objects: [],
    
        whiteout_alpha: 1,
        subdivide_factor: 10.0,
        nonadaptive_depth: 0,
        clip_z: false,
        min_z: 0.1
    };
    
    var bisect = function (p0, p1) {
        return {
            x: (p0.x + p1.x) / 2,
            y: (p0.y + p1.y) / 2,
            z: (p0.z + p1.z) / 2,
            u: (p0.u + p1.u) / 2,
            v: (p0.v + p1.v) / 2
        };
    };

    var drawPerspectiveTriUnclippedSub = function (c3d, image, v0, tv0, v1, tv1, v2, tv2, depth_count) {
        var edgelen01 = Math.abs(tv0.x - tv1.x) + Math.abs(tv0.y - tv1.y);
        var edgelen12 = Math.abs(tv1.x - tv2.x) + Math.abs(tv1.y - tv2.y);
        var edgelen20 = Math.abs(tv2.x - tv0.x) + Math.abs(tv2.y - tv0.y);
        var zdepth01 = Math.abs(v0.z - v1.z);
        var zdepth12 = Math.abs(v1.z - v2.z);
        var zdepth20 = Math.abs(v2.z - v0.z);

        var subdiv =
            ((edgelen01 * zdepth01 > self.subdivide_factor) ? 1 : 0) +
            ((edgelen12 * zdepth12 > self.subdivide_factor) ? 2 : 0) +
            ((edgelen20 * zdepth20 > self.subdivide_factor) ? 4 : 0);

        if (depth_count) {
            depth_count--;
            subdiv = depth_count == 0 ? 0 : 7;
        }

        switch (subdiv) {
        case 0:
            // No subdivide.
            jsgl.drawTriangle(c3d.canvas_ctx_, image,
                tv0.x, tv0.y,
                tv1.x, tv1.y,
                tv2.x, tv2.y,
                v0.u, v0.v,
                v1.u, v1.v,
                v2.u, v2.v);
            break;
        case 1:
            // split along v01-v2
            var v01 = bisect(v0, v1);
            var tv01 = jsgl.projectPoint(v01);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v01, tv01, v2, tv2);
            drawPerspectiveTriUnclippedSub(c3d, image, v01, tv01, v1, tv1, v2, tv2);
            break;
        case 2:
            // split along v0-v12
            var v12 = bisect(v1, v2);
            var tv12 = jsgl.projectPoint(v12);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v1, tv1, v12, tv12);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v12, tv12, v2, tv2);
            break;
        case 3:
            // split along v01-v12
            var v01 = bisect(v0, v1);
            var tv01 = jsgl.projectPoint(v01);
            var v12 = bisect(v1, v2);
            var tv12 = jsgl.projectPoint(v12);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v01, tv01, v12, tv12);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v12, tv12, v2, tv2);
            drawPerspectiveTriUnclippedSub(c3d, image, v01, tv01, v1, tv1, v12, tv12);
            break;
        case 4:
            // split along v1-v20
            var v20 = bisect(v2, v0);
            var tv20 = jsgl.projectPoint(v20);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v1, tv1, v20, tv20);
            drawPerspectiveTriUnclippedSub(c3d, image, v1, tv1, v2, tv2, v20, tv20);
            break;
        case 5:
            // split along v01-v20
            var v01 = bisect(v0, v1);
            var tv01 = jsgl.projectPoint(v01);
            var v20 = bisect(v2, v0);
            var tv20 = jsgl.projectPoint(v20);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v01, tv01, v20, tv20);
            drawPerspectiveTriUnclippedSub(c3d, image, v1, tv1, v2, tv2, v01, tv01);
            drawPerspectiveTriUnclippedSub(c3d, image, v2, tv2, v20, tv20, v01, tv01);
            break;
        case 6:
            // split along v12-v20
            var v12 = bisect(v1, v2);
            var tv12 = jsgl.projectPoint(v12);
            var v20 = bisect(v2, v0);
            var tv20 = jsgl.projectPoint(v20);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v1, tv1, v20, tv20);
            drawPerspectiveTriUnclippedSub(c3d, image, v1, tv1, v12, tv12, v20, tv20);
            drawPerspectiveTriUnclippedSub(c3d, image, v12, tv12, v2, tv2, v20, tv20);
            break;
        default:
        case 7:
            var v01 = bisect(v0, v1);
            var tv01 = jsgl.projectPoint(v01);
            var v12 = bisect(v1, v2);
            var tv12 = jsgl.projectPoint(v12);
            var v20 = bisect(v2, v0);
            var tv20 = jsgl.projectPoint(v20);
            drawPerspectiveTriUnclippedSub(c3d, image, v0, tv0, v01, tv01, v20, tv20, depth_count);
            drawPerspectiveTriUnclippedSub(c3d, image, v1, tv1, v12, tv12, v01, tv01, depth_count);
            drawPerspectiveTriUnclippedSub(c3d, image, v2, tv2, v20, tv20, v12, tv12, depth_count);
            drawPerspectiveTriUnclippedSub(c3d, image, v01, tv01, v12, tv12, v20, tv20, depth_count);
            break;
        }
        
        return;
    };

    self.drawPerspectiveTriUnclipped = function (c3d, image, v0, v1, v2, depth_count) {
        drawPerspectiveTriUnclippedSub(
            c3d, image,
            v0,
            jsgl.projectPoint(v0),
            v1,
            jsgl.projectPoint(v1),
            v2,
            jsgl.projectPoint(v2),
            depth_count);
    };
    
    // Draw a perspective-corrected textured triangle, subdividing as
    // necessary for clipping and texture mapping.
    //
    // Unconventional clipping -- recursively subdivide, and drop whole tris on
    // the wrong side of z clip plane.
    self.drawPerspectiveTri = function (c3d, image, v0, v1, v2, depth_count) {
        var clip =
            ((v0.z < self.min_z) ? 1 : 0) +
            ((v1.z < self.min_z) ? 2 : 0) +
            ((v2.z < self.min_z) ? 4 : 0);
            
        if (clip == 0) {
            // No verts need clipping.
            self.drawPerspectiveTriUnclipped(c3d, image, v0, v1, v2, depth_count);
            return;
        }
        else if (clip == 7) {
            // All verts are behind the near plane; don't draw.
            return;
        }

        // Also clip if behind the guard band.
        // Prevents endless clipping recursion.
        var min_z2 = self.min_z * 1.02;
        var clip2 =
            ((v0.z < min_z2) ? 1 : 0) +
            ((v1.z < min_z2) ? 2 : 0) +
            ((v2.z < min_z2) ? 4 : 0);
        
        if (clip2 == 7) {
            // All verts are behind the guard band, don't recurse.
            return;
        }

        // Subdivide depending on which vertexex were clipped.
        if (depth_count) depth_count--;

        switch (clip) {
        case 1:
            var v01 = bisect(v0, v1);
            var v20 = bisect(v2, v0);
            drawPerspectiveTri(c3d, image, v01, v1, v2);
            drawPerspectiveTri(c3d, image, v01, v2, v20);
            drawPerspectiveTri(c3d, image, v0, v01, v20);
            break;
        case 2:
            var v01 = bisect(v0, v1);
            var v12 = bisect(v1, v2);
            drawPerspectiveTri(c3d, image, v0, v01, v12);
            drawPerspectiveTri(c3d, image, v0, v12, v2);
            drawPerspectiveTri(c3d, image, v1, v12, v01);
            break;
        case 3:
            var v12 = bisect(v1, v2);
            var v20 = bisect(v2, v0);
            drawPerspectiveTri(c3d, image, v2, v20, v12);
            drawPerspectiveTri(c3d, image, v0, v1, v12);
            drawPerspectiveTri(c3d, image, v0, v12, v20);
            break;
        case 4:
            var v12 = bisect(v1, v2);
            var v20 = bisect(v2, v0);
            drawPerspectiveTri(c3d, image, v0, v1, v12);
            drawPerspectiveTri(c3d, image, v0, v12, v20);
            drawPerspectiveTri(c3d, image, v12, v2, v20);
            break;
        case 5:
            var v01 = bisect(v0, v1);
            var v12 = bisect(v1, v2);
            drawPerspectiveTri(c3d, image, v1, v12, v01);
            drawPerspectiveTri(c3d, image, v0, v01, v12);
            drawPerspectiveTri(c3d, image, v0, v12, v2);
            break;
        case 6:
            var v01 = bisect(v0, v1);
            var v20 = bisect(v2, v0);
            drawPerspectiveTri(c3d, image, v0, v01, v20);
            drawPerspectiveTri(c3d, image, v01, v1, v2);
            drawPerspectiveTri(c3d, image, v01, v2, v20);
            break;
        }
    };

    self.rotateObject = function (object, xangle, yangle, zangle) {
        // Rotate xyz independently.
        var mat = new jsgl.AffineMatrix(
            Math.cos(yangle) * Math.cos(zangle),
                -Math.cos(xangle) * Math.sin(zangle) + Math.sin(xangle) * Math.sin(yangle) * Math.cos(zangle),
                    Math.sin(xangle) * Math.sin(zangle) + Math.cos(xangle) * Math.sin(yangle) * Math.cos(xangle),
                        0,
            Math.cos(yangle) * Math.sin(zangle),
                Math.cos(xangle) * Math.cos(zangle) + Math.sin(xangle) * Math.sin(yangle) * Math.sin(zangle),
                    -Math.sin(xangle) * Math.cos(zangle) + Math.cos(xangle) * Math.sin(yangle) * Math.sin(zangle),
                        0,
            -Math.sin(yangle),
                Math.sin(xangle) * Math.cos(yangle),
                    Math.cos(xangle) * Math.cos(yangle),
                        0
        );
        
        object.matrix = jsgl.multiplyAffine(mat, object.matrix);
        jsgl.orthonormalizeRotation(object.matrix);
    };
    
    self.rotateObjectAxis = function (object, scaled_axis) {
        var angle = Math.min(Math.asin(Math.sqrt(jsgl.dotProduct(scaled_axis, scaled_axis))), Math.PI / 8);
        var mat = {
            e0: cos*cos, e4: -cos*sin + sin*sin*cos, e8: sin*sin + cos*sin*cos,  e12: 0,
            e1: cos*sin, e5: cos*cos + sin*sin*sin,  e9: -sin*cos + cos*sin*sin, e13: 0,
            e2: -sin,    e6: sin*cos,                e10: cos*cos,               e14: 0
        };
        
        object.matrix = jsgl.multiplyAffine(mat, object.matrix);
        jsgl.orthonormalizeRotation(object.matrix);
    };
    
    self.setOrientation = function (distance) {
        self.camera_mat = jsgl.makeOrientationAffine(
            { x: 0, y: 0, z: distance },
            { x: 0, y: 0, z: -1 },
            { x: 0, y: 1, z: 0 }
        );
    };
    
    self.setProjection = function (canvas_width, canvas_height, fov_radians) {
        self.proj_mat = jsgl.makeWindowProjection(canvas_width, canvas_height, fov_radians);
    };

    return self;
})();
