/**
 * Carbon Report Export Utilities
 * Generate PDF and CSV reports for carbon footprint analysis
 */

import { format } from 'date-fns';

export class CarbonReportExporter {
  static generateCSVReport(carbonData, timeframe) {
    const headers = [
      'Date',
      'Transaction ID',
      'Merchant',
      'Category',
      'Amount (USD)',
      'Emissions (kg CO2e)',
      'Confidence (%)',
      'Description'
    ];

    const rows = carbonData.analysis.transactionAnalysis.map((analysis, index) => {
      const transaction = carbonData.summary.transactions?.[index] || {};
      return [
        transaction.date || new Date().toISOString().split('T')[0],
        analysis.transactionId || '',
        transaction.merchant || '',
        transaction.category || '',
        transaction.amount || 0,
        analysis.estimatedEmissions || 0,
        analysis.confidence || 0,
        transaction.description || ''
      ];
    });

    // Add summary row
    rows.unshift(['=== SUMMARY ===']);
    rows.unshift([
      'Total Transactions',
      carbonData.summary.totalTransactions || 0,
      '',
      '',
      `$${carbonData.summary.totalAmount || 0}`,
      `${carbonData.analysis.totalEmissions || 0} kg CO2e`,
      '',
      `Analysis for ${timeframe}`
    ]);
    rows.unshift([]);

    // Add category breakdown
    rows.push([]);
    rows.push(['=== CATEGORY BREAKDOWN ===']);
    carbonData.analysis.emissionsByCategory.forEach(category => {
      rows.push([
        '',
        category.category,
        '',
        '',
        '',
        `${category.emissions.toFixed(2)} kg CO2e`,
        `${category.percentage}%`,
        category.description || ''
      ]);
    });

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map(row => row.map(field =>
        typeof field === 'string' && field.includes(',')
          ? `"${field}"`
          : field
      ).join(','))
      .join('\n');

    return csvContent;
  }

