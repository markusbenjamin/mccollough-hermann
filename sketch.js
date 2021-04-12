var switchTime;
var maskTime;
var adaptTime;
var adaptCounter;
var expStartTime;
var subject;
var stimSize;
var stimX;
var stimY;
var mcLineNum;
var mcWidthFactor;
var hgWidthFactor;
var hgBlockNum;
var adaptColors;
var nullingColors;
var rgState;
var modifyColor;
var adapt;
var mask;
var timestamp;
var vhRadio;
var testStimRadio;
var partialRadio;
var clipboardButton;
var subjectInput;
var switchTimeInput;
var adaptTimeInput;
var startButton;
var colorChannel;
var vhChannel;
var partialCheckbox;
var partialColoring;
var partialSelect;
var illusionStrengthColor;
var illusionStrength;
var illusionStrengthRadio;
var illusionStrengthSlider;
var illusionStrengthRegion;

var state;
var prevState;

var mcWidthSlider;
var hgWidthSlider;
var nullingSlider;

function setup() {
    createCanvas(min(windowWidth, 1200), min(windowWidth, 1200) * 6 / 8);
    colorMode(HSB, 1);
    rectMode(CENTER);
    noStroke();
    noFill();
    textAlign(LEFT);

    mcWidthFactor = 1;
    switchTime = 2000;
    maskTime = 500;
    adaptTime = 20;
    subject = "Test";
    stimX = width * 0.5;
    stimY = height * 0.57;
    stimSize = min(width, height) * 0.7;
    mcLineNum = 21;
    hgWidthFactor = 0.251;
    hgBlockNum = 7;
    adaptColors = [color(1, 1, 1), color(1 / 3, 1, 1)];
    resetNullingColors();
    modifyColor = false;
    adapt = true;
    mask = false;
    adaptCounter = 0;
    illusionStrengthColor = color(1, 0.09, 1);
    illusionStrength = [0.5, 0.5];

    state = 0;
    prevState = state;

    mcWidthSlider = createSlider(0, 200, 100);
    hgWidthSlider = createSlider(0, 150, 25);

    subjectInput = createInput(subject);
    switchTimeInput = createInput(switchTime);
    adaptTimeInput = createInput(adaptTime);
    startButton = createButton('Start!');
    startButton.mousePressed(startExperiment);

    partialCheckbox = createCheckbox('Partial coloring?', false);
    partialCheckbox.changed(partialCheckboxEvent);
    partialColoring = false;

    setUIVisibility();
}

function createTestStimUI() {
    vhRadio = createRadio('vhRadio');
    vhRadio.option('vertical');
    vhRadio.option('horizontal');
    vhRadio.selected('vertical');
    vhChannel = 0;

    clipboardButton = createButton('Copy to clipboard');
    clipboardButton.mousePressed(dataToClipboard);

    partialRadio = createRadio('partialRadio');
    partialRadio.option('col');
    partialRadio.option('no col');
    partialRadio.selected('col');
    partialSelect = 0;

    testStimRadio = createRadio('testStimRadio');
    testStimRadio.option('McCollough');
    if (partialColoring) {
        testStimRadio.option('Illusion strength');
    }
    else {
        testStimRadio.option('Hermann Grid');
    }
    testStimRadio.selected('McCollough');

    illusionStrengthRadio = createRadio('illusionStrengthRadio');
    illusionStrengthRadio.option('col');
    illusionStrengthRadio.option('no col');
    illusionStrengthRadio.selected('col');
    illusionStrengthRegion = 0;

    illusionStrengthSlider = createSlider(0, 1000, 500);

    nullingSlider = createSlider(-1000, 1000, 0);
}

function windowResized() {
    resizeCanvas(min(windowWidth, 1200), min(windowWidth, 1200) * 6 / 8);
    stimX = width * 0.5;
    stimY = height * 0.57;
    stimSize = min(width, height) * 0.7;
}

