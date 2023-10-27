import React, { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import KanbanBoard from "./KanbanBoard";
import axios from "axios";
import { API_URL } from "../services/user.service";
import authHeader from "../services/auth-header";

const Profile = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [data, setData] = useState();

  useEffect(() => {
    getUserById(currentUser.id);
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }



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

  return (
    <div className="container">
      <KanbanBoard data={data}/>
    </div>
  );
};

export default Profile;
