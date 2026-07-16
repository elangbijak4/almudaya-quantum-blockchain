const docx = require("docx");
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, PageBreak } = docx;

// Helper to create a placeholder frame for screenshot
function createPlaceholderBox(title) {
    return [
        new Paragraph({
            text: `Bukti: ${title}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
        }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    text: "[ TEMPATKAN SCREENSHOT DI SINI ]",
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 1500, after: 1500 } // Creates empty vertical space
                                })
                            ],
                            borders: {
                                top: { style: BorderStyle.DASHED, size: 2, color: "888888" },
                                bottom: { style: BorderStyle.DASHED, size: 2, color: "888888" },
                                left: { style: BorderStyle.DASHED, size: 2, color: "888888" },
                                right: { style: BorderStyle.DASHED, size: 2, color: "888888" }
                            },
                        })
                    ]
                })
            ]
        }),
        new Paragraph({
            text: `(Keterangan: Screenshot dari ${title.toLowerCase()} pada lingkungan purwarupa)`,
            italics: true,
            spacing: { before: 100, after: 300 }
        })
    ];
}

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                // Cover
                new Paragraph({
                    text: "EVIDENCE BOOK (BUKTI HASIL UJI)",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 2000, after: 400 }
                }),
                new Paragraph({
                    text: "Tingkat Kesiapterapan Teknologi (TKT 4 - TKT 6)",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 2000 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Nama Proyek: ", bold: true }),
                        new TextRun("Almudaya Quantum Blockchain")
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Versi: ", bold: true }),
                        new TextRun("1.0.1")
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Tanggal: ", bold: true }),
                        new TextRun("16 Juli 2026")
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 2000 }
                }),
                new Paragraph({ children: [new PageBreak()] }),

                // STR Ringkas
                new Paragraph({
                    text: "1. Ringkasan Software Test Report (STR)",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: "Seluruh pengujian fungsionalitas (Functional Testing) yang meliputi instalasi paket NPM, proses booting Node (Dependency Injection), pembangkitan kunci Dilithium (KeyGen), serta pemanggilan RPC dan rendering antarmuka dasbor telah dinyatakan LULUS (PASS) sepenuhnya tanpa cacat kritis.",
                    spacing: { after: 400 }
                }),

                // SVR Ringkas
                new Paragraph({
                    text: "2. Ringkasan System Validation Report (SVR)",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: "Validasi purwarupa telah berhasil membuktikan kelayakan keamanan kriptografi (kebal algoritma Shor) dan kompatibilitas antarmuka pengguna via standar JSON-RPC Web3. Implementasi modular mampu mengakomodasi tanda tangan pasca-kuantum berukuran masif dan melakukan state mutation secara konsisten.",
                    spacing: { after: 400 }
                }),
                new Paragraph({ children: [new PageBreak()] }),

                // Evidence Placeholder Section
                new Paragraph({
                    text: "3. Lampiran Tangkapan Layar (Evidence Screenshots)",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 }
                }),

                // Placeholders
                ...createPlaceholderBox("Instalasi NPM (npm install)"),
                ...createPlaceholderBox("Running Node (Almudaya CLI)"),
                ...createPlaceholderBox("Dashboard GUI (Web Interface)"),
                ...createPlaceholderBox("Pengelolaan Wallet (Dilithium Keypair)"),
                ...createPlaceholderBox("Pemanggilan RPC (JSON-RPC)"),
                ...createPlaceholderBox("Eksekusi Smart Contract"),
                ...createPlaceholderBox("Metrik Benchmark (Performansi & Latensi)"),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("docs/Evidence_Book_TKT.docx", buffer);
    console.log("Evidence Book Document created successfully at docs/Evidence_Book_TKT.docx");
});
