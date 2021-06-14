var stimX, stimY, stimSize;
var stage;
var fontSize;
var fixCrossSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors, nonadaptColors;
var adapt, mask;
var adaptTime, switchTime, adaptCounter, timestamp, adaptStartTime;

var adaptTimeInput;

var prevButton, nextButton;

var stageToValue, measuredValues, measuredValuesDefault, ranges;
var sliders;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 1);
    rectMode(CENTER);
    textAlign(CENTER);
    noStroke();
    noFill();

    setParameters();
    initialize();
}

function windowResized() {
    createCanvas(windowWidth, windowHeight);
    calculateSizes();
}

function setParameters() {
    hgN = 7;
    hgR = 1 / 3;
    hgVC = color(1, 0.25, 1);

    mcN = 15;

    adaptColors = [color(1 / 3, 1, 1), color(1, 1, 1)];
    nonadaptColors = [color(0), color(1)];

    maskTime = 500;
    adaptTime = 20;
    switchTime = 2000;
    testOrder = 0;
    nonadaptColor = 0;

    stageToValue = [0, 1, 2, null, null, 3, 4, 5, 6, 7, 8];
    measuredValuesDefault = [0.5, 0.5, 0.5, 0, 0, 0, 0, 0.5, 0.5];
    measuredValues = [0.5, 0.5, 0.5, 0, 0, 0, 0, 0.5, 0.5];
    ranges = [[0, 1], [0, 1], [0, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [0, 1], [0, 1]];
}

function initialize() {
    calculateSizes();

    stage = -1;

    prevButton = createButton('Prev stage');
    prevButton.mousePressed(goToPrevStage);
    nextButton = createButton('Next stage');
    nextButton.mousePressed(goToNextStage);

    sliders = [];
    for (var i = 0; i < measuredValues.length; i++) {
        sliders.push(createSlider(ranges[i][0], ranges[i][1], measuredValues[i], 1 / 1000));
        sliders[i].hide();
    }
    sliders[stageToValue[stage + 1]].show();
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.5;
    stimSize = max(width, height) * 0.3;

    fontSize = width * 0.015;
    fixCrossSize = max(width, height) * 0.02;
}

function drawSlider() {
    if (stageToValue[stage + 1] != null) {
        sliders[stageToValue[stage + 1]].position(width * 0.5 - width * 0.4 * 0.5, height * 0.1);
        sliders[stageToValue[stage + 1]].style("width", width * 0.4 + "px");
        fill(1);
        textSize(fontSize);
        text("<-- F", width * 0.35, height * 0.07);
        text("H -->", width * 0.65, height * 0.07);
        noFill();
    }
}

function draw() {
    readSliderValue();
    background(0);
    drawSlider();

    if (stage == -1) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage + 1]], [-1, 1]);
    }
    if (stage == 0) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage + 1]], [1, -1]);
    }
    if (stage == 1) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage + 1]], [-1, 1]);
    }
    if (stage == 2) {
        fill(1);
        textSize(fontSize * 2);
        text("experiment settings", width * 0.5, height * 0.2);
    }
    if (stage == 3) {
        if (millis() - adaptStartTime > adaptTime * 60 * 1000) {
            fill(1);
            textSize(fontSize * 2);
            text("adaptation phase finished", stimX, stimY);
            noFill();
        }
        else if (adapt) {
            if (millis() - timestamp < switchTime) {
                var flicker = (adaptCounter / 2) % 2;
                drawMcCollough(adaptColors[flicker], stimSize, mcN, stimX, stimY, flicker);
                var naDims = getNonadaptDims([-1, 1]);
                var x = naDims[0];
                var y = naDims[1];
                fill(0);
                rect(x, y, naDims[2], naDims[3]);
                noFill();
            }
            else {
                adapt = false;
                mask = true;
                adaptCounter++;
                timestamp = millis();
            }
        }
        else if (mask) {
            if (millis() - timestamp < maskTime) {
                fill(0);
                rect(stimX, stimY, stimSize, stimSize);
                noFill();
            }
            else {
                adapt = true;
                mask = false;
                adaptCounter++;
                timestamp = millis();
            }
        }
    }
    if (stage == 4) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, testOrder);
        drawTestMask([-1, 1]);
    }
    if (stage == 5) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, testOrder);
        drawTestMask([1, -1]);
    }
    if (stage == 6) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, !testOrder);
        drawTestMask([-1, 1]);
    }
    if (stage == 7) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, !testOrder);
        drawTestMask([1, -1]);
    }
    if (stage == 8) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage + 1]], [-1, 1]);
    }
    if (stage == 9) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage + 1]], [1, -1]);
    }

    prevButton.position(width * 0.03, height * 0.88);
    styleElement(prevButton, width * 0.1, height * 0.08, fontSize);
    nextButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(nextButton, width * 0.1, height * 0.08, fontSize);
    if (stage == -1) {
        prevButton.hide();
    }
    else {
        prevButton.show();
    }
    if (stage == 9) {
        nextButton.hide();
    }
    else {
        nextButton.show();
    }
}

