import React, { useState, useEffect } from "react";
import AppLayout from "./components/AppLayout";
import { Routes, Route, useParams } from "react-router-dom";
import Task from "./components/Task";
import GanttChart from "./components/GanttChart";
import { Toaster } from "react-hot-toast";
import axios from "axios";

const Home = () => (
  <div className="flex flex-col items-center w-full pt-10">
    <img src="./image/welcome.svg" className="w-5/12" alt="" />
    <h1 className="text-lg text-gray-600">Select or create new project</h1>
  </div>
);

// Project Page with Task + Gantt chart
const ProjectPage = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [showGantt, setShowGantt] = useState(false);

  // Fetch tasks for this project
  useEffect(() => {
    axios.get(`http://localhost:9000/project/${projectId}`)
      .then(res => {
        if (res.data[0]) {
          const projectTasks = res.data[0].task.map(t => ({
            title: t.title,
            projectName: res.data[0].title,
            startDate: t.startDate,
            endDate: t.endDate,
          }));
          setTasks(projectTasks);
        }
      })
      .catch(err => console.error("Error fetching tasks:", err));
  }, [projectId]);

  return (
    <div className="flex flex-col w-full gap-10 px-12 py-6">
      {/* Task board */}
      <Task projectId={projectId} />

      {/* Gantt chart toggle button */}
      {tasks.length > 0 && (
        <button
          onClick={() => setShowGantt(!showGantt)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          {showGantt ? "Hide Gantt Chart" : "Show Gantt Chart"}
        </button>
      )}

      {/* Gantt chart */}
      {showGantt && tasks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Gantt Chart</h2>
          <GanttChart tasks={tasks} />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AppLayout>
      <Toaster position="top-right" gutter={8} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:projectId" element={<ProjectPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
