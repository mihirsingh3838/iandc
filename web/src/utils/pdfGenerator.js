import jsPDF from 'jspdf';

// Helper function to load image from URL
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Helper function to add image to PDF
const addImageToPDF = async (doc, imageUrl, x, y, maxWidth, maxHeight) => {
  try {
    const img = await loadImage(imageUrl);
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    // Calculate dimensions to fit within maxWidth and maxHeight while maintaining aspect ratio
    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    const width = imgWidth * ratio;
    const height = imgHeight * ratio;
    
    doc.addImage(imageUrl, 'JPEG', x, y, width, height);
    return height;
  } catch (error) {
    console.error('Error adding image to PDF:', error);
    doc.text('Image could not be loaded', x, y);
    return 20;
  }
};

// Generate PDF report
export const generatePDFReport = async (submissionData, facilityName, submitterName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPos = margin;
  const lineHeight = 7;
  const sectionSpacing = 10;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Site Installation Report', margin, yPos);
  yPos += lineHeight + 5;

  // Site Name
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Site Name:', margin, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(facilityName || submissionData.facilityId || 'N/A', margin + 40, yPos);
  yPos += lineHeight + 3;

  // Submitted By
  doc.setFont(undefined, 'bold');
  doc.text('Submitted By:', margin, yPos);
  doc.setFont(undefined, 'normal');
  doc.text(submitterName || 'Unknown', margin + 40, yPos);
  yPos += lineHeight + 3;

  // Submission Date
  if (submissionData.submittedAt) {
    doc.setFont(undefined, 'bold');
    doc.text('Submission Date:', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(new Date(submissionData.submittedAt).toLocaleString(), margin + 40, yPos);
    yPos += lineHeight + 3;
  }

  yPos += sectionSpacing;

  // Customer End Section
  const customerEnd = submissionData.customerEnd;
  if (customerEnd) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CUSTOMER END DETAILS', margin, yPos);
    yPos += lineHeight + sectionSpacing;

    // Router Details
    if (customerEnd.router) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Router Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Type: ${customerEnd.router.routerType || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight;
      doc.text(`Serial Number: ${customerEnd.router.serialNumber || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight + 3;

      // Router Images
      if (customerEnd.router.images?.routerImages?.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Router Images:', margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        for (const imageUrl of customerEnd.router.images.routerImages) {
          checkPageBreak(60);
          const imgHeight = await addImageToPDF(doc, imageUrl, margin + 5, yPos, maxWidth - 10, 50);
          yPos += imgHeight + 3;
        }
      }

      // Cable Connectivity Images
      if (customerEnd.router.images?.cableConnectivityImages?.length > 0) {
        checkPageBreak(30);
        doc.setFont(undefined, 'bold');
        doc.text('Cable Connectivity Images:', margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        for (const imageUrl of customerEnd.router.images.cableConnectivityImages) {
          checkPageBreak(60);
          const imgHeight = await addImageToPDF(doc, imageUrl, margin + 5, yPos, maxWidth - 10, 50);
          yPos += imgHeight + 3;
        }
      }
      yPos += sectionSpacing;
    }

    // Radio Details
    if (customerEnd.radio) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Radio Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Type: ${customerEnd.radio.radioType || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight;
      doc.text(`Serial Number: ${customerEnd.radio.serialNumber || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight;
      if (customerEnd.radio.lanCableReading) {
        doc.text(
          `LAN Cable Reading: ${customerEnd.radio.lanCableReading.start || 'N/A'} - ${customerEnd.radio.lanCableReading.end || 'N/A'}`,
          margin + 5,
          yPos
        );
        yPos += lineHeight;
      }
      yPos += 3;

      // Radio Images
      if (customerEnd.radio.images?.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Images:', margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        for (const imageUrl of customerEnd.radio.images) {
          checkPageBreak(60);
          const imgHeight = await addImageToPDF(doc, imageUrl, margin + 5, yPos, maxWidth - 10, 50);
          yPos += imgHeight + 3;
        }
      }
      yPos += sectionSpacing;
    }

    // IT Racks
    if (customerEnd.itRacks?.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('IT Rack Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      for (const rack of customerEnd.itRacks) {
        checkPageBreak(40);
        doc.setFont(undefined, 'bold');
        doc.text(`Rack ${rack.rackNumber}:`, margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        doc.text(`Type: ${rack.rackType || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Floor: ${rack.floor || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Location: ${rack.location || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight + 3;

        // Rack Images
        if (rack.images?.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.text('Images:', margin + 10, yPos);
          yPos += lineHeight;
          doc.setFont(undefined, 'normal');
          
          for (const imageUrl of rack.images) {
            checkPageBreak(60);
            const imgHeight = await addImageToPDF(doc, imageUrl, margin + 10, yPos, maxWidth - 15, 50);
            yPos += imgHeight + 3;
          }
        }
        yPos += sectionSpacing;
      }
    }

    // APs
    if (customerEnd.aps?.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('AP Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      for (const ap of customerEnd.aps) {
        checkPageBreak(50);
        doc.setFont(undefined, 'bold');
        doc.text(`AP ${ap.apNumber}:`, margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        doc.text(`Make: ${ap.make || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Model: ${ap.model || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Serial Number: ${ap.serialNumber || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Floor: ${ap.floor || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        if (ap.lanCableReading) {
          doc.text(
            `LAN Cable Reading: ${ap.lanCableReading.start || 'N/A'} - ${ap.lanCableReading.end || 'N/A'}`,
            margin + 10,
            yPos
          );
          yPos += lineHeight;
        }
        yPos += 3;

        // AP Images
        if (ap.images?.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.text('Images:', margin + 10, yPos);
          yPos += lineHeight;
          doc.setFont(undefined, 'normal');
          
          for (const imageUrl of ap.images) {
            checkPageBreak(60);
            const imgHeight = await addImageToPDF(doc, imageUrl, margin + 10, yPos, maxWidth - 15, 50);
            yPos += imgHeight + 3;
          }
        }
        yPos += sectionSpacing;
      }
    }

    // POE Switches
    if (customerEnd.poeSwitches?.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('POE Switch Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      for (const poe of customerEnd.poeSwitches) {
        checkPageBreak(50);
        doc.setFont(undefined, 'bold');
        doc.text(`POE Switch ${poe.poeNumber}:`, margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        doc.text(`Make: ${poe.make || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Model: ${poe.model || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Serial Number: ${poe.serialNumber || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`IT Rack: ${poe.itRackNumber || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Location: ${poe.location || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight + 3;

        // POE Images
        if (poe.images?.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.text('Images:', margin + 10, yPos);
          yPos += lineHeight;
          doc.setFont(undefined, 'normal');
          
          for (const imageUrl of poe.images) {
            checkPageBreak(60);
            const imgHeight = await addImageToPDF(doc, imageUrl, margin + 10, yPos, maxWidth - 15, 50);
            yPos += imgHeight + 3;
          }
        }
        yPos += sectionSpacing;
      }
    }

    // Desktop Switches
    if (customerEnd.desktopSwitches?.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Desktop Switch Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      for (const desktop of customerEnd.desktopSwitches) {
        checkPageBreak(50);
        doc.setFont(undefined, 'bold');
        doc.text(`Desktop Switch ${desktop.desktopNumber}:`, margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        doc.text(`Make: ${desktop.make || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Model: ${desktop.model || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Serial Number: ${desktop.serialNumber || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`IT Rack: ${desktop.itRackNumber || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight;
        doc.text(`Location: ${desktop.location || 'N/A'}`, margin + 10, yPos);
        yPos += lineHeight + 3;

        // Desktop Switch Images
        if (desktop.images?.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.text('Images:', margin + 10, yPos);
          yPos += lineHeight;
          doc.setFont(undefined, 'normal');
          
          for (const imageUrl of desktop.images) {
            checkPageBreak(60);
            const imgHeight = await addImageToPDF(doc, imageUrl, margin + 10, yPos, maxWidth - 15, 50);
            yPos += imgHeight + 3;
          }
        }
        yPos += sectionSpacing;
      }
    }
  }

  // Tower End Section
  const towerEnd = submissionData.towerEnd;
  if (towerEnd) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOWER END DETAILS', margin, yPos);
    yPos += lineHeight + sectionSpacing;

    // Tower Router Details
    if (towerEnd.router) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Router Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Type: ${towerEnd.router.routerType || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight;
      doc.text(`Serial Number: ${towerEnd.router.serialNumber || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight + 3;

      // Tower Router Images
      if (towerEnd.router.images?.routerImages?.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Router Images:', margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        for (const imageUrl of towerEnd.router.images.routerImages) {
          checkPageBreak(60);
          const imgHeight = await addImageToPDF(doc, imageUrl, margin + 5, yPos, maxWidth - 10, 50);
          yPos += imgHeight + 3;
        }
      }

      // Tower Cable Connectivity Images
      if (towerEnd.router.images?.cableConnectivityImages?.length > 0) {
        checkPageBreak(30);
        doc.setFont(undefined, 'bold');
        doc.text('Cable Connectivity Images:', margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        for (const imageUrl of towerEnd.router.images.cableConnectivityImages) {
          checkPageBreak(60);
          const imgHeight = await addImageToPDF(doc, imageUrl, margin + 5, yPos, maxWidth - 10, 50);
          yPos += imgHeight + 3;
        }
      }
      yPos += sectionSpacing;
    }

    // Tower Radio Details
    if (towerEnd.radio) {
      checkPageBreak(30);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Radio Details', margin, yPos);
      yPos += lineHeight;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Type: ${towerEnd.radio.radioType || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight;
      doc.text(`Serial Number: ${towerEnd.radio.serialNumber || 'N/A'}`, margin + 5, yPos);
      yPos += lineHeight;
      if (towerEnd.radio.lanCableReading) {
        doc.text(
          `LAN Cable Reading: ${towerEnd.radio.lanCableReading.start || 'N/A'} - ${towerEnd.radio.lanCableReading.end || 'N/A'}`,
          margin + 5,
          yPos
        );
        yPos += lineHeight;
      }
      yPos += 3;

      // Tower Radio Images
      if (towerEnd.radio.images?.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text('Images:', margin + 5, yPos);
        yPos += lineHeight;
        doc.setFont(undefined, 'normal');
        
        for (const imageUrl of towerEnd.radio.images) {
          checkPageBreak(60);
          const imgHeight = await addImageToPDF(doc, imageUrl, margin + 5, yPos, maxWidth - 10, 50);
          yPos += imgHeight + 3;
        }
      }
    }
  }

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Site_Installation_Report_${facilityName || submissionData.facilityId || 'Unknown'}_${timestamp}.pdf`;

  // Save PDF
  doc.save(filename);
};

