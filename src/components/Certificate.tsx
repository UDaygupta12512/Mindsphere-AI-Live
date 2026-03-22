import React from 'react';
import { Certificate } from '../types/achievement';
import jsPDF from 'jspdf';
import { Download, Share2, CheckCircle } from 'lucide-react';

interface CertificateProps {
  certificate: Certificate;
  onClose: () => void;
}

export const CertificateViewer: React.FC<CertificateProps> = ({ certificate, onClose }) => {
  const completionDate = new Date(certificate.completionDate);

  const handleDownload = () => {
    if (certificate.certificateUrl) {
      const link = document.createElement('a');
      link.href = certificate.certificateUrl;
      link.download = `Certificate-${certificate.courseTitle.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback: generate a simple certificate PDF on the client.
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const width = doc.internal.pageSize.getWidth();

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(4);
    doc.rect(30, 30, width - 60, 535);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.text('Certificate of Completion', width / 2, 140, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('This is proudly presented to', width / 2, 200, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.text(certificate.userName, width / 2, 250, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('for successfully completing the course', width / 2, 290, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(certificate.courseTitle, width / 2, 335, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(`Issued on: ${completionDate.toLocaleDateString()}`, width / 2, 390, { align: 'center' });
    doc.text(`Verification Code: ${certificate.verificationCode}`, width / 2, 415, { align: 'center' });
    doc.text(`Issued by ${certificate.issuedBy}`, width / 2, 440, { align: 'center' });

    doc.save(`Certificate-${certificate.courseTitle.replace(/\s+/g, '-')}.pdf`);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `My Certificate: ${certificate.courseTitle}`,
          text: `I completed the course "${certificate.courseTitle}" on ${completionDate.toLocaleDateString()}!`,
          url: window.location.href,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Certificate of Completion</h2>
            <p className="text-gray-600 mt-2">This certificate is proudly presented to</p>
            <h3 className="text-2xl font-semibold text-indigo-700 my-2">{certificate.userName}</h3>
            <p className="text-gray-600">
              for successfully completing the course
            </p>
            <h4 className="text-xl font-medium text-gray-800 mt-2">{certificate.courseTitle}</h4>
            <div className="mt-4 text-sm text-gray-500">
              <p>Issued on: {completionDate.toLocaleDateString()}</p>
              <p>Verification Code: {certificate.verificationCode}</p>
              <p className="mt-2 text-xs text-gray-400">
                Issued by {certificate.issuedBy}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
