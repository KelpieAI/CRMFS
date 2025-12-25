import { useParams } from 'react-router-dom';

export default function MemberDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Member Detail</h1>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-gray-600">Member ID: {id}</p>
        <p className="text-sm text-gray-500 mt-2">
          Full member detail view coming soon...
        </p>
      </div>
    </div>
  );
}
