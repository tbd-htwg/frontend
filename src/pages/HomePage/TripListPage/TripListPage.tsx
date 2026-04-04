import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./TripListPage.css";
import TripListItem from "../TripListItem/TripListItem";
import { useNavigate } from "react-router-dom";
import { setTrips } from "../../../features/trips/tripsSlice";
import type { AppDispatch, RootState } from "../../../store";

const TripListPage: React.FC = () => {
  const tripList = useSelector((state: RootState) => state.trips);
  const dispatch = useDispatch<AppDispatch>();

  const currentUser = useSelector((state: RootState) => state.user);

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    fetch("/v1/users/" + currentUser.id)
      .then((response) => response.json())
      .then((data) => {
        dispatch(setTrips(data.trips));
      });
  }, [dispatch, currentUser]);

  return (
    <div id="trip-list-page-container">
      <h1>Meine Reisen - Anzahl: {tripList.length}</h1>

      {tripList.length > 0 ? (
        tripList.map((trip) => (
          <div key={trip.id} className="trip-item">
            <TripListItem trip={trip} />
          </div>
        ))
      ) : (
        <p>Nicht eingeloggt / Keine Reisen gefunden</p>
      )}

      <button onClick={() => navigate("/newTrip")}>Add New Trip</button>
    </div>
  );
};

export default TripListPage;
