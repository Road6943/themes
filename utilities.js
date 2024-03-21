function HOISTED(){};
HOISTED.bgColorLookup = {};

const colorNames = ["teal","lgreen","orange","yellow","lavender","pink","vlgrey","lgrey","guiwhite","black","blue","green","red","gold","purple","magenta","grey","dgrey","white","guiblack"];
const colorNameToIndex = {};
for (let i = 0; i < colorNames.length; i++) { 
    colorNameToIndex[colorNames[i]] = i; 
}

function exportThemeObj(themeObj, format) {
    if (format === 'v1') {
        return convertTigerObjToV1Str(themeObj);
    }
    else if (format === 'TIGER') {
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

// To save storage space, delete unused localStorage keys
function pruneUnusedLocalStorageKeys() {
    for (const key in localStorage) {
        if (localStorage.getItem(key)?.trim() === "") {
            localStorage.removeItem(key);
        }
    }
}

// Make a hash of theme-creation-index => Color.js obj
//  to make it faster to calculate color differences
function makeBgColorLookup(themeObjs) {
    for (let themeCreationIdx = 0; themeCreationIdx < themeObjs.length; themeCreationIdx++) {
        const tcTable = themeObjs[themeCreationIdx].config.themeColor.table;
        const bgColor = tcTable[ colorNameToIndex["white"] ];
        try {
            HOISTED.bgColorLookup[themeCreationIdx] = new Color(bgColor);
        } catch {
            // This previously happened when discord channel #1c interfered with colors starting with #1c
            //  and "<#channelId>" replaced #1c in the colors
            //  I modified scraper discord bot to have customizable replacements to replace anything like this in the future
            console.log('Could not parse color from: ' + bgColor);
        }
    }
}

function filterBadWords(themeObjs) {
    return themeObjs.filter(themeObj => {
        const { name, author } = themeObj.themeDetails;
        // Add to this list as you go
        // 'ass' needs space to not filter out 'classic'
        // 'pee' needs space to not filter out 'speed'
        const wordsToFilterOut = ['sex', ' ass', 'pussy', 'bbc', 'tits', 'poop', 'coochie', ' pee'];
        for (const wordToFilterOut of wordsToFilterOut) {
            if (name.toLowerCase().includes(wordToFilterOut) || author.toLowerCase().includes(wordToFilterOut)) {
                return false;
            }
            // Not even worth trying to filter all of these out
            if (author.toLowerCase().trim() === 'reaper') {
                return false;
            }
        }
        return true;
    })
}


// EXPORT TO V1 START

function convertTigerObjToV1Str(tigerThemeObj) {
	let newThemeObj = tigerThemeObjToArrasThemeObj(tigerThemeObj);
	let newThemeStr = arrasThemeObjToStringInFormatV1(newThemeObj);
	return newThemeStr;
}

// Modified from CX at https://codepen.io/road-to-100k/pen/WNWoPoY
// original function: parsers.tiger
// modified to not parse TIGER_JSON string and instead just take obj Tiger uses directly
function tigerThemeObjToArrasThemeObj(tigerThemeObj) {
	let {
	themeDetails: { name, author },
	config: {
		graphical: { darkBorders, neon },
		themeColor: { table, border },
	},
	} = tigerThemeObj;

	table = table.map(colorHex => typeof colorHex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(colorHex) ? 0 : parseInt(colorHex.slice(1), 16))

	table[4] = table[0]
	table[7] = table[16]

	let blend = Math.min(1, Math.max(0, border))

	return {
	name: (name || '').trim().slice(0, 40) || 'Unknown Theme',
	author: (author || '').trim().slice(0, 40),
	table,
	specialTable: [table[neon ? 18 : 9]],
	blend: darkBorders ? 1 : blend,
	neon,
	}
};

// lifted straight from CX - https://codepen.io/road-to-100k/pen/WNWoPoY
// original function named stringifiers.v1
function arrasThemeObjToStringInFormatV1(theme) {
	let { name, author, table, specialTable, blend, neon } = theme
	
	let string = '\x6a\xba\xda\xb3\xf0'
	string += String.fromCharCode(1)
	string += String.fromCharCode(name.length) + name
	string += String.fromCharCode(author.length) + author
	string += String.fromCharCode(table.length)
	for (let color of table) string += String.fromCharCode(color >> 16, (color >> 8) & 0xff, color & 0xff)
	string += String.fromCharCode(specialTable.length)
	for (let color of specialTable) string += String.fromCharCode(color >> 16, (color >> 8) & 0xff, color & 0xff)
	string += String.fromCharCode(blend >= 1 ? 255 : blend < 0 ? 0 : Math.floor(blend * 0x100))
	string += String.fromCharCode(neon ? 1 : 0)
	return btoa(string).replace(/=+/, '')
};

// EXPORT TO V1 END