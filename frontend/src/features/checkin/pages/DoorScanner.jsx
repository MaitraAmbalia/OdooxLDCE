import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function DoorScanner() {
  const { eventId } = useParams();
  const [scanResult, setScanResult] = useState(null); // { status: 'OK' | 'WARN' | 'ERR', name: '...', message: '...' }
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize QR Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []);

  const onScanSuccess = (decodedText, decodedResult) => {
    // API endpoint: POST /events/:id/check-in ({ ticketId: decodedText })
    console.log(`Scan success: ${decodedText}`);
    
    // Simulate API call processing
    // Vibrate device
    if (navigator.vibrate) navigator.vibrate(100);

    // Mock response based on text length to show different states
    if (decodedText.length > 20) {
      setScanResult({ status: 'ERR', name: 'Unknown', message: 'Invalid ticket format' });
    } else if (decodedText.startsWith('MOCK')) {
      setScanResult({ status: 'WARN', name: 'Aarav Shah', message: 'Already checked in (10m ago)' });
    } else {
      setScanResult({ status: 'OK', name: 'Aarav Shah', message: 'Member · 1 of 2 tickets' });
    }

    // Clear overlay after 2 seconds
    setTimeout(() => {
      setScanResult(null);
    }, 2000);
  };

  const onScanFailure = (error) => {
    // handle scan failure, usually better to ignore and keep scanning
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Top Bar */}
      <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <Link to="/events" className="text-white hover:text-gray-300 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
          &larr; Exit
        </Link>
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full font-mono text-sm tracking-widest border border-white/20 shadow-lg">
          412 / 500
        </div>
        <button className="text-white hover:text-gray-300 px-2 py-1 rounded bg-black/50 backdrop-blur-sm">
          🔦 Torch
        </button>
      </div>

      {/* Scanner Viewport */}
      <div className="flex-1 relative">
        <div id="reader" className="w-full h-full object-cover"></div>
        
        {/* Full Screen Overlay for Result */}
        {scanResult && (
          <div 
            aria-live="assertive"
            className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200 ${
              scanResult.status === 'OK' ? 'bg-[var(--color-ok)]' :
              scanResult.status === 'WARN' ? 'bg-[var(--color-wait)]' :
              'bg-[var(--color-stop)]'
            }`}
          >
            <div className="text-7xl mb-6">
              {scanResult.status === 'OK' ? '✓' : scanResult.status === 'WARN' ? '!' : '✗'}
            </div>
            <h2 className="text-4xl font-display font-bold mb-2">{scanResult.status === 'OK' ? 'Checked in' : scanResult.status === 'WARN' ? 'Already checked in' : 'Invalid'}</h2>
            <p className="text-2xl font-medium mb-1">{scanResult.name}</p>
            <p className="text-lg opacity-90">{scanResult.message}</p>
            
            {scanResult.status === 'OK' && scanResult.message.includes('1 of') && (
              <button className="mt-8 px-6 py-3 bg-white text-black rounded-[6px] font-medium shadow-xl">
                Check in remaining
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="p-6 bg-black z-10 flex justify-center border-t border-white/10">
        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-[6px] font-medium transition-colors">
          Manual Search
        </button>
      </div>
    </div>
  );
}
