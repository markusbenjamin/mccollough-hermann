var stimX, stimY, stimSize;
var stage, startStage, endStage;
var fontSize;
var fixCrossSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors, nonadaptColors;
var adapt, mask;
var adaptTime, switchTime, adaptCounter, timestamp, adaptStartTime;

var prevButton, nextButton, finishButton;

var stageToValue, measuredValues, measuredValuesDefault, ranges;
var sliders;

var adaptTimeInput, participantInput;

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
    nonadaptColor = 0;

    stageToValue = [null, null, null, null, 0, 1, 2, 3, 4, 5, null, null, null, null, 6, 7, 8, 9, null, null, 10, 11, 12, 13, null];
    measuredValues = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0];
    ranges = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1]];
}

function initialize() {
    calculateSizes();

    stage = 0;
    startStage = 0;
    endStage = 24;

    participantID = 1;

    prevButton = createButton('Prev stage');
    prevButton.mousePressed(goToPrevStage);
    prevButton.hide();
    nextButton = createButton('Next stage');
    nextButton.mousePressed(goToNextStage);
    nextButton.show();
    finishButton = createButton('Finish');
    finishButton.mousePressed(saveResults);
    finishButton.hide();

    sliders = [];
    for (var i = 0; i < measuredValues.length; i++) {
        sliders.push(createSlider(ranges[i][0], ranges[i][1], measuredValues[i], 1 / 1000));
        sliders[i].hide();
    }
    if (stageToValue[stage] != null) {
        sliders[stageToValue[stage]].show();
    }

    adaptTimeInput = createInput(adaptTime);
    adaptTimeInput.show();
    participantInput = createInput();
    participantInput.show();
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.5;
    stimSize = max(width, height) * 0.3;

    fontSize = width * 0.015;
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    fixCrossSize = hgDims[1] / 2;
}

function draw() {
    readSliderValue();
    background(0);
    drawSlider();

    if (stage == 0) {
        fill(1);
        textSize(fontSize * 2);
        text("experiment settings", width * 0.5, height * 0.2);
        textAlign(LEFT);
        textSize(fontSize * 1.5);
        text("adaptation time:", width * 0.3, height * 0.3);
        adaptTimeInput.position(width * 0.5 - width * 0.1, height * 0.325);
        styleElement(adaptTimeInput, width * 0.2, height * 0.05, fontSize * 1.5);

        text("participant ID:", width * 0.3, height * 0.6);
        participantInput.position(width * 0.5 - width * 0.1, height * 0.625);
        styleElement(participantInput, width * 0.2, height * 0.05, fontSize * 1.5);
        textAlign(CENTER);
    }
    if (stage == 1) {
        fill(1);
        textSize(fontSize * 2);
        text("gaze contingency calibration 1", width * 0.5, height * 0.2);
    }
    if (stage == 2) {
        fill(1);
        textSize(fontSize * 2);
        text("gaze contingency test", width * 0.5, height * 0.2);
    }
    if (stage == 3) {
        fill(1);
        textSize(fontSize * 2);
        text("HG instructions", width * 0.5, height * 0.2);
    }
    if (stage == 4) {
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[0]]);
    }
    if (stage == 5) {
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[1]]);
    }
    if (stage == 6) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[0]]);
    }
    if (stage == 7) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[1]]);
    }
    if (stage == 8) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[0]]);
    }
    if (stage == 9) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[1]]);
    }
    if (stage == 10) {
        fill(1);
        textSize(fontSize * 2);
        text("gaze contingency calibration 2", width * 0.5, height * 0.2);
    }
    if (stage == 11) {
        fill(1);
        textSize(fontSize * 2);
        text("McCollough adaptation instructions", width * 0.5, height * 0.2);
    }
    if (stage == 12) { //adaptation
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
                drawFixCross(stimX, stimY);
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
                drawFixCross(stimX, stimY);
            }
            else {
                adapt = true;
                mask = false;
                adaptCounter++;
                timestamp = millis();
            }
        }
    }
    if (stage == 13) {
        fill(1);
        textSize(fontSize * 2);
        text("HG instructions", width * 0.5, height * 0.2);
    }
    if (stage == 14) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[0]]);
    }
    if (stage == 15) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[1]]);
    }
    if (stage == 16) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[0]]);
    }
    if (stage == 17) {
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1],[1,-1]][hgPreTestOrder()[1]]);
    }
    if (stage == 18) {
        fill(1);
        textSize(fontSize * 2);
        text("gaze contingency calibration 3", width * 0.5, height * 0.2);
    }
    if (stage == 19) {
        fill(1);
        textSize(fontSize * 2);
        text("McCollough test instructions", width * 0.5, height * 0.2);
    }
    if (stage == 20) {
        drawTest(mcTestOrder()[0]);
    }
    if (stage == 21) {
        drawTest(mcTestOrder()[1]);
    }
    if (stage == 22) {
        drawTest(mcTestOrder()[2]);
    }
    if (stage == 23) {
        drawTest(mcTestOrder()[3]);
    }
    if (stage == endStage) {
        fill(1);
        textSize(fontSize * 2);
        text("experiment finished\n\nresults saved", width * 0.5, height * 0.4);
        noFill();
    }

    prevButton.position(width * 0.03, height * 0.88);
    styleElement(prevButton, width * 0.1, height * 0.08, fontSize);
    nextButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(nextButton, width * 0.1, height * 0.08, fontSize);
    finishButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(finishButton, width * 0.1, height * 0.08, fontSize);
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
    var go = true;

    if (stage == 0 && participantInput.value() == '') {
        go = false;
    }

    if (go) {
        stage = constrain(stage + change, startStage, endStage);
        if (stage == 0) {
            adaptTimeInput.show();
            participantInput.show();
        }
        if (stage == 1) {
            prevButton.show();
            adaptTimeInput.hide();
            participantInput.hide();
            participantID = participantInput.value();
        }
        if (stage == 12) {
            if (0 < change) {
                startAdaptStage();
            }
        }
        if (stage == 13) {
            endAdaptStage();
            if (change < 0) {
                nextButton.show();
            }
        }
        if (stage == endStage - 1) {
            nextButton.hide();
            finishButton.show();
        }
        if (stage == endStage) {
            finishButton.hide();
            prevButton.hide();
        }
        handleSliderVisibility();
    }
}

