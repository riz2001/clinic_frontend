import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'


// Manual JWT decode function to avoid external dependency
const jwtDecode = (token) => {
  try {
    if (!token) return null;
    
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64url to base64
    const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Parse the JSON
    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
};

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [form, setForm] = useState({ patient_name: '', age: '', appointment_date: '' });
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

 

  // Navigation placeholder - implement with react-router in real app
 

  // Get token from localStorage
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : 'demo_token';

  // Get user info from token for navbar
  const getUserFromToken = () => {
    try {
      if (!token || token === 'demo_token') return { name: 'Demo User', role: 'Patient' };
      const decoded = jwtDecode(token);
      return {
        name: decoded.name || decoded.username || 'User',
        role: decoded.role || 'Patient',
        email: decoded.email || ''
      };
    } catch (err) {
      return { name: 'User', role: 'Patient' };
    }
  };

  const user = getUserFromToken();

  // Handle logout
const handleLogout = () => {
  localStorage.removeItem('access_token');
  navigate('/', { state: { message: 'Logged out successfully' }, replace: true });
};



  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || isTokenExpired(token)) {
      setMessage('Session expired. Please login again.');
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
      }
       navigate('/', { replace: true });
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Fetch doctors from your API
    fetch('http://localhost:8000/api/doctors/', { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch doctors');
        return res.json();
      })
      .then(setDoctors)
      .catch(() => setMessage('Unable to load doctors.'));

    // Fetch appointments from your API
   fetch('http://localhost:8000/api/appointments/', { headers })
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    })
    .then(setAppointments)
    .catch(() => setMessage('Unable to load appointments.'));
}, [token]);

  const handleBook = (doctor) => {
    setBookingDoctor(doctor);
    setForm({ patient_name: '', age: '', appointment_date: '' });
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(''); // Clear any previous errors

    // Validate form fields
    if (!form.patient_name || !form.age || !form.appointment_date) {
      setFormError('Please fill in all required fields');
      return;
    }

    // Validate doctor selection
    if (!bookingDoctor || !bookingDoctor.id) {
      setFormError('Doctor selection is required');
      return;
    }

    // Prepare appointment data - FIXED: Changed 'doctor' to 'doctor_id'
    const appointmentData = {
      patient_name: form.patient_name.trim(),
      age: parseInt(form.age),
      appointment_date: form.appointment_date,
      doctor_id: bookingDoctor.id  // FIXED: This was the issue - API expects 'doctor_id' not 'doctor'
    };

    console.log('Booking appointment with data:', appointmentData); // Debug log

    fetch('http://localhost:8000/api/appointments/create/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    })
      .then(async (res) => {
        console.log('Response status:', res.status); // Debug log
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error('API Error:', errorData); // Debug log
          
          // Handle specific validation errors
          if (errorData.doctor_id) {
            throw new Error(`Doctor ID error: ${errorData.doctor_id.join(', ')}`);
          }
          if (errorData.patient_name) {
            throw new Error(`Patient name error: ${errorData.patient_name.join(', ')}`);
          }
          if (errorData.age) {
            throw new Error(`Age error: ${errorData.age.join(', ')}`);
          }
          if (errorData.appointment_date) {
            throw new Error(`Date error: ${errorData.appointment_date.join(', ')}`);
          }
          
          // Generic error message
          throw new Error(errorData.detail || JSON.stringify(errorData));
        }
        return res.json();
      })
      .then((data) => {
        console.log('Appointment created successfully:', data); // Debug log
        setMessage('Appointment booked successfully!');
        setAppointments([...appointments, data]);
        setBookingDoctor(null);
        setForm({ patient_name: '', age: '', appointment_date: '' }); // Reset form
      })
      .catch((err) => {
        console.error('Booking error:', err); // Debug log
        setFormError('Error booking appointment: ' + err.message);
      });
  };

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px',
      color: 'white'
    },
    headerTitle: {
      fontSize: '3rem',
      fontWeight: '700',
      marginBottom: '10px',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    headerSubtitle: {
      fontSize: '1.2rem',
      opacity: '0.9'
    },
    message: {
      background: 'white',
      padding: '15px 20px',
      borderRadius: '10px',
      marginBottom: '30px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      borderLeft: '4px solid #10b981'
    },
    messageError: {
      borderLeftColor: '#ef4444',
      background: '#fef2f2',
      color: '#dc2626'
    },
    messageSuccess: {
      borderLeftColor: '#10b981',
      background: '#f0fdf4',
      color: '#059669'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '30px',
      marginBottom: '30px'
    },
    card: {
      background: 'white',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      backdropFilter: 'blur(10px)'
    },
    cardTitle: {
      fontSize: '1.8rem',
      fontWeight: '600',
      marginBottom: '25px',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    doctorCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '15px',
      transition: 'all 0.3s ease',
      background: '#fafafa'
    },
    doctorCardHover: {
      borderColor: '#3b82f6',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
      transform: 'translateY(-2px)'
    },
    doctorInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    doctorName: {
      fontSize: '1.3rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '8px'
    },
    speciality: {
      color: '#3b82f6',
      fontWeight: '500',
      marginBottom: '5px'
    },
    department: {
      color: '#6b7280',
      fontSize: '0.9rem'
    },
    bookBtn: {
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    appointmentCard: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '15px'
    },
    appointmentRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#4b5563',
      marginBottom: '10px'
    },
    patientName: {
      fontWeight: '600',
      color: '#1f2937'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#9ca3af'
    },
    emptyIcon: {
      fontSize: '4rem',
      marginBottom: '20px',
      color: '#d1d5db'
    },
    modalOverlay: {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000',
      padding: '20px'
    },
    modal: {
      background: 'white',
      borderRadius: '15px',
      padding: '30px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      animation: 'modalSlideIn 0.3s ease-out'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px'
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#9ca3af',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '5px',
      transition: 'all 0.2s'
    },
    doctorSummary: {
      background: '#eff6ff',
      border: '1px solid #dbeafe',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '25px'
    },
    bookingWith: {
      fontSize: '0.9rem',
      color: '#6b7280',
      marginBottom: '5px'
    },
    selectedDoctorName: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '5px'
    },
    selectedDoctorSpec: {
      color: '#3b82f6',
      fontWeight: '500'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    formControl: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      background: 'white',
      boxSizing: 'border-box'
    },
    formError: {
      background: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#dc2626',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    formActions: {
      display: 'flex',
      gap: '15px',
      paddingTop: '20px'
    },
    btnPrimary: {
      flex: '1',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    btnSecondary: {
      padding: '12px 24px',
      border: '2px solid #e5e7eb',
      background: 'white',
      color: '#374151',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    // Navbar styles
    navbar: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '0 20px',
      position: 'sticky',
      top: '0',
      zIndex: '100',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    navContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '70px'
    },
    navBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1f2937',
      textDecoration: 'none'
    },
    navBrandIcon: {
      fontSize: '2rem'
    },
    navMenu: {
      display: 'flex',
      alignItems: 'center',
      gap: '30px',
      listStyle: 'none',
      margin: '0',
      padding: '0'
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    navLink: {
      color: '#4b5563',
      textDecoration: 'none',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    navLinkActive: {
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px',
      background: 'rgba(59, 130, 246, 0.1)',
      borderRadius: '12px',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '1rem'
    },
    userDetails: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    userName: {
      fontWeight: '600',
      color: '#1f2937',
      fontSize: '0.9rem'
    },
    userRole: {
      fontSize: '0.8rem',
      color: '#6b7280'
    },
    logoutBtn: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    mobileToggle: {
      display: 'none',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#4b5563',
      cursor: 'pointer',
      padding: '8px'
    },
    mobileMenu: {
      display: 'none',
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      background: 'white',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      borderTop: '1px solid #e5e7eb',
      padding: '20px'
    },
    mobileMenuOpen: {
      display: 'block'
    },
    mobileNavItem: {
      padding: '15px 0',
      borderBottom: '1px solid #f3f4f6'
    },
    mobileUserSection: {
      padding: '20px 0',
      borderTop: '2px solid #f3f4f6',
      marginTop: '10px'
    }
  };

  // Media queries for responsive design
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    styles.mainGrid.gridTemplateColumns = '1fr';
    styles.headerTitle.fontSize = '2rem';
    styles.card.padding = '20px';
    styles.doctorInfo.flexDirection = 'column';
    styles.doctorInfo.gap = '15px';
    
    // Mobile navbar styles
    styles.navMenu.display = 'none';
    styles.mobileToggle.display = 'block';
    styles.userSection.display = 'none';
    
    if (mobileMenuOpen) {
      styles.mobileMenu.display = 'block';
    }
  }

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          {/* Brand/Logo */}
          <div style={styles.navBrand}>
            <span style={styles.navBrandIcon}>🏥</span>
            <span>MediCare</span>
          </div>

          {/* Desktop Navigation */}
          <ul style={styles.navMenu}>
            
          </ul>

          {/* User Section */}
          <div style={styles.userSection}>
            <div style={styles.userInfo}>
            
            
            </div>
            <button 
              style={styles.logoutBtn}
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'none';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span>🚪</span>
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            style={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        <div style={{
          ...styles.mobileMenu,
          ...(mobileMenuOpen ? styles.mobileMenuOpen : {})
        }}>
         
         
          
         
            <button 
              style={{...styles.logoutBtn, marginTop: '15px', width: '100%'}}
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <span>🚪</span>
              Logout
            </button>
            </div>
         
      </nav>

      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>🩺 Healthcare Dashboard</h1>
          <p style={styles.headerSubtitle}>Book appointments with our qualified doctors</p>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            ...styles.message,
            ...(message.includes('expired') || message.includes('Unable') 
              ? styles.messageError 
              : styles.messageSuccess)
          }}>
            {message}
          </div>
        )}

        <div style={styles.mainGrid}>
          {/* Doctors List */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>👨‍⚕️</span>
              Available Doctors
            </h2>
            
            {doctors.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🩺</div>
                <p>No doctors available at the moment</p>
              </div>
            ) : (
              <div>
                {doctors.map((doc) => (
                  <div 
                    key={doc.id} 
                    style={styles.doctorCard}
                    onMouseEnter={(e) => {
                      Object.assign(e.target.style, styles.doctorCardHover);
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'none';
                    }}
                  >
                    <div style={styles.doctorInfo}>
                      <div>
                        <h3 style={styles.doctorName}>Dr. {doc.name}</h3>
                        <div style={styles.speciality}>{doc.speciality}</div>
                        <div style={styles.department}>{doc.department}</div>
                      </div>
                      <button
                        style={styles.bookBtn}
                        onClick={() => handleBook(doc)}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'none';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        📅 Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Appointments */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span>⏰</span>
              My Appointments
            </h2>
            
            {appointments.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📅</div>
                <p>No appointments scheduled</p>
              </div>
            ) : (
              <div>
                {appointments.map((appt) => (
                  <div key={appt.id} style={styles.appointmentCard}>
                    <div style={styles.appointmentRow}>
                      <span>👤</span>
                      <span style={styles.patientName}>{appt.patient_name}</span>
                      <span>• Age {appt.age}</span>
                    </div>
                    <div style={styles.appointmentRow}>
                      <span>📅</span>
                      <span>{appt.appointment_date}</span>
                    </div>
                    <div style={styles.appointmentRow}>
                      <span>🩺</span>
                      <span>Dr. {appt.doctor ? appt.doctor.name : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Modal */}
        {bookingDoctor && (
          <div style={styles.modalOverlay} onClick={() => setBookingDoctor(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Book Appointment</h3>
                <button
                  style={styles.closeBtn}
                  onClick={() => setBookingDoctor(null)}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#6b7280';
                    e.target.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#9ca3af';
                    e.target.style.background = 'none';
                  }}
                >
                  ×
                </button>
              </div>

              <div style={styles.doctorSummary}>
                <p style={styles.bookingWith}>Booking with</p>
                <p style={styles.selectedDoctorName}>Dr. {bookingDoctor.name}</p>
                <p style={styles.selectedDoctorSpec}>{bookingDoctor.speciality}</p>
                <p style={{fontSize: '0.8rem', color: '#9ca3af', marginTop: '5px'}}>
                  Doctor ID: {bookingDoctor.id}
                </p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Patient Name</label>
                <input
                  type="text"
                  style={styles.formControl}
                  placeholder="Enter patient name"
                  value={form.patient_name}
                  onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Age</label>
                <input
                  type="number"
                  style={styles.formControl}
                  placeholder="Enter age"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Appointment Date</label>
                <input
                  type="date"
                  style={styles.formControl}
                  value={form.appointment_date}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {formError && (
                <div style={styles.formError}>
                  {formError}
                </div>
              )}

              <div style={styles.formActions}>
                <button
                  style={styles.btnPrimary}
                  onClick={handleSubmit}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'none';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  ✓ Book Appointment
                </button>
                <button
                  style={styles.btnSecondary}
                  onClick={() => setBookingDoctor(null)}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorList;