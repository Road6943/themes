async function getThemeStrings() {
    const url = 'https://raw.githubusercontent.com/Road6943/Discord-Arras.io-Theme-Scraper-Bot/main/themes.txt';
    // Theme strings are in text file with 1 theme per line
    const themeStrings = await fetch(url)
        .then(res => res.text())
        .then(str => str.split('\n').map(line => line.trim()));

    return themeStrings;
}

// return the tags string if present, else ""
// setThemes is inside buildGallery because I couldn't add it to html directly 
function getTags(themeObj) {
    const localStorageKey = JSON.stringify(themeObj).trim();
    return localStorage[localStorageKey] || "";
}

// Use really high integer so themes without proper parsing only appear at end
function resetAllFlexOrders() {
    document.querySelectorAll('.card[data-theme-creation-index]').forEach(themeCard => {
        themeCard.style.order = Number.MAX_SAFE_INTEGER;
    });
}

function searchThemesByText(searchQuery="") {
    resetAllFlexOrders();
    searchQuery = searchQuery.trim().toLowerCase();
    
    // Empty search means show all themes
    if (searchQuery === "") {
        document.querySelectorAll('.card[data-theme-creation-index]').forEach(themeCard => {
            themeCard.classList.remove('d-none');
        })
        return;
    }

    const matchingThemeCreationIndices = [];

    // Get theme creation indices of themes matching the search query
    // Also, hide all the themes in the process
    document.querySelectorAll('.card[data-theme-creation-index]').forEach(themeCard => {
        const themeName = themeCard.querySelector('.theme-name').textContent.toLowerCase();
        const themeAuthor = themeCard.querySelector('.theme-author').textContent.toLowerCase();
        const themeTags = themeCard.querySelector('.tags').value.toLowerCase();
        if ([themeName, themeAuthor, themeTags].some(val => val.includes(searchQuery))) {
            matchingThemeCreationIndices.push(themeCard.getAttribute('data-theme-creation-index'));
        }

        // Hide theme
        themeCard.classList.add('d-none');
    })

    // Unhide themes matching the search query
    for (const themeCreationIndex of matchingThemeCreationIndices) {
        const themeCard = document.querySelector(`.card[data-theme-creation-index="${themeCreationIndex}"]`);
        themeCard.classList.remove('d-none');
    }
}

function searchThemesByColor(clr) {
    resetAllFlexOrders();
    const searchColor = new Color(clr);

    // Clear text search box
    document.getElementById('text-searchbar').value = "";

    // Unhide all themes and order by smallest to largest color difference
    document.querySelectorAll('.card[data-theme-creation-index]').forEach(themeCard => {
        themeCard.classList.remove('d-none');

        const themeCreationIndex = themeCard.getAttribute('data-theme-creation-index');
        const themeBgColor = HOISTED.bgColorLookup[themeCreationIndex];
        const colorDiff = searchColor.deltaE(themeBgColor, "76");
        themeCard.style.order = Math.round(colorDiff);
    });
}

