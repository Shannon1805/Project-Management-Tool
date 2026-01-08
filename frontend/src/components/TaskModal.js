import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TaskModal = ({ isOpen, setIsOpen, taskId, projectId, onTasksUpdate }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    stage: 'Requested',
  });

  const capitalizeFirstLetter = (string) => string ? string.charAt(0).toUpperCase() + string.slice(1) : '';

  // Fetch task info when modal opens
  useEffect(() => {
    if (!isOpen || !taskId) return;

    axios.get(`http://localhost:9000/project/${projectId}/task/${taskId}`)
      .then(res => {
        const task = res.data;
        setTaskData({
          title: task.title || '',
          description: task.description || '',
          startDate: task.startDate ? task.startDate.split('T')[0] : '',
          endDate: task.endDate ? task.endDate.split('T')[0] : '',
          stage: task.stage || 'Requested',
        });
      })
      .catch(err => {
        console.error("Failed to load task:", err.response || err);
        toast.error('Failed to load task details');
      });
  }, [isOpen, taskId, projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!projectId || !taskId) {
      toast.error("Project or Task ID missing!");
      return;
    }

    console.log("Saving task:", projectId, taskId, taskData);

    axios.put(
      `http://localhost:9000/project/${projectId}/task/${taskId}`,
      { task: taskData } // ⚡ important: wrap in "task" if backend expects
    )
      .then(() => {
        toast.success('Task updated!');
        onTasksUpdate?.();
        setIsOpen(false);
      })
      .catch(err => {
        console.error("Failed to update task:", err.response || err);
        toast.error('Failed to update task');
      });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white w-[85%] h-[85%] rounded-md overflow-hidden flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4 shadow bg-white">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="flex h-full">
              {/* LEFT SIDE: Info Display */}
              <div className="w-8/12 px-8 py-6 overflow-y-auto space-y-4">
                <h1 className="text-3xl font-semibold">{capitalizeFirstLetter(taskData.title)}</h1>
                <p className="text-gray-600">{capitalizeFirstLetter(taskData.description)}</p>
                {taskData.startDate && taskData.endDate && (
                  <div className="text-sm text-gray-500">📅 {taskData.startDate} → {taskData.endDate}</div>
                )}
              </div>

              {/* RIGHT SIDE: Editable */}
              <div className="w-4/12 border-l px-6 py-6 space-y-4 text-sm">
                <div>
                  <label className="text-gray-500">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={taskData.title}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-gray-500">Description</label>
                  <textarea
                    name="description"
                    value={taskData.description}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-gray-500">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={taskData.startDate}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-gray-500">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={taskData.endDate}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>

                <div>
                  <label className="text-gray-500">Stage</label>
                  <select
                    name="stage"
                    value={taskData.stage}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 mt-1"
                  >
                    <option>Requested</option>
                    <option>To do</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TaskModal;
