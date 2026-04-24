#!/usr/bin/env node

const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const fs = require('fs');

async function generatePDFs() {
  const files = [
    'PROJECT_ROADMAP.md',
    'PRESENTATION.md',
    'TIMELINE_VISUAL.md'
  ];

  console.log('Starting PDF generation...\n');

  for (const file of files) {
    try {
      const inputPath = path.join(__dirname, file);
      const outputPath = path.join(__dirname, file.replace('.md', '.pdf'));
      const cssPath = path.join(__dirname, 'pdf-style.css');

      console.log(`Converting ${file} to PDF...`);

      const pdf = await mdToPdf(
        { path: inputPath },
        {
          dest: outputPath,
          launch_options: {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu'
            ]
          },
          pdf_options: {
            format: 'A4',
            margin: {
              top: '20mm',
              right: '20mm',
              bottom: '20mm',
              left: '20mm'
            },
            printBackground: true
          },
          stylesheet: cssPath
        }
      ).catch(error => {
        console.error(`Error converting ${file}:`, error.message);
        return null;
      });

      if (pdf && fs.existsSync(outputPath)) {
        console.log(`✓ Successfully created ${outputPath}\n`);
      } else {
        console.log(`✗ Failed to create ${outputPath}\n`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message, '\n');
    }
  }

  console.log('PDF generation complete!');
}

generatePDFs().catch(console.error);