function calculateRedGreenVal(val) {
    if (val < 0) {
        return color(1 / 3, -val, 1);
    }
    else {
        return color(1, val, 1);
    }
}

function styleElement(element, w, h, fS) {
    element.style("width", w + "px");
    element.style("height", h + "px");
    element.style('font-family', 'Arial');
    element.style('font-size', fS + 'px');
}

function startAdaptStage() {
    adapt = true;
    mask = false;
    adaptCounter = 0;
    timestamp = millis();
    adaptStartTime = millis();
    adaptTime = adaptTimeInput.value();
}

function endAdaptStage() {
    adaptStartTime = millis() - (adaptTime + 1) * 60 * 1000;
}

function goToNextStage() {
    changeStage(1);
}

function goToPrevStage() {
    changeStage(-1);
}

function changeStage(change) {
    stage = constrain(stage + change, -1, 9);
    if (stage == 1) {
        
    }
    if (stage == 2) {
       
    }
    if (stage == 3) {
        if (0 < change) {
            startAdaptStage();
        }
    }
    if (stage == 4) {
        endAdaptStage();
    }
    handleSliderVisibility();
}

function handleSliderVisibility() {
    for (var i = 0; i <= 9; i++) {
        if (i == stageToValue[stage + 1]) {
            sliders[i].show();
        }
        else {
            sliders[i].hide();
        }
    }
}

function readSliderValue() {
    if (stageToValue[stage + 1] != null) {
        measuredValues[stageToValue[stage + 1]] = sliders[stageToValue[stage + 1]].value();
    }
}

function changeSliderValue(change) {
    if (stageToValue[stage + 1] != null) {
        sliders[stageToValue[stage + 1]].value(measuredValues[stageToValue[stage + 1]] + change);
    }
}

function drawFixCross(x, y) {
    stroke(1);
    strokeWeight(3);
    line(x - fixCrossSize, y, x + fixCrossSize, y);
    line(x, y - fixCrossSize, x, y + fixCrossSize);
    noStroke();
    strokeWeight(1);
}

function drawWhiteComparisonRects() {
    fill(1);
    rect(stimX - stimSize * 0.75, stimY, stimSize * 0.25);
    rect(stimX + stimSize * 0.75, stimY, stimSize * 0.25);
    noFill();
}

function keyPressed() {
    if (key === 'n' || key === 'N') {
        goToNextStage();
    }
    if (key === 'p' || key === 'P') {
        goToPrevStage();
    }

    if (key === 'f' || key === 'F') {
        changeSliderValue(-0.005);
    }
    if (key === 'h' || key === 'H') {
        changeSliderValue(0.005);
    }
}

function drawIllusionStrengthMeter(illusionStrength, placing) {
    var naDims = getNonadaptDims(placing);
    var x = naDims[0];
    var y = naDims[1];
    fill(1);
    stroke(1);
    rect(x, y, naDims[2], naDims[3]);
    noFill();

    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    var illusionSpotSize = round(hgDims[1] * 1.5);
    for (var i = -illusionSpotSize / 2; i < illusionSpotSize / 2; i++) {
        for (var j = -illusionSpotSize / 2; j < illusionSpotSize / 2; j++) {
            var d = dist(0, 0, i, j) / dist(0, 0, illusionSpotSize / 2, illusionSpotSize / 2);
            var col = color(0, 0.27, 0.34, illusionMain(d, 0.125, 50, 1, illusionStrength));
            stroke(col);
            point(x + i, y + j);
        }
    }
    noStroke();
}

function illusionF(d, hsp, ab) {
    return 1 / (1 + exp(ab * (d - hsp)));
}

function illusionG(d, hsp, ab, min, max) {
    return (illusionF(d, hsp, ab) - illusionF(1, hsp, ab)) * (max - min) / (illusionF(0, hsp, ab) - illusionF(1, hsp, ab)) + min
}

function illusionMain(d, hsp, ab, min, max) {
    return 1 - illusionG(d, hsp, ab, min, max);
}

function getNonadaptDims(placing) {
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    var translate = 1.5 * (hgDims[0] + hgDims[1]);
    var x = stimX + placing[0] * translate;
    var y = stimY + placing[1] * translate;
    return [x, y, 3 * hgDims[0] + 2 * hgDims[1], 3 * hgDims[0] + 2 * hgDims[1]];
}

function hermannGridDimensions(n, r, gS) {
    var sW = (r / (1 + r)) * (1 / n);
    var bW = (1 / (1 + r)) * (1 / n);
    var shrink = 1 / ((n + 1) * sW + n * bW);
    return [gS * shrink * sW, gS * shrink * bW];
}

