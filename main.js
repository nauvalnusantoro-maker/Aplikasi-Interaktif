/**
 * DEFINISI TOKEN JAVASCRIPT
 * Menggunakan Regex untuk mencocokkan setiap tipe token.
 * Urutan sangat penting: yang paling spesifik harus di atas.
 */
const TOKEN_SPEC = [
    ['COMMENT_MULTI', /^\/\*[\s\S]*?\*\//],
    ['COMMENT_SINGLE', /^\/\/.*/],
    ['STRING', /^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`(?:[^`\\]|\\.)*`/],
    ['KEYWORD', /^(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|false|finally|for|function|if|import|in|instanceof|new|null|return|super|switch|this|throw|true|try|typeof|var|void|while|with|let|static|yield|await)\b/],
    ['NUMBER', /^\d+(\.\d+)?([eE][+-]?\d+)?/],
    ['IDENTIFIER', /^[a-zA-Z_$][a-zA-Z0-9_$]*/],
    ['OPERATOR', /^(?:===|!==|==|!=|<=|>=|<|>|\+|-|\*|\/|%|\+\+|--|\|\||&&|!|=|\||&|\^|~|<<|>>|>>>|\?|:)/],
    ['FUNCTION', /^[{}()[\].,;]/],
    ['WHITESPACE', /^\s+/],
    ['UNKNOWN', /^./]
];

/**
 * CONTOH KODE JAVASCRIPT
 */
const EXAMPLES = {
    '1. Dasar (variabel & kondisi)': `let x = 10;
let y = 20;
let z = x + y;
if (z > 25) {
    console.log("besar");
} else {
    console.log("kecil");
}`,

    '2. Fungsi & Arrow Function': `function hitungNilai(nilai, bobot) {
    let grade;
    if (nilai >= 80) grade = "A";
    else if (nilai >= 70) grade = "B";
    else grade = "C";
    return nilai * bobot;
}

const nilaiAkhir = hitungNilai(85, 0.5);
console.log(nilaiAkhir);`,

    '3. Class & Objek': `class Mahasiswa {
    constructor(nama, nim) {
        this.nama = nama;
        this.nim = nim;
    }

    info() {
        return \`Nama: \${this.nama}, NIM: \${this.nim}\`;
    }
}

const mhs = new Mahasiswa("Ali", 230105005);
console.log(mhs.info());`,

    '4. Loop & Array': `const nilai = [85, 70, 90, 60, 75];
let total = 0;
for (let n of nilai) {
    total += n;
}
const rata = total / nilai.length;
console.log(rata);`
};

/**
 * FUNGSI TOKENIZER
 */
function tokenize(sourceCode) {
    let tokens = [];
    let lineNum = 1;
    let position = 0;

    while (position < sourceCode.length) {
        let match = null;
        let matchedType = null;
        let remainingStr = sourceCode.slice(position);

        for (let [type, regex] of TOKEN_SPEC) {
            match = regex.exec(remainingStr);
            if (match) {
                matchedType = type;
                break;
            }
        }

        if (match) {
            let value = match[0];

            // Abaikan Whitespace, tapi tetap hitung newline-nya
            if (matchedType !== 'WHITESPACE') {
                tokens.push({ type: matchedType, value: value, line: lineNum });
            }

            // Hitung baris baru untuk mengupdate lineNum
            let newlines = (value.match(/\n/g) || []).length;
            lineNum += newlines;

            position += value.length;
        } else {
            // Seharusnya tidak pernah terjadi karena ada UNKNOWN /^./
            position++;
        }
    }
    return tokens;
}

/**
 * GUI LOGIC & EVENT LISTENERS
 */
document.addEventListener('DOMContentLoaded', () => {
    const exampleSelect = document.getElementById('example-select');
    const sourceCode = document.getElementById('source-code');
    const btnAnalyze = document.getElementById('btn-analyze');
    const tbody = document.querySelector('#token-table tbody');
    const summaryText = document.getElementById('summary-text');

    // Populate combobox with examples
    Object.keys(EXAMPLES).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        exampleSelect.appendChild(option);
    });

    // Handle combobox change
    exampleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            sourceCode.value = '';
        } else if (EXAMPLES[val]) {
            sourceCode.value = EXAMPLES[val];
        }
    });

    // Handle analyze button click
    btnAnalyze.addEventListener('click', () => {
        const source = sourceCode.value.trim();
        if (!source) {
            alert('Source code masih kosong!\nSilakan ketik atau pilih contoh dari dropdown.');
            return;
        }

        const tokens = tokenize(source);

        // 1. Render Table
        tbody.innerHTML = '';
        if (tokens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Tidak ada token ditemukan.</td></tr>`;
        } else {
            tokens.forEach((t, i) => {
                const tr = document.createElement('tr');

                // Escape HTML untuk value
                const div = document.createElement('div');
                div.textContent = t.value;
                const safeValue = div.innerHTML;

                tr.innerHTML = `
                    <td style="text-align: center;">${i + 1}</td>
                    <td><span style="color: #60a5fa;">${t.type}</span></td>
                    <td><code>${safeValue}</code></td>
                    <td style="text-align: center;">${t.line}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        // 2. Render Summary
        const counter = {};
        tokens.forEach(t => {
            counter[t.type] = (counter[t.type] || 0) + 1;
        });

        const total = tokens.length;
        let summaryHTML = `Total token keseluruhan: ${total}\n`;
        summaryHTML += `---------------------------------------------\n`;

        if (total > 0) {
            // Sort by count descending
            const sortedCounts = Object.entries(counter).sort((a, b) => b[1] - a[1]);
            const maxCount = sortedCounts[0][1];

            sortedCounts.forEach(([type, count]) => {
                const barLen = Math.floor((count / maxCount) * 20);
                const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
                const pct = ((count / total) * 100).toFixed(1);

                // Formatting padEnd manual
                const typePadded = type.padEnd(14, ' ');
                const countPadded = count.toString().padStart(3, ' ');

                summaryHTML += `${typePadded} ${bar} ${countPadded} (${pct}%)\n`;
            });
        }

        summaryText.textContent = summaryHTML;
    });
});
