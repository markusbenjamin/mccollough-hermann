var stimX, stimY, stimSize;
var stage, startStage, endStage, adaptStage;
var fontSize;
var fixCrossSize;

var hgN, hgR, hgVC;
var mcN;
var adaptColors, nonadaptColors;
var adapt, mask, adaptFinished;
var adaptStageDuration, adaptDuration, adaptCounter, adaptMaskSwitchTime, adaptStartTime, adaptAwayDuration;
var freeViewing;

var prevButton, nextButton, finishButton;
var arrowDir, arrowUpTime, arrowUpDuration, arrowLength;

var stageToValue, measuredValues, measuredValuesDefault, ranges, stageNames, stageMinNames, stageMaxNames;
var sliders;
var hgPreNullOrder, hgPostNullOrder;
var mcBaselineNameNullOrder, mcBaselineStartValNullOrder;
var mcTestNameNullOrder, mcTestStartValNullOrder;
var mcBaselineOrder, mcTestOrder;
var mcBaselineStartVals, mcTestStartVals;

var adaptStageDurationInput, participantInput;
var devGUI;

var instructionsTable, instructions;

var saved;

//load gaze filter
let WASM_URL;

async function loadGazeFilter() {
    WASM_URL = './gazefilter.wasm';
    await gazefilter.init('gazefilter.wasm');
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
var discrAwayStatusDuration, discrAwayJudgementTime, discrAwayJudgementAccumulator;
var discrChangeTime;
var discrJudgement;
var discrStatus;


function preload() {
    instructionsTable = loadTable('https://docs.google.com/spreadsheets/d/e/2PACX-1vSJ1vXABpBDoFFWhCW0zpzgQwGgAy8eKS_fIMYfcjE9cmykTB6fbM4Vq2JinqOv8kVgL4hiZDkf7ej5/pub?gid=0&single=true&output=csv', 'csv');
}

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

    stageToValue = [null, null, null, null, 0, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null, 11, 12, 13, 14, 15, 16, 17, 18, null, null, null, null, 19, 20, 21, 22, 23, 24, null, null, 25, 26, 27, 28, 29, 30, 31, 32, null];
    ranges = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1], [-1, 1]];
    stageMinNames = ['darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'darker', 'darker', 'darker', 'darker', 'darker', 'darker', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green'];
    stageMaxNames = ['lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'lighter', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'];

    freeViewing = false;
    devGUI = false;
}

function initialize() {
    calculateSizes();

    stage = 0;
    startStage = 0;
    endStage = 45;
    adaptStage = 27;

    prevButton = createButton('Prev stage');
    prevButton.mousePressed(goToPrevStage);
    prevButton.hide();
    nextButton = createButton('Next stage');
    nextButton.mousePressed(goToNextStage);
    if (devGUI) {
        nextButton.show();
    }
    else {
        nextButton.hide();
    }
    finishButton = createButton('Finish');
    finishButton.mousePressed(saveResults);
    finishButton.hide();

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
    discrAwayJudgementAccumulator = -1;

    hgPreNullOrder = ['NA', 'A'];
    hgPostNullOrder = ['NA', 'A'];

    var startValOffsets = [
        random(0.125, 0.375), //baseline horizontal red/-green leftup
        random(0.125, 0.375), //baseline horizontal red/-green bottomright
        random(0.125, 0.375), //baseline vertical red/-green leftup
        random(0.125, 0.375), //baseline vertical red/-green bottomright
    ];
    mcBaselineNameNullOrder = ['hrLU', 'hrRD', 'vgLU', 'vgRD', 'hgLU', 'hgRD', 'vrLU', 'vrRD'];
    mcBaselineStartValNullOrder = [
        startValOffsets[0],  //horizontal red leftup
        startValOffsets[1],  //horizontal red bottomright
        -startValOffsets[2], //vertical green leftup
        -startValOffsets[3], //vertical green bottomright
        -startValOffsets[0], //horizontal green leftup
        -startValOffsets[1], //horizontal green bottomright
        startValOffsets[2],  //vertical red leftup
        startValOffsets[3]   //vertical red bottomright
    ];
    mcBaselineOrder = generateMcOrder();

    var hRStartVal = (startValOffsets[0] + startValOffsets[1]) / 2;
    var vRStartVal = (startValOffsets[2] + startValOffsets[3]) / 2;
    mcTestNameNullOrder = ['hgNA', 'hgA', 'vrNA', 'vrA', 'hrNA', 'hrA', 'vgNA', 'vgA'];
    mcTestStartValNullOrder = [
        -hRStartVal, //horizontal green nonadapt
        -hRStartVal, //horizontal green adapt
        vRStartVal,  //vertical red nonadapt
        vRStartVal,  //vertical red adapt
        hRStartVal,  //horizontal red nonadapt
        hRStartVal,  //horizontal red adapt
        -vRStartVal, //vertical green nonadapt
        -vRStartVal, //vertical grenn adapt
    ];
    mcTestOrder = generateMcOrder();

    arrowDir = 0;
    arrowLength = 0;
    arrowUpTime = -1;
    arrowUpDuration = 300;

    noCursor();

    instructions = instructionsTable.getArray();
}