function drawHermannGrid(n, r, gS, vC, hC, x, y, hOnV) {
    var sW = (r / (1 + r)) * (1 / n);
    var bW = (1 / (1 + r)) * (1 / n);
    var shrink = 1 / ((n + 1) * sW + n * bW);

    var coords = [];
    for (var i = 1; i <= n + 1; i++) {
        coords.push(sW * (i - 1) + bW * (i - 1) - 0.5);
    }

    fill(0);
    rect(x, y, gS, gS);
    noFill();

    if (hOnV) {
        fill(vC);
        stroke(vC);
        for (var i = 1; i <= n + 1; i++) {
            beginShape();
            vertex(x + gS * shrink * (coords[i - 1] + sW / 2), y + gS * shrink * (-0.5 + sW / 2));
            vertex(x + gS * shrink * (coords[i - 1] - sW / 2), y + gS * shrink * (-0.5 + sW / 2));
            vertex(x + gS * shrink * (coords[i - 1] - sW / 2), y + gS * shrink * (0.5 + sW / 2));
            vertex(x + gS * shrink * (coords[i - 1] + sW / 2), y + gS * shrink * (0.5 + sW / 2));
            endShape(CLOSE);
        }
    }

    fill(hC);
    stroke(hC);
    for (var i = 1; i <= n + 1; i++) {
        beginShape();
        vertex(x + gS * shrink * (-0.5 - sW / 2), y + gS * shrink * (coords[i - 1] - sW / 2));
        vertex(x + gS * shrink * (-0.5 - sW / 2), y + gS * shrink * (coords[i - 1] + sW / 2));
        vertex(x + gS * shrink * (0.5 + sW / 2), y + gS * shrink * (coords[i - 1] + sW / 2));
        vertex(x + gS * shrink * (0.5 + sW / 2), y + gS * shrink * (coords[i - 1] - sW / 2));
        endShape(CLOSE);
    }

    if (hOnV == false) {
        fill(vC);
        stroke(vC);
        for (var i = 1; i <= n + 1; i++) {
            beginShape();
            vertex(x + gS * shrink * (coords[i - 1] + sW / 2), y + gS * shrink * (-0.5 + sW / 2));
            vertex(x + gS * shrink * (coords[i - 1] - sW / 2), y + gS * shrink * (-0.5 + sW / 2));
            vertex(x + gS * shrink * (coords[i - 1] - sW / 2), y + gS * shrink * (0.5 + sW / 2));
            vertex(x + gS * shrink * (coords[i - 1] + sW / 2), y + gS * shrink * (0.5 + sW / 2));
            endShape(CLOSE);
        }
    }

    noFill();
    noStroke();
}

function drawMcCollough(c, s, m, x, y, o) {
    var sW = s / (2 * m - 1);
    fill(c);
    for (var i = 1; i < m + 1; i++) {
        if (o) {//vertical
            rect(x - 0.5 * s + 0.5 * sW + (i - 1) * 2 * sW, y, sW, s);
        }
        else {//horizontal
            rect(x, y - 0.5 * s + 0.5 * sW + (i - 1) * 2 * sW, s, sW);
        }
    }
    noFill();
}

function drawTestMask(placing) {
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    var naDims = getNonadaptDims(placing);

    fill(0);
    stroke(0);
    rect(stimX, stimY + placing[0] * stimSize * 0.25, stimSize, stimSize * 0.5);
    rect(stimX + placing[1] * stimSize * 0.25, stimY + placing[1] * stimSize * 0.25, stimSize * 0.5, stimSize * 0.5);
    var translate = (naDims[3] + hgDims[0] + hgDims[1]) * 0.5;
    rect(naDims[0] - translate, naDims[1], hgDims[0] + hgDims[1], 4.5 * (hgDims[0] + hgDims[1]));
    rect(naDims[0], naDims[1] - translate, 4.5 * (hgDims[0] + hgDims[1]), hgDims[0] + hgDims[1]);
    rect(naDims[0] + translate, naDims[1], hgDims[0] + hgDims[1], 4.5 * (hgDims[0] + hgDims[1]));
    rect(naDims[0], naDims[1] + translate, 4.5 * (hgDims[0] + hgDims[1]), hgDims[0] + hgDims[1]);
    noFill();
    noStroke();
}

function generateReport() {
    var valueNames = [];
    var testOrderNames = [];
    if (testOrder) {
        testOrderNames = [' vertical', 'vertical', 'horizontal', 'horizontal'];
    }
    else {
        testOrderNames = ['horizontal', 'horizontal', ' vertical', 'vertical'];
    }

    valueNames = [
        'HG in non-adapt, pre',
        'HG in adapt, pre',
        'HG in non-adapt VonH, pre',
        'MC non-adapt, ' + testOrderNames[0],
        'MC adapt, ' + testOrderNames[1],
        'MC non-adapt,  ' + testOrderNames[2],
        'MC adapt, ' + testOrderNames[3],
        'HG in non-adapt, post',
        'HG in adapt, post'
    ];
    var reportString = 'adaptation: ' + adaptTime + ' min\nnon-adapt color: ' + nonadaptColorRadio.value() + '\ntest version: ' + testVersion + '\ntest order: ' + testOrderRadio.value() + '\n';
    for (var i = 0; i < measuredValues.length; i++) {
        reportString += valueNames[i] + ": " + measuredValues[i] + "\n";
    }
}