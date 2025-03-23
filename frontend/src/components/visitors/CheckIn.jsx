import React, { useState, useEffect, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

const CheckInPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  // Use a ref flag so re-renders do not affect its value
  const hasScannedRef = useRef(false);
  const qrScannerContainerRef = useRef(null);

  const handleDecode = async (result) => {
    // Only process if we have a result, text exists, camera is active and we haven't scanned already
    if (!result || !result.text || !cameraActive || hasScannedRef.current) return;

    // Mark that we have scanned so that subsequent calls are ignored
    hasScannedRef.current = true;

    // Immediately turn off the camera to stop further scanning
    setCameraActive(false);
    setScanResult(result.text);
    setStatus('scanning');

    console.log("Scanned QR Data:", result.text);

    try {
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

      // Check if the API returned visitor data
      if (response.data.visitor) {
        const visitor = response.data.visitor;
        setVisitorInfo(visitor);
        if (visitor.status === 'checked_in') {
          setStatus('success');
        } else if (visitor.status === 'pending_approval') {
          setStatus('error');
          setErrorMessage('Visitor must be approved before check-in.');
        } else {
          setStatus('success'); // Fallback to success
        }
      } else {
        // API did not return visitor info (e.g. already checked in)
        setStatus('error');
        setErrorMessage(response.data.message || 'An error occurred during check-in.');
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

  // Instead of resetting the scanner state, reload the entire page
  const reloadPage = () => {
    window.location.reload();
  };

  const startCamera = () => {
    // Use the original resetScanner logic for starting the camera
    setScanResult(null);
    setStatus('idle');
    setErrorMessage('');
    setVisitorInfo(null);
    hasScannedRef.current = false;
    setCameraActive(true);
  };

  // Force camera shutdown when cameraActive changes to false by replacing the container
  useEffect(() => {
    if (!cameraActive && qrScannerContainerRef.current) {
      const parent = qrScannerContainerRef.current.parentNode;
      const oldElement = qrScannerContainerRef.current;
      if (parent) {
        const newElement = oldElement.cloneNode(false);
        parent.replaceChild(newElement, oldElement);
        qrScannerContainerRef.current = newElement;
      }
    }
  }, [cameraActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setCameraActive(false);
    };
  }, []);

  return (
    <div className="max-w-md mx-auto my-10 p-8 bg-white rounded-xl shadow-xl border border-gray-100">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-green-50 p-3 rounded-full">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 ml-3">Visitor Check-in</h1>
      </div>

      {status === 'idle' && !cameraActive && (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              Welcome to the visitor management system
            </p>
            <p className="text-green-600 text-sm mt-1">
              Scan your QR code to check in 
            </p>
          </div>
          <button
            onClick={startCamera}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Start Scanner
            </div>
          </button>
        </div>
      )}

      {cameraActive && (
        <div className="space-y-5">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-center text-green-800 font-medium">
              Scan the visitor's QR code
            </p>
            <p className="text-center text-green-600 text-sm mt-1">
              Position the QR code within the frame
            </p>
          </div>
          <div 
            ref={qrScannerContainerRef}
            className="border-2 border-green-200 rounded-lg overflow-hidden relative" 
            style={{ height: '320px' }}
          >
            <QrReader
              onResult={handleDecode}
              constraints={{ 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              onError={handleError}
              videoId="qr-video"
              scanDelay={500}
              videoStyle={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              ViewFinder={() => (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-green-500 w-48 h-48 rounded-lg opacity-70">
                    <div className="absolute inset-0 border-4 border-transparent">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
          <button
            onClick={reloadPage}
            className="w-full py-3 px-4 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </div>
          </button>
        </div>
      )}

      {status === 'scanning' && (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          <p className="mt-4 text-green-700 font-medium">Processing check-in...</p>
          <p className="text-green-600 text-sm mt-1">Please wait a moment</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-lg">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-green-800">Check-in successful!</p>
                <p className="text-green-600 text-sm mt-1">Visitor has been checked in</p>
              </div>
            </div>
          </div>

          {visitorInfo && (
            <div className="mt-4 bg-white border border-green-100 rounded-lg shadow-sm p-5">
              <div className="flex items-center mb-4">
                <svg className="h-5 w-5 text-green-700 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="font-semibold text-green-800 text-lg">Visitor Information</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-green-50">
                  <span className="text-green-700 font-medium">Name</span>
                  <span className="text-gray-800">{visitorInfo.full_name || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-green-50">
                  <span className="text-green-700 font-medium">Email</span>
                  <span className="text-gray-800">{visitorInfo.email || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-green-50">
                  <span className="text-green-700 font-medium">Check-in time</span>
                  <span className="text-gray-800">{visitorInfo.check_in_time ? new Date(visitorInfo.check_in_time).toLocaleString() : 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-green-700 font-medium">Status</span>
                  <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm capitalize">{visitorInfo.status || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={reloadPage}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 mt-6"
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Scan Another QR Code
            </div>
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-red-800">Error occurred</p>
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
          <button
            onClick={reloadPage}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </div>
          </button>
        </div>
      )}

      <div className="mt-8 text-center text-green-600 text-xs">
        © 2025 Visitor Management System
      </div>
    </div>
  );
};

export default CheckInPage;