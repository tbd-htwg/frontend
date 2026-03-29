import { useNavigate } from "react-router-dom";
import type { Trip } from "../../../features/trips/tripsSlice";

import "./TripListItem.css";

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
      <h2>{trip.title}</h2>
      <p>{trip.shortDescription}</p>
      <button onClick={switchToDetailPage}>Details</button>
    </div>
  );
}

export default TripListItem;
