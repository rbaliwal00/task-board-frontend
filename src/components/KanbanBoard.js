import PlusIcon from "../icons/PlusIcon";
import { useEffect, useMemo, useState } from "react";
import ColumnContainer from "./ListContainer";
import { useSelector } from "react-redux";
import axios from "axios";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import TaskCard from "./TaskCard";
import { API_URL } from "../services/user.service";
import authHeader from "../services/auth-header";


function KanbanBoard() {
   const { user: currentUser } = useSelector((state) => state.auth);
   const[data, setData] = useState();
  console.log(data)
  const [columns, setColumns] = useState(data?.list || null);
  const columnsId = useMemo(() => columns?.map((col) => col.id), [columns]);
  const [tasks, setTasks] = useState([]);
  const [activeColumn, setActiveColumn] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const getUserById = async (id) => {
    try {
      const res = await axios.get(API_URL + `${id}`, { headers: authHeader() });
      setData(res.data);
    } catch (error) {
      // Handle errors here
      console.error(error);
      throw error; // Rethrow the error or handle it as needed
    }
  };

  useEffect(() => {
    getUserById(currentUser.id);
  }, [tasks]);


  useEffect(() => {
    if (data) {
      setColumns(data.list);
      // You can also set your tasks here based on data.tasks if needed
      let array = [];
      data.list?.forEach(list => {
        list.task.forEach(task => {
          array.push(task);
        })
      });
      console.log(array);

      setTasks(array);
    }
  }, [data]);

  console.log(tasks)

  useEffect(() => {
  }, [columns])

  if (columns === null) {
    // Display a preloader while data is loading
    return <div className="preloader">Loading...</div>;
  }

  return (
    <div className="color-black m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px]">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <ColumnContainer
                  key={col.id}
                  column={col}
                  deleteColumn={deleteColumn}
                  updateColumn={updateColumn}
                  // createTask={createTask}
                  getUserById={getUserById}
                  deleteTask={deleteTask}
                  updateTask={updateTask}
                  tasks={tasks.filter((task) => task.listId === col.id).filter((task) => task.done === false)}
                />
              ))}
            </SortableContext>
          </div>
          <button
            onClick={createNewColumn}
            className="
            h-[60px]
            w-[250px]
            min-w-[250px]
            cursor-pointer
            rounded-lg
            bg-mainBackgroundColor
            border-2
            border-columnBackgroundColor
            p-4
            ring-rose-500
            hover:ring-2
            flex gap-2
            "
          >
            <PlusIcon />
            Add Column
          </button>
        </div>

        {createPortal(
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                deleteColumn={deleteColumn}
                updateColumn={updateColumn}
                // createTask={createTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
                tasks={tasks.filter((task) => task.columnId === activeColumn.id).filter((task) => task.done === false)}
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                deleteTask={deleteTask}
                updateTask={updateTask}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );


  function deleteTask(id) {
    const newTasks = tasks.filter((task) => task.id !== id);
    setTasks(newTasks);
  }

  function updateTask(id, content) {
    const newTasks = tasks.map((task) => {
      if (task.id !== id) return task;
      return { ...task, content };
    });

    setTasks(newTasks);
  }

  async function createNewColumn() {
  try {
    const columnToAdd = {
      id: generateId(),
      title: `Column ${columns.length + 1}`,
    };

    const res = await axios.post("http://localhost:8080/api/list", {
      name: `List ${columns.length + 1}`,
      userId: currentUser.id,
    });

    // Update the columns state with the new column
    setColumns([...columns, columnToAdd]);

    // Create a new task with the corresponding listId
    const newTask = {
      id: generateId(),
      listId: columnToAdd.id, // Set the listId of the task
      content: `Task ${tasks.length + 1}`,
    };

    setTasks([...tasks, newTask]);
  } catch (error) {
    console.error("Error creating a new column:", error);
  }
}

 async function deleteColumn(id) {
  //  try {
  //   const filteredColumns = columns.filter((col) => col.id !== id);
  //   setColumns(filteredColumns);
  //   // Send a POST request to your API endpoint
  //   const res = await axios.post("http://localhost:8080/api/list", {
  //     // Include the data you want to send in the request body
  //     name: `List ${columns.length + 1}`, // Example data
  //     userId: currentUser.id, // Example data
  //   });
  //   console.log("result : " , res)
  //   // Update the columns state with the new column
  //   setColumns([...columns, fil]);
  // } catch (error) {
  //   // Handle any errors that occur during the POST request
  //   console.error("Error creating a new column:", error);
  // }
  //   const newTasks = tasks.filter((t) => t.columnId !== id);
  //   setTasks(newTasks);
  }

  function updateColumn(id, title) {
    const newColumns = columns.map((col) => {
      if (col.id !== id) return col;
      return { ...col, title };
    });

    setColumns(newColumns);
  }

  function onDragStart(event) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  async function onDragEnd(event) {
    try {
      setActiveColumn(null);
      setActiveTask(null);

      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      if (activeId === overId) return;

      const isActiveATask = active.data.current?.type === "Task";
      if (!isActiveATask) return;

      const activeTask = active.data.current?.task;
      const overColumn = columns.find((col) => col.id === overId);

      if (overColumn) {
        // Update the task's listId when moving to a different column
        const newTasks = tasks.map((task) => {
          if (task.id === activeTask.id) {
            return { ...task, listId: overColumn.id };
          }
          return task;
        });

        const res = await axios.post(`http://localhost:8080/api/task/${activeTask.id}/moved`, {
      // Include the data you want to send in the request body
        name: activeTask.name,  // Example data
        listId: overId,
        done : activeTask.done,
      });
        console.log("result move : " , res)

        setTasks(newTasks);
      }
    }
    catch (err) {
      console.log("error : " , err)
    }
}

  function onDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // Im dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId != tasks[overIndex].columnId) {
          // Fix introduced after video recording
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    // Im dropping a Task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);

        tasks[activeIndex].columnId = overId;
        console.log("DROPPING TASK OVER COLUMN", { activeIndex });
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  }
}

function generateId() {
  /* Generate a random number between 0 and 10000 */
  return Math.floor(Math.random() * 10001);
}

export default KanbanBoard;