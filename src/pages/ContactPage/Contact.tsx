import { useNavigate } from "react-router-dom";

import "./Contact.css";

const Contact: React.FC = () => {
  const navigate = useNavigate();

  const switchToDetailPage = () => {
    navigate(`/`);
  };

  return (
    <div id="contact-container">
      <div className="student-data">
        <h1>Jonas Wunsch</h1>
        <h1>317862</h1>
        <h1>Jonas.Wunsch@htwg-konstanz.de</h1>
      </div>

      <div className="student-data">
        <h1>Jakob Schwarz</h1>
        <h1>317150</h1>
        <h1>Jakob.Schwarz@htwg-konstanz.de</h1>
      </div>

      <div className="student-data">
        <h1>Benedict Benethien</h1>
        <h1>316141</h1>
        <h1>Benedict.Benethien@htwg-konstanz.de</h1>
      </div>

      <button onClick={switchToDetailPage}>Zurück zur Startseite</button>
    </div>
  );
};

export default Contact;
