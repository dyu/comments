
// from gwt JsonUtils
const out = [
    "\\u0000", "\\u0001", "\\u0002", "\\u0003", "\\u0004", "\\u0005",
    "\\u0006", "\\u0007", "\\b", "\\t", "\\n", "\\u000B",
    "\\f", "\\r", "\\u000E", "\\u000F", "\\u0010", "\\u0011",
    "\\u0012", "\\u0013", "\\u0014", "\\u0015", "\\u0016", "\\u0017",
    "\\u0018", "\\u0019", "\\u001A", "\\u001B", "\\u001C", "\\u001D",
    "\\u001E", "\\u001F"
];
out[34] = '\\"';
out[92] = '\\\\';
out[0xad] = '\\u00ad'; // Soft hyphen
out[0x600] = '\\u0600'; // Arabic number sign
out[0x601] = '\\u0601'; // Arabic sign sanah
out[0x602] = '\\u0602'; // Arabic footnote marker
out[0x603] = '\\u0603'; // Arabic sign safha
out[0x6dd] = '\\u06dd'; // Arabic and of ayah
out[0x70f] = '\\u070f'; // Syriac abbreviation mark
out[0x17b4] = '\\u17b4'; // Khmer vowel inherent aq
out[0x17b5] = '\\u17b5'; // Khmer vowel inherent aa
out[0x200b] = '\\u200b'; // Zero width space
out[0x200c] = '\\u200c'; // Zero width non-joiner
out[0x200d] = '\\u200d'; // Zero width joiner
out[0x200e] = '\\u200e'; // Left-to-right mark
out[0x200f] = '\\u200f'; // Right-to-left mark
out[0x2028] = '\\u2028'; // Line separator
out[0x2029] = '\\u2029'; // Paragraph separator
out[0x202a] = '\\u202a'; // Left-to-right embedding
out[0x202b] = '\\u202b'; // Right-to-left embedding
out[0x202c] = '\\u202c'; // Pop directional formatting
out[0x202d] = '\\u202d'; // Left-to-right override
out[0x202e] = '\\u202e'; // Right-to-left override
out[0x2060] = '\\u2060'; // Word joiner
out[0x2061] = '\\u2061'; // Function application
out[0x2062] = '\\u2062'; // Invisible times
out[0x2063] = '\\u2063'; // Invisible separator
out[0x2064] = '\\u2064'; // Invisible plus
out[0x206a] = '\\u206a'; // Inhibit symmetric swapping
out[0x206b] = '\\u206b'; // Activate symmetric swapping
out[0x206c] = '\\u206c'; // Inherent Arabic form shaping
out[0x206d] = '\\u206d'; // Activate Arabic form shaping
out[0x206e] = '\\u206e'; // National digit shapes
out[0x206f] = '\\u206f'; // Nominal digit shapes
out[0xfeff] = '\\ufeff'; // Zero width no-break space
out[0xfff9] = '\\ufff9'; // Intralinear annotation anchor
out[0xfffa] = '\\ufffa'; // Intralinear annotation separator
out[0xfffb] = '\\ufffb'; // Intralinear annotation terminator

const regexEscape = /[\x00-\x1f\xad\u0600-\u0603\u06dd\u070f\u17b4\u17b5\u200b-\u200f\u2028-\u202e\u2060-\u2064\u206a-\u206f\ufeff\ufff9-\ufffb"\\]/g;

export function escapeChar(c) {
    return out[c.charCodeAt(0)] || c;
}

export function escape(str) {
    return str.replace(regexEscape, escapeChar);
}