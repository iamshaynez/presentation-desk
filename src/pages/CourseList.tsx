import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiResponse } from '@/types';
import { BookOpen, Folder, ChevronLeft } from 'lucide-react';

export function CourseList() {
  const { categoryName } = useParams();
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = categoryName 
      ? `/api/courses/${encodeURIComponent(categoryName)}`
      : '/api/courses';

    fetch(url)
      .then(res => res.json())
      .then((data: ApiResponse<string[]>) => {
        if (data.success) {
          setItems(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [categoryName]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      {categoryName ? (
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-4">
            <ChevronLeft size={20} /> Back to Categories
          </Link>
          <h1 className="text-3xl font-bold">Courses in "{categoryName}"</h1>
        </div>
      ) : (
        <h1 className="text-3xl font-bold mb-8">Course Categories</h1>
      )}

      {items.length === 0 ? (
        <div className="text-center text-gray-500">
          {categoryName 
            ? 'No courses found in this category.' 
            : 'No categories found. Please add folders to the "courses" directory.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <Link 
              key={item} 
              to={categoryName 
                ? `/course/${encodeURIComponent(categoryName)}/${encodeURIComponent(item)}`
                : `/category/${encodeURIComponent(item)}`
              }
              className="block p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-zinc-800"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${categoryName ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {categoryName ? <BookOpen size={24} /> : <Folder size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item}</h2>
                  <p className="text-gray-500">
                    {categoryName ? 'Click to start learning' : 'Click to view courses'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
