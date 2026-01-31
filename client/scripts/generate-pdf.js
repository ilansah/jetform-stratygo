import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createCodeDeontologiePdf() {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Embed fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title
    page.drawText('CODE DE DÉONTOLOGIE', {
        x: 50,
        y: height - 80,
        size: 24,
        font: boldFont,
        color: rgb(0.9, 0.22, 0.27) // Stratygo red
    });

    page.drawText('STRATYGO - Vente à Domicile', {
        x: 50,
        y: height - 110,
        size: 14,
        font: regularFont,
        color: rgb(0.29, 0.29, 0.29)
    });

    // Line separator
    page.drawLine({
        start: { x: 50, y: height - 130 },
        end: { x: width - 50, y: height - 130 },
        thickness: 2,
        color: rgb(0.9, 0.22, 0.27)
    });

    // Content
    let yPosition = height - 170;
    const lineHeight = 20;
    const paragraphSpacing = 30;

    // Préambule
    page.drawText('Préambule', {
        x: 50,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0.18, 0.18, 0.18)
    });

    yPosition -= lineHeight + 5;

    const preambuleText = [
        'Le présent code de déontologie définit les règles de bonne conduite',
        'applicables à tous les collaborateurs de STRATYGO dans le cadre de',
        'leurs activités de vente à domicile.'
    ];

    preambuleText.forEach(line => {
        page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 11,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= lineHeight;
    });

    yPosition -= paragraphSpacing;

    // Article 1
    page.drawText('Article 1 - Intégrité et Professionnalisme', {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.18, 0.18, 0.18)
    });

    yPosition -= lineHeight + 5;

    const article1Text = [
        'Chaque collaborateur s\'engage à agir avec honnêteté, intégrité et',
        'professionnalisme dans toutes ses interactions avec les clients,',
        'partenaires et collègues.'
    ];

    article1Text.forEach(line => {
        page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 11,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= lineHeight;
    });

    yPosition -= paragraphSpacing;

    // Article 2
    page.drawText('Article 2 - Confidentialité', {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.18, 0.18, 0.18)
    });

    yPosition -= lineHeight + 5;

    const article2Text = [
        'Le respect de la confidentialité des données clients est une priorité',
        'absolue. Aucune information ne doit être divulguée sans autorisation',
        'préalable et conformément au RGPD.'
    ];

    article2Text.forEach(line => {
        page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 11,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= lineHeight;
    });

    yPosition -= paragraphSpacing;

    // Article 3
    page.drawText('Article 3 - Respect des biens et des personnes', {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.18, 0.18, 0.18)
    });

    yPosition -= lineHeight + 5;

    const article3Text = [
        'Tout comportement irrespectueux, discriminant ou harcelant est',
        'strictement interdit. Le respect mutuel est la base de toute',
        'collaboration.'
    ];

    article3Text.forEach(line => {
        page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 11,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= lineHeight;
    });

    yPosition -= paragraphSpacing;

    // Article 4
    page.drawText('Article 4 - Sécurité', {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0.18, 0.18, 0.18)
    });

    yPosition -= lineHeight + 5;

    const article4Text = [
        'Les règles de sécurité, notamment lors des interventions techniques,',
        'doivent être scrupuleusement respectées pour garantir la sécurité de',
        'tous.'
    ];

    article4Text.forEach(line => {
        page.drawText(line, {
            x: 50,
            y: yPosition,
            size: 11,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= lineHeight;
    });

    yPosition -= paragraphSpacing + 20;

    // Engagement box
    page.drawRectangle({
        x: 50,
        y: yPosition - 100,
        width: width - 100,
        height: 120,
        borderColor: rgb(0.9, 0.22, 0.27),
        borderWidth: 2,
        color: rgb(0.98, 0.98, 0.98)
    });

    page.drawText('ENGAGEMENT', {
        x: 70,
        y: yPosition - 30,
        size: 12,
        font: boldFont,
        color: rgb(0.9, 0.22, 0.27)
    });

    const engagementText = [
        'En signant ce document, je reconnais avoir pris connaissance de',
        'ces règles et je m\'engage à les respecter dans le cadre de mes',
        'activités au sein de STRATYGO.'
    ];

    let engagementY = yPosition - 55;
    engagementText.forEach(line => {
        page.drawText(line, {
            x: 70,
            y: engagementY,
            size: 10,
            font: regularFont,
            color: rgb(0.2, 0.2, 0.2)
        });
        engagementY -= 18;
    });

    // Signature area
    page.drawText('Signature :', {
        x: 70,
        y: yPosition - 140,
        size: 11,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3)
    });

    page.drawLine({
        start: { x: 150, y: yPosition - 145 },
        end: { x: width - 70, y: yPosition - 145 },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
        dashArray: [3, 3]
    });

    // Footer
    page.drawText('Document officiel STRATYGO - Tous droits réservés', {
        x: 50,
        y: 30,
        size: 8,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5)
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(__dirname, '..', 'public', 'documents', 'code-deontologie.pdf');
    fs.writeFileSync(outputPath, pdfBytes);

    console.log('✅ PDF créé avec succès:', outputPath);
}

createCodeDeontologiePdf().catch(console.error);
