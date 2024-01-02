function loadChapter(url, containerName) {
    var container = document.getElementById(containerName);
    container.innerHTML = "";
    loadContent(url, container);
}

function loadEvaluations() {
    var container = document.getElementById("evaluationContainer");
    container.innerHTML = "";
    container.hidden = false;

    var initiator = {
        ioCapabilities: document.getElementById("initiatorIoCapabilities").value,
        operatingSystem: document.getElementById("initiatorOperationSystem").value,
        oobData: document.getElementById("initiatorOobData").checked,
        bonding: document.getElementById("initiatorBonding").checked,
        mitm: document.getElementById("initiatorMitm").checked,
        secureConnection: document.getElementById("initiatorSecureConnection").checked,
    };

    var responder = {
        ioCapabilities: document.getElementById("responderIoCapabilities").value,
        oobData: document.getElementById("responderOobData").checked,
        bonding: document.getElementById("responderBonding").checked,
        mitm: document.getElementById("responderMitm").checked,
        secureConnection: document.getElementById("responderSecureConnection").checked,
    };

    var evaluationURLs = determineEvaluations(initiator, responder);
    evaluationURLs.forEach(async (url) => await loadContent(url, container));
}

function determineEvaluations(initiator, responder) {
    //Don't enable the form and input wrong iOS/Android data! ;)

    const KeyGenMethods = Object.freeze({
        OOB: "OOB",
        JustWorks: "JustWorks",
        PasskeyEntry: "PasskeyEntry",
        NumericComparison: "NumericComparison",
    });

    var urls = [];
    var KeyGenMethod;
    var SecurePairing;

    const KeyGenMethodsCases = new Map([
        ["DisplayOnly-DisplayOnly", KeyGenMethods.JustWorks],
        ["DisplayOnly-DisplayYesNo", KeyGenMethods.JustWorks],
        ["DisplayOnly-KeyboardOnly", KeyGenMethods.PasskeyEntry],
        ["DisplayOnly-NoInputNoOutput", KeyGenMethods.JustWorks],
        ["DisplayOnly-KeyboardDisplay", KeyGenMethods.PasskeyEntry],
        ["DisplayYesNo-DisplayOnly", KeyGenMethods.JustWorks],
        ["DisplayYesNo-DisplayYesNo", KeyGenMethods.NumericComparison],
        ["DisplayYesNo-KeyboardOnly", KeyGenMethods.PasskeyEntry],
        ["DisplayYesNo-NoInputNoOutput", KeyGenMethods.JustWorks],
        ["DisplayYesNo-KeyboardDisplay", KeyGenMethods.NumericComparison],
        ["KeyboardOnly-DisplayOnly", KeyGenMethods.PasskeyEntry],
        ["KeyboardOnly-DisplayYesNo", KeyGenMethods.PasskeyEntry],
        ["KeyboardOnly-KeyboardOnly", KeyGenMethods.PasskeyEntry],
        ["KeyboardOnly-NoInputNoOutput", KeyGenMethods.JustWorks],
        ["KeyboardOnly-KeyboardDisplay", KeyGenMethods.PasskeyEntry],
        ["NoInputNoOutput-DisplayOnly", KeyGenMethods.JustWorks],
        ["NoInputNoOutput-DisplayYesNo", KeyGenMethods.JustWorks],
        ["NoInputNoOutput-NoInputNoOutput", KeyGenMethods.JustWorks],
        ["NoInputNoOutput-KeyboardOnly", KeyGenMethods.JustWorks],
        ["NoInputNoOutput-KeyboardDisplay", KeyGenMethods.JustWorks],
        ["KeyboardDisplay-DisplayOnly", KeyGenMethods.PasskeyEntry],
        ["KeyboardDisplay-DisplayYesNo", KeyGenMethods.NumericComparison],
        ["KeyboardDisplay-KeyboardOnly", KeyGenMethods.PasskeyEntry],
        ["KeyboardDisplay-NoInputNoOutput", KeyGenMethods.JustWorks],
        ["KeyboardDisplay-KeyboardDisplay", KeyGenMethods.NumericComparison],
    ]);

    if (
        (initiator.secureConnection && responder.secureConnection && (initiator.oobData || responder.oobData)) ||
        (initiator.oobData && responder.oobData)
    ) {
        KeyGenMethod = KeyGenMethods.OOB;
    } else if (!initiator.mitm && !initiator.mitm) {
        KeyGenMethod = KeyGenMethods.JustWorks;
    } else {
        KeyGenMethod = KeyGenMethodsCases.get([initiator.ioCapabilities, responder.ioCapabilities].join("-"));
        if (KeyGenMethod === "NumericComparison" && (!initiator.secureConnection || !responder.secureConnection)) {
            KeyGenMethod = KeyGenMethods.PasskeyEntry;
        }
    }

    if (initiator.secureConnection && responder.secureConnection) {
        urls.push("evaluations/pairing/secure_connection.html");
        SecurePairing = true;
    } else {
        urls.push("evaluations/pairing/legacy.html");
    }
    switch (KeyGenMethod) {
        case "OOB":
            urls.push("evaluations/keygen/oob.html");
            break;
        case "JustWorks":
            if (initiator.mitm || responder.mitm) {
                return ["evaluations/keygen/aborted.html"];
            } else {
                urls.push("evaluations/keygen/just_works.html");
                if (SecurePairing) {
                    urls.push("evaluations/wireshark/sc_justworks.html");
                } else {
                    urls.push("evaluations/wireshark/legacy_justworks.html");
                }
            }
            break;
        case "PasskeyEntry":
            urls.push("evaluations/keygen/passkey_entry.html");
            if (SecurePairing) {
                urls.push("evaluations/wireshark/sc_passkey.html");
            } else {
                urls.push("evaluations/wireshark/legacy_passkey.html");
            }
            break;
        case "NumericComparison":
            urls.push("evaluations/keygen/numeric_comparison.html");
            urls.push("evaluations/wireshark/sc_justworks.html");
            break;
    }

    switch (initiator.operatingSystem) {
        case "Custom":
            urls.push("evaluations/os/custom.html");
            break;
        case "WebBluetooth":
            urls.push("evaluations/os/webBluetooth.html");
            break;
        default:
            urls.push("evaluations/os/phone.html");
    }

    if (initiator.secureConnection && responder.secureConnection) {
        urls.push("evaluations/threats/identity-tracking.html");
    } else if (KeyGenMethod != "JustWorks") {
        urls.push("evaluations/threats/passive_eavesdropping.html");
    } else {
        urls.push("evaluations/threats/man-in-the-middle.html");
    }

    return urls.length > 0 ? urls : ["404.html"];
}

async function loadContent(url, container) {
    container.insertAdjacentHTML("beforeend", await fetchHtmlAsText(url));
    return;
}

async function fetchHtmlAsText(url) {
    return await (await fetch(url)).text();
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
}

function handleSpecificOSinForm(value) {
    var ioCapabilities = document.getElementById("initiatorIoCapabilities");
    var oobData = document.getElementById("initiatorOobData");
    var bonding = document.getElementById("initiatorBonding");
    var mitm = document.getElementById("initiatorMitm");
    var secureConnection = document.getElementById("initiatorSecureConnection");

    if (value == "Android" || value == "iOS") {
        ioCapabilities.value = "KeyboardDisplay";
        ioCapabilities.disabled = true;
        oobData.checked = false;
        oobData.disabled = true;
        bonding.checked = true;
        bonding.disabled = true;
        mitm.checked = true;
        mitm.disabled = true;
        secureConnection.checked = true;
        secureConnection.disabled = true;
    } else {
        ioCapabilities.disabled = false;
        oobData.disabled = false;
        bonding.disabled = false;
        mitm.disabled = false;
        secureConnection.disabled = false;
    }
}