  static generateJSONReport(carbonData, userInfo = {}) {
    return JSON.stringify({
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        reportType: 'carbon_footprint_analysis',
        version: '1.0',
        user: userInfo
      },
      summary: carbonData.summary,
      analysis: carbonData.analysis,
      recommendations: {
        offsetRecommendations: carbonData.analysis.offsetRecommendations,
        greenAlternatives: carbonData.analysis.greenAlternatives,
        insights: carbonData.analysis.insights
      },
      calculations: {
        methodology: carbonData.metadata?.analysisMethod || 'AI-enhanced',
        dataQuality: carbonData.metadata?.dataQuality || 'medium',
        lastUpdated: carbonData.metadata?.lastUpdated || new Date().toISOString()
      }
    }, null, 2);
  }

  static async downloadCSV(carbonData, filename = null) {
    const csvContent = this.generateCSVReport(carbonData, 'month');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `carbon_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async downloadJSON(carbonData, userInfo = {}, filename = null) {
    const jsonContent = this.generateJSONReport(carbonData, userInfo);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `carbon_analysis_${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static generatePDFContent(carbonData, userInfo = {}) {
    // PDF content as HTML that can be converted to PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Carbon Footprint Report</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #10B981;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #10B981;
                margin-bottom: 10px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .summary-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #10B981;
            }
            .summary-card h3 {
                margin: 0 0 10px 0;
                color: #10B981;
                font-size: 14px;
                text-transform: uppercase;
            }
            .summary-card .value {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
            }
            .section {
                margin: 30px 0;
            }
            .section h2 {
                color: #1f2937;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 10px;
            }
            .transaction-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .transaction-table th,
            .transaction-table td {
                border: 1px solid #e5e7eb;
                padding: 12px;
                text-align: left;
            }
            .transaction-table th {
                background-color: #f9fafb;
                font-weight: bold;
                color: #374151;
            }
            .category-breakdown {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .category-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
            }
            .recommendations {
                background: #f0fdf4;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .recommendations h3 {
                color: #065f46;
                margin-top: 0;
            }
            .recommendations ul {
                color: #047857;
            }
            .offset-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 20px 0;
            }
            .offset-card {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 15px;
                background: white;
            }
            .offset-card h4 {
                color: #10B981;
                margin: 0 0 10px 0;
            }
            .offset-price {
                font-size: 18px;
                font-weight: bold;
                color: #059669;
            }
            .footer {
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
                margin-top: 40px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            @media print {
                body { margin: 0; }
                .header { break-after: avoid; }
                .section { break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🌱 Carbon Impact Report</div>
            <h1>Personal Carbon Footprint Analysis</h1>
            <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
            ${userInfo.name ? `<p>For: ${userInfo.name}</p>` : ''}
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Emissions</h3>
                <div class="value">${carbonData.analysis.totalEmissions.toFixed(2)} kg</div>
                <small>CO₂ equivalent</small>
            </div>
            <div class="summary-card">
                <h3>Transactions Analyzed</h3>
                <div class="value">${carbonData.summary.totalTransactions}</div>
                <small>Financial transactions</small>
            </div>
            <div class="summary-card">
                <h3>Total Spending</h3>
                <div class="value">$${carbonData.summary.totalAmount.toLocaleString()}</div>
                <small>Analyzed amount</small>
            </div>
            <div class="summary-card">
                <h3>Emissions per Dollar</h3>
                <div class="value">${carbonData.summary.averageEmissionPerDollar.toFixed(3)} kg</div>
                <small>CO₂e per USD spent</small>
            </div>
        </div>

        <div class="section">
            <h2>🏷️ Emissions by Category</h2>
            <div class="category-breakdown">
                ${carbonData.analysis.emissionsByCategory.map(category => `
                    <div class="category-item">
                        <div>
                            <strong>${category.category}</strong><br>
                            <small>${category.description}</small>
                        </div>
                        <div style="text-align: right;">
                            <strong>${category.emissions.toFixed(2)} kg CO₂e</strong><br>
                            <small>${category.percentage}%</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>💳 Transaction Analysis</h2>
            <table class="transaction-table">
                <thead>
                    <tr>
                        <th>Merchant</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Emissions</th>
                        <th>Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    ${carbonData.analysis.transactionAnalysis.slice(0, 10).map(analysis => {
                      const transaction = carbonData.summary.transactions?.find(t => t.id === analysis.transactionId) || {};
                      return `
                        <tr>
                            <td>${transaction.merchant || 'Unknown'}</td>
                            <td>${transaction.category || 'N/A'}</td>
                            <td>$${transaction.amount || 0}</td>
                            <td>${analysis.estimatedEmissions.toFixed(2)} kg CO₂e</td>
                            <td>${analysis.confidence}%</td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
            ${carbonData.analysis.transactionAnalysis.length > 10 ?
                `<p><em>Showing top 10 transactions. Full data available in CSV export.</em></p>` : ''}
        </div>

        <div class="section">
            <h2>🎯 Carbon Offset Options</h2>
            <div class="offset-options">
                ${carbonData.analysis.offsetRecommendations.map(offset => `
                    <div class="offset-card">
                        <h4>${offset.type}</h4>
                        <p>${offset.description}</p>
                        <div class="offset-price">$${offset.cost.toFixed(2)}</div>
                        <small>for ${offset.amount.toFixed(2)} tonnes CO₂e</small><br>
                        <small><strong>Provider:</strong> ${offset.provider}</small><br>
                        <small><strong>Certification:</strong> ${offset.certification}</small>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="recommendations">
            <h3>🌱 Recommendations for Reducing Your Carbon Footprint</h3>
            <ul>
                ${carbonData.analysis.insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="section">
            <h2>♻️ Green Alternatives</h2>
            ${carbonData.analysis.greenAlternatives.map(alternative => `
                <div style="margin: 15px 0; padding: 15px; background: #f0fdf4; border-radius: 8px;">
                    <h4 style="color: #065f46; margin: 0 0 10px 0;">${alternative.category}</h4>
                    <p><strong>Suggestion:</strong> ${alternative.suggestion}</p>
                    <p><strong>Potential Savings:</strong> ${alternative.potentialSavings.toFixed(2)} kg CO₂e annually</p>
                    <p><small>${alternative.description}</small></p>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>This report was generated using AI-powered carbon footprint analysis.</p>
            <p>Analysis Method: ${carbonData.metadata?.analysisMethod || 'Standard'} |
               Data Quality: ${carbonData.metadata?.dataQuality || 'Medium'}</p>
            <p>For questions about this report, please contact support.</p>
        </div>
    </body>
    </html>
    `;

    return htmlContent;
  }

  static async downloadPDF(carbonData, userInfo = {}, filename = null) {
    const htmlContent = this.generatePDFContent(carbonData, userInfo);

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 1000);
  }

  static async shareCarbonData(carbonData, platform = 'generic') {
    const totalEmissions = carbonData.analysis.totalEmissions.toFixed(2);
    const totalTransactions = carbonData.summary.totalTransactions;
    const topCategory = carbonData.analysis.emissionsByCategory[0]?.category || 'spending';

    const shareTexts = {
      generic: `I just analyzed my carbon footprint! 🌱\n\n📊 ${totalEmissions} kg CO₂e from ${totalTransactions} transactions\n🏷️ Top emission source: ${topCategory}\n\n#CarbonTracking #Sustainability #ClimateAction`,

      twitter: `I just analyzed my carbon footprint with AI! 🌱\n\n📊 ${totalEmissions} kg CO₂e from ${totalTransactions} transactions\n🏷️ Biggest impact: ${topCategory}\n\nTaking action with carbon offsets! 🌍\n\n#CarbonFootprint #ClimateAction #Sustainability`,

      linkedin: `🌱 Personal Carbon Footprint Analysis Complete\n\nI've been tracking the environmental impact of my spending using AI-powered analysis:\n\n📊 Total emissions: ${totalEmissions} kg CO₂e\n💳 Transactions analyzed: ${totalTransactions}\n🏷️ Primary emission source: ${topCategory}\n\nNext steps: Investing in verified carbon offsets and green alternatives.\n\n#Sustainability #CarbonNeutral #ClimateAction #ESG`,
    };

    const shareText = shareTexts[platform] || shareTexts.generic;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Carbon Footprint Analysis',
          text: shareText
        });
      } catch (err) {
        // Fallback to clipboard
        this.copyToClipboard(shareText);
      }
    } else {
      this.copyToClipboard(shareText);
    }
  }

  static copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Share text copied to clipboard!');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share text copied to clipboard!');
    }
  }

  static generateEmailReport(carbonData, userInfo = {}) {
    const subject = `Carbon Footprint Analysis - ${format(new Date(), 'MMM dd, yyyy')}`;
    const body = `
Hi,

I've completed my carbon footprint analysis and wanted to share the results:

📊 SUMMARY
• Total CO₂ Emissions: ${carbonData.analysis.totalEmissions.toFixed(2)} kg
• Transactions Analyzed: ${carbonData.summary.totalTransactions}
• Total Spending: $${carbonData.summary.totalAmount.toLocaleString()}
• Emissions per Dollar: ${carbonData.summary.averageEmissionPerDollar.toFixed(3)} kg CO₂e

🏷️ TOP EMISSION CATEGORIES
${carbonData.analysis.emissionsByCategory.slice(0, 3).map(cat =>
  `• ${cat.category}: ${cat.emissions.toFixed(2)} kg CO₂e (${cat.percentage}%)`
).join('\n')}

🎯 OFFSET RECOMMENDATIONS
${carbonData.analysis.offsetRecommendations.slice(0, 2).map(offset =>
  `• ${offset.type}: $${offset.cost.toFixed(2)} for ${offset.amount.toFixed(2)} tonnes`
).join('\n')}

🌱 NEXT STEPS
${carbonData.analysis.insights.recommendations.slice(0, 3).map(rec => `• ${rec}`).join('\n')}

This analysis was generated using AI-powered carbon footprint tracking.

Best regards,
${userInfo.name || 'Carbon Tracker User'}
    `.trim();

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  }
}

export default CarbonReportExporter;