import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import "./TripDetailPage.css";

const TripDetailPage: React.FC = () => {
  const navigate = useNavigate();

  const { id } = useParams();

  const tripList = useSelector((state) => state.trips);
  const trip = tripList.find((t) => t.id === Number(id));

  const backToTripList = () => {
    navigate("/");
  };

  return (
    <>
      <div id="trip-detail-container">
        <h1>{trip.title}</h1>
        <p>{trip.shortDescription}</p>
        <p>{trip.longDescription}</p>
        <p>{trip.destination}</p>

        <div>
          <button onClick={backToTripList}>Zurück zur Trip-Liste</button>
        </div>
      </div>
    </>
  );
};

export default TripDetailPage;
