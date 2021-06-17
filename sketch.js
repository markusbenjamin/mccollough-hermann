var stimX, stimY, stimSize;
var stage, startStage, endStage, adaptStage;
var fontSize;
var fixCrossSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors, nonadaptColors;
var adapt, mask, adaptFinished;
var adaptDuration, switchDuration, adaptCounter, adaptMaskSwitchTime, adaptStartTime, adaptAwayDuration;

var prevButton, nextButton, finishButton;

var stageToValue, measuredValues, measuredValuesDefault, ranges;
var sliders;

var adaptDurationInput, participantInput;

var saved;

//load gaze filter
let WASM_URL;

async function loadGazeFilter() {
    WASM_URL = "./gazefilter.wasm";
    await gazefilter.init("gazefilter.wasm");
    await gazefilter.tracker.connect();
}

//calibration
var calibStatus;
var calibEyeString;
var calibError;
var calibration;
var calibDots;
var calibSize;
var calibDotSize;

//tracking data
var faceStatus; //TrackEvent.detected

var trackingStatus; //TrackEvent.eventType
var pog; //TrackEvent.pogArray()
var bestGazeP; //TrackEvent.bestGazePoint()

var fixPoint; //TrackEvent.fixationPoint()
var fixDur; //TrackEvent.fixationDuration()
var fixStatus; //TrackEvent.fixationEvent()

//settings, misc vars
var gazeSmoothNum;
var pogs = [];
var pogSmooth;

//discriminator
var discrOn;
var discrDist;
var discrAwayStatusDuration, discrAwayJudgementTime;
var discrChangeTime;
var discrJudgement;
var discrStatus;

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

    maskDuration = 500;
    adaptDuration = 20;
    switchDuration = 2000;
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
    adaptStage = 12;

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

    adaptDurationInput = createInput(adaptDuration);
    adaptDurationInput.show();
    participantInput = createInput();
    participantInput.show();

    loadGazeFilter();
    pogSmooth = [-1, -1];

    gazeSmoothNum = 15;

    discrOn = false;
    discrDist = 300;
    discrAwayStatusDuration = 60;
    discrSmoothTime = 400;

    discrStatus = -1;
    discrJudgement = -1;

    calibSize = 0.8;

    saved = false;
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.5;
    stimSize = max(width, height) * 0.3;

    fontSize = width * 0.015;
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);

    fixCrossSize = hgDims[1] / 2;

    calibDotSize = width * 0.01;
}

