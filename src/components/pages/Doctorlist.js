import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [form, setForm] = useState({ patient_name: '', age: '', appointment_date: '' });
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('access_token');

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true;
    }
  };

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      setMessage('Session expired. Please login again.');
      localStorage.removeItem('access_token');
      navigate('/login');
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Fetch doctors
    fetch('http://localhost:8000/api/doctors/', { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch doctors');
        return res.json();
      })
      .then(setDoctors)
      .catch(() => setMessage('Unable to load doctors.'));

    // Fetch appointments
    fetch('http://localhost:8000/api/appointments/', { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
      })
      .then(setAppointments)
      .catch(() => setMessage('Unable to load appointments.'));
  }, [navigate, token]);

  const handleBook = (doctor) => {
    setBookingDoctor(doctor);
    setForm({ patient_name: '', age: '', appointment_date: '' });
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('http://localhost:8000/api/appointments/create/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        doctor: bookingDoctor.id,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(JSON.stringify(errorData));
        }
        return res.json();
      })
      .then((data) => {
        setMessage('Appointment booked!');
        setAppointments([...appointments, data]);
        setBookingDoctor(null);
      })
      .catch((err) => {
        setFormError('Error booking appointment: ' + err.message);
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Doctors List</h2>
      {message && <p>{message}</p>}

      <ul>
        {doctors.map((doc) => (
          <li key={doc.id}>
            <strong>{doc.name}</strong> - {doc.speciality} - {doc.department}
            <br />
            <button onClick={() => handleBook(doc)}>Book Appointment</button>
          </li>
        ))}
      </ul>

      {bookingDoctor && (
        <div style={{ marginTop: '20px', border: '1px solid gray', padding: '10px' }}>
          <h3>Booking Appointment with Dr. {bookingDoctor.name}</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Patient Name"
              value={form.patient_name}
              onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
              required
            />
            <br />
            <input
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />
            <br />
            <input
              type="date"
              value={form.appointment_date}
              onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
              required
            />
            <br />
            <button type="submit">Submit</button>
            <button type="button" onClick={() => setBookingDoctor(null)}>Cancel</button>
          </form>
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
        </div>
      )}

      <h2>My Appointments</h2>
      <ul>
        {appointments.map((appt) => (
          <li key={appt.id}>
            {appt.patient_name}, Age {appt.age}, Date: {appt.appointment_date}, Doctor: Doctor: {appt.doctor ? appt.doctor.name : 'N/A'}

          </li>
        ))}
      </ul>
    </div>
  );
};

export default DoctorList;
