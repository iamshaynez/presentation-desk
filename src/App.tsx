import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CourseList } from "@/pages/CourseList";
import { CourseViewer } from "@/pages/CourseViewer";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CourseList />} />
        <Route path="/category/:categoryName" element={<CourseList />} />
        <Route path="/course/:category/:courseName" element={<CourseViewer />} />
        <Route path="/course/:category/:courseName/:unitName" element={<CourseViewer />} />
      </Routes>
    </Router>
  );
}