function handleSliderVisibility() {
    for (var i = 0; i <= measuredValues.length; i++) {
        if (i == stageToValue[stage] && sliders[i] != undefined) {
            sliders[i].show();
        }
        else if(sliders[i] != undefined){
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

function drawSlider() {
    if (stageToValue[stage] != null) {
        sliders[stageToValue[stage]].position(width * 0.5 - width * 0.4 * 0.5, height * 0.1);
        sliders[stageToValue[stage]].style("width", width * 0.4 + "px");
        fill(1);
        textSize(fontSize);
        text("< A ", width * 0.35, height * 0.045);
        text(" D >", width * 0.65, height * 0.045);
        text("<< J", width * 0.35, height * 0.085);
        text("L >>", width * 0.65, height * 0.085);
        noFill();
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

    if (key === 'a' || key === 'A') {
        changeSliderValue(-0.005);
    }
    if (key === 'd' || key === 'D') {
        changeSliderValue(0.005);
    }

    if (key === 'j' || key === 'J') {
        changeSliderValue(-0.05);
    }
    if (key === 'l' || key === 'L') {
        changeSliderValue(0.05);
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
            vertex(x + gS * shrink * (coords[i - 1] + sW / 2), y + gS * shrink * (-0.5 + sW / 2 - sW));
            vertex(x + gS * shrink * (coords[i - 1] - sW / 2), y + gS * shrink * (-0.5 + sW / 2 - sW));
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
            vertex(x + gS * shrink * (coords[i - 1] + sW / 2), y + gS * shrink * (-0.5 + sW / 2 - sW));
            vertex(x + gS * shrink * (coords[i - 1] - sW / 2), y + gS * shrink * (-0.5 + sW / 2 - sW));
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

function mcTestOrder() {
    return [
        [1, 2, 3, 4],
        [2, 1, 3, 4],
        [1, 2, 4, 3],
        [2, 1, 4, 3],
        [3, 4, 1, 2],
        [4, 3, 1, 2],
        [3, 4, 2, 1],
        [4, 3, 2, 1]
    ][(participantID - 1) % 8];
}

function hgPreTestOrder(){
    return [
        [0,1],
        [1,0]
    ][(participantID - 1) % 2]
}

function hgPostTestOrder(){
    return [
        [0,1],
        [1,0]
    ][(participantID - 1) % 2]
}

function drawTest(which) {
    if (which == 1) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawTestMask([-1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 2) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawTestMask([1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 3) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawTestMask([-1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 4) {
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawTestMask([1, -1]);
        drawFixCross(stimX, stimY);
    }
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

function saveResults() {
    var resultsTable = new p5.Table();

    resultsTable.addColumn('participantID');
    resultsTable.addColumn('adaptTime');
    resultsTable.addColumn('mcTestOrder');
    resultsTable.addColumn('HGnocolPreNa');
    resultsTable.addColumn('HGnocolPreA');
    resultsTable.addColumn('HGbelowcolPreNa');
    resultsTable.addColumn('HGbelowcolPreA');
    resultsTable.addColumn('HGabovecolPreNa');
    resultsTable.addColumn('HGabovecolPreA');
    resultsTable.addColumn('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[0]]);
    resultsTable.addColumn('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[1]]);
    resultsTable.addColumn('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[2]]);
    resultsTable.addColumn('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[3]]);
    resultsTable.addColumn('HGnocolPostNa');
    resultsTable.addColumn('HGnocolPostA');
    resultsTable.addColumn('HGbelowcolPostNa');
    resultsTable.addColumn('HGbelowcolPostA');
    resultsTable.addColumn('HGabovecolPostNa');
    resultsTable.addColumn('HGabovecolPostA');

    let newRow = resultsTable.addRow();
    newRow.setNum('participantID', participantID);
    newRow.setNum('adaptTime', adaptTime);
    newRow.setNum('mcTestOrder', mcTestOrder());
    newRow.setNum('HGnocolPreNa', measuredValues[0]);
    newRow.setNum('HGnocolPreA', measuredValues[1]);
    newRow.setNum('HGbelowcolPreNa', measuredValues[2]);
    newRow.setNum('HGbelowcolPreA', measuredValues[3]);
    newRow.setNum('HGabovecolPreNa', measuredValues[4]);
    newRow.setNum('HGabovecolPreA', measuredValues[5]);
    newRow.setNum('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[0]], measuredValues[6]);
    newRow.setNum('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[1]], measuredValues[7]);
    newRow.setNum('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[2]], measuredValues[8]);
    newRow.setNum('MC' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[3]], measuredValues[9]);
    newRow.setNum('HGnocolPostNa', measuredValues[10]);
    newRow.setNum('HGnocolPostA', measuredValues[11]);
    newRow.setNum('HGbelowcolPostNa', measuredValues[12]);
    newRow.setNum('HGbelowcolPostA', measuredValues[13]);
    newRow.setNum('HGabovecolPostNa', measuredValues[14]);
    newRow.setNum('HGabovecolPostA', measuredValues[15]);

    saveTable(resultsTable, 'results_' + participantID + '.csv');

    goToNextStage();
}