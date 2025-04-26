var state = false;

var port = chrome.runtime.connect({name: "CreatePresentation"});
port.onMessage.addListener(function(msg) {
    state = !state;
});


function setWSActiveCookie(value) {
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days expiration
    const expires = "expires=" + date.toUTCString();
    document.cookie = `WS-ACTIVE=${value}; ${expires}; path=/; SameSite=Lax`;
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "SwitchAction"){
            setWSActiveCookie(request.response);
        }
    }
);