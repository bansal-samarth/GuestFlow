# GuestFlow - Modern Visitor Management System

<div align="center">
  
![GuestFlow](https://github.com/user-attachments/assets/f494cc92-d024-4de0-be78-0fe262065cff)

*A comprehensive digital solution for efficient visitor management*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/s3/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

</div>

## 📋 Overview

GuestFlow is a modern visitor management system developed using React, Flask, and SQLite. It streamlines the entire visitor management process from registration to check-out with features like pre-approval workflows, QR code-based check-in/out, real-time updates, and insightful dashboards.

## ✨ Key Features

- **Dual Registration Workflows**: Standard and pre-approval registration processes
- **QR Code Integration**: Secure, contactless check-in and check-out
- **Real-time Notifications**: Email confirmations and status updates
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Secure Authentication**: JWT-based authentication with expiry
- **Analytics Dashboard**: Visualized insights into visitor patterns
- **Cloud Storage**: AWS S3 integration for secure visitor photo storage
- **Search & Filter**: Easily find and manage visitor records


## 💻 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React (Vite), Tailwind CSS, Recharts |
| **Backend** | Python Flask, SQLAlchemy |
| **Database** | SQLite |
| **Authentication** | JWT Tokens (1-hour expiry) |
| **Cloud Storage** | AWS S3 |
| **Email Service** | EmailJS |
| **QR Code** | qrcode (React), react-qr-reader |
| **Notifications** | react-toastify |

## 🔄 User Workflows

### Visitor Registration Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant Backend
    participant Database
    participant S3
    participant Email
    
    Admin->>Frontend: Fill registration form
    Frontend->>Backend: Submit visitor data
    Backend->>S3: Upload visitor photo
    S3-->>Backend: Return photo URL
    Backend->>Database: Store visitor record with photo URL
    Backend->>Email: Send confirmation email
    Email-->>Visitor: Receive confirmation
    
    alt Pre-approval Registration
        Backend->>Email: Send email with QR code
        Email-->>Visitor: Receive QR code
    end
```

### Check-in Process

```mermaid
sequenceDiagram
    actor Visitor
    participant Reception
    participant Frontend
    participant Backend
    participant Database
    
    Visitor->>Reception: Present QR code
    Reception->>Frontend: Scan QR code
    Frontend->>Backend: Validate QR code
    Backend->>Database: Check visitor approval status
    
    alt Valid Approval Window
        Backend->>Database: Update status to "Checked In"
        Backend-->>Frontend: Confirm check-in
        Frontend-->>Reception: Display success message
    else Invalid or Expired
        Backend-->>Frontend: Return error
        Frontend-->>Reception: Display error message
    end
```

## 📊 Dashboard Insights

The analytics dashboard provides valuable insights including:

- Visitor traffic patterns by time and date
- Average visit duration
- Most frequent visitors
- Peak hours visualization
- Visitor status distribution
- Recently visited visitors

![Screenshot (40)](https://github.com/user-attachments/assets/f181c211-74a3-494c-8bf8-9c9c1d3b7a26)

## 🔐 Authentication & Security

- **JWT Token Authentication**: Secure, stateless authentication
- **Token Expiry**: 1-hour session timeout for enhanced security
- **Photo Verification**: Mandatory photo upload for visitor identification
- **Secure Storage**: AWS S3 integration for media storage
- **Role-based Access**: Different permissions for administrators and reception staff

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or above)
- Python (v3.8 or above)
- npm or yarn
- pip

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/guestflow.git
cd guestflow/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd ../server

# Create virtual environment (Optional)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
python app.py
```

### Environment Configuration
Create a `.env` file in the backend directory with the following variables:
```
JWT_SECRET_KEY=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
EMAILJS_USER_ID=your_emailjs_user_id
EMAILJS_SERVICE_ID=your_emailjs_service_id
EMAILJS_TEMPLATE_ID=your_emailjs_template_id
```

## 📝 API Documentation

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/auth/login` | POST | User authentication | No |
| `/api/auth/register` | POST | Register new staff user | No |
| `/api/auth/users` | GET | Get all users (admin only) | Yes |
| `/api/visitors` | GET | Get all visitors | Yes |
| `/api/visitors/not-pre-approve` | POST | Create regular visitor | Yes |
| `/api/visitors/pre-approve` | POST | Create pre-approved visitor | Yes |
| `/api/visitors/<id>` | GET | Get visitor details | Yes |
| `/api/visitors/<id>/approve` | PUT | Approve pending visitor | Yes |
| `/api/visitors/<id>/reject` | PUT | Reject pending visitor | Yes |
| `/api/visitors/<id>/check-in` | PUT | Process visitor check-in | Yes |
| `/api/visitors/<id>/check-out` | PUT | Process visitor check-out | Yes |
| `/api/dashboard/stats` | GET | Get dashboard statistics | Yes |

## 📱 Responsive Design

GuestFlow is fully responsive and provides an optimal experience across a wide range of devices:

- Desktop
- Mobile
- Tablet

## 📄 License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details.

<div align="center">
  
**Made with ❤️ by Samarth**

</div>
