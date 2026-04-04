import { useNavigate } from "react-router-dom";
import "./AddNewTrip.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import type { Trip } from "../../models/Trip";
import type { RootState } from "../../store";

function AddNewTrip() {
  const navigate = useNavigate();

  const currentUser = useSelector((state: RootState) => state.user);

  const [newTrip, setNewTrip] = useState<Trip>({} as Trip);

  const saveTripToDb = () => {
    fetch("/v1/trips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...newTrip, userId: currentUser.id }),
    }).then((response) => {
      console.log("New Trip:", response);
      console.log({ ...newTrip, userId: currentUser.id });
    });
  };

  return (
    <div id="add-trip-container">
      <div>
        <div>
          <label>Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newTrip?.title || ""}
            onChange={(e) => setNewTrip({ ...newTrip, title: e.target.value })}
          />
        </div>

        <div>
          <label>Destination:</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={newTrip?.destination || ""}
            onChange={(e) =>
              setNewTrip({ ...newTrip, destination: e.target.value })
            }
          />
        </div>

        <div>
          <label>Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={newTrip?.startDate || ""}
            onChange={(e) =>
              setNewTrip({ ...newTrip, startDate: e.target.value })
            }
          />
        </div>

        <div>
          <label>Short Description:</label>
          <input
            type="text"
            id="shortDescription"
            name="shortDescription"
            value={newTrip?.shortDescription || ""}
            onChange={(e) =>
              setNewTrip({ ...newTrip, shortDescription: e.target.value })
            }
          />
        </div>

        <div>
          <label>Long Description:</label>
          <textarea
            id="longDescription"
            name="longDescription"
            value={newTrip?.longDescription || ""}
            onChange={(e) =>
              setNewTrip({ ...newTrip, longDescription: e.target.value })
            }
          ></textarea>
        </div>
      </div>

      <div>
        <button onClick={() => navigate(`/`)}>Go Back</button>
        <button onClick={saveTripToDb}>Save</button>
      </div>
    </div>
  );
}

export default AddNewTrip;
