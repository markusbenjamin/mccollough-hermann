var aspectRatio;
var stimX, stimY, stimSize;
var stage;
var fontSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors, nonadaptColors;
var adapt, mask;
var adaptTime, switchTime, adaptCounter, timestamp, adaptStartTime;
var testVersion, testVersionRadio;
var testOrder, testOrderRadio;
var nonadaptColor, nonadaptColorRadio;

var adaptTimeInput;

var prevButton, nextButton, clipboardButton;

var stageToValue, measuredValues, measuredValuesDefault, ranges;
var sliders;

var resetAll, resetThis;

function setup() {
    aspectRatio = 6 / 8;
    createCanvas(min(windowWidth, windowHeight / aspectRatio), min(windowHeight, windowWidth * aspectRatio));
    colorMode(HSB, 1);
    rectMode(CENTER);
    textAlign(CENTER);
    noStroke();
    noFill();

    setParameters();
    initialize();
}

function windowResized() {
    createCanvas(min(windowWidth, windowHeight / aspectRatio), min(windowHeight, windowWidth * aspectRatio));
    calculateSizes();
}

function setParameters() {
    hgN = 7;
    hgR = 0.25;
    hgVC = color(1, 0.25, 1);

    mcN = 17;
    adaptColors = [color(1 / 3, 1, 1), color(1, 1, 1)];
    nonadaptColors = [color(1), color(0)];

    
    maskTime = 500;
    adaptTime = 10;
    switchTime = adaptTime*60*1000;
    testVersion = 1;
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

    clipboardButton = createButton('Results to clipboard');
    clipboardButton.mousePressed(generateReport);
    clipboardButton.hide();

    adaptTimeInput = createInput(adaptTime);
    adaptTimeInput.hide();

    testVersionRadio = createRadio('testVersionRadio');
    testVersionRadio.option('1');
    testVersionRadio.option('2');
    if (testVersion == 1) {
        testVersionRadio.selected('1');
    }
    else {
        testVersionRadio.selected('2');
    }
    testVersionRadio.hide();

    testOrderRadio = createRadio('testOrderRadio');
    testOrderRadio.option('h, v');
    testOrderRadio.option('v, h');
    if (testOrder == 0) {
        testOrderRadio.selected('h, v');
    }
    else {
        testOrderRadio.selected('v, h');
    }
    testOrderRadio.hide();

    nonadaptColorRadio = createRadio('nonadaptColorRadio');
    nonadaptColorRadio.option('white');
    nonadaptColorRadio.option('black');
    if (nonadaptColor == 0) {
        nonadaptColorRadio.selected('white');
    }
    else {
        nonadaptColorRadio.selected('black');
    }
    nonadaptColorRadio.hide();

    sliders = [];
    for (var i = 0; i < measuredValues.length; i++) {
        sliders.push(createSlider(ranges[i][0], ranges[i][1], measuredValues[i], 1 / 1000));
        sliders[i].hide();
    }
    sliders[stageToValue[stage + 1]].show();

    resetAll = false;
    resetThis = false;
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.525;
    stimSize = width * 0.5;

    fontSize = width * 0.02;
}

function drawSlider() {
    if (stageToValue[stage + 1] != null) {
        sliders[stageToValue[stage + 1]].position(width * 0.5 - width * 0.4 * 0.5, height * 0.1);
        sliders[stageToValue[stage + 1]].style("width", width * 0.4 + "px");
        fill(1);
        textSize(fontSize);
        text("<-- F", width * 0.35, height * 0.07);

        text("H -->", width * 0.65, height * 0.07);
        textSize(fontSize);
        text("R to reset this", width * 0.5, height * 0.92);
        text("A to reset all", width * 0.5, height * 0.96);
        noFill();
    }
}

