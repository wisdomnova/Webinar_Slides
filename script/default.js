var loader = document.getElementById('loader');
var ws_checkbox = document.getElementById('ws-checkbox');

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

function removeProp(){
    (async () => {
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {action: "SwitchAction", response: this.checked});
    })();
    setWSActiveCookie(this.checked);
    ws_checkbox.checked = this.checked;
}

// Check if the user is logged in
function checkLoginStatus() {
    loader.classList.replace('ws-button-roller-hide','ws-button-roller-show');
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (chrome.runtime.lastError || !token) {
            // alert('User not logged in.');
            document.getElementById('loginButton').style.display = 'block';
            document.getElementById('logoutButton').style.display = 'none';
        }else{
            // alert('User is logged in.');
            displayGreeting();
            document.getElementById('logoutButton').style.display = 'block';
            document.getElementById('loginButton').style.display = 'none';
        }
        loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
    });
}

// Display a greeting with the user's information
function displayGreeting() {

    loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
    document.getElementById('greeting').textContent = 'Hi! User';
    document.getElementById('greeting').style.display = 'block';
    document.getElementById('loginButton').style.display = 'none';

}

// Log in function
function loginUser() {

    loader.classList.replace('ws-button-roller-hide','ws-button-roller-show');

    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {

            alert('Failed to Authenticate\nTry Again');
            loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
            // console.error('Error logging in:', chrome.runtime.lastError.message);
            return;
        }

        loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
        // console.log('User logged in successfully.');
        checkLoginStatus(); // Refresh UI based on new login status
    });
}

// Log out and disconnect the Google account
function disconnectGoogleAccount() {

    loader.classList.replace('ws-button-roller-hide','ws-button-roller-show');

    chrome.identity.getAuthToken({ interactive: false }, function(token) {
        if (chrome.runtime.lastError) {

            loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
            alert('Can`t find this user');
            // console.error('Error obtaining auth token:', chrome.runtime.lastError.message);
            return;
        }

        if (token) {
            // Remove the cached token
            chrome.identity.removeCachedAuthToken({ token: token }, function() {

                // Revoke the token by making a request to Google's revocation endpoint
                fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, {
                    method: 'POST',
                    mode: 'no-cors' // Use no-cors mode as it's a cross-origin request
                }).then(() => {

                    // console.log('User has been logged out and disconnected.');
                    // alert('You have been logged out.');

                    loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');

                    document.getElementById('greeting').style.display = 'none';
                    document.getElementById('logoutButton').style.display = 'none';
                    document.getElementById('loginButton').style.display = 'block';

                }).catch(error => {

                    loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
                    alert('Something Went Wrong');
                    // console.error('Error revoking token:', error);
                });
            });
        } else {
            // console.log('No token found, user is already logged out.');
            loader.classList.replace('ws-button-roller-show','ws-button-roller-hide');
            alert('No active session found.');
        }
    });
}



// Attach event listeners
document.getElementById('loginButton').addEventListener('click', loginUser);
document.getElementById('logoutButton').addEventListener('click', disconnectGoogleAccount);

document.getElementById('ws-checkbox').addEventListener('change', removeProp);

// Check login status on load
checkLoginStatus();

const wsActiveValue = getWSActiveCookie();
if(wsActiveValue == "false"){
    ws_checkbox.checked = false;
}else{
    ws_checkbox.checked = true;
}