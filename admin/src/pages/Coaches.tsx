import { useEffect, useState } from 'react';
import { api } from '../api/client';

type Coach = { id: number; name: string; email: string; specialty: string };

export default function Coaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    api.get<Coach[]>('/coaches').then(setCoaches);
  }, []);

  return (
    <div>
      <h1 className="page-title">コーチ管理</h1>
      <table className="table">
        <thead>
          <tr>
            <th>氏名</th>
            <th>メール</th>
            <th>専門分野</th>
          </tr>
        </thead>
        <tbody>
          {coaches.map((c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
              <td>{c.specialty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
