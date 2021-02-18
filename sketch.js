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
var mcColors;
var hgColors;
var modifyColor;
var adapt;
var mask;
var timestamp;
var colorRadio;
var vhRadio;
var testStimRadio;
var clipboardButton;
var subjectInput;
var switchTimeInput;
var adaptTimeInput;
var startButton;

var state;

var mcWidthSlider;
var hgWidthSlider;

function setup() {
    createCanvas(min(windowWidth, 1200), min(windowWidth, 1200) * 6 / 8);
    colorMode(RGB, 1);
    rectMode(CENTER);
    noStroke();
    noFill();
    textAlign(LEFT);

    mcWidthFactor = 1;
    switchTime = 2000;
    maskTime = 500;
    adaptTime = 5;
    subject = "Test";
    stimX = width * 0.5;
    stimY = height * 0.57;
    stimSize = min(width, height) * 0.7;
    mcLineNum = 21;
    hgWidthFactor = 0.251;
    hgBlockNum = 6;
    resetColors();
    modifyColor = false;
    adapt = true;
    mask = false;
    adaptCounter = 0;

    state = 0;

    mcWidthSlider = createSlider(0, 200, 100);
    hgWidthSlider = createSlider(0, 150, 25);

    subjectInput = createInput(subject);
    switchTimeInput = createInput(switchTime);
    adaptTimeInput = createInput(adaptTime);
    startButton = createButton('Start!');
    startButton.mousePressed(startExperiment);

    vhRadio = createRadio('vhRadio');
    vhRadio.option('vertical');
    vhRadio.option('horizontal');
    vhRadio.selected('vertical');

    colorRadio = createRadio('colorRadio');
    colorRadio.option('red');
    colorRadio.option('green');
    colorRadio.option('blue');
    colorRadio.option('hue');
    colorRadio.option('saturation');
    colorRadio.option('brightness');
    colorRadio.selected('red');

    clipboardButton = createButton('Copy to clipboard');
    clipboardButton.mousePressed(nullingsToClipboard);

    testStimRadio = createRadio('testStimRadio');
    testStimRadio.option('McCollough');
    testStimRadio.option('Hermann Grid');
    testStimRadio.selected('McCollough');

    setUIVisibility();
}

function windowResized() {
    resizeCanvas(min(windowWidth, 1200), min(windowWidth, 1200) * 6 / 8);
    stimX = width * 0.5;
    stimY = height * 0.57;
    stimSize = min(width, height) * 0.7;
}

function draw() {

    background(0.8);
    if (state == 0) {
        drawSettingsUI();
        handleSliders();
    }
    else if (state == 1) {
        if (adapt) {
            if (millis() - timestamp < switchTime) {
                var flicker = (adaptCounter/2)%2;
                drawMcColloughStimulus(color(flicker, !flicker, 0), stimSize, mcLineNum, stimX, stimY, flicker, mcWidthFactor);
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
                drawMcColloughStimulus(mcColors[abs(i - j) / 2], stimSize * 0.5, mcLineNum, width * 0.5 + i * 1.025 * stimSize / 4, stimY + j * 1.025 * stimSize / 4, abs(i + j) / 2, mcWidthFactor);
            }
        }
        drawTestStimUI();
    }
    else if (state == 3) {
        drawHermannGrid(hgBlockNum, hgWidthFactor, stimSize, hgColors[0], hgColors[1], stimX, stimY);
        drawTestStimUI();
    }
    if (keyIsPressed) {
        if (modifyColor && key == 'w') {
            changeColor(255 / 50000);
        }
        if (modifyColor && key == 'q') {
            changeColor(-255 / 50000);
        }
    }
    controlFlow();
    setUIVisibility();
}

