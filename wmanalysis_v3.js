var cv = require("opencv4nodejs");
var WatermarkAnalyzer = /** @class */ (function () {
    function WatermarkAnalyzer(imgArr, rw, col) {
        this.imgArray = imgArr;
        this.rows = rw;
        this.cols = col;
    }
    WatermarkAnalyzer.prototype.median = function (values) {
        values.sort(function (a, b) { return a - b; });
        var half = Math.floor(values.length / 2);
        if (values.length % 2)
            return values[half];
        else
            return (values[half - 1] + values[half]) / 2.0;
    };
    WatermarkAnalyzer.prototype.getMedianArray = function (arr) {
        var result = [];
        for (var i = 0; i < this.rows; i++) {
            var arr2d = [];
            for (var j = 0; j < this.cols; j++) {
                var arr1d = [];
                for (var k = 0; k < arr.length; k++) {
                    arr1d.push(arr[k].at(i, j));
                }
                arr2d.push(this.median(arr1d));
                //result.at(i,j) = this.median(arr1d);
            }
            result.push(arr2d);
        }
        //let mat = new cv.Mat(result, cv.CV_32F);
        return result;
    };
    WatermarkAnalyzer.prototype.method1_modify = function (arrx, arry) {
        // For checking purpose (intersection on gradient method)
        var gradxy = [];
        for (var k = 0; k < arrx.length; k++) {
            var rowArrxy = [];
            for (var i = 0; i < this.rows; i++) {
                var colxy = [];
                for (var j = 0; j < this.cols; j++) {
                    var value = Math.sqrt(Math.pow(arrx[k].at(i, j), 2) + Math.pow(arry[k].at(i, j), 2));
                    //console.log(value);
                    if (value > 5) {
                        colxy.push(value);
                    }
                    else {
                        colxy.push(0);
                    }
                }
                rowArrxy.push(colxy);
            }
            var mat = new cv.Mat(rowArrxy, cv.CV_32F);
            cv.imwrite("eg" + (k + 1).toString() + ".jpg", mat);
            gradxy.push(rowArrxy);
        }
        var wGxy = [];
        for (var i = 0; i < this.rows; i++) {
            var rowx = [];
            for (var j = 0; j < this.cols; j++) {
                var found = 1;
                var count = 0;
                var value = 0;
                for (var k = 0; k < gradxy.length; k++) {
                    value += gradxy[k][i][j];
                    count += 1;
                    if (gradxy[k][i][j] == 0) {
                        found = 0;
                        break;
                    }
                }
                if (found == 1) {
                    var avgValue = value / count;
                    rowx.push(255); //255
                }
                else {
                    rowx.push(0);
                }
            }
            wGxy.push(rowx);
        }
        // --------------------------------------------------------
        var nw_watermark = new cv.Mat(wGxy, cv.CV_32F);
        cv.imwrite("new_m1.jpg", nw_watermark);
        return nw_watermark;
    };
    WatermarkAnalyzer.prototype.extract_BoundBox = function (img, path) {
        console.log("extract_BOUNDBOX");
        var img1 = img.convertTo(cv.CV_8UC1);
        var contours = new cv.Mat();
        var hierarchy = new cv.Mat();
        var cntValues = img1.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        var minX = img.rows;
        var minY = img.rows;
        var maxX = 0;
        var maxY = 0;
        var rectangleColor = new cv.Vec3(255, 0, 0);
        var count = 0;
        var cntCount = 0;
        for (var _i = 0, cntValues_1 = cntValues; _i < cntValues_1.length; _i++) {
            var cnt = cntValues_1[_i];
            var rect = cnt.boundingRect();
            var contoursColor = new cv.Vec3(255, 255, 255);
            //cv.drawContours(img, contours, 0, contoursColor, 1, 8, hierarchy, 100);
            var point1_1 = new cv.Point2(rect.x, rect.y);
            var point2_1 = new cv.Point2(rect.x + rect.width, rect.y + rect.height);
            if (rect.width > 30 && rect.height > 30) { //change 30
                count += 1;
                if (rect.x < minX) {
                    minX = rect.x;
                }
                if (rect.y < minY) {
                    minY = rect.y;
                }
                if (rect.x + rect.width > maxX) {
                    maxX = rect.x + rect.width;
                }
                if (rect.y + rect.height > maxY) {
                    maxY = rect.y + rect.height;
                }
                //console.log(cnt);
                //console.log("area : " + cnt.area);
                img.drawRectangle(point1_1, point2_1, rectangleColor, 2, cv.LINE_AA, 0);
            }
            else {
                //console.log("area : " + cnt.area);
                var contoursColor2 = new cv.Vec3(100, 0, 0);
                img.drawRectangle(point1_1, point2_1, contoursColor2, 2, cv.LINE_AA, 0);
                //img.fillPoly(point1,point2,0);
                /*for (let y = rect.y; y < rect.height; y++) {
                    for (let x = rect.x; x < rect.width; x++) {

                    }
                }*/
            }
        }
        var point1 = new cv.Point2(minX, minY);
        var point2 = new cv.Point2(maxX, maxY);
        img.drawRectangle(point1, point2, rectangleColor, 2, cv.LINE_AA, 0);
        if (count > 0) {
            console.log("watermark present");
        }
        else {
            console.log("watermark absent");
            // Histogram Analysis
            //this.histogram_analysis()
        }
        return [img, minX, minY, maxX, maxY];
    };
    WatermarkAnalyzer.prototype.extract_WM_outline = function () {
        var gradxArr = [];
        var gradyArr = [];
        var count = 0;
        var val = 1;
        console.log("Calculating gradx and grady (sobel filter) ...");
        for (var _i = 0, _a = this.imgArray; _i < _a.length; _i++) {
            var img = _a[_i];
            var gradx = img.sobel(cv.CV_32F, 1, 0, 1);
            var grady = img.sobel(cv.CV_32F, 0, 1, 1);
            gradxArr.push(gradx);
            gradyArr.push(grady);
            cv.imwrite("sgx" + val + ".jpg", gradx);
            cv.imwrite("sgy" + val + ".jpg", grady);
            val += 1;
        }
        var wGxy = this.method1_modify(gradxArr, gradyArr);
        console.log("Calculating median of watermark gradient ...");
        var wm_gradients_x = this.getMedianArray(gradxArr);
        /////////
        var mat1 = new cv.Mat(wm_gradients_x, cv.CV_32F);
        cv.imwrite("fgx.jpg", mat1);
        //////////
        console.log("Calculated.");
        //console.log(wm_gradients_x.length);
        //console.log(wm_gradients_x[0].length);
        //console.log(wm_gradients_x[0][0]);
        var wm_gradients_y = this.getMedianArray(gradyArr);
        /////////
        var mat2 = new cv.Mat(wm_gradients_y, cv.CV_32F);
        cv.imwrite("fgy.jpg", mat2);
        //////////
        var watermark = [];
        var minPx = 255;
        var maxPx = 0;
        console.log("Estimate watermark ...");
        for (var i = 0; i < this.rows; i++) {
            var rwMat = [];
            //if (i % 100 == 0) {
            //console.log(i);
            //}
            for (var j = 0; j < this.cols; j++) {
                //console.log("j = " + j);
                //console.log(wm_gradients_x[i][j] + " , " + wm_gradients_y[i][j]);
                var pix_abs = Math.sqrt(Math.pow(wm_gradients_x[i][j], 2) + Math.pow(wm_gradients_y[i][j], 2));
                //console.log("sqrt, square : " + pix_abs);
                rwMat.push(pix_abs);
                if (pix_abs > maxPx) {
                    maxPx = pix_abs;
                }
                if (pix_abs < minPx) {
                    minPx = pix_abs;
                }
            }
            watermark.push(rwMat);
        }
        console.log("watermark estimated.");
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                //watermark[i][j] = 255 * (watermark[i][j] - minPx) / (maxPx - minPx) ;
                //watermark[i][j] = (watermark[i][j] - minPx) / (maxPx - minPx) ;
                if (watermark[i][j] > 0.5) {
                    watermark[i][j] = 255;
                }
                else {
                    watermark[i][j] = 0;
                }
            }
        }
        console.log("watermark thresholding");
        var nw_watermark = new cv.Mat(watermark, cv.CV_32F);
        //cv.imwrite("watermark.png", nw_watermark);
        //nw_watermark = nw_watermark.threshold(0.5,1,cv.THRESH_BINARY);
        return [nw_watermark, wGxy];
    };
    WatermarkAnalyzer.prototype.initial_WM_estimation = function (path) {
        var wm_outline = this.extract_WM_outline();
        cv.imwrite(path + "watermark.png", wm_outline[0]);
        return wm_outline;
    };
    WatermarkAnalyzer.prototype.method2 = function (imgArr, path) {
        var watermark = [];
        for (var i = 0; i < imgArr[0].rows; i++) {
            var wmRw = [];
            for (var j = 0; j < imgArr[0].cols; j++) {
                var found = 1;
                var count = 0;
                var value = 0;
                for (var _i = 0, imgArr_1 = imgArr; _i < imgArr_1.length; _i++) {
                    var img = imgArr_1[_i];
                    value += img.at(i, j);
                    count += 1;
                    if (img.at(i, j) == 255 || img.at(i, j) < 5) {
                        found = 0;
                        break;
                    }
                }
                if (found == 1) {
                    var avgValue = value / count;
                    wmRw.push(avgValue);
                }
                else {
                    wmRw.push(0);
                }
            }
            watermark.push(wmRw);
        }
        var wm_mat = new cv.Mat(watermark, cv.CV_32F);
        cv.imwrite(path + "wm_method2.jpg", wm_mat);
        var wm_bb = this.extract_BoundBox(wm_mat, path);
        cv.imwrite(path + "outline_m2.jpg", wm_bb[0]);
        return wm_bb;
    };
    WatermarkAnalyzer.prototype.histogram_analysis = function (imgArr, corInd, path) {
        var histogram = [];
        var x1 = corInd[0];
        var x2 = corInd[2];
        var y1 = corInd[1];
        var y2 = corInd[3];
        cv.imwrite("histo_img.jpg", imgArr[0]);
        for (var k = 0; k < imgArr.length; k++) {
            var histogramImg = [];
            for (var i = 0; i < 255; i++) {
                histogramImg.push(0);
            }
            for (var i = x1; i < x2; i++) {
                for (var j = y1; j < y2; j++) {
                    histogramImg[imgArr[k].at(i, j)] += 1;
                }
            }
            histogram.push(histogramImg);
            console.log("Histogram of bounding box");
            console.log(histogramImg);
        }
    };
    return WatermarkAnalyzer;
}());
function loadImages(path, noImg) {
    var imgArr = [];
    for (var i = 0; i < noImg; i++) {
        var imgPath = path + 'pic' + (i + 1).toString() + '.jpg';
        //console.log(imgPath);
        var img = cv.imread(imgPath).cvtColor(cv.COLOR_RGB2GRAY);
        var gb_img = img.gaussianBlur(new cv.Size(5, 5), 1.2);
        imgArr.push(img);
        //console.log(img.rows + " , " + img.cols);
        //let baseHist = cv.calcHist(img, [{channel: 1, ranges: [0, 255], bins: 255}]).convertTo(cv.CV_32F);
        //console.log(baseHist);
        var grayImg = path + 'g' + (i + 1).toString() + '.jpg';
        cv.imwrite(grayImg, gb_img);
    }
    return imgArr;
}
function convertCVmatrix(mat) {
    var rw = mat.rows;
    var col = mat.cols;
    var simpleMat = [];
    for (var i = 0; i < rw; i++) {
        var arr = [];
        for (var j = 0; j < col; j++) {
            arr.push(mat.at(i, j));
        }
        simpleMat.push(arr);
    }
    return simpleMat;
}
function removeWatermark(array, imgArr) {
    var refImg = array[0];
    for (var i = array[1]; i < array[3]; i++) {
        for (var j = array[2]; j < array[4]; j++) {
            var topPixel = imgArr.at(i - 1, j);
            var backPixel = imgArr.at(i, j - 1);
            if (refImg.at(i, j) != 0) {
            }
        }
    }
}
var path = './Data/WaterMark/File3/';
var imgArr = loadImages(path, 5);
var wm = new WatermarkAnalyzer(imgArr, imgArr[0].rows, imgArr[0].cols);
var wm_img = wm.initial_WM_estimation(path);
var bb1 = wm.extract_BoundBox(wm_img[0], path);
var img1 = bb1[0];
//wm.histogram_analysis(imgArr,[bb1[1], bb1[2], bb1[3], bb1[4]], path);
cv.imwrite(path + "contours.png", img1); // median of gradients
var bb2 = wm.extract_BoundBox(wm_img[1], path);
var img2 = bb2[0];
//let kernel =  new cv.Mat(1,1,cv.CV_8UC1,1);
//console.log("kernel : " + kernel);
//let dil_img = img2.erode(kernel);
//let dil_img1 = dil_img.erode(kernel);
cv.imwrite(path + "contours_v2.png", img2); // intersection of gradients
//cv.imwrite(path + "contours_v2_1.png", dil_img1)
//console.log(wm)
var imgArr1 = loadImages(path, 5);
var bb3 = wm.method2(imgArr1, path);
console.log("version 2");
