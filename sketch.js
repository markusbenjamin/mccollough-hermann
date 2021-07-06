var stimX, stimY, stimSize;
var stage, startStage, endStage, adaptStage;
var fontSize;
var fixCrossSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors, nonadaptColors;
var adapt, mask, adaptFinished;
var adaptStageDuration, adaptDuration, adaptCounter, adaptMaskSwitchTime, adaptStartTime, adaptAwayDuration;

var prevButton, nextButton, finishButton;

var stageToValue, measuredValues, measuredValuesDefault, ranges, stageNames;
var sliders;

var adaptStageDurationInput, participantInput;

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

var gazeTable;

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
    strokeCap(SQUARE);
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

    adaptColors = [color(1, 1, 1), color(1 / 3, 1, 1)];
    nonadaptColors = [color(0), color(1)];

    maskDuration = 500;
    adaptStageDuration = 20;
    adaptDuration = 2000;
    nonadaptColor = 0;

    stageNames = ['start', 'calib 1', 'gaze tracking test', 'HG warmup instructions', 'HG warmup', 'HG instructions 1', 'HG nocol pre a/na 1.1', 'HG nocol pre a/na 1.2', 'HG nocol pre a/na 2.1', 'HG nocol pre a/na 2.2', 'HG below pre a/na 1.1', 'HG below pre a/na 1.2', 'HG below pre a/na 2.1', 'HG below pre a/na 2.2', 'HG above pre a/na', 'HG above pre a/na', 'calib 1', 'adapt instructions', 'adapt', 'HG instructions 2', 'HG below post a/na 1.1', 'HG below post a/na 1.2', 'HG below post a/na 2.1', 'HG below post a/na 2.2', 'HG above post a/na', 'HG above post a/na', 'calib 3', 'MC test instructions', 'MC test 1', 'MC test 2', 'MC test 3', 'MC test 4', 'end'];
    stageToValue = [null, null, null, null, 0, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, null, null, null, 11, 12, 13, 14, 15, 16, null, null, 17, 18, 19, 20, null];
    measuredValues = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0, 0];
    ranges = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1]];
}