function drawTestStimUI() {
    var colors = [mcColors, hgColors];
    if (modifyColor) {
        vhRadio.position(width * 0.19 - round(width * 1.1 / 7), height * 0.1);
        vhRadio.style('width', round(width * 2.5 / 7) + 'px');
        vhRadio.style('font-family', 'Arial');
        vhRadio.style('font-size', round(width * 0.14 / 7) + 'px');

        colorRadio.position(width * 0.19 - round(width * 1.1 / 7), height * 0.14);
        colorRadio.style('width', round(width * 5 / 7) + 'px');
        colorRadio.style('font-family', 'Arial');
        colorRadio.style('font-size', round(width * 0.14 / 7) + 'px');

        textSize(round(width * 0.14 / 7));
        fill(0);
        text("press C to hide\t|\tpress R to reset", width * 0.015, height * 0.04);
        fill(0);
        text("select option and use Q and W to set nulling color:", width * 0.015, height * 0.085);

        textAlign(CENTER);
        text("vertical nulling in hex: " + colors[state - 2][0].toString("#rrggbb"), width * 0.77, height * 0.085);
        text("horizontal nulling in hex: " + colors[state - 2][1].toString("#rrggbb"), width * 0.77, height * (0.085 + 1 * 0.04));
        textAlign(LEFT);
        clipboardButton.position(width * 0.77 - round(width * 0.55 / 8), height * (0.085 + 2 * 0.04) - round(width * 0.13 / 8));
    }
    else {
        fill(0);
        textSize(round(width * 0.14 / 7));
        text("press C for nulling setting", width * 0.015, height * 0.04);
    }
    testStimRadio.style('width', round(width * 3 / 7) + 'px');
    fill(0);
    testStimRadio.position(width * 0.19 - round(width * 1.1 / 7), height * 0.955);
    text("test stimulus: ", width * 0.015, height * 0.935);
    testStimRadio.style('font-family', 'Arial');
    testStimRadio.style('font-size', round(width * 0.14 / 7) + 'px');
}

function drawSettingsUI() {
    textAlign(CENTER);
    background(0.8);
    fill(0);
    textSize(round(width * 0.35 / 7));
    text("Experiment settings", width * 0.5, height * 0.1);

    textSize(round(width * 0.16 / 7));
    text("McCollough street width:", width * 0.15 + round(width * 1 / 7), height * 0.24);
    mcWidthSlider.style('width', round(width * 2 / 7) + 'px');
    mcWidthSlider.position(width * 0.15, height * 0.25);
    drawMcColloughStimulus(color(1), round(width * 2 / 7), mcLineNum, width * 0.15 + round(width * 1 / 7), height * 0.5, 1, mcWidthFactor);

    fill(0);
    textSize(round(width * 0.16 / 7));
    text("Hermann Grid street width:", width * 0.45 + round(width * 1.8 / 7), height * 0.24);
    hgWidthSlider.style('width', round(width * 2 / 7) + 'px');
    hgWidthSlider.position(width * 0.85 - round(width * 2 / 7), height * 0.25);
    drawHermannGrid(hgBlockNum, hgWidthFactor, round(width * 2 / 7), 1, 1, width * 0.85 - round(width * 1 / 7), height * 0.5);

    fill(0);
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

    textAlign(LEFT);
}

function startExperiment() {
    setParameters();
    expStartTime = millis();
    timestamp = expStartTime;
    state = 1;
}

function controlFlow() {
    if (millis() - expStartTime > adaptTime * 60 * 1000) {
        state = testStimRadioMapper(testStimRadio.value()) + 2;
    }
}

function setParameters() {
    subject = subjectInput.value();
    switchTime = switchTimeInput.value();
    adaptTime = adaptTimeInput.value();
}

function handleSliders() {
    mcWidthFactor = mcWidthSlider.value() / 100;
    hgWidthFactor = hgWidthSlider.value() / 100;
}

