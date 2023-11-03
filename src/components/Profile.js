import React, { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import KanbanBoard from "./KanbanBoard";
import axios from "axios";
import { API_URL } from "../services/user.service";
import authHeader from "../services/auth-header";

const Profile = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container">
      <KanbanBoard />
    </div>
  );
};

export default Profile;
