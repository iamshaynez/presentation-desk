import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiResponse } from '@/types';
import { BookOpen } from 'lucide-react';

export default function CourseList() {
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then((data: ApiResponse<string[]>) => {
        if (data.success) {
          setCourses(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Available Courses</h1>
      {courses.length === 0 ? (
        <div className="text-center text-gray-500">No courses found. Please add courses to the "courses" directory.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link 
              key={course} 
              to={`/course/${encodeURIComponent(course)}`}
              className="block p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-zinc-800"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{course}</h2>
                  <p className="text-gray-500">Click to start learning</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