function setParticipantDependentStageSettings() {
    var hgPreStageNames = selectFromArray(hgPreNullOrder, hgPreOrder());
    var hgPostStageNames = selectFromArray(hgPostNullOrder, hgPostOrder());
    var mcBaselineStageNames = selectFromArray(mcBaselineNameNullOrder, mcBaselineOrder);
    var mcTestStageNames = selectFromArray(mcTestNameNullOrder, mcTestOrder);

    stageNames = [
        'start', // 0
        'calib 1', // 1
        'gaze tracking test', // 2
        'HG warmup instructions', // 3
        'HG warmup', // 4
        'HG instructions 1', // 5
        'HG nocol pre ' + hgPreStageNames[0] + ' 1', // 6
        'HG nocol pre ' + hgPreStageNames[1] + ' 2', // 7
        'HG nocol pre ' + hgPreStageNames[0] + '1', // 8
        'HG nocol pre ' + hgPreStageNames[1] + ' 2', // 9
        'HG below pre ' + hgPreStageNames[0] + '1', // 12
        'HG below pre ' + hgPreStageNames[1] + ' 2', // 13
        'HG below pre ' + hgPreStageNames[0] + '1', // 14
        'HG below pre ' + hgPreStageNames[1] + ' 2', // 15
        'HG above pre ' + hgPreStageNames[0], // 10
        'HG above pre ' + hgPreStageNames[1], // 11
        'MC baseline instructions', // 12
        'MC baseline ' + mcBaselineStageNames[0], // 13
        'MC baseline ' + mcBaselineStageNames[1], // 14
        'MC baseline ' + mcBaselineStageNames[2], // 15
        'MC baseline ' + mcBaselineStageNames[3], // 16
        'MC baseline ' + mcBaselineStageNames[4], // 17
        'MC baseline ' + mcBaselineStageNames[5], // 18
        'MC baseline ' + mcBaselineStageNames[6], // 19
        'MC baseline ' + mcBaselineStageNames[7], // 20
        'calib 2', // 21
        'adapt instructions', // 22
        'adapt', // 23
        'HG instructions 2', // 24
        'HG below post ' + hgPostStageNames[0] + ' 1', // 25
        'HG below post ' + hgPostStageNames[1] + ' 2', // 26
        'HG below postt ' + hgPostStageNames[0] + ' 1', // 25
        'HG below post ' + hgPostStageNames[1] + ' 2', // 27
        'HG above post t ' + hgPostStageNames[0], // 28
        'HG above post ' + hgPostStageNames[1], // 29
        'calib 3', // 30
        'MC test instructions', // 31
        'MC test ' + mcTestStageNames[0], // 32
        'MC test ' + mcTestStageNames[1], // 33
        'MC test ' + mcTestStageNames[2], // 34
        'MC test ' + mcTestStageNames[3], // 35
        'MC test ' + mcTestStageNames[4], // 36
        'MC test ' + mcTestStageNames[5], // 37
        'MC test ' + mcTestStageNames[6], // 38
        'MC test ' + mcTestStageNames[7], // 39
        'end'  // 40
    ];

    mcBaselineStartVals = selectFromArray(mcBaselineStartValNullOrder, mcBaselineOrder);
    mcTestStartVals = selectFromArray(mcTestStartValNullOrder, mcTestOrder);

    measuredValues = [
        0.5, // 0 4
        0.5, // 1 6
        0.5, // 2 7
        0.5, // 3 8
        0.5, // 4 9
        0.5, // 5 12
        0.5, // 6 13
        0.5, // 7 14
        0.5, // 8 15
        0.5, // 9 10
        0.5, // 10 11
        mcBaselineStartVals[0], // 11 13
        mcBaselineStartVals[1], // 12 14
        mcBaselineStartVals[2], // 13 15
        mcBaselineStartVals[3], // 14 16
        mcBaselineStartVals[4], // 15 17
        mcBaselineStartVals[5], // 16 18
        mcBaselineStartVals[6], // 17 19
        mcBaselineStartVals[7], // 18 20
        0.5, // 19 25
        0.5, // 20 26
        0.5, // 21 25
        0.5, // 22 27
        0.5, // 23 28
        0.5, // 24 29
        mcTestStartVals[0], // 25 32
        mcTestStartVals[1], // 26 33
        mcTestStartVals[2], // 27 34
        mcTestStartVals[3], // 28 35
        mcTestStartVals[4], // 29 36
        mcTestStartVals[5], // 30 37
        mcTestStartVals[6], // 31 38
        mcTestStartVals[7]  // 32 39
    ];
}

function createSliders() {
    sliders = [];
    for (var i = 0; i < measuredValues.length; i++) {
        sliders.push(createSlider(ranges[i][0], ranges[i][1], measuredValues[i], 1 / 1000));
        sliders[i].hide();
    }
    if (stageToValue[stage] != null) {
        if (devGUI) {
            sliders[stageToValue[stage]].show();
        }
    }
}

