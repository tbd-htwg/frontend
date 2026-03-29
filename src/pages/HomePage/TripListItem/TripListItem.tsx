import { useNavigate } from "react-router-dom";

import "./TripListItem.css";
import type { Trip } from "../../../models/Trip";

interface TripListItemProps {
  trip: Trip;
}

function TripListItem({ trip }: TripListItemProps) {
  const navigate = useNavigate();

  const switchToDetailPage = () => {
    navigate(`/trip/${trip.id}`);
  };

  return (
    <div id="item-container">
      <h2>Reiseziel: {trip.title}</h2>
      <p>Reisedatum: {trip.startDate}</p>
      <button onClick={switchToDetailPage}>Details</button>
    </div>
  );
}

export default TripListItem;