function draw() {
    background(0);
    if (state != 0) {
        if (partialSelect !== partialRadioMapper(partialRadio.value()) || vhChannel !== vhRadioMapper(vhRadio.value()) || (1 < state && state !== prevState)) {
            var stateMappedToNullingColorsArray = state - 2;
            if (state == 4) {
                stateMappedToNullingColorsArray = 1;
            }
            if (nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][0] === 1) {
                rgState = nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][1];
            }
            else if (nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][0] === 1 / 3) {
                rgState = -nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][1];
            }

            updateNullingSlider();
            vhChannel = vhRadioMapper(vhRadio.value());
            partialSelect = partialRadioMapper(partialRadio.value());
            prevState = state;
        }
        if (state == 4) {
            if (illusionStrengthRegion != illusionStrengthRadioMapper(illusionStrengthRadio.value())) {
                updateIllusionStrengthSlider();
                illusionStrengthRegion = illusionStrengthRadioMapper(illusionStrengthRadio.value());
            }
        }
    }
    if (state == 0) {
        drawSettingsUI();
        handleWidthSliders();
    }
    else if (state == 1) {
        if (adapt) {
            if (millis() - timestamp < switchTime) {
                var flicker = (adaptCounter / 2) % 2;
                drawMcColloughStimulus(adaptColors[flicker], color(1), stimSize, mcLineNum, stimX, stimY, flicker, mcWidthFactor, partialColoring,1);
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
    else if (state == 2) {
        for (var i = -1; i < 2; i += 2) {
            for (var j = -1; j < 2; j += 2) {
                drawMcColloughStimulus(arrayToHSBColor(nullingColors[0][abs(i - j) / 2][0]), arrayToHSBColor(nullingColors[0][abs(i - j) / 2][1]), stimSize * 0.5, mcLineNum, width * 0.5 + i * 1.025 * stimSize / 4, stimY + j * 1.025 * stimSize / 4, abs(i + j) / 2, mcWidthFactor, partialColoring,0.5);
            }
        }
        drawTestStimUI();
        handleNullingSlider();

    }
    else if (state == 3) {
        drawHermannGrid(hgBlockNum, hgWidthFactor, stimSize, arrayToHSBColor(nullingColors[1][0]), arrayToHSBColor(nullingColors[1][1]), stimX, stimY);
        drawTestStimUI();
        handleNullingSlider();
    }
    else if (state == 4) {
        drawHermannGrid(hgBlockNum, hgWidthFactor, stimSize, illusionStrengthColor, color(1), stimX, stimY);
        drawIllusionStrengthUI();
        handleIllusionStrengthSlider();
    }
    if (controlFlow() === false) {
        updateNullingSlider();
    }
    setUIVisibility();
}

function updateNullingSlider() {
    var val = 1000 * rgState;
    nullingSlider.value(val);
}

function handleNullingSlider() {
    rgState = nullingSlider.value() / 1000;
    mapRGStateToColors();
}

function drawIllusionStrengthUI() {
    if (modifyColor) {
        textSize(round(width * 0.14 / 7));
        fill(1);
        text("press C to hide\t|\tpress S to reset", width * 0.015, height * 0.04);
        text("select region and use D and F or slider to set illusion strength:", width * 0.015, height * 0.085);
        illusionStrengthRadio.position(width * 0.19 - round(width * 1.1 / 7), height * 0.11);
        illusionStrengthRadio.style('width', round(width * 2.5 / 7) + 'px');
        illusionStrengthRadio.style('font-family', 'Arial');
        illusionStrengthRadio.style('color', '#ffffff');
        illusionStrengthRadio.style('font-size', round(width * 0.14 / 7) + 'px');

        stroke(color(1, 1, 1));
        strokeWeight(5);
        line(stimX - width * 0.01, stimY, stimX + width * 0.01, stimY);
        line(stimX, stimY - width * 0.01, stimX, stimY + width * 0.01);
        strokeWeight(1);
        var hgDims = hermannGridDimensions(hgBlockNum, hgWidthFactor, stimSize);
        noFill();
        
        illusionStrengthSlider.position(stimX - width * 0.15 - round(width * 1.1 / 7), height * 0.115);
        illusionStrengthSlider.style('width', round(width * 2.5 / 7) + 'px');

        fill(1);
        textAlign(CENTER);
        text("min brightness in col region: " + illusionStrength[0], width * 0.77, height * 0.085);
        text("min brightness in no col region: " + illusionStrength[1], width * 0.77, height * (0.085 + 1 * 0.04));
        textAlign(LEFT);
        noFill();
        noStroke();
        var translate = 1.5*(hgDims[0] + hgDims[1]);
        if (illusionStrengthRadioMapper(illusionStrengthRadio.value()) != 0) {
            drawIllusionStrengthMeter(stimX + translate, stimY - translate);
        }
        else {
            drawIllusionStrengthMeter(stimX - translate, stimY + translate);
        }
    }
    else {
        textSize(round(width * 0.14 / 7));
        fill(1);
        text("press C to to set illusion strength", width * 0.015, height * 0.04);
    }
    drawCopyButton();
}

function drawIllusionStrengthMeter(posX, posY) {
    var hgDims = hermannGridDimensions(hgBlockNum, hgWidthFactor, stimSize);
    var illusionSpotSize = round(hermannGridDimensions(hgBlockNum, hgWidthFactor, stimSize)[1]);
    fill(1);
    rect(posX, posY, 3*hgDims[0]+2*hgDims[1], 3*hgDims[0]+2*hgDims[1]);
    noFill();
    loadPixels();
    for (var i = -illusionSpotSize / 2; i < illusionSpotSize / 2; i++) {
        for (var j = -illusionSpotSize / 2; j < illusionSpotSize / 2; j++) {
            var d = dist(0, 0, i, j) / dist(0, 0, illusionSpotSize / 2, illusionSpotSize / 2);
            var col = color(1 - illusionMain(d, 0.125, 20, 1, illusionStrength[illusionStrengthRadioMapper(illusionStrengthRadio.value())]));
            set(posX + i, posY + j, col);
        }
    }
    updatePixels();
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

function drawCopyButton() {
    clipboardButton.position(width * 0.77 - round(width * 0.55 / 8), height * (0.085 + 2 * 0.04) - round(width * 0.13 / 8));
}

function drawTestStimUI() {
    if (modifyColor && 1 < state && state < 4) {
        vhRadio.position(width * 0.19 - round(width * 1.1 / 7), height * 0.11);
        vhRadio.style('width', round(width * 2.5 / 7) + 'px');
        vhRadio.style('font-family', 'Arial');
        vhRadio.style('color', '#ffffff');
        vhRadio.style('font-size', round(width * 0.14 / 7) + 'px');

        partialRadio.position(width * 0.4 - round(width * 1.1 / 7), height * 0.11);
        partialRadio.style('width', round(width * 2.5 / 7) + 'px');
        partialRadio.style('font-family', 'Arial');
        partialRadio.style('color', '#ffffff');
        partialRadio.style('font-size', round(width * 0.14 / 7) + 'px');

        nullingSlider.position(width * 0.25 - round(width * 1.1 / 7), height * 0.16);
        nullingSlider.style('width', round(width * 2.5 / 7) + 'px');

        textSize(round(width * 0.14 / 7));
        fill(1);
        text("press C to hide\t|\tpress S to reset", width * 0.015, height * 0.04);
        text("select option and use G and R or slider to set nulling color:", width * 0.015, height * 0.085);
        text("GREEN", width * 0.0195, height * 0.185);
        text("RED", width * 0.455, height * 0.185);

        textAlign(CENTER);
        if (partialColoring) {
            text("vertical nulling in hex: " + arrayToHSBColor(nullingColors[state - 2][0][0]).toString("#rrggbb") + " (c), " + arrayToHSBColor(nullingColors[state - 2][0][1]).toString("#rrggbb") + "  (nc)", width * 0.77, height * 0.085);
            text("horizontal nulling in hex: " + arrayToHSBColor(nullingColors[state - 2][0][0]).toString("#rrggbb") + " (c), " + arrayToHSBColor(nullingColors[state - 2][0][1]).toString("#rrggbb") + "  (nc)", width * 0.77, height * (0.085 + 1 * 0.04));
        }
        else {
            text("vertical nulling in hex: " + arrayToHSBColor(nullingColors[state - 2][0][0]).toString("#rrggbb"), width * 0.77, height * 0.085);
            text("horizontal nulling in hex: " + arrayToHSBColor(nullingColors[state - 2][0][0]).toString("#rrggbb"), width * 0.77, height * (0.085 + 1 * 0.04));
        }
        textAlign(LEFT);
        noFill();
        drawCopyButton();
    }
    else {
        fill(1);
        textSize(round(width * 0.14 / 7));
        text("press C for nulling setting", width * 0.015, height * 0.04);
    }
    testStimRadio.style('width', round(width * 3 / 7) + 'px');
    fill(1);
    testStimRadio.position(width * 0.19 - round(width * 1.1 / 7), height * 0.955);
    if (partialColoring == false) {
        text("test stimulus: ", width * 0.015, height * 0.935);
    }
    testStimRadio.style('font-family', 'Arial');
    testStimRadio.style('color', '#ffffff');
    testStimRadio.style('font-size', round(width * 0.14 / 7) + 'px');
}

function drawSettingsUI() {
    textAlign(CENTER);
    fill(1);
    textSize(round(width * 0.35 / 7));
    text("Experiment settings", width * 0.5, height * 0.1);

    textSize(round(width * 0.16 / 7));
    text("McCollough street width:", width * 0.15 + round(width * 1 / 7), height * 0.24);
    mcWidthSlider.style('width', round(width * 2 / 7) + 'px');
    mcWidthSlider.position(width * 0.15, height * 0.25);
    drawMcColloughStimulus(color(1), color(1), round(width * 2 / 7), mcLineNum, width * 0.15 + round(width * 1 / 7), height * 0.5, 1, mcWidthFactor, false, 1);

    fill(1);
    textSize(round(width * 0.16 / 7));
    text("Hermann Grid street width:", width * 0.45 + round(width * 1.8 / 7), height * 0.24);
    hgWidthSlider.style('width', round(width * 2 / 7) + 'px');
    hgWidthSlider.position(width * 0.85 - round(width * 2 / 7), height * 0.25);
    drawHermannGrid(hgBlockNum, hgWidthFactor, round(width * 2 / 7), 1, 1, width * 0.85 - round(width * 1 / 7), height * 0.5);

    fill(1);
    textSize(round(width * 0.13 / 7));
    text("Subject:", width * 0.23, height * 0.815);
    text("H/V switch time (ms):", width * 0.5, height * 0.815);
    text("Adaptation length (min):", width * 0.77, height * 0.815);
    subjectInput.style("width", width * 0.2 + "px");
    switchTimeInput.style("width", width * 0.2 + "px");
    adaptTimeInput.style("width", width * 0.2 + "px");
    subjectInput.position(width * 0.23 - width * 0.2 * 0.5, height * 0.83);
    switchTimeInput.position(width * 0.5 - width * 0.2 * 0.5, height * 0.83);
    adaptTimeInput.position(width * 0.77 - width * 0.2 * 0.5, height * 0.83);

    startButton.style("width", width * 0.2 + "px");
    startButton.style("height", height * 0.05 + "px");
    startButton.position(width * 0.5 - width * 0.2 * 0.47, height * 0.91);

    partialCheckbox.position(width * 0.15, height * 0.91);
    partialCheckbox.style('font-family', 'Arial');
    partialCheckbox.style('color', '#ffffff');
    partialCheckbox.style('font-size', round(width * 0.14 / 7) + 'px');

    textAlign(LEFT);
}

function startExperiment() {
    setTextInputParameters();
    createTestStimUI();
    expStartTime = millis();
    timestamp = expStartTime;
    state = 1;
}

function controlFlow() {
    prevState = state;
    if (millis() - expStartTime > adaptTime * 60 * 1000) {
        if (partialColoring) {
            if (testStimRadioMapper(testStimRadio.value()) == 0) {
                state = 2;
            }
            else {
                state = 4;
            }
        }
        else {
            state = testStimRadioMapper(testStimRadio.value()) + 2;
        }
    }
    return state === prevState;
}

function setTextInputParameters() {
    subject = subjectInput.value();
    switchTime = switchTimeInput.value();
    adaptTime = adaptTimeInput.value();
}

function handleWidthSliders() {
    mcWidthFactor = mcWidthSlider.value() / 100;
    hgWidthFactor = hgWidthSlider.value() / 100;
}

function partialCheckboxEvent() {
    if (this.checked) {
        partialColoring = true;
    }
    else {
        partialColoring = false;
    }
}

function testStimRadioMapper(val) {
    if (val == 'McCollough') {
        return 0;
    }
    else if (val == 'Hermann Grid' || val == 'Illusion strength') {
        return 1;
    }
}

function vhRadioMapper(val) {
    if (val == 'vertical') {
        return 0;
    }
    else if (val == 'horizontal') {
        return 1;
    }
}

function partialRadioMapper(val) {
    if (val == 'col') {
        return 0;
    }
    else if (val == 'no col') {
        return 1;
    }
}

function illusionStrengthRadioMapper(val) {
    if (val == 'col') {
        return 0;
    }
    else if (val == 'no col') {
        return 1;
    }
}

function resetNullingColors() {
    if (1 < state) {
        var stateMappedToNullingColorsArray = state - 2;
        if (state == 4) {
            stateMappedToNullingColorsArray = 1;
        }
        nullingColors[stateMappedToNullingColorsArray] = [
            [
                [1 / 3, 0, 1], //3/4
                [1 / 3, 0, 1]  //1/4
            ], //vertical
            [
                [1, 0, 1],  //3/4
                [1, 0, 1]  //1/4
            ] //horizontal
        ];
    }
    else {
        nullingColors =
            [
                [//McC
                    [
                        [1 / 3, 0, 1], //3/4
                        [1 / 3, 0, 1] //1/4
                    ], //vertical
                    [
                        [1, 0, 1], //3/4
                        [1, 0, 1] //1/4
                    ] //horizontal
                ],
                [//Hermann
                    [
                        [1 / 3, 0, 1], //3/4
                        [1 / 3, 0, 1] //1/4
                    ], //vertical
                    [
                        [1, 0, 1], //3/4
                        [1, 0, 1] //1/4
                    ] //horizontal
                ]
            ];
    }
    rgState = 0;

    if (0 < frameCount) {
        updateNullingSlider();
    }
}

function resetIllusionStrength() {
    illusionStrength = [0.5, 0.5];
}

function changeRGState(change) {
    rgState = constrain(rgState + change, -1, 1);
}

function mapRGStateToColors() {
    var stateMappedToNullingColorsArray = state - 2;
    if (state == 4) {
        stateMappedToNullingColorsArray = 1;
    }
    if (rgState < 0) {
        nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][0] = 1 / 3;
        nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][1] = abs(rgState);
    }
    else {
        nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][0] = 1;
        nullingColors[stateMappedToNullingColorsArray][vhRadioMapper(vhRadio.value())][partialRadioMapper(partialRadio.value())][1] = rgState;
    }
}

