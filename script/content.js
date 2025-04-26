function setWSActiveCookie(value) {
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days expiration
    const expires = "expires=" + date.toUTCString();
    document.cookie = `WS-ACTIVE=${value}; ${expires}; path=/; SameSite=Lax`;
}

function getWSActiveCookie() {
    const name = "WS-ACTIVE=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null;
}

function addProp(){
    const buttonWrapDiv = document.createElement('div');
    buttonWrapDiv.className = 'ws-button-wrap';

    const buttonElement = document.createElement('button');
    buttonElement.className = 'ws-button-wrap-btn';
    buttonElement.id = 'ws-button-wrap-btn';
    buttonElement.textContent = 'Convert to Slides';

    const rollerDiv = document.createElement('div');
    rollerDiv.className = 'ws-button-roller ws-button-roller-hide';
    rollerDiv.id = 'ws-button-roller';

    buttonElement.appendChild(rollerDiv);

    buttonWrapDiv.appendChild(buttonElement);

    document.body.appendChild(buttonWrapDiv);

    triggerExtraction();
}

function removeLoader(){
    var ws_loader = document.querySelector('#ws-button-roller');
    var ws_button = document.querySelector('#ws-button-wrap-btn');

    if(ws_button || ws_loader)
        ws_loader.classList.replace("ws-button-roller-show","ws-button-roller-hide");
        ws_button.disabled = false;
}

function removeProp(){
    var ws_button = document.querySelector('.ws-button-wrap');
    if(ws_button){
        ws_button.remove();
    }
}

function triggerExtraction(){

    var ws_loader = document.querySelector('#ws-button-roller');
    var ws_button = document.querySelector('#ws-button-wrap-btn');

    document.querySelector('#ws-button-wrap-btn').addEventListener('click', function(){

        ws_button.disabled = true;
        ws_loader.classList.replace("ws-button-roller-hide","ws-button-roller-show");

        sendMessage();

    });
}

function sendMessage(){
    var port = chrome.runtime.connect({name: "CreatePresentation"});
    port.postMessage({action: 'CreatePresentation', texts: window.location.href});
        port.onMessage.addListener(function(msg) {
        if (msg.response === "Complete"){
            removeLoader();
            alert('Conversion Complete');
        }
        if (msg.response === "Error"){
            removeLoader();
            alert('Something Went Wrong\nTry again');
        }
        if (msg.response === "No URL"){
            removeLoader();
            alert('Can`t access unsaved Google Doc');
        }
        if (msg.response === "Auth Fail"){
            removeLoader();
            alert('Couldn`t Authenticate Google Account\nTry Again');
        }
        if (msg.response === "Failed Fetch"){
            removeLoader();
            alert('Failed to Access your DOC\n Kindly Refresh the Page');
        }
        if (msg.response === "Failed Present"){
            removeLoader();
            alert('Couldn`t Create Google Presentation\nTry Again');
        }
        if (msg.response === "Error"){
            removeLoader();
            alert('Something Went Wrong\nTry again');
        }
    });
}

window.addEventListener('load', function(){
    const wsActiveValue = getWSActiveCookie();
    if(wsActiveValue != "false"){
        addProp();
    }   
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "SwitchAction"){
            setWSActiveCookie(request.response);
            if(request.response == true){
                addProp();
            }
            if(request.response == false){
                removeProp();
            }
        }
    }
);