function calculateSizes() {
    stimX = width * 0.5;
    stimY = height * 0.5;
    stimSize = max(width, height) * 0.25;

    fontSize = width * 0.015;
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);

    fixCrossSize = hgDims[1] / 2;

    calibDotSize = width * 0.01;
}

function draw() {
    background(0);
    if (1 < stage) {
        readSliderValue();
        drawSlider();
    }
    if (discrOn) {
        runDiscriminator();
    }

    if (stage == 0) { //exp start
        fill(1);
        textSize(fontSize * instructions[0][1]);
        text(instructions[0][2], width * 0.5, height * 0.25, width * 0.75, height * 0.4);

        textSize(fontSize * 2, width * 0.5, height * 0.4);
        text('experiment settings', width * 0.5, height * 0.5);

        textAlign(LEFT);
        textSize(fontSize * 1.5);
        text('adaptation time:', width * 0.3, height * 0.6);
        adaptStageDurationInput.position(width * 0.575 - width * 0.1, height * 0.56);
        styleElement(adaptStageDurationInput, width * 0.2, height * 0.05, fontSize * 1.5);

        text('participant ID:', width * 0.3, height * 0.75);
        participantInput.position(width * 0.575 - width * 0.1, height * 0.71);
        styleElement(participantInput, width * 0.2, height * 0.05, fontSize * 1.5);
        textAlign(CENTER);

        stroke(1);
        line(mouseX - fixCrossSize * 0.5, mouseY, mouseX + fixCrossSize * 0.5, mouseY);
        line(mouseX, mouseY - fixCrossSize * 0.5, mouseX, mouseY + fixCrossSize * 0.5);
        noStroke();
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
        textSize(fontSize * instructions[1][1]);
        text(instructions[1][2], width * 0.5, height * 0.5, width * 0.75, height * 0.45);
    }
    if (stage == 4) { //HG warmup
        drawMcCollough(color(1), stimSize * 1, 6, stimX, stimY, 1);
        drawFixCross(stimX, stimY);
        fill(0.85);
        rect(stimX - stimSize * 1 * 0.5 * 1.7, stimY, stimSize * 1 * 0.5 * 0.65, stimSize * 1 * 0.5 * 0.65);
        fill(measuredValues[stageToValue[stage]]);
        rect(stimX + stimSize * 1 * 0.5 * 1.7, stimY, stimSize * 1 * 0.5 * 0.65, stimSize * 1 * 0.5 * 0.65);
        noFill();
    }
    if (stage == 5) { //HG instructions 1
        fill(1);
        textSize(fontSize * instructions[2][1]);
        text(instructions[2][2], width * 0.5, height * 0.25, width * 0.75, height * 0.45);
        noStroke();

        drawHermannGrid(hgN, hgR, stimSize * 0.7, color(1), color(1), width * 0.375, height * 0.625, true);
        drawIllusionStrengthMeter(0.75, [[-1, 1], [1, -1]][0], width * 0.375, height * 0.625, stimSize * 0.7);
        drawIllusionStrengthMeterOppositeCircle([[-1, 1], [1, -1]][1], width * 0.375, height * 0.625, stimSize * 0.7);
        textSize(fontSize);
        text('or', width * 0.5, height * 0.625)
        drawHermannGrid(hgN, hgR, stimSize * 0.7, color(1), color(1), width * 0.625, height * 0.625, true);
        drawIllusionStrengthMeter(0.75, [[-1, 1], [1, -1]][1], width * 0.625, height * 0.625, stimSize * 0.7);
        drawIllusionStrengthMeterOppositeCircle([[-1, 1], [1, -1]][0], width * 0.625, height * 0.625, stimSize * 0.7);
    }
    if (stage == 6) { //HG nocol a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 7) { //HG nocol a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 8) { //HG nocol a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 9) { //HG nocol a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, color(1), color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 10) { //HG below a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 11) { //HG below a/na pre 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 12) { //HG below a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 13) { //HG below a/na pre 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 14) { //HG above a/na pre
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 15) { //HG above a/na pre
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 16) { //MC baseline instructions
        fill(1);
        textSize(fontSize * instructions[3][1]);
        text(instructions[3][2], width * 0.5, height * 0.5, width * 0.75, height * 0.45);
    }
    if (stage == 17) { //MC baseline 1
        drawMcBaseline(mcBaselineOrder[0]);
    }
    if (stage == 18) { //MC baseline 2
        drawMcBaseline(mcBaselineOrder[1]);
    }
    if (stage == 19) { //MC baseline 3
        drawMcBaseline(mcBaselineOrder[2]);
    }
    if (stage == 20) { //MC baseline 4
        drawMcBaseline(mcBaselineOrder[3]);
    }
    if (stage == 21) { //MC baseline 5
        drawMcBaseline(mcBaselineOrder[4]);
    }
    if (stage == 22) { //MC baseline 6
        drawMcBaseline(mcBaselineOrder[5]);
    }
    if (stage == 23) { //MC baseline 7
        drawMcBaseline(mcBaselineOrder[6]);
    }
    if (stage == 24) { //MC baseline 8
        drawMcBaseline(mcBaselineOrder[7]);
    }
    if (stage == 25) { //calib 2
        runCalibration();
    }
    if (stage == 26) { //adapt instructions
        fill(1);
        textSize(fontSize * instructions[4][1]);
        text(instructions[4][2], width * 0.5, height * 0.5, width * 0.5, height * 0.5);
    }
    if (stage == adaptStage) { //adapt
        if (adaptFinished) {
            fill(1);
            textSize(fontSize * 2);
            text('adaptation phase finished', stimX, stimY);
            noFill();
        }
        else {
            if (discrJudgement != 0 && discrAwayJudgementAccumulator != -1) {
                adaptAwayDuration += millis() - discrAwayJudgementAccumulator;
                discrAwayJudgementAccumulator = millis();
            }
            if (adapt) {
                if (millis() - adaptMaskSwitchTime < adaptDuration) {
                    var flicker = (adaptCounter / 2) % 2;
                    drawMcCollough(adaptColors[flicker], stimSize, mcN, stimX, stimY, flicker);
                    var naDims = getNonadaptDims([-1, 1], stimX, stimY, stimSize);
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
            stroke(1);
            noFill();
            rect(width * 0.33, height * 0.05, width * 0.33, height * 0.02);
            noStroke();
            fill(1);
            rect(width * 0.33, height * 0.05, width * 0.33 - width * 0.33 * constrain((millis() - adaptAwayDuration - adaptStartTime) / (adaptStageDuration * 60 * 1000), 0, 1), height * 0.02);
            rectMode(CENTER);
            noFill();
        }
        /*fill(1);
        textSize(fontSize * 2);
        //text(round(adaptStageDuration * 60 * 1000 - (millis() - adaptAwayDuration - adaptStartTime)), width * 0.5, height * 0.2);
        text(1-(millis() - adaptAwayDuration - adaptStartTime)/(adaptStageDuration * 60 * 1000), width * 0.5, height * 0.2);*/
    }
    if (stage == 28) { //HG instructions 2
        fill(1);
        textSize(fontSize * instructions[5][1]);
        text(instructions[5][2], width * 0.5, height * 0.25, width * 0.75, height * 0.45);
        noStroke();

        drawHermannGrid(hgN, hgR, stimSize * 0.7, color(1), color(1), width * 0.375, height * 0.625, true);
        drawIllusionStrengthMeter(0.75, [[-1, 1], [1, -1]][0], width * 0.375, height * 0.625, stimSize * 0.7);
        drawIllusionStrengthMeterOppositeCircle([[-1, 1], [1, -1]][1], width * 0.375, height * 0.625, stimSize * 0.7);
        textSize(fontSize);
        text('or', width * 0.5, height * 0.625)
        drawHermannGrid(hgN, hgR, stimSize * 0.7, color(1), color(1), width * 0.625, height * 0.625, true);
        drawIllusionStrengthMeter(0.75, [[-1, 1], [1, -1]][1], width * 0.625, height * 0.625, stimSize * 0.7);
        drawIllusionStrengthMeterOppositeCircle([[-1, 1], [1, -1]][0], width * 0.625, height * 0.625, stimSize * 0.7);
    }
    if (stage == 29) { //HG below a/na post 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 30) { //HG below a/na post 1
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 31) { //HG below a/na post 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 32) { //HG below a/na post 2
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, true);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 33) { //HG above a/na post
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[0]], stimX, stimY, stimSize);
    }
    if (stage == 34) { //HG above a/na post
        drawHermannGrid(hgN, hgR, stimSize, hgVC, color(1), stimX, stimY, false);
        drawFixCross(stimX, stimY);
        drawIllusionStrengthMeter(measuredValues[stageToValue[stage]], [[-1, 1], [1, -1]][hgPreOrder()[1]], stimX, stimY, stimSize);
    }
    if (stage == 35) { //calib 3
        runCalibration();
    }
    if (stage == 36) { //MC test instructions
        fill(1);
        textSize(fontSize * instructions[6][1]);
        text(instructions[6][2], width * 0.5, height * 0.5, width * 0.75, height * 0.45);
    }
    if (stage == 37) { //MC test 1
        drawMcTest(mcTestOrder[0]);
    }
    if (stage == 38) { //MC test 2
        drawMcTest(mcTestOrder[1]);
    }
    if (stage == 39) { //MC test 3
        drawMcTest(mcTestOrder[2]);
    }
    if (stage == 40) { //MC test 4
        drawMcTest(mcTestOrder[3]);
    }
    if (stage == 41) { //MC test 5
        drawMcTest(mcTestOrder[4]);
    }
    if (stage == 42) { //MC test 6
        drawMcTest(mcTestOrder[5]);
    }
    if (stage == 43) { //MC test 7
        drawMcTest(mcTestOrder[6]);
    }
    if (stage == 44) { //MC test 8
        drawMcTest(mcTestOrder[7]);
    }
    if (stage == endStage) { //end
        var savedString
        if (saved) {
            savedString = 'saved';
        }
        else {
            savedString = 'not yet saved';
        }
        fill(1);
        textSize(fontSize * 2);
        text('experiment finished\n\nresults ' + savedString, width * 0.5, height * 0.4);
        noFill();
    }

    prevButton.position(width * 0.03, height * 0.88);
    styleElement(prevButton, width * 0.1, height * 0.08, fontSize);
    nextButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(nextButton, width * 0.1, height * 0.08, fontSize);
    finishButton.position(width * 0.97 - width * 0.1, height * 0.88);
    styleElement(finishButton, width * 0.1, height * 0.08, fontSize);

    if (devGUI == false && saved == false && stage != adaptStage && calibration == false) {
        fill(1);
        textSize(fontSize * 1.5);
        text('press SPACE to continue', width * 0.5, height * 0.9);
        noFill();
    }

    saveTracking();


    /*if (freeViewing) {
        console.log('free viewing')
    }
    else {
        console.log('fix cross');
    }*/
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
    if (0 < stage) {
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
        makeJudgement(-1, discrJudgement);
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
            makeJudgement(1, discrJudgement);
        }
        else {
            makeJudgement(0, discrJudgement);
        }
    }
}