function draw() {
    readSliderValue();
    background(0);
    drawSlider();
    if (discrOn) {
        runDiscriminator();
    }

    if (stage == 0) {
        fill(1);
        textSize(fontSize * 2);
        text("experiment settings", width * 0.5, height * 0.2);
        textAlign(LEFT);
        textSize(fontSize * 1.5);
        text("adaptation time:", width * 0.3, height * 0.3);
        adaptDurationInput.position(width * 0.5 - width * 0.1, height * 0.325);
        styleElement(adaptDurationInput, width * 0.2, height * 0.05, fontSize * 1.5);

        text("participant ID:", width * 0.3, height * 0.6);
        participantInput.position(width * 0.5 - width * 0.1, height * 0.625);
        styleElement(participantInput, width * 0.2, height * 0.05, fontSize * 1.5);
        textAlign(CENTER);
    }
    if (stage == 1) {
        runCalibration();
    }
    if (stage == 2) {
        drawDiscriminator();
        //showTrackingPredictions();
        //showTrackingStatus();
    }
    if (stage == 3) {
        fill(1);
        textSize(fontSize * 2);
        text("HG instructions", width * 0.5, height * 0.2);
    }
    if (stage == 4) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
        }
    }
    if (stage == 5) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
        }
    }
    if (stage == 6) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
        }
    }
    if (stage == 7) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
        }
    }
    if (stage == 8) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
        }
    }
    if (stage == 9) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
        }
    }
    if (stage == 10) {
        runCalibration();
    }
    if (stage == 11) {
        fill(1);
        textSize(fontSize * 2);
        text("McCollough adaptation instructions", width * 0.5, height * 0.2);
    }
    if (stage == adaptStage) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            if (adaptFinished) {
                fill(1);
                textSize(fontSize * 2);
                text("adaptation phase finished", stimX, stimY);
                noFill();
            }
            else if (adapt) {
                if (millis() - adaptMaskSwitchTime < switchDuration) {
                    var flicker = (adaptCounter / 2) % 2;
                    drawMcCollough(adaptColors[flicker], stimSize, mcN, stimX, stimY, flicker);
                    var naDims = getNonadaptDims([-1, 1]);
                    var x = naDims[0];
                    var y = naDims[1];
                    fill(0);
                    stroke(0);
                    rect(x, y, naDims[2], naDims[3]);
                    noFill();
                    noStroke();
                    drawFixCross(stimX, stimY);
                }
                else {
                    adapt = false;
                    mask = true;
                    adaptCounter++;
                    adaptMaskSwitchTime = millis();
                }
            }
            else if (mask) {
                if (millis() - adaptMaskSwitchTime < maskDuration) {
                    fill(0);
                    rect(stimX, stimY, stimSize, stimSize);
                    noFill();
                    drawFixCross(stimX, stimY);
                }
                else {
                    adapt = true;
                    mask = false;
                    adaptCounter++;
                    adaptMaskSwitchTime = millis();
                }
            }
            if ((adapt || mask) && adaptDuration * 1000 * 60 < millis() - adaptAwayDuration - adaptStartTime) {
                endAdaptStage();
            }
        }
        /*fill(1);
        textSize(fontSize * 2);
        text(round(adaptDuration * 60 * 1000 - (millis() - adaptAwayDuration - adaptStartTime)), width * 0.5, height * 0.2);*/
    }
    if (stage == 13) {
        fill(1);
        textSize(fontSize * 2);
        text("HG instructions", width * 0.5, height * 0.2);
    }
    if (stage == 14) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
        }
    }
    if (stage == 15) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
        }
    }
    if (stage == 16) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
        }
    }
    if (stage == 17) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
            drawFixCross(stimX, stimY);
            drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
        }
    }
    if (stage == 18) {
        runCalibration();
    }
    if (stage == 19) {
        fill(1);
        textSize(fontSize * 2);
        text("McCollough test instructions", width * 0.5, height * 0.2);
    }
    if (stage == 20) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawTest(mcTestOrder()[0]);
        }
    }
    if (stage == 21) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawTest(mcTestOrder()[1]);
        }
    }
    if (stage == 22) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawTest(mcTestOrder()[2]);
        }
    }
    if (stage == 23) {
        if (discrJudgement == 1) {
            drawAwayMessage();
        }
        else {
            drawTest(mcTestOrder()[3]);
        }
    }
    if (stage == endStage) {
        var savedString
        if (saved) {
            savedString = "saved";
        }
        else {
            savedString = "not yet saved";
        }
        fill(1);
        textSize(fontSize * 2);
        text("experiment finished\n\nresults " + savedString, width * 0.5, height * 0.4);
        noFill();
    }

    prevButton.position(width * 0.03, height * 0.88);
    styleElement(prevButton, width * 0.1, height * 0.08, fontSize);
    nextButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(nextButton, width * 0.1, height * 0.08, fontSize);
    finishButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(finishButton, width * 0.1, height * 0.08, fontSize);
}

function drawDiscriminator() {
    strokeWeight(3);
    noFill();
    if (discrJudgement == 1) {
        stroke(1, 1, 1);
    }
    else if (discrJudgement == 0) {
        stroke(0.33, 1, 1);
    }
    else {
        stroke(0.55, 1, 1);
    }
    ellipse(stimX, stimY, discrDist * 2, discrDist * 2);
    drawFixCross(stimX, stimY);
}

function drawDiscrStatus() {
    fill(1, 1, 1);
    textSize(50);
    text('\t' + discrStatus + '\t' + discrJudgement + '\n' + discrStatus * round(millis() - discrChangeTime), width * 0.5, height * 0.1);
    noFill();
}

function drawAwayMessage() {
    fill(1);
    textSize(fontSize * 2);
    text("please keep looking at the fixation cross", width * 0.5, height * 0.35);
    noFill();
    drawFixCross(stimX, stimY);
}

