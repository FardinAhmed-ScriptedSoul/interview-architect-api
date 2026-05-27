const puppeteer = require('puppeteer');

async function generateResumePdf(tailoredResumeData) {
    // 🛡️ Safe fallback mapping layer
    const resume = {
        fullName: tailoredResumeData.fullName || "Candidate Name",
        email: tailoredResumeData.email || "",
        phone: tailoredResumeData.phone || "",
        location: tailoredResumeData.location || "",
        linkedin: tailoredResumeData.linkedin || "",
        github: tailoredResumeData.github || "",
        summary: tailoredResumeData.summary || "",
        skills: Array.isArray(tailoredResumeData.skills) ? tailoredResumeData.skills : [],
        experience: Array.isArray(tailoredResumeData.experience) ? tailoredResumeData.experience : [],
        education: Array.isArray(tailoredResumeData.education) ? tailoredResumeData.education : [],
        projects: Array.isArray(tailoredResumeData.projects) ? tailoredResumeData.projects : []
    };

    // 📄 Recruiter-Optimized High-Fidelity Layout Structure
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                color: #2D3748; 
                line-height: 1.45; 
                padding: 40px 50px;
                font-size: 12.5px;
                background: #FFFFFF;
                -webkit-font-smoothing: antialiased;
            }

            /* Header Section */
            .header { 
                text-align: left; 
                border-bottom: 2px solid #1A365D; 
                padding-bottom: 12px;
                margin-bottom: 16px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }
            .header-main h1 { 
                font-size: 26px; 
                font-weight: 800;
                color: #1A365D; 
                letter-spacing: -0.5px; 
                line-height: 1.1;
                margin-bottom: 4px;
            }
            .header-main .title-sub {
                font-size: 13px;
                color: #4A5568;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .contact-info { 
                text-align: right;
                color: #4A5568; 
                font-size: 11px; 
                line-height: 1.6;
            }
            .contact-info a { 
                color: #2B6CB0; 
                text-decoration: none; 
                font-weight: 500;
            }
            
            /* Section Typography */
            .section-title { 
                font-size: 13px; 
                font-weight: 700; 
                color: #1A365D;
                text-transform: uppercase; 
                background: #F7FAFC;
                padding: 4px 8px;
                margin-top: 16px; 
                margin-bottom: 8px;
                letter-spacing: 0.75px;
                border-left: 3px solid #2B6CB0;
                page-break-inside: avoid;
            }
            
            .summary-text { 
                text-align: justify; 
                color: #4A5568; 
                font-size: 12px;
                padding: 0 4px;
            }
            
            /* Items (Experience, Projects, Education) */
            .item { 
                margin-top: 10px; 
                padding: 0 4px;
                page-break-inside: avoid; 
            }
            .item:first-of-type { margin-top: 4px; }
            
            .item-header { 
                display: flex; 
                justify-content: space-between; 
                font-weight: 700; 
                color: #2D3748; 
                font-size: 12.5px; 
            }
            .item-header .company {
                color: #2B6CB0;
                font-weight: 600;
            }
            .item-sub { 
                display: flex; 
                justify-content: space-between; 
                font-style: italic; 
                color: #718096; 
                font-size: 11.5px;
                margin-bottom: 4px; 
            }
            
            /* High-Density Bullet Points */
            ul { 
                margin-top: 2px; 
                padding-left: 16px; 
                color: #4A5568; 
            }
            li { 
                margin-bottom: 3px; 
                text-align: justify; 
                font-size: 12px;
            }
            
            /* Recruiter-Friendly Inline Skills Categorization */
            .skills-text {
                font-size: 12px;
                color: #4A5568;
                padding: 0 4px;
                line-height: 1.6;
            }
            .skills-text strong {
                color: #1A365D;
            }
        </style>
    </head>
    <body>

        <div class="header">
            <div class="header-main">
                <h1>${resume.fullName}</h1>
                <div class="title-sub">Software Engineer</div>
            </div>
            <div class="contact-info">
                <div>${resume.location ? `${resume.location} &nbsp;|&nbsp; ` : ''}${resume.phone ? `${resume.phone} &nbsp;|&nbsp; ` : ''}<a href="mailto:${resume.email}">${resume.email}</a></div>
                <div>
                    ${resume.linkedin ? `<a href="${resume.linkedin}" target="_blank">LinkedIn</a>` : ''}
                    ${resume.linkedin && resume.github ? ' &nbsp;|&nbsp; ' : ''}
                    ${resume.github ? `<a href="${resume.github}" target="_blank">GitHub</a>` : ''}
                </div>
            </div>
        </div>

        <div class="section-title">Professional Summary</div>
        <p class="summary-text">${resume.summary}</p>

        <div class="section-title">Technical Skills</div>
        <div class="skills-text">
            <strong>Core Technologies:</strong> ${resume.skills.join(', ')}
        </div>

        <div class="section-title">Professional Experience</div>
        ${resume.experience.map(exp => `
            <div class="item">
                <div class="item-header">
                    <span>${exp.title}</span>
                    <span class="company">${exp.company}</span>
                </div>
                <div class="item-sub">
                    <span>Professional Core Performance Pipeline</span>
                    <span>${exp.duration}</span>
                </div>
                <ul>
                    ${Array.isArray(exp.bullets) ? exp.bullets.map(b => `<li>${b}</li>`).join('') : ''}
                </ul>
            </div>
        `).join('')}

        ${resume.projects.length > 0 ? `
        <div class="section-title">Key Projects</div>
        ${resume.projects.map(proj => `
            <div class="item">
                <div class="item-header">
                    <span>${proj.name}</span>
                    <span style="font-weight: 600; font-size: 11.5px; color: #2B6CB0;">${proj.tech}</span>
                </div>
                <ul>
                    ${Array.isArray(proj.bullets) ? proj.bullets.map(b => `<li>${b}</li>`).join('') : ''}
                </ul>
            </div>
        `).join('')}
        ` : ''}

        ${resume.education.length > 0 ? `
        <div class="section-title">Education</div>
        ${resume.education.map(edu => `
            <div class="item">
                <div class="item-header">
                    <span>${edu.institution}</span>
                    <span style="font-weight: normal; color: #4A5568;">${edu.year}</span>
                </div>
                <div class="item-sub">
                    <span>${edu.degree}</span>
                </div>
            </div>
        `).join('')}
        ` : ''}

    </body>
    </html>
    `;

    // 🚀 Execute clean compilation pipeline via Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({ 
        format: 'A4', 
        printBackground: true,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' } 
    });
    
    await browser.close();
    return pdfBuffer;
}

module.exports = generateResumePdf;