function arrayToHSBColor(arr) {
    colorMode(HSB, 1);
    var col = color(arr[0], arr[1], arr[2]);
    colorMode(HSB, 1);
    return col;
}

function drawMcColloughStimulus(c, partialC, s, n, x, y, o, wF, partial, zoom) {
    if (partial) {
        var hgDims = hermannGridDimensions(hgBlockNum, hgWidthFactor, stimSize);
        var translate = 1.5*(hgDims[0]+hgDims[1]);
        var size = 3*hgDims[0]+2*hgDims[1];
        fill(c);
        rect(x, y, s, s);
        fill(partialC);
        rect(x - zoom*translate*1.1, y + zoom*translate*1.1, zoom*size, zoom*size);
    }
    else {
        fill(c);
        rect(x, y, s, s);
    }

    var counter = 1;
    fill(0);
    stroke(0);
    for (var i = 1; i < n * 2; i += 1) {
        if (i % 2 == 1) {
            if (counter % 2 == 1) {
                if (o) {
                    rect(x + map(i, 0, n * 2, -s / 2, s / 2), y, wF * s / n, s);
                }
                else {
                    rect(x, y + map(i, 0, n * 2, -s / 2, s / 2), s, wF * s / n);
                }
            }
            counter++;
        }
    }
    noFill();
    noStroke();
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

function keyPressed() {
    if (1 < state) {
        if (key == 'c' || key == 'C') {
            modifyColor = !modifyColor;
        }
        if (key == 's' || key == 'S') {
            if (state == 2 || state == 3) {
                resetNullingColors();
            }
            else if (state == 4) {
                resetIllusionStrength();
            }
        }
    }

    if (modifyColor) {
        if (1 < state && state < 4 && (key == 'r' || key == 'G')) {
            changeRGState(255 / 50000);
            mapRGStateToColors();
            updateNullingSlider();
        }
        if (1 < state && state < 4 && (key == 'g' || key == 'G')) {
            changeRGState(-255 / 50000);
            mapRGStateToColors();
            updateNullingSlider();
        }

        if (state == 4 && (key == 'd' || key == 'D')) {
            changeIllusionStrength(-1 / 250);
            updateIllusionStrengthSlider()
        }
        if (state == 4 && (key == 'f' || key == 'F')) {
            changeIllusionStrength(1 / 250);
            updateIllusionStrengthSlider();
        }
    }
}

function changeIllusionStrength(change) {
    illusionStrength[illusionStrengthRadioMapper(illusionStrengthRadio.value())] = constrain(illusionStrength[illusionStrengthRadioMapper(illusionStrengthRadio.value())] + change, 0, 1);
}

function updateIllusionStrengthSlider() {
    var val = 1000 * illusionStrength[illusionStrengthRadioMapper(illusionStrengthRadio.value())];
    illusionStrengthSlider.value(val);
}

function handleIllusionStrengthSlider() {
    illusionStrength[illusionStrengthRadioMapper(illusionStrengthRadio.value())] = illusionStrengthSlider.value() / 1000;
}

function setUIVisibility() {
    if (state == 0) {
        mcWidthSlider.show();
        hgWidthSlider.show();
        subjectInput.show();
        switchTimeInput.show();
        adaptTimeInput.show();
        startButton.show();
        partialCheckbox.show();
    }
    else {
        mcWidthSlider.hide();
        hgWidthSlider.hide();
        subjectInput.hide();
        switchTimeInput.hide();
        adaptTimeInput.hide();
        startButton.hide();
        partialCheckbox.hide();
        illusionStrengthRadio.hide();
        illusionStrengthSlider.hide();
    }

    if (state == 2 || state == 3 || state == 4) {
        testStimRadio.show();
        if (modifyColor) {
            clipboardButton.show();
        }
        else {
            clipboardButton.hide();
        }

        if (modifyColor && 1 < state && state < 4) {
            nullingSlider.show();
            vhRadio.show();
            illusionStrengthRadio.hide();
            illusionStrengthSlider.hide();
            if (partialColoring) {
                partialRadio.show();
            }
        }
        else {
            nullingSlider.hide();
            vhRadio.hide();
            partialRadio.hide();
            illusionStrengthRadio.hide();
            illusionStrengthSlider.hide();
        }
        if (modifyColor && state == 4) {
            illusionStrengthRadio.show();
            illusionStrengthSlider.show();
        }
    }
    else if (state != 0) {
        testStimRadio.hide();
        nullingSlider.hide();
        vhRadio.hide();
        partialRadio.hide();
        clipboardButton.hide();
        illusionStrengthRadio.hide();
    }
}

function dataToClipboard() {
    var stateMappedToNullingColorsArray = state - 2;
    var stateName = "null";
    if (state == 2) {
        stateName = "McCollough";
    }
    else if (state == 3) {
        stateName = "Hermann Grid";
    }
    else if (state == 4) {
        stateName = "Illusion strength"
        stateMappedToNullingColorsArray = 1;
    }
    if (partialColoring) {
        if (state == 2) {
            var nullings =
                "vertical nulling in hex: " + arrayToHSBColor(nullingColors[state - 2][0][0]).toString("#rrggbb") + " (c), " + arrayToHSBColor(nullingColors[state - 2][0][1]).toString("#rrggbb") + "  (nc)" +
                "\nhorizontal nulling in hex: " + arrayToHSBColor(nullingColors[state - 2][0][0]).toString("#rrggbb") + " (c), " + arrayToHSBColor(nullingColors[state - 2][0][1]).toString("#rrggbb") + "  (nc)";
            copyToClipboard("Subject: " + subject + "\nadaptation length:" + adaptTime + " mins" + "\n" + stateName + "\n" + nullings);
        }
        if (state == 4) {
            console.log("fasz");
            var illusionStrengthText =
                "min brightness in col region: " + illusionStrength[0] +
                "\nmin brightness in no col region: " + illusionStrength[1];
            copyToClipboard("Subject: " + subject + "\nadaptation length:" + adaptTime + " mins" + "\n" + stateName + "\n" + illusionStrengthText);
        }
    }
    else {
        var nullings =
            "vertical nulling in hex: " + arrayToHSBColor(nullingColors[stateMappedToNullingColorsArray][0]).toString("#rrggbb") +
            "\nhorizontal nulling in hex: " + arrayToHSBColor(nullingColors[stateMappedToNullingColorsArray][1]).toString("#rrggbb");
        copyToClipboard("Subject: " + subject + "\nadaptation length:" + adaptTime + " mins" + "\n" + stateName + "\n" + nullings);
    }
}

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}