function makeJudgement(now, pre) {
    discrJudgement = now;
    if (now == 0) {
        if (pre == 1) {
            discrAwayJudgementTime = -1;
            discrAwayJudgementAccumulator = -1;
        }
        if (pre == -1) {
            discrAwayJudgementTime = -1;
            discrAwayJudgementAccumulator = -1;
        }
    }
    if (now == 1) {
        if (pre == 0) {
            discrAwayJudgementTime = millis();
            discrAwayJudgementAccumulator = millis();
        }
    }
    if (now == -1) {

        if (pre == 0) {
            discrAwayJudgementTime = millis();
            discrAwayJudgementAccumulator = millis();
        }
    }
}

function getSmoothPog(n) {
    var twoEyesSmooth = mean(pogs.slice(-n));
    return [(twoEyesSmooth[0] + twoEyesSmooth[2]) / 2, (twoEyesSmooth[1] + twoEyesSmooth[3]) / 2]
}

function startCalibration(w, h) {
    window.addEventListener('click', onmouseclick);
    calibration = true;
    calibDots = [];
    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            calibDots.push([stimX + i * w / 3, stimY + j * h / 3, 5])
        }
    }
    cursor();
}

function runCalibration() {
    for (var i = 0; i < calibDots.length; i++) {
        if (0 < calibDots[i][2]) {
            if (i == 4 && 5 < total(calibDots)[2]) {
                fill(1);
                textSize(fontSize * 1.5);
                text('click each yellow dot five times', calibDots[i][0], calibDots[i][1]);
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
    window.removeEventListener('click', onmouseclick);
    calibration = false;
    noCursor();
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

    if (fixStatus === 'fixation') {
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
        'FACE: ' + faceStatus +
        '\nCALIBRATION: ' + calibEyeString + ', error: ' + calibError + ' px' +
        '\nTRACKING: ' + trackingStatus +
        '\nFIXATION: ' + fixStatus + ', duration: ' + fixDur / 1000 + ' s'
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
    element.style('width', w + 'px');
    element.style('height', h + 'px');
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
            participantID = participantInput.value();
            setParticipantDependentStageSettings();
            createSliders();

            if (devGUI) {
                prevButton.show();
            }
            adaptStageDurationInput.hide();
            participantInput.hide();
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 2) { //gaze tracking test
            discrOn = true;
            endCalibration();
            startDiscriminator();
        }
        if (stage == 25) { //calib 2
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 26) { //adapt instructions
            endCalibration();
        }
        if (stage == adaptStage) { //adapt
            if (0 < change) {
                startAdaptStage();
            }
        }
        if (stage == adaptStage + 1) { // HG instructions
            endAdaptStage();
            if (change < 0) {
                if (devGUI) {
                    nextButton.show();
                }
            }
        }
        if (stage == 35) { // calib 3
            startCalibration(width * calibSize, height * calibSize);
        }
        if (stage == 36) { // MC test instructions
            endCalibration();
        }
        if (stage == endStage - 1) { //MC test 4
            nextButton.hide();
            if (devGUI) {
                finishButton.show();
            }
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

    arrowDir = 0;
    arrowLength = 0;
    arrowUpTime = -1;
}

function handleSliderVisibility() {
    for (var i = 0; i <= measuredValues.length; i++) {
        if (i == stageToValue[stage] && sliders[i] != undefined) {
            if (devGUI) {
                sliders[i].show();
            }
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
        arrowDir = change / abs(change);
        arrowLength = 0.025 + abs(change) * 0.5;
        arrowUpTime = millis();
    }
}

function drawSlider() {
    if (stageToValue[stage] != null) {
        if (devGUI) {
            sliders[stageToValue[stage]].show();
            sliders[stageToValue[stage]].position(width * 0.5 - width * 0.4 * 0.5, height * 0.1);
            sliders[stageToValue[stage]].style('width', width * 0.4 + 'px');
            fill(1);
            textSize(fontSize);
            text('< A ', width * 0.35, height * 0.045);
            text(' D >', width * 0.65, height * 0.045);
            text('<< J', width * 0.35, height * 0.085);
            text('L >>', width * 0.65, height * 0.085);
            noFill();
        }
        else {
            if (arrowDir != 0 && arrowUpTime != -1 && millis() - arrowUpTime < arrowUpDuration) {
                strokeCap(ROUND);
                stroke(1, pow(1 - (millis() - arrowUpTime) / arrowUpDuration, 1 / 15));
                strokeWeight(6);
                var spikeLength = width * 0.0085;
                line(
                    width * (0.5 - arrowLength * 0.5), height * (0.045 + 0.085) * 0.5,
                    width * (0.5 + arrowLength * 0.5), height * (0.045 + 0.085) * 0.5
                );
                if (arrowDir == -1) {
                    line(
                        width * (0.5 - arrowLength * 0.5), height * (0.045 + 0.085) * 0.5,
                        width * (0.5 - arrowLength * 0.5) + spikeLength * cos(TAU * 0.125), height * (0.045 + 0.085) * 0.5 + width * 0.0125 * sin(TAU * 0.125)
                    );
                    line(
                        width * (0.5 - arrowLength * 0.5), height * (0.045 + 0.085) * 0.5,
                        width * (0.5 - arrowLength * 0.5) + spikeLength * cos(-TAU * 0.125), height * (0.045 + 0.085) * 0.5 + width * 0.0125 * sin(-TAU * 0.125)
                    );
                }
                if (arrowDir == 1) {
                    line(
                        width * (0.5 + arrowLength * 0.5), height * (0.045 + 0.085) * 0.5,
                        width * (0.5 + arrowLength * 0.5) + spikeLength * cos(-TAU * 0.625), height * (0.045 + 0.085) * 0.5 + width * 0.0125 * sin(-TAU * 0.625)
                    );
                    line(
                        width * (0.5 + arrowLength * 0.5), height * (0.045 + 0.085) * 0.5,
                        width * (0.5 + arrowLength * 0.5) + spikeLength * cos(TAU * 0.625), height * (0.045 + 0.085) * 0.5 + width * 0.0125 * sin(TAU * 0.625)
                    );
                }
                strokeCap(SQUARE);
            }
            noStroke();
            strokeWeight(1);
            fill(1);
            textSize(fontSize);
            text(stageMinNames[stageToValue[stage]], width * 0.35, height * (0.045 + 0.085) * 0.5);
            text(stageMaxNames[stageToValue[stage]], width * 0.65, height * (0.045 + 0.085) * 0.5);
            text('< A ', width * 0.4, height * 0.045);
            text(' D >', width * 0.6, height * 0.045);
            text('<< J', width * 0.4, height * 0.085);
            text('L >>', width * 0.6, height * 0.085);
            noFill();
        }

    }
}

function drawFixCross(x, y) {
    if (freeViewing == false) {
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

        line(x - fixCrossSizeActual, y, x + fixCrossSizeActual, y);
        line(x, y - fixCrossSizeActual, x, y + fixCrossSizeActual);
        noStroke();
        strokeWeight(1);
    }
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
    if ((keyCode === 32 || keyCode === 32) && stage != adaptStage) {
        goToNextStage();
    }
    if (key === 't' || key === 'T' && stage === adaptStage) {
        goToNextStage();
    }
    if (keyCode === 8 || keyCode === 8) {
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

function drawIllusionStrengthMeterOppositeCircle(placing, sX, sY, sS) {
    var naDims = getNonadaptDims(placing, sX, sY, sS);
    var x = naDims[0];
    var y = naDims[1];
    stroke(1, 1, 1);
    strokeWeight(3);
    ellipse(x, y, naDims[2] * 0.5, naDims[3] * 0.5);
    noStroke();
    strokeWeight(1);
}

function drawIllusionStrengthMeter(illusionStrength, placing, sX, sY, sS) {
    var naDims = getNonadaptDims(placing, sX, sY, sS);
    var x = naDims[0];
    var y = naDims[1];
    fill(1);
    stroke(1);
    rect(x, y, naDims[2], naDims[3]);
    noFill();

    var hgDims = hermannGridDimensions(hgN, hgR, sS);
    var illusionSpotSize = round(hgDims[1] * 1.75);
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

function getNonadaptDims(placing, sX, sY, sS) {
    var hgDims = hermannGridDimensions(hgN, hgR, sS);
    var translate = 1.5 * (hgDims[0] + hgDims[1]);
    var x = sX + placing[0] * translate;
    var y = sY + placing[1] * translate;
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

function drawMcBaseline(which) {
    if (which == 0) {//h, r, lu
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcBaselineMask([-1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 1) {//h, r, rd
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcBaselineMask([1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 2) {//v, g, lu
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcBaselineMask([-1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 3) {//v, g, rd
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcBaselineMask([1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 4) {//h, g, lu
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcBaselineMask([-1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 5) {//h, g, rd
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcBaselineMask([1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 6) {//v, r, lu
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcBaselineMask([-1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 7) {//v, r, rd
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcBaselineMask([1, 1]);
        drawFixCross(stimX, stimY);
    }
}

function drawMcTest(which) {
    if (which == 0) {//h, g, na
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcTestMask([-1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 1) {//h, g, a
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcTestMask([1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 2) {//v, r, na
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcTestMask([-1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 3) {//v, r, a
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcTestMask([1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 4) {//h, r', na
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcTestMask([-1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 5) {//h, r', a
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, false);
        drawMcTestMask([1, -1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 6) {//v, g', na
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcTestMask([-1, 1]);
        drawFixCross(stimX, stimY);
    }
    if (which == 7) {//v, g', a
        drawWhiteComparisonRects();
        drawMcCollough(calculateRedGreenVal(measuredValues[stageToValue[stage]]), stimSize, mcN, stimX, stimY, true);
        drawMcTestMask([1, -1]);
        drawFixCross(stimX, stimY);
    }
}

function drawMcBaselineMask(placing) {
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    var naDims = getNonadaptDims(placing, stimX, stimY, stimSize);

    fill(0);
    stroke(0);
    rect(stimX, stimY - placing[0] * stimSize * 0.25, stimSize, stimSize * 0.5);
    rect(stimX - placing[1] * stimSize * 0.25, stimY + placing[1] * stimSize * 0.25, stimSize * 0.5, stimSize * 0.5);
    var translate = (naDims[3] + hgDims[0] + hgDims[1]) * 0.5;
    rect(naDims[0] - translate, naDims[1], hgDims[0] + hgDims[1], 4.5 * (hgDims[0] + hgDims[1]));
    rect(naDims[0], naDims[1] - translate, 4.5 * (hgDims[0] + hgDims[1]), hgDims[0] + hgDims[1]);
    rect(naDims[0] + translate, naDims[1], hgDims[0] + hgDims[1], 4.5 * (hgDims[0] + hgDims[1]));
    rect(naDims[0], naDims[1] + translate, 4.5 * (hgDims[0] + hgDims[1]), hgDims[0] + hgDims[1]);
    noFill();
    noStroke();
}

function drawMcTestMask(placing) {
    var hgDims = hermannGridDimensions(hgN, hgR, stimSize);
    var naDims = getNonadaptDims(placing, stimX, stimY, stimSize);

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

function hgPreOrder() {
    return [
        [0, 1],
        [1, 0]
    ][(participantID - 1) % 2]
}

function hgPostOrder() {
    return [
        [0, 1],
        [1, 0]
    ][(participantID - 1) % 2]
}

function selectFromArray(array, order) {
    var result = [];
    for (var i = 0; i < order.length; i++) {
        result.push(array[order[i]]);
    }
    return result;
}

function generateMcOrder() {
    var set = [];
    for (var i = 0; i < 7; i++) {
        set.push(round(random(1)));
    }
    var base = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]];
    var counter = 0;

    if (set[counter] == 1) {
        base.reverse();

    }
    counter++;
    for (var i = 0; i < 2; i++) {
        if (set[counter] == 1) {
            base[i].reverse();
        }
        counter++;
    }
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            if (set[counter] == 1) {
                base[i][j].reverse();
            }
            counter++;
        }
    }

    return flattenDeep(base);
}

function flattenDeep(arr1) {
    return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}

function saveResults() { //DEV
    var resultsTable = new p5.Table();

    //exp. setup
    resultsTable.addColumn('participantID');
    resultsTable.addColumn('expDuration');
    resultsTable.addColumn('adaptStageDuration');
    resultsTable.addColumn('hrPreTestOrder');
    resultsTable.addColumn('hgPostOrder');
    resultsTable.addColumn('mcBaselineOrder');
    resultsTable.addColumn('mcBaselineStartVals');
    resultsTable.addColumn('mcTestOrder');
    resultsTable.addColumn('mcTestStartVals');


    //hg pre results
    resultsTable.addColumn('HGnocolPre_' + hgPreNullOrder[0] + '_1');
    resultsTable.addColumn('HGnocolPre_' + hgPreNullOrder[1] + '_1');
    resultsTable.addColumn('HGnocolPre_' + hgPreNullOrder[0] + '_2');
    resultsTable.addColumn('HGnocolPre_' + hgPreNullOrder[1] + '_2');
    resultsTable.addColumn('HGbelowcolPre_' + hgPreNullOrder[0] + '_1');
    resultsTable.addColumn('HGbelowcolPre_' + hgPreNullOrder[1] + '_1');
    resultsTable.addColumn('HGbelowcolPre_' + hgPreNullOrder[0] + '_2');
    resultsTable.addColumn('HGbelowcolPre_' + hgPreNullOrder[1] + '_2');
    resultsTable.addColumn('HGabovecolPre_' + hgPreNullOrder[0]);
    resultsTable.addColumn('HGabovecolPre_' + hgPreNullOrder[1]);

    //mc baseline results
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[0]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[1]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[2]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[3]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[4]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[5]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[6]);
    resultsTable.addColumn('MCbaseline_' + mcBaselineNameNullOrder[7]);

    //hg post results
    resultsTable.addColumn('HGbelowcolPost_' + hgPostNullOrder[0] + '_1');
    resultsTable.addColumn('HGbelowcolPost_' + hgPostNullOrder[1] + '_1');
    resultsTable.addColumn('HGbelowcolPost_' + hgPostNullOrder[0] + '_2');
    resultsTable.addColumn('HGbelowcolPost_' + hgPostNullOrder[1] + '_2');
    resultsTable.addColumn('HGabovecolPost_' + hgPostNullOrder[0]);
    resultsTable.addColumn('HGabovecolPost_' + hgPostNullOrder[1]);

    //mc test results
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[0]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[1]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[2]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[3]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[4]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[5]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[6]);
    resultsTable.addColumn('MCtest_' + mcTestNameNullOrder[7]);

    var hgPreStageNames = selectFromArray(hgPreNullOrder, hgPreOrder());
    var hgPostStageNames = selectFromArray(hgPostNullOrder, hgPostOrder());
    var mcBaselineStageNames = selectFromArray(mcBaselineNameNullOrder, mcBaselineOrder);
    var mcTestStageNames = selectFromArray(mcTestNameNullOrder, mcTestOrder);

    let newRow = resultsTable.addRow();
    //exp. setup
    newRow.setNum('participantID', participantID);
    newRow.setNum('expDuration', millis() / 1000 / 60);
    newRow.setNum('adaptStageDuration', adaptStageDuration);
    newRow.setString('hrPreTestOrder', hgPreStageNames.join('_'));
    newRow.setString('hgPostOrder', hgPostStageNames.join('_'));
    newRow.setString('mcBaselineOrder', mcBaselineStageNames.join('_'));
    newRow.setString('mcBaselineStartVals', mcBaselineStartVals.join('_'));
    newRow.setString('mcTestOrder', mcTestStageNames.join('_'));
    newRow.setString('mcTestStartVals', mcTestStartVals.join('_'));

    //hg pre results
    newRow.setNum('HGnocolPre_' + hgPreStageNames[0] + '_1', measuredValues[1]);
    newRow.setNum('HGnocolPre_' + hgPreStageNames[1] + '_1', measuredValues[2]);
    newRow.setNum('HGnocolPre_' + hgPreStageNames[0] + '_2', measuredValues[3]);
    newRow.setNum('HGnocolPre_' + hgPreStageNames[1] + '_2', measuredValues[4]);
    newRow.setNum('HGbelowcolPre_' + hgPreStageNames[0] + '_1', measuredValues[5]);
    newRow.setNum('HGbelowcolPre_' + hgPreStageNames[1] + '_1', measuredValues[6]);
    newRow.setNum('HGbelowcolPre_' + hgPreStageNames[0] + '_2', measuredValues[7]);
    newRow.setNum('HGbelowcolPre_' + hgPreStageNames[1] + '_2', measuredValues[8]);
    newRow.setNum('HGabovecolPre_' + hgPreStageNames[0], measuredValues[9]);
    newRow.setNum('HGabovecolPre_' + hgPreStageNames[1], measuredValues[10]);

    //mc baseline results
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[0], measuredValues[11]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[1], measuredValues[12]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[2], measuredValues[13]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[3], measuredValues[14]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[4], measuredValues[15]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[5], measuredValues[16]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[6], measuredValues[17]);
    newRow.setNum('MCbaseline_' + mcBaselineStageNames[7], measuredValues[18]);

    //hg post results
    newRow.setNum('HGbelowcolPost_' + hgPostStageNames[0] + '_1', measuredValues[19]);
    newRow.setNum('HGbelowcolPost_' + hgPostStageNames[1] + '_1', measuredValues[20]);
    newRow.setNum('HGbelowcolPost_' + hgPostStageNames[0] + '_2', measuredValues[21]);
    newRow.setNum('HGbelowcolPost_' + hgPostStageNames[1] + '_2', measuredValues[22]);
    newRow.setNum('HGabovecolPost_' + hgPostStageNames[0], measuredValues[23]);
    newRow.setNum('HGabovecolPost_' + hgPostStageNames[1], measuredValues[24]);

    //mc test results
    newRow.setNum('MCtest_' + mcTestStageNames[0], measuredValues[25]);
    newRow.setNum('MCtest_' + mcTestStageNames[1], measuredValues[26]);
    newRow.setNum('MCtest_' + mcTestStageNames[2], measuredValues[27]);
    newRow.setNum('MCtest_' + mcTestStageNames[3], measuredValues[28]);
    newRow.setNum('MCtest_' + mcTestStageNames[4], measuredValues[29]);
    newRow.setNum('MCtest_' + mcTestStageNames[5], measuredValues[30]);
    newRow.setNum('MCtest_' + mcTestStageNames[6], measuredValues[31]);
    newRow.setNum('MCtest_' + mcTestStageNames[7], measuredValues[32]);

    saveTable(resultsTable, 'results_' + participantID + '.csv');
    exportTrackingTable();
    if (saved == false) {
        saved = true;
        goToNextStage();
    }
}