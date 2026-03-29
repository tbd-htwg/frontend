import { useNavigate, useParams } from "react-router-dom";

import "./TripDetailPage.css";
import { useState } from "react";
import type { Trip } from "../../models/Trip";

const TripDetailPage: React.FC = () => {
  const navigate = useNavigate();

  const [trip, setTrip] = useState({} as Trip);

  const { id } = useParams();

  fetch(`http://localhost:8080/v1/trips/${id}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Trip Detail:", data);
      setTrip(data);
    });

  const backToTripList = () => {
    navigate("/");
  };

  return (
    <>
      <div id="trip-detail-container">
        <h1>Title: {trip.title}</h1>
        <p>Reisedatum: {trip.startDate}</p>
        <p>Reisebeschreibung: {trip.shortDescription}</p>
        <p>Detailbeschreibung: {trip.longDescription}</p>
        <p>Reiseziel: {trip.destination}</p>

        <div>
          <button onClick={backToTripList}>Zurück zur Trip-Liste</button>
        </div>
      </div>
    </>
  );
};

export default TripDetailPage;
