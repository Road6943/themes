const colorNames = ["teal","lgreen","orange","yellow","lavender","pink","vlgrey","lgrey","guiwhite","black","blue","green","red","gold","purple","magenta","grey","dgrey","white","guiblack"];
const colorNameToIndex = {};
for (let i = 0; i < colorNames.length; i++) { 
    colorNameToIndex[colorNames[i]] = i; 
}

function exportThemeObj(themeObj, format) {
    if (format === 'TIGER') {
        return 'TIGER_JSON' + JSON.stringify(themeObj);
    }
    else if (format === 'normal') {
        let normalTheme = {
            name: themeObj.themeDetails.name,
            author: themeObj.themeDetails.author,
            content: {
                paletteSize: 10,
                border: themeObj.config.themeColor.border,
            },
        };

        for (let colorName of colorNames) {
            let tcTable = themeObj.config.themeColor.table;
            let colorIndex = colorNameToIndex[colorName];
            normalTheme.content[colorName] = tcTable[colorIndex];
        }

        return JSON.stringify(normalTheme);
    } 
    else {
        console.error(format + ' is not a valid stringify format!');
    }
}


// Takes in a string and attempts to parse into a JS object
// Returns object if successful, null otherwise
function parseTigerThemeString(str="") {
    const prefix = 'TIGER_JSON'
    // Remove TIGER_JSON from string start and attempt to parse it
    const jsonStr = str.trim().substring(prefix.length);

    // Ignore empty spaces
    if (jsonStr === "") return null;

    try {
        return JSON.parse(jsonStr);
    } catch {
        // A few themes have spacing issues with numbers, so 1.114 appears as "1 .  114"
        // Fix this by removing all spaces from theme and trying again
        try {
            return JSON.parse(jsonStr.replaceAll(" ", ""));
        } catch {
            console.error('Failed to parse: ' + str);
            return null;
        }
    }
}

// https://stackoverflow.com/a/12646864
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// https://github.com/component/escape-html
var matchHtmlRegExp = /["'&<>]/
function escapeHtml (string) {
    var str = '' + string
    var match = matchHtmlRegExp.exec(str)

    if (!match) {
        return str
    }

    var escape
    var html = ''
    var index = 0
    var lastIndex = 0

    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
        case 34: // "
            escape = '&quot;'
            break
        case 38: // &
            escape = '&amp;'
            break
        case 39: // '
            escape = '&#39;'
            break
        case 60: // <
            escape = '&lt;'
            break
        case 62: // >
            escape = '&gt;'
            break
        default:
            continue
        }

        if (lastIndex !== index) {
        html += str.substring(lastIndex, index)
        }

        lastIndex = index + 1
        html += escape
    }

    return lastIndex !== index
        ? html + str.substring(lastIndex, index)
        : html
}