function testStimRadioMapper(val) {
    if (val == 'McCollough') {
        return 0;
    }
    else if (val == 'Hermann Grid') {
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

function colorRadioMapper(val) {
    if (val == 'hue') {
        return 0;
    }
    else if (val == 'saturation') {
        return 1;
    }
    else if (val == 'brightness') {
        return 2;
    }
    else if (val == 'red') {
        return 3;
    }
    else if (val == 'green') {
        return 4;
    }
    else if (val == 'blue') {
        return 5;
    }
}

function resetColors() {
    mcColors = [color(1, 1, 1), color(1, 1, 1)];
    hgColors = [color(1, 1, 1), color(1, 1, 1)];
}

function changeColor(change) {
    var vhVal = vhRadioMapper(vhRadio.value());
    var colorVal = colorRadioMapper(colorRadio.value());
    if (state == 2) {
        var arr = colorToArray(mcColors[vhVal]);
        if (colorVal < 3) {
            arr[colorVal] = constrain(arr[colorVal] + change, 0, 1);
            mcColors[vhVal] = arrayToHSBColor(arr);
        }
        else if (colorVal > 2) {
            arr[colorVal] = constrain(arr[colorVal] + change, 0, 1);
            mcColors[vhVal] = arrayToRGBColor(arr);
        }
    }
    else if (state == 3) {
        var arr = colorToArray(hgColors[vhVal]);
        if (colorVal < 3) {
            arr[colorVal] = constrain(arr[colorVal] + change, 0, 1);
            hgColors[vhVal] = arrayToHSBColor(arr);
        }
        else if (colorVal > 2) {
            arr[colorVal] = constrain(arr[colorVal] + change, 0, 1);
            hgColors[vhVal] = arrayToRGBColor(arr);
        }
    }
}

function colorToArray(col) {
    var arr = [];
    colorMode(HSB, 1);
    arr.push(hue(col));
    arr.push(saturation(col));
    arr.push(brightness(col));
    colorMode(RGB, 1);
    arr.push(red(col));
    arr.push(green(col));
    arr.push(blue(col));
    return arr;
}

function arrayToHSBColor(arr) {
    colorMode(HSB, 1);
    var col = color(arr[0], arr[1], arr[2]);
    colorMode(RGB, 1);
    return col;
}

function arrayToRGBColor(arr) {
    colorMode(RGB, 1);
    return color(arr[3], arr[4], arr[5]);
}

function drawMcColloughStimulus(c, s, n, x, y, o, wF) {
    fill(c);
    rect(x, y, s, s);

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
        if (key == 'r' || key == 'R') {
            resetColors();
        }
    }
    /*if (key == 0 || key == 1 || key == 2 || key == 3) {
        state = key;
    }*/
}

function setUIVisibility() {
    if (state == 0) {
        mcWidthSlider.show();
        hgWidthSlider.show();
        subjectInput.show();
        switchTimeInput.show();
        adaptTimeInput.show();
        startButton.show();
    }
    else {
        mcWidthSlider.hide();
        hgWidthSlider.hide();
        subjectInput.hide();
        switchTimeInput.hide();
        adaptTimeInput.hide();
        startButton.hide();
    }

    if (state == 2 || state == 3) {
        testStimRadio.show();
        if (modifyColor) {
            colorRadio.show();
            vhRadio.show();
            clipboardButton.show();
        }
        else {
            colorRadio.hide();
            vhRadio.hide();
            clipboardButton.hide();
        }
    }
    else {
        testStimRadio.hide();
        colorRadio.hide();
        vhRadio.hide();
        clipboardButton.hide();
    }
}

function nullingsToClipboard() {
    var colors = [mcColors, hgColors];
    var stateName = "null";
    if (state == 2) {
        stateName = "McCollough";
    }
    else if (state == 3) {
        stateName = "Hermann Grid";
    }
    var nullings =
        "vertical nulling in hex: " + colors[state - 2][0].toString("#rrggbb") +
        "\nhorizontal nulling in hex: " + colors[state - 2][1].toString("#rrggbb");
    copyToClipboard("Subject: " + subject + "\n" + stateName + "\n" + nullings);
}

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}