function draw() {
    if (resetAll) {
        for (var i = 0; i < measuredValues.length; i++) {
            sliders[i].value(measuredValuesDefault[i]);
        }
        resetAll = false;
    }
    else if (resetThis && stageToValue[stage + 1] != null) {
        sliders[stageToValue[stage + 1]].value(measuredValuesDefault[stageToValue[stage + 1]]);
        resetThis = false;
    }
    readSliderValue();
    background(0);
    drawSlider();

    if (stage == -1) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage + 1]], [-1, 1]);
    }
    if (stage == 0) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage + 1]], [1, -1]);
    }
    if (stage == 1) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage + 1]], [-1, 1]);
    }
    if (stage == 2) {
        fill(1);
        textSize(fontSize * 2);
        text("experiment settings", width * 0.5, height * 0.2);

        textAlign(LEFT);
        textSize(fontSize * 1.5);
        text("adaptation time:", width * 0.3, height * 0.3);
        adaptTimeInput.position(width * 0.5 - width * 0.1, height * 0.325);
        styleElement(adaptTimeInput, width * 0.2, height * 0.05, fontSize * 1.5);

        text("non-adapt color:", width * 0.3, height * 0.45);
        nonadaptColorRadio.position(width * 0.5 - width * 0.05, height * 0.475);
        styleElement(nonadaptColorRadio, width * 0.2, height * 0.05, fontSize * 1.5);
        nonadaptColorRadio.style('color', '#ffffff');

        text("test version:", width * 0.3, height * 0.6);
        testVersionRadio.position(width * 0.5 - width * 0.05, height * 0.625);
        styleElement(testVersionRadio, width * 0.2, height * 0.05, fontSize * 1.5);
        testVersionRadio.style('color', '#ffffff');

        text("test order:", width * 0.3, height * 0.7);
        testOrderRadio.position(width * 0.5 - width * 0.05, height * 0.725);
        styleElement(testOrderRadio, width * 0.2, height * 0.05, fontSize * 1.5);
        testOrderRadio.style('color', '#ffffff');  

        textAlign(CENTER);
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
                drawMcColloughStimulus(adaptColors[flicker],nonadaptColors[nonadaptColor], stimSize, mcN, stimX, stimY, flicker, [-4, 4, 5]);
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
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, testOrder, [-4, 4, 5]);
        }
        else {
            drawMcColloughStimulus(calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), color(0), stimSize, mcN, stimX, stimY, testOrder, [-4, 4, 5]);
        }
    }
    if (stage == 5) {
        drawWhiteComparisonRects();
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, testOrder, [4, -4, 5]);
        }
        else {
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, testOrder, [-4, 4, 5]);
        }
    }
    if (stage == 6) {
        drawWhiteComparisonRects();
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, !testOrder, [-4, 4, 5]);
        }
        else {
            drawMcColloughStimulus(calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), color(0), stimSize, mcN, stimX, stimY, !testOrder, [-4, 4, 5]);
        }
    }
    if (stage == 7) {
        drawWhiteComparisonRects();
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, !testOrder, [4, -4, 5]);
        }
        else {
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage + 1]]), stimSize, mcN, stimX, stimY, !testOrder, [-4, 4, 5]);
        }
    }
    if (stage == 8) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage + 1]], [-1, 1]);
    }
    if (stage == 9) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage + 1]], [1, -1]);
    }

    prevButton.position(width * 0.03, height * 0.88);
    styleElement(prevButton, width * 0.1, height * 0.08, fontSize);
    nextButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(nextButton, width * 0.1, height * 0.08, fontSize);
    clipboardButton.position(width * 0.5 - width * 0.155 * 0.5, height * 0.07 - height * 0.027);
    styleElement(clipboardButton, width * 0.155, height * 0.035, fontSize * 0.75);
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
    if (stage != 2 && stage != 3) {
        clipboardButton.show();
    }
    else {
        clipboardButton.hide();
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
    switchTime = adaptTime*60*1000;
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
        adaptTimeInput.hide();

        testVersionRadio.hide();
        if (testVersionRadio.value() == '1') {
            testVersion = 1;
        }
        else {
            testVersion = 2;
        }

        testOrderRadio.hide();
        if (testOrderRadio.value() == 'h, v') {
            testOrder = 0;
        }
        else {
            testOrder = 1;
        }

        nonadaptColorRadio.hide();
        if (nonadaptColorRadio.value() == 'white') {
            nonadaptColor = 0;
        }
        else {
            nonadaptColor = 1;
        }
    }
    if (stage == 2) {
        adaptTimeInput.show();
        testVersionRadio.show();
        testOrderRadio.show();
        nonadaptColorRadio.show();
    }
    if (stage == 3) {
        adaptTimeInput.hide();

        testVersionRadio.hide();
        if (testVersionRadio.value() == '1') {
            testVersion = 1;
        }
        else {
            testVersion = 2;
        }

        testOrderRadio.hide();
        if (testOrderRadio.value() == 'h, v') {
            testOrder = 0;
        }
        else {
            testOrder = 1;
        }

        nonadaptColorRadio.hide();
        if (nonadaptColorRadio.value() == 'white') {
            nonadaptColor = 0;
        }
        else {
            nonadaptColor = 1;
        }

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

function drawFixationCross(x, y) {
    stroke(1, 1, 1);
    strokeWeight(2);
    line(x - width * 0.015, y, x + width * 0.015, y);
    line(x, y - width * 0.015, x, y + width * 0.015);
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

    if (key === 'r' || key === 'R') {
        if (stageToValue[stage + 1] != null) {
            resetThis = true;
        }
    }
    if (key === 'a' || key === 'A') {
        resetAll = true;
    }
}

function drawIllusionStrengthMeter(xIn, yIn, illusionStrength, placing) {
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    var illusionSpotSize = round(hgDims[1] * 1.5);
    var translate = 1.5 * (hgDims[0] + hgDims[1]);
    var x = xIn + placing[0] * translate;
    var y = yIn + placing[1] * translate;
    fill(1);
    rect(x, y, 3 * hgDims[0] + 2 * hgDims[1], 3 * hgDims[0] + 2 * hgDims[1]);
    noFill();
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

function drawMcColloughStimulus(c1, c2, s, n, x, y, o, placing) {
    var sW = s / n;
    fill(c1);
    rect(x, y, s, s);
    fill(c2);
    stroke(c2);
    rect(x + placing[0] * sW, y + placing[1] * sW, sW * +placing[2], sW * +placing[2]);
    noFill();
    noStroke();

    var counter = 1;
    fill(0);
    stroke(0);
    for (var i = 1; i < n * 2; i += 1) {
        if (i % 2 == 1) {
            if (counter % 2 != 1) {
                if (o) {
                    rect(x + map(i, 0, n * 2, -s / 2, s / 2), y, sW, s);
                }
                else {
                    rect(x, y + map(i, 0, n * 2, -s / 2, s / 2), s, sW);
                }
            }
            counter++;
        }
    }
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
    copyToClipboard(reportString);
}

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}