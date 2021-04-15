var aspectRatio;
var stimX, stimY, stimSize;
var stage;
var fontSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors;
var adapt, mask;
var adaptTime, switchTime, adaptCounter, timestamp, adaptStartTime;
var testVersion, testVersionRadio;

var adaptTimeInput;

var prevButton, nextButton;

var stageToValue, measuredValues, ranges;
var sliders;

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

    switchTime = 2000;
    maskTime = 500;
    adaptTime = 10;
    testVersion = 1;

    stageToValue = [0, 1, null, null, 2, 3, 4, 5, 6, 7];
    measuredValues = [0.5, 0.5, 0, 0, 0, 0, 0.5, 0.5];
    ranges = [[0, 1], [0, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [0, 1], [0, 1]];
}

function initialize() {
    calculateSizes();

    stage = 0;

    prevButton = createButton('Prev stage');
    prevButton.mousePressed(goToPrevStage);
    nextButton = createButton('Next stage');
    nextButton.mousePressed(goToNextStage);

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

    sliders = [];
    for (var i = 0; i < 8; i++) {
        sliders.push(createSlider(ranges[i][0], ranges[i][1], measuredValues[i], 1 / 1000));
        sliders[i].hide();
    }
    sliders[stageToValue[stage]].show();
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.525;
    stimSize = width * 0.5;

    fontSize = width * 0.02;
}

function drawSlider() {
    if (stageToValue[stage] != null) {
        sliders[stageToValue[stage]].position(width * 0.5 - width * 0.4 * 0.5, height * 0.1);
        sliders[stageToValue[stage]].style("width", width * 0.4 + "px");
        fill(1);
        textSize(fontSize);
        text("<-- F", width * 0.35, height * 0.08);
        text("H -->", width * 0.65, height * 0.08);
        noFill();
    }
}

function draw() {
    readSliderValue();
    background(0);
    drawSlider();

    if (stage == 0) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage]], [-1, 1]);
    }
    if (stage == 1) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage]], [1, -1]);
    }
    if (stage == 2) {
        fill(1);
        textSize(fontSize * 2);
        text("experiment settings", width * 0.5, height * 0.2);

        textAlign(LEFT);
        textSize(fontSize * 1.5);
        text("adaptation time:", width * 0.3, height * 0.375);
        adaptTimeInput.position(width * 0.5 - width * 0.1, height * 0.4);
        styleElement(adaptTimeInput, width * 0.2, height * 0.05, fontSize * 1.5);

        text("test version:", width * 0.3, height * 0.575);
        textAlign(CENTER);
        testVersionRadio.position(width * 0.5 - width * 0.05, height * 0.6);
        styleElement(testVersionRadio, width * 0.2, height * 0.05, fontSize * 1.5);
        testVersionRadio.style('color', '#ffffff');
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
                drawMcColloughStimulus(adaptColors[flicker], color(1), stimSize, mcN, stimX, stimY, flicker, [-4, 4, 5]);
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
            drawMcColloughStimulus(color(0), calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, 0, [-4, 4, 5]);
        }
        else {
            drawMcColloughStimulus(color(1), color(0), stimSize, mcN, stimX, stimY, 0, [-4, 4, 5]);
        }
    }
    if (stage == 5) {
        drawWhiteComparisonRects();
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), color(1), stimSize, mcN, stimX, stimY, 0, [4, -4, 5]);
        }
        else {
            drawMcColloughStimulus(color(0), color(1), stimSize, mcN, stimX, stimY, 0, [-4, 4, 5]);
        }
    }
    if (stage == 6) {
        drawWhiteComparisonRects();
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), color(1), stimSize, mcN, stimX, stimY, 1, [-4, 4, 5]);
        }
        else {
            drawMcColloughStimulus(color(1), color(0), stimSize, mcN, stimX, stimY, 1, [-4, 4, 5]);
        }
    }
    if (stage == 7) {
        drawWhiteComparisonRects();
        if (testVersion == 1) {
            drawMcColloughStimulus(color(0), color(1), stimSize, mcN, stimX, stimY, 1, [4, -4, 5]);
        }
        else {
            drawMcColloughStimulus(color(0), color(1), stimSize, mcN, stimX, stimY, 1, [-4, 4, 5]);
        }
    }
    if (stage == 8) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage]], [-1, 1]);
    }
    if (stage == 9) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY);
        drawFixationCross(stimX, stimY);
        drawIllusionStrengthMeter(stimX, stimY, measuredValues[stageToValue[stage]], [1, -1]);
    }

    if (stage != 2 && stage != 3) {

    }

    prevButton.position(width * 0.03, height * 0.88);
    styleElement(prevButton, width * 0.1, height * 0.08, fontSize);
    nextButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(nextButton, width * 0.1, height * 0.08, fontSize);
    if(stage == 0){
        prevButton.hide();
    }
    else{
        prevButton.show();
    }
    if(stage == 9){
        nextButton.hide();
    }
    else{
        nextButton.show();
    }

    generateReport();
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
    stage = constrain(stage + change, 0, 9);
    if (stage == 1) {
        adaptTimeInput.hide();
        testVersionRadio.hide();
        if (testVersionRadio.value() == '1') {
            testVersion = 1;
        }
        else {
            testVersion = 2;
        }
    }
    if (stage == 2) {
        adaptTimeInput.show();
        testVersionRadio.show();
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
    for (var i = 0; i <= 8; i++) {
        if (i == stageToValue[stage]) {
            sliders[i].show();
        }
        else {
            sliders[i].hide();
        }
    }
}

function readSliderValue() {
    if (stageToValue[stage] != null) {
        measuredValues[stageToValue[stage]] = sliders[stageToValue[stage]].value();
    }
}

function changeSliderValue(change) {
    if (stageToValue[stage] != null) {
        sliders[stageToValue[stage]].value(measuredValues[stageToValue[stage]] + change);
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
        changeSliderValue(-0.001);
    }
    if (key === 'h' || key === 'H') {
        changeSliderValue(0.001);
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

function drawHermannGrid(n, r, gS, vC, hC, x, y) {
    var sW = (r / (1 + r)) * (1 / n);
    var bW = (1 / (1 + r)) * (1 / n);
    var shrink = 1 / ((n + 1) * sW + n * bW);

    var coords = [];
    for (var i = 1; i <= n + 1; i++) {
        coords.push(sW * (i - 1) + bW * (i - 1) - 0.5);
    }

    fill(0);
    rect(x, y, gS, gS);

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
    noFill();
    noStroke();
}

function drawMcColloughStimulus(c1, c2, s, n, x, y, o, placing) {
    var sW = s / n;
    fill(c1);
    stroke(c1);
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

    if (testVersion == 1) {
        valueNames = [
            'Hermann grid 1 lower left',
            'Hermann grid 1 upper rigth',
            'McCollough version 1 lower left, horizontal',
            'McCollough version 1 upper right, horizontal',
            'McCollough version 1 lower left, vertical',
            'McCollough version 1 upper right, vertical',
            'Hermann grid 2 lower left',
            'Hermann grid 2 upper rigth'
        ];
    }
    else {
        valueNames = [
            'Hermann grid 1 lower left',
            'Hermann grid 1 upper rigth',
            'McCollough version 2 large, horizontal',
            'McCollough version 2 small, horizontal',
            'McCollough version 2 large, vertical',
            'McCollough version 2 small, vertical',
            'Hermann grid 2 lower left',
            'Hermann grid 2 upper rigth'
        ];
    }
    var reportString = 'adaptation: ' + adaptTime + ' min \n';
    for (var i = 0; i < 8; i++) {
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