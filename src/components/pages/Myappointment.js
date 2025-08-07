import React, { useEffect, useState } from 'react';

const Myappointment= () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/appointments/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAppointments();
  }, [token]);

  return (
    <div>
      <h2>My Appointments</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <ul>
          {appointments.map((appt) => (
            <li key={appt.id}>
              <strong>Doctor:</strong> {appt.doctor.name} | 
              <strong> Patient:</strong> {appt.patient_name} | 
              <strong> Age:</strong> {appt.age} | 
              <strong> Date:</strong> {new Date(appt.appointment_date).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Myappointment;
