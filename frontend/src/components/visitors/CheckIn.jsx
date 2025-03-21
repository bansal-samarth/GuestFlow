import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

const CheckInPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleDecode = async (result) => {
    // Only process if we have a result and camera is active
    if (!result || !result.text || !cameraActive) return;
    
    // First turn off camera to prevent multiple scans
    setCameraActive(false);
    
    try {
      setScanResult(result.text);
      setStatus('scanning');
      
      console.log("Scanned QR Data:", result.text);

      // Extract visitor ID from QR code URL
      const visitorIdMatch = result.text.match(/\/visitors\/([^\/]+)\/check-in/);
      if (!visitorIdMatch) {
        setStatus('error');
        setErrorMessage('Invalid QR code format.');
        return;
      }

      const visitorId = visitorIdMatch[1];

      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('error');
        setErrorMessage('Authentication required.');
        return;
      }

      // API request to check in visitor
      const response = await axios.put(
        `http://localhost:5000/api/visitors/${visitorId}/check-in`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log("API Response:", response.data);

      // If API returns an error message, handle it
      if (response.data.error) {
        setStatus('error');
        setErrorMessage(response.data.error);
        return;
      }

      // Ensure we're correctly interpreting the visitor status from the backend
      const visitor = response.data.visitor;
      setVisitorInfo(visitor);
      
      // Set appropriate status based on visitor's backend status
      if (visitor.status === 'checked_in') {
        setStatus('success');
      } else if (visitor.status === 'pending_approval') {
        setStatus('error');
        setErrorMessage('Visitor must be approved before check-in.');
      } else {
        setStatus('success'); // Default to success if status is unknown
      }
      
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'An error occurred during check-in.');
      console.error('Check-in error:', error);
    }
  };

  const handleError = (error) => {
    console.error('QR Scanner error:', error);
    setStatus('error');
    setErrorMessage('Failed to access camera: ' + error.message);
    setCameraActive(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setStatus('idle');
    setErrorMessage('');
    setVisitorInfo(null);
  };

  const startCamera = () => {
    resetScanner();
    setCameraActive(true);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => setCameraActive(false);
  }, []);

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold text-center mb-6">Visitor Check-in</h1>

      {status === 'idle' && !cameraActive && (
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Click the button below to start scanning the visitor's QR code
          </p>
          <button
            onClick={startCamera}
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            Start Scanner
          </button>
        </div>
      )}

      {cameraActive && (
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Scan the visitor's QR code to check them in
          </p>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative" style={{ height: '300px' }}>
            <QrReader
              onResult={handleDecode}
              constraints={{ 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              onError={handleError}
              scanDelay={500}
              videoId="qr-video"
              videoStyle={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              ViewFinder={() => (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-blue-500 w-48 h-48 rounded-lg opacity-70"></div>
                </div>
              )}
            />
          </div>
          <button
            onClick={() => setCameraActive(false)}
            className="w-full py-2 px-4 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            Cancel
          </button>
        </div>
      )}

      {status === 'scanning' && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Processing check-in...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium text-green-700">Check-in successful!</p>
            </div>
          </div>

          {visitorInfo && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Visitor Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Name:</span>
                <span>{visitorInfo.full_name || 'N/A'}</span>

                <span className="text-gray-600">Email:</span>
                <span>{visitorInfo.email || 'N/A'}</span>

                <span className="text-gray-600">Check-in time:</span>
                <span>{visitorInfo.check_in_time ? new Date(visitorInfo.check_in_time).toLocaleString() : 'N/A'}</span>

                <span className="text-gray-600">Status:</span>
                <span className="capitalize">{visitorInfo.status || 'N/A'}</span>
              </div>
            </div>
          )}

          <button
            onClick={resetScanner}
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mt-4"
          >
            Scan Another QR Code
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
            <p className="font-medium text-red-700">Error: {errorMessage}</p>
          </div>
          <button
            onClick={resetScanner}
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;