function startDiscriminator() {
    discrChangeTime = 0;
    discrStatus = 0;
    discrJudgement = 0;
}

function runDiscriminator() {
    if (isNaN(bestGazeP[0])) {
        discrStatus = -1;
        discrJudgement = -1;
    }
    else {
        var smoothPog = getSmoothPog(round(getFrameRate() * discrSmoothTime / 1000));
        if (discrDist < dist(smoothPog[0], smoothPog[1], width * 0.5, height * 0.5)) {
            if (discrStatus == 0) {
                discrChangeTime = millis();
            }
            discrStatus = 1;
        }
        else {
            discrStatus = 0;
        }

        if (discrStatus == 1 && discrAwayStatusDuration < millis() - discrChangeTime) {
            awayJudgement(discrJudgement);
        }
        else {
            atJudgement(discrJudgement);
        }
    }
}

function awayJudgement(pre) {
    discrJudgement = 1;
    if (pre == 0) {
        discrAwayJudgementTime = millis();
    }
}

function atJudgement(pre) {
    discrJudgement = 0;
    if (pre == 1 && stage == adaptStage) {
        adaptAwayDuration += millis() - discrAwayJudgementTime;
    }
}

function getSmoothPog(n) {
    var twoEyesSmooth = mean(pogs.slice(-n));
    return [(twoEyesSmooth[0] + twoEyesSmooth[2]) / 2, (twoEyesSmooth[1] + twoEyesSmooth[3]) / 2]
}

function startCalibration(w, h) {
    window.addEventListener("click", onmouseclick);
    calibration = true;
    calibDots = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            calibDots.push([stimX + i * w / 3, stimY + j * h / 3, 5])
        }
    }
}

function runCalibration() {
    for (var i = 0; i < calibDots.length; i++) {
        if (0 < calibDots[i][2]) {
            if (i == 4 && 5 < total(calibDots)[2]) {
                fill(1);
                textSize(fontSize * 1.5);
                text("click each yellow dot five times", calibDots[i][0], calibDots[i][1]);
            }
            else {
                fill(0.15, 1, calibDots[i][2] / 5);
                ellipse(calibDots[i][0], calibDots[i][1], calibDotSize, calibDotSize);
            }
        }
    }
    noFill();
    if (total(calibDots)[2] <= 0) {
        goToNextStage();
    }
}

function endCalibration() {
    window.removeEventListener("click", onmouseclick);
    calibration = false;
}

function mousePressed() {
    if (calibration) {
        for (var i = 0; i < calibDots.length; i++) {
            if (dist(mouseX, mouseY, calibDots[i][0], calibDots[i][1]) < calibDotSize / 2) {
                calibDots[i][2]--;
            }
        }
    }
}

function showTrackingPredictions() {
    if (bestGazeP != undefined) {
        stroke(1, 1, 1);
        line(bestGazeP[0] - 20, bestGazeP[1] - 20, bestGazeP[0] + 20, bestGazeP[1] + 20);
        line(bestGazeP[0] - 20, bestGazeP[1] + 20, bestGazeP[0] + 20, bestGazeP[1] - 20);
        noStroke();
    }

    if (gazeSmoothNum < pogs.length) {
        stroke(1, 1, 1, 0.1);
        ellipse(pogSmooth[0], pogSmooth[1], 20, 20);
        stroke(0.333, 1, 1, 0.1);
        ellipse(pogSmooth[2], pogSmooth[3], 20, 20);
        stroke(1);
        ellipse((pogSmooth[0] + pogSmooth[2]) / 2, (pogSmooth[1] + pogSmooth[3]) / 2, 20, 20);
        noStroke();
    }

    if (fixStatus === "fixation") {
        stroke(1);
        line(fixPoint[0] - 40, fixPoint[1], fixPoint[0] + 40, fixPoint[1]);
        line(fixPoint[0], fixPoint[1] - 40, fixPoint[0], fixPoint[1] + 40);
        noStroke();
    }
}

