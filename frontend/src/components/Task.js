import React, { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import AddTaskModal from "./AddTaskModal";
import BtnPrimary from "./BtnPrimary";
import ProjectDropdown from "./ProjectDropdown";
import DropdownMenu from "./DropdownMenu";
import TaskModal from "./TaskModal";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

function Task({ onTasksChange }) {
  const [isAddTaskModalOpen, setAddTaskModal] = useState(false);
  const [columns, setColumns] = useState({});
  const [tasks, setTasks] = useState([]);
  const [isTaskOpen, setTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [title, setTitle] = useState("");

  const { projectId } = useParams();
  const navigate = useNavigate();

  // Status Dot helper
  const getStatusDot = (task) => {
    if (task.stage === "Done") return "bg-green-500";
    if (task.endDate && new Date(task.endDate) < new Date()) return "bg-red-500";
    return "bg-yellow-400";
  };

  // Fetch tasks and organize by stage
  const fetchTasks = () => {
    axios.get(`http://localhost:9000/project/${projectId}`)
      .then(res => {
        const projectData = res.data[0];
        setTitle(projectData.title);
        setTasks(projectData.task);

        const stages = ["Requested", "To do", "In Progress", "Done"];
        const newColumns = {};
        stages.forEach(stage => {
          newColumns[stage] = {
            name: stage,
            items: projectData.task.filter(t => t.stage === stage),
          };
        });
        setColumns(newColumns);

        if (onTasksChange) onTasksChange(projectData.task);
      })
      .catch(() => toast.error("Something went wrong fetching tasks"));
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId, isAddTaskModalOpen]);

  // Drag & Drop logic
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];

    if (source.droppableId === destination.droppableId) {
      const newItems = Array.from(sourceCol.items);
      const [moved] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, moved);

      setColumns(prev => ({
        ...prev,
        [source.droppableId]: { ...sourceCol, items: newItems },
      }));
    } else {
      const sourceItems = Array.from(sourceCol.items);
      const destItems = Array.from(destCol.items);
      const [movedTask] = sourceItems.splice(source.index, 1);

      // Update stage
      movedTask.stage = destCol.name;
      destItems.splice(destination.index, 0, movedTask);

      setColumns(prev => ({
        ...prev,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems },
      }));

      // Update backend
      axios.put(
        `http://localhost:9000/project/${projectId}/task/${draggableId}`,
        { task: movedTask } // ⚡ full task with updated stage
      )
      .then(() => toast.success("Task updated!"))
      .catch(() => toast.error("Failed to update task"));
    }
  };

  // Delete task
  const handleDelete = (e, taskId) => {
    e.stopPropagation();
    axios.delete(`http://localhost:9000/project/${projectId}/task/${taskId}`)
      .then(() => {
        toast.success("Task deleted");
        fetchTasks();
      })
      .catch(() => toast.error("Something went wrong"));
  };

  // Open task modal
  const handleTaskDetails = (id) => {
    setSelectedTaskId(id);
    setTaskOpen(true);
  };

  return (
    <div className="px-12 py-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-gray-800 flex items-center gap-2">
          {title}
          <ProjectDropdown id={projectId} navigate={navigate} />
        </h1>
        <BtnPrimary onClick={() => setAddTaskModal(true)}>Add Task</BtnPrimary>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="w-3/12">
              <h2 className="font-medium text-sm uppercase mb-2">
                {column.name} ({column.items.length})
              </h2>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[550px] border-t-2 border-indigo-400 pt-4"
                  >
                    {column.items.map((item, index) => {
                      const isOverdue = item.endDate && new Date(item.endDate) < new Date() && item.stage !== "Done";

                      return (
                        <Draggable key={item._id} draggableId={item._id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleTaskDetails(item._id)}
                              className={`px-3.5 pt-3.5 pb-2.5 mb-3 rounded-lg cursor-pointer
                                ${isOverdue ? "bg-red-50 border border-red-500" : "bg-white border border-gray-200"}`}
                            >
                              <div className="flex justify-between">
                                <h3 className="font-medium text-sm">{item.title}</h3>
                                <DropdownMenu
                                  taskId={item._id}
                                  handleDelete={handleDelete}
                                  projectId={projectId}
                                  setRenderChange={fetchTasks}
                                />
                              </div>
                              <p className="text-xs text-gray-500">{item.description?.slice(0, 60)}</p>

                              {item.startDate && item.endDate && (
                                <div className="flex items-center gap-2 text-[11px] text-gray-600 mt-1">
                                  <span className={`w-3 h-3 rounded-full ${getStatusDot(item)} ring-1 ring-gray-300`} />
                                  <span>
                                    {new Date(item.startDate).toLocaleDateString()} → {new Date(item.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              <span className="mt-2 inline-block text-xs bg-indigo-100 text-indigo-600 px-2 rounded">
                                Task-{index + 1}
                              </span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <AddTaskModal
        isAddTaskModalOpen={isAddTaskModalOpen}
        setAddTaskModal={setAddTaskModal}
        projectId={projectId}
      />

      <TaskModal
        isOpen={isTaskOpen}
        setIsOpen={setTaskOpen}
        taskId={selectedTaskId}
        projectId={projectId}
        onTasksUpdate={fetchTasks} // refresh board and Gantt
      />
    </div>
  );
}

export default Task;