function initialize() {
    calculateSizes();

    stage = 0;
    startStage = 0;
    endStage = 32;
    adaptStage = 18;

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

    adaptStageDurationInput = createInput(adaptStageDuration);
    adaptStageDurationInput.show();
    participantInput = createInput();
    participantInput.show();

    loadGazeFilter();
    pogSmooth = [-1, -1];
    pog = [NaN, NaN, NaN, NaN];

    gazeSmoothNum = 15;

    discrOn = false;
    discrDist = 400;
    discrAwayStatusDuration = 500;
    discrSmoothTime = 400;

    discrStatus = -1;
    discrJudgement = -1;

    calibSize = 0.8;

    saved = false;

    startTrackingTable();

    discrAwayJudgementTime = -1;
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.5;
    stimSize = max(width, height) * 0.2;

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

    if (stage == 0) { //exp start
        fill(1);
        textSize(fontSize * 2);
        text("experiment settings", width * 0.5, height * 0.2);
        textAlign(LEFT);
        textSize(fontSize * 1.5);
        text("adaptation time:", width * 0.3, height * 0.3);
        adaptStageDurationInput.position(width * 0.5 - width * 0.1, height * 0.325);
        styleElement(adaptStageDurationInput, width * 0.2, height * 0.05, fontSize * 1.5);

        text("participant ID:", width * 0.3, height * 0.6);
        participantInput.position(width * 0.5 - width * 0.1, height * 0.625);
        styleElement(participantInput, width * 0.2, height * 0.05, fontSize * 1.5);
        textAlign(CENTER);
    }
    if (stage == 1) { //calib 1
        runCalibration();
    }
    if (stage == 2) { //gaze track test
        drawDiscriminator();
        //showTrackingPredictions();
        //showTrackingStatus();
    }
    if (stage == 3) { //HG warmup instructions
        fill(1);
        textSize(fontSize * 2);
        text("HG warmup instructions", width * 0.5, height * 0.2);
    }
    if (stage == 4) { //HG warmup
        drawMcCollough(color(1), stimSize * 1.35, 6, stimX, stimY, 1);
        drawFixCross(stimX, stimY);
        fill(0.85);
        rect(stimX - stimSize * 1.35 * 0.5 * 1.7, stimY, stimSize * 1.35 * 0.5 * 0.65, stimSize * 1.35 * 0.5 * 0.65);
        fill(measuredValues[stageToValue[stage]]);
        rect(stimX + stimSize * 1.35 * 0.5 * 1.7, stimY, stimSize * 1.35 * 0.5 * 0.65, stimSize * 1.35 * 0.5 * 0.65);
        noFill();
    }
    if (stage == 5) { //HG instructions
        fill(1);
        textSize(fontSize * 2);
        text("HG instructions", width * 0.5, height * 0.2);
    }
    if (stage == 6) { //HG nocol a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 7) { //HG nocol a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 8) { //HG nocol a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 9) { //HG nocol a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 10) { //HG above a/na pre
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 11) { //HG above a/na pre
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 12) { //HG below a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 13) { //HG below a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 14) { //HG below a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 15) { //HG below a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 16) { //calib 2
        runCalibration();
    }
    if (stage == 17) { //adapt instructions
        fill(1);
        textSize(fontSize * 2);
        text("McCollough adaptation instructions", width * 0.5, height * 0.2);
    }
    if (stage == adaptStage) { //adapt
        if (adaptFinished) {
            fill(1);
            textSize(fontSize * 2);
            text("adaptation phase finished", stimX, stimY);
            noFill();
        }
        else {
            if (discrJudgement == 1) {
                adaptAwayDuration += millis() - discrAwayJudgementTime;
                discrAwayJudgementTime = millis();
            }
            if (adapt) {
                if (millis() - adaptMaskSwitchTime < adaptDuration) {
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
            if ((adapt || mask) && adaptStageDuration * 1000 * 60 < millis() - adaptAwayDuration - adaptStartTime) {
                endAdaptStage();
            }
            rectMode(CORNER);
            fill(1);
            rect(width * 0.33, height * 0.05, width * 0.33 - width * 0.33 * (millis() - adaptAwayDuration - adaptStartTime) / (adaptStageDuration * 60 * 1000), height * 0.02);
            rectMode(CENTER);
            noFill();
        }
        /*fill(1);
        textSize(fontSize * 2);
        //text(round(adaptStageDuration * 60 * 1000 - (millis() - adaptAwayDuration - adaptStartTime)), width * 0.5, height * 0.2);
        text(1-(millis() - adaptAwayDuration - adaptStartTime)/(adaptStageDuration * 60 * 1000), width * 0.5, height * 0.2);*/
    }
    if (stage == 19) { //HG instructions
        fill(1);
        textSize(fontSize * 2);
        text("HG instructions", width * 0.5, height * 0.2);
    }
    if (stage == 20) { //HG above a/na post
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 21) { //HG above a/na post
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 22) { //HG below a/na post 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 23) { //HG below a/na post 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 24) { //HG below a/na post 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[0]]);
    }
    if (stage == 25) { //HG below a/na post 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreTestOrder()[1]]);
    }
    if (stage == 26) { //calib 3
        runCalibration();
    }
    if (stage == 27) { //MC test instructions
        fill(1);
        textSize(fontSize * 2);
        text("McCollough test instructions", width * 0.5, height * 0.2);
    }
    if (stage == 28) { //MC test 1
        drawTest(mcTestOrder()[0]);
    }
    if (stage == 29) { //MC test 2
        drawTest(mcTestOrder()[1]);
    }
    if (stage == 30) { //MC test 3
        drawTest(mcTestOrder()[2]);
    }
    if (stage == 31) { //MC test 4
        drawTest(mcTestOrder()[3]);
    }
    if (stage == endStage) { //end
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

    saveTracking();
}

function startTrackingTable() {
    gazeTable = new p5.Table();
    gazeTable.addColumn('frame');
    gazeTable.addColumn('time');
    gazeTable.addColumn('stage');
    gazeTable.addColumn('stageName');
    gazeTable.addColumn('stageVal');
    gazeTable.addColumn('discrjudgement');
    gazeTable.addColumn('discrstatus');
    gazeTable.addColumn('pogrx');
    gazeTable.addColumn('pogry');
    gazeTable.addColumn('poglx');
    gazeTable.addColumn('pogly');
    gazeTable.addColumn('mousex');
    gazeTable.addColumn('mousey');
}

function saveTracking() {
    newRow = gazeTable.addRow();
    newRow.setNum('frame', frameCount);
    newRow.setNum('time', millis());
    newRow.setNum('stage', stage);
    newRow.setString('stageName', stageNames[stage]);
    newRow.setNum('stageVal', measuredValues[stageToValue[stage]]);
    newRow.setNum('discrjudgement', discrJudgement);
    newRow.setNum('discrstatus', discrStatus);
    newRow.setNum('pogrx', pog[0]);
    newRow.setNum('pogry', pog[1]);
    newRow.setNum('poglx', pog[2]);
    newRow.setNum('pogly', pog[3]);
    newRow.setNum('mousex', mouseX);
    newRow.setNum('mousey', mouseY);
}

function exportTrackingTable() {
    saveTable(gazeTable, 'gaze_data_' + participantID + '.csv');
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

function startDiscriminator() {
    discrChangeTime = 0;
    discrStatus = 0;
    discrJudgement = 0;
    discrOn = true;
}

function stopDiscriminator() {
    discrChangeTime = 0;
    discrStatus = 0;
    discrJudgement = 0;
    discrOn = false;
}

function runDiscriminator() {
    if (isNaN(pog[0])) {
        discrStatus = -1;
        discrJudgement = -1;
    }
    else {
        var smoothPog = getSmoothPog(round(getFrameRate() * discrSmoothTime / 1000));
        if (discrDist < dist(smoothPog[0], smoothPog[1], width * 0.5, height * 0.5)) {
            //if (discrDist < dist(mouseX, mouseY, width * 0.5, height * 0.5)) {
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
    if (pre == 1) {
        discrAwayJudgementTime = -1;
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
    adaptStageDuration = adaptStageDurationInput.value();
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
        if (stage == 0) { //start
            adaptStageDurationInput.show();
            participantInput.show();
        }
        if (stage == 1) { //calib 1
            prevButton.show();
            adaptStageDurationInput.hide();
            participantInput.hide();
            participantID = participantInput.value();
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 2) { //gaze tracking test
            discrOn = true;
            endCalibration();
            startDiscriminator();
        }
        if (stage == 16) { //calib 2
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 17) { //adapt instructions
            endCalibration();
        }
        if (stage == adaptStage) { //adapt
            if (0 < change) {
                startAdaptStage();
            }
        }
        if (stage == 19) { // HG instructions
            endAdaptStage();
            if (change < 0) {
                nextButton.show();
            }
        }
        if (stage == 26) { // calib 3
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 27) { // MC test instructions
            endCalibration();
        }
        if (stage == endStage - 1) { //MC test 4
            nextButton.hide();
            finishButton.show();
        }
        if (stage == endStage) { //end
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
}

function drawFixCross(x, y) {
    var duration = (millis() - discrAwayJudgementTime) / 1000;
    var time1 = 3;
    var time2 = 7;
    var fixCrossSizeActual;
    strokeWeight(3);
    if (discrAwayJudgementTime == -1 || duration < time1) {
        stroke(1);
        fixCrossSizeActual = fixCrossSize;
    }
    else if (time1 < duration && duration < time2) {
        if (round(duration * 2) % 2 == 0) {
            stroke(1, 1, 1, 0);
        } else {
            stroke(1);
        }
        fixCrossSizeActual = fixCrossSize;
    }
    else if (time2 < duration) {
        if (round(duration * 3) % 2 == 0) {
            stroke(1, 1, 1, 0);
        } else {
            stroke(1);
        }
        fixCrossSizeActual = map(duration, time2, time2 * 3, fixCrossSize, fixCrossSize * 2);

    }
    console.log(round(duration));

    line(x - fixCrossSizeActual, y, x + fixCrossSizeActual, y);
    line(x, y - fixCrossSizeActual, x, y + fixCrossSizeActual);
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

    if (key == 'q' || key == 'Q') {
        if (discrOn) {
            stopDiscriminator()
        }
        else {
            startDiscriminator();
        }
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
    resultsTable.addColumn('expDuration');
    resultsTable.addColumn('adaptStageDuration');
    resultsTable.addColumn('mcTestOrder');
    resultsTable.addColumn('hrPreTestOrder');
    resultsTable.addColumn('hgPostTestOrder');
    resultsTable.addColumn('HGnocolPreNa1');
    resultsTable.addColumn('HGnocolPreA1');
    resultsTable.addColumn('HGnocolPreNa2');
    resultsTable.addColumn('HGnocolPreA2');
    resultsTable.addColumn('HGbelowcolPreNa1');
    resultsTable.addColumn('HGbelowcolPreA1');
    resultsTable.addColumn('HGbelowcolPreNa2');
    resultsTable.addColumn('HGbelowcolPreA2');
    resultsTable.addColumn('HGabovecolPreNa');
    resultsTable.addColumn('HGabovecolPreA');
    resultsTable.addColumn('HGbelowcolPostNa1');
    resultsTable.addColumn('HGbelowcolPostA1');
    resultsTable.addColumn('HGbelowcolPostNa2');
    resultsTable.addColumn('HGbelowcolPostA2');
    resultsTable.addColumn('HGabovecolPostNa');
    resultsTable.addColumn('HGabovecolPostA');
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[0] - 1]);
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[1] - 1]);
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[2] - 1]);
    resultsTable.addColumn('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[3] - 1]);

    let newRow = resultsTable.addRow();
    newRow.setNum('participantID', participantID);
    newRow.setNum('expDuration', millis() / 1000 / 60);
    newRow.setNum('adaptStageDuration', adaptStageDuration);
    newRow.setNum('mcTestOrder', mcTestOrder());
    newRow.setNum('hrPreTestOrder', hgPreTestOrder());
    newRow.setNum('hgPostTestOrder', hgPostTestOrder());
    newRow.setNum('HGnocolPreNa1', measuredValues[1]);
    newRow.setNum('HGnocolPreA1', measuredValues[2]);
    newRow.setNum('HGnocolPreNa2', measuredValues[3]);
    newRow.setNum('HGnocolPreA2', measuredValues[4]);
    newRow.setNum('HGabovecolPreNa', measuredValues[5]);
    newRow.setNum('HGabovecolPreA', measuredValues[6]);
    newRow.setNum('HGbelowcolPreNa1', measuredValues[7]);
    newRow.setNum('HGbelowcolPreA1', measuredValues[8]);
    newRow.setNum('HGbelowcolPreNa2', measuredValues[9]);
    newRow.setNum('HGbelowcolPreA2', measuredValues[10]);
    newRow.setNum('HGabovecolPostNa', measuredValues[11]);
    newRow.setNum('HGabovecolPostA', measuredValues[12]);
    newRow.setNum('HGbelowcolPostNa1', measuredValues[13]);
    newRow.setNum('HGbelowcolPostA1', measuredValues[14]);
    newRow.setNum('HGbelowcolPostNa2', measuredValues[15]);
    newRow.setNum('HGbelowcolPostA2', measuredValues[16]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[0] - 1], measuredValues[17]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[1] - 1], measuredValues[18]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[2] - 1], measuredValues[19]);
    newRow.setNum('MCtest' + ['hNa', 'hA', 'vNa', 'vA'][mcTestOrder()[3] - 1], measuredValues[20]);

    saveTable(resultsTable, 'results_' + participantID + '.csv');
    exportTrackingTable();
    if (saved == false) {
        saved = true;
        goToNextStage();
    }
}