function makeThemeCard(themeObj, themeCreationIndex) {
    const _ = escapeHtml;

    // getHex auto-escapes html
    const getHex = (colorName) => _(themeObj.config.themeColor.table[ colorNameToIndex[colorName] ]);
    const sharedBarrelAttrs = ` width="35" height="20" fill="${getHex('grey')}" `;
    const themeName = _(themeObj.themeDetails.name);
    const themeAuthor = _(themeObj.themeDetails.author)
    
    // height=200 on svg fixes the bottom cutoff error. Tiger dealt with it differently.
    // Text x-value changed to center it here
    // Moved background color to card itself to avoid overflow issues
    // Shifted everything 10 left to make it better centered
    // xmlns and version + width=100% allow safari rendering
    const themePreviewSvg = `
        <svg class="theme-preview rounded" height="200" width="100%" style="stroke: ${getHex('black')};" 
            xmlns="http://www.w3.org/2000/svg" version="1.1"
        >
            <rect class="barrelsAndRocks" x="40" y="40" rx="5" ry="5" ${sharedBarrelAttrs} />
            <circle class="blueTeam" cx="40" cy="50" r="20" fill="${getHex('blue')}" />
            
            <rect class="barrelsAndRocks" x="205" y="40" rx="5" ry="5" ${sharedBarrelAttrs} "/>
            <circle class="greenTeam" cx="240" cy="50" r="20" fill="${getHex('green')}" />
            
            <rect class="barrelsAndRocks" x="205" y="140" rx="5" ry="5" ${sharedBarrelAttrs} />
            <circle class="magentaTeam" cx="240" cy="150" r="20" fill="${getHex('magenta')}" />
            
            <rect class="barrelsAndRocks" x="40" y="140" rx="5" ry="5" ${sharedBarrelAttrs} />
            <circle class="redTeam" cx="40" cy="150" r="20" fill="${getHex('red')}" />
            
            <polygon class="triangle" points="55.5,100  90,80  90,120" fill="${getHex('orange')}" />
            
            <polygon class="square" points="220.5,85 220.5,115 190.5,115 190.5,85" fill="${getHex('gold')}" />
            
            <polygon class="pentagon" points="128,113  120.6,90.2  140,76.1  159.4,90.2  152,113" fill="${getHex('purple')}" />
            
            <polygon class="rock barrelsAndRocks" fill="${getHex('grey')}" points="132.1,53.7  121.15,42.75  121.15,27.25  132.1,16.3  147.6,16.1  158.55,27.25  158.55,42.75  147.6,53.7"/>
            
            <polygon class="crasher" points="140,130 130,147.32 150,147.32" fill="${getHex('pink')}" />
            
            <text x="83" y="180" class="gameText" fill="${getHex('guiwhite')}" >Your Name</text>
        </svg>
    `;

    return `
        <div class="card shadow-lg rounded text-center card border-light pb-2"
            style="background-color: ${getHex('white')} !important;"
            data-theme-creation-index="${themeCreationIndex}"
        >
            <div class="theme-preview-container d-flex justify-content-center" 
                style="background-color: ${getHex('white')};" 
            >
                ${themePreviewSvg}
            </div>
            <div class="card-body rounded d-flex flex-column justify-content-evenly
                        bg-dark border border-light text-light"
                style="color: ${getHex('guiwhite')};"
            >
                <h5 class="card-title theme-name">${themeName}</h5>
                <p class="card-text theme-author">by: ${themeAuthor}</p>

                <!-- Tags -->
                <div class="input-group input-group-sm mb-3 border-secondary">
                    <span class="input-group-text bg-secondary border-secondary">Tags:</span>
                    <input type="text" aria-label="tags" value="${getTags(themeObj)}" 
                        data-theme-creation-index="${themeCreationIndex}"
                        class="tags form-control bg-transparent text-secondary border-secondary"
                    >
                </div>
                
                <!-- Theme Codes -->
                <div class="d-flex flex-row justify-content-between">
                    <details class="m-1">
                        <summary>
                            <button type="button" class="copy-theme btn btn-sm btn-outline-warning">Copy Theme</button>
                        </summary>
                        <textarea readonly 
                            class="tiger-container mt-2 form-control bg-secondary"
                        >${_(exportThemeObj(themeObj, 'v1'))}</textarea>
                    </details>
                    <details class="m-1">
                        <summary>
                            <button type="button" class="copy-theme btn btn-sm btn-outline-info">Copy TIGER</button>
                        </summary>
                        <textarea readonly 
                            class="tiger-container mt-2 form-control bg-secondary"
                        >${_(exportThemeObj(themeObj, 'TIGER'))}</textarea>
                    </details>
                </div>
            </div>
        </div>
    `;
}

// Takes in list of theme objects
function createGalleryHtml(themeObjs) {
    /*
    themeObjs.unshift({"themeDetails":{
        "name":"Simulate JS Injection Attack",
        "author":"<script>console.log('Theme Author Attack!')</script>"
    }
    ,"config":{"themeColor":{"table": Array(20).fill("\"><script>console.log('Theme Color Attack!')</script>"),"border":0.25}}})
    */

    let html = "";
    for (let i = 0; i < themeObjs.length; i++) {
        try {
            html += makeThemeCard(themeObjs[i], i);
        }
        catch {
            console.error('Failed to make card for: ' + JSON.stringify(themeObjs[i]));
            continue;
        }
    }
    return html;
}

function buildGallery(themeObjs) {
    const galleryHtml = createGalleryHtml(themeObjs);
    document.querySelector('#gallery-container').innerHTML = galleryHtml;

    // Add setTags oninput event handlers here:
    document.querySelectorAll('.tags').forEach(tagsInput => {
        const themeCreationIndex = tagsInput.getAttribute('data-theme-creation-index');
        const localStorageKey = JSON.stringify(themeObjs[themeCreationIndex]).trim();
        tagsInput.addEventListener('input', (evt) => {
            localStorage[localStorageKey] = tagsInput.value;
        });
    });
    
    // Make copy theme buttons work
    const copyThemeButtons = document.querySelectorAll('button.copy-theme');
    const cb = new ClipboardJS(copyThemeButtons, {
        text: function(trigger) {
            return trigger.parentElement.parentElement.querySelector('textarea').value;
        }
    });
    cb.on('success', (e) => {
        window.alert('Theme copied successfully!');
    });
    cb.on('error', (e) => {
        window.alert('Error when copying theme! Please copy the theme manually by clicking the triangle next to the button.');
    });
}

async function main() {
    // list of lines, already trimmed
    let themeStrings = await getThemeStrings();
    // remove lines that don't start with correct prefixes
    themeStrings = themeStrings.filter(str => {
        if (str.startsWith('TIGER_JSON')) { return true }
        else if (str.startsWith('arras/')) { return false } // TODO figure out how to parse arras/ v1 themes later 
        else { return false }
    })

    let themeObjs = themeStrings.map(str => {
        if (str.startsWith('TIGER_JSON')) { return parseTigerThemeString(str) }
        //else if (str.startsWith('arras/')) { } // TODO: figure out how to parse arras/ themes
    })
    // Remove invalid themes
    themeObjs = themeObjs.filter(x => x !== null);
    // Remove certain theme names/authors
    themeObjs = filterBadWords(themeObjs);
    // Randomize theme order
    shuffleArray(themeObjs);

    buildGallery(themeObjs);
    makeBgColorLookup(themeObjs);
    pruneUnusedLocalStorageKeys();
}

main();