function showTrackingStatus() {
    textAlign(LEFT);
    textSize(20);
    fill(1);
    text(
        "FACE: " + faceStatus +
        "\nCALIBRATION: " + calibEyeString + ", error: " + calibError + " px" +
        "\nTRACKING: " + trackingStatus +
        "\nFIXATION: " + fixStatus + ", duration: " + fixDur / 1000 + " s"
        , width * 0.015, height * 0.05);
    noFill();
    textAlign(CENTER);
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
    adaptFinished = false;
    adaptCounter = 0;
    adaptMaskSwitchTime = millis();
    adaptStartTime = millis();
    adaptAwayDuration = 0;
    adaptDuration = adaptDurationInput.value();
}

function endAdaptStage() {
    adaptFinished = true;
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
            adaptDurationInput.show();
            participantInput.show();
        }
        if (stage == 1) {
            prevButton.show();
            adaptDurationInput.hide();
            participantInput.hide();
            participantID = participantInput.value();
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 2) {
            discrOn = true;
            endCalibration();
            startDiscriminator();
        }
        if (stage == 10) {
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 11) {
            endCalibration();
        }
        if (stage == adaptStage) {
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
        if (stage == 18) {
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 19) {
            endCalibration();
        }
        if (stage == endStage - 1) {
            nextButton.hide();
            finishButton.show();
        }
        if (stage == endStage) {
            if (saved == false) {
                saveResults();
            }
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
        else if (sliders[i] != undefined) {
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
        if (discrJudgement == 0) {
            sliders[stageToValue[stage]].show();
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
        else {
            sliders[stageToValue[stage]].hide();
            drawAwayMessage();
        }
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

function hgPreTestOrder() {
    return [
        [0, 1],
        [1, 0]
    ][(participantID - 1) % 2]
}

function hgPostTestOrder() {
    return [
        [0, 1],
        [1, 0]
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
    resultsTable.addColumn('adaptDuration');
    resultsTable.addColumn('mcTestOrder');
    resultsTable.addColumn('hrPreTestOrder');
    resultsTable.addColumn('hgPostTestOrder');
    resultsTable.addColumn('HGnocolPreNa');
    resultsTable.addColumn('HGnocolPreA');
    resultsTable.addColumn('HGbelowcolPreNa');
    resultsTable.addColumn('HGbelowcolPreA');
    resultsTable.addColumn('HGabovecolPreNa');
    resultsTable.addColumn('HGabovecolPreA');
    resultsTable.addColumn('HGbelowcolPostNa');
    resultsTable.addColumn('HGbelowcolPostA');
    resultsTable.addColumn('HGabovecolPostNa');
    resultsTable.addColumn('HGabovecolPostA');
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[0] - 1]);
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[1] - 1]);
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[2] - 1]);
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[3] - 1]);

    let newRow = resultsTable.addRow();
    newRow.setNum('participantID', participantID);
    newRow.setNum('adaptDuration', adaptDuration);
    newRow.setNum('mcTestOrder', mcTestOrder());
    newRow.setNum('hrPreTestOrder', hgPreTestOrder());
    newRow.setNum('hgPostTestOrder', hgPostTestOrder());
    newRow.setNum('HGnocolPreNa', measuredValues[0]);
    newRow.setNum('HGnocolPreA', measuredValues[1]);
    newRow.setNum('HGbelowcolPreNa', measuredValues[2]);
    newRow.setNum('HGbelowcolPreA', measuredValues[3]);
    newRow.setNum('HGabovecolPreNa', measuredValues[4]);
    newRow.setNum('HGabovecolPreA', measuredValues[5]);
    newRow.setNum('HGbelowcolPostNa', measuredValues[6]);
    newRow.setNum('HGbelowcolPostA', measuredValues[7]);
    newRow.setNum('HGabovecolPostNa', measuredValues[8]);
    newRow.setNum('HGabovecolPostA', measuredValues[9]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[0] - 1], measuredValues[10]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[1] - 1], measuredValues[11]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[2] - 1], measuredValues[12]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[3] - 1], measuredValues[13]);

    saveTable(resultsTable, 'results_' + participantID + '.csv');

    if (saved == false) {
        saved = true;
        goToNextStage();
    }
}