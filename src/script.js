let identifier;
// const api = 'http://localhost';
const api = 'http://divaservices.unifr.ch/api/v2';
let inputGraphView;
let outputGraphView;

const img = ['png', 'jpg', 'jpeg', 'tiff'];
const text = ['txt', 'xml', 'gxl'];
const graph = ['xml', 'gxl'];


// Setup graph views
function init() {
    inputGraphView = graphView('inputGraphView');
    outputGraphView = graphView('outputGraphView');
}


async function keypointGraph() {
    const body = JSON.stringify({
        parameters: {},
        data: [
            {
                inputImage: identifier,
            },
        ],
    });

    runMethod(`${api}/graph/keypointgraph/1`, body, 'graph');
}


async function graphTransform() {
    const body = JSON.stringify({
        parameters: {
            keepEdges: String(getElem('keepEdges').checked),
            method: getElem('method').value,
            numberK: Number(getElem('numberK').value),
            mergeMode: getElem('mergeMode').value,
        },
        data: [
            {
                inputGraph: identifier,
            },
        ],
    });

    runMethod(`${api}/graph/graphtransformation/1`, body, 'graph');
}


async function ged() {
    const body = JSON.stringify({
        parameters: {
            /**
             * Notice: new version (not yet online) has some differences:
             *  - numberN renamed to nReference
             *  - new parameters: nodeCost, edgeCost, useEdgeLength
             */
            numberN: Number(getElem('nReference').value),
            sortMode: String(getElem('sortMode').checked),
            verificationMode: String(getElem('verificationMode').checked),
            /*
            nReference: Number(getElem('nReference').value),
            nodeCost: Number(getElem('nodeCost').value),
            edgeCost: Number(getElem('edgeCost').value),
            useEdgeLength: String(getElem('useEdgeLength').checked),
            */
        },
        data: [
            {
                inputData: identifier,
            },
        ],
    });

    runMethod(`${api}/graph/grapheditdistance/1`, body, 'text');
}


async function sigEval() {
    const body = JSON.stringify({
        parameters: {
            numberR: Number(getElem('numberR').value),
            numberG: Number(getElem('numberG').value),
            verification: String(getElem('verification').checked),
        },
        data: [
            {
                inputData: identifier,
            },
        ],
    });

    runMethod(`${api}/graph/signatureevaluation/1`, body, 'text');
}


// Submit job and collect results
async function runMethod(url, body, resultType) {
    startSpin();
    const data = await POST(url, body);
    const result = await getResult(data.results[0].resultLink);
    await showResult(resultType, result.output[0].file.url);
    stopSpin();
}

// Visualize results depending on type
async function showResult(type, url) {
    getElem('outputLink').href = url;
    const content = await GET(url, true);
    getElem('outputPlaceholder').style.display = 'none';
    if (type === 'graph') {
        getElem('outputGraphView').style.display = 'block';
        getElem('outputText').style.display = 'none';
        outputGraphView.importGraph(content);
    } else {
        getElem('outputGraphView').style.display = 'none';
        getElem('outputText').style.display = 'block';
        getElem('outputText').innerHTML = content;
    }
}


// Read file as base64 (or text)
function readFile(file, plain = false) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = (e) => {
            resolve(e.target.result);
        };
        reader.onerror = (e) => {
            reject(e);
        };

        if (plain) reader.readAsText(file);
        else reader.readAsDataURL(file);
    });
}

// Perform HTTP POST and return answer as JSON
async function POST(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        body,
        headers: new Headers({ 'content-type': 'application/json' }),
    });
    return res.json();
}

// Perform HTTP GET and return answer as JSON (or text)
async function GET(url, plain = false) {
    const res = await fetch(url, {
        method: 'GET',
    });
    if (plain) return res.text();
    return res.json();
}

/**
 * Fetch the result from a given url
 * Polls for the result every 1000ms (1s)
 * */
async function getResult(url) {
    const data = await GET(url);
    if (data.status === 'done') {
        console.log('getResult', 'OK');
        return data;
    }
    console.log('getResult', data);
    await sleep(1000);
    return getResult(url);
}

/**
 * Get the result from an upload operation
 * Polls every 1000ms (1s) to check if the collection is available
 * */
async function getUploadResult(collectionName) {
    const data = await GET(`${api}/collections/${collectionName}`);
    if (data.statusCode === 200) {
        return data.files[0].file.identifier;
    }
    console.log(data);
    await sleep(1000);
    return getUploadResult(collectionName);
}

/**
 * Encodes the file as base64 string to upload it to DIVAServices
 * */
async function processFile(file) {
    startSpin();
    getElem('inputImage').style.display = 'none';
    getElem('inputGraphView').style.display = 'none';
    getElem('inputText').style.display = 'none';

    // Read file as base64 string
    const b64content = await readFile(file);

    // Get file extension
    const parts = file.name.split('.');
    const ext = parts[parts.length - 1];

    // Also read file as text, if it can be shown as such
    if (text.includes(ext)) {
        const content = await readFile(file, true);
        if (graph.includes(ext)) {
            getElem('inputGraphView').style.display = 'block';
            inputGraphView.importGraph(content);
        } else {
            getElem('inputText').style.display = 'block';
            getElem('inputText').innerHTML = content;
        }
    } else if (img.includes(ext)) {
        getElem('inputImage').src = b64content;
        getElem('inputImage').style.display = 'block';
    } else {
        // File is neither text nor image, show generic message
        getElem('inputText').style.display = 'block';
        getElem('inputText').innerHTML = `${ext} file`;
    }

    getElem('upload_info').style.display = 'none';
    await uploadFile(b64content, file.name);
    stopSpin();
}

/**
 * Uploads a file to DIVAServices
 * */
async function uploadFile(file, name) {
    const body = JSON.stringify({
        files: [
            {
                type: 'base64',
                value: file,
                name: name.replace(' ', '_'),
            },
        ],
    });
    const data = await POST(`${api}/collections`, body);
    if (!data.collection) {
        console.log(data);
        console.error(data.message);
        return;
    }
    identifier = await getUploadResult(data.collection);
}


/**
 * Some small helper functions
 */

function fileChanged(chooser) {
    getElem('upload-file-info').innerHTML = chooser.files[0].name;
    processFile(chooser.files[0]);
}

function getElem(id) {
    return document.getElementById(id);
}

function startSpin() {
    getElem('spinner').style.visibility = 'visible';
    enableButtons(false);
}

function stopSpin() {
    getElem('spinner').style.visibility = 'hidden';
    enableButtons();
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

function enableButtons(bool = true) {
    const buttons = getElem('buttons')
        .getElementsByTagName('button');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = !bool;
    }
}
